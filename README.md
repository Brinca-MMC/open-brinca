# Open Brinca

> Conocimiento abierto sobre la adopción de IA en las empresas, curado por Brinca: las sesiones de eventos y webinars transcritas y revisadas, con una ficha que resume cada una, las cifras contrastadas con su fuente y una marca de tiempo que lleva al segundo exacto del video. Está hecho para leerse y para conectarlo a un asistente de IA.

## Qué hay

| Colección | Qué trae |
|---|---|
| [**Impacta IA Chile 2026**](eventos/impacta-ia-2026/README.md) | Las 16 sesiones transmitidas del evento (2 y 3 de septiembre de 2026, Fundación Chile): aperturas, keynotes, charlas y paneles, con quién es quién, el programa y un glosario |
| [**Webinars**](webinars/README.md) | Webinars sobre IA procesados con el mismo método. El primero es [«The Adaptive Advantage: Who's Winning With AI and How»](webinars/2026-10-20-wharton-adaptive-advantage/README.md) (Wharton AI Horizons, 20 de octubre de 2026), en el que Stefano Puntoni, Prasanna Tambe y Jeremy Korst presentan el informe de adopción de IA 2026 de Wharton y GBK Collective |
| [**Método**](metodo/README.md) | Cómo se transcribe y se revisa cada sesión, y el método de grafo con que se relacionan los documentos, que cualquier repositorio puede adoptar |

## Cómo está hecha cada sesión

Cada sesión es una carpeta con tres cosas:

- **`README.md`, la ficha.** La tesis, el resumen por capítulo y por speaker, las ideas que se llevan, las frases citables y las láminas comentadas. Es lo primero que conviene leer.
- **`transcripcion.md`.** El texto completo, revisado y limpio, en el idioma en que se habló, con cada voz identificada. Las notas `[^n]` marcan lo que el speaker dijo mal y cuál es el dato correcto.
- **`imagenes/`.** Las láminas notables, cada una con el nombre de quien la presentó.

Las marcas `[mm:ss]` enlazan al segundo exacto del video cuando el video es público. Las transcripciones pueden tener errores menores: ante una cita importante, conviene contrastarla con el video en esa marca.

## Úsalo con tu asistente de IA

- **Claude Code, Codex, Cursor u otro agente que trabaje con archivos.** Clona el repositorio: el archivo [`AGENTS.md`](AGENTS.md) le explica al agente cómo recorrerlo y cómo citar.

  ```
  git clone https://github.com/Brinca-MMC/open-brinca
  ```

- **Claude, ChatGPT u otro asistente que acepte un conector MCP propio.** Agrega esta dirección como conector:

  ```
  https://gitmcp.io/Brinca-MMC/open-brinca
  ```

  GitMCP es un servicio de terceros que lee este repositorio público. Los conectores propios están disponibles en algunos planes de cada asistente.

- **Proyectos de Claude o ChatGPT, Gems de Gemini o Gemini Notebook.** Sube la ficha o la carpeta de la colección que te interesa, o conecta este repositorio de GitHub a un proyecto de Claude.

## Cómo citar

> *Open Brinca*. Brinca, 2026. https://github.com/Brinca-MMC/open-brinca

Para citar a una persona, nombra a quien habló, la sesión y la marca de tiempo. Más detalle en [`LICENSE.md`](LICENSE.md) y en [`CITATION.cff`](CITATION.cff).

## Licencias

Lo que escribe Brinca (las fichas, los índices, el método) se publica bajo [CC BY 4.0](LICENSES/CC-BY-4.0.txt). Las transcripciones, bajo [CC BY-NC-ND 4.0](LICENSES/CC-BY-NC-ND-4.0.txt), con autorización de quienes hablan. Las láminas son de sus autores. El código, bajo [MIT](LICENSES/MIT.txt). El detalle está en [`LICENSE.md`](LICENSE.md).

## Correcciones y aportes

Si encuentras un error, si hablaste en una sesión y quieres corregir o retirar algo, o si quieres sugerir un evento o un webinar, sigue [`CONTRIBUTING.md`](CONTRIBUTING.md). Los cambios quedan en el [historial](CHANGELOG.md).

## Quién lo hace

[Brinca](https://www.brinca.com) es una consultora chilena, fundada en 2010, de innovación, gestión del cambio, sostenibilidad e inteligencia artificial. Organizó Impacta IA Chile 2026 con Fundación Chile y publica aquí lo que aprende de los eventos y webinars en que participa.
