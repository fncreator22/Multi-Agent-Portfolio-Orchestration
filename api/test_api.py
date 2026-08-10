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
from database import init_db

class TestBrokerAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(temp_db_path):
            os.remove(temp_db_path)

    def test_01_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        expected = {
            "status": "healthy",
            "service": "broker-api",
            "stage": "PHASE 3 BROKER API READY"
        }
        self.assertEqual(response.json(), expected)

    def test_02_contact_submission_valid(self):
        payload = {
            "email": "test@example.com",
            "name": "Jane Doe",
            "message": "Interested in hiring for a project.",
            "project_slug": "portfolio-v2"
        }
        response = self.client.post("/api/contact", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("lead", data)
        self.assertEqual(data["lead"]["email"], "test@example.com")
        self.assertEqual(data["lead"]["name"], "Jane Doe")
        self.assertEqual(data["lead"]["project_slug"], "portfolio-v2")

    def test_03_contact_sanitization_and_validation(self):
        # Test HTML stripping
        payload = {
            "email": "HACKER@example.com ",
            "name": "<b>Evil Script</b>",
            "message": "<script>alert('xss')</script>Hello there!",
            "project_slug": "<i>slug-1</i>"
        }
        response = self.client.post("/api/contact", json=payload)
        self.assertEqual(response.status_code, 200)
        lead = response.json()["lead"]
        self.assertEqual(lead["email"], "hacker@example.com")
        self.assertEqual(lead["name"], "Evil Script")
        self.assertEqual(lead["message"], "alert('xss')Hello there!")
        self.assertEqual(lead["project_slug"], "slug-1")

        # Test invalid email format
        invalid_payload = {
            "email": "invalid-email-string",
            "name": "John",
            "message": "Hello"
        }
        resp_invalid = self.client.post("/api/contact", json=invalid_payload)
        self.assertEqual(resp_invalid.status_code, 400)
        self.assertEqual(resp_invalid.json()["detail"], "Invalid email address format.")

    def test_04_booking_slots(self):
        response = self.client.get("/api/booking/slots")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["timezone"], "UTC")
        self.assertIsInstance(data["slots"], list)
        self.assertGreater(len(data["slots"]), 0)

    def test_05_create_booking(self):
        payload = {
            "email": "client@example.com",
            "slot_time": "2026-08-11T10:00:00Z"
        }
        response = self.client.post("/api/booking", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("booking", data)
        self.assertEqual(data["booking"]["email"], "client@example.com")
        self.assertTrue(data["booking"]["meeting_link"].startswith("https://meet.jit.si/portfolio-booking-"))

        # Test invalid email booking
        invalid_payload = {
            "email": "not-an-email",
            "slot_time": "2026-08-11T10:00:00Z"
        }
        resp_invalid = self.client.post("/api/booking", json=invalid_payload)
        self.assertEqual(resp_invalid.status_code, 400)

    def test_06_get_leads(self):
        response = self.client.get("/api/leads")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertIsInstance(data["leads"], list)
        self.assertGreaterEqual(len(data["leads"]), 2)

    def test_07_admin_otp_flow(self):
        # Request OTP
        req_res = self.client.post("/api/admin/auth/request-otp", json={"email": "admin@example.com"})
        self.assertEqual(req_res.status_code, 200)
        req_data = req_res.json()
        self.assertEqual(req_data["status"], "success")
        self.assertIn("otp_code", req_data)
        otp_code = req_data["otp_code"]

        # Verify invalid OTP
        invalid_res = self.client.post("/api/admin/auth/verify-otp", json={"email": "admin@example.com", "otp_code": "000000"})
        self.assertEqual(invalid_res.status_code, 400)

        # Verify valid OTP
        verify_res = self.client.post("/api/admin/auth/verify-otp", json={"email": "admin@example.com", "otp_code": otp_code})
        self.assertEqual(verify_res.status_code, 200)
        verify_data = verify_res.json()
        self.assertEqual(verify_data["status"], "success")
        self.assertIn("admin_token", verify_data)

    def test_08_admin_kb_endpoints(self):
        # GET KB
        kb_res = self.client.get("/api/admin/kb")
        self.assertEqual(kb_res.status_code, 200)
        kb_data = kb_res.json()
        self.assertEqual(kb_data["status"], "success")
        self.assertIsInstance(kb_data["projects"], list)
        self.assertGreater(len(kb_data["projects"]), 0)

        # Update KB
        updated_project = {
            "id": "lato-validation",
            "slug": "lato-validation",
            "name": "LATO Validation Framework Updated",
            "category": "AI / Agentic Infrastructure",
            "description": "Updated description for testing",
            "tech": ["TypeScript", "Python"],
            "githubUrl": "https://github.com/test/lato",
            "liveUrl": "https://lato.test",
            "caseStudy": {
                "overview": "Updated overview",
                "problem": "Updated problem",
                "solution": "Updated solution",
                "architecture": ["Arch 1"],
                "metrics": ["Metric 1"]
            }
        }
        update_res = self.client.post("/api/admin/kb/update", json=updated_project)
        self.assertEqual(update_res.status_code, 200)
        update_data = update_res.json()
        self.assertEqual(update_data["status"], "success")

        # Verify persistence
        kb_res2 = self.client.get("/api/admin/kb")
        kb_data2 = kb_res2.json()
        found = False
        for p in kb_data2["projects"]:
            if p["id"] == "lato-validation":
                self.assertEqual(p["name"], "LATO Validation Framework Updated")
                found = True
        self.assertTrue(found)

    def test_09_rate_limiter(self):
        # We perform requests from client IP until limit exceeded.
        status_codes = []
        for _ in range(60):
            r = self.client.get("/health")
            status_codes.append(r.status_code)
        
        self.assertIn(429, status_codes)

if __name__ == "__main__":
    unittest.main()

