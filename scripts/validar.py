#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Brinca
"""validar.py — revisa que el contenido de Open Brinca esté en forma.

Comprueba cinco cosas y sale con código 1 si alguna falla:
  1. Cada archivo de las carpetas de contenido empieza con sus metadatos
     (`id`, `tipo`, `actualizado`), y los `id` no se repiten.
  2. Los metadatos de cada sesión, persona, tema y estudio tienen sus campos, y cada
     persona, tema o estudio que nombra una sesión tiene su página.
  3. Los enlaces internos de todos los .md apuntan a un archivo que existe.
  4. Las imágenes pesan como máximo 300 KB.
  5. No quedan marcas de conflicto de git.

Las relaciones entre documentos las revisa aparte `metodo/grafo/grafo.py --check`, y lo que se
genera desde los metadatos, `scripts/generar.py --check`.

Uso: python3 scripts/validar.py
"""
import os, re, sys
from urllib.parse import unquote

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CON_METADATOS = ("eventos", "webinars", "metodo", "personas", "temas", "estudios", "evals")
FORMATOS = {"apertura", "keynote", "panel", "charla", "webinar"}
SESION = ("titulo", "fecha", "formato", "speakers", "idiomas", "duracion_min", "temas")
POR_TIPO = {"persona": ("nombre", "cargo"), "tema": ("nombre",), "estudio": ("autores", "anio")}
FECHA = re.compile(r"\d{4}-\d\d-\d\d")
OBLIGATORIOS = ("id", "tipo", "actualizado")
MAX_IMAGEN = 300 * 1024
SALTAR = {".git", "node_modules", "__pycache__", ".next", ".generado", "public"}  # public y .generado: los arma el sitio
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


def lista(v):
    v = (v or "").strip()
    if v.startswith("[") and v.endswith("]"):
        return [x.strip().strip("\"'") for x in v[1:-1].split(",") if x.strip()]
    return [v] if v else []


def slugs(carpeta):
    base = os.path.join(REPO, carpeta)
    return {f[:-3] for f in os.listdir(base) if f.endswith(".md") and f != "README.md"} \
        if os.path.isdir(base) else set()


def revisar_sesion(rel, meta, errores, existe):
    faltan = [k for k in SESION if not meta.get(k)]
    if rel.startswith("eventos") and not meta.get("evento"):
        faltan.append("evento")
    if faltan:
        errores.append(f"{rel}: faltan metadatos de sesión: {', '.join(faltan)}")
    if meta.get("fecha") and not FECHA.fullmatch(meta["fecha"]):
        errores.append(f"{rel}: la fecha va como AAAA-MM-DD, no «{meta['fecha']}»")
    if meta.get("formato") and meta["formato"] not in FORMATOS:
        errores.append(f"{rel}: formato «{meta['formato']}» no es uno de {', '.join(sorted(FORMATOS))}")
    if meta.get("duracion_min") and not meta["duracion_min"].isdigit():
        errores.append(f"{rel}: duracion_min va en minutos enteros")
    if meta.get("temas") and not 1 <= len(lista(meta["temas"])) <= 4:
        errores.append(f"{rel}: una sesión lleva de 1 a 4 temas")
    for clave, carpeta in (("speakers", "personas"), ("modera", "personas"),
                           ("intervienen", "personas"), ("temas", "temas"), ("estudios", "estudios")):
        for slug in lista(meta.get(clave)):
            if slug not in existe[carpeta]:
                errores.append(f"{rel}: {clave} nombra «{slug}», que no tiene página en {carpeta}/")


def sin_codigo(texto):
    """El texto sin código (bloques ni codespans): un enlace de ejemplo no tiene que existir."""
    texto = re.sub(r"^```.*?^```", "", texto, flags=re.M | re.S)
    return re.sub(r"``.*?``|`[^`\n]*`", "", texto)


def main():
    errores, ids = [], {}
    existe = {c: slugs(c) for c in ("personas", "temas", "estudios")}
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
                tipo = meta.get("tipo")
                if tipo == "sesion":
                    revisar_sesion(rel, meta, errores, existe)
                elif tipo in POR_TIPO and os.path.basename(path) != "README.md":
                    faltan = [k for k in POR_TIPO[tipo] if not meta.get(k)]
                    if faltan:
                        errores.append(f"{rel}: faltan metadatos de {tipo}: {', '.join(faltan)}")
                    if meta.get("id") != os.path.basename(path)[:-3]:
                        errores.append(f"{rel}: el id tiene que ser el nombre del archivo")
        for destino in ENLACE.findall(sin_codigo(texto)):
            destino = destino.split("#")[0].strip()
            if not destino or destino.startswith("/") or re.match(r"^[a-z][a-z0-9+.-]*:", destino, re.I):
                continue                 # anclas, https:, mailto: y rutas del sitio (/conectar)
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
