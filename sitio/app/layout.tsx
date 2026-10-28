// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Brinca

import type { ReactNode } from "react";
import { BASE } from "../lib/contenido";
import "./estilo.css";

export const metadata = {
  metadataBase: new URL(BASE),
  icons: { icon: "/favicon.svg", apple: "/apple-touch-icon.png" },
};

// Primero las ideas, después las fuentes.
const NAV = [
  ["Temas", "/temas"],
  ["Personas", "/personas"],
  ["Estudios", "/estudios"],
  ["Impacta IA 2026", "/eventos/impacta-ia-2026"],
  ["Webinars", "/webinars"],
  ["Conectar", "/conectar"],
];

export default function Raiz({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="cabecera">
          <a className="marca" href="/">Open Brinca</a>
          <nav>{NAV.map(([t, u]) => <a key={u} href={u}>{t}</a>)}</nav>
        </header>
        <main>{children}</main>
        <footer className="pie">
          <p>
            <a href="/metodo">Método</a> · <a href="/LICENSE">Licencias</a> · <a href="/privacidad">Privacidad</a> ·{" "}
            <a href="/terminos">Términos</a> · <a href="/soporte">Soporte</a> · <a href="https://github.com/Brinca-MMC/open-brinca">GitHub</a>
          </p>
        </footer>
      </body>
    </html>
  );
}
