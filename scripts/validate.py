#!/usr/bin/env python3
"""Validate chapter content files. Usage: validate.py content/ch08.json [...]"""
import json, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
chs = {c["number"]: c for c in json.load(open(root / "data/chapters.json"))}
def bi(o, path, errs):
    if not (isinstance(o, dict) and isinstance(o.get("en"), str) and isinstance(o.get("zh"), str) and o["en"].strip() and o["zh"].strip()):
        errs.append(f"{path}: needs non-empty en and zh strings")
def pages(lst, ch, path, errs):
    if not (isinstance(lst, list) and lst and all(isinstance(p, int) for p in lst)):
        errs.append(f"{path}: pdf_pages must be a non-empty int list"); return
    for p in lst:
        if not ch["pdf_start"] <= p <= ch["pdf_end"]:
            errs.append(f"{path}: page {p} outside chapter range {ch['pdf_start']}-{ch['pdf_end']}")
def validate(f):
    errs = []; d = json.load(open(f)); n = d.get("number")
    if n not in chs: return [f"unknown chapter number {n}"]
    ch = chs[n]
    if f"ch{n:02d}" not in pathlib.Path(f).name: errs.append("filename must be chNN.json")
    bi(d.get("title"), "title", errs); bi(d.get("overview"), "overview", errs)
    S = d.get("sections", [])
    if not 4 <= len(S) <= 14: errs.append(f"sections: {len(S)} (want 5-12)")
    for i, s in enumerate(S):
        bi(s.get("heading"), f"sections[{i}].heading", errs)
        if not s.get("points"): errs.append(f"sections[{i}] has no points")
        for j, p in enumerate(s.get("points", [])): bi(p, f"sections[{i}].points[{j}]", errs)
        pages(s.get("pdf_pages"), ch, f"sections[{i}]", errs)
    C = d.get("critical_points", [])
    if len(C) < 6: errs.append(f"critical_points: {len(C)} (want 8-20)")
    for i, c in enumerate(C): bi(c, f"critical_points[{i}]", errs); pages(c.get("pdf_pages"), ch, f"critical_points[{i}]", errs)
    for i, m in enumerate(d.get("mnemonics", [])): bi(m, f"mnemonics[{i}]", errs); pages(m.get("pdf_pages"), ch, f"mnemonics[{i}]", errs)
    for i, g in enumerate(d.get("figures", [])):
        bi(g.get("caption"), f"figures[{i}].caption", errs); pages([g.get("pdf_page")], ch, f"figures[{i}]", errs)
        if g.get("image_url") and not (g.get("credit") and g["image_url"].startswith("https://")): errs.append(f"figures[{i}]: image_url needs https + credit")
    Q = d.get("questions", [])
    if len(Q) < 4: errs.append(f"questions: {len(Q)} (want 5-10)")
    for i, q in enumerate(Q):
        bi(q.get("stem"), f"questions[{i}].stem", errs); bi(q.get("rationale"), f"questions[{i}].rationale", errs)
        o = q.get("options", [])
        if len(o) < 3: errs.append(f"questions[{i}]: needs >=3 options")
        for j, x in enumerate(o): bi(x, f"questions[{i}].options[{j}]", errs)
        a = q.get("answer")
        if not (isinstance(a, list) and a and all(isinstance(x, int) and 0 <= x < len(o) for x in a)): errs.append(f"questions[{i}].answer invalid")
        pages(q.get("pdf_pages"), ch, f"questions[{i}]", errs)
        s = q.get("source", {})
        if s.get("type") not in ("original", "web") or not s.get("title"): errs.append(f"questions[{i}].source invalid")
        if s.get("type") == "web" and not str(s.get("url", "")).startswith("http"): errs.append(f"questions[{i}].source needs url")
        if "uworld" in json.dumps(s).lower() and s.get("type") == "web": errs.append(f"questions[{i}]: do not reproduce UWorld content")
    for i, r in enumerate(d.get("resources", [])):
        if not str(r.get("url", "")).startswith("http") or not r.get("title"): errs.append(f"resources[{i}] needs title+url")
        bi(r.get("note"), f"resources[{i}].note", errs)
    return errs
bad = 0
for f in sys.argv[1:]:
    e = validate(f)
    print(("OK   " if not e else "FAIL ") + f)
    for x in e: print("   -", x)
    bad += bool(e)
sys.exit(1 if bad else 0)
