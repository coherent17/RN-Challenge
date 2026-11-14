#!/usr/bin/env python3
"""Render every PDF page referenced by content/*.json to <outdir>/pN.jpg.
Usage: render_pages.py [outdir=docs/figures] [dpi=150] [quality=75]"""
import json, glob, pathlib, sys
import fitz
root = pathlib.Path(__file__).resolve().parent.parent
pdf = root / "RN saunders pdf.pdf"
out = root / (sys.argv[1] if len(sys.argv) > 1 else "docs/figures"); out.mkdir(parents=True, exist_ok=True)
dpi = int(sys.argv[2]) if len(sys.argv) > 2 else 150; q = int(sys.argv[3]) if len(sys.argv) > 3 else 75
pages = set()
for f in glob.glob(str(root / "content/ch*.json")):
    d = json.load(open(f, encoding="utf-8"))
    for k in ("sections", "critical_points", "mnemonics", "questions"):
        for x in d.get(k, []): pages.update(x.get("pdf_pages", []))
    pages.update(g["pdf_page"] for g in d.get("figures", []))
doc = fitz.open(str(pdf)); n = 0
try:
    from PIL import Image
except ImportError:
    Image = None
for p in sorted(pages):
    dst = out / f"p{p}.webp" if Image else out / f"p{p}.jpg"
    if dst.exists(): continue
    pix = doc[p - 1].get_pixmap(dpi=dpi)
    if Image:   # render losslessly, then encode once (no double compression)
        Image.frombytes("RGB", (pix.width, pix.height), pix.samples).save(dst, "WEBP", quality=q, method=6)
    else:
        pix.save(str(dst), jpg_quality=q)
    n += 1
print(f"{len(pages)} referenced pages, rendered {n} new")
