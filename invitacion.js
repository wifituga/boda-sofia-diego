/* ===== Configuración (editar aquí) ===== */
const CONFIG = {
  novios: "Sofía & Diego",
  fecha: new Date("2027-05-15T16:00:00-05:00"),
  lugar: "Fundo Pozo Santo, Av. Víctor Malásquez, Lima",
  whatsapp: "51900000000" // número de demo
};
/* La primera foto aparece en Nuestra historia. Las siguientes forman la galería. */
const FOTOS = [
  // { src: "img/fotos/1.jpg", alt: "Sofía y Diego juntos", texto: "Cómo empezó" },
];

/* ===== Abrir sobre ===== */
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
if (!location.hash) {
  const envelope = document.getElementById('envelope');
  const invitation = document.querySelector('main');
  envelope.hidden = false;
  invitation.inert = true;
  document.body.classList.add('locked');

  document.getElementById('seal').addEventListener('click', () => {
    const showInvitation = () => {
      envelope.hidden = true;
      invitation.inert = false;
      document.body.classList.remove('locked');
      document.getElementById('titulo').focus({ preventScroll: true });
    };
    if (reducedMotion.matches) {
      showInvitation();
    } else {
      envelope.classList.add('open');
      setTimeout(showInvitation, 240);
    }
  }, { once: true });
}

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
  const g=document.getElementById('calG'), y=2027, m=4, mark=15;
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
 +'&dates=20270515T210000Z/20270516T060000Z&details='+encodeURIComponent('¡Te esperamos para celebrar juntos!')+'&location='+encodeURIComponent(CONFIG.lugar);

/* ===== Datos bancarios ===== */
const bankButton = document.getElementById('bankBtn');
const bankDetails = document.getElementById('bank');
bankButton.addEventListener('click', () => {
  const open = bankDetails.hidden;
  bankDetails.hidden = !open;
  bankButton.setAttribute('aria-expanded', String(open));
  bankButton.textContent = open ? 'Ocultar datos' : 'Datos para transferencia';
});
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800)}
document.querySelectorAll('.copy').forEach(b=>b.addEventListener('click',async()=>{
  const v=document.getElementById(b.dataset.copy).textContent;
  try{await navigator.clipboard.writeText(v);toast('Copiado')}catch(e){toast(v)}
}));

/* ===== RSVP ===== */
{
  const form = document.getElementById('rsvpForm');
  const guestsField = document.getElementById('guestsField');
  const submit = document.getElementById('rsvpSubmit');
  const hint = document.getElementById('rsvpHint');
  const status = document.getElementById('rsvpStatus');
  const fallback = document.getElementById('waLink');
  const { guestName, attend, guestCount, diet, message } = form.elements;

  submit.disabled = !CONFIG.whatsapp;
  if (submit.disabled) {
    submit.textContent = 'Confirmación aún no disponible';
    hint.textContent = 'Los novios aún están preparando la confirmación por WhatsApp.';
  }

  form.addEventListener('input', event => {
    if (event.target === guestName) guestName.setCustomValidity('');
    guestsField.hidden = attend.value !== 'si';
    fallback.hidden = true;
    status.textContent = '';
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!CONFIG.whatsapp) return;

    const name = guestName.value.trim();
    if (!name) {
      guestName.setCustomValidity('Escribe tu nombre y apellido.');
      guestName.reportValidity();
      return;
    }

    const count = guestCount.value;
    const text = attend.value === 'si'
      ? `¡Hola ${CONFIG.novios}! Soy ${name} y confirmo mi asistencia a su boda (${count} ${count === '1' ? 'persona' : 'personas'}).`
      : `¡Hola ${CONFIG.novios}! Soy ${name}. Lamentablemente no podré asistir a su boda, pero les deseo lo mejor.`;
    const lines = [text];
    if (diet.value.trim()) lines.push(`Restricción alimentaria: ${diet.value.trim()}`);
    if (message.value.trim()) lines.push(`Mensaje: ${message.value.trim()}`);

    fallback.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
    fallback.hidden = false;
    status.textContent = 'Tu mensaje está listo. Pulsa Enviar en WhatsApp para confirmarlo.';
    window.open(fallback.href, '_blank', 'noopener,noreferrer');
  });
}
