# Merific — BARS analyzer prototype

Proof-of-concept implementation of a piece of the Merific project: an
automated **content-indicator extractor + rule-based BARS scorer**, covering
both domain skills the BARS document operationalizes concretely:

- **Vještina 1 — Modeliranje financijskih tablica.** Given an `.xlsx`/`.xlsm`
  file, extracts structural and formula-complexity indicators and estimates
  a BARS level (1–4).
- **Vještina 2 — Analitička interpretacija i komunikacija financijskih
  nalaza.** Given narrative text (a memo, report, or deck's speaker notes —
  `.docx` or `.txt`), extracts keyword/pattern indicators over the prose and
  estimates a BARS level (1–4).

Both print the specific evidence and gaps behind the level, and both can be
mapped onto the five ESCO skill labels the project already names (see
"ESCO mapping" below).

## What this is *not*

The full Merific concept (per `Merific_Auizajn.docx` and the project-plan
documents) is a 12-month research project with three system components —
a metadata/revision-history extractor, a semantic NLP+ESCO mapper (BERT
embeddings against the full ESCO graph), and an AI-authorship-integrity
module — feeding a **trained ML classifier** validated against an
expert-labelled corpus (H1/H2 in the methodology, target Cohen's κ ≥ 0.70).
None of that exists here:

- **No process indicators.** Revision-history/edit-distance/temporal
  analysis (§4.3 of the methodology) needs a Google Drive Revision History
  or Git-log style source; this prototype only sees a single static file.
- **No semantic NLP.** `text_indicators.py` is keyword/regex matching, not
  the BERT-based semantic pipeline the methodology describes — see its
  module docstring.
- **No AI-authorship integrity check** (§5.2).
- **No trained model.** `bars_scoring.py` is a hand-written, inspectable
  rule engine — a necessary *content-only baseline* (the methodology's
  "Model A") to compare a future trained model against — not the ML
  classifier itself, which requires an expert-labelled corpus that doesn't
  exist yet.
- **No real ESCO URIs.** `esco_mapping.py` routes evidence to the five ESCO
  skill *labels* the project already quotes verbatim in the BARS document.
  It does not resolve them to `data.europa.eu/esco/skill/...` concept URIs —
  both `ec.europa.eu` and `esco.ec.europa.eu` are blocked by this
  environment's network egress, so real IDs couldn't be verified, and
  fabricating UUID-shaped identifiers would be worse than omitting them.

Every rule is written to be traceable back to a specific sentence in the
BARS document (see the docstring on each `_check_level_*` / `_check_skill2_*`
function in `bars_scoring.py`), so a domain expert can sanity-check *why* a
document got the level it got — the same "reconstructable reasoning"
property the methodology requires of any automated scorer.

## Layout

```
merific/
  indicators.py       # Vještina 1: StructuralIndicators + FormulaIndicators from a workbook
  text_indicators.py   # Vještina 2: keyword/pattern indicators from narrative text
  docx_text.py          # minimal .docx -> plain text (no python-docx dependency)
  bars_scoring.py        # rule-based BARS level 1-4 inference, both skills
  esco_mapping.py         # maps BARS evidence onto the 5 named ESCO skill labels
  report.py                # text / JSON rendering for both skills + ESCO
  cli.py                     # `python -m merific.cli analyze <file.xlsx>`
                             # `python -m merific.cli analyze-text <memo.docx|.txt>`
demo/
  index.html           # standalone browser demo (Vještina 1 only so far) — see below
tests/
  fixtures/make_fixtures.py  # generates synthetic level1..level4 example workbooks
  fixtures/text/level*.txt    # committed narrative-text examples per BARS level
  test_indicators.py, test_bars_scoring.py           # Vještina 1
  test_text_indicators.py, test_bars_scoring_skill2.py  # Vještina 2
  test_docx_text.py, test_esco_mapping.py
```

## Browser demo

`demo/index.html` is a self-contained, dependency-free re-implementation of
`indicators.py` + `bars_scoring.py`'s Vještina 1 path in JavaScript (own
ZIP/OOXML reader — `DecompressionStream`, `DOMParser`, no libraries), so it
runs entirely client-side: open the file in a browser, drop in an `.xlsx`,
or click one of the four embedded samples, and see the BARS level with its
evidence. Nothing is uploaded anywhere. It does not yet cover Vještina 2 or
the ESCO mapping added in this round — porting those is a natural next step
(see below). It is a UI for the Python rules, kept in sync by hand, not
generated from it — treat the two as needing to be updated together.

## Indicators extracted

**Vještina 1 — structural:** sheet count and role (input/calc/output/readme,
guessed from sheet names), named ranges and structured tables, cross-sheet
formula references, ratio of hardcoded numeric constants to formulas, a
colour-convention score (does the model consistently colour-code inputs vs.
formulas), and whether a dropdown-driven "scenario selector" cell feeds into
other formulas.

**Vještina 1 — formula:** function usage by category (conditional, lookup,
advanced, LAMBDA/dynamic-array), max nesting depth, use of absolute
references, Power Query presence, VBA/macro presence, and a
pattern-consistency score (are formulas copied/filled across a range, or
one-off).

**Vještina 2 — text:** benchmark/comparison language, causal-explanation
language, a symptom-vs-cause contrast pattern, numeric-quantification count
(and whether a number appears in the same paragraph as a conclusion/
recommendation, or immediately next to a named financial metric), recommendation/action language,
scenario/uncertainty language, structural markers ("ključna poruka", "zaključak", "preporuka"),
sensitivity/threshold language, count of distinct audience keywords (uprava/
CFO/investitori/operativni tim), data-quality/limitation acknowledgment,
strategic/operational context integration, and financial-vocabulary density.
A pie-chart-for-a-trend mention is flagged as a note (the BARS document's
own Level-1 example) but does not affect scoring on its own.

Each of those is a keyword list *and* a handful of higher-confidence regex
phrase patterns (`*_PHRASE_RE` / `*_PATTERNS` in `text_indicators.py`) — e.g.
"glavni uzrok" or "preporučujemo da..." carry more signal than a bare
"uzrok"/"preporuč" hit, so they widen the same boolean field rather than
adding new checks. `bars_scoring.py`'s `LevelCheck` scores Vještina 2 by
*weighted* ratio, not a plain count: a check's `weights` dict (default 1.0
for anything unlisted) lets a more diagnostic signal — e.g. "distinguishes
symptom from cause" at Level 3 — outvote a merely-present one. Skill 1 never
sets `weights`, so its scoring is unchanged (every item implicitly 1.0).
None of this is semantic — it's still string/regex matching, just a richer
layer of it. See the module docstrings for what's still explicitly out of
scope and why (real embeddings need a model or an API call this environment
can't reach offline — `ec.europa.eu`, `esco.ec.europa.eu`, and
`huggingface.co` are all blocked by this environment's network egress).

## ESCO mapping

`esco_mapping.py` takes whichever BARS result(s) you have and returns a
relevance ("jaka" / "djelomična" / "nema dokaza") plus the specific evidence
for each of the five ESCO labels named in the BARS document's header:
*use spreadsheet software*, *analyse financial data*, *develop financial
models*, *manage data, information and digital content*, *communicate
findings to stakeholders*. All five are always returned, even with no
evidence, so a caller always sees the full label set.

## Usage

```bash
pip install -r requirements.txt

# Vještina 1
python -m merific.cli analyze path/to/model.xlsx              # human-readable
python -m merific.cli analyze path/to/model.xlsx --json        # machine-readable
python -m merific.cli analyze path/to/model.xlsx --esco        # + ESCO mapping

# Vještina 2
python -m merific.cli analyze-text path/to/memo.docx --esco
python -m merific.cli analyze-text path/to/memo.txt --json
```

## Tests

```bash
pip install -r requirements.txt
python -m pytest tests/ -q
```

`tests/conftest.py` regenerates the synthetic `.xlsx` fixtures once per
session (modeled on the "Tipični bihevioralni primjeri" for each Vještina 1
BARS level); the Vještina 2 fixtures are small committed `.txt` files under
`tests/fixtures/text/`, built the same way — one is the BARS document's own
quoted Level-1 example verbatim, which is what caught a real design bug
(quantification + finance vocabulary alone cleared the Level 2 threshold;
see the comment on `_SKILL2_LEVEL2_RATIO` in `bars_scoring.py`) before this
was ever run on a real document.

## Natural next steps

1. Extend `indicators.py`/`text_indicators.py` with a `ProcessIndicators`
   extractor against Google Drive's Revision History API (or, for a
   local-file proxy, a Git history of the workbook/document) — §4.3 of the
   methodology.
2. Collect the expert-labelled corpus (N≈120–160) called for in H2/H1 and
   train Model B (content+process) against this rule-based Model A
   baseline, per the paired bootstrap test described in §5.3.
3. Port `text_indicators.py` + the Vještina 2 scorer + `esco_mapping.py` into
   `demo/index.html`, so the browser demo covers both skills and the ESCO
   mapping, not just Vještina 1.
4. Resolve the five ESCO labels to real concept URIs via the ESCO API from
   an environment that can reach `ec.europa.eu`.
