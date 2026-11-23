# Invitación web · Sofía & Diego

Invitación de boda en una sola página, con HTML, CSS y JavaScript nativos. Adaptada a móvil y escritorio.

## Secciones
- Tarjeta de dos tapas en relieve con lacre marfil. Tocar el sobre o activar el lacre con el teclado abre la carta. Con movimiento reducido, la invitación se abre de inmediato.
- Carta interior con una cascada de orquídeas y una cala sobre el papel, seguida de los accesos a la confirmación y al lugar
- Calendario, cuenta regresiva y enlace para agendar en Google Calendar
- Itinerario con horarios visibles desde el inicio
- Lugar (Fundo Pozo Santo) con botón a Google Maps
- Guía de vestimenta con pestañas «Ellos» y «Ellas», fotografías ampliables y paleta de colores
- Ideas de regalo dentro de la carta, con acceso directo desde el menú y desde `#regalos`
- Confirmación de asistencia (abre WhatsApp con la respuesta preparada)
- Retrato y galería opcionales junto a la nota «A nuestra familia y amigos»

## Cómo editar
La estructura y los textos están en `index.html`, junto con la interacción inicial del sobre. Las animaciones de la apertura están en `styles.css` y los datos y formularios en `invitacion.js`. El estilo de la confirmación, los regalos y la despedida está en `papeleria-cierre.css`. Los detalles que se animan al recorrer la carta están en `interior-motion.css` e `interior-motion.js`. Cormorant Garamond y Jost se sirven desde `fonts/`, donde también están sus licencias.

- **Datos generales**: editar `CONFIG` en `invitacion.js` y actualizar los textos de fecha, ubicación y horarios de `index.html`. El calendario mensual y el enlace de Google Calendar están en `invitacion.js`.
- **Fotos de la pareja**: copiar las imágenes a `img/fotos/` y listarlas en `FOTOS` de `invitacion.js`. La primera es el retrato principal y las demás forman la galería. Un archivo vertical funciona bien con el recorte 4:5.
  ```js
  const FOTOS = [
    { src: "img/fotos/1.jpg", alt: "Descripción de la foto", texto: "Cómo empezó" },
  ];
  ```
  El pie `texto` es opcional. Si `FOTOS` está vacío, la sección muestra la historia sin un espacio vacío para imágenes.
- **Regalos.** La lista se despliega en `#giftList` de `index.html`, incluso sin JavaScript. Las tres ideas son ilustrativas. Cuando los novios confirmen sus regalos, reemplazar las entradas de `.gift-ideas` y actualizar el aviso de `.gift-intro`. La fotografía está en `img/regalos-editorial.webp`.
- **Transferencias.** `CONFIG.transferencia` en `invitacion.js` controla la información pública. Con `null` el apartado permanece oculto. Para habilitarlo, establecer un objeto con los campos de texto `banco`, `titular` y `cuenta` confirmados por los novios. El campo de texto `cci` es opcional. Conservar ceros iniciales en los números de cuenta.

> La fecha, los horarios y el número de WhatsApp siguen siendo datos de demostración.

## Publicar con GitHub Pages
Settings → Pages → *Deploy from a branch* → rama `main`, carpeta `/ (root)`.
La invitación queda en `https://<usuario>.github.io/<repo>/`.

## Imágenes editoriales
La cubierta en relieve y el monograma de lacre se encuentran en `img/cubierta-relieve.webp` e `img/lacre-sd.webp`. Las flores de la carta están en `img/cascada-orquideas*.webp` e `img/cala-prensada.webp`. La ficha del lugar usa `img/ramo-calas-720.webp` y la firma lleva la rama de `img/olivo-de-la-carta.webp`. Las referencias de vestimenta están en `img/traje-invitado*.webp` e `img/vestido-invitada*.webp`. Sus pestañas y la vista ampliada se controlan desde `vestimenta.js`. Los retratos de los novios se configuran por separado en `FOTOS`.
