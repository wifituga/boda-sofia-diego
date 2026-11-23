# Invitación web · Sofía & Diego

Invitación de boda en una sola página, con HTML, CSS y JavaScript nativos. Adaptada a móvil y escritorio.

## Secciones
- Presentación con fotografía del sobre y botón de apertura
- Portada con la fecha y accesos a la confirmación y al lugar
- Calendario, cuenta regresiva y enlace para agendar en Google Calendar
- Itinerario con horarios visibles desde el inicio
- Lugar (Fundo Pozo Santo) con botón a Google Maps
- Código de vestimenta y paleta de colores
- Regalos: enlace a la lista en D'Parte y datos para transferencia
- Confirmación de asistencia (abre WhatsApp con la respuesta preparada)
- Retrato y galería opcionales en «Nuestra historia»

## Cómo editar
La estructura y los textos están en `index.html`, los estilos en `styles.css` y la configuración e interacciones en `invitacion.js`.

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
El sobre y el arreglo floral son imágenes creadas para esta invitación. Los archivos `img/sobre-editorial*.webp` e `img/flores-editoriales*.webp` tienen variantes para móvil y escritorio.
