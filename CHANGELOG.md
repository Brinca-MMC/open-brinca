# Historial

Lo que cambia en Open Brinca, por versión. Las versiones llevan el año y el mes.

## Sin publicar

- **Temas, personas y estudios.** 15 temas, cada uno con los pasajes por donde entrar y sus sesiones. 50 personas, con sus sesiones en todos los eventos y sus láminas. 14 estudios con las 78 cifras que se citan en las sesiones: cada cifra dice quién la dijo, dónde, y cómo se verificó contra la publicación original.
- **Metadatos de cada sesión**: fecha, formato, speakers, idiomas, duración, video, temas y estudios. De ellos se generan las listas de sesiones, `llms.txt` y `catalogo.json` (`scripts/generar.py`), y la validación exige que estén completos.
- **Relaciones entre sesiones**: 39 aristas del grafo, con su porqué. Por ejemplo, qué sesión confirma, tensiona o reencuadra a otra.
- **Prueba**: 36 preguntas con su clave en `evals/`, para medir si un asistente responde bien con el repositorio.
- **Correcciones**:
  - una asistente que se presentó con nombre en la charla de Álvaro Fischer queda anónima;
  - el índice que cita Carolina Garlick es de CORFO, la CCS y PMG Chile, no de KPMG;
  - en el webinar de Wharton, la nota 4 ya no dice que Jeremy Korst habló al revés;
  - cuatro cifras mal dichas quedan en la transcripción como se dijeron, con la corrección en su nota;
  - se completaron dos frases cortadas.

## 2026.10

- **Impacta IA Chile 2026**: las 16 sesiones transmitidas, cada una con su ficha, su transcripción revisada y sus imágenes, más quién es quién, el programa y el glosario del evento.
- **Webinars**: «The Adaptive Advantage: Who's Winning With AI and How» (Wharton AI Horizons, 20 de octubre de 2026). Quienes preguntaron por el panel de Zoom aparecen como «un asistente».
- **Método**: el núcleo del método de grafo de Brinca (`metodo/grafo/`) y el método de transcripción (`metodo/transcripcion/`).
- **Licencias** por capa: CC BY 4.0 para lo que escribe Brinca, CC BY-NC-ND 4.0 para las transcripciones, las láminas de sus autores y MIT para el código.
- **Para colaborar**: `AGENTS.md`, `CONTRIBUTING.md`, código de conducta, formularios para corregir, para que quien habló pida un cambio y para sugerir contenido, y validación automática en cada pull request.
