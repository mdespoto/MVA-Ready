# Merific — BARS analyzer prototype

Proof-of-concept implementation of one piece of the Merific project: an
automated **content-indicator extractor + rule-based BARS scorer** for the
domain skill *"Napredna analiza poslovno-financijskih podataka u
proračunskim tablicama"* (Vještina 1: Modeliranje financijskih tablica),
as defined in `BARS_ljestvica_Napredna_analiza...docx`.

Given an `.xlsx`/`.xlsm` file, it extracts structural and formula-complexity
indicators and estimates a BARS level (1–4), with the specific evidence and
gaps behind that level printed alongside it.

## What this is *not*

The full Merific concept (per `Merific_Auizajn.docx` and the project-plan
documents) is a 12-month research project with three system components —
a metadata/revision-history extractor, an NLP+ESCO mapper, and an
AI-authorship-integrity module — feeding a **trained ML classifier**
validated against an expert-labelled corpus (H1/H2 in the methodology,
target Cohen's κ ≥ 0.70). None of that exists here:

- **No process indicators.** Revision-history/edit-distance/temporal
  analysis (§4.3 of the methodology) needs a Google Drive Revision History
  or Git-log style source; this prototype only sees a single static file.
- **No NLP/ESCO mapping.** Narrative-quality and terminology-density
  indicators (§4.2) and the ESCO skill mapper are out of scope here.
- **No AI-authorship integrity check** (§5.2).
- **No trained model.** `bars_scoring.py` is a hand-written, inspectable
  rule engine — a necessary *content-only baseline* (the methodology's
  "Model A") to compare a future trained model against — not the ML
  classifier itself, which requires an expert-labelled corpus that doesn't
  exist yet.

Every rule is written to be traceable back to a specific sentence in the
BARS document (see the docstring on each `_check_level_*` function in
`bars_scoring.py`), so a domain expert can sanity-check *why* a document
got the level it got — the same "reconstructable reasoning" property the
methodology requires of any automated scorer.

## Layout

```
merific/
  indicators.py     # extracts StructuralIndicators + FormulaIndicators from a workbook
  bars_scoring.py    # rule-based BARS level 1-4 inference for Vještina 1
  report.py           # text / JSON rendering
  cli.py                # `python -m merific.cli analyze <file.xlsx>`
demo/
  index.html           # standalone browser demo — see below
tests/
  fixtures/make_fixtures.py  # generates synthetic level1..level4 example workbooks
  test_indicators.py
  test_bars_scoring.py
```

## Browser demo

`demo/index.html` is a self-contained, dependency-free re-implementation of
`indicators.py` + `bars_scoring.py` in JavaScript (own ZIP/OOXML reader —
`DecompressionStream`, `DOMParser`, no libraries), so it runs entirely
client-side: open the file in a browser, drop in an `.xlsx`, or click one
of the four embedded samples, and see the BARS level with its evidence.
Nothing is uploaded anywhere. It is a UI for the same rules as the Python
package, kept in sync by hand — not generated from it — so treat the two
as needing to be updated together.

## Indicators extracted

**Structural:** sheet count and role (input/calc/output/readme, guessed
from sheet names), named ranges and structured tables, cross-sheet formula
references, ratio of hardcoded numeric constants to formulas, a colour-
convention score (does the model consistently colour-code inputs vs.
formulas), and whether a dropdown-driven "scenario selector" cell feeds
into other formulas.

**Formula:** function usage by category (conditional, lookup, advanced,
LAMBDA/dynamic-array), max nesting depth, use of absolute references,
Power Query presence, VBA/macro presence, and a pattern-consistency score
(are formulas copied/filled across a range, or one-off).

## Usage

```bash
pip install -r requirements.txt
python -m merific.cli analyze path/to/model.xlsx        # human-readable
python -m merific.cli analyze path/to/model.xlsx --json  # machine-readable
```

## Tests

```bash
pip install -r requirements.txt
python -m pytest tests/ -q
```

Tests regenerate synthetic fixture workbooks (`tests/fixtures/*.xlsx`, not
committed) modeled on the "Tipični bihevioralni primjeri" for each BARS
level, and assert the scorer recovers the intended level for each.

## Natural next steps

1. Extend `indicators.py` with a `ProcessIndicators` extractor against
   Google Drive's Revision History API (or, for a local-file proxy, a Git
   history of the workbook) — §4.3 of the methodology.
2. Collect the expert-labelled corpus (N≈120–160) called for in H2/H1 and
   train Model B (content+process) against this rule-based Model A
   baseline, per the paired bootstrap test described in §5.3.
3. Extend `bars_scoring.py` to Vještina 2 (analitička interpretacija) once
   there's a way to extract narrative documents (memos/decks), not just
   spreadsheets.
