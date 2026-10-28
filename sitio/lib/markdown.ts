// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Brinca
//
// Markdown del repositorio a HTML del sitio. Los enlaces relativos entre .md pasan a las URLs del
// sitio; las imágenes y los archivos de datos, a su copia en public/; el código, a GitHub.

import path from "node:path";
import { Marked } from "marked";
import { GITHUB, urlAbsoluta, docPorRuta } from "./contenido";

const IMAGEN = /\.(jpe?g|png|webp|gif|svg)$/i;
const PUBLICO = /\.(txt|json|yml|yaml|cff)$/i;

/** El ancla que GitHub le da a un encabezado, para que los enlaces con # sigan funcionando. */
export function ancla(texto: string): string {
  return texto.trim().toLowerCase().replace(/<[^>]+>/g, "").replace(/[^\p{L}\p{N}\- _]/gu, "").replace(/ /g, "-");
}

export function urlDeRuta(ruta: string): string {
  let u = "/" + ruta.replace(/\.md$/, "");
  if (u === "/README") return "/";
  return u.replace(/\/README$/, "");
}

function resolver(href: string, desde: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("#") || href.startsWith("/")) return href;
  const [p, frag] = href.split("#");
  const ruta = path.posix.normalize(path.posix.join(path.posix.dirname(desde), decodeURI(p)));
  const hash = frag ? "#" + frag : "";
  if (ruta.endsWith(".md")) return urlDeRuta(ruta) + hash;
  if (IMAGEN.test(ruta) || PUBLICO.test(ruta)) return "/" + ruta;
  if (ruta.endsWith("/") || !path.posix.extname(ruta)) {
    const readme = ruta.replace(/\/$/, "") + "/README.md";
    if (docPorRuta(readme)) return urlDeRuta(readme) + hash;
  }
  return GITHUB + ruta + hash; // código y configuración: se ven en GitHub
}

/** Notas al pie `[^n]`: marked no las trae, así que se arman aquí. */
function notas(md: string): string {
  const defs: string[] = [];
  md = md.replace(/^\[\^([\w-]+)\]: (.+)$/gm, (_, n, texto) => {
    defs.push(`<li id="nota-${n}">${texto} <a href="#ref-${n}" class="volver" aria-label="volver">↩</a></li>`);
    return "";
  });
  // Fuera del código: un `[^n]` de ejemplo dentro de backticks se deja tal cual.
  md = md
    .split(/(```[\s\S]*?```|`[^`\n]*`)/)
    .map((trozo, i) => (i % 2 ? trozo : trozo.replace(/\[\^([\w-]+)\]/g, (_, n) => `<sup id="ref-${n}" class="ref"><a href="#nota-${n}">${n}</a></sup>`)))
    .join("");
  return defs.length ? md + `\n\n<section class="notas"><h2>Notas</h2><ol>\n${defs.join("\n")}\n</ol></section>\n` : md;
}

export function render(md: string, desde: string): string {
  const vistos = new Map<string, number>();
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        let id = ancla(html);
        const n = vistos.get(id) ?? 0;
        vistos.set(id, n + 1);
        if (n) id = `${id}-${n}`;
        return `<h${depth} id="${id}"><a class="ancla" href="#${id}" aria-hidden="true">#</a>${html}</h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const url = resolver(href, desde);
        const externo = /^https?:/.test(url) && !url.startsWith("https://open.brinca.com");
        const t = title ? ` title="${title}"` : "";
        return `<a href="${url}"${t}${externo ? ' rel="noopener"' : ""}>${this.parser.parseInline(tokens)}</a>`;
      },
      image({ href, title, text }) {
        const url = resolver(href, desde);
        return `<img src="${url}" alt="${text.replace(/"/g, "&quot;")}" loading="lazy"${title ? ` title="${title}"` : ""}>`;
      },
    },
  });
  const limpio = md.replace(/<!--[\s\S]*?-->/g, "");
  const html = marked.parse(notas(limpio), { async: false }) as string;
  return html
    .replace(/<table>/g, '<div class="tabla"><table>')
    .replace(/<\/table>/g, "</table></div>")
    // «28 %» no se corta en dos líneas (solo en el texto, no dentro de las etiquetas).
    .replace(/>([^<]*)</g, (_, t) => ">" + t.replace(/(\d) %/g, "$1&nbsp;%") + "<");
}

export { urlAbsoluta };
