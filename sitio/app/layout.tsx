// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Brinca

import type { ReactNode } from "react";
import { BASE } from "../lib/contenido";
import "./estilo.css";

export const metadata = {
  metadataBase: new URL(BASE),
  icons: { icon: "/favicon.svg", apple: "/apple-touch-icon.png" },
};

const NAV = [
  ["Impacta IA 2026", "/eventos/impacta-ia-2026"],
  ["Webinars", "/webinars"],
  ["Temas", "/temas"],
  ["Personas", "/personas"],
  ["Estudios", "/estudios"],
  ["Conectar", "/conectar"],
];

export default function Raiz({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="cabecera">
          <a className="marca" href="/">Open Brinca <span>de Brinca</span></a>
          <nav>{NAV.map(([t, u]) => <a key={u} href={u}>{t}</a>)}</nav>
        </header>
        <main>{children}</main>
        <footer className="pie">
          <p>
            Open Brinca lo cura y lo mantiene <a href="https://www.brinca.com">Brinca</a>. Lo que escribe Brinca, bajo CC BY 4.0; las
            transcripciones, bajo CC BY-NC-ND 4.0; las láminas, de sus autores. <a href="/LICENSE">Licencias</a> ·{" "}
            <a href="/conectar">Conectar a tu asistente</a> · <a href="/privacidad">Privacidad</a> · <a href="/terminos">Términos</a> · <a href="/soporte">Soporte</a> ·{" "}
            <a href="https://github.com/Brinca-MMC/open-brinca">GitHub</a> · <a href="/llms.txt">llms.txt</a>
          </p>
        </footer>
      </body>
    </html>
  );
}
