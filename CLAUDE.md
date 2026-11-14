# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project purpose

Study site for a friend preparing for the NCLEX-RN exam. The source material is one book, *Saunders Comprehensive Review for the NCLEX-RN® Examination*, kept as `RN saunders pdf.pdf` in the repo root (85 MB, 1238 PDF pages, 70 chapters in 19 parts). The planned deliverable is a GitHub Pages site, with one HTML page per chapter, published from https://github.com/coherent17/RN-Challenge.git.

Status: the workspace currently holds only the PDF. It is not yet a git repo (no `git init` or remote configured), and there is no build tooling, source code, tests or generated pages.

## Requirements for the site (from the project owner)

- **One page per chapter.** Each page has a summary and a "test critical points" summary.
- **Chapter navigation on every page.** Chapter N must link to its neighbours, N-1 and N+1, at minimum.
- **Bilingual.** Every page exists in English and Traditional Chinese (繁體中文), with a language switch.
- **PDF source references.** Each section of a page must show which part of the PDF it came from. Use the PDF page numbers and the book's own printed page numbers (see below).
- **Related practice questions.** Add questions related to each chapter, found online. The owner suggested UWorld (uworld.com), but its question bank is paid and copyrighted. Do not scrape or reproduce it. Link to publicly available material or write original practice questions, and say clearly where each question came from.

Confirm with the owner before pushing to the remote or enabling GitHub Pages. Those actions are outward-facing.

## Working with the PDF

- Text is extractable, so no OCR is needed. `pdftotext` and `pdfinfo` are not installed, and neither are `node` or `pymupdf`. The PyMuPDF `fitz` module is importable under `python3`. Run it without `-I`, because isolated mode can't see it. Pass the PDF path as an argument, and don't run Python from inside an untrusted directory.
- The PDF has a usable outline: `fitz.open(path).get_toc()` returns 147 entries as `[level, title, pdf_page]`. Level 1 is a Part and level 2 is a Chapter. Use it to derive each chapter's page range (a chapter runs from its start page to the next chapter's start page minus 1). The chapter-to-page map:
  - Ch 1–4: Part I, NCLEX exam prep (PDF p.20–55)
  - Ch 5–7: professional standards (p.58–105)
  - Ch 8–17: foundations of care (p.109–265)
  - Ch 18–20: growth and development (p.268–310)
  - Ch 21–29: maternity (p.313–436)
  - Ch 30–42: pediatrics (p.438–585)
  - Ch 43–64: adult systems and their medication chapters (p.587–1038)
  - Ch 65–69: mental health (p.1040–1121)
  - Ch 70: complex care (p.1124–1196)
  - References from p.1197, Index from p.1199
- PDF page numbers are not the printed page numbers. For example, the printed page 23 ("Chapter 3") sits on PDF page 41, so check the offset before citing pages. A citation should give the PDF page, which the viewer can open directly, and optionally the printed page.
- The book uses a "Pyramid to Success" layout with Pyramid Points, Pyramid Alerts, Priority Concepts and Clinical Judgment boxes. These are the highest-yield items, so surface them in the "test critical points" sections.
- Extract the text per chapter into the scratchpad or an ignored `build/` directory. The raw text is copyrighted source material, so do not commit it or publish it verbatim. The published pages should hold original summaries, with page citations.

## Architecture (planned, not yet built)

Keep the pipeline simple and static, because GitHub Pages serves only static files:

1. **Extract.** A script splits the PDF into per-chapter text, using the outline.
2. **Author.** Each chapter gets structured content, for example one JSON or Markdown file per chapter with `en` and `zh-Hant` fields. Each summary item carries its PDF page reference.
3. **Render.** A generator script turns that content into static HTML, one page per chapter plus an index page, with shared prev/next navigation and a language toggle. Keep one template, so that chapter pages never diverge.
4. **Deploy.** Publish to GitHub Pages from the remote repo.

Add the actual build and run commands to this file once the generator exists.
