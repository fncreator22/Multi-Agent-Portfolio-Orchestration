import os
import sys
import tempfile
import unittest
from datetime import datetime, timezone, timedelta

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
    create_lead,
    log_conversation_turn,
    link_session_to_lead,
    get_all_conversations,
    get_memory_vault_stats,
    purge_old_conversations,
    get_db_connection,
    reset_otp_rate_limit
)

class TestMemoryVaultSystem(unittest.TestCase):
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

    def test_01_database_get_all_conversations_and_filters(self):
        session_a = "sess-vault-01-a"
        session_b = "sess-vault-01-b"

        # Log turns for session_a
        turn1 = log_conversation_turn(
            session_id=session_a,
            visitor_message="Tell me about SignLanguageKeywordUnique project",
            agent_stage="STAGE_1_RETRIEVAL",
            agent_response="Sign language detection uses YOLOv8 nano model.",
            email="user1@example.com"
        )
        # Create lead & link to turn2
        lead = create_lead(email="user2@example.com", name="User Two", message="Contacting for demo")
        turn2 = log_conversation_turn(
            session_id=session_b,
            visitor_message="What is the latency of Sentinel MCP?",
            agent_stage="STAGE_3_LLM",
            agent_response="Sentinel MCP adds less than 5ms latency.",
            email="user2@example.com"
        )
        link_session_to_lead(session_id=session_b, lead_id=lead["id"], email="user2@example.com")

        # Fetch all
        all_turns = get_all_conversations()
        self.assertGreaterEqual(len(all_turns), 2)

        # Filter by session_id
        sess_a_turns = get_all_conversations(session_id=session_a)
        self.assertEqual(len(sess_a_turns), 1)
        self.assertEqual(sess_a_turns[0]["session_id"], session_a)

        # Filter by lead_id
        lead_turns = get_all_conversations(lead_id=lead["id"])
        self.assertEqual(len(lead_turns), 1)
        self.assertEqual(lead_turns[0]["session_id"], session_b)

        # Search query filter
        yolo_turns = get_all_conversations(search_query="SignLanguageKeywordUnique")
        self.assertEqual(len(yolo_turns), 1)
        self.assertEqual(yolo_turns[0]["session_id"], session_a)

    def test_02_database_stats_and_purge(self):
        stats = get_memory_vault_stats()
        self.assertIn("total_conversations", stats)
        self.assertIn("total_sessions", stats)
        self.assertIn("converted_leads", stats)
        self.assertEqual(stats["retention_days"], 60)
        self.assertGreaterEqual(stats["total_conversations"], 2)

        # Insert an old turn (70 days ago) directly into db to test purge
        conn = get_db_connection()
        cursor = conn.cursor()
        old_time = (datetime.now(timezone.utc) - timedelta(days=75)).isoformat()
        cursor.execute(
            """
            INSERT INTO conversations (session_id, lead_id, email, visitor_message, agent_stage, agent_response, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            ("sess-old-99", None, "old@example.com", "Old message", "STAGE_1", "Old response", old_time)
        )
        conn.commit()
        conn.close()

        deleted = purge_old_conversations(days=60)
        self.assertGreaterEqual(deleted, 1)

    def test_03_api_memory_vault_endpoints(self):
        # 1. GET /api/admin/memory-vault/stats
        stats_res = self.client.get("/api/admin/memory-vault/stats")
        self.assertEqual(stats_res.status_code, 200)
        stats_data = stats_res.json()
        self.assertEqual(stats_data["status"], "success")
        self.assertIn("stats", stats_data)
        self.assertIn("total_conversations", stats_data["stats"])

        # 2. GET /api/admin/memory-vault/conversations
        convs_res = self.client.get("/api/admin/memory-vault/conversations?q=Sentinel")
        self.assertEqual(convs_res.status_code, 200)
        convs_data = convs_res.json()
        self.assertEqual(convs_data["status"], "success")
        self.assertIsInstance(convs_data["conversations"], list)

        # 3. GET /api/admin/memory-vault/export
        export_res = self.client.get("/api/admin/memory-vault/export?session_id=sess-vault-01-a")
        self.assertEqual(export_res.status_code, 200)
        export_data = export_res.json()
        self.assertIn("exported_at", export_data)
        self.assertIn("conversations", export_data)

        # 4. POST /api/admin/memory-vault/purge
        purge_res = self.client.post("/api/admin/memory-vault/purge", json={"retention_days": 60})
        self.assertEqual(purge_res.status_code, 200)
        purge_data = purge_res.json()
        self.assertEqual(purge_data["status"], "success")
        self.assertIn("deleted_count", purge_data)

if __name__ == "__main__":
    unittest.main()
