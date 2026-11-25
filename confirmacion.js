/* Confirmación por invitación (pases) y canciones, guardadas en Google Sheets.
   Cada invitación tiene su link: https://.../?i=CODIGO */
(() => {
  const form = document.getElementById('rsvpForm');
  const passesBox = document.getElementById('passes');
  const forLine = document.getElementById('rsvpFor');
  const status = document.getElementById('rsvpStatus');
  const noCode = document.getElementById('rsvpNoCode');
  const submit = document.getElementById('rsvpSubmit');
  const songForm = document.getElementById('songForm');
  const songStatus = document.getElementById('songStatus');
  if (!form) return;

  const url = (CONFIG.hojaUrl || '').trim();
  const demo = !url;
  const code = (new URLSearchParams(location.search).get('i') || '').trim().toUpperCase();
  let invitation = null;

  const DEMO = { codigo: 'DEMO', nombre: 'Néstor y Paola', invitados: ['Néstor Ruiz', 'Paola Díaz'], pases: 3 };

  async function api(params, body) {
    const target = new URL(url);
    if (params) Object.entries(params).forEach(([k, v]) => target.searchParams.set(k, v));
    const res = await fetch(target, body
      ? { method: 'POST', body: JSON.stringify(body) } // text/plain: sin preflight
      : { method: 'GET' });
    if (!res.ok) throw new Error('http ' + res.status);
    const data = await res.json();
    if (!data.ok) throw Object.assign(new Error(data.error || 'error'), { data });
    return data;
  }

  /* ---- Construir los pases ---- */
  let uid = 0;
  function passCard(index, name) {
    const extra = !name;
    const id = `p${++uid}`;
    const field = document.createElement('fieldset');
    field.className = 'pass' + (extra ? ' pass-extra' : '');
    field.innerHTML = `
      <legend>${extra ? 'Pase adicional' : 'Invitado ' + (index + 1)}</legend>
      <div class="pass-choices" role="radiogroup">
        <label class="rsvp-choice"><input type="radio" name="${id}-asiste" value="si"> ${extra ? 'Usaré este pase' : 'Asistirá'}</label>
        <label class="rsvp-choice"><input type="radio" name="${id}-asiste" value="no"> ${extra ? 'No lo usaré' : 'No podrá ir'}</label>
      </div>
      <div class="pass-fields" hidden>
        <div class="field"><label for="${id}-nombre">Nombre y apellido</label><input id="${id}-nombre" autocomplete="off"></div>
        <div class="field"><label for="${id}-dni">DNI o carné de extranjería</label><input id="${id}-dni" inputmode="numeric" autocomplete="off" maxlength="12"></div>
      </div>
      <p class="pass-error" hidden></p>`;
    const nameInput = field.querySelector(`#${id}-nombre`);
    nameInput.value = name || '';
    field.dataset.extra = extra ? '1' : '';
    field.dataset.invited = name || '';
    field.addEventListener('change', () => {
      const v = field.querySelector('input[type=radio]:checked')?.value;
      field.querySelector('.pass-fields').hidden = v !== 'si';
      field.querySelector('.pass-error').hidden = true;
    });
    return field;
  }

  function render(inv) {
    invitation = inv;
    const names = inv.invitados || [];
    const total = Math.max(Number(inv.pases) || 0, names.length, 1);
    forLine.innerHTML = '';
    const strong = document.createElement('strong');
    strong.textContent = inv.nombre || names.join(' y ');
    forLine.append('Invitación para ', strong, `. ${total === 1 ? 'Es válida para 1 persona.' : `Es válida para ${total} personas.`}`);
    passesBox.replaceChildren(...Array.from({ length: total }, (_, i) => passCard(i, names[i])));
    if (demo) {
      const note = document.createElement('p');
      note.className = 'rsvp-demo';
      note.textContent = 'Vista de demostración: los novios aún no conectan la hoja de respuestas, así que nada se guarda.';
      form.prepend(note);
    }
    const sName = document.getElementById('sName');
    if (sName && names[0] && !sName.value) sName.value = names[0];
  }

  /* ---- Validar y enviar ---- */
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!invitation) return;
    status.textContent = '';
    const people = [];
    let firstBad = null;
    for (const card of passesBox.querySelectorAll('.pass')) {
      const err = card.querySelector('.pass-error');
      const choice = card.querySelector('input[type=radio]:checked')?.value;
      const nombre = card.querySelector('input[id$=-nombre]').value.trim();
      const dni = card.querySelector('input[id$=-dni]').value.replace(/\s+/g, '').toUpperCase();
      let msg = '';
      if (!choice) msg = 'Indica si asistirá.';
      else if (choice === 'si' && nombre.split(/\s+/).length < 2) msg = 'Escribe nombre y apellido.';
      else if (choice === 'si' && !/^(\d{8}|[A-Z0-9]{9,12})$/.test(dni)) msg = 'Escribe un DNI de 8 dígitos o un carné de extranjería válido.';
      err.textContent = msg; err.hidden = !msg;
      if (msg && !firstBad) firstBad = card;
      people.push({
        invitado: card.dataset.invited || 'Pase adicional',
        nombre: choice === 'si' ? nombre : (card.dataset.invited || ''),
        dni: choice === 'si' ? dni : '',
        asiste: choice === 'si'
      });
    }
    if (firstBad) {
      firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
      status.textContent = 'Revisa los datos marcados.';
      return;
    }
    const payload = {
      accion: 'confirmar',
      codigo: invitation.codigo,
      personas: people.filter(p => !(p.invitado === 'Pase adicional' && !p.asiste)),
      restriccion: document.getElementById('fDiet').value.trim(),
      mensaje: document.getElementById('fMsg').value.trim()
    };
    const going = people.filter(p => p.asiste).length;
    const done = going
      ? `¡Gracias! Registramos ${going} ${going === 1 ? 'asistente' : 'asistentes'}. Si algo cambia, puedes volver a enviar este formulario.`
      : 'Gracias por avisarnos. ¡Te vamos a extrañar!';
    if (demo) { status.textContent = `${done} (Demostración: no se guardó.)`; return; }
    submit.disabled = true;
    status.textContent = 'Enviando…';
    try {
      await api(null, payload);
      status.textContent = done;
    } catch {
      status.textContent = 'No pudimos enviar tu respuesta. Revisa tu conexión e inténtalo de nuevo.';
    } finally {
      submit.disabled = false;
    }
  });

  /* ---- Cargar la invitación ---- */
  (async () => {
    if (demo) { render(DEMO); return; }
    if (!code) { form.hidden = true; noCode.hidden = false; return; }
    status.textContent = 'Cargando tu invitación…';
    submit.disabled = true;
    try {
      const data = await api({ accion: 'invitacion', codigo: code });
      render(data.invitacion);
      status.textContent = data.invitacion.respondida ? 'Ya recibimos tu confirmación. Si algo cambió, puedes enviarla de nuevo.' : '';
      submit.disabled = false;
    } catch (e) {
      form.hidden = true;
      noCode.hidden = false;
      noCode.querySelector('p').textContent = e.message === 'no_encontrada'
        ? 'No encontramos esta invitación. Revisa que el link esté completo o escríbele a los novios.'
        : 'No pudimos cargar tu invitación. Revisa tu conexión y vuelve a abrir el link.';
    }
  })();

  /* ---- Canciones ---- */
  songForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const name = songForm.elements.name.value.trim();
    const song1 = songForm.elements.song1.value.trim();
    const song2 = songForm.elements.song2.value.trim();
    if (!name || !song1) { songStatus.textContent = 'Escribe tu nombre y al menos una canción.'; return; }
    if (demo) { songStatus.textContent = '¡Gracias por la recomendación! (Demostración: no se guardó.)'; return; }
    const button = songForm.querySelector('button');
    button.disabled = true;
    songStatus.textContent = 'Enviando…';
    try {
      await api(null, { accion: 'cancion', codigo: code, nombre: name, cancion1: song1, cancion2: song2 });
      songStatus.textContent = '¡Gracias! Ya la tenemos en la lista.';
      songForm.elements.song1.value = ''; songForm.elements.song2.value = '';
    } catch {
      songStatus.textContent = 'No pudimos enviarla. Inténtalo de nuevo.';
    } finally {
      button.disabled = false;
    }
  });
})();
