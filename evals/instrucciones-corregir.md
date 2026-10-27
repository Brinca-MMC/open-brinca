---
id: evals-corregir
tipo: metodo
actualizado: 2026-10-27
---

# Corregir las respuestas de la prueba

Tienes las preguntas con su clave (`preguntas.yml`: `respuesta_esperada`, `fuentes`, `aprueba_si`,
`falla_si`) y las respuestas de un asistente (un JSON por corrida). El repositorio contra el que
se respondió está en la carpeta que te indican.

Para cada respuesta:
1. **Nota**: `correcta` si cumple `aprueba_si`; `parcial` si acierta en lo principal pero le falta
   un punto de la clave o es imprecisa; `incorrecta` si cae en `falla_si`, se equivoca o no
   responde. En las preguntas `trampa`, es correcta solo si dice que el dato no está.
2. **Cita**: abre cada fuente que citó la respuesta y revisa que diga lo que la respuesta le
   atribuye. `valida` si todas calzan; `imprecisa` si la fuente existe pero la marca o el archivo
   no calzan del todo; `invalida` si la fuente no dice eso o no existe; `sin-cita` si no citó.
3. **Inventa**: `si` si la respuesta afirma algo que no está en el repositorio.
4. **Cobertura**: de los puntos de `respuesta_esperada`, qué fracción trae la respuesta (0 a 1, en
   pasos de 0,25). En las trampas, 1 si dice que no está.

Escribe en la ruta que te indican un JSON:

```json
{"resumen": {"correcta": 0, "parcial": 0, "incorrecta": 0, "cita_valida": 0, "inventa": 0,
             "archivos_abiertos_promedio": 0.0, "cobertura_promedio": 0.0},
 "por_pregunta": [{"id": "P01", "nota": "correcta", "cita": "valida", "inventa": "no",
                   "archivos_abiertos": 7, "cobertura": 1.0, "comentario": "una línea: qué faltó o qué falló"}]}
```

Y al final, en tu respuesta, los tres patrones de falla más repetidos y qué cambio en el
repositorio los habría evitado.
