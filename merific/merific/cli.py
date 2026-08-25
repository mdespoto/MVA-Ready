"""CLI entry point.

    python -m merific.cli analyze model.xlsx [--json] [--esco]
    python -m merific.cli analyze-text memo.docx [--json] [--esco]
    python -m merific.cli analyze-text memo.txt  [--json] [--esco]
"""

from __future__ import annotations

import argparse
import sys

from .bars_scoring import score_skill1, score_skill2
from .docx_text import extract_docx_text
from .esco_mapping import map_to_esco
from .indicators import extract_indicators
from .report import esco_to_json, esco_to_text, text_to_json, text_to_text, to_json, to_text
from .text_indicators import extract_text_indicators


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="merific", description="Merific BARS analyzer")
    sub = parser.add_subparsers(dest="command", required=True)

    analyze = sub.add_parser("analyze", help="Analyze a spreadsheet (Vještina 1) and print its BARS level")
    analyze.add_argument("path", help="Path to an .xlsx/.xlsm file")
    analyze.add_argument("--json", action="store_true", help="Output machine-readable JSON")
    analyze.add_argument("--esco", action="store_true", help="Also print the ESCO skill mapping")

    analyze_text = sub.add_parser(
        "analyze-text", help="Analyze narrative text (Vještina 2, e.g. a memo/report) and print its BARS level"
    )
    analyze_text.add_argument("path", help="Path to a .docx or .txt file")
    analyze_text.add_argument("--json", action="store_true", help="Output machine-readable JSON")
    analyze_text.add_argument("--esco", action="store_true", help="Also print the ESCO skill mapping")

    args = parser.parse_args(argv)

    if args.command == "analyze":
        indicators = extract_indicators(args.path)
        result = score_skill1(indicators)
        print(to_json(indicators, result) if args.json else to_text(indicators, result))
        if args.esco:
            matches = map_to_esco(skill1=(indicators, result))
            print(esco_to_json(matches) if args.json else "\n" + esco_to_text(matches))
        return 0

    if args.command == "analyze-text":
        text = extract_docx_text(args.path) if args.path.lower().endswith(".docx") else open(args.path, encoding="utf-8").read()
        indicators = extract_text_indicators(text, args.path)
        result = score_skill2(indicators)
        print(text_to_json(indicators, result) if args.json else text_to_text(indicators, result))
        if args.esco:
            matches = map_to_esco(skill2=(indicators, result))
            print(esco_to_json(matches) if args.json else "\n" + esco_to_text(matches))
        return 0

    return 1


if __name__ == "__main__":
    sys.exit(main())
