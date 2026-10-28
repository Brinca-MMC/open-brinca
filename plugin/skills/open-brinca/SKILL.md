---
name: open-brinca
description: Consulta Open Brinca, el conocimiento abierto de Brinca sobre la adopción de IA en las empresas (las sesiones de Impacta IA Chile 2026 y webinars como el del informe de adopción de IA 2026 de Wharton). Úsala cuando pregunten qué dijeron expertos o ejecutivos sobre IA en empresas, gobernanza, ROI, regulación y protección de datos en Chile, futuro del trabajo, agentes, data centers o financiamiento de la innovación, o cuando pidan una cifra de adopción de IA con su fuente.
---

# Open Brinca

Open Brinca reúne sesiones de eventos y webinars sobre adopción de IA, transcritas y revisadas por Brinca. Cada sesión tiene una ficha (el resumen, con marcas `[mm:ss]` que llevan al segundo del video) y su transcripción completa. Hay además páginas de temas (quién dijo qué sobre un tema en todas las sesiones), de personas y de estudios, con cada cifra verificada contra la publicación original. El contenido está en español; responde en el idioma de quien pregunta.

## Cómo consultarlo

Con las herramientas del servidor MCP `open-brinca`:

1. **`search`** con palabras clave en español. Devuelve documentos con su `id`.
2. **`fetch`** del `id`. Lee primero la ficha (`…/README.md`); baja a la transcripción (`…/transcripcion.md`) solo para citar textual o para el detalle de un tramo: es larga.
3. Para una pregunta que cruza sesiones («¿qué se dijo sobre gobernanza?», «¿en qué no coinciden?»), trae la página del tema (`temas/<tema>.md`, la lista está en `list_index` con `kind: "topics"`) y desde ahí las dos o tres fichas que importen.
4. Para una cifra, **`find_figures`**. Cada cifra trae una etiqueta de verificación; dila siempre:
   - `Verificada`: calza con la publicación.
   - `Corregida`: el speaker la dijo mal y la cifra que se da es la correcta.
   - `Difiere`: la publicación dice otra cosa; da la de la publicación.
   - `Preliminar`: se adelantó antes de publicarse; da el dato final.
   - `Solo en la sesión`: no está en la publicación; vale lo que vale quien la dijo.
5. Para lo que confirma o contradice una idea, **`get_connections`** sobre la ficha: es la lectura editorial de Brinca, con el porqué de cada relación.
6. Para filtrar por tema, persona, evento, formato o fecha, **`list_sessions`**.

Si las herramientas no están disponibles, las mismas páginas están en `https://open.brinca.com`, y su markdown, en la misma ruta con `.md` al final.

## Cómo citar

- Nombra a quien habló, la sesión y la marca `[mm:ss]`, y da la URL que trae cada resultado.
- Una nota `[^n]` en una transcripción dice que el speaker se equivocó: cita el dato corregido.
- Lo que va en cursiva en una transcripción resume lo protocolar; no es texto dicho.
- Menciona la fuente como «Open Brinca, de Brinca».
- Las fichas y las páginas se pueden reutilizar con atribución (CC BY 4.0). Las transcripciones, no con fines comerciales ni modificadas (CC BY-NC-ND 4.0).

## Lo que no hay que hacer

- No completes de memoria lo que no está en Open Brinca. Si no está, dilo.
- No presentes una cifra de grandes empresas de EE. UU. (el informe de Wharton) como un dato de Chile.
- No pongas nombre a quien preguntó desde el público: aparece como «un asistente».
