// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Brinca
//
// preparar.mjs — arma, desde el markdown del repositorio, todo lo que el sitio y el servidor MCP
// leen. Corre antes de `next build` y de `next dev`.
//
//   .generado/contenido.json   cada documento: ruta, URL, metadatos, título, resumen y markdown
//   .generado/indice.json      los fragmentos para buscar (una sección o un turno de transcripción)
//   .generado/grafo.json       las aristas de las secciones «## Conexiones»
//   public/                    copia de cada .md en su misma ruta (el markdown crudo para
//                              asistentes), las imágenes, las licencias, catalogo.json, llms.txt y
//                              un archivo descargable por colección
//
// Nada de esto se versiona: se regenera en cada build.

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const SITIO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const REPO = path.dirname(SITIO);
const BASE = process.env.SITIO_URL || "https://open.brinca.com";
const GITHUB = "https://github.com/Brinca-MMC/open-brinca/blob/main/";
const GENERADO = path.join(SITIO, ".generado");
const PUBLICO = path.join(SITIO, "public");

// Lo que no se publica como página: el código, la configuración y lo que solo importa a quien
// trabaja en el repositorio.
const SALTAR = new Set([".git", ".github", "node_modules", "sitio", "plugin", "scripts", "__pycache__"]);
const NO_PAGINA = new Set(["CLAUDE.md"]);
const IMAGEN = /\.(jpe?g|png|webp|gif|svg)$/i;
const COPIAR = /\.(txt|json|yml|yaml|cff)$/i;

function recorrer(dir, fn) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (SALTAR.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) recorrer(p, fn);
    else fn(path.relative(REPO, p));
  }
}

/** La URL de un documento: su ruta sin `.md`, y la carpeta si es su README. */
export function urlDe(ruta) {
  let u = "/" + ruta.replace(/\.md$/, "");
  if (u === "/README") return "/";
  return u.replace(/\/README$/, "");
}

function tituloYLede(cuerpo) {
  const m = cuerpo.match(/^# (.+)$/m);
  const titulo = m ? m[1].trim() : "";
  const resto = m ? cuerpo.slice(m.index + m[0].length) : cuerpo;
  for (const p of resto.split(/\n\s*\n/)) {
    const t = p.trim();
    if (t && !/^(#|\||```|<!--|!\[)/.test(t)) return { titulo, lede: t.replace(/^>\s?/gm, "").replace(/\s+/g, " ") };
  }
  return { titulo, lede: "" };
}

function tipoDe(ruta, meta) {
  if (meta.tipo) return meta.tipo;
  if (ruta.startsWith("personas/")) return "persona";
  return "pagina";
}

/** Texto plano para buscar: sin enlaces, sin marcas de formato. */
function plano(md) {
  return md
    .replace(/<!--.*?-->/gs, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Fragmentos de un documento: una sección de la ficha, o unos pocos turnos de la transcripción. */
function fragmentos(doc) {
  const out = [];
  // Las listas que genera generar.py (sesiones de una persona o de un tema) repiten títulos de
  // otras páginas: no se indexan, para que la página de una persona no gane por nombrar sesiones.
  const cuerpo = doc.cuerpo.replace(/^## Referido por[\s\S]*$/m, "").replace(/<!-- AUTO:[\s\S]*?<!-- \/AUTO:[^>]*-->/g, "");
  if (doc.tipo === "transcripcion") {
    let grupo = [];
    const vaciar = () => {
      if (!grupo.length) return;
      const texto = grupo.join("\n\n");
      const marca = (texto.match(/\[(\d+:\d\d(?::\d\d)?)\]/) || [])[1] || null;
      out.push({ ruta: doc.ruta, titulo: doc.titulo, seccion: null, marca, texto: plano(texto) });
      grupo = [];
    };
    for (const p of cuerpo.split(/\n\s*\n/)) {
      if (/^\*\*\[\d/.test(p.trim())) {
        if (grupo.join(" ").length > 1200) vaciar();
      }
      grupo.push(p);
    }
    vaciar();
    return out;
  }
  const partes = cuerpo.split(/^(?=#{2,3} )/m);
  for (const parte of partes) {
    const h = parte.match(/^#{2,3} (.+)$/m);
    const seccion = h ? h[1].trim() : null;
    for (const trozo of parte.split(/\n(?=- \*\*)/)) {
      const marca = (trozo.match(/\[(\d+:\d\d(?::\d\d)?)\]/) || [])[1] || null;
      const texto = plano(trozo);
      if (texto.length > 40) out.push({ ruta: doc.ruta, titulo: doc.titulo, seccion, marca, texto });
    }
  }
  return out;
}

const ARISTA = /^- `([^`]+)` \[([^\]]+)\]\(((?:[^()]|\([^()]*\))+)\)(.*)$/;

function aristas(doc) {
  // Un ejemplo de arista dentro de un bloque de código no es una arista.
  const sinCodigo = doc.cuerpo.replace(/^```[\s\S]*?^```/gm, "");
  const m = sinCodigo.match(/^## Conexiones\n([\s\S]*?)(?=^## |(?![\s\S]))/m);
  if (!m) return [];
  const out = [];
  for (const linea of m[1].split("\n")) {
    const a = linea.match(ARISTA);
    if (!a) continue;
    const destino = path.normalize(path.join(path.dirname(doc.ruta), decodeURI(a[3].split("#")[0])));
    const partes = a[4].split(" · ").map((x) => x.trim()).filter(Boolean);
    const locus = partes.length > 1 ? partes[0] : null;
    const porque = partes.length > 1 ? partes.slice(1).join(" · ") : partes[0] || "";
    out.push({ origen: doc.ruta, tipo: a[1], destino, titulo_destino: a[2], locus, porque });
  }
  return out;
}

/** Los enlaces relativos de un .md, como direcciones completas del sitio (para un archivo suelto). */
function absolutos(md, desde) {
  return md.replace(/\]\(((?:[^()\s]|\([^()]*\))+)\)/g, (todo, href) => {
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("#")) return todo;
    const [p, frag] = href.split("#");
    const ruta = path.posix.normalize(path.posix.join(path.posix.dirname(desde), decodeURI(p)));
    const url = ruta.endsWith(".md") ? urlDe(ruta) : "/" + ruta;
    return `](${BASE}${url}${frag ? "#" + frag : ""})`;
  });
}

function copiar(ruta, destino = ruta) {
  const d = path.join(PUBLICO, destino);
  fs.mkdirSync(path.dirname(d), { recursive: true });
  fs.copyFileSync(path.join(REPO, ruta), d);
}

function main() {
  fs.rmSync(GENERADO, { recursive: true, force: true });
  fs.rmSync(PUBLICO, { recursive: true, force: true });
  fs.mkdirSync(GENERADO, { recursive: true });
  fs.mkdirSync(PUBLICO, { recursive: true });

  const docs = [];
  recorrer(REPO, (ruta) => {
    if (IMAGEN.test(ruta) || COPIAR.test(ruta)) return copiar(ruta);
    if (!ruta.endsWith(".md") || NO_PAGINA.has(ruta)) return;
    copiar(ruta); // el markdown crudo, en la misma ruta que en el repositorio
    const { data, content } = matter(fs.readFileSync(path.join(REPO, ruta), "utf8"));
    const { titulo, lede } = tituloYLede(content);
    docs.push({ ruta, url: urlDe(ruta), tipo: tipoDe(ruta, data), meta: data, titulo, lede, cuerpo: content });
  });

  // Las páginas propias del sitio (conectar, privacidad, soporte) se escriben en markdown igual.
  const paginas = path.join(SITIO, "paginas");
  for (const f of fs.readdirSync(paginas).filter((f) => f.endsWith(".md")).sort()) {
    const { data, content } = matter(fs.readFileSync(path.join(paginas, f), "utf8"));
    const { titulo, lede } = tituloYLede(content);
    docs.push({ ruta: `sitio/paginas/${f}`, url: "/" + f.replace(/\.md$/, ""), tipo: "pagina", meta: data, titulo, lede, cuerpo: content, propia: true });
  }
  for (const f of fs.readdirSync(path.join(SITIO, "estatico"))) {
    fs.copyFileSync(path.join(SITIO, "estatico", f), path.join(PUBLICO, f));
  }

  // La transcripción hereda los metadatos de su ficha (fecha, speakers, temas).
  const porRuta = new Map(docs.map((d) => [d.ruta, d]));
  for (const d of docs) {
    if (d.tipo === "transcripcion") {
      const ficha = porRuta.get(path.join(path.dirname(d.ruta), "README.md"));
      if (ficha) d.ficha = ficha.ruta;
    }
  }

  // La búsqueda cubre el contenido. Lo que es del proyecto (la prueba con su clave, lo que se envía
  // a los directorios, el historial, la guía para aportar, el código del grafo) se puede traer por
  // su id, pero no aparece al buscar.
  const NO_INDICE = /^(evals\/|directorios\/|metodo\/grafo\/|CHANGELOG\.md|CONTRIBUTING\.md|CODE_OF_CONDUCT\.md)/;
  const indice = docs.filter((d) => !d.propia && !NO_INDICE.test(d.ruta)).flatMap(fragmentos);
  const grafo = docs.flatMap(aristas);

  fs.writeFileSync(path.join(GENERADO, "contenido.json"), JSON.stringify({ base: BASE, github: GITHUB, docs }));
  fs.writeFileSync(path.join(GENERADO, "indice.json"), JSON.stringify(indice));
  fs.writeFileSync(path.join(GENERADO, "grafo.json"), JSON.stringify(grafo));
  fs.copyFileSync(path.join(REPO, "catalogo.json"), path.join(GENERADO, "catalogo.json"));

  // llms.txt con las direcciones del sitio (en el repositorio apunta a GitHub).
  const llms = fs.readFileSync(path.join(REPO, "llms.txt"), "utf8")
    .replaceAll("https://raw.githubusercontent.com/Brinca-MMC/open-brinca/main/", BASE + "/");
  fs.writeFileSync(path.join(PUBLICO, "llms.txt"), llms);

  // Un archivo por colección, para subirlo entero a un proyecto de Claude o ChatGPT o a un Gem.
  fs.mkdirSync(path.join(PUBLICO, "descargas"), { recursive: true });
  const colecciones = [
    ...fs.readdirSync(path.join(REPO, "eventos")).map((e) => ({ nombre: e, raiz: `eventos/${e}/` })),
    { nombre: "webinars", raiz: "webinars/" },
  ];
  const descargas = [];
  for (const c of colecciones) {
    const fichas = docs.filter((d) => d.ruta.startsWith(c.raiz) && d.tipo === "sesion")
      .sort((a, b) => String(a.meta.fecha).localeCompare(String(b.meta.fecha)) || a.ruta.localeCompare(b.ruta));
    if (!fichas.length) continue;
    const indiceCol = porRuta.get(c.raiz + "README.md");
    const partes = [
      `# ${indiceCol ? indiceCol.titulo : c.nombre} · fichas de todas las sesiones`,
      "",
      `> Las fichas de las ${fichas.length} sesiones de esta colección en un solo archivo, para subirlo a un proyecto de Claude o ChatGPT, a un Gem de Gemini o a Gemini Notebook. Fuente: «Open Brinca, de Brinca», ${BASE}. Las fichas se publican bajo CC BY 4.0; las transcripciones completas están en el sitio. Cita a quien habló, la sesión y la marca [mm:ss].`,
      "",
    ];
    for (const f of fichas) {
      const cuerpo = absolutos(f.cuerpo.replace(/^## Referido por[\s\S]*$/m, "").trim(), f.ruta);
      partes.push("---", "", `Fuente: ${BASE}${f.url}`, "", cuerpo, "");
    }
    const archivo = `descargas/${c.nombre}.md`;
    fs.writeFileSync(path.join(PUBLICO, archivo), partes.join("\n"));
    descargas.push({ nombre: indiceCol ? indiceCol.titulo : c.nombre, archivo: "/" + archivo, sesiones: fichas.length });
  }
  fs.writeFileSync(path.join(GENERADO, "descargas.json"), JSON.stringify(descargas));
  // La página Conectar lista las descargas.
  const conectar = docs.find((d) => d.ruta === "sitio/paginas/conectar.md");
  if (conectar) {
    const lineas = descargas.map((d) => `\n  - [${d.nombre}](${d.archivo}), ${d.sesiones} ${d.sesiones === 1 ? "sesión" : "sesiones"}`).join("");
    conectar.cuerpo = conectar.cuerpo.replace("\n  <!-- DESCARGAS -->", lineas);
    fs.writeFileSync(path.join(GENERADO, "contenido.json"), JSON.stringify({ base: BASE, github: GITHUB, docs }));
  }

  console.log(`preparar: ${docs.length} documentos, ${indice.length} fragmentos, ${grafo.length} aristas, ${descargas.length} descargas`);
}

main();
