"""CLI entry point: python -m merific.cli analyze path/to/model.xlsx [--json]"""

from __future__ import annotations

import argparse
import sys

from .bars_scoring import score_skill1
from .indicators import extract_indicators
from .report import to_json, to_text


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="merific", description="Merific BARS analyzer for spreadsheet models")
    sub = parser.add_subparsers(dest="command", required=True)

    analyze = sub.add_parser("analyze", help="Analyze a spreadsheet and print its BARS level")
    analyze.add_argument("path", help="Path to an .xlsx/.xlsm file")
    analyze.add_argument("--json", action="store_true", help="Output machine-readable JSON")

    args = parser.parse_args(argv)

    if args.command == "analyze":
        indicators = extract_indicators(args.path)
        result = score_skill1(indicators)
        print(to_json(indicators, result) if args.json else to_text(indicators, result))
        return 0

    return 1


if __name__ == "__main__":
    sys.exit(main())
