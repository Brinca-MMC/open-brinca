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
metodo/                     cómo se hace (transcripción y grafo)
```

## Cómo recorrerlo

1. **Lee el índice antes de abrir archivos.** El `README.md` de cada carpeta dice qué hay y dónde.
2. **La ficha antes que la transcripción.** La ficha resume la sesión entera en una fracción de las palabras. Baja a `transcripcion.md` solo para citar textual o para el detalle de un tramo; la marca de tiempo de la ficha te dice dónde buscar.
3. **Para una persona**, parte por `evento/personas.md`: lista sus sesiones y sus imágenes.
4. **Para un nombre o una sigla**, el `evento/glosario.md` tiene la grafía correcta y las variantes erradas de los subtítulos automáticos.

## Cómo citar

- Nombra a quien habló, la sesión y la marca `[mm:ss]`, y enlaza la ficha o el segundo del video (las marcas de las sesiones de Impacta ya son enlaces a YouTube).
- Para citar textual, usa `transcripcion.md`.
- Una nota `[^n]` dice que el speaker se equivocó y cuál es el dato correcto: cita el dato corregido, no el dicho.
- Lo que va en cursiva en una transcripción es un resumen de lo protocolar, no texto dicho.
- Menciona la fuente: «Open Brinca, de Brinca», con el enlace al repositorio.
- Las transcripciones no se pueden usar con fines comerciales ni modificadas; las fichas sí, con atribución. El detalle está en [`LICENSE.md`](LICENSE.md).

## El grafo

Los documentos se relacionan con aristas tipadas en una sección `## Conexiones`. Antes de recorrerlas o de escribir una, lee [`metodo/grafo/nucleo.md`](metodo/grafo/nucleo.md). El vecindario de un documento: `python3 metodo/grafo/grafo.py vecinos <ruta>`. El grafo entero, en JSON: `python3 metodo/grafo/grafo.py --json`.

## Si vas a cambiar algo

- Sigue [`CONTRIBUTING.md`](CONTRIBUTING.md): la estructura, los metadatos al inicio de cada archivo (`id`, `tipo`, `actualizado`, `tags`) y las reglas de contenido.
- Nunca publiques el nombre de un asistente que no fue speaker: va como «un asistente».
- Las imágenes van en JPG de hasta 300 KB, con el nombre de quien presentó la lámina.
- Si agregas, mueves o borras un archivo, actualiza el `README.md` de su carpeta en el mismo cambio.
- Antes de terminar, corre las dos validaciones:

  ```
  python3 scripts/validar.py
  python3 metodo/grafo/grafo.py --check
  ```
