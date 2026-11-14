# Chapter content schema (content/chNN.json, NN zero-padded)

Every human-readable string is a bilingual object `{"en": "...", "zh": "..."}`; `zh` is Traditional Chinese (繁體中文, Taiwan nursing terms; keep standard English abbreviations/lab names such as K+, ABG, SBAR in parentheses).
`pdf_pages` are PDF page numbers (the `=== PDF PAGE n ===` markers in build/text/chNN.txt), NOT printed numbers.

```json
{
  "number": 8,
  "title": {"en": "Fluids and Electrolytes", "zh": "體液與電解質"},
  "overview": {"en": "2-4 sentence orientation", "zh": "..."},
  "sections": [
    {"heading": {"en": "...", "zh": "..."},
     "points": [{"en": "concise original-wording study point", "zh": "..."}],
     "pdf_pages": [92, 93]}
  ],
  "critical_points": [
    {"en": "High-yield / test-critical item (book Pyramid Points & Alerts, priority actions, lab values, red flags)", "zh": "...", "pdf_pages": [95]}
  ],
  "mnemonics": [{"en": "...", "zh": "...", "pdf_pages": [97]}],
  "figures": [
    {"pdf_page": 100, "caption": {"en": "what the figure/table on this PDF page shows and why it matters", "zh": "..."}}
  ],
  "questions": [
    {"stem": {"en": "...", "zh": "..."},
     "options": [{"en": "...", "zh": "..."}],
     "answer": [1],
     "rationale": {"en": "...", "zh": "..."},
     "pdf_pages": [95],
     "source": {"type": "original", "title": "Original practice question based on the chapter"}}
  ],
  "resources": [
    {"title": "Page title", "url": "https://...", "note": {"en": "what it offers (e.g. public NCLEX-style practice questions, diagram)", "zh": "..."}}
  ]
}
```

Rules
- Summaries are ORIGINAL paraphrase/condensation, never verbatim copies of book text. Short facts, values, and lists are fine.
- `sections`: 5-12 per chapter, follow the chapter's own outline order; cover the whole chapter. 3-10 points each.
- `critical_points`: 8-20 per chapter, the things most likely tested.
- `questions`: 5-10 per chapter, NCLEX style (mix single-answer and select-all-that-apply, with `answer` as a list of 0-based option indexes). Write them yourself or adapt a concept from a public source; `source.type` is "original" or "web" (then give `title` + `url`). NEVER copy UWorld (paid/copyrighted) or any other proprietary question verbatim.
- `resources`: 2-6 working public URLs found via web search (free practice questions, diagrams, videos, guidelines). Only include URLs you actually saw in search results; no guessed URLs.
- `figures`: pages of the PDF holding important tables/figures/algorithms (up to 8). Reference them by page; optional `image_url` + `credit` ONLY for an openly licensed web image (e.g. Wikimedia Commons) with attribution.
- Validate with: `python3 scripts/validate.py content/chNN.json`
