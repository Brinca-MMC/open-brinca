// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Brinca
//
// Íconos de Lucide (lucide-static, licencia ISC) como SVG en línea. Se leen en el build.

import fs from "node:fs";
import path from "node:path";

const cache = new Map<string, string>();

export function icono(nombre: string): string {
  if (!cache.has(nombre)) {
    const archivo = path.join(process.cwd(), "node_modules", "lucide-static", "icons", `${nombre}.svg`);
    const svg = fs
      .readFileSync(archivo, "utf8")
      .replace(/<!--[\s\S]*?-->\s*/g, "")
      .replace(/\s+/g, " ")
      .replace(/ width="24" height="24"/, ' width="1em" height="1em" aria-hidden="true"')
      .trim();
    cache.set(nombre, svg);
  }
  return cache.get(nombre)!;
}
