---
titulo: Privacidad
actualizado: 2026-10-27
---

# Privacidad

Open Brinca no pide cuenta ni login, no usa cookies y no tiene herramientas de analítica en el sitio. Lo único que Brinca registra son las consultas que los asistentes de IA le hacen al servidor MCP, para saber cómo se usa el repositorio y mejorarlo.

## Quién es responsable

Brinca, consultora chilena con sede en Santiago ([brinca.com](https://www.brinca.com)), que cura y mantiene Open Brinca.

## Qué registramos del servidor MCP

Cada vez que un asistente usa una herramienta de `https://open.brinca.com/mcp`, guardamos:

- la herramienta que usó (por ejemplo, `search` o `fetch`) y sus argumentos: el texto que se buscó o el documento que se pidió;
- el nombre y la versión del cliente, si el asistente los envía (por ejemplo, el nombre de la aplicación);
- el agente de usuario de la petición, recortado;
- la fecha y la hora, si la respuesta salió bien y cuánto tardó.

No guardamos en esos registros la dirección IP, el nombre, el correo ni la cuenta de quien pregunta. Tampoco recibimos tu conversación con el asistente: solo lo que el asistente envía al llamar la herramienta. Aun así, no escribas datos personales en una pregunta que va a buscar en Open Brinca.

## Para qué

- Medir cuánto se usa Open Brinca, desde qué asistentes y qué temas se buscan.
- Encontrar lo que se busca y no está, para agregarlo, y mejorar la búsqueda.
- Publicar estadísticas agregadas, que nunca permiten identificar una consulta individual.

No vendemos ni compartimos los registros, y no los usamos para entrenar modelos.

## Cuánto tiempo

Los registros de consultas se guardan como máximo 12 meses. Las estadísticas agregadas se pueden conservar sin plazo.

## El proveedor del sitio

El sitio y el servidor corren en Vercel. Como cualquier servicio web, Vercel procesa datos técnicos de cada petición, como la dirección IP, para entregar las páginas y protegerlas de abusos, según su propia [política de privacidad](https://vercel.com/legal/privacy-policy). Brinca no usa esos datos para identificar a nadie.

## Tus derechos

Puedes preguntar qué datos tuyos tenemos y pedir que se corrijan o se borren, según la ley chilena de protección de datos personales. Escríbenos desde [brinca.com](https://www.brinca.com). Para un pedido sobre lo que dijiste en una sesión, sigue lo que dice la página de [soporte](/soporte).

## Cambios

Si esta política cambia, la fecha de arriba cambia, y el detalle queda en el [historial del repositorio](https://github.com/Brinca-MMC/open-brinca/commits/main/sitio/paginas/privacidad.md).
