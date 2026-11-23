# Invitación web · Sofía & Diego

Invitación de boda en una sola página, con HTML, CSS y JavaScript nativos. Adaptada a móvil y escritorio.

## Secciones
- Tarjeta de dos tapas en relieve con lacre marfil. Tocar el sobre o activar el lacre con el teclado abre la carta. Con movimiento reducido, la invitación se abre de inmediato.
- Portada con la fecha y accesos a la confirmación y al lugar
- Calendario, cuenta regresiva y enlace para agendar en Google Calendar
- Itinerario con horarios visibles desde el inicio
- Lugar (Fundo Pozo Santo) con botón a Google Maps
- Código de vestimenta y paleta de colores
- Regalos: enlace a la lista en D'Parte y datos para transferencia
- Confirmación de asistencia (abre WhatsApp con la respuesta preparada)
- Retrato y galería opcionales en «Nuestra historia»

## Cómo editar
La estructura y los textos están en `index.html`, junto con la interacción inicial del sobre. Las animaciones de la apertura están en `styles.css` y los datos y formularios en `invitacion.js`. Los detalles que se animan al recorrer la carta están en `interior-motion.css` e `interior-motion.js`.

- **Datos generales**: editar `CONFIG` en `invitacion.js` y actualizar los textos de fecha, ubicación y horarios de `index.html`. El calendario mensual y el enlace de Google Calendar están en `invitacion.js`.
- **Fotos de la pareja**: copiar las imágenes a `img/fotos/` y listarlas en `FOTOS` de `invitacion.js`. La primera es el retrato principal y las demás forman la galería. Un archivo vertical funciona bien con el recorte 4:5.
  ```js
  const FOTOS = [
    { src: "img/fotos/1.jpg", alt: "Descripción de la foto", texto: "Cómo empezó" },
  ];
  ```
  El pie `texto` es opcional. Si `FOTOS` está vacío, la sección muestra la historia sin un espacio vacío para imágenes.
- **Lista de regalos**: cambiar el `href` del botón `#giftList` por el link de D'Parte de los novios.
- **Datos bancarios**: bloque `#bank`.

> Datos de demo pendientes de reemplazar: fecha y horarios, número de WhatsApp, cuenta bancaria y link de la lista de regalos.

## Publicar con GitHub Pages
Settings → Pages → *Deploy from a branch* → rama `main`, carpeta `/ (root)`.
La invitación queda en `https://<usuario>.github.io/<repo>/`.

## Imágenes editoriales
La cubierta en relieve y el monograma de lacre se encuentran en `img/cubierta-relieve.webp` e `img/lacre-sd.webp`. La rama de la carta, el ramo y la flor de solapa se encuentran en `img/rama-botanica.webp`, `img/ramo-calas*.webp` e `img/flor-de-solapa*.webp`. Los retratos de los novios se configuran por separado en `FOTOS`.
