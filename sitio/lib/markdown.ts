// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Brinca
//
// Markdown del repositorio a HTML del sitio. Los enlaces relativos entre .md pasan a las URLs del
// sitio; las imágenes y los archivos de datos, a su copia en public/; el código, a GitHub.

import path from "node:path";
import { Marked } from "marked";
import { GITHUB, urlAbsoluta, docPorRuta } from "./contenido";
import { icono } from "./iconos";

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

// Las evidencias de una síntesis: cada punto bajo una hipótesis empieza con su relación (A favor,
// En contra, Matiz, Límite, Se desprende) y, si la tiene, su clase (dato, opinión, caso, modelo).
const RELACIONES: Record<string, { clase: string; icono: string }> = {
  "a favor": { clase: "favor", icono: "circle-check" },
  "en contra": { clase: "contra", icono: "circle-x" },
  matiz: { clase: "matiz", icono: "scale" },
  "límite": { clase: "limite", icono: "triangle-alert" },
  "se desprende": { clase: "desprende", icono: "lightbulb" },
};
const CLASES: [RegExp, string][] = [
  [/sin publicar/, "flask-conical"],
  [/caso/, "building-2"],
  [/modelo/, "calculator"],
  [/opini/, "message-square-quote"],
  [/dato/, "chart-column"],
];

function evidencias(html: string): string {
  const conEvidencias = html.replace(/<ul>\n((?:<li><strong>[^<]+<\/strong>[\s\S]*?<\/li>\n)+)<\/ul>/g, (bloque, items: string) => {
    const tarjetas = items.replace(/<li><strong>([^<]+?)\.<\/strong>\s*([\s\S]*?)<\/li>/g, (todo, etiqueta: string, texto: string) => {
      const [rel, ...resto] = etiqueta.split(",").map((x) => x.trim());
      const r = RELACIONES[rel.toLowerCase()];
      if (!r) return todo;
      const clase = resto.join(", ");
      const iconoClase = clase ? (CLASES.find(([re]) => re.test(clase.toLowerCase()))?.[1] ?? "file-text") : null;
      const chip = clase ? `<span class="ev-clase">${icono(iconoClase!)}${clase[0].toUpperCase()}${clase.slice(1)}</span>` : "";
      return `<li class="ev ev-${r.clase}"><div class="ev-cabeza"><span class="ev-rel">${icono(r.icono)}${rel}</span>${chip}</div><div class="ev-texto">${texto}</div></li>`;
    });
    return tarjetas === items ? bloque : `<ul class="evidencias">\n${tarjetas}</ul>`;
  });
  // «## 3. Medir…» lleva su número como distintivo.
  return conEvidencias.replace(/<h2 id="([^"]+)"><a class="ancla"([^>]*)>#<\/a>(\d+)\. /g, '<h2 id="$1" class="hipotesis"><a class="ancla"$2>#</a><span class="num">$3</span>');
}

/** En una transcripción, cada turno lleva un ancla con su marca: `#t-13-39`. */
function anclasDeTurno(md: string): string {
  return md.replace(/^\*\*\[(\d+:\d\d(?::\d\d)?)\]/gm, (todo, marca: string) => `<a id="t-${marca.replace(/:/g, "-")}"></a>${todo}`);
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
  let limpio = md.replace(/<!--[\s\S]*?-->/g, "");
  if (desde.endsWith("transcripcion.md")) limpio = anclasDeTurno(limpio);
  const html = (marked.parse(notas(limpio), { async: false }) as string)
    .replace(/<table>/g, '<div class="tabla"><table>')
    .replace(/<\/table>/g, "</table></div>")
    // «28 %» no se corta en dos líneas (solo en el texto, no dentro de las etiquetas).
    .replace(/>([^<]*)</g, (_, t) => ">" + t.replace(/(\d) %/g, "$1&nbsp;%") + "<");
  return desde.startsWith("sintesis/") ? evidencias(html) : html;
}

export { urlAbsoluta };
