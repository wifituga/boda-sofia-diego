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
  loadPhoto(hero, CONFIG.fotoPortada, 'Sofía y Diego', () => { hero.hidden = true; });

  const venue = document.getElementById('venuePhoto');
  loadPhoto(venue, CONFIG.fotoLugar, 'El Fundo Pozo Santo, en Pachacámac', () => {
    venue.innerHTML = '<div class="photo-slot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M3 19l6-8 4 5 3-4 5 7Z"/><circle cx="16" cy="7" r="2"/></svg><span>Foto del fundo pendiente</span></div>';
  });

  /* ---- Itinerario: la rosa recorre la línea al bajar ---- */
  const route = document.getElementById('route');
  const rose = document.getElementById('routeRose');
  const fill = document.getElementById('routeFill');
  if (route && rose) {
    const stops = [...route.querySelectorAll('.stop')];
    let ticking = false;
    function place() {
      ticking = false;
      const box = route.getBoundingClientRect();
      const first = stops[0].querySelector('.stop-dot').getBoundingClientRect();
      const last = stops[stops.length - 1].querySelector('.stop-dot').getBoundingClientRect();
      const start = first.top + first.height / 2 - box.top;
      const end = last.top + last.height / 2 - box.top;
      // La rosa sigue la mitad de la pantalla, sin salirse del primer y último punto.
      const target = innerHeight * 0.55 - box.top;
      const y = Math.max(start, Math.min(end, target));
      rose.style.transform = `translate(-50%, ${y}px) translateY(-50%) rotate(${(y - start) * 0.35}deg)`;
      fill.style.height = `${y - start}px`;
      fill.style.top = `${start}px`;
      for (const stop of stops) {
        const dot = stop.querySelector('.stop-dot').getBoundingClientRect();
        stop.classList.toggle('reached', dot.top + dot.height / 2 - box.top <= y + 2);
      }
    }
    const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(place); } };
    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', request);
    place();
    route.classList.add('is-live');
  }

  /* ---- Canción de los novios ---- */
  const toggle = document.getElementById('musicToggle');
  const audio = document.getElementById('musicAudio');
  const label = document.getElementById('musicLabel');
  const song = CONFIG.cancion;
  if (toggle && audio && song && song.src) {
    audio.src = song.src;
    toggle.hidden = false;
    const idle = 'Escuchar nuestra canción';
    label.textContent = idle;
    function sync() {
      const on = !audio.paused;
      toggle.setAttribute('aria-pressed', String(on));
      toggle.classList.toggle('playing', on);
      label.textContent = on ? 'Pausar la canción' : idle;
    }
    toggle.addEventListener('click', async () => {
      if (audio.paused) {
        try { await audio.play(); } catch { label.textContent = 'No se pudo reproducir'; }
      } else {
        audio.pause();
      }
    });
    audio.addEventListener('play', sync);
    audio.addEventListener('pause', sync);
    audio.addEventListener('error', () => { toggle.hidden = true; });
  }
})();
