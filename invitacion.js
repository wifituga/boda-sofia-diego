/* La primera foto aparece en Nuestra historia. Las siguientes forman la galería. */
const FOTOS = [
  { src: "img/fotos/historia.webp", alt: "Sofía y Diego abrazados entre las olas" },
];

/* ===== Fotos ===== */
if (FOTOS.length) {
  const photos = document.getElementById('galeria');
  const portrait = document.getElementById('storyPortrait');
  const gallery = document.getElementById('gal');

  for (const photo of FOTOS) {
    if (!photo.src) continue;
    const figure = document.createElement('figure');
    const image = document.createElement('img');
    image.alt = photo.alt || '';
    image.loading = 'lazy';
    image.addEventListener('error', () => {
      figure.remove();
      if (!portrait.firstElementChild && gallery.firstElementChild) {
        portrait.append(gallery.firstElementChild);
      }
      photos.hidden = !portrait.firstElementChild;
    });
    image.src = photo.src;
    figure.append(image);
    if (photo.texto) {
      const caption = document.createElement('figcaption');
      caption.textContent = photo.texto;
      figure.append(caption);
    }
    (portrait.firstElementChild ? gallery : portrait).append(figure);
  }
  photos.hidden = !portrait.firstElementChild;
}

/* ===== Calendario ===== */
(function(){
  const g=document.getElementById('calG'), y=2027, m=5, mark=11;
  ['L','M','M','J','V','S','D'].forEach(d=>g.insertAdjacentHTML('beforeend',`<div class="w">${d}</div>`));
  const first=(new Date(y,m,1).getDay()+6)%7, days=new Date(y,m+1,0).getDate();
  for(let i=0;i<first;i++)g.insertAdjacentHTML('beforeend','<div></div>');
  for(let d=1;d<=days;d++)g.insertAdjacentHTML('beforeend',`<div class="d${d===mark?' m':''}">${d}</div>`);
})();

/* ===== Cuenta regresiva ===== */
function tick(){
  let s=Math.max(0,Math.floor((CONFIG.fecha-new Date())/1000));
  const D=Math.floor(s/86400);s%=86400;const H=Math.floor(s/3600);s%=3600;const M=Math.floor(s/60);s%=60;
  cdD.textContent=D;cdH.textContent=String(H).padStart(2,'0');cdM.textContent=String(M).padStart(2,'0');cdS.textContent=String(s).padStart(2,'0');
}
tick();setInterval(tick,1000);

/* ===== Agendar (Google Calendar) ===== */
calBtn.href='https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent('Boda de '+CONFIG.novios)
 +'&dates=20270612T010000Z/20270612T100000Z&details='+encodeURIComponent('¡Te esperamos para celebrar juntos!')+'&location='+encodeURIComponent(CONFIG.lugar);
