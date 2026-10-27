// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Brinca
//
// Las herramientas del servidor MCP de Open Brinca. Todas son de solo lectura y sin login: buscan y
// traen documentos del repositorio, y cada respuesta lleva la URL canónica para citar.

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import catalogo from "../.generado/catalogo.json";
import { BASE, DOCS, GRAFO, docPorRuta, lista, sesiones, coleccion, urlAbsoluta, type Doc } from "./contenido";
import { buscar, extracto } from "./buscar";

export const VERSION = "2026.10";
export const INSTRUCCIONES = `Open Brinca is a public knowledge base on AI adoption in companies, curated by Brinca (a Chilean consultancy): event sessions and webinars, transcribed and reviewed, with a summary ("ficha") per session, topic pages, speaker pages and study pages whose figures are checked against the original publication. Content is in Spanish; answer in the user's language.

How to use it: search first; fetch the session summary (README.md) before the transcript (transcripcion.md), which is long; fetch a topic page (temas/…) to see who said what on a subject across sessions; use find_figures for numbers, and quote the verification label of each figure (Verificada, Corregida, Difiere, Preliminar, Solo en la sesión). A footnote [^n] in a transcript means the speaker misspoke: quote the corrected figure.

How to cite: name the speaker, the session and the [mm:ss] mark, and give the URL. Credit the source as "Open Brinca, de Brinca" (${BASE}). Summaries are CC BY 4.0; transcripts are CC BY-NC-ND 4.0 (no commercial use, no derivatives).`;

const SOLO_LECTURA = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

const texto = (obj: unknown) => ({ content: [{ type: "text" as const, text: typeof obj === "string" ? obj : JSON.stringify(obj, null, 1) }] });

function describir(d: Doc) {
  const m = d.meta;
  const base: Record<string, unknown> = { id: d.ruta, title: d.titulo, url: urlAbsoluta(d), type: d.tipo, summary: d.lede };
  if (d.tipo === "sesion") {
    Object.assign(base, {
      collection: coleccion(d), date: m.fecha, format: m.formato, speakers: lista(m.speakers),
      moderators: lista(m.modera), languages: lista(m.idiomas), duration_min: m.duracion_min,
      video: m.video ?? null, topics: lista(m.temas), studies: lista(m.estudios),
      transcript_id: d.ruta.replace(/README\.md$/, "transcripcion.md"),
    });
  }
  return base;
}

type Cifra = Record<string, unknown> & { id: string; enunciado: string; url: string };
type Estudio = { ruta: string; titulo: string; autores?: string; anio?: number; url?: string; cifras: Cifra[] };
const ESTUDIOS = (catalogo as { estudios: Estudio[] }).estudios;

function cifrasDe(e: Estudio) {
  const sitio = BASE + "/" + e.ruta.replace(/\.md$/, "");
  return e.cifras.map((c) => ({
    figure: c.enunciado,
    statement: c["cifra"],
    said_in: c["dicha en"],
    source_location: c["en la fuente"] ?? null,
    verification: c["verificación"],
    url: `${sitio}#${c.id}`,
    study: e.titulo,
    study_id: e.ruta,
    publication_url: e.url ?? null,
  }));
}

export function registrar(server: McpServer) {
  server.registerTool(
    "search",
    {
      title: "Search Open Brinca",
      description:
        "Keyword search over Open Brinca (Spanish content): session summaries, transcripts, topic, speaker and study pages. Returns up to 10 documents with id, title, url and the most relevant passage with its [mm:ss] mark. Use Spanish keywords for best results. Then call fetch with an id.",
      inputSchema: z.object({ query: z.string().min(1).describe("Keywords, preferably in Spanish (e.g. 'gobernanza de la IA', 'ROI crecimiento eficiencia').") }),
      annotations: SOLO_LECTURA,
    },
    async ({ query }) => {
      const results = buscar(query, 10).map(({ doc, fragmento }) => ({
        id: doc.ruta,
        title: doc.tipo === "transcripcion" ? `${doc.titulo}` : doc.titulo,
        url: urlAbsoluta(doc),
        text: (fragmento.marca ? `[${fragmento.marca}] ` : "") + (fragmento.seccion ? `${fragmento.seccion}: ` : "") + extracto(fragmento.texto, query),
      }));
      return texto({ results });
    },
  );

  server.registerTool(
    "fetch",
    {
      title: "Fetch a document",
      description:
        "Returns the full markdown of one Open Brinca document by its id (the repository path returned by search, e.g. 'eventos/impacta-ia-2026/sesiones/…/README.md', 'temas/regulacion.md', 'personas/stefano-puntoni.md', 'estudios/…'). Session transcripts (transcripcion.md) are long: prefer the summary (README.md) first.",
      inputSchema: z.object({ id: z.string().min(1).describe("Document id: its path in the repository.") }),
      annotations: SOLO_LECTURA,
    },
    async ({ id }) => {
      const limpio = id.replace(/^https?:\/\/[^/]+\//, "").replace(/^\//, "");
      const d = docPorRuta(limpio) ?? docPorRuta(limpio.replace(/\/?$/, "/README.md")) ?? DOCS.find((x) => urlAbsoluta(x) === id);
      if (!d) return { ...texto(`No document with id "${id}". Use search to find ids.`), isError: true };
      return texto({
        id: d.ruta,
        title: d.titulo,
        text: d.cuerpo.replace(/^## Referido por[\s\S]*$/m, "").trim(),
        url: urlAbsoluta(d),
        metadata: { ...describir(d), license: d.tipo === "transcripcion" ? "CC BY-NC-ND 4.0" : "CC BY 4.0", cite_as: `Open Brinca, de Brinca. ${urlAbsoluta(d)}` },
      });
    },
  );

  server.registerTool(
    "list_sessions",
    {
      title: "List sessions",
      description:
        "Lists the sessions (events and webinars) with their metadata: date, format, speakers, topics, studies cited, duration, video and the ids of the summary and transcript. All filters are optional and combine with AND.",
      inputSchema: z.object({
        topic: z.string().optional().describe("Topic slug from list_index('topics'), e.g. 'regulacion'."),
        person: z.string().optional().describe("Person slug or name, e.g. 'stefano-puntoni' or 'Puntoni'."),
        event: z.string().optional().describe("Event slug, e.g. 'impacta-ia-2026'."),
        format: z.enum(["apertura", "keynote", "panel", "charla", "webinar"]).optional(),
        from: z.string().optional().describe("Earliest date, YYYY-MM-DD."),
        to: z.string().optional().describe("Latest date, YYYY-MM-DD."),
      }),
      annotations: SOLO_LECTURA,
    },
    async ({ topic, person, event, format, from, to }) => {
      const p = person?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const out = sesiones().filter((d) => {
        const m = d.meta;
        const gente = [...lista(m.speakers), ...lista(m.modera), ...lista(m.intervienen)];
        return (!topic || lista(m.temas).includes(topic)) &&
          (!p || gente.some((g) => g.includes(p.replace(/\s+/g, "-")))) &&
          (!event || m.evento === event) && (!format || m.formato === format) &&
          (!from || String(m.fecha) >= from) && (!to || String(m.fecha) <= to);
      });
      return texto({ count: out.length, sessions: out.map(describir) });
    },
  );

  server.registerTool(
    "list_index",
    {
      title: "List topics, people or studies",
      description:
        "Lists every topic, person or study in Open Brinca with its id, title, url and one-line summary. Fetch a topic page to see who said what on that subject across all sessions, with [mm:ss] marks.",
      inputSchema: z.object({ kind: z.enum(["topics", "people", "studies"]) }),
      annotations: SOLO_LECTURA,
    },
    async ({ kind }) => {
      const carpeta = { topics: "temas/", people: "personas/", studies: "estudios/" }[kind];
      const out = DOCS.filter((d) => d.ruta.startsWith(carpeta) && !d.ruta.endsWith("README.md"))
        .map((d) => ({ id: d.ruta, title: d.titulo, url: urlAbsoluta(d), summary: d.lede }));
      return texto({ count: out.length, items: out });
    },
  );

  server.registerTool(
    "find_figures",
    {
      title: "Find figures",
      description:
        "Finds the figures (percentages, amounts, counts) cited in the sessions that come from a study, each with who said it and where ([mm:ss]), where it is in the publication, and its verification label against the original: Verificada (matches), Corregida (the speaker misspoke; the figure given is the correct one), Difiere (the publication says something else), Preliminar (an early figure; the final one is stated), Solo en la sesión (not in the publication). Always quote the label.",
      inputSchema: z.object({
        query: z.string().optional().describe("Keywords, preferably in Spanish (e.g. 'ROI', 'CAIO', 'data centers')."),
        study: z.string().optional().describe("Study id from list_index('studies'), to list all its figures."),
      }),
      annotations: SOLO_LECTURA,
    },
    async ({ query, study }) => {
      let todas = ESTUDIOS.filter((e) => !study || e.ruta === study || e.ruta.includes(study)).flatMap(cifrasDe);
      if (query) {
        const terminos = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter((w) => w.length > 1);
        const pts = (c: Record<string, unknown>) => {
          const t = JSON.stringify(c).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return terminos.filter((w) => t.includes(w)).length;
        };
        todas = todas.map((c) => [pts(c), c] as const).filter(([n]) => n > 0).sort((a, b) => b[0] - a[0]).map(([, c]) => c);
      }
      return texto({ count: todas.length, figures: todas.slice(0, 30) });
    },
  );

  server.registerTool(
    "get_connections",
    {
      title: "Get connections",
      description:
        "Returns how a document relates to others in Open Brinca's knowledge graph: which sessions it confirms, contradicts in part (tensiona), refutes, complements, reframes or continues, and which ones point to it, each with the reason. This is Brinca's editorial reading across sessions; use it to answer 'who disagrees with this?' or 'what supports this?'.",
      inputSchema: z.object({ id: z.string().min(1).describe("Document id (repository path).") }),
      annotations: SOLO_LECTURA,
    },
    async ({ id }) => {
      const d = docPorRuta(id);
      if (!d) return { ...texto(`No document with id "${id}".`), isError: true };
      const fuera = GRAFO.filter((a) => a.origen === id).map((a) => ({ type: a.tipo, to: a.destino, to_title: docPorRuta(a.destino)?.titulo ?? a.titulo_destino, at: a.locus, why: a.porque }));
      const dentro = GRAFO.filter((a) => a.destino === id).map((a) => ({ type: a.tipo, from: a.origen, from_title: docPorRuta(a.origen)?.titulo, at: a.locus, why: a.porque }));
      return texto({ id, title: d.titulo, outgoing: fuera, incoming: dentro });
    },
  );
}
