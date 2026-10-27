# El sitio y el servidor MCP

> El sitio `open.brinca.com` y su servidor MCP en `/mcp` se arman en cada build desde el markdown del repositorio: no hay base de datos ni contenido que se edite aparte. Lo que se cambia en las fichas, los temas o los estudios aparece en el sitio y en las respuestas del servidor con el siguiente despliegue.

## Qué hay

| Archivo | Qué hace |
|---|---|
| `scripts/preparar.mjs` | Lee el markdown del repositorio y arma en `.generado/` el contenido de cada página, el índice de búsqueda y las aristas del grafo. En `public/` deja una copia de cada `.md` en su misma ruta (el markdown crudo, para asistentes), las imágenes, las licencias, `catalogo.json`, `llms.txt` con las direcciones del sitio y un archivo descargable por colección. |
| `app/` | Las páginas (Next.js). Todas son estáticas salvo `/mcp`. |
| `app/mcp/route.ts` | El servidor MCP: Streamable HTTP, sin login. Registra cada llamada a una herramienta sin la IP (ver `paginas/privacidad.md`). |
| `lib/mcp.ts` | Las seis herramientas, todas de solo lectura: `search`, `fetch`, `list_sessions`, `list_index`, `find_figures` y `get_connections`. |
| `lib/buscar.ts` | La búsqueda por palabras (BM25) sobre fragmentos: una sección de una ficha o unos turnos de una transcripción. |
| `lib/markdown.ts` | El markdown a HTML: los enlaces entre `.md` pasan a las URLs del sitio y el código, a GitHub. |
| `paginas/` | Las páginas propias del sitio, en markdown: conectar, privacidad y soporte. |
| `lib/registro.ts` | Guarda cada consulta: en los registros de Vercel y, si hay una base Redis de Upstash, en una lista por mes. |
| `scripts/probar-mcp.mjs` | Llama a cada herramienta y revisa la respuesta. Corre en cada pull request. |
| `scripts/metricas.mjs` | El resumen de un mes de consultas. |

Las URLs siguen las rutas del repositorio sin `.md`: `temas/regulacion.md` es `/temas/regulacion`, y la carpeta de una sesión es la URL de su ficha. El id de un documento en el servidor MCP es su ruta en el repositorio.

## Correrlo en local

```
cd sitio
npm ci
npm run dev          # http://localhost:3000
npm run build && npx next start -p 3000
npm run probar -- http://localhost:3000/mcp
```

## Desplegarlo en Vercel

Un proyecto de Vercel en la cuenta de Brinca, conectado a este repositorio:

- **Root Directory:** `sitio`, con *Include files outside the root directory* activado, porque el build lee el markdown de la raíz.
- **Framework:** Next.js. **Node:** 22.
- **Dominio:** `open.brinca.com`. Vercel entrega el registro DNS que hay que crear en Cloudflare, sin proxy.
- Cada push a `main` despliega. Los pull requests tienen su vista previa.

## Las consultas

Cada llamada a una herramienta queda en los registros del proyecto en Vercel, como una línea JSON con `"evento":"consulta_mcp"`. Esos registros duran poco. Para guardarlas por mes, conecta al proyecto una base Redis de Upstash desde el marketplace de Vercel: `lib/registro.ts` la usa sola si encuentra sus variables, y cada mes se borra a los 330 días, como dice la política de privacidad. El resumen de un mes (consultas, clientes, herramientas, lo más buscado y lo más abierto):

```
npm run metricas -- 2026-11
```
