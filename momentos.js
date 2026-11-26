/* ===== Nuestros momentos (editar aquí) =====
   Copiar las fotos a img/fotos/ y escribir aquí su nombre de archivo.
   Mientras una foto no exista, se muestra un espacio "Foto pendiente". */
const MOMENTOS = {
  ninos: {
    sofia: "img/fotos/sofia-nina.jpg",
    diego: "img/fotos/diego-nino.jpg"
  },
  fotos: [
    { src: "img/fotos/momento-1.webp", alt: "Sofía y Diego frente a frente en la orilla", pos: "50% 45%" },
    { src: "img/fotos/anillo.webp", alt: "La mano de Sofía con su anillo de compromiso", pos: "62% 40%" },
    { src: "img/fotos/momento-2.webp", alt: "Sofía y Diego entre las olas", pos: "50% 62%" },
    { src: "img/fotos/ramo.webp", alt: "Sofía y Diego de blanco con un ramo de flores", pos: "50% 38%" },
    { src: "img/fotos/momento-3.webp", alt: "Sofía y Diego abrazados frente al acantilado", pos: "50% 28%" }
  ]
};

(() => {
  const track = document.getElementById('momentsTrack');
  if (!track) return;
  const camera = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/></svg>';

  function photo(src, alt) {
    const box = document.createElement('div');
    box.className = 'moment-photo';
    const slot = () => { box.innerHTML = `<div class="photo-slot">${camera}<span>Foto pendiente</span></div>`; };
    if (!src) { slot(); return box; }
    const img = new Image();
    img.alt = alt || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', slot, { once: true });
    img.src = src;
    box.append(img);
    return box;
  }

  // Fotos de niños en la primera tarjeta
  document.querySelectorAll('[data-kid]').forEach(fig => {
    const who = fig.dataset.kid;
    fig.prepend(photo(MOMENTOS.ninos[who], who === 'sofia' ? 'Sofía de niña' : 'Diego de niño'));
  });

  // Resto de fotos
  for (const f of MOMENTOS.fotos) {
    const fig = document.createElement('figure');
    fig.className = 'moment';
    const box = photo(f.src, f.alt);
    if (f.pos) box.style.setProperty('--pos', f.pos);
    fig.append(box);
    if (f.texto) {
      const cap = document.createElement('figcaption');
      cap.textContent = f.texto;
      fig.append(cap);
    }
    track.append(fig);
  }

  // Navegación
  const slides = [...track.children];
  const prev = document.getElementById('momentsPrev');
  const next = document.getElementById('momentsNext');
  const count = document.getElementById('momentsCount');
  let current = 0;

  function update() {
    const center = track.scrollLeft + track.clientWidth / 2;
    let best = 0, dist = Infinity;
    slides.forEach((s, i) => {
      const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - center);
      if (d < dist) { dist = d; best = i; }
    });
    current = best;
    count.textContent = `${current + 1} / ${slides.length}`;
    prev.disabled = current === 0;
    next.disabled = current === slides.length - 1;
  }
  function go(i) {
    const s = slides[Math.max(0, Math.min(slides.length - 1, i))];
    track.scrollTo({ left: s.offsetLeft - (track.clientWidth - s.offsetWidth) / 2 });
  }
  prev.addEventListener('click', () => go(current - 1));
  next.addEventListener('click', () => go(current + 1));
  track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  track.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1); }
  });
  addEventListener('resize', update);
  update();
})();
