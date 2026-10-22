---
id: metodo-transcripcion
tipo: metodo
actualizado: 2026-10-22
tags: [metodo, transcripcion]
---

# Cómo se transcribe y se revisa una sesión

> El proceso que lleva una grabación a la ficha, la transcripción y las imágenes de cada sesión: transcripción automática, separación de voces, lectura de las láminas y tres pasadas de revisión con un verificador independiente. Sirve para saber cuánto confiar en cada parte y cómo se corrige.

## Los pasos

1. **Cortar.** La grabación se corta en un clip por sesión.
2. **Transcribir.** Cada clip pasa por Whisper large-v3. Cuando el stream trae subtítulos, el idioma se fija por tramo según esos subtítulos y el texto se compara con ellos: en Impacta IA Chile 2026 la coincidencia fue de 91 % a 97 %. Los nombres y términos difíciles del glosario del evento se le dan a Whisper como contexto inicial.
3. **Separar las voces.** Las voces se separan con embeddings SpeechBrain ECAPA y se les pone nombre mirando los fotogramas del video, o el recuadro con el nombre de cada participante en un webinar de Zoom.
4. **Leer las láminas.** Las láminas se detectan y se leen plano por plano.
5. **Revisar en tres pasadas.** Un agente de IA revisa cada sesión buscando tres cosas: lo que Whisper escuchó mal, lo que quedó en un idioma distinto al hablado y lo que el speaker dijo mal. En un webinar que presenta un estudio, las cifras se contrastan además con las láminas y con el informe. El mismo agente limpia las muletillas, resume en una línea en cursiva lo protocolar (presentaciones de currículum, logística, aplausos) y elige las imágenes notables.
6. **Verificar.** Un verificador independiente, con otro modelo, revisa las correcciones, las frases citables y las imágenes. Brinca revisa las dudas que quedan.

## Qué se obtiene

- **La ficha** (`README.md`): la tesis, el resumen por capítulo y por speaker, las ideas que se llevan, las frases citables y las láminas comentadas.
- **La transcripción** (`transcripcion.md`): el texto revisado, por turnos y en el idioma en que se habló.
- **Las imágenes** (`imagenes/`): las láminas notables, con quién las presentó y en qué minuto.

## Convenciones

- `[mm:ss]` es el tiempo del clip. Cuando el video es público, la marca enlaza al segundo exacto.
- `[^n]` es una nota que dice qué dijo mal el speaker y cuál es el dato correcto, con su fuente.
- Una línea en cursiva resume algo que se dijo pero no se transcribe (protocolo, logística, audio ajeno).
- `[inaudible mm:ss]` marca un tramo que no se pudo entender.
- Quien pregunta sin ser speaker aparece como «un asistente» o `[asistente]`.

## Cuánto confiar

Las transcripciones pueden tener errores menores. Ante una cita importante, conviene contrastarla con el video en la marca que indica. Las cifras corregidas en notas ya se contrastaron con su fuente. Si encuentras un error, el camino para corregirlo está en [`CONTRIBUTING.md`](../../CONTRIBUTING.md).
