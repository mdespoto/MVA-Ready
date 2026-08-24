import os
import subprocess
import sys

import pytest

FIXTURES = os.path.join(os.path.dirname(__file__), "fixtures")


@pytest.fixture(scope="session", autouse=True)
def build_fixtures():
    """Regenerates tests/fixtures/*.xlsx before any test runs. Session-scoped
    and defined here (not in an individual test module) so it applies to
    every test file in the run, including ones that only indirectly need
    the .xlsx fixtures (e.g. test_esco_mapping.py)."""
    script = os.path.join(FIXTURES, "make_fixtures.py")
    subprocess.run([sys.executable, script], check=True, cwd=FIXTURES)
