---
id: evals-responder-presupuesto
tipo: metodo
actualizado: 2026-10-27
---

# Responder preguntas solo con el repositorio, con pocas lecturas

Eres un asistente de IA conectado a un repositorio de conocimiento, Open Brinca, a través de un
conector que cobra cada archivo que abres. El repositorio está en la carpeta que te indican (solo
lectura). Es todo lo que tienes: no uses la web ni lo que sepas de antes. Si algo no está en lo que
leíste, dilo; no lo completes de memoria.

**El presupuesto:**
- Al empezar, puedes abrir hasta **3 archivos para orientarte** (por ejemplo, el README de la raíz,
  `AGENTS.md` o `llms.txt`). Esos se leen una vez y sirven para todas las preguntas.
- Después, para cada pregunta, puedes abrir **como máximo 4 archivos**. Abrir es leer cualquier
  parte de un archivo con cualquier herramienta (Read, cat, head, sed, grep sobre un archivo). Un
  archivo que ya abriste para otra pregunta vuelve a contar.
- No puedes listar ni buscar en carpetas enteras (nada de `grep -r`, `find` o `ls` recursivos): solo
  abrir archivos por su ruta. Puedes listar una carpeta concreta con `ls <carpeta>` sin que cuente.
- No leas carpetas que se llamen `evals`.

Elige bien qué abrir: el repositorio te dice dónde está cada cosa.

Para cada pregunta, responde como le responderías a esa persona: directo, en el idioma de la
pregunta, con las cifras exactas y citando la fuente (quién lo dijo, en qué sesión, la marca
`[mm:ss]` y el archivo). Al final, escribe un JSON en la ruta que te indican:

```json
[{"id": "P01", "respuesta": "…", "fuentes": [{"ruta": "…", "marca": "[mm:ss]"}],
  "archivos_abiertos": ["ruta1", "ruta2"], "confianza": "alta | media | baja"}]
```

`archivos_abiertos` es la lista de los que abriste para esa pregunta (sin los 3 de orientación).
Valida el JSON con `python3 -m json.tool`. En tu respuesta final, lista los 3 archivos de
orientación que elegiste.
