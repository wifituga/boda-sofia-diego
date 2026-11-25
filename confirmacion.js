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
    const card = document.createElement('fieldset');
    card.className = 'pass' + (extra ? ' pass-extra' : '');
    card.dataset.invited = name || '';
    const first = (name || '').split(/\s+/)[0];
    card.innerHTML = `
      <legend class="pass-name"></legend>
      <p class="pass-sub">${extra ? 'Puedes venir con alguien más' : ''}</p>
      <div class="pass-choices">
        <label class="pass-choice"><input type="radio" name="${id}" value="si"><span>${extra ? 'Iré con acompañante' : 'Asistirá'}</span></label>
        <label class="pass-choice"><input type="radio" name="${id}" value="no"><span>${extra ? 'Iré sin acompañante' : 'No podrá ir'}</span></label>
      </div>
      <div class="pass-fields" hidden>
        <div class="field"><label for="${id}-n">${extra ? 'Nombre y apellido del acompañante' : 'Nombre y apellido completos'}</label><input id="${id}-n" class="pass-full" autocomplete="off" autocapitalize="words"></div>
        <div class="field"><label for="${id}-d">DNI o carné de extranjería</label><input id="${id}-d" class="pass-dni" inputmode="numeric" autocomplete="off" maxlength="12" placeholder="8 dígitos"></div>
        <p class="pass-why">Lo necesitamos para la lista de ingreso.</p>
      </div>
      <p class="pass-error" hidden></p>`;
    card.querySelector('.pass-name').textContent = extra ? 'Acompañante' : name;
    if (!extra) card.querySelector('.pass-sub').remove();
    card.querySelector('.pass-full').value = name || '';
    const clearError = () => {
      card.querySelector('.pass-error').hidden = true;
      card.classList.remove('has-error');
      if (!passesBox.querySelector('.has-error')) status.textContent = '';
    };
    card.addEventListener('change', event => {
      if (event.target.type !== 'radio') return;
      const v = event.target.value;
      card.querySelector('.pass-fields').hidden = v !== 'si';
      card.classList.toggle('is-yes', v === 'si');
      card.classList.toggle('is-no', v === 'no');
      clearError();
    });
    // Los errores se borran mientras se escribe, no al salir del campo, para que la página no se mueva al tocar otra opción.
    card.addEventListener('input', event => { if (event.target.type !== 'radio') clearError(); });
    return card;
  }

  function render(inv) {
    invitation = inv;
    const names = inv.invitados || [];
    const total = Math.max(Number(inv.pases) || 0, names.length, 1);
    const title = inv.nombre || names.join(' y ');
    forLine.innerHTML = '';
    const strong = document.createElement('strong');
    strong.textContent = title;
    const small = document.createElement('span');
    small.textContent = total === 1 ? 'Reservamos 1 lugar para ti.' : `Reservamos ${total} lugares para ustedes.`;
    forLine.append(strong, small);
    passesBox.replaceChildren(...Array.from({ length: total }, (_, i) => passCard(i, names[i])));
    if (demo) {
      const note = document.createElement('p');
      note.className = 'rsvp-demo';
      note.textContent = 'Ejemplo de prueba · aún no se guardan respuestas';
      form.append(note);
    }
    const sName = document.getElementById('sName');
    if (sName && names[0] && !sName.value) sName.value = names[0];
  }

  function showThanks(people) {
    const going = people.filter(p => p.asiste);
    const box = document.createElement('div');
    box.className = 'rsvp-done';
    const h = document.createElement('p'); h.className = 'rsvp-done-title';
    h.textContent = going.length ? '¡Gracias por confirmar!' : 'Gracias por avisarnos';
    const p = document.createElement('p');
    p.textContent = going.length
      ? (going.length === 1 ? 'Te esperamos el viernes 11 de junio:' : 'Los esperamos el viernes 11 de junio:')
      : 'Te vamos a extrañar. Gracias por acompañarnos con tu cariño.';
    box.append(h, p);
    if (going.length) {
      const ul = document.createElement('ul');
      going.forEach(g => { const li = document.createElement('li'); li.textContent = g.nombre; ul.append(li); });
      box.append(ul);
    }
    const again = document.createElement('button');
    again.type = 'button'; again.className = 'text-link rsvp-again'; again.textContent = 'Cambiar mi respuesta';
    again.addEventListener('click', () => { box.remove(); form.hidden = false; form.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    box.append(again);
    if (demo) { const d = document.createElement('p'); d.className = 'rsvp-demo'; d.textContent = 'Ejemplo de prueba · esta respuesta no se guardó'; box.append(d); }
    form.hidden = true;
    form.after(box);
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      const nombre = card.querySelector('.pass-full').value.trim().replace(/\s+/g, ' ');
      const dni = card.querySelector('.pass-dni').value.replace(/[\s.-]+/g, '').toUpperCase();
      const extra = !card.dataset.invited;
      let msg = '';
      if (!choice) msg = extra ? 'Cuéntanos si vendrás con acompañante.' : 'Indica si asistirá.';
      else if (choice === 'si' && nombre.split(' ').length < 2) msg = 'Escribe nombre y apellido.';
      else if (choice === 'si' && !/^(\d{8}|[A-Z0-9]{9,12})$/.test(dni)) msg = 'El DNI tiene 8 dígitos. Si es carné de extranjería, escríbelo completo.';
      err.textContent = msg; err.hidden = !msg;
      card.classList.toggle('has-error', Boolean(msg));
      if (msg && !firstBad) firstBad = card;
      people.push({
        invitado: card.dataset.invited || 'Acompañante',
        nombre: choice === 'si' ? nombre : (card.dataset.invited || ''),
        dni: choice === 'si' ? dni : '',
        asiste: choice === 'si',
        extra
      });
    }
    if (firstBad) {
      firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
      status.textContent = 'Falta completar algunos datos.';
      return;
    }
    const payload = {
      accion: 'confirmar',
      codigo: invitation.codigo,
      personas: people.filter(p => !(p.extra && !p.asiste)).map(({ extra, ...p }) => p),
      restriccion: document.getElementById('fDiet').value.trim(),
      mensaje: document.getElementById('fMsg').value.trim()
    };
    if (demo) { showThanks(people); return; }
    submit.disabled = true;
    submit.textContent = 'Enviando…';
    try {
      await api(null, payload);
      showThanks(people);
    } catch {
      status.textContent = 'No pudimos enviar tu respuesta. Revisa tu conexión e inténtalo de nuevo.';
    } finally {
      submit.disabled = false;
      submit.textContent = 'Enviar confirmación';
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
