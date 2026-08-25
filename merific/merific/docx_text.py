"""Minimal .docx -> plain text extraction, paragraph by paragraph.

No python-docx dependency: a .docx is a zip archive, and paragraph text
lives in `word/document.xml` as a sequence of `<w:p>...</w:p>` blocks each
containing `<w:t>` runs. Good enough to feed `text_indicators.py`; not a
general-purpose Word reader (tables, headers/footers, and text boxes are
not extracted).
"""

from __future__ import annotations

import re
import zipfile

_PARA_SPLIT_RE = re.compile(r"</w:p>")
_TEXT_RUN_RE = re.compile(r"<w:t[^>]*>(.*?)</w:t>", re.DOTALL)


def extract_docx_text(path: str) -> str:
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf-8")

    paragraphs = []
    for para_xml in _PARA_SPLIT_RE.split(xml):
        runs = _TEXT_RUN_RE.findall(para_xml)
        text = "".join(runs).strip()
        if text:
            paragraphs.append(text)

    return "\n\n".join(paragraphs)
