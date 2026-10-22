#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Brinca
"""grafo.py — la maquinaria del grafo de conocimiento de Brinca.

Hace tres cosas sobre las mismas aristas, y por eso viven juntas:
  1. REGENERA los bloques `## Referido por` (el espejo de cada arista, derivado).
  2. VALIDA que cada arista apunte a un archivo que existe dentro del repositorio.
  3. VALIDA que cada `tipo` esté declarado en el núcleo o en un diccionario local, y que
     cada palabra local aterrice con `más-general` en una declarada.

Principio: una arista se escribe UNA vez, del lado del origen, en `## Conexiones` (con su
«por qué»). Este script deriva el espejo: en cada nodo de destino escribe un `## Referido por`
con solo tipo + link, sin el «por qué», que vive en el origen. Así un lector ve su vecindario
sin grep y sin duplicar significado. La sintaxis y el vocabulario están en `nucleo.md`, al
lado de este archivo.

Configuración opcional en `.grafo.toml`, en la raíz del repositorio:

  nucleo  = "metodo/grafo/nucleo.md"     # por defecto, el nucleo.md junto a este script
  locales = ["grafo.local.md"]           # diccionarios con las palabras propias del repo
  raices  = ["eventos", "webinars"]      # por defecto, todo el repositorio
  excluir = ["borradores", "eventos/x"]  # nombres de carpeta o rutas que no se recorren

Uso:
  python3 metodo/grafo/grafo.py          # aplica los cambios
  python3 metodo/grafo/grafo.py --check  # no escribe; reporta deriva y errores (exit 1)
"""
import argparse, os, re, subprocess, sys
import tomllib
from urllib.parse import unquote

AQUI = os.path.dirname(os.path.abspath(__file__))
SKIP = {"node_modules", ".next", ".venv", "venv", "__pycache__", ".git", "dist", "build",
        "out", "_archive", "_site", ".vercel"}
# La ruta admite un nivel de paréntesis: una carpeta llamada «taller (en pausa)» cortaba el
# link en el primer `)` y la arista salía como rota sin estarlo.
EDGE = re.compile(r"^- `([^`]+)` \[([^\]]+)\]\(((?:[^()]|\([^()]*\))+)\)")
# Una entrada del diccionario es un encabezado que empieza por un codespan: `#### `tipo``.
# Puede declarar dos tipos a la vez: `profundiza` ⇄ `comprime`.
ENTRADA = re.compile(r"^#{2,4}\s+(`.+)$", re.M)
GEN_MARK = ("<!-- AUTO-GENERADO por grafo.py · no editar a mano · "
            "el «por qué» vive en el origen (## Conexiones) -->")
# Reconoce también la marca de versiones anteriores del script (otra ruta, otro nombre),
# para que un repositorio que migra no se quede con espejos huérfanos.
GEN_RE = re.compile(r"<!-- AUTO-GENERADO por \S*grafo[\w.-]*\.py ")


def raiz_repo():
    try:
        out = subprocess.run(["git", "rev-parse", "--show-toplevel"], capture_output=True,
                             text=True, check=True)
        return out.stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return os.getcwd()


def leer_config(repo, args):
    cfg = {}
    ruta = os.path.join(repo, ".grafo.toml")
    if os.path.isfile(ruta):
        with open(ruta, "rb") as f:
            cfg = tomllib.load(f)
    nucleo = args.nucleo or cfg.get("nucleo")
    nucleo = os.path.join(repo, nucleo) if nucleo else os.path.join(AQUI, "nucleo.md")
    locales = args.local or cfg.get("locales", [])
    raices = args.raices or cfg.get("raices", [])
    excluir = set(cfg.get("excluir", [])) | set(args.excluir or [])
    return {
        "repo": repo,
        "nucleo": nucleo,
        "locales": [os.path.join(repo, p) for p in locales],
        "raices": [os.path.normpath(os.path.join(repo, r)) for r in raices] or [repo],
        "excluir_nombres": SKIP | {e for e in excluir if "/" not in e},
        "excluir_rutas": {os.path.normpath(os.path.join(repo, e)) for e in excluir if "/" in e},
    }


def entradas(path):
    """{tipo: texto de su entrada} de un diccionario; None si el archivo no existe."""
    try:
        with open(path, encoding="utf-8") as f:
            txt = f.read()
    except OSError:
        return None
    txt = re.sub(r"^```.*?^```", "", txt, flags=re.M | re.S)   # un ejemplo dentro de un bloque de código no declara nada
    out, marcas = {}, list(ENTRADA.finditer(txt))
    for i, m in enumerate(marcas):
        fin = marcas[i + 1].start() if i + 1 < len(marcas) else len(txt)
        sig = re.search(r"^#{1,4}\s", txt[m.end():fin], re.M)   # la entrada termina en el próximo encabezado
        cuerpo = txt[m.end(): m.end() + sig.start()] if sig else txt[m.end():fin]
        for tipo in re.findall(r"`([^`]+)`", m.group(1)):
            out[tipo] = cuerpo
    return out


def vocabulario(cfg):
    """Los tipos declarados y los errores del propio vocabulario.

    El vocabulario es infinito pero **anclado**: cualquier palabra vale si tiene entrada con
    `más-general` hacia una palabra declarada. Sin algo que lo compruebe, esa regla se pudre
    sola: en un repositorio de Brinca, un tercio de las aristas llegó a usar tipos sin declarar.
    """
    rel = lambda p: os.path.relpath(p, cfg["repo"])
    nucleo = entradas(cfg["nucleo"])
    if nucleo is None:
        return None, [f"no encontré el núcleo: {rel(cfg['nucleo'])}"]
    declarados, errores, locales = set(nucleo), [], {}
    for abs_path in cfg["locales"]:
        path = rel(abs_path)
        loc = entradas(abs_path)
        if loc is None:
            errores.append(f"no encontré el diccionario local: {path}")
            continue
        for tipo, cuerpo in loc.items():
            if tipo in nucleo:
                errores.append(f"`{tipo}` ya está en el núcleo; un diccionario local no lo redefine ({path})")
                continue
            locales[tipo] = (cuerpo, path)
    declarados |= set(locales)
    for tipo, (cuerpo, path) in locales.items():
        m = re.search(r"más-general:?\s*`([^`]+)`", cuerpo)
        if not m:
            errores.append(f"`{tipo}` no dice con `más-general` en qué palabra declarada aterriza ({path})")
        elif m.group(1) not in declarados:
            errores.append(f"`{tipo}` aterriza en `{m.group(1)}`, que no está declarada ({path})")
    return declarados, errores


def excluido(path, cfg):
    ap = os.path.normpath(path)
    return any(ap == r or ap.startswith(r + os.sep) for r in cfg["excluir_rutas"])


def md_files(cfg):
    for base in cfg["raices"]:
        if not os.path.isdir(base):
            continue
        for dp, dns, fns in os.walk(base):
            dns[:] = [d for d in dns if d not in cfg["excluir_nombres"] and not d.startswith(".")
                      and not excluido(os.path.join(dp, d), cfg)]
            for fn in fns:
                if fn.endswith(".md"):
                    yield os.path.join(dp, fn)


def in_scope(path, cfg):
    ap = os.path.abspath(path)
    return (any(ap.startswith(r + os.sep) for r in cfg["raices"]) and not excluido(ap, cfg))


def title(path):
    """Título legible del nodo: frontmatter `titulo` o `title`, su H1, o el nombre del archivo."""
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            lines = f.read().splitlines()
    except OSError:
        return os.path.splitext(os.path.basename(path))[0]
    if lines and lines[0].strip() == "---":
        for ln in lines[1:]:
            if ln.strip() == "---":
                break
            m = re.match(r"\s*(?:titulo|title):\s*(.+)", ln)
            if m:
                return m.group(1).strip().strip('"').strip("'")
    for ln in lines:
        if ln.startswith("# "):
            return re.sub(r"[*`\\]", "", ln[2:]).strip()
    return os.path.splitext(os.path.basename(path))[0]


def conexiones_edges(text):
    """(tipo, ruta) de cada arista DENTRO del bloque `## Conexiones`."""
    edges, in_sec, in_fence = [], False, False
    for line in text.splitlines():
        if line.lstrip().startswith("```"):
            in_fence = not in_fence            # no parsear ejemplos dentro de code fences
            continue
        if in_fence:
            continue
        if line.startswith("## "):
            in_sec = line.strip() == "## Conexiones"
            continue
        if in_sec:
            m = EDGE.match(line)
            if m:
                edges.append((m.group(1), m.group(3)))
    return edges


def bloque_referidos(content):
    """(inicio, fin) del bloque `## Referido por` que empieza en una línea propia, o None."""
    marker = "## Referido por"
    pos = content.find(marker)
    while pos != -1 and pos != 0 and content[pos - 1] != "\n":
        pos = content.find(marker, pos + 1)
    if pos == -1:
        return None
    nxt = re.search(r"\n## ", content[pos + len(marker):])
    fin = pos + len(marker) + nxt.start() + 1 if nxt else len(content)
    return pos, fin


def upsert(content, block):
    """Reemplaza un `## Referido por` existente (de encabezado a encabezado) o lo añade al final."""
    span = bloque_referidos(content)
    if span is None:
        return content.rstrip("\n") + "\n\n" + block.rstrip("\n") + "\n"
    before, after = content[:span[0]].rstrip("\n"), content[span[1]:]
    if after:
        return before + "\n\n" + block.rstrip("\n") + "\n\n" + after
    return before + "\n\n" + block.rstrip("\n") + "\n"


def strip_referidos(content):
    """Quita un bloque `## Referido por` generado (de encabezado a encabezado o al final)."""
    span = bloque_referidos(content)
    if span is None or not GEN_RE.search(content[span[0]:span[1]]):
        return content
    before, after = content[:span[0]].rstrip("\n"), content[span[1]:]
    return before + "\n\n" + after if after else before + "\n"


def main():
    ap = argparse.ArgumentParser(description="Regenera `## Referido por` y valida el grafo.")
    ap.add_argument("--check", action="store_true",
                    help="no escribe; reporta deriva, links rotos y tipos sin declarar (exit 1)")
    ap.add_argument("--repo", help="raíz del repositorio (por defecto, la de git)")
    ap.add_argument("--nucleo", help="ruta del núcleo, relativa al repositorio")
    ap.add_argument("--local", action="append", help="diccionario local (se puede repetir)")
    ap.add_argument("--raices", nargs="+", help="carpetas que se recorren")
    ap.add_argument("--excluir", nargs="+", help="nombres de carpeta o rutas que no se recorren")
    args = ap.parse_args()

    repo = os.path.abspath(args.repo) if args.repo else raiz_repo()
    cfg = leer_config(repo, args)

    rev, dangling, usados = {}, [], {}   # rev: target_abs -> {source_abs -> set(tipos)}
    declarados, errores_vocab = vocabulario(cfg)
    for src in md_files(cfg):
        with open(src, encoding="utf-8", errors="replace") as f:
            text = f.read()
        for tipo, rel in conexiones_edges(text):
            rel = rel.split("#")[0].strip()
            if not rel or rel.startswith(("http://", "https://", "mailto:")):
                continue
            # El tipo se comprueba aunque el link esté roto: son dos deudas distintas.
            usados.setdefault(tipo, []).append(src)
            # Un link escrito con %20 o %28 es válido en markdown; sin decodificar, toda ruta
            # con espacios o paréntesis se reportaba rota.
            tgt = os.path.normpath(os.path.join(os.path.dirname(src), unquote(rel)))
            # Un link que sale del repositorio resuelve solo en la máquina de quien lo escribió:
            # se reporta aunque el archivo exista.
            if not tgt.startswith(repo + os.sep):
                dangling.append((src, tipo, rel + "  (sale del repositorio)"))
                continue
            if os.path.isdir(tgt):
                if not os.path.isfile(os.path.join(tgt, "README.md")):
                    continue             # carpeta sin README: el link vale, no hay dónde espejarlo
                tgt = os.path.join(tgt, "README.md")
            if not os.path.isfile(tgt):
                dangling.append((src, tipo, rel))
                continue
            rev.setdefault(tgt, {}).setdefault(src, set()).add(tipo)

    changed = []
    for tgt, sources in rev.items():
        # El espejo se escribe SOLO en markdown: pegarle un bloque a un .html o a un .json lo rompe.
        if not in_scope(tgt, cfg) or not tgt.endswith(".md"):
            continue
        rows = []
        for src in sorted(sources):
            tipos = ", ".join(f"`{t}`" for t in sorted(sources[src]))
            rel = os.path.relpath(src, os.path.dirname(tgt))
            rows.append(f"- {tipos} ← [{title(src)}]({rel})")
        block = f"## Referido por\n\n{GEN_MARK}\n\n" + "\n".join(rows) + "\n"
        with open(tgt, encoding="utf-8") as f:
            content = f.read()
        new = upsert(content, block)
        if new != content:
            changed.append(tgt)
            if not args.check:
                with open(tgt, "w", encoding="utf-8") as f:
                    f.write(new)

    targets = {os.path.normpath(t) for t in rev}            # limpieza de espejos huérfanos
    for f in md_files(cfg):
        if os.path.normpath(f) in targets:
            continue
        with open(f, encoding="utf-8", errors="replace") as fh:
            content = fh.read()
        if GEN_RE.search(content):
            new = strip_referidos(content)
            if new != content:
                changed.append(f)
                if not args.check:
                    with open(f, "w", encoding="utf-8") as fh:
                        fh.write(new)

    n_edges = sum(len(ts) for s in rev.values() for ts in s.values())
    verb = "a actualizar" if args.check else "actualizados"
    print(f"aristas: {n_edges} · nodos con backlinks: {len(rev)} · archivos {verb}: {len(changed)}")
    for c in changed:
        print(f"  ~ {os.path.relpath(c, repo)}")
    if dangling:
        print(f"LINKS ROTOS ({len(dangling)}):")
        for src, tipo, rel in dangling:
            print(f"  ✗ {os.path.relpath(src, repo)}: `{tipo}` -> {rel}")
    if errores_vocab:
        print(f"VOCABULARIO ({len(errores_vocab)}):")
        for e in errores_vocab:
            print(f"  ! {e}")
    sin_declarar = {}
    if declarados is not None:
        sin_declarar = {t: v for t, v in usados.items() if t not in declarados}
    if sin_declarar:
        total = sum(len(v) for v in sin_declarar.values())
        print(f"TIPOS SIN DECLARAR ({len(sin_declarar)} tipos, {total} aristas) — dales entrada "
              f"en un diccionario local con `más-general`, o cámbialos por una palabra del núcleo:")
        for t, srcs in sorted(sin_declarar.items(), key=lambda kv: -len(kv[1])):
            ej = os.path.relpath(srcs[0], repo)
            print(f"  ? `{t}` · {len(srcs)} uso(s) · p.ej. {ej}")
    if args.check and (changed or dangling or sin_declarar or errores_vocab):
        sys.exit(1)


if __name__ == "__main__":
    main()
