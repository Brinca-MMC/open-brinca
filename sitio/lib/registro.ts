// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Brinca
//
// Dónde quedan las consultas al servidor MCP. Siempre van a los registros de Vercel (una línea JSON
// por llamada), que duran poco. Si el proyecto tiene una base Redis de Upstash (las variables
// UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN, o las KV_REST_API_* que crea el marketplace de
// Vercel), se guardan además en una lista por mes, `consultas:AAAA-MM`, que se borra sola a los 330
// días: así se cumple el plazo de la política de privacidad (como máximo 12 meses).

const URL_REDIS = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const VIDA = 330 * 24 * 3600;

export type Consulta = {
  fecha: string;
  herramienta: string;
  argumentos: unknown;
  cliente: unknown;
  agente: string;
  estado: number;
  ms: number;
};

export async function registrar(consultas: Consulta[]): Promise<void> {
  for (const c of consultas) console.log(JSON.stringify({ evento: "consulta_mcp", ...c }));
  if (!URL_REDIS || !TOKEN || !consultas.length) return;
  const clave = `consultas:${consultas[0].fecha.slice(0, 7)}`;
  try {
    await fetch(`${URL_REDIS}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify([["RPUSH", clave, ...consultas.map((c) => JSON.stringify(c))], ["EXPIRE", clave, VIDA, "NX"]]),
      signal: AbortSignal.timeout(2000),
    });
  } catch (e) {
    console.error(JSON.stringify({ evento: "registro_fallido", error: String(e) }));
  }
}
