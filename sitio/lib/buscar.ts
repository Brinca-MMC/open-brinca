// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Brinca
//
// Búsqueda por palabras (BM25) sobre los fragmentos del repositorio: una sección de una ficha o
// unos pocos turnos de una transcripción. Sin base de datos ni embeddings: el índice se arma en el
// build. Las fichas pesan más que las transcripciones, para que el asistente lea primero el resumen.

import indiceJson from "../.generado/indice.json";
import { docPorRuta, type Doc } from "./contenido";

type Fragmento = { ruta: string; titulo: string; seccion: string | null; marca: string | null; texto: string };
const FRAGMENTOS = indiceJson as Fragmento[];

const VACIAS = new Set(
  ("a al algo como con de del el en es esa ese eso esta este esto ha hay la las le les lo los mas me mi muy no nos o para pero por que se sea si sin sobre son su sus te tu un una uno y ya the of and to in is for on that with what how who").split(" "),
);

// Términos que se escriben de varias formas, llevados a una sola.
const SINONIMOS: [RegExp, string][] = [
  [/\bdata ?centers?\b|\bcentros? de datos\b/g, "datacenter"],
  [/\bchief ai officers?\b/g, "caio"],
  [/\bi ?\+ ?d\b/g, "imasd"],
];

export function normalizar(t: string): string[] {
  let s = t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [re, x] of SINONIMOS) s = s.replace(re, x);
  return s
    .split(/[^a-z0-9%]+/)
    .filter((w) => w.length > 1 && !VACIAS.has(w))
    .map((w) => (w.length > 4 && w.endsWith("es") ? w.slice(0, -2) : w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w));
}

// El título del documento y el de la sección cuentan doble: dicen de qué trata el fragmento.
const tokens = FRAGMENTOS.map((f) => normalizar(`${f.titulo} ${f.titulo} ${f.seccion ?? ""} ${f.seccion ?? ""} ${f.texto}`));
const largoMedio = tokens.reduce((s, t) => s + t.length, 0) / Math.max(tokens.length, 1);
const df = new Map<string, number>();
for (const t of tokens) for (const w of new Set(t)) df.set(w, (df.get(w) ?? 0) + 1);
const N = tokens.length;

function peso(doc: Doc | undefined): number {
  if (!doc) return 1;
  if (doc.tipo === "transcripcion") return 0.75;
  if (["sesion", "tema", "estudio"].includes(doc.tipo)) return 1.25;
  return 1;
}

export type Resultado = { doc: Doc; fragmento: Fragmento; puntaje: number };

/** Los mejores documentos para una consulta, cada uno con su fragmento más relevante. */
export function buscar(consulta: string, limite = 8, filtro?: (d: Doc) => boolean): Resultado[] {
  const q = [...new Set(normalizar(consulta))];
  if (!q.length) return [];
  const k1 = 1.2, b = 0.75;
  const mejor = new Map<string, Resultado>();
  tokens.forEach((t, i) => {
    let s = 0;
    const tf = new Map<string, number>();
    for (const w of t) tf.set(w, (tf.get(w) ?? 0) + 1);
    for (const w of q) {
      const f = tf.get(w);
      if (!f) continue;
      const idf = Math.log(1 + (N - (df.get(w) ?? 0) + 0.5) / ((df.get(w) ?? 0) + 0.5));
      s += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * t.length) / largoMedio)));
    }
    if (!s) return;
    const frag = FRAGMENTOS[i];
    const doc = docPorRuta(frag.ruta);
    if (!doc || (filtro && !filtro(doc))) return;
    s *= peso(doc);
    const prev = mejor.get(frag.ruta);
    if (!prev || s > prev.puntaje) mejor.set(frag.ruta, { doc, fragmento: frag, puntaje: s });
  });
  return [...mejor.values()].sort((a, b) => b.puntaje - a.puntaje).slice(0, limite);
}

/** Un trozo del fragmento alrededor de las palabras buscadas. */
export function extracto(texto: string, consulta: string, largo = 320): string {
  const q = normalizar(consulta);
  const plano = texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  let pos = -1;
  for (const w of q) {
    const p = plano.indexOf(w);
    if (p >= 0 && (pos < 0 || p < pos)) pos = p;
  }
  const inicio = Math.max(0, pos - 80);
  const t = texto.slice(inicio, inicio + largo).trim();
  return (inicio > 0 ? "…" : "") + t + (inicio + largo < texto.length ? "…" : "");
}
