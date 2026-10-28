// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Brinca

import { notFound } from "next/navigation";
import { DOCS, docPorUrl } from "../../lib/contenido";
import Documento, { metadatos } from "../Documento";

export const dynamicParams = false;

export function generateStaticParams() {
  return DOCS.filter((d) => d.url !== "/").map((d) => ({ ruta: d.url.slice(1).split("/") }));
}

type Props = { params: Promise<{ ruta: string[] }> };

export async function generateMetadata({ params }: Props) {
  const { ruta } = await params;
  const doc = docPorUrl("/" + ruta.map(decodeURIComponent).join("/"));
  return doc ? metadatos(doc) : {};
}

export default async function Pagina({ params }: Props) {
  const { ruta } = await params;
  const doc = docPorUrl("/" + ruta.map(decodeURIComponent).join("/"));
  if (!doc) notFound();
  return <Documento doc={doc} />;
}
