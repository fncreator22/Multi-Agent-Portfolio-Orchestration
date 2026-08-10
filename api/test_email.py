import os
import sys
import tempfile
import unittest
from unittest.mock import patch, MagicMock

# Ensure api directory is on sys.path for imports
API_DIR = os.path.dirname(os.path.abspath(__file__))
if API_DIR not in sys.path:
    sys.path.insert(0, API_DIR)

# Use temporary DB for tests before importing main
temp_db_fd, temp_db_path = tempfile.mkstemp(suffix=".db")
os.close(temp_db_fd)
os.environ["DB_PATH"] = temp_db_path

from fastapi.testclient import TestClient
import email_service
from main import app
from database import init_db


class TestEmailService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)
        cls.log_file = email_service._get_log_filepath()

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(temp_db_path):
            os.remove(temp_db_path)

    def setUp(self):
        # Reset environment variable defaults for each test
        os.environ["ENABLE_SMTP"] = "false"
        os.environ["SMTP_HOST"] = "smtp.example.com"
        os.environ["SMTP_PORT"] = "587"
        os.environ["SMTP_USER"] = "test@example.com"
        os.environ["SMTP_PASS"] = "password"
        os.environ["NOTIFICATION_EMAIL"] = "owner@portfolio.internal"
        os.environ["FROM_EMAIL"] = "noreply@portfolio.internal"

        # Clear rate limit middleware memory to prevent test order interference
        current = getattr(app, "middleware_stack", None)
        while current is not None:
            if hasattr(current, "requests") and isinstance(current.requests, dict):
                current.requests.clear()
            current = getattr(current, "app", None)

    def test_01_send_otp_email_fallback(self):
        res = email_service.send_otp_email("admin@example.com", "123456")
        self.assertEqual(res, {"sent": False, "fallback": True})

        # Verify log file exists and contains fallback entry
        self.assertTrue(os.path.exists(self.log_file))
        with open(self.log_file, "r", encoding="utf-8") as f:
            log_content = f.read()
        self.assertIn("[FALLBACK] ENABLE_SMTP is false", log_content)
        self.assertIn("admin@example.com", log_content)

    def test_02_send_lead_notification_sanitization_and_fallback(self):
        lead_data = {
            "name": "<script>alert('xss')</script>John Doe",
            "email": "lead@example.com",
            "message": "<b>Hello</b> & welcome!",
            "project_slug": "<i>slug-1</i>",
            "created_at": "2026-08-10T12:00:00Z"
        }
        
        # Test helper function _send_email sanitization & call
        with patch.object(email_service, "_send_email", wraps=email_service._send_email) as mock_send:
            res = email_service.send_lead_notification(lead_data)
            self.assertEqual(res, {"sent": False, "fallback": True})
            
            # Inspect HTML body passed to _send_email
            mock_send.assert_called_once()
            _, kwargs = mock_send.call_args
            html_body = mock_send.call_args[0][2]
            
            # Escaped HTML verification
            self.assertIn("&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;John Doe", html_body)
            self.assertIn("&lt;b&gt;Hello&lt;/b&gt; &amp; welcome!", html_body)
            self.assertNotIn("<script>", html_body)

    def test_03_send_booking_notification_fallback(self):
        booking_data = {
            "email": "client@example.com",
            "slot_time": "2026-08-11T10:00:00Z",
            "meeting_link": "https://meet.jit.si/portfolio-booking-1234"
        }
        res = email_service.send_booking_notification(booking_data)
        self.assertEqual(res, {"sent": False, "fallback": True})

    @patch("smtplib.SMTP")
    def test_04_send_email_smtp_success(self, mock_smtp_cls):
        os.environ["ENABLE_SMTP"] = "true"
        
        mock_server = MagicMock()
        mock_smtp_cls.return_value.__enter__.return_value = mock_server

        res = email_service.send_otp_email("test@example.com", "654321")
        self.assertEqual(res, {"sent": True, "fallback": False})
        
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once_with("test@example.com", "password")
        mock_server.sendmail.assert_called_once()

    @patch("smtplib.SMTP")
    def test_05_send_email_smtp_exception_fallback(self, mock_smtp_cls):
        os.environ["ENABLE_SMTP"] = "true"
        mock_smtp_cls.side_effect = Exception("SMTP Connection Refused")

        res = email_service.send_otp_email("test@example.com", "654321")
        self.assertEqual(res, {"sent": False, "fallback": True})

        with open(self.log_file, "r", encoding="utf-8") as f:
            log_content = f.read()
        self.assertIn("[ERROR] SMTP failure", log_content)

    def test_06_fastapi_endpoints_trigger_email_service(self):
        with patch.object(email_service, "send_otp_email", return_value={"sent": False, "fallback": True}) as mock_otp, \
             patch.object(email_service, "send_lead_notification", return_value={"sent": False, "fallback": True}) as mock_lead, \
             patch.object(email_service, "send_booking_notification", return_value={"sent": False, "fallback": True}) as mock_booking:

            # 1. POST /api/admin/auth/request-otp
            resp_otp = self.client.post("/api/admin/auth/request-otp", json={"email": "admin@example.com"})
            self.assertEqual(resp_otp.status_code, 200)
            mock_otp.assert_called_once()

            # 2. POST /api/contact
            resp_contact = self.client.post("/api/contact", json={
                "email": "lead@example.com",
                "name": "Jane Lead",
                "message": "Hello"
            })
            self.assertEqual(resp_contact.status_code, 200)
            mock_lead.assert_called_once()

            # 3. POST /api/booking
            resp_booking = self.client.post("/api/booking", json={
                "email": "client@example.com",
                "slot_time": "2026-08-11T10:00:00Z"
            })
            self.assertEqual(resp_booking.status_code, 200)
            mock_booking.assert_called_once()


if __name__ == "__main__":
    unittest.main()
