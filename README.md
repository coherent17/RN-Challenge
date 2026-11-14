# NCLEX-RN Study Guide (EN / 繁體中文)

Chapter-by-chapter summaries, test-critical points, mnemonics, figure pointers and practice questions for *Saunders Comprehensive Review for the NCLEX-RN® Examination*, bilingual, with PDF page references.

Site: https://coherent17.github.io/RN-Challenge/ (after GitHub Pages is enabled with source "GitHub Actions").

## Develop
```
pip install jinja2 pymupdf        # pymupdf only needed for extraction
python3 scripts/extract.py        # needs the book PDF in the repo root (gitignored)
python3 scripts/validate.py content/ch*.json
python3 scripts/build.py          # writes docs/
python3 -m http.server -d docs 8000
```
Content lives in `content/chNN.json` (see `content/SCHEMA.md`). `docs/` is generated.
