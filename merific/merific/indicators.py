"""Content-indicator extraction from an Excel workbook (.xlsx / .xlsm).

Implements the "sadržajni indikatori" catalog from the BARS methodology
(structural architecture, formula complexity) for the single domain skill
that document operationalizes concretely: financial-table modeling.

All heuristics here are proxies, not ground truth — each one is documented
with the assumption it encodes, so a reviewer can trace a BARS level back
to the specific signals that produced it (the "explicit, transparent coding
scheme" the methodology requires of an automated scorer).
"""

from __future__ import annotations

import re
import zipfile
from collections import Counter
from dataclasses import dataclass, field

import openpyxl
from openpyxl.worksheet.worksheet import Worksheet

# --- keyword vocabularies used to classify a sheet's role from its name ----
# Croatian + English, since real-world workbooks in this domain mix both.
_INPUT_KEYWORDS = (
    "input", "assum", "pretpostavk", "parametr", "param", "ulaz",
)
_CALC_KEYWORDS = (
    "calc", "izracun", "izračun", "model", "p&l", "pl", "cashflow",
    "cash flow", "cash-flow", "trosk", "troš", "prihod", "revenue",
    "cost", "kpi", "budget", "proracun", "proračun",
)
_OUTPUT_KEYWORDS = (
    "output", "report", "izvjest", "izvješt", "summary", "sazetak",
    "sažetak", "dashboard", "rezultat",
)
_README_KEYWORDS = (
    "readme", "upute", "dokumentacij", "opis", "instructions", "about",
)

_LOOKUP_FUNCS = {"VLOOKUP", "HLOOKUP", "XLOOKUP", "INDEX", "MATCH"}
_CONDITIONAL_FUNCS = {"IF", "IFS", "SUMIF", "COUNTIF", "AVERAGEIF"}
_ADVANCED_FUNCS = {
    "SUMIFS", "COUNTIFS", "AVERAGEIFS", "OFFSET", "INDIRECT",
    "IFERROR", "CHOOSE",
}
_DYNAMIC_LAMBDA_FUNCS = {
    "LAMBDA", "LET", "SEQUENCE", "FILTER", "UNIQUE", "SORT", "SORTBY",
    "XMATCH", "TEXTSPLIT",
}
_BASIC_ARITH_HINT = re.compile(r"^=\s*[A-Z]*\d*\s*[+\-*/]\s*")
_FUNC_NAME_RE = re.compile(r"\b([A-Z][A-Z0-9._]*)\s*\(")
_SHEET_REF_RE = re.compile(r"!")
_CELL_REF_RE = re.compile(r"\b([A-Z]{1,3}\d{1,7})\b")


def _classify_sheet_name(name: str) -> set[str]:
    lname = name.lower()
    roles = set()
    if any(k in lname for k in _INPUT_KEYWORDS):
        roles.add("input")
    if any(k in lname for k in _CALC_KEYWORDS):
        roles.add("calc")
    if any(k in lname for k in _OUTPUT_KEYWORDS):
        roles.add("output")
    if any(k in lname for k in _README_KEYWORDS):
        roles.add("readme")
    return roles


@dataclass
class StructuralIndicators:
    n_sheets: int = 0
    sheet_roles: dict[str, set[str]] = field(default_factory=dict)
    has_input_sheet: bool = False
    has_calc_sheet: bool = False
    has_output_sheet: bool = False
    has_readme_sheet: bool = False
    n_named_ranges: int = 0
    n_structured_tables: int = 0
    cross_sheet_ref_count: int = 0
    hardcoded_ratio: float = 0.0  # numeric-constant cells / (numeric-constant + formula cells)
    color_convention_score: float = 0.0  # 0..1, see _color_convention_score
    has_scenario_selector: bool = False
    scenario_selector_fanout: int = 0


@dataclass
class FormulaIndicators:
    n_formulas: int = 0
    function_counts: Counter = field(default_factory=Counter)
    max_nesting_depth: int = 0
    avg_nesting_depth: float = 0.0
    n_basic_arithmetic_only: int = 0
    uses_conditional: bool = False
    uses_lookup: bool = False
    uses_advanced: bool = False
    uses_lambda_or_dynamic: bool = False
    uses_absolute_refs: bool = False
    has_array_formula: bool = False
    has_power_query: bool = False
    has_vba: bool = False
    pattern_consistency: float = 0.0  # copy-paste consistency of repeated formula shapes


@dataclass
class ModelIndicators:
    file_name: str
    structural: StructuralIndicators
    formula: FormulaIndicators


def _paren_depth(formula: str) -> int:
    depth = max_depth = 0
    for ch in formula:
        if ch == "(":
            depth += 1
            max_depth = max(max_depth, depth)
        elif ch == ")":
            depth = max(0, depth - 1)
    return max_depth


def _formula_shape(formula: str) -> str:
    """Collapse a formula to its 'shape' (function skeleton, refs stripped)
    so that N copies of the same formula with shifted relative refs compare equal."""
    shape = _CELL_REF_RE.sub("REF", formula)
    shape = re.sub(r"\$", "", shape)
    return shape


def _pattern_consistency(formulas: list[str]) -> float:
    """Fraction of formulas that belong to a shape shared by >=2 formulas.

    High values indicate formulas were built once and copied/filled across a
    range (the level-3+ behaviour); low values indicate one-off, bespoke
    formulas typical of level-1 spreadsheets.
    """
    if not formulas:
        return 0.0
    shapes = Counter(_formula_shape(f) for f in formulas)
    repeated = sum(count for count in shapes.values() if count >= 2)
    return repeated / len(formulas)


def _color_convention_score(wb) -> float:
    """Proxy for 'inputs/formulas colour-coded consistently', computed once
    across the whole workbook (the convention is a model-wide property, not
    a per-sheet one — most sheets won't contain both hardcoded inputs and
    formulas, so scoring per-sheet and averaging would be dominated by
    sheets that say nothing about the convention).

    Buckets non-empty cells into hardcoded-numeric-input vs formula, records
    the dominant font colour (ARGB hex) in each bucket, and scores how
    dominant that colour is within its bucket and how distinct the two
    dominant colours are from each other. 0 = no discernible convention,
    1 = every input cell shares one colour, every formula cell shares a
    different colour.
    """
    input_colors: Counter = Counter()
    formula_colors: Counter = Counter()

    for ws in wb.worksheets:
        for row in ws.iter_rows():
            for cell in row:
                if cell.value is None:
                    continue
                color = None
                try:
                    if cell.font and cell.font.color and cell.font.color.type == "rgb":
                        color = cell.font.color.rgb
                except AttributeError:
                    pass
                color = color or "AUTO"
                if isinstance(cell.value, str) and cell.value.startswith("="):
                    formula_colors[color] += 1
                elif isinstance(cell.value, (int, float)):
                    input_colors[color] += 1

    def dominance(counter: Counter) -> tuple[str | None, float]:
        if not counter:
            return None, 0.0
        color, count = counter.most_common(1)[0]
        return color, count / sum(counter.values())

    input_color, input_dom = dominance(input_colors)
    formula_color, formula_dom = dominance(formula_colors)

    if input_color is None or formula_color is None:
        return 0.0

    distinct_bonus = 1.0 if input_color != formula_color else 0.0
    return round((input_dom + formula_dom) / 2 * distinct_bonus, 3)


def _has_power_query(path: str) -> bool:
    try:
        with zipfile.ZipFile(path) as z:
            names = z.namelist()
            if any(n.startswith("xl/queries/") or n.startswith("customXml/") for n in names):
                return True
            if "xl/connections.xml" in names:
                data = z.read("xl/connections.xml").decode("utf-8", errors="ignore")
                if "Mashup" in data or "PowerQuery" in data:
                    return True
    except (zipfile.BadZipFile, KeyError):
        pass
    return False


def _has_vba(path: str) -> bool:
    try:
        with zipfile.ZipFile(path) as z:
            return "xl/vbaProject.bin" in z.namelist()
    except zipfile.BadZipFile:
        return False


def _find_scenario_selector(wb, all_formulas: list[str]) -> tuple[bool, int]:
    """A 'scenario selector' is a cell with a dropdown (data validation list)
    whose coordinate shows up inside conditional/lookup formulas elsewhere
    in the workbook (IF/CHOOSE/INDEX keyed off it)."""
    best_fanout = 0
    found = False
    for ws in wb.worksheets:
        for dv in ws.data_validations.dataValidation:
            if dv.type != "list":
                continue
            found = True
            for sqref_range in dv.sqref.ranges if hasattr(dv.sqref, "ranges") else [dv.sqref]:
                for row in ws.iter_rows(
                    min_row=sqref_range.min_row, max_row=sqref_range.max_row,
                    min_col=sqref_range.min_col, max_col=sqref_range.max_col,
                ):
                    for cell in row:
                        coord = cell.coordinate
                        # formulas may reference the cell with absolute-ref "$" signs
                        # (e.g. "$B$1"); strip them before matching so both forms count.
                        fanout = sum(
                            1 for f in all_formulas if re.search(rf"\b{coord}\b", f.replace("$", ""))
                        )
                        best_fanout = max(best_fanout, fanout)
    return found, best_fanout


def extract_indicators(path: str) -> ModelIndicators:
    wb = openpyxl.load_workbook(path, data_only=False)

    structural = StructuralIndicators()
    formula_ind = FormulaIndicators()

    structural.n_sheets = len(wb.worksheets)
    for ws in wb.worksheets:
        roles = _classify_sheet_name(ws.title)
        structural.sheet_roles[ws.title] = roles
    structural.has_input_sheet = any("input" in r for r in structural.sheet_roles.values())
    structural.has_calc_sheet = any("calc" in r for r in structural.sheet_roles.values())
    structural.has_output_sheet = any("output" in r for r in structural.sheet_roles.values())
    structural.has_readme_sheet = any("readme" in r for r in structural.sheet_roles.values())

    structural.n_named_ranges = len(wb.defined_names)
    for ws in wb.worksheets:
        structural.n_named_ranges += len(ws.defined_names)
        structural.n_structured_tables += len(ws.tables)

    all_formulas: list[str] = []
    n_numeric_constants = 0
    nesting_depths: list[int] = []

    for ws in wb.worksheets:
        for row in ws.iter_rows():
            for cell in row:
                value = cell.value
                if isinstance(value, str) and value.startswith("="):
                    all_formulas.append(value)
                elif isinstance(value, (int, float)) and not isinstance(value, bool):
                    n_numeric_constants += 1
        array_ranges = getattr(ws, "array_formulae", None)
        if array_ranges:
            formula_ind.has_array_formula = True

    formula_ind.n_formulas = len(all_formulas)
    for f in all_formulas:
        for match in _FUNC_NAME_RE.findall(f):
            formula_ind.function_counts[match.upper()] += 1
        nesting_depths.append(_paren_depth(f))
        if _BASIC_ARITH_HINT.match(f) and "(" not in f:
            formula_ind.n_basic_arithmetic_only += 1
        if "$" in f:
            formula_ind.uses_absolute_refs = True
        if _SHEET_REF_RE.search(f):
            structural.cross_sheet_ref_count += 1

    funcs_used = set(formula_ind.function_counts.keys())
    formula_ind.uses_conditional = bool(funcs_used & _CONDITIONAL_FUNCS)
    formula_ind.uses_lookup = bool(funcs_used & _LOOKUP_FUNCS)
    formula_ind.uses_advanced = bool(funcs_used & _ADVANCED_FUNCS) or (
        {"INDEX", "MATCH"} <= funcs_used
    )
    formula_ind.uses_lambda_or_dynamic = bool(funcs_used & _DYNAMIC_LAMBDA_FUNCS)

    if nesting_depths:
        formula_ind.max_nesting_depth = max(nesting_depths)
        formula_ind.avg_nesting_depth = round(sum(nesting_depths) / len(nesting_depths), 2)

    formula_ind.pattern_consistency = round(_pattern_consistency(all_formulas), 3)

    total_value_cells = n_numeric_constants + formula_ind.n_formulas
    structural.hardcoded_ratio = round(
        n_numeric_constants / total_value_cells, 3
    ) if total_value_cells else 0.0

    structural.color_convention_score = _color_convention_score(wb)

    formula_ind.has_power_query = _has_power_query(path)
    formula_ind.has_vba = _has_vba(path)

    found_selector, fanout = _find_scenario_selector(wb, all_formulas)
    structural.has_scenario_selector = found_selector
    structural.scenario_selector_fanout = fanout

    return ModelIndicators(file_name=path, structural=structural, formula=formula_ind)
