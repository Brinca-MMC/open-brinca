import type { NextConfig } from "next";

const config: NextConfig = {
  // Las páginas son estáticas: se arman en el build desde el markdown. Solo /mcp corre en el servidor.
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/(.*)\\.md", headers: [{ key: "Content-Type", value: "text/markdown; charset=utf-8" }] },
      { source: "/llms.txt", headers: [{ key: "Content-Type", value: "text/plain; charset=utf-8" }] },
    ];
  },
};

export default config;
