#!/usr/bin/env python3
"""Generate the static site into docs/ from data/chapters.json + content/chNN.json.
Usage: python3 scripts/build.py
"""
import json, pathlib, html, re, sys, shutil, math
from collections import Counter
from jinja2 import Environment, FileSystemLoader, select_autoescape

root = pathlib.Path(__file__).resolve().parent.parent
LOCAL = "--local" in sys.argv   # private build: book page images + external free questions -> site-local/
docs = root / ("site-local" if LOCAL else "docs"); docs.mkdir(exist_ok=True)
shutil.copy(root / "data/page_labels.json", root / "docs/assets/labels.json")   # page labels for the book viewer
chapters = json.load(open(root / "data/chapters.json"))
labels = json.load(open(root / "data/page_labels.json"))

PART_ZH = {"I": "NCLEX-RN 考試準備", "II": "護理專業標準", "III": "照護基礎", "IV": "全生命週期的成長與發展",
 "V": "產科護理", "VI": "兒科護理", "VII": "成人皮膚問題", "VIII": "成人腫瘤與血液問題", "IX": "成人內分泌問題",
 "X": "成人胃腸問題", "XI": "成人呼吸問題", "XII": "成人心血管問題", "XIII": "成人腎臟與泌尿問題",
 "XIV": "成人眼耳問題", "XV": "成人神經問題", "XVI": "成人肌肉骨骼問題", "XVII": "成人免疫問題",
 "XVIII": "成人心理健康問題", "XIX": "複雜照護"}

def pg(p):
    return {"pdf": p, "book": labels.get(str(p), "?"), "img": f"book.pdf#page={p}" if (docs / "book.pdf").exists() else None}
def pagerefs(lst):
    return [pg(p) for p in lst or []]

examq = {}
for c in chapters:
    f = root / f"content/examq/ch{c['number']:02d}.json"
    if f.exists():
        examq[c["number"]] = json.load(open(f, encoding="utf-8"))

content = {}
for c in chapters:
    f = root / f"content/ch{c['number']:02d}.json"
    if f.exists():
        content[c["number"]] = json.load(open(f, encoding="utf-8"))
for c in chapters:
    d = content.get(c["number"])
    c["zh"] = d["title"]["zh"] if d else c["title"]
    c["ready"] = d is not None
    c["part_zh"] = PART_ZH.get(c["part"]["roman"], c["part"]["title"])
    c["range"] = {"pdf": f"{c['pdf_start']}–{c['pdf_end']}", "book": f"{c['printed_start']}–{c['printed_end']}"}

env = Environment(loader=FileSystemLoader(str(root / "scripts/templates")), autoescape=select_autoescape(["html"]))
env.globals["pagerefs"] = pagerefs

import hashlib
ASSET_V = hashlib.md5(b"".join((root / "docs/assets" / f).read_bytes() for f in ("app.js", "style.css"))).hexdigest()[:8]   # cache-buster

def render(name, **kw):
    return env.get_template(name).render(chapters=chapters, v=ASSET_V, **kw)

def resolve_refs(d):
    def refs_for(pages, *texts):
        refs = pagerefs(pages)
        a = anchor_terms(" ".join(t for t in texts if t))
        for r in refs: r["q"] = a
        return refs
    for key in ("sections", "critical_points", "mnemonics", "questions"):
        for x in d.get(key, []):
            texts = [x.get("en"), (x.get("heading") or {}).get("en"), (x.get("stem") or {}).get("en"),
                     (x.get("rationale") or {}).get("en"), " ".join(p.get("en", "") for p in x.get("points", []))]
            x["refs"] = refs_for(x.get("pdf_pages"), *texts)
    for g in d.get("figures", []):
        g["refs"] = refs_for([g["pdf_page"]], (g.get("caption") or {}).get("en"))

# ---- local-only: map free external questions to the best-matching chapter ----
STOP = set("the and for with that this from have has are was were will would should which following client clients nurse nursing care when what after before about their there they them been into than then also most more other such only some each does not".split())
tok = lambda t: [w for w in re.findall(r"[a-z]{4,}", t.lower()) if w not in STOP]
def anchor_terms(text, n=2):
    """Pick the n longest distinct non-stopword words in `text`, for the book
    viewer to search for and highlight on the cited page (best effort; not
    guaranteed to match, since our text is a paraphrase, not a verbatim quote)."""
    words = sorted(set(w for w in re.findall(r"[A-Za-z][A-Za-z'-]{4,}", text or "") if w.lower() not in STOP),
                    key=lambda w: (-len(w), w))
    return " ".join(w.lower() for w in words[:n])
ext_by_ch = {}
TOPIC_CH = {"cardiology": {37, 53, 54}, "endocrine": {33, 47, 48}, "fluid-electrolytes": {8, 9}, "pediatrics": set(range(30, 43)),
            "mental-health": set(range(65, 70)), "prioritization-delegation-management": {5, 6, 7}, "respiratory": {36, 51, 52},
            "med-surg-critical-care": set(range(43, 65)), "pharmacology": {14, 29, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 69},
            "fundamentals-of-nursing": set(range(10, 18))}
docs_tok = {n: Counter(tok(json.dumps(d["sections"] + d["critical_points"], ensure_ascii=False))) for n, d in content.items()}
df = Counter(w for c in docs_tok.values() for w in c)
idf = lambda w: math.log(1 + len(docs_tok) / df[w]) if df[w] else 0
ext = []
for f in sorted((root / "content/external").glob("*.json")): ext += json.load(open(f, encoding="utf-8"))
for q in ext:
    words = set(tok(q["stem"] + " " + " ".join(q["options"])))
    def score(n):
        c = docs_tok[n]; sc = sum(idf(w) * math.log(1 + c[w]) for w in words if w in c)
        return sc * (1.5 if n in TOPIC_CH.get(q["topic"], set()) else 1.0)
    q["letters"] = ", ".join("ABCDEFGH"[i] for i in q["answer"])
    best = max(docs_tok, key=score)
    if score(best) > 0: ext_by_ch.setdefault(best, []).append(q)
if LOCAL:
    shutil.copytree(root / "docs/assets", docs / "assets", dirs_exist_ok=True)
    if (root / "docs/book.pdf").exists() and not (docs / "book.pdf").exists(): (docs / "book.pdf").symlink_to(root / "docs/book.pdf")

parts = []
for c in chapters:
    if not parts or parts[-1][0]["roman"] != c["part"]["roman"]: parts.append((c["part"], []))
    parts[-1][1].append(c)
for pi, (part, chs) in enumerate(parts):          # one accent hue per part (golden-angle spread)
    for c in chs:
        c["hue"] = int((pi * 137.5 + 205) % 360)
for c in chapters:
    d = content.get(c["number"])
    c["total"] = (len(d["sections"]) + len(d["questions"]) + len(ext_by_ch.get(c["number"], []))) if d else 0

# quick-quiz data: every question, bilingual
PART_OF = {c["number"]: c["part"]["roman"] for c in chapters}
qdata = []
for n, d in sorted(content.items()):
    for i, q in enumerate(d["questions"], 1):
        qdata.append({"ch": n, "t": {"en": d["title"]["en"], "zh": d["title"]["zh"]}, "part": PART_OF[n], "stem": q["stem"], "options": q["options"], "answer": q["answer"],
                      "why": q["rationale"], "refs": q.get("pdf_pages", [])[:3], "src": q["source"]["title"], "id": f"c{n}:p{i}"})
    for i, q in enumerate(ext_by_ch.get(n, []), 1):
        bi = lambda t: {"en": t, "zh": t}
        qdata.append({"ch": n, "t": {"en": d["title"]["en"], "zh": d["title"]["zh"]}, "part": PART_OF[n], "stem": bi(q["stem"]), "options": [bi(o) for o in q["options"]], "answer": q["answer"],
                      "why": {"en": "Correct answer: " + q["letters"], "zh": "正確答案：" + q["letters"]}, "refs": [], "src": q["source"], "id": f"c{n}:e{i}"})
    for q in examq.get(n, []):
        qdata.append({"ch": n, "t": {"en": d["title"]["en"], "zh": d["title"]["zh"]}, "part": PART_OF[n], "stem": q["stem"], "options": q["options"], "answer": q["answer"],
                      "why": q["rationale"], "refs": q.get("pdf_pages", [])[:3], "src": "Original NCLEX-style item, written for this site", "cat0": q.get("cat")})

# ---- mock-exam metadata: NCLEX client-needs category (approximate chapter mapping) and a heuristic difficulty ----
CAT = {}
for n in (5, 6, 7): CAT[n] = "MC"
for n in (8, 9, 25, 27, *range(30, 42), 43, 45, 47, 49, 51, 53, 55, 57, 59, 61, 63, 70): CAT[n] = "PA"
for n in (10, 15, 23): CAT[n] = "RR"
for n in (11, 16, 17): CAT[n] = "BC"
for n in (12, 18, 19, 20, 21, 22, 24, 26, 28): CAT[n] = "HP"
CAT[13] = "SI"
for n in (14, 29, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 69): CAT[n] = "PH"
for n in (65, 66, 67, 68): CAT[n] = "PI"
def difficulty(q):
    s = q["stem"]["en"].lower(); b = 0.0
    if len(q["answer"]) > 1: b += 0.6                                           # select-all-that-apply
    if re.search(r"\b(priority|first|initial|most important|best|immediately|next|prioritize)\b", s): b += 0.5   # prioritization / analysis
    if re.search(r"should the nurse (report|question|clarify|intervene|withhold)|requires? (follow-up|intervention)|further teaching", s): b += 0.4
    if re.search(r"\d", s): b += 0.2
    b += min(0.5, max(-0.3, (len(s.split()) - 25) / 80))
    if re.match(r"(what is|what are|which of the following (is|are) (a|an|the) (sign|symptom|definition|normal|characteristic))", s): b -= 0.5
    return round(max(-1.5, min(1.5, b)), 2)

for q in qdata:
    q["cat"] = q.pop("cat0", None) or CAT.get(q["ch"]); q["b"] = difficulty(q)
(docs / "assets").mkdir(exist_ok=True)
(docs / "assets/questions.json").write_text(json.dumps(qdata, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
sidx = {"ch": {}, "items": []}
for n, d in sorted(content.items()):
    sidx["ch"][n] = [d["title"]["en"], d["title"]["zh"]]
    it = sidx["items"]
    for i, s in enumerate(d["sections"], 1):
        it.append([n, "h", f"s{i}", s["heading"]["en"], s["heading"]["zh"], "", ""])
        for p in s["points"]: it.append([n, "p", f"s{i}", p["en"], p["zh"], s["heading"]["en"], s["heading"]["zh"]])
    for i, c in enumerate(d["critical_points"], 1): it.append([n, "c", f"k{i}", c["en"], c["zh"], "", ""])
    for i, m in enumerate(d.get("mnemonics", []), 1): it.append([n, "m", f"m{i}", m["en"], m["zh"], "", ""])
    for i, q in enumerate(d["questions"], 1): it.append([n, "q", f"p{i}", q["stem"]["en"], q["stem"]["zh"], "", ""])
    for g in d.get("figures", []): it.append([n, "f", "figures", g["caption"]["en"], g["caption"]["zh"], "", ""])
(docs / "assets/search.json").write_text(json.dumps(sidx, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
(docs / "index.html").write_text(render("index.html", title="Home", page="home", chapter=None, parts=parts), encoding="utf-8")
(docs / "exam.html").write_text(render("exam.html", title="Mock Exam", page="exam", chapter=None, parts=parts), encoding="utf-8")
(docs / "quiz.html").write_text(render("quiz.html", title="Quick Quiz", page="quiz", chapter=None, parts=parts), encoding="utf-8")
(docs / "review.html").write_text(render("review.html", title="Review Mistakes", page="review", chapter=None, parts=parts), encoding="utf-8")
for i, c in enumerate(chapters):
    d = content.get(c["number"])
    if d: resolve_refs(d)
    page = render("chapter.html", title=f"Ch {c['number']} {c['title']}", page="chapter", chapter=c, d=d, ext=ext_by_ch.get(c["number"], []),
                  prev=chapters[i - 1] if i else None, next=chapters[i + 1] if i + 1 < len(chapters) else None)
    (docs / f"ch{c['number']:02d}.html").write_text(page, encoding="utf-8")
(docs / ".nojekyll").write_text("")
print(f"{'LOCAL ' if LOCAL else ''}built {len(chapters)} pages ({len(content)} with content), {len(qdata)} quiz questions ({sum(len(v) for v in examq.values())} from examq, {sum(len(v) for v in ext_by_ch.values())} from free UWorld samples)")
