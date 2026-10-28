// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Brinca
//
// Lo que armó scripts/preparar.mjs, con tipos y las búsquedas que usan el sitio y el servidor MCP.

import contenido from "../.generado/contenido.json";
import grafoJson from "../.generado/grafo.json";
import descargasJson from "../.generado/descargas.json";

export type Meta = Record<string, unknown>;
export type Doc = {
  ruta: string;
  url: string;
  tipo: string;
  meta: Meta;
  titulo: string;
  lede: string;
  cuerpo: string;
  ficha?: string;
  propia?: boolean;
};
export type Arista = {
  origen: string;
  tipo: string;
  destino: string;
  titulo_destino: string;
  locus: string | null;
  porque: string;
};

export const BASE: string = (contenido as { base: string }).base;
export const GITHUB: string = (contenido as { github: string }).github;
export const DOCS: Doc[] = (contenido as { docs: Doc[] }).docs;
export const GRAFO: Arista[] = grafoJson as Arista[];
export const DESCARGAS = descargasJson as { nombre: string; archivo: string; sesiones: number }[];

const porRuta = new Map(DOCS.map((d) => [d.ruta, d]));
const porUrl = new Map(DOCS.map((d) => [d.url, d]));

export const docPorRuta = (ruta: string) => porRuta.get(ruta);
export const docPorUrl = (url: string) => porUrl.get(url);

export const lista = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : v ? [String(v)] : []);
export const sesiones = () =>
  DOCS.filter((d) => d.tipo === "sesion").sort(
    (a, b) => String(a.meta.fecha).localeCompare(String(b.meta.fecha)) || a.ruta.localeCompare(b.ruta),
  );
export const slugDe = (ruta: string) => ruta.split("/").pop()!.replace(/\.md$/, "");

/** Nombre corto de la colección de una sesión: el evento o la serie de webinars. */
export function coleccion(d: Doc): string {
  const ev = d.meta.evento ? docPorRuta(`eventos/${d.meta.evento}/README.md`) : undefined;
  return ev ? ev.titulo : String(d.meta.serie || "Webinar");
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export function fechaLarga(f: unknown): string {
  const m = String(f ?? "").match(/^(\d{4})-(\d\d)-(\d\d)/);
  return m ? `${Number(m[3])} de ${MESES[Number(m[2]) - 1]} de ${m[1]}` : String(f ?? "");
}

export const urlAbsoluta = (d: Doc) => BASE + (d.url === "/" ? "" : d.url);
