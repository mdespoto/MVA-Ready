"""Human-readable and JSON rendering of a BARS scoring result."""

from __future__ import annotations

import dataclasses
import json

from .bars_scoring import BARSResult
from .indicators import ModelIndicators


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
            "checks": {
                str(lvl): {"satisfied": c.satisfied, "missing": c.missing, "score": round(c.score, 2)}
                for lvl, c in result.checks.items()
            },
            "gap_to_next_level": result.gap_to_next_level,
        },
    }


def to_json(indicators: ModelIndicators, result: BARSResult) -> str:
    return json.dumps(to_dict(indicators, result), indent=2, ensure_ascii=False)


def to_text(indicators: ModelIndicators, result: BARSResult) -> str:
    lines = []
    lines.append(f"Datoteka: {indicators.file_name}")
    lines.append(f"Vještina: {result.skill}")
    lines.append(f"BARS razina: {result.level} — {result.level_name}")
    lines.append("")
    lines.append("Ključni indikatori:")
    s, f = indicators.structural, indicators.formula
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
    return "\n".join(lines)


def ind_roles(structural) -> str:
    parts = []
    for name, roles in structural.sheet_roles.items():
        tag = ",".join(sorted(roles)) if roles else "?"
        parts.append(f"{name}[{tag}]")
    return "; ".join(parts)
