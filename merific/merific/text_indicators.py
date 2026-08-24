"""Content-indicator extraction from narrative text (memos, reports, deck
speaker notes) for Vještina 2 — "Analitička interpretacija i komunikacija
financijskih nalaza".

Keyword/regex heuristics only — this is explicitly NOT the NLP pipeline
(BERT encoders, semantic embeddings) the Merific methodology describes for
this layer (§4.2/§5.1's "NLP i ML za automatiziranu procjenu"). It is the
same kind of transparent, rule-based proxy `indicators.py` builds for
spreadsheets, applied to text: every signal is a named keyword/pattern
match, so a reviewer can see exactly what triggered a score.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

BENCHMARK_KEYWORDS = [
    "plan", "budžet", "prosjek", "prethodn", "prošl", "cilj", "target",
    "benchmark", "u odnosu na", "industrij",
]
CAUSAL_KEYWORDS = [
    "zbog", "uzrok", "razlog", "posljedic", "rezultat toga", "utjecaj",
    "proizlazi", "uslijed", "dovodi do", "vodi do",
]
CONTRAST_PATTERNS = [
    re.compile(r"nije\s+\w+(\s+\w+){0,4}\s+nego", re.IGNORECASE),
    re.compile(r"ne\s+zbog.{0,80}nego", re.IGNORECASE),
    re.compile(r"a\s+ne\s+zbog", re.IGNORECASE),
    re.compile(r"simptom.{0,120}uzrok", re.IGNORECASE),
    re.compile(r"za razliku od", re.IGNORECASE),
]
RECOMMENDATION_KEYWORDS = [
    "preporuč", "predlaž", "potrebno je", "sljedeći korak", "akcijski plan",
]
SCENARIO_KEYWORDS = [
    "scenarij", "best case", "worst case", "base case", "neizvjesnost",
    "raspon ishoda", "rizik",
]
STRUCTURE_KEYWORDS = ["zaključak", "sažetak", "preporuka", "nalaz", "ključna poruka"]
SENSITIVITY_KEYWORDS = [
    "osjetljivost", "osjetljivosna", "diskontna stopa", "terminalni rast",
    "mijenja predznak", "prag osjetljivosti", "tipping point", "threshold",
]
AUDIENCE_KEYWORDS = [
    "uprav", "cfo", "investitor", "operativni tim", "operativnom timu", "nefinancijsk",
]
DATA_QUALITY_KEYWORDS = [
    "ograničenj", "nedovoljno pouzdan", "nedovoljne pouzdanosti",
    "nije moguće sa sigurnošću", "nisku pouzdanost", "nedostatn",
]
STRATEGIC_CONTEXT_KEYWORDS = ["strateš", "operativn", "konkurent", "tržišt"]
FINANCE_VOCAB = [
    "ebitda", "cash-flow", "cash flow", "novčani tok", "marža", "marže",
    "prihod", "trošak", "dobit", "roe", "povrat na kapital", "tržišni udio",
    "npv", "dcf", "wacc",
]

NUMERIC_TOKEN_RE = re.compile(r"\d+(?:[.,]\d+)?\s?%?")
BAD_CHART_RE = re.compile(r"tortni grafikon", re.IGNORECASE)
TREND_WORDS_RE = re.compile(r"trend|kroz vrijeme|tijekom", re.IGNORECASE)


def _count_distinct_hits(text: str, keywords: list[str]) -> int:
    lt = text.lower()
    return sum(1 for kw in keywords if kw.lower() in lt)


def _any_hit(text: str, keywords: list[str]) -> bool:
    return _count_distinct_hits(text, keywords) > 0


@dataclass
class TextIndicators:
    source_name: str
    n_words: int
    n_paragraphs: int
    has_benchmark_language: bool
    has_causal_language: bool
    has_contrast_pattern: bool
    n_numeric_tokens: int
    has_recommendation_language: bool
    has_scenario_language: bool
    has_structure_markers: bool
    conclusion_paragraph_has_number: bool
    has_sensitivity_language: bool
    n_distinct_audience_keywords: int
    has_data_quality_language: bool
    has_strategic_context_language: bool
    n_distinct_finance_terms: int
    has_poor_chart_choice_flag: bool


def extract_text_indicators(text: str, source_name: str = "<text>") -> TextIndicators:
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n|\r\n\s*\r\n", text) if p.strip()]
    if not paragraphs:
        paragraphs = [p.strip() for p in text.splitlines() if p.strip()]

    conclusion_paragraph_has_number = any(
        _any_hit(p, STRUCTURE_KEYWORDS + RECOMMENDATION_KEYWORDS) and NUMERIC_TOKEN_RE.search(p)
        for p in paragraphs
    )

    bad_chart = bool(BAD_CHART_RE.search(text)) and bool(TREND_WORDS_RE.search(text))

    return TextIndicators(
        source_name=source_name,
        n_words=len(text.split()),
        n_paragraphs=len(paragraphs),
        has_benchmark_language=_any_hit(text, BENCHMARK_KEYWORDS),
        has_causal_language=_any_hit(text, CAUSAL_KEYWORDS),
        has_contrast_pattern=any(p.search(text) for p in CONTRAST_PATTERNS),
        n_numeric_tokens=len(NUMERIC_TOKEN_RE.findall(text)),
        has_recommendation_language=_any_hit(text, RECOMMENDATION_KEYWORDS),
        has_scenario_language=_any_hit(text, SCENARIO_KEYWORDS),
        has_structure_markers=_any_hit(text, STRUCTURE_KEYWORDS),
        conclusion_paragraph_has_number=conclusion_paragraph_has_number,
        has_sensitivity_language=_any_hit(text, SENSITIVITY_KEYWORDS),
        n_distinct_audience_keywords=_count_distinct_hits(text, AUDIENCE_KEYWORDS),
        has_data_quality_language=_any_hit(text, DATA_QUALITY_KEYWORDS),
        has_strategic_context_language=_any_hit(text, STRATEGIC_CONTEXT_KEYWORDS),
        n_distinct_finance_terms=_count_distinct_hits(text, FINANCE_VOCAB),
        has_poor_chart_choice_flag=bad_chart,
    )
