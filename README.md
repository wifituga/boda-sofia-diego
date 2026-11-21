# Invitación web · Sofía & Diego

Invitación de boda en una sola página (HTML + CSS + JS, sin dependencias). Pensada para celular.

## Secciones
- Sobre con puertas en relieve y sello de cera que se abre al tocarlo
- Portada, frase, fecha con calendario y cuenta regresiva (botón para agendar en Google Calendar)
- Itinerario con línea que avanza al hacer scroll y sellos con rosa en cada hora
- Lugar (Fundo Pozo Santo) con botón a Google Maps
- Código de vestimenta y paleta de colores
- Regalos: enlace a la lista en D'Parte y datos para transferencia
- Confirmación de asistencia (arma un mensaje de WhatsApp para los novios)
- Galería de fotos (se muestra sola cuando hay fotos)

## Cómo editar
Todo lo que cambia está en `index.html`:

- **Datos generales**: objeto `CONFIG` al inicio del `<script>` (fecha, lugar, número de WhatsApp).
- **Fotos**: copiar las imágenes a `img/fotos/` y listarlas en `FOTOS`:
  ```js
  const FOTOS = [
    { src: "img/fotos/1.jpg", texto: "Cómo empezó" },
  ];
  ```
- **Lista de regalos**: cambiar el `href` del botón `#giftList` por el link de D'Parte de los novios.
- **Datos bancarios**: bloque `#bank`.

> Datos de demo pendientes de reemplazar: fecha y horarios, número de WhatsApp, cuenta bancaria y link de la lista de regalos.

## Publicar con GitHub Pages
Settings → Pages → *Deploy from a branch* → rama `main`, carpeta `/ (root)`.
La invitación queda en `https://<usuario>.github.io/<repo>/`.

## Texturas
Las imágenes de `img/` (relieve, papel, lino, foil dorado y sellos) se generaron por código con los scripts de `tools/` (Python + NumPy/SciPy/Pillow).
