# Confirmaciones en Google Sheets

La invitación es una sola página para todos los invitados. Quien confirma escribe sus datos y agrega una casilla por cada persona que viene con él (pareja, acompañante, hijos). Cada casilla lleva nombre, DNI o carné de extranjería y si asiste (el DNI se pide a todos). Las respuestas llegan solas a una hoja de Google, que se descarga como Excel con **Archivo → Descargar → Microsoft Excel**.

## Instalación (una sola vez, unos 10 minutos)

Hazlo con la cuenta de Google de los novios.

1. Entra a [sheets.new](https://sheets.new) para crear una hoja nueva. Ponle de nombre, por ejemplo, «Boda Sofía y Diego».
2. En la hoja, abre **Extensiones → Apps Script**.
3. Borra lo que aparece en el editor, pega todo el contenido de `Codigo.gs` y guarda con el ícono del disquete.
4. Vuelve a la hoja y recárgala. Aparece un menú nuevo llamado **Invitación**.
5. Usa **Invitación → Preparar la hoja**. Google te pedirá permisos la primera vez: elige tu cuenta, luego **Configuración avanzada → Ir a (nombre del proyecto)** y **Permitir**. Es normal, porque el script es tuyo y no está publicado en la tienda de Google.
6. Vuelve a Apps Script y usa **Implementar → Nueva implementación**:
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
7. Copia la **URL de la aplicación web**, que termina en `/exec`, y envíasela a quien mantiene la página. Esa URL va en `hojaUrl` dentro de `config.js`.

## Links por cantidad de personas

Cada invitado recibe el link según cuántas personas pueden ir con esa invitación. El formulario solo deja agregar acompañantes hasta ese número, y la hoja rechaza cualquier respuesta con más personas.

| Invitación para | Link |
|---|---|
| 1 persona | https://wifituga.github.io/boda-sofia-diego/?i=8cff02 |
| 2 personas | https://wifituga.github.io/boda-sofia-diego/?i=5dcb33 |
| 3 personas | https://wifituga.github.io/boda-sofia-diego/?i=9a43ac |
| 4 personas | https://wifituga.github.io/boda-sofia-diego/?i=291749 |
| 5 personas | https://wifituga.github.io/boda-sofia-diego/?i=bf0125 |

El link sin código (https://wifituga.github.io/boda-sofia-diego/) es para 1 persona. Ejemplos: los papás reciben el de 2, un amigo que va solo el de 1, la tía con sus dos hijos el de 3.

## Pestañas

- **Confirmaciones**: una fila por persona, con nombre, DNI y si asiste. La columna «Grupo» junta a quienes confirmaron en el mismo envío, «Confirmado por» dice quién llenó el formulario y «Tipo» separa al invitado de sus acompañantes (extras). Si alguien vuelve a confirmar, su respuesta nueva reemplaza a la anterior.
- **Lista de ingreso**: se actualiza sola con las personas que asisten, primero los invitados y luego los acompañantes, cada grupo ordenado por nombre. Es la que se le pasa a la wedding planner para la puerta.
- **Canciones**: las canciones que recomiendan los invitados para el baile.

## Privacidad
La hoja es privada: solo la ven las personas con quienes la compartas. La página no muestra ninguna lista; solo envía las respuestas.

Si cambias el código, publica una nueva versión en **Implementar → Gestionar implementaciones → Editar → Nueva versión**. Así se mantiene la misma URL.
