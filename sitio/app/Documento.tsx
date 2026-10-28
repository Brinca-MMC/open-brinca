// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Brinca

import { escapar, render } from "../lib/markdown";
import { BASE, DOCS, docPorRuta, fechaLarga, coleccion, lista, sesiones, slugDe, urlAbsoluta, type Doc } from "../lib/contenido";

export function jsonLd(d: Doc) {
  const m = d.meta;
  const comun = {
    "@context": "https://schema.org",
    url: urlAbsoluta(d),
    name: d.titulo,
    description: d.lede,
    inLanguage: "es",
    isPartOf: { "@type": "WebSite", name: "Open Brinca", url: BASE },
    publisher: { "@type": "Organization", name: "Brinca", url: "https://www.brinca.com" },
    license: d.tipo === "transcripcion" ? "https://creativecommons.org/licenses/by-nc-nd/4.0/" : "https://creativecommons.org/licenses/by/4.0/",
  };
  if (d.tipo === "sesion") {
    return {
      ...comun,
      "@type": "Article",
      headline: d.titulo,
      datePublished: m.fecha,
      dateModified: m.actualizado,
      about: lista(m.temas),
      ...(m.video ? { video: { "@type": "VideoObject", name: d.titulo, embedUrl: m.video, contentUrl: m.video, uploadDate: m.fecha } } : {}),
    };
  }
  if (d.tipo === "persona") return { ...comun, "@type": "ProfilePage", mainEntity: { "@type": "Person", name: m.nombre, jobTitle: m.cargo } };
  return { ...comun, "@type": "WebPage", dateModified: m.actualizado };
}

// Un enlace a #t-13-39 lleva al turno que contiene ese minuto: si no hay un turno que empiece
// justo ahí, al último que empezó antes; si es anterior a todos, al primero.
const SALTO_A_MARCA = `(function(){var h=decodeURIComponent(location.hash);if(!/^#t-\\d/.test(h)||document.getElementById(h.slice(1)))return;
var s=function(id){var p=id.slice(2).split("-").map(Number);return p.length===3?p[0]*3600+p[1]*60+p[2]:p[0]*60+p[1]};
var t=s(h.slice(1)),best=null;document.querySelectorAll('a[id^="t-"]').forEach(function(a){var v=s(a.id);if(v<=t&&(!best||v>s(best.id)))best=a});
if(!best)best=document.querySelector('a[id^="t-"]');if(best){best.parentElement.classList.add("marcado");best.scrollIntoView()}})();`;

/** Bajo el título de un evento: el video de cada día, sus páginas (programa, personas, glosario) y el método. */
function lineaEvento(doc: Doc): string {
  const id = doc.ruta.match(/^eventos\/([^/]+)\/README\.md$/)?.[1];
  if (!id) return "";
  const videos = [...new Set(sesiones().filter((s) => s.meta.evento === id).map((s) => String(s.meta.video ?? "").replace(/&t=\d+s?$/, "")).filter(Boolean))];
  const partes = videos.map((v, i) => `<a href="${escapar(v)}" rel="noopener">${videos.length > 1 ? `Video día ${i + 1}` : "Video"}</a>`);
  const ORDEN = ["programa", "personas", "glosario"];
  const paginas = DOCS.filter((d) => d.ruta.startsWith(`eventos/${id}/evento/`)).sort((a, b) => (ORDEN.indexOf(slugDe(a.ruta)) + 1 || 99) - (ORDEN.indexOf(slugDe(b.ruta)) + 1 || 99));
  for (const d of paginas) partes.push(`<a href="${d.url}">${slugDe(d.ruta)[0].toUpperCase()}${slugDe(d.ruta).slice(1)}</a>`);
  const metodo = docPorRuta("metodo/transcripcion/README.md");
  if (metodo) partes.push(`<a href="${metodo.url}">Método</a>`);
  return partes.length ? `<p class="meta">${partes.join(" · ")}</p>` : "";
}

/** La línea bajo el título de una ficha o una transcripción: colección, fecha y lo que va al lado. */
function lineaMeta(doc: Doc): string {
  if (doc.tipo !== "sesion" && doc.tipo !== "transcripcion") return lineaEvento(doc);
  const sesion = doc.tipo === "sesion" ? doc : doc.tipo === "transcripcion" && doc.ficha ? docPorRuta(doc.ficha) : undefined;
  if (!sesion) return "";
  const m = sesion.meta;
  const partes = [`<a href="${m.evento ? `/eventos/${m.evento}` : "/webinars"}">${escapar(coleccion(sesion))}</a>`];
  if (m.fecha) partes.push(fechaLarga(m.fecha));
  if (doc.tipo === "sesion") {
    const transcripcion = docPorRuta(doc.ruta.replace(/README\.md$/, "transcripcion.md"));
    if (transcripcion && transcripcion !== doc) partes.push(`<a href="${transcripcion.url}">Transcripción</a>`);
  } else {
    partes.push(`<a href="${sesion.url}">Ficha</a>`);
  }
  if (m.video) partes.push(`<a href="${escapar(String(m.video))}" rel="noopener">Video</a>`);
  if (doc.tipo === "transcripcion") partes.push(`<a href="https://creativecommons.org/licenses/by-nc-nd/4.0/deed.es" rel="license noopener">CC BY-NC-ND 4.0</a>`);
  return `<p class="meta">${partes.join(" · ")}</p>`;
}

export default function Documento({ doc }: { doc: Doc }) {
  let html = render(doc.cuerpo, doc.ruta, doc.tipo);
  // En la ficha, el título va sin « · colección»: la colección queda en la línea de abajo.
  if (doc.tipo === "sesion") {
    const sufijo = (" · " + escapar(coleccion(doc))).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(new RegExp(sufijo + "</h1>"), "</h1>");
  }
  const meta = lineaMeta(doc);
  if (meta) html = html.replace("</h1>", "</h1>\n" + meta);
  return (
    <article>
      <div className={"contenido " + doc.tipo} dangerouslySetInnerHTML={{ __html: html }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(doc)) }} />
      {doc.tipo === "transcripcion" && <script dangerouslySetInnerHTML={{ __html: SALTO_A_MARCA }} />}
    </article>
  );
}

export function metadatos(doc: Doc) {
  const titulo = doc.url === "/" ? "Open Brinca · conocimiento abierto sobre adopción de IA" : `${doc.titulo} · Open Brinca`;
  const descripcion = doc.lede.length > 300 ? doc.lede.slice(0, 297) + "…" : doc.lede;
  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: urlAbsoluta(doc), types: { "text/markdown": "/" + doc.ruta } },
    openGraph: { title: titulo, description: descripcion, url: urlAbsoluta(doc), siteName: "Open Brinca", locale: "es_CL", type: "article" },
  };
}
