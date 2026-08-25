import os

import pytest

from merific.bars_scoring import score_skill1
from merific.indicators import extract_indicators

FIXTURES = os.path.join(os.path.dirname(__file__), "fixtures")


@pytest.mark.parametrize(
    "fixture_name,expected_level",
    [
        ("level1.xlsx", 1),
        ("level2.xlsx", 2),
        ("level3.xlsx", 3),
        ("level4.xlsx", 4),
    ],
)
def test_bars_level_matches_fixture_design(fixture_name, expected_level):
    path = os.path.join(FIXTURES, fixture_name)
    indicators = extract_indicators(path)
    result = score_skill1(indicators)
    assert result.level == expected_level, (
        f"{fixture_name}: expected level {expected_level}, got {result.level}\n"
        f"checks: { {lvl: (c.satisfied, c.missing) for lvl, c in result.checks.items()} }"
    )


def test_level1_has_no_formulas_and_full_hardcoding():
    indicators = extract_indicators(os.path.join(FIXTURES, "level1.xlsx"))
    assert indicators.formula.n_formulas == 0
    assert indicators.structural.hardcoded_ratio == 1.0


def test_level3_gap_to_level4_names_concrete_missing_signals():
    indicators = extract_indicators(os.path.join(FIXTURES, "level3.xlsx"))
    result = score_skill1(indicators)
    assert result.level == 3
    assert result.gap_to_next_level  # level 3 -> 4 gap should be non-empty
    assert any("Power Query" in item for item in result.gap_to_next_level)


def test_level4_detects_lambda_and_readme_sheet():
    indicators = extract_indicators(os.path.join(FIXTURES, "level4.xlsx"))
    assert indicators.formula.uses_lambda_or_dynamic
    assert indicators.structural.has_readme_sheet
