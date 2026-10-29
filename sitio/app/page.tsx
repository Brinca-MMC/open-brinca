// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Brinca

import { DOCS, docPorUrl } from "../lib/contenido";
import { escapar, indiceDeSintesis } from "../lib/markdown";
import { jsonLd, metadatos } from "./Documento";

const portada = docPorUrl("/")!;
export const metadata = metadatos(portada);

// En GitHub la marca de tiempo lleva al video; en el sitio, a su pasaje en la transcripción.
const lede = portada.lede.replace("una marca de tiempo que lleva al segundo exacto del video", "una marca de tiempo que lleva al pasaje en la transcripción");

// La portada abre con las ideas (las hipótesis de cada síntesis) y debajo los temas. El README del
// repositorio sigue siendo la portada en GitHub.
export default function Portada() {
  const temas = DOCS.filter((d) => d.tipo === "tema").sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));
  const html = [
    `<h1>${escapar(portada.titulo)}</h1>`,
    `<p>${escapar(lede)}</p>`,
    ...DOCS.filter((d) => d.tipo === "sintesis").map(indiceDeSintesis),
    `<h2><a href="/temas">Temas</a></h2>`,
    `<ul class="temas">\n${temas.map((t) => `<li><a href="${t.url}">${escapar(t.titulo)}</a></li>`).join("\n")}\n</ul>`,
  ].join("\n");
  return (
    <article>
      <div className="contenido" dangerouslySetInnerHTML={{ __html: html }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(portada)) }} />
    </article>
  );
}
