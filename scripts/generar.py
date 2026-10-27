#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Brinca
"""generar.py — regenera lo que se deriva de los metadatos de las sesiones.

Una sesión dice en sus metadatos quién habló, de qué temas trata y qué estudios cita. De ahí
salen, sin que nadie las escriba a mano:
  1. la lista de sesiones de cada página de personas/, temas/ y estudios/;
  2. el índice de cada una de esas carpetas, en su README.md;
  3. quién habló en cada evento, en eventos/<evento>/evento/personas.md;
  4. llms.txt (el mapa del repositorio para asistentes de IA) y catalogo.json (lo mismo, para
     programas: sesiones, personas, temas, estudios y cifras).

Solo reescribe lo que está entre `<!-- AUTO:<nombre> -->` y `<!-- /AUTO:<nombre> -->`, y los
dos archivos de la raíz enteros.

Uso:
  python3 scripts/generar.py           escribe
  python3 scripts/generar.py --check   no escribe; sale con código 1 si algo quedó desactualizado
"""
import json, os, re, sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL_BASE = "https://raw.githubusercontent.com/Brinca-MMC/open-brinca/main/"
URL_REPO = "https://github.com/Brinca-MMC/open-brinca"
MESES = "ene feb mar abr may jun jul ago sep oct nov dic".split()
ROLES = (("speakers", "speaker"), ("modera", "modera"), ("intervienen", "interviene"))


# ── lectura ──────────────────────────────────────────────────────────────────

def valor(v):
    v = v.strip()
    if v.startswith("[") and v.endswith("]"):
        return [valor(x) for x in v[1:-1].split(",") if x.strip()]
    if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
        return v[1:-1].replace('\\"', '"')
    return int(v) if re.fullmatch(r"-?\d+", v) else v


def leer(ruta):
    """(metadatos, cuerpo) de un .md; los metadatos son claves simples y listas en línea."""
    with open(os.path.join(REPO, ruta), encoding="utf-8") as f:
        texto = f.read()
    m = re.match(r"---\n(.*?)\n---\n", texto, re.S)
    if not m:
        return {}, texto
    meta = {}
    for linea in m.group(1).splitlines():
        if ":" in linea and not linea.startswith((" ", "#")):
            k, v = linea.split(":", 1)
            meta[k.strip()] = valor(v)
    return meta, texto[m.end():]


def titulo_y_lede(cuerpo):
    m = re.search(r"^# (.+)$", cuerpo, re.M)
    titulo = m.group(1).strip() if m else ""
    resto = cuerpo[m.end():] if m else cuerpo
    for parrafo in re.split(r"\n\s*\n", resto):
        p = parrafo.strip()
        if p and not p.startswith(("#", "|", "```", "<!--", "![")):
            return titulo, " ".join(re.sub(r"^>\s?", "", p, flags=re.M).split())
    return titulo, ""


def lista(meta, clave):
    v = meta.get(clave) or []
    return v if isinstance(v, list) else [v]


def md_de(carpeta):
    base = os.path.join(REPO, carpeta)
    if not os.path.isdir(base):
        return []
    return sorted(os.path.join(carpeta, f) for f in os.listdir(base)
                  if f.endswith(".md") and f != "README.md")


def sesiones():
    rutas = []
    for raiz in ("eventos", "webinars"):
        for dp, dns, fns in os.walk(os.path.join(REPO, raiz)):
            dns.sort()
            if "README.md" in fns:
                ruta = os.path.relpath(os.path.join(dp, "README.md"), REPO)
                if leer(ruta)[0].get("tipo") == "sesion":
                    rutas.append(ruta)
    out = []
    for ruta in rutas:
        meta, cuerpo = leer(ruta)
        titulo, lede = titulo_y_lede(cuerpo)
        out.append({"ruta": ruta, "meta": meta, "h1": titulo, "lede": lede})
    return sorted(out, key=lambda s: (str(s["meta"].get("fecha", "")), s["ruta"]))


def paginas(carpeta):
    out = {}
    for ruta in md_de(carpeta):
        meta, cuerpo = leer(ruta)
        titulo, lede = titulo_y_lede(cuerpo)
        slug = os.path.splitext(os.path.basename(ruta))[0]
        out[slug] = {"ruta": ruta, "meta": meta, "h1": titulo, "lede": lede, "cuerpo": cuerpo}
    return out


def eventos():
    out = {}
    base = os.path.join(REPO, "eventos")
    for e in sorted(os.listdir(base)) if os.path.isdir(base) else []:
        ruta = os.path.join("eventos", e, "README.md")
        if os.path.isfile(os.path.join(REPO, ruta)):
            out[e] = titulo_y_lede(leer(ruta)[1])[0]
    return out


def ancla(texto):
    """El ancla que GitHub le da a un encabezado."""
    return re.sub(r"[^\w\- ]", "", texto.strip().lower()).replace(" ", "-")


def cifras(estudio):
    """Las cifras de una página de estudio: cada `### ` bajo `## Cifras`, con sus campos."""
    m = re.search(r"^## Cifras\n(.*?)(?=^## |\Z)", estudio["cuerpo"], re.S | re.M)
    if not m:
        return []
    out = []
    for bloque in re.split(r"^### ", m.group(1), flags=re.M)[1:]:
        enunciado, _, resto = bloque.partition("\n")
        campos = dict((k.lower(), v.strip()) for k, v in
                      re.findall(r"^- \*\*([^*]+):\*\* (.+)$", resto, re.M))
        out.append({"id": ancla(enunciado), "enunciado": enunciado.strip(),
                    "url": URL_REPO + "/blob/main/" + estudio["ruta"] + "#" + ancla(enunciado),
                    **campos})
    return out


# ── texto derivado ───────────────────────────────────────────────────────────

def rel(desde, hacia):
    return os.path.relpath(os.path.join(REPO, hacia), os.path.dirname(os.path.join(REPO, desde)))


def fecha(f):
    m = re.fullmatch(r"(\d{4})-(\d\d)-(\d\d)", str(f))
    return f"{int(m.group(3))} {MESES[int(m.group(2)) - 1]} {m.group(1)}" if m else str(f)


def donde(s, evs):
    e = s["meta"].get("evento")
    lugar = evs.get(e, e) if e else s["meta"].get("serie", "Webinar")
    return f"{lugar}, {fecha(s['meta'].get('fecha', ''))}"


def nombre_sesion(s):
    return s["meta"].get("titulo") or s["h1"]


def linea_sesion(desde, s, evs, extra=""):
    return f"- [{nombre_sesion(s)}]({rel(desde, s['ruta'])}) · {donde(s, evs)}{extra}"


def roles_de(slug, s):
    return [r for clave, r in ROLES if slug in lista(s["meta"], clave)]


def reemplazar(texto, nombre, nuevo):
    patron = re.compile(rf"(<!-- AUTO:{nombre} [^\n]*-->\n).*?(<!-- /AUTO:{nombre} -->)", re.S)
    if not patron.search(texto):
        return texto
    return patron.sub(lambda m: m.group(1) + nuevo + m.group(2), texto)


def generar():
    """{ruta: contenido nuevo} de todo lo que este script escribe."""
    ses, evs = sesiones(), eventos()
    per, tem, est = paginas("personas"), paginas("temas"), paginas("estudios")
    out = {}

    def bloque(ruta, nombre, lineas):
        actual = out.get(ruta)
        if actual is None:
            with open(os.path.join(REPO, ruta), encoding="utf-8") as f:
                actual = f.read()
        out[ruta] = reemplazar(actual, nombre, "\n".join(lineas) + "\n" if lineas else "")

    for slug, p in per.items():
        bloque(p["ruta"], "sesiones", [linea_sesion(p["ruta"], s, evs, " · " + ", ".join(roles_de(slug, s)))
                                       for s in ses if roles_de(slug, s)])
    for slug, t in tem.items():
        bloque(t["ruta"], "sesiones", [linea_sesion(t["ruta"], s, evs, " · tema principal"
                                                    if lista(s["meta"], "temas")[:1] == [slug] else "")
                                       for s in ses if slug in lista(s["meta"], "temas")])
    for slug, e in est.items():
        bloque(e["ruta"], "sesiones", [linea_sesion(e["ruta"], s, evs)
                                       for s in ses if slug in lista(s["meta"], "estudios")])

    def n_ses(slug, clave_fn):
        return sum(1 for s in ses if clave_fn(slug, s))

    if per:
        filas = ["| Persona | Cargo | Sesiones |", "|---|---|---|"]
        for slug, p in sorted(per.items(), key=lambda kv: kv[1]["meta"].get("nombre", kv[0])):
            filas.append(f"| [{p['meta'].get('nombre', slug)}]({slug}.md) | {p['meta'].get('cargo', '')} "
                         f"| {n_ses(slug, lambda a, s: roles_de(a, s))} |")
        bloque("personas/README.md", "indice", filas)
    if tem:
        filas = ["| Tema | Qué cubre | Sesiones |", "|---|---|---|"]
        for slug, t in tem.items():
            filas.append(f"| [{t['meta'].get('nombre', t['h1'])}]({slug}.md) | {t['lede']} "
                         f"| {n_ses(slug, lambda a, s: a in lista(s['meta'], 'temas'))} |")
        bloque("temas/README.md", "indice", filas)
    if est:
        filas = ["| Estudio | Autores | Año | Cifras | Sesiones |", "|---|---|---|---|---|"]
        for slug, e in est.items():
            filas.append(f"| [{e['h1']}]({slug}.md) | {e['meta'].get('autores', '')} "
                         f"| {e['meta'].get('anio', '')} | {len(cifras(e))} "
                         f"| {n_ses(slug, lambda a, s: a in lista(s['meta'], 'estudios'))} |")
        bloque("estudios/README.md", "indice", filas)

    for ev in evs:
        ruta = os.path.join("eventos", ev, "evento", "personas.md")
        if not os.path.isfile(os.path.join(REPO, ruta)):
            continue
        del_evento = [s for s in ses if s["meta"].get("evento") == ev]
        filas = ["| Persona | Cargo | Sesiones |", "|---|---|---|"]
        for slug, p in sorted(per.items(), key=lambda kv: kv[1]["meta"].get("nombre", kv[0])):
            suyas = [s for s in del_evento if roles_de(slug, s)]
            if suyas:
                links = "<br>".join(f"[{nombre_sesion(s)}]({rel(ruta, s['ruta'])}) ({', '.join(roles_de(slug, s))})"
                                    for s in suyas)
                filas.append(f"| [{p['meta'].get('nombre', slug)}]({rel(ruta, p['ruta'])}) "
                             f"| {p['meta'].get('cargo', '')} | {links} |")
        bloque(ruta, "personas", filas)

    out["llms.txt"] = llms(ses, per, tem, est, evs)
    out["catalogo.json"] = catalogo(ses, per, tem, est, evs)
    return out


def llms(ses, per, tem, est, evs):
    meta, cuerpo = leer("README.md")
    _, lede = titulo_y_lede(cuerpo)
    l = ["# Open Brinca", "", f"> {lede}", "",
         "Cada afirmación lleva su marca [mm:ss]. Las fichas (README.md de cada sesión) resumen; "
         "transcripcion.md trae el texto completo. Cómo recorrer y citar: AGENTS.md. Licencias por "
         "capa: LICENSE.md (las transcripciones, sin uso comercial ni obras derivadas). Fuente: "
         f"«Open Brinca, de Brinca», {URL_REPO}.", ""]
    l.append("## Sesiones")
    for s in ses:
        l.append(f"- [{nombre_sesion(s)} · {donde(s, evs)}]({URL_BASE}{s['ruta']}): {s['lede']}")
    for titulo, grupo in (("Temas", tem), ("Personas", per), ("Estudios y cifras", est)):
        if grupo:
            l += ["", f"## {titulo}"]
            for slug, p in grupo.items():
                nombre = p["meta"].get("nombre") or p["h1"]
                l.append(f"- [{nombre}]({URL_BASE}{p['ruta']}): {p['lede']}")
    l += ["", "## Optional",
          f"- [AGENTS.md]({URL_BASE}AGENTS.md): cómo recorrer el repositorio y cómo citar",
          f"- [LICENSE.md]({URL_BASE}LICENSE.md): qué se puede hacer con cada parte",
          f"- [Método de transcripción]({URL_BASE}metodo/transcripcion/README.md): cómo se hizo cada sesión",
          f"- [El grafo]({URL_BASE}metodo/grafo/nucleo.md): cómo se relacionan los documentos",
          f"- [catalogo.json]({URL_BASE}catalogo.json): todo lo anterior en JSON, con las cifras", ""]
    return "\n".join(l)


def catalogo(ses, per, tem, est, evs):
    def nodo(p, **extra):
        return {"ruta": p["ruta"], "url": URL_REPO + "/blob/main/" + p["ruta"], "titulo": p["h1"],
                "lede": p["lede"], **{k: v for k, v in p["meta"].items() if k != "actualizado"}, **extra}
    data = {
        "nombre": "Open Brinca",
        "repositorio": URL_REPO,
        "licencias": URL_REPO + "/blob/main/LICENSE.md",
        "sesiones": [nodo(s, transcripcion=os.path.join(os.path.dirname(s["ruta"]), "transcripcion.md"),
                          donde=donde(s, evs)) for s in ses],
        "personas": [nodo(p) for p in per.values()],
        "temas": [nodo(t) for t in tem.values()],
        "estudios": [nodo(e, cifras=cifras(e)) for e in est.values()],
    }
    return json.dumps(data, ensure_ascii=False, indent=1) + "\n"


def main():
    check = "--check" in sys.argv
    cambios, todo = [], generar()
    for ruta, nuevo in todo.items():
        path = os.path.join(REPO, ruta)
        actual = open(path, encoding="utf-8").read() if os.path.isfile(path) else None
        if actual != nuevo:
            cambios.append(ruta)
            if not check:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(nuevo)
    if check and cambios:
        print("desactualizado (corre python3 scripts/generar.py):")
        for r in cambios:
            print(f"  ✗ {r}")
        sys.exit(1)
    print(f"al día: {len(todo)} archivos" if check else f"reescritos {len(cambios)} de {len(todo)} archivos")


if __name__ == "__main__":
    main()
