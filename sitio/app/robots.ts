// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Brinca
//
// Los buscadores y los asistentes que leen una página porque alguien lo pidió entran a todo. Los
// rastreadores que juntan datos para entrenar modelos no entran a las transcripciones: su licencia
// (CC BY-NC-ND 4.0) no permite el uso comercial, y la autorización de los speakers es para difundir.

import type { MetadataRoute } from "next";
import { BASE } from "../lib/contenido";

const ENTRENAMIENTO = ["GPTBot", "ClaudeBot", "Google-Extended", "CCBot", "Applebot-Extended", "meta-externalagent", "Bytespider"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: ENTRENAMIENTO, allow: "/", disallow: ["/*/transcripcion", "/*/transcripcion.md"] },
      { userAgent: "*", allow: "/" },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
