// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Brinca

import { render } from "../lib/markdown";
import { BASE, docPorRuta, fechaLarga, coleccion, lista, urlAbsoluta, type Doc } from "../lib/contenido";

function jsonLd(d: Doc) {
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

export default function Documento({ doc }: { doc: Doc }) {
  const html = render(doc.cuerpo, doc.ruta);
  const m = doc.meta;
  const transcripcion = doc.tipo === "sesion" ? docPorRuta(doc.ruta.replace(/README\.md$/, "transcripcion.md")) : undefined;
  const ficha = doc.ficha ? docPorRuta(doc.ficha) : undefined;
  return (
    <article>
      {doc.tipo === "sesion" && (
        <div className="acciones">
          <span>{coleccion(doc)} · {fechaLarga(m.fecha)}</span>
          {transcripcion && <a href={transcripcion.url}>Transcripción completa</a>}
          {m.video ? <a href={String(m.video)} rel="noopener">Video</a> : null}
          <a href={"/" + doc.ruta}>Markdown</a>
        </div>
      )}
      {ficha && (
        <div className="acciones">
          <a href={ficha.url}>← La ficha de esta sesión</a>
          <span>Las transcripciones se publican bajo CC BY-NC-ND 4.0: sin uso comercial ni obras derivadas.</span>
        </div>
      )}
      <div className="contenido" dangerouslySetInnerHTML={{ __html: html }} />
      {doc.tipo !== "pagina" && (
        <p className="citar">
          Cómo citar: <em>{doc.titulo}</em>. Open Brinca, de Brinca. <a href={urlAbsoluta(doc)}>{urlAbsoluta(doc)}</a>
        </p>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(doc)) }} />
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
