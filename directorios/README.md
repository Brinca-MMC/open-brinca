# Directorios: lo que se envía a cada uno

> Lo que hay que enviar para que Open Brinca aparezca en los directorios de Claude, de OpenAI (ChatGPT y Codex) y en el registro oficial de MCP: los textos de cada ficha, los prompts de ejemplo, los casos de prueba y lo que falta conseguir. Los requisitos se verificaron el 27 de octubre de 2026 en la documentación de cada uno y cambian seguido: hay que revisarlos de nuevo antes de enviar.

Todo esto se envía después de que `https://open.brinca.com/mcp` esté funcionando, porque cada directorio prueba el servidor.

## Lo que falta conseguir

| Qué | Para qué directorio | Quién |
|---|---|---|
| Una cuenta de Claude de pago que envíe en nombre de Brinca | Claude | Brinca |
| Una organización de Brinca verificada en OpenAI Platform, con alguien con permiso *Apps Management Write* | OpenAI | Brinca |
| Un video corto que recorra los casos de prueba con el servidor conectado | OpenAI | quien envíe |
| Un registro TXT en el dominio raíz `brinca.com` con la clave pública del registro de MCP (abajo) | Registro de MCP | TI o Pablo Ferreiro (Cloudflare) |
| El token de verificación de OpenAI, servido en `https://open.brinca.com/.well-known/openai-apps-challenge` | OpenAI | se agrega al sitio cuando el portal lo entregue |

El ícono es el isotipo de Brinca en PNG de 1024 px: [`plugin/.claude-plugin/icon.png`](../plugin/.claude-plugin/icon.png), sacado del SVG oficial. En el directorio de Claude el ícono se fija la primera vez y no se puede cambiar.

## La ficha

| Campo | Texto |
|---|---|
| Nombre | Open Brinca |
| Frase corta (OpenAI, hasta 30 caracteres) | IA en empresas, con fuentes |
| Frase (Claude, hasta 200) | Sesiones de eventos y webinars sobre adopción de IA en empresas, transcritas y revisadas por Brinca, con cifras verificadas contra su fuente y la marca de tiempo de cada afirmación. |
| Categorías | Investigación, Negocios, Educación |
| Documentación | https://open.brinca.com/conectar |
| Privacidad | https://open.brinca.com/privacidad |
| Términos (OpenAI) | https://open.brinca.com/terminos |
| Soporte | https://open.brinca.com/soporte |
| Sitio | https://open.brinca.com |
| Autenticación | ninguna: el contenido es público y el servidor solo lee |

**Descripción larga** (Claude hasta 2.000 caracteres, OpenAI hasta 4.000):

> Open Brinca es el conocimiento abierto de Brinca, consultora chilena, sobre la adopción de IA en las empresas. Reúne las sesiones de eventos y webinars, como las 16 de Impacta IA Chile 2026 y el webinar en que Wharton presentó su informe de adopción de IA 2026, transcritas y revisadas, con una ficha que resume cada una y marcas de tiempo que llevan al segundo exacto del video.
>
> Con este conector, tu asistente busca en las sesiones y trae la ficha o la transcripción completa. También puede abrir las páginas de temas, que dicen quién dijo qué sobre gobernanza, ROI, regulación, futuro del trabajo o IA industrial en todas las sesiones, y las de estudios, donde cada cifra dice dónde se dijo y si calza con la publicación original. Muestra además qué sesiones se confirman o se contradicen entre sí. Cada respuesta trae la URL para citar.
>
> El contenido está en español. Las fichas se publican bajo CC BY 4.0 y las transcripciones, bajo CC BY-NC-ND 4.0.

**Prompts de inicio** (OpenAI, hasta tres de 128 caracteres; Claude pide al menos tres de ejemplo):

1. ¿Qué se dijo en Impacta IA 2026 sobre cómo gobernar la IA en una empresa?
2. ¿Qué porcentaje de las empresas logra un ROI fuerte con la IA, según Wharton?
3. ¿En qué no coinciden los speakers sobre regular la IA en Chile?

## Casos de prueba

OpenAI pide cinco positivos y tres negativos; sirven también para probar el conector en Claude antes de enviarlo.

**Positivos:**

| Prompt | Herramientas esperadas | Lo que tiene que pasar |
|---|---|---|
| ¿Qué porcentaje de las empresas le saca provecho de verdad a la IA? | `find_figures` o `search`, después `fetch` | Responde 7 % (los managers+ que cumplen a la vez los tres marcadores del informe Wharton-GBK 2026), dice que es una encuesta a grandes empresas de EE. UU. y cita el webinar en [10:16] con su URL |
| ¿Qué se dijo sobre gobernanza de la IA en las empresas? | `search` o `fetch` de `temas/gobierno-de-la-ia.md`, después dos o tres fichas | Resume las posturas de al menos dos sesiones, con quién lo dijo y la marca de tiempo |
| ¿Quién está en contra de regular la IA ahora en Chile? | `fetch` de `temas/regulacion.md` o `get_connections` | Contrapone a Muñoz y Lever, que prefieren las normas sectoriales y la autorregulación, con Correa, que da por hecho que se va a regular |
| ¿Es cierto que casi el 60 % de las empresas con buen ROI tiene un Chief AI Officer? | `find_figures` | Explica que se dijo al revés: el 58 % de las que tienen un CAIO recién designado reporta ROI fuerte; da la etiqueta «Corregida» |
| Dame las sesiones de Stefano Puntoni | `list_sessions` | Lista la keynote de Impacta IA 2026 y el webinar de Wharton, con fecha y URL |

**Negativos:**

| Prompt | Por qué no debe usar Open Brinca o qué debe decir |
|---|---|
| ¿Cuánto ahorró Bci con su Coaching AI? | La sesión no da la cifra: tiene que decir que no está, sin inventarla |
| Escríbeme un correo para mi jefe | No tiene que ver con el contenido: no debe llamar al servidor |
| ¿Qué porcentaje de las empresas chilenas tiene un CAIO? | No hay ese dato para Chile: tiene que decirlo y, si da la cifra de Wharton, aclarar que es de EE. UU. |

## Registro oficial de MCP

[`server.json`](server.json) es la ficha. El nombre `com.brinca/open-brinca` se verifica con un registro DNS en `brinca.com`, que cubre también sus subdominios:

```bash
openssl genpkey -algorithm Ed25519 -out clave-registro-mcp.pem       # guardarla fuera del repositorio
PUBLICA="$(openssl pkey -in clave-registro-mcp.pem -pubout -outform DER | tail -c 32 | base64)"
echo "brinca.com. IN TXT \"v=MCPv1; k=ed25519; p=${PUBLICA}\""        # este registro lo crea quien maneja el DNS

PRIVADA="$(openssl pkey -in clave-registro-mcp.pem -noout -text | grep -A3 "priv:" | tail -n +2 | tr -d ' :\n')"
mcp-publisher login dns --domain brinca.com --private-key "${PRIVADA}"
mcp-publisher publish directorios/server.json
```

El registro está en versión preliminar: puede cambiar o borrar datos.

## Dónde se envía

- **Claude:** https://claude.ai/directory/manage → *Submit new* → *MCP connector*. Queda publicado como conector *Community*; Anthropic puede revisarlo y marcarlo *Verified*.
- **OpenAI:** el portal de plugins de OpenAI Platform, como plugin con servidor MCP desde el primer envío: un plugin enviado solo con skills no puede agregar un servidor después.
- **Registro de MCP:** con `mcp-publisher`, como arriba.
