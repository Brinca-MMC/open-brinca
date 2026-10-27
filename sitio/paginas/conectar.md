---
titulo: Conectar
actualizado: 2026-10-27
---

# Conectar Open Brinca a tu asistente

Open Brinca tiene un servidor MCP público, sin login y de solo lectura, en `https://open.brinca.com/mcp`. Con él, tu asistente busca en las sesiones, trae las fichas y las transcripciones, encuentra cifras verificadas y te dice quién lo dijo, dónde y en qué minuto.

```
https://open.brinca.com/mcp
```

## Claude

- **Claude (web, escritorio y móvil):** en *Configuración → Conectores*, agrega un conector personalizado con la dirección de arriba.
- **Con el plugin**, que trae el conector y una skill que le enseña a Claude cuándo consultar Open Brinca y cómo citarlo: en *Personalizar → Plugins → Agregar → Agregar marketplace*, escribe `Brinca-MMC/open-brinca`.
- **Claude Code:**

  ```
  claude mcp add --transport http open-brinca https://open.brinca.com/mcp
  ```

  O con el plugin:

  ```
  /plugin marketplace add Brinca-MMC/open-brinca
  /plugin install open-brinca@open-brinca
  ```

## Otros asistentes y editores

Cualquier cliente que acepte un servidor MCP remoto por URL (Streamable HTTP) puede usar la dirección de arriba.

## Sin conector

- **Agentes que trabajan con archivos** (Claude Code, Codex, Cursor): clona el repositorio, y el archivo `AGENTS.md` les explica cómo recorrerlo y citar.

  ```
  git clone https://github.com/Brinca-MMC/open-brinca
  ```

- **Proyectos de Claude o ChatGPT, Gems de Gemini o Gemini Notebook:** sube el archivo de una colección, con las fichas de todas sus sesiones:
  <!-- DESCARGAS -->
- **Para un programa propio:** [`llms.txt`](/llms.txt) es el mapa del repositorio y [`catalogo.json`](/catalogo.json) trae los metadatos de cada sesión y todas las cifras. Cada página del sitio tiene su markdown en la misma ruta con `.md` al final, igual que en el repositorio.
