import os

import pytest

from merific.bars_scoring import score_skill2
from merific.text_indicators import extract_text_indicators

FIXTURES = os.path.join(os.path.dirname(__file__), "fixtures", "text")


def _score(name):
    with open(os.path.join(FIXTURES, name), encoding="utf-8") as f:
        text = f.read()
    return score_skill2(extract_text_indicators(text, name))


@pytest.mark.parametrize(
    "fixture_name,expected_level",
    [
        ("level1.txt", 1),
        ("level2.txt", 2),
        ("level3.txt", 3),
        ("level4.txt", 4),
    ],
)
def test_bars_level_matches_fixture_design(fixture_name, expected_level):
    result = _score(fixture_name)
    assert result.level == expected_level, (
        f"{fixture_name}: expected level {expected_level}, got {result.level}\n"
        f"checks: { {lvl: (c.satisfied, c.missing) for lvl, c in result.checks.items()} }"
    )


def test_level1_example_with_quantification_and_vocab_does_not_leak_into_level2():
    # this fixture is the BARS document's own Level-1 example ("troškovi su
    # bili viši nego prethodne godine") -- it has numbers, finance vocab, and
    # an implicit prior-year comparison, but no causal explanation. The
    # mandatory causal gate in score_skill2 exists specifically so this
    # doesn't clear Level 2 on quantification + vocabulary alone.
    result = _score("level1.txt")
    assert result.level == 1


def test_level3_gap_to_level4_is_concrete():
    result = _score("level3.txt")
    assert result.level == 3
    assert result.gap_to_next_level
    assert any("osjetljivosna" in item or "publik" in item for item in result.gap_to_next_level)
