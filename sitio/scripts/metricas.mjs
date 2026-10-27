// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Brinca
//
// metricas.mjs — el resumen de un mes de consultas al servidor MCP, desde la base Redis donde las
// guarda lib/registro.ts. Uso: node scripts/metricas.mjs 2026-11
// Necesita UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN (o KV_REST_API_URL y KV_REST_API_TOKEN).

const URL_REDIS = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const mes = process.argv[2] || new Date().toISOString().slice(0, 7);
if (!URL_REDIS || !TOKEN) {
  console.error("Faltan las variables de la base Redis (ver lib/registro.ts).");
  process.exit(1);
}

const res = await fetch(`${URL_REDIS}/lrange/consultas:${mes}/0/-1`, { headers: { Authorization: `Bearer ${TOKEN}` } });
const consultas = ((await res.json()).result || []).map((x) => JSON.parse(x));

const contar = (f) => {
  const m = new Map();
  for (const c of consultas) {
    const k = f(c);
    if (k) m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};
const tabla = (titulo, filas, n = 15) =>
  `\n## ${titulo}\n\n| | Consultas |\n|---|---|\n` + filas.slice(0, n).map(([k, v]) => `| ${String(k).replace(/\|/g, "/")} | ${v} |`).join("\n");

const cliente = (c) => (c.cliente && c.cliente.name) || (c.agente || "").split(/[ /]/)[0] || "sin nombre";
const dias = new Set(consultas.map((c) => c.fecha.slice(0, 10))).size;

console.log(`# Consultas al servidor MCP de Open Brinca, ${mes}

${consultas.length} consultas en ${dias} días · ${contar(cliente).length} clientes distintos · ${consultas.filter((c) => c.estado >= 400).length} con error`);
console.log(tabla("Por herramienta", contar((c) => c.herramienta)));
console.log(tabla("Por cliente", contar(cliente)));
console.log(tabla("Lo que más se buscó", contar((c) => c.herramienta === "search" && c.argumentos?.query?.toLowerCase().trim())));
console.log(tabla("Lo que más se abrió", contar((c) => c.herramienta === "fetch" && c.argumentos?.id)));
console.log(tabla("Búsquedas de cifras", contar((c) => c.herramienta === "find_figures" && (c.argumentos?.query || c.argumentos?.study))));
