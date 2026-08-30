import json
import tempfile
import unittest
from pathlib import Path

from twinthink.ingestion import ingest_directory
from twinthink.validator import validate_twin_document


class TwinIngestionTests(unittest.TestCase):
    def test_draft_is_schema_valid_and_evidence_preserving(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "design.step").write_text("placeholder CAD", encoding="utf-8")
            (root / "notes.md").write_text("A concept for a reusable object.", encoding="utf-8")
            (root / "test.csv").write_text("time,temp\n0,20\n1,21\n", encoding="utf-8")

            twin = ingest_directory(root, title="Test Object", author="Tester")
            document = {k: v for k, v in twin.items() if k != "_ingestion"}

            self.assertIs(validate_twin_document(document), True)
            self.assertEqual(twin["identity"]["status"], "DRAFT")
            self.assertEqual(twin["_ingestion"]["asset_count"], 3)
            self.assertEqual(twin["_ingestion"]["csv_summaries"]["test.csv"]["row_count"], 2)
            self.assertEqual(twin["claims"], [])
            self.assertEqual(twin["unknowns"][0]["category"], "Ingestion")

    def test_reality_state_is_derived_from_artifacts(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "design.glb").write_bytes(b"glb")
            (root / "design.step").write_bytes(b"step")
            (root / "simulation.py").write_text("print('model')", encoding="utf-8")

            twin = ingest_directory(root)
            dimensions = twin["reality_state"]["derived_dimensions"]
            self.assertGreater(dimensions["structure"]["confidence"], 0)
            self.assertGreater(dimensions["thermal"]["confidence"], 0)
            self.assertEqual(dimensions["safety"]["status"], "UNKNOWN")


if __name__ == "__main__":
    unittest.main()
