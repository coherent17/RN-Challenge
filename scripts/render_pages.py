#!/usr/bin/env python3
"""Render every PDF page referenced by content/*.json to <outdir>/pN.jpg.
Usage: render_pages.py [outdir=docs/figures] [dpi=100] [quality=60]"""
import json, glob, pathlib, sys
import fitz
root = pathlib.Path(__file__).resolve().parent.parent
pdf = root / "RN saunders pdf.pdf"
out = root / (sys.argv[1] if len(sys.argv) > 1 else "docs/figures"); out.mkdir(parents=True, exist_ok=True)
dpi = int(sys.argv[2]) if len(sys.argv) > 2 else 100; q = int(sys.argv[3]) if len(sys.argv) > 3 else 60
pages = set()
for f in glob.glob(str(root / "content/ch*.json")):
    d = json.load(open(f, encoding="utf-8"))
    for k in ("sections", "critical_points", "mnemonics", "questions"):
        for x in d.get(k, []): pages.update(x.get("pdf_pages", []))
    pages.update(g["pdf_page"] for g in d.get("figures", []))
doc = fitz.open(str(pdf)); n = 0
for p in sorted(pages):
    dst = out / f"p{p}.jpg"
    if dst.exists() or dst.with_suffix(".webp").exists(): continue
    doc[p - 1].get_pixmap(dpi=dpi).save(str(dst), jpg_quality=q); n += 1
    try:   # smaller files when Pillow is available
        from PIL import Image
        Image.open(dst).save(dst.with_suffix(".webp"), "WEBP", quality=60, method=6); dst.unlink()
    except ImportError: pass
print(f"{len(pages)} referenced pages, rendered {n} new")
