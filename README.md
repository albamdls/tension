# Mi Tensión

Web sencilla para anotar la tensión arterial (3 tomas al día) y exportarla a PDF.
HTML + CSS + JavaScript, sin servidor. Los datos se guardan en el propio móvil (localStorage).

## Desplegar en GitHub Pages

1. Crea un repositorio nuevo (por ejemplo `tension`).
2. Sube **todo el contenido** de esta carpeta a la raíz del repo (index.html, style.css, app.js, sw.js, manifest.json, `lib/`, `fonts/` e `icons/`).
3. En el repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`.
4. En un minuto estará en `https://TU-USUARIO.github.io/tension/`.

## Instalar en Android (como app)

1. Abre la URL en **Chrome**.
2. Menú ⋮ → **Añadir a pantalla de inicio** → **Instalar**.
3. Aparece el icono 💙 "Tensión" y se abre a pantalla completa, sin barra del navegador. Funciona también sin internet.

## Importante

- Los datos viven en el Chrome del móvil. Si se borran los datos de Chrome o se cambia de móvil, se pierden → usar de vez en cuando **Copia de seguridad → Descargar copia**.
- Abrir siempre desde el mismo icono/URL (cada URL tiene su propio almacenamiento).
- Si cambias algún archivo, sube la versión en `sw.js` (`tension-v4` → `tension-v5`).

## Funciones

- Solo hay que escribir alta, baja y pulso: la fecha y la hora se guardan solas con el momento actual.
- Arriba, las tomas de hoy (1ª, 2ª y 3ª): se ve cuántas faltan.
- Debajo, los días anteriores con sus tomas y la hora. Tocar una toma permite verla o borrarla.
- Las tomas ≥140 alta o ≥90 baja se destacan en rojo.
- Botón PDF con rango de fechas → tabla con Fecha, Hora, Alta, Baja y Pulso.
- Copia de seguridad en JSON y restauración.
