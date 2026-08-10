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
os.environ["TESTING"] = "1"

from fastapi.testclient import TestClient
from main import app, reset_rate_limit_middleware
from database import (
    init_db,
    add_to_finetune_queue,
    get_finetune_queue,
    review_finetune_item,
    run_finetune_cycle,
    get_model_versions,
    rollback_model_version,
    reset_otp_rate_limit
)

class TestSLMFineTuneSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(temp_db_path):
            os.remove(temp_db_path)

    def setUp(self):
        reset_otp_rate_limit()
        reset_rate_limit_middleware()

    def test_01_database_finetune_queue_operations(self):
        item = add_to_finetune_queue(
            session_id="sess-ft-01",
            visitor_query="What framework power lato-validation?",
            context_retrieved="LATO uses Python, FastAPI, TypeScript, React.",
            llm_response="LATO validation framework is built using Python, FastAPI, TypeScript, and React.",
            grounding_score=0.95
        )
        self.assertIsNotNone(item["id"])
        self.assertEqual(item["session_id"], "sess-ft-01")
        self.assertEqual(item["status"], "pending")
        self.assertAlmostEqual(item["grounding_score"], 0.95)

        pending_items = get_finetune_queue(status="pending")
        self.assertTrue(any(i["id"] == item["id"] for i in pending_items))

        # Review item to approved
        updated = review_finetune_item(item["id"], "approved")
        self.assertIsNotNone(updated)
        self.assertEqual(updated["status"], "approved")
        self.assertIsNotNone(updated["approved_at"])

    def test_02_api_queue_and_review(self):
        # Add item via API
        add_res = self.client.post("/api/admin/finetune/queue/add", json={
            "session_id": "sess-ft-02",
            "visitor_query": "Does Sentinel MCP support Docker?",
            "context_retrieved": "Sentinel MCP runs Docker containers.",
            "llm_response": "Yes, Sentinel MCP executes dynamic code in isolated Docker containers.",
            "grounding_score": 0.88
        })
        self.assertEqual(add_res.status_code, 200)
        item_id = add_res.json()["item"]["id"]

        # Fetch queue via API
        queue_res = self.client.get("/api/admin/finetune/queue?status=pending")
        self.assertEqual(queue_res.status_code, 200)
        items = queue_res.json()["queue"]
        self.assertTrue(any(i["id"] == item_id for i in items))

        # Review item via API (reject item)
        rev_res = self.client.post("/api/admin/finetune/review", json={
            "item_id": item_id,
            "status": "rejected"
        })
        self.assertEqual(rev_res.status_code, 200)
        self.assertEqual(rev_res.json()["item"]["status"], "rejected")

    def test_03_run_finetune_cycle_and_status(self):
        # Add 2 approved items
        item1 = add_to_finetune_queue(
            session_id="sess-ft-cycle-1",
            visitor_query="Tell me about Examly Enterprise",
            context_retrieved="Examly handles 25k concurrent users.",
            llm_response="Examly Enterprise handles over 25,000 concurrent candidate exam sessions.",
            grounding_score=0.98,
            status="approved"
        )
        item2 = add_to_finetune_queue(
            session_id="sess-ft-cycle-2",
            visitor_query="What is Split Money?",
            context_retrieved="Split Money calculates debt graph.",
            llm_response="Split Money uses graph algorithms for expense simplification.",
            grounding_score=0.92,
            status="approved"
        )

        # Run fine-tune cycle
        run_res = self.client.post("/api/admin/finetune/run")
        self.assertEqual(run_res.status_code, 200)
        run_data = run_res.json()
        self.assertEqual(run_data["status"], "success")
        version_info = run_data["version"]
        self.assertIsNotNone(version_info)
        self.assertEqual(version_info["version_tag"], "llama3.2:3b-v1.0")
        self.assertEqual(version_info["is_active"], 1)
        self.assertTrue(version_info["dataset_size"] >= 2)

        # Check status endpoint
        status_res = self.client.get("/api/admin/finetune/status")
        self.assertEqual(status_res.status_code, 200)
        sdata = status_res.json()
        self.assertEqual(sdata["active_model_version"], "llama3.2:3b-v1.0")
        self.assertIsNotNone(sdata["last_finetune_date"])
        self.assertTrue(sdata["dataset_size"] >= 2)

        # Run a second fine-tune cycle and verify version tag increment (v1.1)
        run_res_2 = self.client.post("/api/admin/finetune/run")
        self.assertEqual(run_res_2.status_code, 200)
        v2_info = run_res_2.json()["version"]
        self.assertEqual(v2_info["version_tag"], "llama3.2:3b-v1.1")
        self.assertEqual(v2_info["is_active"], 1)

    def test_04_model_versions_and_rollback(self):
        # Fetch version history
        vers_res = self.client.get("/api/admin/finetune/versions")
        self.assertEqual(vers_res.status_code, 200)
        versions = vers_res.json()["versions"]
        self.assertTrue(len(versions) >= 2)

        # Find v1.0 version id
        v1_0 = next(v for v in versions if v["version_tag"] == "llama3.2:3b-v1.0")
        self.assertEqual(v1_0["is_active"], 0)

        # Perform rollback to v1.0
        rb_res = self.client.post("/api/admin/finetune/rollback", json={
            "version_id": v1_0["id"]
        })
        self.assertEqual(rb_res.status_code, 200)
        self.assertEqual(rb_res.json()["version"]["is_active"], 1)

        # Verify status endpoint reflects rolled back active model version
        status_res = self.client.get("/api/admin/finetune/status")
        self.assertEqual(status_res.status_code, 200)
        self.assertEqual(status_res.json()["active_model_version"], "llama3.2:3b-v1.0")

if __name__ == "__main__":
    unittest.main()
