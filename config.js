/* ===== Configuración de la invitación (editar aquí) ===== */
const CONFIG = {
  novios: "Sofía & Diego",
  fecha: new Date("2027-06-11T20:00:00-05:00"),
  lugar: "Fundo Pozo Santo, Av. Víctor Malásquez 12.3, Pachacámac, Lima",

  /* URL de la app web de Google Apps Script (ver google-apps-script/LEEME.md).
     Mientras esté vacía, la confirmación funciona en modo demostración y no guarda nada. */
  hojaUrl: "",

  /* Links por cantidad de personas. Cada código permite confirmar hasta ese número de personas
     (el invitado + sus acompañantes). El link sin código es para 1 persona.
     Ejemplo: https://wifituga.github.io/boda-sofia-diego/?i=CODIGO
     Si cambias los códigos, cámbialos también en google-apps-script/Codigo.gs (PASES). */
  pases: {
    "8cff02": 1,
    "5dcb33": 2,
    "9a43ac": 3,
    "291749": 4,
    "bf0125": 5
  },

  /* Canción de los novios: copiar el MP3 a musica/ y escribir aquí su nombre.
     Mientras sea null, el botón de música no aparece. */
  cancion: { src: "musica/cancion.mp3" }, // subir el archivo con ese nombre a la carpeta musica/

  /* Foto pequeña de la portada. Si el archivo no existe, la portada se muestra sin foto. */
  fotoPortada: "img/fotos/portada-clara.webp",

  /* Foto del Fundo Pozo Santo. Si el archivo no existe, se muestra un espacio pendiente. */
  fotoLugar: "img/fotos/fundo.jpg",

  /* Datos para transferencia (página de regalos). null = no se muestran. */
  transferencia: null
  // transferencia: { banco: "BCP", titular: "Sofía y Diego", cuenta: "000-0000000-0-00", cci: "000-000-000000000000-00" }
};
