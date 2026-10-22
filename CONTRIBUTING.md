# Cómo aportar a Open Brinca

Open Brinca lo cura y lo mantiene Brinca, y recibe tres clases de aporte: correcciones, pedidos de quien habló en una sesión y sugerencias de contenido. Cada una tiene su formulario en [Issues](https://github.com/Brinca-MMC/open-brinca/issues/new/choose).

## Corregir un error

Un nombre mal escrito, una frase que Whisper escuchó mal, una cita atribuida a otra persona o una cifra que no calza con su fuente. Abre un issue con el formulario **Corrección** y di dónde está (el archivo y la marca de tiempo), qué dice, qué debería decir y cómo lo sabes. Si prefieres hacer el cambio tú, abre un pull request con la misma información.

## Si hablaste en una sesión

Puedes pedir que se corrija lo que dijiste, que se retire un fragmento o que se retire la sesión entera. Usa el formulario **Pedido de quien habló**. Si prefieres no hacerlo en público, escríbele a Brinca desde [brinca.com](https://www.brinca.com). Los pedidos de quienes hablaron se atienden antes que cualquier otro cambio.

## Sugerir un evento o un webinar

Usa el formulario **Sugerir contenido**. Solo entra lo que tiene autorización de quienes hablan para publicarse.

## Reglas del contenido

- **Autorización.** Se publica solo lo que quienes hablan autorizaron a difundir. La licencia de cada parte está en [`LICENSE.md`](LICENSE.md).
- **Asistentes.** Quien hace una pregunta desde el público o por el chat, sin ser speaker, aparece como «un asistente». Su nombre no se publica.
- **Cifras.** Una cifra que se dijo mal se transcribe como se dijo y se corrige en una nota `[^n]` con su fuente.
- **Estructura.** Cada sesión es una carpeta con su `README.md` (la ficha), su `transcripcion.md` y sus `imagenes/`. El detalle está en [`AGENTS.md`](AGENTS.md) y el método completo, en [`metodo/transcripcion/`](metodo/transcripcion/README.md).
- **Metadatos.** Cada archivo de `eventos/`, `webinars/` y `metodo/` empieza con un bloque YAML con `id` (único), `tipo` y `actualizado`; las fichas llevan también `tags`.
- **Imágenes.** JPG de hasta 300 KB. El nombre del archivo dice la marca de tiempo, quién la presentó y de qué trata: `24m32-prasanna-tambe-65-percent-people-and-processes.jpg`.
- **Mapas al día.** Si agregas, mueves o borras un archivo, actualiza el `README.md` de su carpeta en el mismo cambio.
- **Relaciones.** Una relación entre documentos se escribe con la sintaxis de [`metodo/grafo/nucleo.md`](metodo/grafo/nucleo.md).

## Antes de abrir un pull request

Corre las dos validaciones, que también corren solas en cada pull request:

```
python3 scripts/validar.py
python3 metodo/grafo/grafo.py --check
```

La primera revisa los metadatos, los enlaces internos y el peso de las imágenes. La segunda, las relaciones entre documentos. Las dos necesitan Python 3.11 o posterior, sin librerías externas.

## Conducta

Este es un espacio de trabajo profesional. Se aplica el [código de conducta](CODE_OF_CONDUCT.md).
