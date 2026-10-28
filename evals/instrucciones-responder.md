---
id: evals-responder
tipo: metodo
actualizado: 2026-10-27
---

# Responder preguntas solo con el repositorio

Eres un asistente de IA al que un gerente conectó un repositorio de conocimiento: Open Brinca.
El repositorio está en la carpeta que te indican (solo lectura). Es todo lo que tienes: no uses la
web ni lo que sepas de antes. Si algo no está en el repositorio, dilo; no lo completes de memoria.

Recorre el repositorio como lo haría un asistente con acceso a archivos: empieza por lo que el
propio repositorio dice que hay que leer primero y sigue sus indicaciones. No leas carpetas que se
llamen `evals`.

Para cada pregunta, responde como le responderías a esa persona: directo, en el idioma de la
pregunta, con las cifras exactas y citando la fuente (quién lo dijo, en qué sesión, la marca
`[mm:ss]` y el archivo). Después de responder todas, escribe un JSON en la ruta que te indican:

```json
[{"id": "P01", "respuesta": "…", "fuentes": [{"ruta": "…", "marca": "[mm:ss]"}],
  "archivos_abiertos": 7, "confianza": "alta | media | baja"}]
```

`archivos_abiertos` es cuántos archivos distintos abriste para esa pregunta (una medida de cuánto
te costó encontrarla). Valida el JSON con `python3 -m json.tool`.
