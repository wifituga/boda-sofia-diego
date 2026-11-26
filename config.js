/* ===== Configuración de la invitación (editar aquí) ===== */
const CONFIG = {
  novios: "Sofía & Diego",
  fecha: new Date("2027-06-11T20:00:00-05:00"),
  lugar: "Fundo Pozo Santo, Av. Víctor Malásquez 12.3, Pachacámac, Lima",

  /* URL de la app web de Google Apps Script (ver google-apps-script/LEEME.md).
     Mientras esté vacía, la confirmación funciona en modo demostración y no guarda nada. */
  hojaUrl: "",

  /* Canción de los novios: copiar el MP3 a musica/ y escribir aquí su nombre.
     Mientras sea null, el botón de música no aparece. */
  cancion: { src: "musica/cancion.mp3", titulo: "A dónde vamos · Morat" }, // subir el archivo con ese nombre a la carpeta musica/

  /* Foto pequeña de la portada. Si el archivo no existe, la portada se muestra sin foto. */
  fotoPortada: "img/fotos/portada-mar.webp",

  /* Foto del Fundo Pozo Santo. Si el archivo no existe, se muestra un espacio pendiente. */
  fotoLugar: "img/fotos/fundo.jpg",

  /* Datos para transferencia (página de regalos). null = no se muestran. */
  transferencia: null
  // transferencia: { banco: "BCP", titular: "Sofía y Diego", cuenta: "000-0000000-0-00", cci: "000-000-000000000000-00" }
};
