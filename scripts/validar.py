#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Brinca
"""validar.py — revisa que el contenido de Open Brinca esté en forma.

Comprueba cuatro cosas y sale con código 1 si alguna falla:
  1. Cada archivo de eventos/, webinars/ y metodo/ empieza con sus metadatos
     (`id`, `tipo`, `actualizado`), y los `id` no se repiten.
  2. Los enlaces internos de todos los .md apuntan a un archivo que existe.
  3. Las imágenes pesan como máximo 300 KB.
  4. No quedan marcas de conflicto de git.

Las relaciones entre documentos las revisa aparte `metodo/grafo/grafo.py --check`.

Uso: python3 scripts/validar.py
"""
import os, re, sys
from urllib.parse import unquote

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CON_METADATOS = ("eventos", "webinars", "metodo")
OBLIGATORIOS = ("id", "tipo", "actualizado")
MAX_IMAGEN = 300 * 1024
SALTAR = {".git", "node_modules", "__pycache__"}
ENLACE = re.compile(r"\]\(((?:[^()\s]|\([^()]*\))+)\)")
CONFLICTO = re.compile(r"^(<{7}|>{7}) ", re.M)


def archivos(ext):
    for dp, dns, fns in os.walk(REPO):
        dns[:] = [d for d in dns if d not in SALTAR]
        for fn in fns:
            if fn.lower().endswith(ext):
                yield os.path.join(dp, fn)


def metadatos(texto):
    m = re.match(r"---\n(.*?)\n---\n", texto, re.S)
    if not m:
        return None
    return {l.split(":", 1)[0].strip(): l.split(":", 1)[1].strip()
            for l in m.group(1).splitlines() if ":" in l and not l.startswith(" ")}


def sin_codigo(texto):
    """El texto sin código (bloques ni codespans): un enlace de ejemplo no tiene que existir."""
    texto = re.sub(r"^```.*?^```", "", texto, flags=re.M | re.S)
    return re.sub(r"``.*?``|`[^`\n]*`", "", texto)


def main():
    errores, ids = [], {}
    for path in sorted(archivos(".md")):
        rel = os.path.relpath(path, REPO)
        with open(path, encoding="utf-8") as f:
            texto = f.read()
        if CONFLICTO.search(texto):
            errores.append(f"{rel}: tiene marcas de conflicto de git")
        if rel.split(os.sep)[0] in CON_METADATOS:
            meta = metadatos(texto)
            if meta is None:
                errores.append(f"{rel}: no empieza con metadatos (--- … ---)")
            else:
                faltan = [k for k in OBLIGATORIOS if not meta.get(k)]
                if faltan:
                    errores.append(f"{rel}: faltan metadatos: {', '.join(faltan)}")
                if meta.get("id"):
                    if meta["id"] in ids:
                        errores.append(f"{rel}: el id «{meta['id']}» ya lo usa {ids[meta['id']]}")
                    ids[meta["id"]] = rel
        for destino in ENLACE.findall(sin_codigo(texto)):
            destino = destino.split("#")[0].strip()
            if not destino or re.match(r"^[a-z][a-z0-9+.-]*:", destino, re.I):
                continue                 # anclas, https:, mailto:
            ruta = os.path.normpath(os.path.join(os.path.dirname(path), unquote(destino)))
            if not os.path.exists(ruta):
                errores.append(f"{rel}: enlace roto a {destino}")

    for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
        for path in archivos(ext):
            peso = os.path.getsize(path)
            if peso > MAX_IMAGEN:
                errores.append(f"{os.path.relpath(path, REPO)}: pesa {peso // 1024} KB (máximo 300 KB)")

    print(f"documentos con metadatos: {len(ids)} · errores: {len(errores)}")
    for e in errores:
        print(f"  ✗ {e}")
    sys.exit(1 if errores else 0)


if __name__ == "__main__":
    main()
