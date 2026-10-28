// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Brinca

import { docPorUrl } from "../lib/contenido";
import Documento, { metadatos } from "./Documento";

const portada = docPorUrl("/")!;
export const metadata = metadatos(portada);

export default function Portada() {
  return (
    <>
      <div className="conectar-aviso">
        Conéctalo a tu asistente: <code>https://open.brinca.com/mcp</code> · <a href="/conectar">cómo, en cada asistente</a>
      </div>
      <Documento doc={portada} />
    </>
  );
}
