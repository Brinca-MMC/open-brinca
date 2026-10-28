// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Brinca
//
// Markdown del repositorio a HTML del sitio. Los enlaces relativos entre .md pasan a las URLs del
// sitio; las imágenes y los archivos de datos, a su copia en public/; el código, a GitHub. Además:
// lo que solo sirve al repositorio no se muestra, la idea va primero, las relaciones del grafo se
// leen como las tarjetas de la síntesis y cada minuto lleva a su turno en la transcripción. El
// markdown no cambia: GitHub, llms.txt y el servidor MCP lo siguen viendo completo.

import path from "node:path";
import { Marked } from "marked";
import { DOCS, GITHUB, GRAFO, coleccion, docPorRuta, lista, urlAbsoluta, type Arista, type Doc } from "./contenido";
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

export const escapar = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

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

// Un enlace cuyo texto es un minuto o un tramo («13:39», «00:03–01:26») es una marca de tiempo.
const TIEMPO = /^\d{1,2}:\d\d(?::\d\d)?(?:[–-]\d{1,2}:\d\d(?::\d\d)?)?$/;

/** Un parser con los enlaces resueltos desde `desde`. `vistos` lleva las anclas ya usadas. */
function crearMarked(desde: string, vistos = new Map<string, number>()): Marked {
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        let id = ancla(html);
        const n = vistos.get(id) ?? 0;
        vistos.set(id, n + 1);
        if (n) id = `${id}-${n}`;
        return `<h${depth} id="${id}"><a class="ancla" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${html}</h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const url = resolver(href, desde);
        const externo = /^https?:/.test(url) && !url.startsWith("https://open.brinca.com");
        const t = title ? ` title="${title}"` : "";
        const texto = this.parser.parseInline(tokens);
        const marca = TIEMPO.test(texto) ? ' class="marca"' : "";
        return `<a${marca} href="${url}"${t}${externo ? ' rel="noopener"' : ""}>${texto}</a>`;
      },
      image({ href, title, text }) {
        const url = resolver(href, desde);
        return `<img src="${url}" alt="${text.replace(/"/g, "&quot;")}" loading="lazy"${title ? ` title="${title}"` : ""}>`;
      },
    },
  });
  return marked;
}

const enLinea = (md: string, desde = "") => crearMarked(desde).parseInline(md) as string;

/** Notas al pie `[^n]`: marked no las trae, así que se arman aquí. Devuelve el texto y las notas. */
function notas(md: string): [string, string[]] {
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
  return [md, defs];
}

/**
 * En una transcripción, cada turno lleva un ancla con su marca: `#t-13-39`, y también la línea en
 * cursiva de lo protocolar (`*[00:03–00:25] …*`). Sin video, la marca enlaza a su turno; las que
 * quedan entre corchetes (las de lo protocolar, las de los títulos) pasan a ser enlaces al suyo.
 */
function anclasDeTurno(md: string): string {
  const ids = new Set<string>();
  const idDe = (marca: string) => `t-${marca.split("–")[0].replace(/:/g, "-")}`;
  return md
    .replace(/^\*\*\[(\d+:\d\d(?::\d\d)?)\](\(?)/gm, (_, marca: string, abre: string) => {
      const id = idDe(marca);
      ids.add(id);
      return `<a id="${id}"></a>**[${marca}]${abre || `(#${id})`}`;
    })
    .replace(/^\*\[(\d+:\d\d(?::\d\d)?)[–\]]/gm, (todo, marca: string) => {
      const id = idDe(marca);
      if (ids.has(id)) return todo;
      ids.add(id);
      return `<a id="${id}"></a>${todo}`;
    })
    .replace(/\[(\d+:\d\d(?::\d\d)?(?:–\d+:\d\d(?::\d\d)?)?)\](?!\()/g, (_, marca: string) => `[${marca}](#${idDe(marca)})`);
}

// El lede de una transcripción explica la notación del markdown (`[mm:ss]`, `[^n]`), que el sitio
// no muestra: esas frases quedan en el .md.
const NOTACION = /(?<=^|\. )[^.\n]*`\[(?:mm:ss|\^[\w-]+)\]`[^.\n]*\.(?: |$)/gm;

// ── Secciones ────────────────────────────────────────────────────────────────────────────────

type Seccion = { titulo: string; md: string };

/** Parte el markdown en la cabeza (h1 y lede) y una sección por cada `## `, sin mirar dentro del código. */
function partir(md: string): Seccion[] {
  const out: Seccion[] = [{ titulo: "", md: "" }];
  let codigo = false;
  for (const linea of md.split("\n")) {
    if (/^\s*```/.test(linea)) codigo = !codigo;
    if (!codigo && linea.startsWith("## ")) out.push({ titulo: linea.slice(3).trim(), md: "" });
    out[out.length - 1].md += linea + "\n";
  }
  return out;
}

// Lo que solo sirve a quien trabaja en el repositorio: sigue en el .md, en llms.txt y en el MCP.
const SOLO_REPO = ["Archivos", "Menciones a Brinca", "Cómo leer esta carpeta", "Cómo se hizo"];
// Las secciones del grafo se arman desde las aristas, como tarjetas.
const DEL_GRAFO = ["Conexiones", "Referido por"];

// ── El grafo como tarjetas ───────────────────────────────────────────────────────────────────

type Tipo = { verbo: string; clase: string; icono: string };
const T = (verbo: string, clase: string, ic: string): Tipo => ({ verbo, clase, icono: ic });
// Las relaciones de estructura (de dónde sale un documento, qué continúa) son neutras: el azul de
// «se desprende» queda para las conclusiones de una síntesis.
const estructura = (verbo: string) => T(verbo, "neutro", "corner-down-right");
const neutro = (verbo: string) => T(verbo, "neutro", "link");

// El verbo es el que escribió el origen. En «Referido por» va después del título del origen, que
// es quien hace la acción: «The Adaptive Advantage · sustituye».
const TIPOS: Record<string, Tipo> = {
  confirma: T("Confirma", "favor", "circle-check"),
  sostiene: T("Sostiene", "favor", "circle-check"),
  verifica: T("Verifica", "favor", "badge-check"),
  tensiona: T("Tensiona", "contra", "circle-x"),
  refuta: T("Refuta", "contra", "circle-x"),
  corrige: T("Corrige", "contra", "circle-x"),
  reencuadra: T("Reencuadra", "matiz", "scale"),
  "sustituye-a": T("Sustituye a", "matiz", "replace"),
  restringe: T("Restringe", "limite", "triangle-alert"),
  "restringida-por": T("Restringida por", "limite", "triangle-alert"),
  complementa: T("Complementa", "neutro", "puzzle"),
  "analogo-a": T("Análogo a", "neutro", "equal-approximately"),
  informa: neutro("Informa"),
  revela: neutro("Revela"),
  aplica: neutro("Aplica"),
  mide: neutro("Mide"),
  "deriva-de": estructura("Deriva de"),
  origina: estructura("Origina"),
  continua: estructura("Continúa"),
  profundiza: estructura("Profundiza"),
  comprime: estructura("Comprime"),
  usa: estructura("Usa"),
  alimenta: estructura("Alimenta"),
  "depende-de": estructura("Depende de"),
  contiene: estructura("Contiene"),
  "pertenece-a": estructura("Pertenece a"),
};
const ORDEN = ["favor", "contra", "matiz", "limite", "neutro"];

const tipoDe = (slug: string): Tipo => TIPOS[slug] ?? neutro(slug[0].toUpperCase() + slug.slice(1).replace(/-/g, " "));

/** El turno de una sesión en su transcripción, si la tiene. */
function alTurno(sesion: Doc | undefined, inicio: string): string | null {
  if (sesion?.tipo !== "sesion") return null;
  const t = docPorRuta(sesion.ruta.replace(/README\.md$/, "transcripcion.md"));
  return t && t.ruta !== sesion.ruta ? `${t.url}#t-${inicio.replace(/:/g, "-")}` : null;
}

/** Una marca de tiempo sin corchetes: enlace al turno o, si no hay transcripción, solo el texto. */
function marca(sesion: Doc | undefined, inicio: string, fin?: string): string {
  const texto = fin ? `${inicio}–${fin}` : inicio;
  const href = alTurno(sesion, inicio);
  return href ? `<a class="marca" href="${href}">${texto}</a>` : `<span class="marca">${texto}</span>`;
}

// Una marca suelta en el texto: «[13:39]», «[00:03–01:26]» o varias en un corchete, «[13:30, 27:15]».
const HORA = String.raw`\d{1,2}:\d\d(?::\d\d)?`;
const MARCA = new RegExp(String.raw`\[(${HORA}(?:–${HORA})?(?:, ${HORA}(?:–${HORA})?)*)\]`, "g");
const marcas = (sesion: Doc | undefined, lista: string) =>
  lista
    .split(", ")
    .map((m) => marca(sesion, ...(m.split("–") as [string, string?])))
    .join(", ");

/** Quienes hablan en una sesión, por su nombre, para saber de cuál es una marca suelta. */
function nombres(d: Doc | undefined): string[] {
  if (d?.tipo !== "sesion") return [];
  return [...lista(d.meta.speakers), ...lista(d.meta.modera)]
    .map((s) => docPorRuta(`personas/${s}.md`))
    .map((p) => (p ? String(p.meta.nombre || p.titulo) : ""))
    .filter(Boolean);
}

/**
 * Las marcas sueltas en el porqué de una arista: el locus va en el destino, pero el porqué cita
 * minutos de las dos sesiones. Cada marca va a la sesión de la última persona nombrada antes de
 * ella; si no se nombra a nadie, a la del origen.
 */
function marcasDelPorque(html: string, a: Arista): string {
  const lados = [docPorRuta(a.origen), docPorRuta(a.destino)].filter((d) => d?.tipo === "sesion") as Doc[];
  return html.replace(MARCA, (_, lista: string, pos: number) => {
    const antes = html.slice(0, pos);
    let mejor = lados[0];
    let donde = -1;
    for (const d of lados) {
      const i = Math.max(-1, ...nombres(d).map((n) => antes.lastIndexOf(n)));
      if (i > donde) [mejor, donde] = [d, i];
    }
    return marcas(mejor, lista);
  });
}

/** Título de un documento para nombrarlo desde otro: sin « · colección» en las sesiones. */
function tituloDe(d: Doc): string {
  if (d.meta.titulo) return escapar(String(d.meta.titulo));
  return enLinea(d.tipo === "sesion" ? d.titulo.replace(" · " + coleccion(d), "") : d.titulo);
}

/** Una arista que sale, como tarjeta: relación y minuto (en el destino), título del destino y por qué. */
function tarjeta(a: Arista): string {
  const t = tipoDe(a.tipo);
  const otro = docPorRuta(a.destino);
  const tiempo = a.locus?.match(/^\[(\d{1,2}:\d\d(?::\d\d)?)(?:[–-](\d{1,2}:\d\d(?::\d\d)?))?\]$/);
  const locus = tiempo
    ? marca(otro, tiempo[1], tiempo[2])
    : a.locus
      ? `<span class="marca">${escapar(a.locus.replace(/^\[|\]$/g, ""))}</span>`
      : "";
  const md = a.porque.trim().replace(/^\p{Ll}/u, (c) => c.toUpperCase());
  const porque = md ? marcasDelPorque(enLinea(md, a.origen), a) : "";
  return (
    `<li class="ev ev-${t.clase}"><div class="ev-cabeza"><span class="ev-rel">${icono(t.icono)}${t.verbo}</span>${locus}</div>` +
    `<div class="ev-texto"><a class="ev-destino" href="${otro ? otro.url : urlDeRuta(a.destino)}">${enLinea(a.titulo_destino, a.origen)}</a>${porque}</div></li>`
  );
}

const ordenar = (xs: Arista[]) =>
  xs
    .map((a, i) => ({ a, i, o: ORDEN.indexOf(tipoDe(a.tipo).clase) }))
    .sort((x, y) => x.o - y.o || x.i - y.i)
    .map((x) => x.a);

const h2 = (id: string, titulo: string) => `<h2 id="${id}"><a class="ancla" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${titulo}</h2>\n`;

/** «Conexiones»: lo que sale de un documento, una tarjeta por arista. */
function conexiones(ruta: string): string {
  const xs = GRAFO.filter((a) => a.origen === ruta);
  return xs.length ? h2("conexiones", "Conexiones") + `<ul class="evidencias">\n${ordenar(xs).map(tarjeta).join("\n")}\n</ul>\n` : "";
}

/**
 * «Referido por»: lo que llega, una línea por documento de origen, con su título y después lo que
 * hace (« · confirma»). El por qué y el minuto quedan en la página de origen.
 */
function referidoPor(ruta: string, excluir?: Arista): string {
  const porOrigen = new Map<string, Arista[]>();
  for (const a of ordenar(GRAFO.filter((a) => a.destino === ruta && a !== excluir))) porOrigen.set(a.origen, [...(porOrigen.get(a.origen) ?? []), a]);
  if (!porOrigen.size) return "";
  const lineas = [...porOrigen].map(([origen, xs]) => {
    const d = docPorRuta(origen);
    const verbos = xs.map((a) => {
      const t = tipoDe(a.tipo);
      return `<span class="ev-${t.clase}">${t.verbo.toLowerCase().replace(/ (?:a|de|por)$/, "")}</span>`;
    });
    return `<li><a href="${d ? d.url : urlDeRuta(origen)}">${d ? tituloDe(d) : escapar(origen)}</a>&nbsp;<span class="rel">· ${verbos.join(", ")}</span></li>`;
  });
  return h2("referido-por", "Referido por") + `<ul class="referido">\n${lineas.join("\n")}\n</ul>\n`;
}

// ── Síntesis ─────────────────────────────────────────────────────────────────────────────────

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

/** Las hipótesis numeradas de una síntesis, cada una enlazada a su lugar: en la portada y en el tema. */
export function indiceDeSintesis(s: Doc): string {
  const ideas = [...s.cuerpo.matchAll(/^## (\d+)\. (.+)$/gm)].map(([, n, titulo]) => {
    const id = ancla(enLinea(`${n}. ${titulo}`)); // igual que el id del h2.hipotesis
    return `<li><a href="${s.url}#${id}"><span class="num">${n}</span>${enLinea(titulo)}</a></li>`;
  });
  return `<h2><a href="${s.url}">${enLinea(s.titulo)}</a></h2>\n<ol class="ideas">\n${ideas.join("\n")}\n</ol>\n`;
}

// ── Estudios ─────────────────────────────────────────────────────────────────────────────────

/**
 * Cada cifra de un estudio en un párrafo, con una línea de procedencia: dónde se dijo y dónde está
 * en la fuente. La verificación de rutina pasa a ser un ícono, que se explica una vez bajo «Cifras»;
 * solo se lee la nota que dice algo más. Si una cifra se dijo en la misma sesión que la anterior,
 * basta con quién y en qué minuto.
 */
function cifras(html: string): string {
  const LISTA = /<ul>\n((?:<li><strong>(?:Cifra|Dicha en|En la fuente|Verificación):<\/strong>[\s\S]*?<\/li>\n)+)<\/ul>\n?/g;
  const RUTINA = /^Verificada[^.]*\./;
  const leer = (items: string) => {
    const c: Record<string, string[]> = {};
    for (const [, rotulo, texto] of items.matchAll(/<li><strong>([^<]+):<\/strong>\s*([\s\S]*?)<\/li>/g)) (c[rotulo] ??= []).push(texto.trim());
    return c;
  };
  const verificacion = (c: Record<string, string[]>) => (c["Verificación"] ?? []).join(" ");
  const rutinas = new Set([...html.matchAll(LISTA)].map(([, items]) => verificacion(leer(items)).match(RUTINA)?.[0]).filter(Boolean));
  const leyenda = rutinas.size === 1 ? [...rutinas][0]! : null;
  let anterior: string | undefined;
  const out = html.replace(LISTA, (bloque, items: string) => {
    const c = leer(items);
    if (!c["Cifra"]) return bloque;
    const v = verificacion(c);
    const primera = escapar((v.replace(/<[^>]+>/g, "").match(/^.*?\.(?=\s|$)/) ?? [v])[0]);
    const ok = RUTINA.test(v);
    const nota = ok && leyenda ? v.replace(RUTINA, "").trim() : v;
    const sello = v
      ? `<span class="${ok ? "ok" : "duda"}" role="img" aria-label="${primera}" title="${primera}">${icono(ok ? "circle-check" : "triangle-alert")}</span>`
      : "";
    const dichas = (c["Dicha en"] ?? []).map((d) => {
      const href = d.match(/^<a href="([^"]+)">/)?.[1];
      const sesion = href ? sesionDe(href) : undefined;
      // El minuto va al turno de esa sesión, aunque su título no se repita.
      let t = d
        .replace(MARCA, (_, lista: string) => marcas(sesion, lista))
        .replace(/<a class="marca" href="https?:[^"]*"[^>]*>([^<]+)<\/a>/g, (_, m: string) => marca(sesion, ...(m.split("–") as [string, string?])));
      if (sesion && sesion.url === anterior) t = t.replace(/^<a href="[^"]+">[\s\S]*?<\/a> · /, "");
      anterior = sesion?.url;
      return t;
    });
    const procedencia = [...dichas, ...(c["En la fuente"] ?? [])].join(" · ");
    return (
      c["Cifra"].map((t) => `<p>${t}</p>\n`).join("") +
      (sello || procedencia ? `<p class="procedencia">${sello}${procedencia}</p>\n` : "") +
      (nota ? `<p class="procedencia">${nota}</p>\n` : "")
    );
  });
  return leyenda ? out.replace(/(<h2 id="cifras"[\s\S]*?<\/h2>\n)/, `$1<p class="procedencia"><span class="ok">${icono("circle-check")}</span>${leyenda}</p>\n`) : out;
}

// ── Minutos ──────────────────────────────────────────────────────────────────────────────────

const YOUTUBE = /^https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\//;
const SESIONES = DOCS.filter((d) => d.tipo === "sesion").sort((a, b) => b.url.length - a.url.length);
const sesionDe = (href: string) => SESIONES.find((s) => href === s.url || href.startsWith(s.url + "/") || href.startsWith(s.url + "#"));

/** La sesión de un enlace al stream: la que tiene ese segundo dentro de su tramo del video. */
function sesionDelVideo(href: string): Doc | undefined {
  const m = href.match(/[?&]v=([\w-]+)&(?:amp;)?t=(\d+)/);
  if (!m) return undefined;
  const t = Number(m[2]);
  return SESIONES.find((s) => {
    const v = String(s.meta.video ?? "").match(/[?&]v=([\w-]+)&t=(\d+)/);
    return v !== null && v[1] === m[1] && t >= Number(v[2]) - 5 && t <= Number(v[2]) + (Number(s.meta.duracion_min) || 0) * 60 + 90;
  });
}

/**
 * Todo minuto lleva al turno en la transcripción del sitio. La sesión es la del documento si es
 * una ficha; si no, la del último enlace a una sesión dentro del mismo bloque (li, p, td, h3). Un
 * enlace al stream dice su sesión por el segundo al que apunta.
 */
function minutos(html: string, propia?: Doc): string {
  return html
    .split(/(?=<(?:li|p|td|h3)[\s>])/)
    .map((bloque) => {
      let sesion = propia;
      let dentro = 0; // dentro de <a>, <code> o <pre> no se toca el texto
      const partes = bloque.split(/(<[^>]*>)/);
      return partes
        .map((t, i) => {
          if (i % 2 === 0) return dentro > 0 ? t : t.replace(MARCA, (_, lista: string) => marcas(sesion, lista));
          if (/^<(?:a|code|pre)[\s>]/.test(t)) dentro++;
          else if (/^<\/(?:a|code|pre)>/.test(t)) dentro--;
          const href = t.match(/^<a\s[^>]*?href="([^"]*)"/)?.[1];
          if (!href) return t;
          if (!propia) sesion = sesionDe(href) ?? sesion;
          if (t.includes('class="marca"') && YOUTUBE.test(href)) {
            const inicio = partes[i + 1]?.match(/^\d{1,2}:\d\d(?::\d\d)?/)?.[0];
            const turno = inicio ? alTurno(sesionDelVideo(href) ?? sesion, inicio) : null;
            if (turno) return t.replace(`href="${href}"`, `href="${turno}"`).replace(' rel="noopener"', "");
          }
          return t;
        })
        .join("");
    })
    .join("");
}

// ── Temas ────────────────────────────────────────────────────────────────────────────────────

/** «Por dónde entrar»: los pasajes seguidos de una misma sesión van bajo un solo rótulo. */
function porDondeEntrar(html: string): string {
  return html.replace(/(<h2 id="por-dónde-entrar"[\s\S]*?<\/h2>\n)<ul>\n([\s\S]*?)<\/ul>\n/, (todo, h2: string, items: string) => {
    const pasajes = [...items.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(([, li]) => li.match(/^<strong>([^<]+)<\/strong>, en <a href="([^"]+)">([\s\S]+?)<\/a> ([\s\S]*)$/));
    if (!pasajes.length || pasajes.some((p) => !p)) return todo;
    let out = h2;
    let actual = "";
    for (const [, nombre, url, titulo, resto] of pasajes as RegExpMatchArray[]) {
      if (url !== actual) {
        out += (actual ? "</ul>\n" : "") + `<p class="fuente"><a href="${url}">${titulo}</a></p>\n<ul>\n`;
        actual = url;
      }
      out += `<li><strong>${nombre}</strong> ${resto}</li>\n`;
    }
    return out + "</ul>\n";
  });
}

// ── Tablas ───────────────────────────────────────────────────────────────────────────────────

// Una celda que sin su encabezado no se entiende: un conteo, un código de idioma, una letra.
const OPACA = /^(?:\d{1,3}|[A-Z]|[a-z]{2}(?: \+ [a-z]{2})*|—|)$/;

/** Marca `corta` las columnas hechas solo de celdas opacas: en el celular, sin encabezado, no se muestran. */
function columnasCortas(html: string): string {
  return html.replace(/<table>[\s\S]*?<\/table>/g, (tabla) => {
    const filas = [...tabla.matchAll(/<tr>([\s\S]*?)<\/tr>/g)]
      .map(([, fila]) => [...fila.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(([, c]) => c.replace(/<[^>]+>/g, "").trim()))
      .filter((f) => f.length);
    if (!filas.length) return tabla;
    const cortas = filas[0].map((_, k) => filas.every((f) => OPACA.test(f[k] ?? "")) && filas.some((f) => f[k] && f[k] !== "—"));
    if (!cortas.some(Boolean)) return tabla;
    return tabla.replace(/<tr>[\s\S]*?<\/tr>/g, (fila) => {
      let k = -1;
      return fila.replace(/<t([dh])(?=[\s>])/g, (m, x) => (cortas[++k] ? `<t${x} class="corta"` : m));
    });
  });
}

// ── El documento ─────────────────────────────────────────────────────────────────────────────

// Lo que el sitio ya dice en otro lugar: en la ficha de una sesión, la línea bajo el título trae el
// evento o la serie, la fecha y el video, y el proceso está en /metodo.
const FICHA_REPETIDA = /^\| (?:Evento|Serie|Fecha|Video|Fuente) \|.*\n/gm;

export function render(md: string, desde: string, tipo = ""): string {
  const vistos = new Map<string, number>();
  const marked = crearMarked(desde, vistos);
  let limpio = md.replace(/<!--[\s\S]*?-->/g, "");
  if (tipo === "transcripcion") limpio = anclasDeTurno(limpio);
  // En las láminas de una persona, el minuto ya enlaza a su sesión: el «dia1-05» sobra.
  if (tipo === "persona") limpio = limpio.replace(/\(dia\d+-\d+, /g, "(");
  const [conRefs, defs] = notas(limpio);

  // Cada sección se parsea en su orden original, para que las anclas repetidas lleven el mismo
  // sufijo que en GitHub; después se reordena. En un tema, «Sesiones» repite las de «Por dónde entrar».
  const fuera = new Set([...SOLO_REPO, ...DEL_GRAFO, ...(tipo === "sesion" ? ["Estructura"] : tipo === "tema" ? ["Sesiones"] : [])]);
  const [cabeza, ...secciones] = partir(conRefs)
    .map((s, i) => {
      if (i === 0 && tipo === "transcripcion") return { ...s, md: s.md.replace(NOTACION, "") };
      if (tipo === "sesion" && s.titulo === "Ficha") return { ...s, md: s.md.replace(FICHA_REPETIDA, "") };
      return s;
    })
    .map((s) => ({ ...s, html: marked.parse(s.md, { async: false }) as string }));
  const visibles = secciones.filter((s) => !fuera.has(s.titulo));

  // El grafo: lo que sale como tarjetas y lo que llega en una lista corta, al final. Una síntesis ya
  // es el grafo en forma de reporte, y en un tema la síntesis que deriva de él va arriba.
  const sintesis = tipo === "tema" ? GRAFO.find((a) => a.tipo === "deriva-de" && a.destino === desde && a.origen.startsWith("sintesis/")) : undefined;
  const salen = desde.startsWith("sintesis/") ? "" : conexiones(desde);
  const llegan = referidoPor(desde, sintesis);

  let partes: string[];
  if (tipo === "sesion") {
    // La idea primero (tesis e ideas), debajo la evidencia del grafo, después el detalle y la ficha.
    const de = (t: string) => visibles.filter((s) => s.titulo === t);
    const primero = [...de("Tesis"), ...de("Ideas que se llevan")];
    const ultimo = de("Ficha");
    const resto = visibles.filter((s) => !primero.includes(s) && !ultimo.includes(s));
    partes = [cabeza, ...primero, salen, ...resto, ...ultimo, llegan].map((s) => (typeof s === "string" ? s : s.html));
  } else {
    partes = [cabeza.html, ...visibles.map((s) => s.html), salen, llegan];
  }
  if (defs.length) {
    const lis = defs.map((d) => d.replace(/^(<li id="[^"]+">)([\s\S]*?)( <a href="#ref-)/, (_, a, texto, b) => a + marked.parseInline(texto) + b));
    partes.push(`<section class="notas"><h2>Notas</h2><ol>\n${lis.join("\n")}\n</ol></section>\n`);
  }

  let html = columnasCortas(partes.join(""))
    .replace(/<table>/g, '<div class="tabla"><table>')
    .replace(/<\/table>/g, "</table></div>")
    // La tabla Ficha (`| | |`) no tiene encabezado: se lee como rótulo y valor.
    .replace(/<div class="tabla"><table>\n<thead>\n<tr>\n(?:<th[^>]*><\/th>\n)+<\/tr>\n<\/thead>\n/g, '<div class="tabla ficha"><table>\n')
    // «28 %» no se corta en dos líneas (solo en el texto, no dentro de las etiquetas).
    .replace(/>([^<]*)</g, (_, t) => ">" + t.replace(/(\d) %/g, "$1&nbsp;%") + "<");
  if (desde.startsWith("sintesis/")) html = evidencias(html);
  if (/^estudios\/(?!README)/.test(desde)) html = cifras(html);
  if (tipo !== "transcripcion") html = minutos(html, tipo === "sesion" ? docPorRuta(desde) : undefined);
  if (tipo === "tema") {
    html = porDondeEntrar(html);
    const s = sintesis && docPorRuta(sintesis.origen);
    if (s) html = html.replace(/(<\/h1>[\s\S]*?<\/p>\n?)/, `$1${indiceDeSintesis(s)}`);
  }
  return html;
}

export { urlAbsoluta };
