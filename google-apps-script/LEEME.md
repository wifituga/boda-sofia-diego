# Confirmaciones en Google Sheets

Las confirmaciones y las canciones recomendadas llegan solas a una hoja de Google. La hoja se descarga como Excel con **Archivo → Descargar → Microsoft Excel**.

## Instalación (una sola vez, unos 10 minutos)

Hazlo con la cuenta de Google de los novios.

1. Entra a [sheets.new](https://sheets.new) para crear una hoja nueva. Ponle de nombre, por ejemplo, «Boda Sofía y Diego».
2. En la hoja, abre **Extensiones → Apps Script**.
3. Borra lo que aparece en el editor, pega todo el contenido de `Codigo.gs` y guarda con el ícono del disquete.
4. Vuelve a la hoja y recárgala. Aparece un menú nuevo llamado **Invitación**.
5. Usa **Invitación → 1. Preparar la hoja**. Google te pedirá permisos la primera vez: elige tu cuenta, luego **Configuración avanzada → Ir a (nombre del proyecto)** y **Permitir**. Es normal, porque el script es tuyo y no está publicado en la tienda de Google.
6. Vuelve a Apps Script y usa **Implementar → Nueva implementación**:
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
7. Copia la **URL de la aplicación web**, que termina en `/exec`, y envíasela a quien mantiene la página. Esa URL va en `hojaUrl` dentro de `config.js`.

## Cómo se usa

### Pestaña «Invitados»

Cada fila es una invitación, es decir, un link:

| Columna | Qué escribir |
|---|---|
| Código | Déjalo vacío; se genera solo |
| Invitación | Cómo se saluda en la página. Ejemplos: «Néstor y Paola», «Familia López» |
| Invitados | Los nombres separados por coma. Ejemplo: «Néstor Ruiz, Paola Díaz» |
| Pases | Total de personas que pueden ir con esa invitación. Si es mayor que la cantidad de nombres, la diferencia aparece como «Pase adicional» para un acompañante |
| Link | Se llena solo |
| Respondió | Se llena solo con la fecha de la última respuesta |

Ejemplos:
- **Néstor y Paola**, 2 pases: cada uno confirma por separado.
- **Martín**, 2 pases: Martín y un acompañante que él elige.
- **Familia López**, 4 pases: los papás y sus dos hijas.

Cuando termines de escribir las filas, usa **Invitación → 2. Generar códigos y links** y envía a cada invitación su link. Puedes agregar más filas después y volver a generar; los links que ya existen no cambian.

### Pestaña «Confirmaciones»
Hay una fila por persona, con nombre, DNI o carné de extranjería y si asiste. Si una invitación responde otra vez, la nueva respuesta reemplaza a la anterior.

### Pestaña «Lista de ingreso»
Se actualiza sola con las personas que confirmaron que asisten, ordenadas por nombre. Es la que se le pasa a la wedding planner para la puerta.

### Pestaña «Canciones»
Aquí llegan las canciones que recomiendan los invitados.

## Privacidad
La hoja es privada: solo la ven las personas con quienes la compartas. La página nunca muestra la lista de invitados; cada link solo puede ver los nombres de su propia invitación.

Si cambias el código, publica una nueva versión en **Implementar → Gestionar implementaciones → Editar → Nueva versión**. Así se mantiene la misma URL.
