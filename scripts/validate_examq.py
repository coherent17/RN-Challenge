#!/usr/bin/env python3
"""Validate exam-bank question files. Usage: validate_examq.py content/examq/ch08.json [...]"""
import json, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
chs = {c["number"]: c for c in json.load(open(root / "data/chapters.json"))}
CATS = {"MC", "SI", "HP", "PI", "BC", "PH", "RR", "PA"}

def bi(o, path, errs):
    if not (isinstance(o, dict) and isinstance(o.get("en"), str) and isinstance(o.get("zh"), str) and o["en"].strip() and o["zh"].strip()):
        errs.append(f"{path}: needs non-empty en and zh strings")

def validate(f):
    errs = []
    try:
        n = int(pathlib.Path(f).stem.replace("ch", ""))
    except ValueError:
        return [f"filename must be chNN.json"]
    if n not in chs: return [f"unknown chapter number {n}"]
    ch = chs[n]
    items = json.load(open(f, encoding="utf-8"))
    if not isinstance(items, list) or len(items) < 4:
        return [f"expected a JSON array of >=4 items, got {type(items).__name__} of length {len(items) if isinstance(items, list) else '?'}"]
    for i, q in enumerate(items):
        p = f"[{i}]"
        if q.get("cat") not in CATS: errs.append(f"{p}.cat invalid: {q.get('cat')!r} (want one of {sorted(CATS)})")
        bi(q.get("stem"), f"{p}.stem", errs)
        opts = q.get("options", [])
        if not 3 <= len(opts) <= 6: errs.append(f"{p}.options: {len(opts)} (want 3-6)")
        for j, o in enumerate(opts): bi(o, f"{p}.options[{j}]", errs)
        ans = q.get("answer")
        if not (isinstance(ans, list) and ans and all(isinstance(x, int) and 0 <= x < len(opts) for x in ans)):
            errs.append(f"{p}.answer invalid: {ans!r}")
        bi(q.get("rationale"), f"{p}.rationale", errs)
        pages = q.get("pdf_pages")
        if not (isinstance(pages, list) and pages and all(isinstance(x, int) for x in pages)):
            errs.append(f"{p}.pdf_pages must be a non-empty int list")
        else:
            for pg in pages:
                if not ch["pdf_start"] <= pg <= ch["pdf_end"]:
                    errs.append(f"{p}.pdf_pages: page {pg} outside chapter range {ch['pdf_start']}-{ch['pdf_end']}")
    return errs

bad = 0
for f in sys.argv[1:]:
    e = validate(f)
    print(("OK   " if not e else "FAIL ") + f + (f"  ({len(json.load(open(f))) if not isinstance(json.load(open(f)), list) else len(json.load(open(f)))} items)" if not e else ""))
    for x in e: print("   -", x)
    bad += bool(e)
sys.exit(1 if bad else 0)
