"""Maps BARS scoring evidence onto the ESCO skill labels the Merific
project already committed to (BARS document header: "ESCO reference: use
spreadsheet software; analyse financial data; develop financial models;
manage data, information and digital content; communicate findings to
stakeholders").

Deliberately keyword/rule-based, and deliberately NOT resolved against
ESCO concept URIs: this environment's network egress blocks both
`ec.europa.eu` and `esco.ec.europa.eu`, so the ESCO REST API and portal
were unreachable while writing this — fabricating UUIDs to look like real
ESCO identifiers would be worse than leaving them out. `label` below is
the exact English preferred-label string as it already appears in the
BARS document; resolving each to a real `http://data.europa.eu/esco/skill/...`
URI via the ESCO API is a clearly-scoped follow-up, not done here.

This is also a different (and much shallower) thing than the "NLP pipeline
i ESCO Mapper" component in the project's methodology, which maps semantic
embeddings of open text onto the full ESCO skill graph. What's here just
routes each of five *already-named* labels to evidence already computed by
`bars_scoring.py`.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from .bars_scoring import BARSResult
from .indicators import ModelIndicators
from .text_indicators import TextIndicators

# (label, Croatian gloss) — labels are verbatim from the BARS document.
ESCO_LABELS = {
    "use_spreadsheet_software": ("use spreadsheet software", "korištenje softvera za proračunske tablice"),
    "analyse_financial_data": ("analyse financial data", "analiza financijskih podataka"),
    "develop_financial_models": ("develop financial models", "razvoj financijskih modela"),
    "manage_data_content": (
        "manage data, information and digital content",
        "upravljanje podacima, informacijama i digitalnim sadržajem",
    ),
    "communicate_findings": ("communicate findings to stakeholders", "komunikacija nalaza dionicima"),
}

RELEVANCE_NONE = "nema dokaza"
RELEVANCE_PARTIAL = "djelomična"
RELEVANCE_STRONG = "jaka"


@dataclass
class EscoMatch:
    key: str
    label_en: str
    label_hr: str
    relevance: str
    evidence: list[str] = field(default_factory=list)


def _match(key: str, relevance: str, evidence: list[str]) -> EscoMatch:
    label_en, label_hr = ESCO_LABELS[key]
    return EscoMatch(key=key, label_en=label_en, label_hr=label_hr, relevance=relevance, evidence=evidence)


def _from_skill1(indicators: ModelIndicators, result: BARSResult) -> list[EscoMatch]:
    s, level = indicators.structural, result.level
    matches = []

    matches.append(
        _match(
            "use_spreadsheet_software",
            RELEVANCE_STRONG if level >= 2 else RELEVANCE_PARTIAL,
            [f"BARS razina {level} za '{result.skill}'"],
        )
    )

    matches.append(
        _match(
            "develop_financial_models",
            RELEVANCE_STRONG if level >= 3 else (RELEVANCE_PARTIAL if level == 2 else RELEVANCE_NONE),
            [f"BARS razina {level}: {result.level_name}"],
        )
    )

    mgmt_evidence = []
    if s.n_named_ranges > 0 or s.n_structured_tables > 0:
        mgmt_evidence.append(f"imenovani rasponi/tablice korišteni ({s.n_named_ranges} raspona, {s.n_structured_tables} tablica)")
    if s.has_readme_sheet:
        mgmt_evidence.append("dokumentacijski list (README) prisutan")
    if s.has_input_sheet and s.has_calc_sheet and s.has_output_sheet:
        mgmt_evidence.append("podaci organizirani u odvojene input/calc/output module")
    matches.append(
        _match(
            "manage_data_content",
            RELEVANCE_STRONG if len(mgmt_evidence) >= 2 else (RELEVANCE_PARTIAL if mgmt_evidence else RELEVANCE_NONE),
            mgmt_evidence,
        )
    )

    analyse_evidence = []
    f = indicators.formula
    if f.uses_advanced or (f.uses_lookup and f.uses_conditional):
        analyse_evidence.append("napredna analitička logika u formulama (lookup/uvjetne/SUMIFS...)")
    if s.hardcoded_ratio < 0.3:
        analyse_evidence.append(f"nizak udio ručno unesenih brojeva ({s.hardcoded_ratio:.0%})")
    matches.append(
        _match(
            "analyse_financial_data",
            RELEVANCE_STRONG if level >= 3 else (RELEVANCE_PARTIAL if analyse_evidence else RELEVANCE_NONE),
            analyse_evidence or [f"BARS razina {level} za '{result.skill}'"],
        )
    )

    return matches


def _from_skill2(indicators: TextIndicators, result: BARSResult) -> list[EscoMatch]:
    level = result.level
    matches = []

    matches.append(
        _match(
            "communicate_findings",
            RELEVANCE_STRONG if level >= 3 else (RELEVANCE_PARTIAL if level == 2 else RELEVANCE_NONE),
            [f"BARS razina {level}: {result.level_name}"],
        )
    )

    analyse_evidence = []
    if indicators.n_distinct_finance_terms >= 4:
        analyse_evidence.append(f"gusta domenska terminologija ({indicators.n_distinct_finance_terms} pojmova)")
    if indicators.has_causal_language and indicators.has_contrast_pattern:
        analyse_evidence.append("razlikuje simptom od uzroka uz kvantificiranu implikaciju")
    matches.append(
        _match(
            "analyse_financial_data",
            RELEVANCE_STRONG if level >= 3 else (RELEVANCE_PARTIAL if analyse_evidence else RELEVANCE_NONE),
            analyse_evidence or [f"BARS razina {level} za '{result.skill}'"],
        )
    )

    return matches


def _merge(matches: list[EscoMatch]) -> list[EscoMatch]:
    """Same ESCO label can get evidence from both skills (e.g. 'analyse
    financial data'); keep the strongest relevance and union the evidence."""
    order = {RELEVANCE_NONE: 0, RELEVANCE_PARTIAL: 1, RELEVANCE_STRONG: 2}
    by_key: dict[str, EscoMatch] = {}
    for m in matches:
        if m.key not in by_key:
            by_key[m.key] = m
            continue
        existing = by_key[m.key]
        if order[m.relevance] > order[existing.relevance]:
            existing.relevance = m.relevance
        existing.evidence = existing.evidence + [e for e in m.evidence if e not in existing.evidence]
    return [by_key[k] for k in ESCO_LABELS if k in by_key]


def map_to_esco(
    skill1: tuple[ModelIndicators, BARSResult] | None = None,
    skill2: tuple[TextIndicators, BARSResult] | None = None,
) -> list[EscoMatch]:
    """Combine whichever of the two BARS results are available into a
    single list covering all five ESCO labels (labels with no evidence at
    all are still returned, with relevance 'nema dokaza')."""
    matches: list[EscoMatch] = []
    if skill1 is not None:
        matches += _from_skill1(*skill1)
    if skill2 is not None:
        matches += _from_skill2(*skill2)

    present_keys = {m.key for m in matches}
    for key in ESCO_LABELS:
        if key not in present_keys:
            matches.append(_match(key, RELEVANCE_NONE, []))

    return _merge(matches)
