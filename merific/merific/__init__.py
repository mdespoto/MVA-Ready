"""Merific PoC: content-indicator extraction and BARS scoring for spreadsheet models.

Scope of this prototype (see /merific/README.md for what is and is not included):
this package implements the "Ekstraktor sadržajnih indikatora" and a rule-based
BARS scorer for Vještina 1 ("Modeliranje financijskih tablica") from the BARS
document. It does not include process-indicator extraction (revision history),
the NLP/ESCO mapper, the AI-integrity module, or a trained ML classifier —
those require infrastructure (Drive/Git API access, an expert-labeled corpus)
this environment does not have.
"""

from .indicators import ModelIndicators, extract_indicators
from .bars_scoring import BARSResult, score_skill1

__all__ = [
    "ModelIndicators",
    "extract_indicators",
    "BARSResult",
    "score_skill1",
]
