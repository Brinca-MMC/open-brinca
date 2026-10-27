---
id: evals
tipo: indice
actualizado: 2026-10-27
---

# Prueba: ¿responde bien un asistente con este repositorio?

36 preguntas que un gerente o consultor le haría a su asistente de IA teniendo solo Open Brinca, con la clave para corregirlas. Sirven para medir, antes y después de cada cambio de estructura, si un asistente encuentra lo que busca, responde bien, cita bien y no inventa.

## Qué hay

| Archivo | Qué es |
|---|---|
| [`preguntas.yml`](preguntas.yml) | Las 36 preguntas con su respuesta esperada, sus fuentes, cuándo se aprueba y cuál es el error típico. Hay 8 de cifras, 7 de quién dijo qué, 9 de síntesis entre sesiones, 6 de tensiones entre speakers, 3 de uso (licencia, cita, método) y 3 trampas cuya respuesta no está en el repositorio; dos van en inglés. |
| [`instrucciones-responder.md`](instrucciones-responder.md) | Para el asistente que responde con acceso libre a los archivos. |
| [`instrucciones-responder-presupuesto.md`](instrucciones-responder-presupuesto.md) | Para el asistente que responde abriendo como máximo 4 archivos por pregunta, como uno conectado por MCP. Es la condición que separa una estructura buena de una mala. |
| [`instrucciones-corregir.md`](instrucciones-corregir.md) | Para quien corrige: nota, validez de la cita, si inventa y cobertura de la clave. |

## Cómo se corre

1. Haz una copia del repositorio sin la carpeta `evals/`, para que quien responde no vea la clave.
2. Un asistente responde las preguntas con una de las dos instrucciones de respuesta.
3. Otro corrige con `instrucciones-corregir.md`. Si se comparan dos corridas, las corrige el mismo, pregunta por pregunta, con las dos respuestas juntas: así la vara es la misma.

## Resultados del 27 de octubre de 2026

| Corrida | Correctas | Inventa | Cobertura de la clave | Archivos por pregunta |
|---|---|---|---|---|
| Versión 2026.10, acceso libre | 36 de 36 | 0 | no se midió | 10,9 |
| Versión 2026.10, 4 archivos por pregunta | 36 de 36 | 0 | 0,90 | 2,8 |
| Esta versión, 4 archivos por pregunta | 35 de 36 (1 parcial) | 0 | 0,87 | 2,1 |
| Esta versión con las páginas de temas completas, solo síntesis y tensión (15 preguntas) | 15 de 15 | 0 | 0,92 (las dos anteriores: 0,78) | 3,7 |

Qué dicen:

- **Las fichas ya eran buenas.** Con acceso libre, un asistente acierta las 36 y no inventa nada. La diferencia está en cuánto le cuesta y en qué deja fuera.
- **Las cifras cuestan menos de la mitad** con `estudios/` y `catalogo.json`: 0,9 archivos por pregunta contra 2,4. Además, el asistente corrige errores de los speakers que las notas no marcaban, como el 75 % de PwC (es 74 %) o el índice que se atribuyó a KPMG (es de PMG Chile).
- **Las preguntas que cruzan sesiones dependen de las páginas de temas.** Con una página incompleta, el asistente deja fuera a quien no está en ella. Con «Por dónde entrar» completo, la cobertura de síntesis y tensión sube de 0,78 a 0,92 con las mismas lecturas.

Límites: cada condición se corrió una vez; las preguntas las escribió un agente que leyó el repositorio, y respondieron y corrigieron agentes del mismo modelo. Sirve para comparar versiones del repositorio, no como cifra absoluta.

Después de la prueba se agregaron los cuatro pasajes que faltaban en las páginas de temas (Puntoni en liderazgo y en IA y sociedad, Lever y el 35 % contra 13 % de Wharton en productividad, Araya en adopción). Queda pendiente que una página de tema diga siempre de qué archivo sale un dato de `estudios/` que resume.
