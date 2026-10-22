---
id: metodo-grafo
tipo: indice
actualizado: 2026-10-21
tags: [grafo, gestion-del-conocimiento]
---

# Método de grafo de Brinca

> Una forma de escribir, dentro de los mismos archivos markdown, cómo se relacionan los documentos entre sí, para que personas y agentes de IA recorran el conocimiento por sus relaciones y no solo por carpetas. No necesita base de datos: se lee con `grep` y lo mantiene un script.

Brinca lo usa en su repositorio de trabajo y en este. Cualquier repositorio lo puede adoptar.

## Qué hay en esta carpeta

| Archivo | Qué es | Cuándo leerlo |
|---|---|---|
| [`nucleo.md`](nucleo.md) | La sintaxis de una arista y el vocabulario común: 26 relaciones con su definición y su diferencia con las vecinas | Antes de escribir o recorrer aristas |
| [`grafo.py`](grafo.py) | El script que genera las secciones `## Referido por` y valida enlaces y vocabulario | Al terminar de escribir aristas; también en la integración continua |

## Cómo se ve

Cada documento puede llevar una sección `## Conexiones`, con una arista por línea:

```
- `tensiona` [Panel de gobernanza](../panel-gobernanza/README.md) · [09:26] · plantea que la IA no se puede encerrar en reglas fijas, contra el control previo que defiende este documento.
```

El tipo dice cómo se relacionan los dos documentos y el porqué dice en qué. El documento de destino muestra la relación en su sección `## Referido por`, que genera `grafo.py`.

## Cómo adoptarlo en otro repositorio

1. Copia `nucleo.md` y `grafo.py` juntos a una carpeta del repositorio. No edites `nucleo.md`: es el vocabulario común.
2. Si necesitas palabras propias, créalas en un diccionario local con el formato que explica `nucleo.md` y declara su ruta en un archivo `.grafo.toml` en la raíz del repositorio:

   ```toml
   locales = ["docs/grafo-local.md"]   # tus palabras propias
   raices  = ["docs", "notas"]         # qué carpetas recorre; por defecto, todo el repositorio
   excluir = ["borradores"]            # carpetas que no recorre
   ```

3. Escribe aristas en la sección `## Conexiones` de cada documento donde la relación aporte.
4. Corre `python3 <carpeta>/grafo.py` para generar las secciones `## Referido por`. En la integración continua, `python3 <carpeta>/grafo.py --check` falla si hay enlaces rotos, tipos sin declarar o secciones desactualizadas.
5. Agrega una línea al `AGENTS.md` del repositorio para que los agentes lean el núcleo antes de recorrer el grafo.

Necesita Python 3.11 o posterior y no usa librerías externas.

## Consultar el grafo desde otro programa

`grafo.py` también responde consultas sin escribir nada, para que un visor, un servidor o un agente lean el grafo sin reimplementar la sintaxis:

- `python3 <carpeta>/grafo.py --json` entrega el grafo entero: los documentos que tienen aristas, con su título y su resumen; cada arista con origen, tipo, destino, lugar exacto, porqué y estado; y el vocabulario declarado.
- `python3 <carpeta>/grafo.py vecinos <ruta>` muestra lo que sale de un documento y lo que le llega. Con `--json`, lo mismo en JSON.

## Licencia

El texto de esta carpeta se publica bajo [Creative Commons Atribución 4.0](https://creativecommons.org/licenses/by/4.0/deed.es): se puede usar y adaptar citando «Método de grafo de Brinca» con un enlace a este repositorio. `grafo.py` se publica bajo licencia [MIT](https://opensource.org/license/mit).

## Versión

1.0, del 21 de octubre de 2026. El historial está al final de [`nucleo.md`](nucleo.md).
