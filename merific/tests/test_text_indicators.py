import os

from merific.text_indicators import extract_text_indicators

FIXTURES = os.path.join(os.path.dirname(__file__), "fixtures", "text")


def _load(name):
    with open(os.path.join(FIXTURES, name), encoding="utf-8") as f:
        return f.read()


def test_level1_has_no_causal_or_recommendation_language():
    t = extract_text_indicators(_load("level1.txt"), "level1.txt")
    assert t.has_causal_language is False
    assert t.has_recommendation_language is False
    assert t.n_numeric_tokens > 0  # it does have numbers -- just no interpretation


def test_level1_flags_pie_chart_for_trend():
    t = extract_text_indicators(_load("level1.txt"), "level1.txt")
    assert t.has_poor_chart_choice_flag is True


def test_level2_has_benchmark_and_causal_language():
    t = extract_text_indicators(_load("level2.txt"), "level2.txt")
    assert t.has_benchmark_language is True
    assert t.has_causal_language is True
    assert t.has_recommendation_language is False


def test_level3_distinguishes_symptom_from_cause():
    t = extract_text_indicators(_load("level3.txt"), "level3.txt")
    assert t.has_contrast_pattern is True
    assert t.has_scenario_language is True
    assert t.has_structure_markers is True
    assert t.conclusion_paragraph_has_number is True


def test_level4_has_sensitivity_and_audience_and_data_quality_language():
    t = extract_text_indicators(_load("level4.txt"), "level4.txt")
    assert t.has_sensitivity_language is True
    assert t.n_distinct_audience_keywords >= 2
    assert t.has_data_quality_language is True
    assert t.has_strategic_context_language is True
