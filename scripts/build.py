#!/usr/bin/env python3
"""Generate the static site into docs/ from data/chapters.json + content/chNN.json.
Usage: python3 scripts/build.py
"""
import json, pathlib, html
from jinja2 import Environment, select_autoescape

root = pathlib.Path(__file__).resolve().parent.parent
docs = root / "docs"; docs.mkdir(exist_ok=True)
chapters = json.load(open(root / "data/chapters.json"))
labels = json.load(open(root / "data/page_labels.json"))

PART_ZH = {"I": "NCLEX-RN 考試準備", "II": "護理專業標準", "III": "照護基礎", "IV": "全生命週期的成長與發展",
 "V": "產科護理", "VI": "兒科護理", "VII": "成人皮膚問題", "VIII": "成人腫瘤與血液問題", "IX": "成人內分泌問題",
 "X": "成人胃腸問題", "XI": "成人呼吸問題", "XII": "成人心血管問題", "XIII": "成人腎臟與泌尿問題",
 "XIV": "成人眼耳問題", "XV": "成人神經問題", "XVI": "成人肌肉骨骼問題", "XVII": "成人免疫問題",
 "XVIII": "成人心理健康問題", "XIX": "複雜照護"}

def pg(p):
    return {"pdf": p, "book": labels.get(str(p), "?")}
def pagerefs(lst):
    return [pg(p) for p in lst or []]

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

env = Environment(autoescape=select_autoescape(["html"]))
env.globals["pagerefs"] = pagerefs

BASE = """<!doctype html>
<html lang="en" data-lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{{ title }} · NCLEX-RN Study Guide</title>
<link rel="stylesheet" href="assets/style.css">
<script>try{var l=new URLSearchParams(location.search).get('lang')||localStorage.getItem('lang')||(navigator.language||'').toLowerCase().startsWith('zh')&&'zh'||'en';document.documentElement.dataset.lang=l}catch(e){}</script>
</head><body>
<header class="top"><a class="brand" href="index.html">NCLEX-RN<span class="en"> Study Guide</span><span class="zh"> 學習指南</span></a>
<div class="tools">
{% if chapter %}<select id="jump" aria-label="Jump to chapter">
{% for c in chapters %}<option value="ch{{ '%02d' % c.number }}.html" {{ 'selected' if c.number == chapter.number }}>{{ c.number }}. {{ c.title }} / {{ c.zh }}</option>{% endfor %}</select>{% endif %}
<div class="lang" role="group" aria-label="Language"><button data-set="en">EN</button><button data-set="zh">中文</button><button data-set="both">EN+中</button></div>
</div></header>
<main>{% block body %}{% endblock %}</main>
<footer><p class="en">Original summaries of <em>Saunders Comprehensive Review for the NCLEX-RN® Examination</em>. Page tags (📖) point to the PDF page and the printed book page you should open to read the source. Educational use only; not affiliated with the publisher.</p>
<p class="zh">本站為《Saunders Comprehensive Review for the NCLEX-RN® Examination》之原創重點整理。📖 標籤標示 PDF 頁碼與書本印刷頁碼，方便對照原文。僅供學習使用，與出版社無關。</p></footer>
<script src="assets/app.js"></script></body></html>"""

INDEX = """{% extends base %}{% block body %}
<h1><span class="en">NCLEX-RN Study Guide</span><span class="zh">NCLEX-RN 學習指南</span></h1>
<p class="lead"><span class="en">Chapter-by-chapter summaries, test-critical points, mnemonics, figure pointers and practice questions, in English and Traditional Chinese.</span><span class="zh">逐章重點整理、考試關鍵點、記憶口訣、圖表索引與練習題，提供英文與繁體中文。</span></p>
{% for part, chs in parts %}<section class="part"><h2>Part {{ part.roman }} · <span class="en">{{ part.title }}</span><span class="zh">{{ chs[0].part_zh }}</span></h2>
<ul class="chlist">{% for c in chs %}<li class="{{ '' if c.ready else 'soon' }}"><a href="ch{{ '%02d' % c.number }}.html"><b>{{ c.number }}</b>
<span class="en">{{ c.title }}</span><span class="zh">{{ c.zh }}</span><small>📖 PDF p.{{ c.range.pdf }} · book p.{{ c.range.book }}</small></a></li>{% endfor %}</ul></section>{% endfor %}
{% endblock %}"""

def ref(refs):  # rendered inline via macro-ish string
    return ""

CHAPTER = """{% extends base %}{% macro tag(refs) %}{% if refs %}<span class="src" title="Source in the PDF">📖 {% for r in refs %}<span>PDF p.{{ r.pdf }}<i> (book p.{{ r.book }})</i></span>{{ ', ' if not loop.last }}{% endfor %}</span>{% endif %}{% endmacro %}
{% macro bi(o) %}<span class="en">{{ o.en }}</span><span class="zh">{{ o.zh }}</span>{% endmacro %}
{% macro nav(prev, next) %}<nav class="pn">{% if prev %}<a href="ch{{ '%02d' % prev.number }}.html">← <span class="en">Ch {{ prev.number }}: {{ prev.title }}</span><span class="zh">第 {{ prev.number }} 章：{{ prev.zh }}</span></a>{% else %}<span></span>{% endif %}
<a href="index.html" class="home"><span class="en">All chapters</span><span class="zh">全部章節</span></a>
{% if next %}<a href="ch{{ '%02d' % next.number }}.html"><span class="en">Ch {{ next.number }}: {{ next.title }}</span><span class="zh">第 {{ next.number }} 章：{{ next.zh }}</span> →</a>{% else %}<span></span>{% endif %}</nav>{% endmacro %}
{% block body %}
{{ nav(prev, next) }}
<p class="kicker">Part {{ chapter.part.roman }} · <span class="en">{{ chapter.part.title }}</span><span class="zh">{{ chapter.part_zh }}</span></p>
<h1><span class="en">Chapter {{ chapter.number }}: {{ chapter.title }}</span><span class="zh">第 {{ chapter.number }} 章：{{ chapter.zh }}</span></h1>
<p class="src big">📖 <span class="en">Source: PDF p.{{ chapter.range.pdf }} · printed book p.{{ chapter.range.book }}</span><span class="zh">來源：PDF 第 {{ chapter.range.pdf }} 頁 · 書本印刷頁 {{ chapter.range.book }}</span></p>
{% if not d %}<div class="card soon"><span class="en">Content for this chapter is still being prepared.</span><span class="zh">本章內容整理中。</span></div>
{% else %}
<p class="lead">{{ bi(d.overview) }}</p>
<nav class="toc"><a href="#summary"><span class="en">Summary</span><span class="zh">重點摘要</span></a><a href="#critical"><span class="en">Test-critical points</span><span class="zh">考試關鍵點</span></a>
{% if d.mnemonics %}<a href="#mnemonics"><span class="en">Mnemonics</span><span class="zh">記憶口訣</span></a>{% endif %}{% if d.figures %}<a href="#figures"><span class="en">Figures &amp; tables</span><span class="zh">圖表索引</span></a>{% endif %}<a href="#practice"><span class="en">Practice</span><span class="zh">練習題</span></a>{% if d.resources %}<a href="#resources"><span class="en">Resources</span><span class="zh">延伸資源</span></a>{% endif %}</nav>
<h2 id="summary"><span class="en">Chapter summary</span><span class="zh">章節重點摘要</span></h2>
{% for s in d.sections %}<section class="card"><h3>{{ bi(s.heading) }} {{ tag(s.refs) }}</h3><ul>{% for p in s.points %}<li>{{ bi(p) }}</li>{% endfor %}</ul></section>{% endfor %}
<h2 id="critical">⭐ <span class="en">Test-critical points</span><span class="zh">考試關鍵點</span></h2>
<ol class="crit">{% for c in d.critical_points %}<li>{{ bi(c) }} {{ tag(c.refs) }}</li>{% endfor %}</ol>
{% if d.mnemonics %}<h2 id="mnemonics">🧠 <span class="en">Mnemonics</span><span class="zh">記憶口訣</span></h2><ul class="mn">{% for m in d.mnemonics %}<li>{{ bi(m) }} {{ tag(m.refs) }}</li>{% endfor %}</ul>{% endif %}
{% if d.figures %}<h2 id="figures">🖼️ <span class="en">Figures &amp; tables worth opening in the book</span><span class="zh">值得對照原書的圖表</span></h2>
<div class="figs">{% for g in d.figures %}<figure class="card">{% if g.image_url %}<img loading="lazy" src="{{ g.image_url }}" alt="{{ g.caption.en }}"><small class="credit">{{ g.credit }}</small>{% endif %}<figcaption>{{ tag(g.refs) }} {{ bi(g.caption) }}</figcaption></figure>{% endfor %}</div>{% endif %}
<h2 id="practice">📝 <span class="en">Practice questions</span><span class="zh">練習題</span></h2>
{% for q in d.questions %}<article class="q" data-answer="{{ q.answer|join(',') }}"><p class="stem"><b>{{ loop.index }}.</b> {{ bi(q.stem) }}{% if q.answer|length > 1 %} <em class="sata"><span class="en">(Select all that apply)</span><span class="zh">（複選）</span></em>{% endif %}</p>
<ul class="opts">{% for o in q.options %}<li><button type="button" data-i="{{ loop.index0 }}">{{ 'ABCDEFGH'[loop.index0] }}. {{ bi(o) }}</button></li>{% endfor %}</ul>
<button class="check" type="button"><span class="en">Check answer</span><span class="zh">對答案</span></button>
<div class="why" hidden><p>{{ bi(q.rationale) }}</p>{{ tag(q.refs) }}</div>
<p class="qsrc"><small><span class="en">Source:</span><span class="zh">來源：</span> {% if q.source.url %}<a href="{{ q.source.url }}" rel="noopener" target="_blank">{{ q.source.title }}</a>{% else %}{{ q.source.title }}{% endif %}</small></p></article>{% endfor %}
{% if d.resources %}<h2 id="resources">🔗 <span class="en">Further resources</span><span class="zh">延伸資源</span></h2><ul class="res">{% for r in d.resources %}<li><a href="{{ r.url }}" rel="noopener" target="_blank">{{ r.title }}</a> — {{ bi(r.note) }}</li>{% endfor %}</ul>{% endif %}
{% endif %}
{{ nav(prev, next) }}
{% endblock %}"""

def render(tpl, **kw):
    t = env.from_string(tpl)
    return t.render(base=env.from_string(BASE), chapters=chapters, **kw)

def resolve_refs(d):
    for key in ("sections", "critical_points", "mnemonics", "questions"):
        for x in d.get(key, []):
            x["refs"] = pagerefs(x.get("pdf_pages"))
    for g in d.get("figures", []):
        g["refs"] = pagerefs([g["pdf_page"]])

parts = []
for c in chapters:
    if not parts or parts[-1][0]["roman"] != c["part"]["roman"]: parts.append((c["part"], []))
    parts[-1][1].append(c)

(docs / "index.html").write_text(render(INDEX, title="Home", chapter=None, parts=parts), encoding="utf-8")
for i, c in enumerate(chapters):
    d = content.get(c["number"])
    if d: resolve_refs(d)
    page = render(CHAPTER, title=f"Ch {c['number']} {c['title']}", chapter=c, d=d,
                  prev=chapters[i - 1] if i else None, next=chapters[i + 1] if i + 1 < len(chapters) else None)
    (docs / f"ch{c['number']:02d}.html").write_text(page, encoding="utf-8")
(docs / ".nojekyll").write_text("")
print(f"built {len(chapters)} pages ({len(content)} with content)")
