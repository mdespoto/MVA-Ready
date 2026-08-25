import os

from merific.indicators import extract_indicators

FIXTURES = os.path.join(os.path.dirname(__file__), "fixtures")


def test_sheet_role_classification():
    indicators = extract_indicators(os.path.join(FIXTURES, "level3.xlsx"))
    roles = indicators.structural.sheet_roles
    assert roles["Pretpostavke"] == {"input"}
    assert "calc" in roles["P&L"]
    assert roles["Sazetak"] == {"output"}


def test_cross_sheet_references_detected():
    indicators = extract_indicators(os.path.join(FIXTURES, "level3.xlsx"))
    assert indicators.structural.cross_sheet_ref_count > 0


def test_named_range_counted():
    indicators = extract_indicators(os.path.join(FIXTURES, "level3.xlsx"))
    assert indicators.structural.n_named_ranges >= 1


def test_scenario_selector_detected_with_fanout():
    indicators = extract_indicators(os.path.join(FIXTURES, "level3.xlsx"))
    assert indicators.structural.has_scenario_selector
    assert indicators.structural.scenario_selector_fanout >= 1


def test_lookup_and_conditional_functions_detected():
    indicators = extract_indicators(os.path.join(FIXTURES, "level2.xlsx"))
    assert indicators.formula.uses_lookup
    assert indicators.formula.uses_conditional


def test_formula_pattern_consistency_high_for_copied_formulas():
    indicators = extract_indicators(os.path.join(FIXTURES, "level3.xlsx"))
    # revenue/cost/profit formulas are filled down across 12 months -> highly repeated shapes
    assert indicators.formula.pattern_consistency > 0.8


def test_color_convention_score_distinguishes_input_from_formula_colors():
    indicators = extract_indicators(os.path.join(FIXTURES, "level3.xlsx"))
    assert indicators.structural.color_convention_score > 0.5


def test_no_power_query_or_vba_in_synthetic_fixtures():
    # these fixtures are plain openpyxl-generated files; neither feature is present
    indicators = extract_indicators(os.path.join(FIXTURES, "level4.xlsx"))
    assert indicators.formula.has_power_query is False
    assert indicators.formula.has_vba is False
