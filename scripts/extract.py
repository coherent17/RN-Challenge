#!/usr/bin/env python3
"""Split the Saunders PDF into per-chapter text files using its outline.

Usage: python3 scripts/extract.py [pdf_path]
Writes build/chapters.json and build/text/chNN.txt (gitignored: copyrighted source text).
Each text file has '=== PDF PAGE n (printed LABEL) ===' markers.
"""
import json, re, sys, pathlib
import fitz

root = pathlib.Path(__file__).resolve().parent.parent
pdf = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / "RN saunders pdf.pdf"
out = root / "build"; (out / "text").mkdir(parents=True, exist_ok=True)

doc = fitz.open(str(pdf))
toc = doc.get_toc()
clean = lambda s: s.replace("\xad", "").strip()

chapters, part = [], None
entries = [(l, clean(t), p) for l, t, p in toc]
for i, (lvl, title, page) in enumerate(entries):
    if lvl == 1:
        m = re.match(r"([IVXL]+) - (.+)", title)
        part = {"roman": m.group(1), "title": m.group(2)} if m else None
    elif lvl == 2:
        m = re.match(r"(\d+) - (.+)", title)
        if not m: continue
        # end page = next level<=2 entry with a larger start page (and not in a later part's front matter)
        end = next((p - 1 for l, t, p in entries[i + 1:] if l <= 2 and p > page), page)
        chapters.append({"number": int(m.group(1)), "title": m.group(2), "part": part,
                         "pdf_start": page, "pdf_end": end})

for ch in chapters:
    buf = []
    for pn in range(ch["pdf_start"], ch["pdf_end"] + 1):
        pg = doc[pn - 1]
        buf.append(f"\n=== PDF PAGE {pn} (printed {pg.get_label() or '?'}) ===\n{pg.get_text()}")
    (out / "text" / f"ch{ch['number']:02d}.txt").write_text("".join(buf), encoding="utf-8")
    ch["printed_start"] = doc[ch["pdf_start"] - 1].get_label()
    ch["printed_end"] = doc[ch["pdf_end"] - 1].get_label()

(out / "chapters.json").write_text(json.dumps(chapters, indent=1, ensure_ascii=False), encoding="utf-8")
print(f"{len(chapters)} chapters")
