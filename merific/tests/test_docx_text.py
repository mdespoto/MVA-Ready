import zipfile

CONTENT_TYPES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>"""

RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

DOCUMENT_XML = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Prvi odlomak </w:t></w:r><w:r><w:t>u dva runa.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Drugi odlomak, zbog testiranja.</w:t></w:r></w:p>
  </w:body>
</w:document>"""


def _make_docx(path):
    with zipfile.ZipFile(path, "w") as z:
        z.writestr("[Content_Types].xml", CONTENT_TYPES)
        z.writestr("_rels/.rels", RELS)
        z.writestr("word/document.xml", DOCUMENT_XML)


def test_extract_docx_text_merges_runs_and_splits_paragraphs(tmp_path):
    from merific.docx_text import extract_docx_text

    path = tmp_path / "memo.docx"
    _make_docx(str(path))

    text = extract_docx_text(str(path))
    paragraphs = text.split("\n\n")
    assert paragraphs == ["Prvi odlomak u dva runa.", "Drugi odlomak, zbog testiranja."]
