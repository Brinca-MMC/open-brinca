# AGENTS.md — cómo recorrer y citar Open Brinca

Instrucciones para un agente de IA que lee este repositorio o trabaja en él. Lo que es para personas está en el [`README.md`](README.md).

## Qué es

Sesiones de eventos y webinars sobre adopción de IA, transcritas y revisadas por Brinca. Cada afirmación lleva su marca de tiempo; las cifras mal dichas están corregidas en notas contra su fuente. Las fichas están en español; las transcripciones, en el idioma en que se habló.

## Cómo está ordenado

```
eventos/<evento>/
  README.md                 índice del evento: la tabla de sesiones y cómo se hizo
  evento/personas.md        quién es quién: cargo, sesiones e imágenes de cada persona
  evento/programa.md        lo que cambió frente al programa oficial
  evento/glosario.md        nombres y términos con su grafía correcta
  sesiones/<sesión>/
    README.md               la ficha: tesis, resumen por capítulo, ideas, frases citables, láminas
    transcripcion.md        el texto completo, por turnos
    imagenes/               las láminas notables
webinars/<fecha>-<nombre>/  la misma estructura de una sesión
personas/<nombre>.md        quién es, en qué sesiones habló y qué láminas presentó
temas/<tema>.md             la lista cerrada de temas: por dónde entrar y qué sesiones lo tratan
estudios/<estudio>.md       los estudios que se citan, con sus cifras: dónde se dijo cada una y si se verificó
metodo/                     cómo se hace (transcripción y grafo)
evals/                      la prueba de preguntas con que se mide si un asistente responde bien
llms.txt                    el mapa del repositorio, una línea por documento
catalogo.json               lo mismo en JSON, con los metadatos y las cifras
```

## Cómo recorrerlo

1. **Lee el índice antes de abrir archivos.** El `README.md` de cada carpeta dice qué hay y dónde.
2. **La ficha antes que la transcripción.** La ficha resume la sesión entera en una fracción de las palabras. Baja a `transcripcion.md` solo para citar textual o para el detalle de un tramo; la marca de tiempo de la ficha te dice dónde buscar.
3. **Para un tema**, parte por `temas/README.md`. La página de cada tema lleva directo a los pasajes («Por dónde entrar») y lista las sesiones que lo tratan.
4. **Para una persona**, `personas/<nombre-apellido>.md` (sin tildes): quién es, sus sesiones en todos los eventos y sus láminas.
5. **Para una cifra**, `estudios/`. Cada cifra dice quién la dijo, dónde (con la marca) y cómo se verificó. Prefiere las verificadas contra la publicación original; si una cifra no tiene estudio, está en la ficha de su sesión y vale lo que vale quien la dijo.
6. **Para lo que se dijo a favor o en contra de una idea**, mira las `## Conexiones` de la ficha y su `## Referido por`: dicen qué sesión confirma, tensiona o refuta a otra, y por qué.
7. **Para un nombre o una sigla**, el `evento/glosario.md` tiene la grafía correcta y las variantes erradas de los subtítulos automáticos.
8. **Para filtrar por fecha, formato, persona o tema**, los metadatos de cada ficha (o `catalogo.json`, que los junta).

## Cómo citar

- Nombra a quien habló, la sesión y la marca `[mm:ss]`, y enlaza la ficha o el segundo del video (las marcas de las sesiones de Impacta ya son enlaces a YouTube).
- Para citar textual, usa `transcripcion.md`.
- Un documento sin marcas de tiempo (una página de estudio, de tema o de persona, `LICENSE.md`, `programa.md`) se cita por su ruta y su sección: el encabezado `###` de una cifra, o «cambio 22» en el programa.
- Una cifra de `estudios/` se cita con su estudio y su etiqueta de verificación: `Verificada`, `Corregida`, `Difiere`, `Preliminar`, `Solo en la sesión` o `Sin verificar`.
- Una nota `[^n]` dice que el speaker se equivocó y cuál es el dato correcto: cita el dato corregido, no el dicho.
- Lo que va en cursiva en una transcripción es un resumen de lo protocolar, no texto dicho.
- Menciona la fuente: «Open Brinca, de Brinca», con el enlace al repositorio.
- Las transcripciones no se pueden usar con fines comerciales ni modificadas; las fichas sí, con atribución. El detalle está en [`LICENSE.md`](LICENSE.md).

## El grafo

Los documentos se relacionan con aristas tipadas en una sección `## Conexiones`. Antes de recorrerlas o de escribir una, lee [`metodo/grafo/nucleo.md`](metodo/grafo/nucleo.md). El vecindario de un documento: `python3 metodo/grafo/grafo.py vecinos <ruta>`. El grafo entero, en JSON: `python3 metodo/grafo/grafo.py --json`.

## Si vas a cambiar algo

- Sigue [`CONTRIBUTING.md`](CONTRIBUTING.md): la estructura, los metadatos al inicio de cada archivo (`id`, `tipo`, `actualizado`, `tags`) y las reglas de contenido.
- Nunca publiques el nombre de quien preguntó desde el público: va como «un asistente». La excepción es quien es speaker en otra sesión del repositorio o es del equipo de Brinca.
- Los metadatos de una sesión nombran personas, temas y estudios por su slug, y cada uno tiene que tener su página. La lista de sesiones de cada página no se escribe a mano: la genera `scripts/generar.py`.
- Las imágenes van en JPG de hasta 300 KB, con el nombre de quien presentó la lámina.
- Si agregas, mueves o borras un archivo, actualiza el `README.md` de su carpeta en el mismo cambio.
- Antes de terminar, regenera lo derivado y corre las validaciones:

  ```
  python3 scripts/generar.py
  python3 scripts/validar.py
  python3 metodo/grafo/grafo.py --check
  ```
