# Invitación web · Sofía & Diego

Invitación de boda en una sola página (HTML + CSS + JS, sin dependencias). Pensada para celular.

## Secciones
- Sobre con puertas en relieve, sello de cera y botón de apertura
- Portada con la fecha y accesos a la confirmación y al lugar
- Calendario, cuenta regresiva y enlace para agendar en Google Calendar
- Itinerario con sellos y horarios visibles desde el inicio
- Lugar (Fundo Pozo Santo) con botón a Google Maps
- Código de vestimenta y paleta de colores
- Regalos: enlace a la lista en D'Parte y datos para transferencia
- Confirmación de asistencia (abre WhatsApp con la respuesta preparada)
- Retrato y galería opcionales en «Nuestra historia»

## Cómo editar
Todo lo que cambia está en `index.html`:

- **Datos generales**: objeto `CONFIG` al inicio del `<script>` (fecha, lugar, número de WhatsApp).
- **Fotos**: copiar las imágenes a `img/fotos/` y listarlas en `FOTOS`. La primera es el retrato principal y las demás forman la galería. Un archivo vertical funciona bien con el recorte 4:5.
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

## Texturas
Las imágenes de `img/` (relieve, papel, lino, foil dorado y sellos) se generaron por código con los scripts de `tools/` (Python + NumPy/SciPy/Pillow).
