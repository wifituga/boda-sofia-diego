/**
 * Invitación de Sofía & Diego — confirmaciones y canciones en Google Sheets.
 * Instalación: ver LEEME.md en esta misma carpeta.
 */

// Dirección pública de la invitación (GitHub Pages). Los links de cada invitado se arman con esta URL.
const SITE_URL = 'https://wifituga.github.io/boda-sofia-diego/';

const HOJAS = {
  invitados: 'Invitados',
  confirmaciones: 'Confirmaciones',
  ingreso: 'Lista de ingreso',
  canciones: 'Canciones'
};
const CABECERAS = {
  invitados: ['Código', 'Invitación', 'Invitados (separados por coma)', 'Pases', 'Link', 'Respondió'],
  confirmaciones: ['Fecha', 'Código', 'Invitación', 'Invitado', 'Nombre y apellido', 'DNI / CE', 'Asiste', 'Restricción alimentaria', 'Mensaje'],
  canciones: ['Fecha', 'Código', 'Nombre', 'Canción 1', 'Canción 2']
};

/* ---------- Menú ---------- */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Invitación')
    .addItem('1. Preparar la hoja', 'prepararHoja')
    .addItem('2. Generar códigos y links', 'generarLinks')
    .addToUi();
}

function prepararHoja() {
  const ss = SpreadsheetApp.getActive();
  const inv = hoja_(ss, HOJAS.invitados, CABECERAS.invitados);
  if (inv.getLastRow() === 1) {
    inv.getRange(2, 2, 3, 3).setValues([
      ['Néstor y Paola', 'Néstor Ruiz, Paola Díaz', 2],
      ['Familia López', 'Carlos López, Ana Torres, Lucía López, Sofía López', 4],
      ['Martín', 'Martín Gómez', 2]
    ]);
  }
  inv.setColumnWidths(1, 6, 170);
  hoja_(ss, HOJAS.confirmaciones, CABECERAS.confirmaciones);
  hoja_(ss, HOJAS.canciones, CABECERAS.canciones);
  const ingreso = ss.getSheetByName(HOJAS.ingreso) || ss.insertSheet(HOJAS.ingreso);
  ingreso.clear();
  ingreso.getRange('A1:C1').setValues([['Nombre y apellido', 'DNI / CE', 'Invitación']]).setFontWeight('bold');
  ingreso.getRange('A2').setFormula(
    '=IFERROR(SORT(FILTER({Confirmaciones!E2:E, Confirmaciones!F2:F, Confirmaciones!C2:C}, Confirmaciones!G2:G="Sí"), 1, TRUE), "")'
  );
  ingreso.setFrozenRows(1);
  SpreadsheetApp.getUi().alert('Listo. Escribe tus invitados en la pestaña «Invitados» (una fila por invitación) y luego usa «Generar códigos y links».');
}

function generarLinks() {
  const sh = SpreadsheetApp.getActive().getSheetByName(HOJAS.invitados);
  const last = sh.getLastRow();
  if (last < 2) return;
  const rows = sh.getRange(2, 1, last - 1, 5).getValues();
  const used = new Set(rows.map(r => String(r[0]).trim().toUpperCase()).filter(Boolean));
  rows.forEach(r => {
    if (!String(r[1]).trim()) return;
    let code = String(r[0]).trim().toUpperCase();
    if (!code) {
      do { code = codigo_(); } while (used.has(code));
      used.add(code);
    }
    r[0] = code;
    r[4] = SITE_URL + '?i=' + code;
  });
  sh.getRange(2, 1, rows.length, 5).setValues(rows);
}

/* ---------- API web ---------- */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.accion !== 'invitacion') return json_({ ok: false, error: 'accion' });
  const found = buscar_(p.codigo);
  if (!found) return json_({ ok: false, error: 'no_encontrada' });
  return json_({ ok: true, invitacion: publica_(found) });
}

function doPost(e) {
  let data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'json' }); }
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (data.accion === 'confirmar') return json_(confirmar_(data));
    if (data.accion === 'cancion') return json_(cancion_(data));
    return json_({ ok: false, error: 'accion' });
  } finally {
    lock.releaseLock();
  }
}

function confirmar_(data) {
  const inv = buscar_(data.codigo);
  if (!inv) return { ok: false, error: 'no_encontrada' };
  const personas = Array.isArray(data.personas) ? data.personas : [];
  if (!personas.length || personas.length > inv.pases) return { ok: false, error: 'pases' };

  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(HOJAS.confirmaciones);
  // La última respuesta reemplaza a la anterior de la misma invitación.
  const last = sh.getLastRow();
  if (last > 1) {
    const codes = sh.getRange(2, 2, last - 1, 1).getValues();
    for (let i = codes.length - 1; i >= 0; i--) {
      if (String(codes[i][0]).toUpperCase() === inv.codigo) sh.deleteRow(i + 2);
    }
  }
  const now = new Date();
  const rows = personas.map((p, i) => [
    now, inv.codigo, inv.nombre,
    texto_(p.invitado, 80),
    texto_(p.nombre, 80),
    texto_(p.dni, 12),
    p.asiste === true ? 'Sí' : 'No',
    i === 0 ? texto_(data.restriccion, 300) : '',
    i === 0 ? texto_(data.mensaje, 600) : ''
  ]);
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  ss.getSheetByName(HOJAS.invitados).getRange(inv.fila, 6).setValue(now);
  return { ok: true };
}

function cancion_(data) {
  const nombre = texto_(data.nombre, 80);
  const c1 = texto_(data.cancion1, 150);
  if (!nombre || !c1) return { ok: false, error: 'datos' };
  const code = buscar_(data.codigo) ? String(data.codigo).toUpperCase() : '';
  SpreadsheetApp.getActive().getSheetByName(HOJAS.canciones)
    .appendRow([new Date(), code, nombre, c1, texto_(data.cancion2, 150)]);
  return { ok: true };
}

/* ---------- Utilidades ---------- */
function buscar_(codigo) {
  const code = String(codigo || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(code)) return null;
  const sh = SpreadsheetApp.getActive().getSheetByName(HOJAS.invitados);
  const last = sh.getLastRow();
  if (last < 2) return null;
  const rows = sh.getRange(2, 1, last - 1, 6).getValues();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toUpperCase() !== code) continue;
    const invitados = String(rows[i][2]).split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
    return {
      fila: i + 2,
      codigo: code,
      nombre: String(rows[i][1]).trim(),
      invitados: invitados,
      pases: Math.max(Number(rows[i][3]) || 0, invitados.length, 1),
      respondida: Boolean(rows[i][5])
    };
  }
  return null;
}

function publica_(inv) {
  return { codigo: inv.codigo, nombre: inv.nombre, invitados: inv.invitados, pases: inv.pases, respondida: inv.respondida };
}

function texto_(v, max) {
  let s = String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // evita que un texto se interprete como fórmula
  return s;
}

function codigo_() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return s;
}

function hoja_(ss, nombre, cabecera) {
  const sh = ss.getSheetByName(nombre) || ss.insertSheet(nombre);
  sh.getRange(1, 1, 1, cabecera.length).setValues([cabecera]).setFontWeight('bold');
  sh.setFrozenRows(1);
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
