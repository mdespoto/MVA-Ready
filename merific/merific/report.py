"""Human-readable and JSON rendering of BARS scoring results (both skills)
and of the ESCO mapping."""

from __future__ import annotations

import dataclasses
import json

from .bars_scoring import BARSResult
from .esco_mapping import EscoMatch
from .indicators import ModelIndicators
from .text_indicators import TextIndicators


def _checks_to_dict(result: BARSResult) -> dict:
    return {
        str(lvl): {"satisfied": c.satisfied, "missing": c.missing, "score": round(c.score, 2)}
        for lvl, c in result.checks.items()
    }


def _bars_header_lines(result: BARSResult) -> list[str]:
    return [f"Vještina: {result.skill}", f"BARS razina: {result.level} — {result.level_name}"]


def _bars_checks_lines(result: BARSResult) -> list[str]:
    lines: list[str] = []
    for lvl in sorted(result.checks):
        c = result.checks[lvl]
        lines.append(f"Provjera za razinu {lvl} (score {c.score:.2f}):")
        for item in c.satisfied:
            lines.append(f"    [x] {item}")
        for item in c.missing:
            lines.append(f"    [ ] {item}")
    if result.gap_to_next_level:
        lines.append("")
        lines.append(f"Za razinu {result.level + 1} nedostaje:")
        for item in result.gap_to_next_level:
            lines.append(f"  - {item}")
    return lines


def ind_roles(structural) -> str:
    parts = []
    for name, roles in structural.sheet_roles.items():
        tag = ",".join(sorted(roles)) if roles else "?"
        parts.append(f"{name}[{tag}]")
    return "; ".join(parts)


# --- Vještina 1: spreadsheet models ----------------------------------------


def to_dict(indicators: ModelIndicators, result: BARSResult) -> dict:
    ind = dataclasses.asdict(indicators)
    ind["structural"]["sheet_roles"] = {
        name: sorted(roles) for name, roles in indicators.structural.sheet_roles.items()
    }
    ind["formula"]["function_counts"] = dict(indicators.formula.function_counts)

    return {
        "file": indicators.file_name,
        "indicators": ind,
        "bars": {
            "skill": result.skill,
            "level": result.level,
            "level_name": result.level_name,
            "checks": _checks_to_dict(result),
            "gap_to_next_level": result.gap_to_next_level,
        },
    }


def to_json(indicators: ModelIndicators, result: BARSResult) -> str:
    return json.dumps(to_dict(indicators, result), indent=2, ensure_ascii=False)


def to_text(indicators: ModelIndicators, result: BARSResult) -> str:
    s, f = indicators.structural, indicators.formula
    lines = [f"Datoteka: {indicators.file_name}", *_bars_header_lines(result), ""]
    lines.append("Ključni indikatori:")
    lines.append(f"  - broj listova: {s.n_sheets}  (uloge: {ind_roles(s)})")
    lines.append(f"  - imenovani rasponi: {s.n_named_ranges}, strukturirane tablice: {s.n_structured_tables}")
    lines.append(f"  - cross-sheet reference: {s.cross_sheet_ref_count}")
    lines.append(f"  - udio hardkodiranih vrijednosti: {s.hardcoded_ratio}")
    lines.append(f"  - konzistencija boja (input vs. formula): {s.color_convention_score}")
    lines.append(f"  - broj formula: {f.n_formulas}, dosljednost obrazaca: {f.pattern_consistency}")
    lines.append(f"  - max dubina ugnježđivanja: {f.max_nesting_depth}")
    lines.append(
        f"  - napredne funkcije: uvjetne={f.uses_conditional} lookup={f.uses_lookup} "
        f"advanced={f.uses_advanced} lambda/dynamic={f.uses_lambda_or_dynamic}"
    )
    lines.append(f"  - Power Query: {f.has_power_query}, VBA: {f.has_vba}")
    lines.append(f"  - scenarijski selektor: {s.has_scenario_selector} (fanout={s.scenario_selector_fanout})")
    lines.append("")
    lines += _bars_checks_lines(result)
    return "\n".join(lines)


# --- Vještina 2: narrative text ---------------------------------------------


def text_to_dict(indicators: TextIndicators, result: BARSResult) -> dict:
    return {
        "source": indicators.source_name,
        "indicators": dataclasses.asdict(indicators),
        "bars": {
            "skill": result.skill,
            "level": result.level,
            "level_name": result.level_name,
            "checks": _checks_to_dict(result),
            "gap_to_next_level": result.gap_to_next_level,
        },
    }


def text_to_json(indicators: TextIndicators, result: BARSResult) -> str:
    return json.dumps(text_to_dict(indicators, result), indent=2, ensure_ascii=False)


def text_to_text(indicators: TextIndicators, result: BARSResult) -> str:
    t = indicators
    lines = [f"Izvor: {t.source_name}", *_bars_header_lines(result), ""]
    lines.append("Ključni indikatori:")
    lines.append(f"  - broj riječi: {t.n_words}, broj odlomaka: {t.n_paragraphs}")
    lines.append(f"  - benchmark jezik: {t.has_benchmark_language}, uzročni jezik: {t.has_causal_language}")
    lines.append(f"  - kvantificirani tokeni: {t.n_numeric_tokens}, domenski pojmovi: {t.n_distinct_finance_terms}")
    lines.append(f"  - preporuka/akcija: {t.has_recommendation_language}, scenarij/neizvjesnost: {t.has_scenario_language}")
    lines.append(f"  - strukturni markeri: {t.has_structure_markers}, broj uz zaključak: {t.conclusion_paragraph_has_number}")
    lines.append(f"  - simptom vs. uzrok: {t.has_contrast_pattern}")
    lines.append(f"  - osjetljivosni jezik: {t.has_sensitivity_language}, publike: {t.n_distinct_audience_keywords}")
    lines.append(f"  - priznanje ograničenja podataka: {t.has_data_quality_language}")
    lines.append(f"  - strateški/operativni kontekst: {t.has_strategic_context_language}")
    if t.has_poor_chart_choice_flag:
        lines.append("  - napomena: spomenut je tortni grafikon uz trend/vremenski niz (tipična razina-1 greška)")
    lines.append("")
    lines += _bars_checks_lines(result)
    return "\n".join(lines)


# --- ESCO mapping -------------------------------------------------------


def esco_to_dict(matches: list[EscoMatch]) -> list[dict]:
    return [dataclasses.asdict(m) for m in matches]


def esco_to_json(matches: list[EscoMatch]) -> str:
    return json.dumps(esco_to_dict(matches), indent=2, ensure_ascii=False)


def esco_to_text(matches: list[EscoMatch]) -> str:
    lines = ["ESCO mapiranje:"]
    for m in matches:
        lines.append(f"  [{m.relevance}] {m.label_en}  ({m.label_hr})")
        for e in m.evidence:
            lines.append(f"      - {e}")
    return "\n".join(lines)
