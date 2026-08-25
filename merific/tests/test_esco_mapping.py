import os

from merific.bars_scoring import score_skill1, score_skill2
from merific.esco_mapping import ESCO_LABELS, RELEVANCE_NONE, RELEVANCE_STRONG, map_to_esco
from merific.indicators import extract_indicators
from merific.text_indicators import extract_text_indicators

XLSX_FIXTURES = os.path.join(os.path.dirname(__file__), "fixtures")
TEXT_FIXTURES = os.path.join(os.path.dirname(__file__), "fixtures", "text")


def test_all_five_esco_labels_always_present():
    matches = map_to_esco()
    assert {m.key for m in matches} == set(ESCO_LABELS.keys())
    assert all(m.relevance == RELEVANCE_NONE for m in matches)


def test_level4_spreadsheet_gives_strong_evidence_for_spreadsheet_and_model_skills():
    indicators = extract_indicators(os.path.join(XLSX_FIXTURES, "level4.xlsx"))
    result = score_skill1(indicators)
    matches = map_to_esco(skill1=(indicators, result))
    by_key = {m.key: m for m in matches}

    assert by_key["use_spreadsheet_software"].relevance == RELEVANCE_STRONG
    assert by_key["develop_financial_models"].relevance == RELEVANCE_STRONG
    assert by_key["manage_data_content"].relevance == RELEVANCE_STRONG
    assert by_key["manage_data_content"].evidence  # traceable, not a bare label
    # skill2 wasn't analyzed -> no evidence for the skill2-only label
    assert by_key["communicate_findings"].relevance == RELEVANCE_NONE


def test_level1_spreadsheet_gives_no_evidence_for_developing_models():
    indicators = extract_indicators(os.path.join(XLSX_FIXTURES, "level1.xlsx"))
    result = score_skill1(indicators)
    matches = map_to_esco(skill1=(indicators, result))
    by_key = {m.key: m for m in matches}
    assert by_key["develop_financial_models"].relevance == RELEVANCE_NONE


def test_level4_memo_gives_strong_evidence_for_communicate_findings():
    with open(os.path.join(TEXT_FIXTURES, "level4.txt"), encoding="utf-8") as f:
        text = f.read()
    indicators = extract_text_indicators(text, "level4.txt")
    result = score_skill2(indicators)
    matches = map_to_esco(skill2=(indicators, result))
    by_key = {m.key: m for m in matches}
    assert by_key["communicate_findings"].relevance == RELEVANCE_STRONG


def test_combining_both_skills_merges_evidence_on_shared_label():
    xlsx_indicators = extract_indicators(os.path.join(XLSX_FIXTURES, "level4.xlsx"))
    xlsx_result = score_skill1(xlsx_indicators)
    with open(os.path.join(TEXT_FIXTURES, "level4.txt"), encoding="utf-8") as f:
        text = f.read()
    text_indicators = extract_text_indicators(text, "level4.txt")
    text_result = score_skill2(text_indicators)

    matches = map_to_esco(skill1=(xlsx_indicators, xlsx_result), skill2=(text_indicators, text_result))
    by_key = {m.key: m for m in matches}
    # "analyse financial data" can get evidence from both skills; check it's not duplicated/lost
    assert by_key["analyse_financial_data"].relevance == RELEVANCE_STRONG
    assert len(by_key["analyse_financial_data"].evidence) == len(set(by_key["analyse_financial_data"].evidence))
