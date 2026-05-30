import json
from pathlib import Path

def extract_lighthouse_json(html_path):
    h = html_path.read_text(encoding="utf-8")
    key = "window.__LIGHTHOUSE_JSON__ = "
    start = h.find(key)
    if start < 0:
        return None
    i = start + len(key)
    if i >= len(h) or h[i] != "{":
        return None
    depth = 0
    in_str = False
    esc = False
    while i < len(h):
        c = h[i]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
            i += 1
            continue
        if c == '"':
            in_str = True
            i += 1
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return json.loads(h[start + len(key) : i + 1])
        i += 1
    return None

def print_metrics(j, label):
    if not j:
        print(label, "parse failed")
        return
    perf = j.get("categories", {}).get("performance", {}).get("score")
    audits = j.get("audits", {})
    print()
    print(label)
    print("  URL:", j.get("finalUrl") or j.get("requestedUrl"))
    if perf is not None:
        print("  Performance score:", round(perf * 100))
    for aid in ("largest-contentful-paint", "first-contentful-paint", "total-blocking-time", "speed-index"):
        v = audits.get(aid, {}).get("numericValue")
        print("  " + aid + ":", round(v) if v is not None else "n/a")

root = Path(r"c:\Users\USUARIO\Desktop\CARPETA-DIGITAL\repositorios-ecommerce\e-comerce-docs-front")
print_metrics(extract_lighthouse_json(root / "lh-site-home-desktop.html"), "NEW local")
print_metrics(extract_lighthouse_json(root / "lh" / "prod.report.html"), "BASELINE prod")
