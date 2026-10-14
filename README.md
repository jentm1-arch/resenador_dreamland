# resenador_dreamland

Producto para visualizar las reseñas de los restaurantes Voltereta, Begin y One Burguer con posibilidad de filtro por marca y local. Visualiza los temas que los clientes marcan como fortalezas, cosas positivas, y las quejas más repetidas.

Prototipo independiente, no oficial. Usa solo información pública de Google Maps. No guarda nombres de reseñadores ni textos de reseñas.

## Estructura
- `web/`: sitio estático (HTML, CSS, JS). Paleta de referencia en `web/tokens.css`.
- `data/locales.json`: datos que lee el sitio.
- `data/raw/`: lecturas por local (puntaje, temas de Google, quejas clasificadas).
- `scripts/read_local.js`: lector que se ejecuta en la ficha de Maps de cada local.
- `scripts/build_data.py`: junta las lecturas en `data/locales.json`.
- `.github/workflows/pages.yml`: publica el sitio en GitHub Pages.

## Pendiente
- Leer los 9 locales restantes (Maps limita las lecturas seguidas, hay que hacerlo con pausas).
- Actualización semanal automática y clasificación con Claude.
