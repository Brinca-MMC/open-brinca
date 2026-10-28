---
titulo: Conectar
actualizado: 2026-10-27
---

# Conectar Open Brinca a tu asistente

Open Brinca tiene un servidor MCP público, sin login y de solo lectura. Con él, tu asistente busca en las sesiones, trae las fichas y las transcripciones, encuentra cifras con su verificación y te dice quién lo dijo, dónde y en qué minuto. La dirección es esta, y en cada asistente se agrega como un conector o servidor MCP remoto:

```
https://open.brinca.com/mcp
```

## Claude

- **Claude (web, escritorio y móvil), planes Free, Pro y Max:** *Personalizar → Conectores → Agregar conector personalizado*, pega la dirección y elige sin inicio de sesión. El plan Free admite un conector personalizado.
- **Claude Team y Enterprise:** un administrador lo agrega en *Configuración de la organización → Conectores → Agregar → Personalizado*, y después cada persona lo conecta desde *Personalizar → Conectores*.
- **El plugin**, que trae el conector y una skill que le enseña a Claude cuándo consultar Open Brinca y cómo citarlo: *Personalizar → Plugins → Agregar → Agregar marketplace*, y escribe `Brinca-MMC/open-brinca`.
- **Claude Code:**

  ```
  claude mcp add --transport http open-brinca https://open.brinca.com/mcp
  ```

  O el plugin:

  ```
  /plugin install open-brinca --marketplace Brinca-MMC/open-brinca
  ```

## ChatGPT

En [chatgpt.com/plugins](https://chatgpt.com/plugins), el botón **+** y *Add custom MCP server*: un nombre (Open Brinca), la dirección en *Server URL* y *No authentication*. Agregar un servidor propio está disponible en algunos planes de pago de ChatGPT.

## Cursor y VS Code

- **Cursor:** [instalar con un clic](cursor://anysphere.cursor-deeplink/mcp/install?name=open-brinca&config=eyJ1cmwiOiJodHRwczovL29wZW4uYnJpbmNhLmNvbS9tY3AifQ==).
- **VS Code:** [instalar con un clic](vscode:mcp/install?%7B%22name%22%3A%22open-brinca%22%2C%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fopen.brinca.com%2Fmcp%22%7D).

## Google

- **Antigravity** (app, editor y CLI): en `~/.gemini/config/mcp_config.json`,

  ```json
  {
    "mcpServers": {
      "open-brinca": { "serverUrl": "https://open.brinca.com/mcp" }
    }
  }
  ```

- **Gemini Enterprise:** un administrador lo agrega como servidor MCP personalizado, con Streamable HTTP y sin autenticación.
- **La app de Gemini** todavía no admite servidores propios desde Chile ni en español. La alternativa es subir el archivo de una colección a un Gem o a Gemini Notebook (abajo).

## Otros clientes

Cualquier cliente que acepte un servidor MCP remoto por URL, con Streamable HTTP, puede usar la dirección de arriba.

## Sin conector

- **Agentes que trabajan con archivos** (Claude Code, Codex, Cursor): clona el repositorio, y el archivo `AGENTS.md` les explica cómo recorrerlo y citar.

  ```
  git clone https://github.com/Brinca-MMC/open-brinca
  ```

- **Proyectos de Claude o ChatGPT, Gems de Gemini o Gemini Notebook:** sube el archivo de una colección, con las fichas de todas sus sesiones:
  <!-- DESCARGAS -->
- **Para un programa propio:** [`llms.txt`](/llms.txt) es el mapa del repositorio y [`catalogo.json`](/catalogo.json) trae los metadatos de cada sesión y todas las cifras. Cada página del sitio tiene su markdown en la misma ruta con `.md` al final, igual que en el repositorio.

Qué se registra de cada consulta al servidor está en [Privacidad](/privacidad).
