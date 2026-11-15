# Exam-bank question schema (content/examq/chNN.json, NN zero-padded)

A JSON array of additional ORIGINAL NCLEX-style items for the Quick Quiz / Mock Exam pools only
(these do NOT appear on the chapter study pages — only content/chNN.json's own `questions` do that).
Every human-readable string is bilingual `{"en": "...", "zh": "..."}` (zh = Traditional Chinese).

```json
[
  {
    "cat": "PA",
    "stem": {"en": "...", "zh": "..."},
    "options": [{"en": "...", "zh": "..."}, ...],
    "answer": [2],
    "rationale": {"en": "...", "zh": "..."},
    "pdf_pages": [864, 865],
    "tags": ["priority", "labs"]
  }
]
```

- `cat`: one of the 8 NCLEX-RN Client Needs categories, picked per item (not per chapter):
  - `MC` Management of Care (delegation, prioritization of assignments, legal/ethical, case mgmt, referrals)
  - `SI` Safety and Infection Control (precautions, error prevention, security, emergency response)
  - `HP` Health Promotion and Maintenance (growth & development, prenatal, aging, self-care, screening)
  - `PI` Psychosocial Integrity (coping, mental health, therapeutic communication, grief, abuse, substance use)
  - `BC` Basic Care and Comfort (mobility, nutrition, elimination, rest, nonpharmacologic comfort)
  - `PH` Pharmacological and Parenteral Therapies (meds, IV therapy, blood products, chemo, TPN)
  - `RR` Reduction of Risk Potential (diagnostic/lab tests, potential complications of treatments/procedures)
  - `PA` Physiological Adaptation (pathophysiology, illness management, emergencies, unexpected responses)
- `options`: 4-6 choices. Distractors must be clinically plausible, not obviously wrong — the point is to
  sharpen judgment under pressure, the way the real exam does.
- `answer`: 0-based indices. A single value = standard multiple choice. 2+ values = select-all-that-apply.
- `pdf_pages`: must fall within this chapter's PDF page range (see data/chapters.json).
- `tags` (optional): free-text labels, e.g. "priority", "first action", "delegation", "dosage calc", "sata",
  "red flag", "requires immediate action", "therapeutic communication".

Rules
- Every item is ORIGINAL. Never copy or closely paraphrase UWorld, Archer, or any other bank's wording.
- Ground every item in the chapter's own content (build/text/chNN.txt) — accurate labs, doses, and findings.
- Favor the item types that build real clinical judgment, modeled on the NCSBN Clinical Judgment Measurement
  Model: recognizing cues (which finding is most concerning), analyzing/prioritizing (which client is seen
  first / is at greatest risk), generating solutions and taking action (best next nursing action), and
  evaluating outcomes (which finding shows the intervention worked). Mix in delegation-to-UAP/LPN items
  where the chapter supports it, and dosage/calculation items where relevant.
- Validate with: `python3 scripts/validate_examq.py content/examq/chNN.json`
