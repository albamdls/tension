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
- Si cambias algún archivo, sube la versión en `sw.js` (`tension-v8` → `tension-v9`).

## Funciones

- Solo hay que escribir alta, baja (admiten decimales con coma, p. ej. 12,5) y pulso: la fecha y la hora se guardan solas con el momento actual.
- Arriba, las tomas de hoy (1ª, 2ª y 3ª): se ve cuántas faltan.
- Debajo, los días anteriores con sus tomas y la hora. Tocar una toma permite verla o borrarla.
- Se marcan en rojo la alta mayor de 13,0 y la baja mayor de 8,0 o menor de 7,0 (límites en `LIMITE`, al principio de `app.js`). También acepta valores en mmHg (135 → 13,5).
- Estado de ánimo del día (con energía, bien, regular, cansada, mareada, dolor de cabeza).
- PDF con rango de fechas: resumen de días con valores fuera de rango y recuento por tipo (alta > 13, baja > 8, baja < 7), resumen de ánimo, y una tabla por día con sus mediciones y el ánimo marcado.
- Copia de seguridad en JSON (tomas y ánimo) y restauración.
