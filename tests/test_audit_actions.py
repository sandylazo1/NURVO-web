"""Offline tests for the GitHub Actions failure report; no API calls or token needed."""
import importlib.util
import os
import pathlib
import unittest
from unittest.mock import patch

SCRIPT = pathlib.Path(__file__).resolve().parents[1] / "scripts" / "audit-actions.py"
spec = importlib.util.spec_from_file_location("nurvo_ci_audit", SCRIPT)
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)

class AuditActionsTests(unittest.TestCase):
    def test_collects_failed_job_and_exact_step(self):
        requests = []
        def fake_fetch(path):
            requests.append(path)
            if "/actions/runs?" in path:
                return {"workflow_runs": [
                    {"id": 123, "name": "NURVO checks", "conclusion": "failure",
                     "status": "completed", "head_sha": "abcd",
                     "head_branch": "main", "created_at": "2026-11-01T12:00:00Z",
                     "html_url": "https://github.com/example/runs/123"},
                    {"id": 124, "conclusion": "success"},
                ]}
            if "/runs/123/jobs" in path:
                return {"jobs": [
                    {"id": 987, "name": "Python API tests", "conclusion": "failure",
                     "steps": [{"name": "Install backend", "conclusion": "success", "number": 2},
                               {"name": "Run pytest", "conclusion": "failure", "number": 3}]}
                ]}
            raise AssertionError("Unexpected path: " + path)
        with patch.object(audit, "fetch", side_effect=fake_fetch), patch.object(audit, "MAX_PAGES", 1):
            report = audit.audit()
        self.assertIn("run 123", report)
        self.assertIn("Python API tests", report)
        self.assertIn("Run pytest", report)
        self.assertNotIn("Install backend", report)
        self.assertIn("1", report)
        self.assertEqual(len(requests), 2)

    def test_no_failures_does_not_claim_green(self):
        with patch.object(audit, "fetch", return_value={"workflow_runs": []}):
            result = audit.audit()
        self.assertIn("no significa que CI esté verde", result)
        self.assertIn("0", result)

if __name__ == "__main__":
    unittest.main()
