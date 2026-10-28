// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Brinca

import type { MetadataRoute } from "next";
import { DOCS, urlAbsoluta } from "../lib/contenido";

export default function sitemap(): MetadataRoute.Sitemap {
  return DOCS.map((d) => ({
    url: urlAbsoluta(d),
    lastModified: d.meta.actualizado ? String(d.meta.actualizado) : undefined,
    changeFrequency: "monthly",
    priority: d.tipo === "sesion" || d.url === "/" ? 1 : d.tipo === "transcripcion" ? 0.5 : 0.7,
  }));
}
