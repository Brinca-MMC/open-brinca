// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Brinca
//
// El servidor MCP de Open Brinca: https://open.brinca.com/mcp (Streamable HTTP, sin login).
// Registra cada llamada a una herramienta (cuál, con qué argumentos, qué cliente y cuánto tardó),
// sin la dirección IP ni nada que identifique a la persona: ver /privacidad.

import { createMcpHandler } from "mcp-handler";
import { registrar, INSTRUCCIONES, VERSION } from "../../lib/mcp";

const mcp = createMcpHandler(registrar, {
  serverInfo: { name: "open-brinca", version: VERSION },
  instructions: INSTRUCCIONES,
});

type Llamada = { herramienta: string; argumentos: unknown; cliente: unknown };

async function llamadas(req: Request): Promise<Llamada[]> {
  if (req.method !== "POST") return [];
  try {
    const cuerpo = await req.clone().json();
    return (Array.isArray(cuerpo) ? cuerpo : [cuerpo])
      .filter((m) => m?.method === "tools/call")
      .map((m) => ({
        herramienta: m.params?.name,
        argumentos: m.params?.arguments,
        cliente: m.params?._meta?.clientInfo ?? null,
      }));
  } catch {
    return [];
  }
}

async function handler(req: Request): Promise<Response> {
  const inicio = Date.now();
  const registro = await llamadas(req);
  const res = await mcp(req);
  const agente = (req.headers.get("user-agent") || "").slice(0, 120);
  for (const l of registro) {
    console.log(JSON.stringify({ evento: "consulta_mcp", ...l, agente, estado: res.status, ms: Date.now() - inicio }));
  }
  return res;
}

export const runtime = "nodejs";
export const maxDuration = 30;
export { handler as GET, handler as POST, handler as DELETE };
