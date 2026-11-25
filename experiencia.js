/* Foto de portada, foto del lugar, rosa del itinerario y canción. */
(() => {
  /* ---- Fotos opcionales ---- */
  function loadPhoto(holder, src, alt, onMissing) {
    if (!holder) return;
    if (!src) { onMissing(); return; }
    const img = new Image();
    img.alt = alt;
    img.decoding = 'async';
    img.addEventListener('load', () => { holder.replaceChildren(img); holder.hidden = false; }, { once: true });
    img.addEventListener('error', onMissing, { once: true });
    img.src = src;
  }

  const hero = document.getElementById('heroPhoto');
  loadPhoto(hero, CONFIG.fotoPortada, 'Sofía y Diego', () => {
    hero.innerHTML = '<div class="photo-slot"><span>Su foto</span></div>';
  });

  const venue = document.getElementById('venuePhoto');
  loadPhoto(venue, CONFIG.fotoLugar, 'El Fundo Pozo Santo, en Pachacámac', () => {
    venue.innerHTML = '<div class="photo-slot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M3 19l6-8 4 5 3-4 5 7Z"/><circle cx="16" cy="7" r="2"/></svg><span>Foto del fundo pendiente</span></div>';
  });

  /* ---- Itinerario: la rosa recorre la línea al bajar, con movimiento suavizado ---- */
  const route = document.getElementById('route');
  const rose = document.getElementById('routeRose');
  const fill = document.getElementById('routeFill');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (route && rose) {
    const stops = [...route.querySelectorAll('.stop')];
    let geo = null;        // posiciones medidas una sola vez (y al cambiar el tamaño)
    let current = null;    // posición actual de la rosa
    let running = false;
    function measure() {
      const top = route.getBoundingClientRect().top + scrollY;
      const centers = stops.map(s => { const d = s.querySelector('.stop-dot').getBoundingClientRect(); return d.top + scrollY + d.height / 2 - top; });
      geo = { top, start: centers[0], end: centers[centers.length - 1], centers };
      fill.style.top = geo.start + 'px';
      fill.style.height = (geo.end - geo.start) + 'px';
    }
    function target() {
      const y = innerHeight * 0.55 + scrollY - geo.top;
      return Math.max(geo.start, Math.min(geo.end, y));
    }
    function draw(y) {
      const span = geo.end - geo.start || 1;
      rose.style.transform = `translate3d(-50%, ${y}px, 0) translateY(-50%) rotate(${(y - geo.start) * 0.3}deg)`;
      fill.style.transform = `scaleY(${(y - geo.start) / span})`;
      geo.centers.forEach((c, k) => stops[k].classList.toggle('reached', c <= y + 2));
    }
    function frame() {
      const t = target();
      current += (t - current) * (reduce ? 1 : 0.14);   // se acerca poco a poco: movimiento fluido
      if (Math.abs(t - current) < 0.3) current = t;
      draw(current);
      running = current !== t;
      if (running) requestAnimationFrame(frame);
    }
    const kick = () => { if (!running) { running = true; requestAnimationFrame(frame); } };
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', () => { measure(); kick(); });
    addEventListener('load', () => { measure(); kick(); });
    measure();
    current = target();
    draw(current);
    route.classList.add('is-live');
  }

  /* ---- Aparición suave de cada bloque al bajar ---- */
  if (!reduce && 'IntersectionObserver' in window) {
    const pieces = document.querySelectorAll([
      'main > section:not(.hero) > .kicker', 'main > section:not(.hero) > h2', 'main > section:not(.hero) > .prose',
      '.story-divider', '.record', '.date-copy > *', '.calendar', '.itinerary .wrap > *', '.stop',
      '.venue-photo', '.venue-content', '.dress-heading > *', '.dress-tabs', '.outfit-panels', '.dress-palette',
      '.rsvp-copy > *', '.rsvp .letter', '.gifts > .btn', '.moments-stage', '.song-form', '.closing .wrap > *'
    ].join(','));
    const seen = new IntersectionObserver(entries => {
      let n = 0;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.style.transitionDelay = (n++ * 90) + 'ms';
        e.target.classList.add('fx-in');
        seen.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    pieces.forEach(el => { el.classList.add('fx'); seen.observe(el); });
    // Limpia el retraso al terminar para que no afecte otras transiciones.
    document.addEventListener('transitionend', e => { if (e.target.classList?.contains('fx-in')) e.target.style.transitionDelay = ''; });
  }

  /* ---- Canción de los novios: disco en la página + botón flotante mientras suena ---- */
  const toggle = document.getElementById('musicToggle');
  const audio = document.getElementById('musicAudio');
  const label = document.getElementById('musicLabel');
  const record = document.getElementById('record');
  const recordAction = document.getElementById('recordAction');
  const song = CONFIG.cancion;
  let ready = Boolean(song && song.src);
  if (ready) audio.src = song.src;
  if (song && song.titulo) record.querySelector('.record-kicker').textContent = song.titulo;

  function sync() {
    const on = !audio.paused;
    record.setAttribute('aria-pressed', String(on));
    record.classList.toggle('playing', on);
    toggle.setAttribute('aria-pressed', String(on));
    toggle.classList.toggle('playing', on);
    recordAction.textContent = on ? 'Toca para pausar' : 'Toca para escucharla';
    label.textContent = on ? 'Pausar la canción' : 'Escuchar nuestra canción';
    if (on) toggle.hidden = false;
  }
  async function playPause() {
    if (!ready) {
      recordAction.textContent = 'Muy pronto podrás escucharla aquí';
      record.classList.add('spin-once');
      setTimeout(() => record.classList.remove('spin-once'), 1200);
      return;
    }
    if (audio.paused) {
      try { await audio.play(); } catch { ready = false; recordAction.textContent = 'Muy pronto podrás escucharla aquí'; }
    } else {
      audio.pause();
    }
  }
  record.addEventListener('click', playPause);
  toggle.addEventListener('click', playPause);
  audio.addEventListener('play', sync);
  audio.addEventListener('pause', sync);
  audio.addEventListener('error', () => { ready = false; toggle.hidden = true; });
})();
