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
    create_lead,
    log_conversation_turn,
    link_session_to_lead,
    get_conversations_by_session,
    get_conversations_by_lead,
    reset_otp_rate_limit
)

class TestConversationsSystem(unittest.TestCase):
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

    def test_01_database_log_and_query_conversations(self):
        session_id = "sess-db-test-01"
        turn1 = log_conversation_turn(
            session_id=session_id,
            visitor_message="What tech stack is used in sentinel-mcp?",
            agent_stage="STAGE_1_RETRIEVAL",
            agent_response="Sentinel MCP uses TypeScript, Node.js, and Docker.",
        )
        self.assertIsNotNone(turn1["id"])
        self.assertEqual(turn1["session_id"], session_id)
        self.assertEqual(turn1["agent_stage"], "STAGE_1_RETRIEVAL")

        turn2 = log_conversation_turn(
            session_id=session_id,
            visitor_message="Is it scalable?",
            agent_stage="STAGE_2_GATE",
            agent_response="Yes, sentinel-mcp is designed for high concurrency.",
        )
        self.assertIsNotNone(turn2["id"])

        turns = get_conversations_by_session(session_id)
        self.assertEqual(len(turns), 2)
        self.assertEqual(turns[0]["visitor_message"], "What tech stack is used in sentinel-mcp?")
        self.assertEqual(turns[1]["visitor_message"], "Is it scalable?")

    def test_02_link_session_to_lead(self):
        email = "lead_link_test@example.com"
        session_id = "sess-db-test-02"

        # 1. Log turn before lead is created
        log_conversation_turn(
            session_id=session_id,
            visitor_message="I'd like to hire you for a project.",
            agent_stage="STAGE_3_LLM",
            agent_response="Great! Please leave your contact info.",
        )

        # 2. Create lead
        lead = create_lead(
            email=email,
            name="Alice Smith",
            message="Looking for AI consulting.",
            project_slug="lato-validation"
        )
        lead_id = lead["id"]

        # 3. Link session to lead
        link_session_to_lead(session_id=session_id, lead_id=lead_id, email=email)

        # 4. Verify turns are now linked by session and lead
        turns_by_sess = get_conversations_by_session(session_id)
        self.assertEqual(len(turns_by_sess), 1)
        self.assertEqual(turns_by_sess[0]["lead_id"], lead_id)
        self.assertEqual(turns_by_sess[0]["email"], email.lower())

        turns_by_lead = get_conversations_by_lead(lead_id)
        self.assertEqual(len(turns_by_lead), 1)
        self.assertEqual(turns_by_lead[0]["session_id"], session_id)

    def test_03_api_log_conversation_endpoint(self):
        payload = {
            "session_id": "sess-api-test-03",
            "visitor_message": "Tell me about LATO validation framework",
            "agent_stage": "STAGE_2_GATE",
            "agent_response": "LATO is a framework evaluating LLM agent latency and accuracy.",
            "email": None
        }
        res = self.client.post("/api/conversations/log", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["turn"]["session_id"], "sess-api-test-03")
        self.assertEqual(data["turn"]["agent_stage"], "STAGE_2_GATE")

    def test_04_api_verify_lead_otp_links_conversations(self):
        email = "otp_conversation_link@example.com"
        session_id = "sess-api-test-04"

        # 1. Log a turn with session_id
        self.client.post("/api/conversations/log", json={
            "session_id": session_id,
            "visitor_message": "Interested in custom YOLOv8 detection",
            "agent_stage": "STAGE_1_RETRIEVAL",
            "agent_response": "YOLOv8 gesture recognition model runs at 60 FPS.",
        })

        # 2. Request OTP
        req_res = self.client.post("/api/public/request-lead-otp", json={"email": email})
        self.assertEqual(req_res.status_code, 200)
        otp_code = req_res.json()["otp_code"]

        # 3. Verify OTP including session_id
        ver_res = self.client.post("/api/public/verify-lead-otp", json={
            "email": email,
            "otp_code": otp_code,
            "session_id": session_id
        })
        self.assertEqual(ver_res.status_code, 200)
        self.assertIn("lead_id", ver_res.json())
        lead_id = ver_res.json()["lead_id"]
        self.assertIsNotNone(lead_id)

        # 4. GET /api/leads and check conversation attachment
        leads_res = self.client.get("/api/leads")
        self.assertEqual(leads_res.status_code, 200)
        leads = leads_res.json()["leads"]
        matched_lead = next((l for l in leads if l["id"] == lead_id), None)
        self.assertIsNotNone(matched_lead)
        self.assertIn("conversations", matched_lead)
        self.assertTrue(len(matched_lead["conversations"]) >= 1)
        self.assertEqual(matched_lead["conversations"][0]["session_id"], session_id)

    def test_05_api_list_leads_includes_conversations(self):
        res = self.client.get("/api/leads")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("leads", data)
        for lead in data["leads"]:
            self.assertIn("conversations", lead)
            self.assertIsInstance(lead["conversations"], list)

if __name__ == "__main__":
    unittest.main()
