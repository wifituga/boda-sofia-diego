# Invitación web · Sofía & Diego

Invitación de boda en una sola página, con HTML, CSS y JavaScript nativos. Adaptada a móvil y escritorio.

## Secciones
- Tarjeta de dos tapas en relieve con lacre. Tocar el sobre o activar el lacre con el teclado abre la carta. Con movimiento reducido, la invitación se abre de inmediato.
- Portada con «Nos casamos», una foto pequeña opcional y los nombres
- Calendario, cuenta regresiva y enlace para agendar en Google Calendar
- Itinerario con una rosa que recorre la línea al bajar
- Lugar (Fundo Pozo Santo, Pachacámac) con foto del campo y botón a Google Maps
- Guía de vestimenta: colores para invitados (terracota, verde salvia, azul marino); el granate es del cortejo y el blanco de la novia
- Confirmación de asistencia: una sola invitación para todos; quien confirma agrega una casilla por cada persona que viene con él (nombre, DNI y si asiste). Se guarda en Google Sheets.
- Regalos en una página aparte (`regalos.html`)
- «Nuestros momentos»: carrusel de fotos con la tarjeta «Estos niños se casaron»
- Recomendación de canciones para el baile (también en Google Sheets)
- Botón flotante con la canción de los novios

## Cómo editar
- **Datos generales**: `config.js` (fecha, lugar, URL de la hoja de Google, canción, fotos de portada y del lugar, datos para transferencia). Los textos de fecha y horarios están en `index.html`.
- **Confirmaciones y canciones**: ver `google-apps-script/LEEME.md`. Mientras `hojaUrl` esté vacío, el formulario funciona en modo demostración y no guarda nada.
- **Canción**: copiar el MP3 a `musica/` y escribir `cancion: { src: "musica/archivo.mp3" }` en `config.js`.
- **Fotos de portada y del lugar**: guardarlas como `img/fotos/portada.jpg` e `img/fotos/fundo.jpg`, o cambiar las rutas en `config.js`.
- **Foto en «Y ahora, para siempre»** (opcional): `FOTOS` en `invitacion.js`.
- **Nuestros momentos**: `MOMENTOS` en `momentos.js`. En `ninos` van las fotos de Sofía y Diego de niños; en `fotos`, el resto del carrusel. Mientras un archivo no exista, se muestra «Foto pendiente».
- **Regalos**: textos e ideas en `regalos.html`; datos bancarios en `config.js` (`transferencia`).
- **Itinerario**: horarios en `index.html` (`.route-stops`); la rosa está en `img/rosa-itinerario.webp` y su movimiento en `experiencia.js`.

> Fecha, horarios y dirección tomados de la invitación anterior de Canva (11 de junio de 2027). Faltan la cuenta bancaria, el MP3 y las fotos.

## Publicar con GitHub Pages
Settings → Pages → *Deploy from a branch* → rama `main`, carpeta `/ (root)`.
La invitación queda en `https://<usuario>.github.io/<repo>/`.

## Imágenes editoriales
La cubierta en relieve y el monograma de lacre se encuentran en `img/cubierta-relieve.webp` e `img/lacre-sd.webp`. Las flores que enmarcan la carta durante la apertura y en la portada se encuentran en `img/cascada-orquideas*.webp` e `img/cala-prensada.webp`. La rama de olivo y la orquídea que aparecen en las secciones interiores están en `img/olivo-de-la-carta.webp` e `img/orquidea-suelta.webp`. Las referencias de vestimenta están en `img/traje-invitado*.webp` e `img/vestido-invitada*.webp`. Sus pestañas y la vista ampliada se controlan desde `vestimenta.js`. Los retratos de los novios se configuran por separado en `FOTOS`. Las referencias de vestimenta se recolorearon a terracota (vestido) y verde salvia (corbata).
