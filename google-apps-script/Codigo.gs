/**
 * Invitación de Sofía & Diego — confirmaciones y canciones en Google Sheets.
 * Instalación: ver LEEME.md en esta misma carpeta.
 */

const HOJAS = { confirmaciones: 'Confirmaciones', ingreso: 'Lista de ingreso', canciones: 'Canciones' };
const CABECERAS = {
  confirmaciones: ['Fecha', 'Grupo', 'Confirmado por', 'Nombre y apellido', 'DNI / CE', 'Asiste', 'Tipo', 'Restricción alimentaria', 'Mensaje'],
  canciones: ['Fecha', 'Nombre', 'Canción 1', 'Canción 2']
};
const MAX_PERSONAS = 8;

/* ---------- Menú ---------- */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Invitación').addItem('Preparar la hoja', 'prepararHoja').addToUi();
}

function prepararHoja() {
  const ss = SpreadsheetApp.getActive();
  hoja_(ss, HOJAS.confirmaciones, CABECERAS.confirmaciones);
  hoja_(ss, HOJAS.canciones, CABECERAS.canciones);
  const ingreso = ss.getSheetByName(HOJAS.ingreso) || ss.insertSheet(HOJAS.ingreso);
  ingreso.clear();
  ingreso.getRange('A1:D1').setValues([['Nombre y apellido', 'DNI / CE', 'Tipo', 'Confirmado por']]).setFontWeight('bold');
  ingreso.getRange('A2').setFormula(
    '=IFERROR(SORT(FILTER({Confirmaciones!D2:D, Confirmaciones!E2:E, Confirmaciones!G2:G, Confirmaciones!C2:C}, Confirmaciones!F2:F="Sí"), 3, FALSE, 1, TRUE), "")'
  );
  ingreso.setFrozenRows(1);
  const sobra = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
  if (sobra && ss.getSheets().length > 1 && sobra.getLastRow() === 0) ss.deleteSheet(sobra);
  SpreadsheetApp.getUi().alert('Listo. Ahora publica el script como aplicación web (ver LEEME.md).');
}

/* ---------- API web ---------- */
function doGet() {
  return json_({ ok: true });
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
  const personas = (Array.isArray(data.personas) ? data.personas : [])
    .map((p, i) => ({ nombre: texto_(p.nombre, 80), dni: dni_(p.dni), asiste: p.asiste === true, tipo: i === 0 ? 'Invitado' : 'Acompañante' }))
    .filter(p => p.nombre);
  if (!personas.length || personas.length > MAX_PERSONAS) return { ok: false, error: 'personas' };
  if (personas.some(p => !p.dni)) return { ok: false, error: 'dni' };

  const sh = SpreadsheetApp.getActive().getSheetByName(HOJAS.confirmaciones);
  // Si alguien vuelve a confirmar, su respuesta nueva reemplaza a la anterior (mismo DNI o mismo nombre).
  const dnis = new Set(personas.map(p => p.dni).filter(Boolean));
  const nombres = new Set(personas.map(p => nombre_(p.nombre)));
  const last = sh.getLastRow();
  if (last > 1) {
    const rows = sh.getRange(2, 4, last - 1, 2).getValues();
    for (let i = rows.length - 1; i >= 0; i--) {
      const d = dni_(rows[i][1]);
      if ((d && dnis.has(d)) || nombres.has(nombre_(rows[i][0]))) sh.deleteRow(i + 2);
    }
  }
  const now = new Date();
  const grupo = Utilities.formatDate(now, 'America/Lima', 'yyMMdd-HHmmss');
  const quien = personas[0].nombre;
  const filas = personas.map((p, i) => [
    now, grupo, quien, p.nombre, p.dni, p.asiste ? 'Sí' : 'No', p.tipo,
    i === 0 ? texto_(data.restriccion, 300) : '',
    i === 0 ? texto_(data.mensaje, 600) : ''
  ]);
  sh.getRange(sh.getLastRow() + 1, 1, filas.length, filas[0].length).setValues(filas);
  sh.getRange(2, 5, sh.getLastRow(), 1).setNumberFormat('@'); // conserva ceros iniciales del DNI
  return { ok: true };
}

function cancion_(data) {
  const nombre = texto_(data.nombre, 80);
  const c1 = texto_(data.cancion1, 150);
  if (!nombre || !c1) return { ok: false, error: 'datos' };
  SpreadsheetApp.getActive().getSheetByName(HOJAS.canciones)
    .appendRow([new Date(), nombre, c1, texto_(data.cancion2, 150)]);
  return { ok: true };
}

/* ---------- Utilidades ---------- */
function nombre_(v) {
  return String(v).replace(/^'/, '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
}

function dni_(v) {
  const s = String(v == null ? '' : v).replace(/[\s.\-']/g, '').toUpperCase();
  return /^(\d{8}|[A-Z0-9]{9,12})$/.test(s) ? s : '';
}

function texto_(v, max) {
  let s = String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // evita que un texto se interprete como fórmula
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
