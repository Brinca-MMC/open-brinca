// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Brinca
//
// probar-mcp.mjs — llama a cada herramienta del servidor MCP y revisa que responda lo esperado.
// Uso: node scripts/probar-mcp.mjs [URL]   (por defecto, http://localhost:3000/mcp)

const URL_MCP = process.argv[2] || "http://localhost:3000/mcp";
let id = 0;

async function rpc(method, params = {}) {
  const res = await fetch(URL_MCP, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
  });
  const cuerpo = await res.text();
  const json = cuerpo.startsWith("{") ? JSON.parse(cuerpo) : JSON.parse(cuerpo.split("\n").find((l) => l.startsWith("data: ")).slice(6));
  if (json.error) throw new Error(`${method}: ${JSON.stringify(json.error)}`);
  return json.result;
}

const herramienta = async (name, args) => {
  const r = await rpc("tools/call", { name, arguments: args });
  return { error: r.isError, estructurado: r.structuredContent, datos: (() => { try { return JSON.parse(r.content[0].text); } catch { return r.content[0].text; } })() };
};

let fallas = 0;
const revisar = (nombre, ok, detalle) => {
  console.log(`${ok ? "✓" : "✗"} ${nombre}${detalle ? " · " + detalle : ""}`);
  if (!ok) fallas++;
};

const ini = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "probar-mcp", version: "1" } });
revisar("initialize", ini.serverInfo?.name === "open-brinca", `${ini.serverInfo?.name} ${ini.serverInfo?.version}`);

const { tools } = await rpc("tools/list");
revisar("tools/list", tools.length === 6, tools.map((t) => t.name).join(", "));
revisar("todas de solo lectura", tools.every((t) => t.annotations?.readOnlyHint === true && t.annotations?.openWorldHint === false));

const s = await herramienta("search", { query: "gobernanza de la IA en la empresa" });
revisar("search", s.datos.results?.length > 0 && s.datos.results.every((r) => r.id && r.title && r.url), s.datos.results?.slice(0, 3).map((r) => r.id.split("/").slice(-2).join("/")).join(" | "));

revisar("search trae structuredContent", Array.isArray(s.estructurado?.results) && s.estructurado.results.length === s.datos.results.length);

const f = await herramienta("fetch", { id: s.datos.results[0].id });
revisar("fetch trae structuredContent", typeof f.estructurado?.text === "string" && f.estructurado.url === f.datos.url);
revisar("fetch", f.datos.text?.length > 500 && f.datos.url?.startsWith("https://"), `${f.datos.title} · ${f.datos.text?.length} caracteres`);

const f2 = await herramienta("fetch", { id: "no/existe.md" });
revisar("fetch de algo que no existe da error", f2.error === true);

const l = await herramienta("list_sessions", { topic: "regulacion" });
revisar("list_sessions por tema", l.datos.count > 0, `${l.datos.count} sesiones de regulación`);

const lp = await herramienta("list_sessions", { person: "Puntoni" });
revisar("list_sessions por persona", lp.datos.count === 2, `${lp.datos.count} sesiones de Puntoni`);

const i = await herramienta("list_index", { kind: "studies" });
revisar("list_index", i.datos.count >= 10, `${i.datos.count} estudios`);

const c = await herramienta("find_figures", { query: "CAIO ROI" });
revisar("find_figures", c.datos.count > 0 && c.datos.figures.every((x) => x.verification), c.datos.figures?.[0]?.figure);

const g = await herramienta("get_connections", { id: "eventos/impacta-ia-2026/sesiones/dia2-01-keynote-ia-como-motor-productividad-innovacion-chile/README.md" });
revisar("get_connections", g.datos.outgoing?.length > 0 && g.datos.incoming?.length > 0, `${g.datos.outgoing?.length} salen, ${g.datos.incoming?.length} llegan`);

console.log(fallas ? `\n${fallas} fallas` : "\ntodo bien");
process.exit(fallas ? 1 : 0);
