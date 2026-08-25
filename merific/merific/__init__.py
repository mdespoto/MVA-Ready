"""Merific PoC: content-indicator extraction and BARS scoring, for spreadsheet
models (Vještina 1) and narrative text (Vještina 2), plus a keyword-based
ESCO label mapper.

Scope of this prototype (see /merific/README.md for what is and is not included):
this package implements rule-based scorers for the two skills the BARS
document operationalizes concretely, and maps their evidence onto the five
ESCO skill labels the project already names. It does not include process-
indicator extraction (revision history), the semantic NLP/ESCO mapper
described in the methodology, the AI-integrity module, or a trained ML
classifier — those require infrastructure (Drive/Git API access, an
expert-labeled corpus) this environment does not have.
"""

from .bars_scoring import BARSResult, score_skill1, score_skill2
from .docx_text import extract_docx_text
from .esco_mapping import EscoMatch, map_to_esco
from .indicators import ModelIndicators, extract_indicators
from .text_indicators import TextIndicators, extract_text_indicators

__all__ = [
    "ModelIndicators",
    "extract_indicators",
    "TextIndicators",
    "extract_text_indicators",
    "extract_docx_text",
    "BARSResult",
    "score_skill1",
    "score_skill2",
    "EscoMatch",
    "map_to_esco",
]
