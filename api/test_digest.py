import os
import sys
import tempfile
import unittest

# Ensure api directory is on sys.path for imports
API_DIR = os.path.dirname(os.path.abspath(__file__))
if API_DIR not in sys.path:
    sys.path.insert(0, API_DIR)

# Use a temporary DB for tests before importing main/database
temp_db_fd, temp_db_path = tempfile.mkstemp(suffix=".db")
os.close(temp_db_fd)
os.environ["DB_PATH"] = temp_db_path

from fastapi.testclient import TestClient
from main import app
from database import (
    init_db, create_lead, create_booking, log_conversation_turn,
    generate_fortnightly_summary, store_digest, get_digests, get_digest_by_id
)
from digest_service import run_fortnightly_digest


class TestFortnightlyDigest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(temp_db_path):
            os.remove(temp_db_path)

    def setUp(self):
        # Clear rate limit middleware memory to prevent test order interference
        current = getattr(app, "middleware_stack", None)
        while current is not None:
            if hasattr(current, "requests") and isinstance(current.requests, dict):
                current.requests.clear()
            current = getattr(current, "app", None)

    def test_01_generate_fortnightly_summary(self):
        # Seed test data
        create_lead("lead1@example.com", "Lead One", "Interested in ML project", status="verified")
        create_lead("lead2@example.com", "Lead Two", "Looking for React developer", status="new")
        create_booking("lead1@example.com", "2026-08-15T10:00:00Z")
        
        log_conversation_turn("session-101", "What is your pricing?", "EXPLORATION", "Our pricing is transparent.")
        log_conversation_turn("session-101", "Tell me about your projects.", "EXPLORATION", "Here are our key projects.")
        log_conversation_turn("session-102", "What is your pricing model?", "PRICING", "We offer hourly and fixed pricing.")

        summary = generate_fortnightly_summary(days=14)

        self.assertIn("digest_code", summary)
        self.assertTrue(summary["digest_code"].startswith("DIGEST-"))
        self.assertGreaterEqual(summary["total_leads"], 2)
        self.assertGreaterEqual(summary["verified_leads_count"], 1)
        self.assertGreaterEqual(summary["bookings_count"], 1)
        self.assertGreaterEqual(summary["conversation_turns_count"], 3)
        self.assertGreaterEqual(summary["unique_sessions_count"], 2)
        self.assertIsInstance(summary["top_query_themes"], list)

    def test_02_store_and_get_digests(self):
        digest_payload = {
            "digest_code": "DIGEST-TEST-001",
            "period_start": "2026-08-01T00:00:00Z",
            "period_end": "2026-08-15T00:00:00Z",
            "summary": {
                "total_leads": 5,
                "verified_leads_count": 3,
                "bookings_count": 2,
                "conversation_turns_count": 10,
                "unique_sessions_count": 4,
                "top_query_themes": [{"theme": "pricing", "count": 4}]
            }
        }

        stored = store_digest(digest_payload)
        self.assertIn("id", stored)
        self.assertEqual(stored["digest_code"], "DIGEST-TEST-001")

        all_digests = get_digests()
        self.assertGreaterEqual(len(all_digests), 1)

        single = get_digest_by_id(stored["id"])
        self.assertIsNotNone(single)
        self.assertEqual(single["digest_code"], "DIGEST-TEST-001")
        self.assertEqual(single["summary"]["total_leads"], 5)

    def test_03_run_fortnightly_digest_service(self):
        digest_record = run_fortnightly_digest(days=14)
        self.assertIn("id", digest_record)
        self.assertIn("digest_code", digest_record)
        self.assertIn("email_result", digest_record)
        self.assertIn("fallback", digest_record["email_result"])

    def test_04_admin_digest_trigger_endpoint(self):
        response = self.client.post("/api/admin/digests/trigger", json={"days": 14})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("digest", data)
        self.assertTrue(data["digest"]["digest_code"].startswith("DIGEST-"))

    def test_05_admin_digest_list_and_get_endpoints(self):
        # List digests
        list_resp = self.client.get("/api/admin/digests")
        self.assertEqual(list_resp.status_code, 200)
        list_data = list_resp.json()
        self.assertEqual(list_data["status"], "success")
        self.assertIsInstance(list_data["digests"], list)
        self.assertGreater(len(list_data["digests"]), 0)

        digest_id = list_data["digests"][0]["id"]

        # Get single digest
        get_resp = self.client.get(f"/api/admin/digests/{digest_id}")
        self.assertEqual(get_resp.status_code, 200)
        get_data = get_resp.json()
        self.assertEqual(get_data["status"], "success")
        self.assertEqual(get_data["digest"]["id"], digest_id)

        # Get invalid digest ID
        not_found_resp = self.client.get("/api/admin/digests/999999")
        self.assertEqual(not_found_resp.status_code, 404)
        self.assertEqual(not_found_resp.json()["detail"], "Digest not found.")


if __name__ == "__main__":
    unittest.main()
