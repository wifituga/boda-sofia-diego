/* Confirmación de asistencia y canciones, guardadas en Google Sheets.
   Una sola invitación para todos: quien confirma agrega una casilla por cada persona que viene con él
   (pareja, acompañante, hijos). Cada casilla lleva nombre, DNI y si asiste. */
(() => {
  const form = document.getElementById('rsvpForm');
  const list = document.getElementById('people');
  const addBtn = document.getElementById('addPerson');
  const status = document.getElementById('rsvpStatus');
  const submit = document.getElementById('rsvpSubmit');
  const songForm = document.getElementById('songForm');
  const songStatus = document.getElementById('songStatus');
  if (!form) return;

  const MAX = 8;
  const extrasTitle = document.createElement('p');
  extrasTitle.className = 'extras-title';
  extrasTitle.textContent = 'Quienes vienen contigo';
  extrasTitle.hidden = true;
  const url = (CONFIG.hojaUrl || '').trim();
  const demo = !url;

  async function post(body) {
    // text/plain evita la verificación previa (CORS) de Apps Script.
    const res = await fetch(url, { method: 'POST', body: JSON.stringify(body) });
    if (!res.ok) throw new Error('http ' + res.status);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'error');
    return data;
  }

  /* ---- Casillas por persona ---- */
  let uid = 0;
  function personCard() {
    const id = `p${++uid}`;
    const card = document.createElement('fieldset');
    card.className = 'pass';
    card.innerHTML = `
      <legend class="pass-name"></legend>
      <button type="button" class="pass-remove" aria-label="Quitar esta persona">Quitar</button>
      <div class="field"><label for="${id}-n">Nombre y apellido</label><input id="${id}-n" class="pass-full" autocomplete="off" autocapitalize="words"></div>
      <div class="field"><label for="${id}-d">DNI o carné de extranjería</label><input id="${id}-d" class="pass-dni" inputmode="numeric" autocomplete="off" maxlength="12" placeholder="8 dígitos"></div>
      <div class="pass-choices">
        <label class="pass-choice"><input type="radio" name="${id}" value="si"><span>Asistirá</span></label>
        <label class="pass-choice"><input type="radio" name="${id}" value="no"><span>No podrá ir</span></label>
      </div>
      <p class="pass-error" hidden></p>`;
    const clearError = () => {
      card.querySelector('.pass-error').hidden = true;
      card.classList.remove('has-error');
      if (!list.querySelector('.has-error')) status.textContent = '';
    };
    card.addEventListener('change', event => {
      if (event.target.type !== 'radio') return;
      const yes = event.target.value === 'si';
      card.classList.toggle('is-yes', yes);
      card.classList.toggle('is-no', !yes);
      clearError();
    });
    // Los errores se borran mientras se escribe (no al salir del campo) para que la página no se mueva al tocar otra opción.
    card.addEventListener('input', event => { if (event.target.type !== 'radio') clearError(); });
    card.querySelector('.pass-remove').addEventListener('click', () => {
      card.classList.add('is-leaving');
      setTimeout(() => { card.remove(); renumber(); }, 260);
    });
    return card;
  }

  function renumber() {
    const cards = [...list.querySelectorAll(':scope > .pass')];
    cards.forEach((c, i) => {
      c.querySelector('.pass-name').textContent = i === 0 ? 'Tus datos' : `Acompañante ${i}`;
      c.classList.toggle('pass-extra', i > 0);
      c.querySelector('.pass-remove').hidden = i === 0;
    });
    addBtn.hidden = cards.length >= MAX;
    extrasTitle.hidden = cards.length < 2;
    if (cards[1]) cards[0].after(extrasTitle);
  }

  function addPerson(focus) {
    const card = personCard();
    list.append(card);
    renumber();
    if (focus) {
      card.classList.add('is-new');
      card.querySelector('.pass-full').focus({ preventScroll: true });
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  addBtn.addEventListener('click', () => addPerson(true));
  addPerson(false);

  if (demo) {
    const note = document.createElement('p');
    note.className = 'rsvp-demo';
    note.textContent = 'Ejemplo de prueba · aún no se guardan respuestas';
    form.append(note);
  }

  /* ---- Agradecimiento ---- */
  function showThanks(people) {
    const going = people.filter(p => p.asiste);
    const box = document.createElement('div');
    box.className = 'rsvp-done';
    const h = document.createElement('p');
    h.className = 'rsvp-done-title';
    h.textContent = going.length ? '¡Gracias por confirmar!' : 'Gracias por avisarnos';
    const p = document.createElement('p');
    p.textContent = going.length
      ? (going.length === 1 ? 'Te esperamos el viernes 11 de junio.' : 'Los esperamos el viernes 11 de junio:')
      : 'Te vamos a extrañar. Gracias por acompañarnos con tu cariño.';
    box.append(h, p);
    if (going.length > 1) {
      const ul = document.createElement('ul');
      going.forEach(g => { const li = document.createElement('li'); li.textContent = g.nombre; ul.append(li); });
      box.append(ul);
    }
    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'rsvp-again';
    again.textContent = 'Corregir mi respuesta';
    again.addEventListener('click', () => { box.remove(); form.hidden = false; form.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    box.append(again);
    if (demo) { const d = document.createElement('p'); d.className = 'rsvp-demo'; d.textContent = 'Ejemplo de prueba · esta respuesta no se guardó'; box.append(d); }
    form.hidden = true;
    form.after(box);
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const sName = document.getElementById('sName');
    if (sName && people[0] && !sName.value) sName.value = people[0].nombre;
  }

  /* ---- Validar y enviar ---- */
  form.addEventListener('submit', async event => {
    event.preventDefault();
    status.textContent = '';
    const people = [];
    let firstBad = null;
    for (const [k, card] of [...list.querySelectorAll('.pass')].entries()) {
      const err = card.querySelector('.pass-error');
      const choice = card.querySelector('input[type=radio]:checked')?.value;
      const nombre = card.querySelector('.pass-full').value.trim().replace(/\s+/g, ' ');
      const dni = card.querySelector('.pass-dni').value.replace(/[\s.-]+/g, '').toUpperCase();
      let msg = '';
      if (nombre.split(' ').length < 2) msg = 'Escribe nombre y apellido.';
      else if (!/^(\d{8}|[A-Z0-9]{9,12})$/.test(dni)) msg = 'El DNI tiene 8 dígitos. Si es carné de extranjería, escríbelo completo.';
      else if (!choice) msg = 'Indica si asistirá.';
      err.textContent = msg;
      err.hidden = !msg;
      card.classList.toggle('has-error', Boolean(msg));
      if (msg && !firstBad) firstBad = card;
      people.push({ nombre, dni, asiste: choice === 'si', tipo: k === 0 ? 'Invitado' : 'Acompañante' });
    }
    if (firstBad) {
      firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
      status.textContent = 'Falta completar algunos datos.';
      return;
    }
    if (demo) { showThanks(people); return; }
    submit.disabled = true;
    submit.textContent = 'Enviando…';
    try {
      await post({
        accion: 'confirmar',
        personas: people,
        restriccion: document.getElementById('fDiet').value.trim(),
        mensaje: document.getElementById('fMsg').value.trim()
      });
      showThanks(people);
    } catch {
      status.textContent = 'No pudimos enviar tu respuesta. Revisa tu conexión e inténtalo de nuevo.';
    } finally {
      submit.disabled = false;
      submit.textContent = 'Enviar confirmación';
    }
  });

  /* ---- Canciones ---- */
  songForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const name = songForm.elements.name.value.trim();
    const song1 = songForm.elements.song1.value.trim();
    const song2 = songForm.elements.song2.value.trim();
    if (!name || !song1) { songStatus.textContent = 'Escribe tu nombre y al menos una canción.'; return; }
    if (demo) { songStatus.textContent = '¡Gracias por la recomendación! (Ejemplo de prueba: no se guardó.)'; return; }
    const button = songForm.querySelector('button');
    button.disabled = true;
    songStatus.textContent = 'Enviando…';
    try {
      await post({ accion: 'cancion', nombre: name, cancion1: song1, cancion2: song2 });
      songStatus.textContent = '¡Gracias! Ya la tenemos en la lista.';
      songForm.elements.song1.value = '';
      songForm.elements.song2.value = '';
    } catch {
      songStatus.textContent = 'No pudimos enviarla. Inténtalo de nuevo.';
    } finally {
      button.disabled = false;
    }
  });
})();
