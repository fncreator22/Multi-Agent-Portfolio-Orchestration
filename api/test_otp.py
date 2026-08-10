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

from fastapi.testclient import TestClient
from main import app
from database import init_db, save_otp, verify_otp, verify_lead_otp, is_lead_verified, reset_otp_rate_limit, check_otp_rate_limit

class TestOTPSystem(unittest.TestCase):
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

    def test_01_otp_10_min_expiration(self):
        email = "expire_test@example.com"
        code_valid = "123456"
        code_expired = "654321"

        # Save active token with 10 min (600s) expiration
        expires_in_10 = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
        save_otp(email, code_valid, expires_in_10)

        # Verification should succeed
        self.assertTrue(verify_otp(email, code_valid))

        # Save expired token (expired 1 second ago)
        expires_past = (datetime.now(timezone.utc) - timedelta(seconds=1)).isoformat()
        save_otp(email, code_expired, expires_past)

        # Verification should fail due to expiration
        self.assertFalse(verify_otp(email, code_expired))

    def test_02_otp_single_use_token_deletion(self):
        email = "single_use@example.com"
        code = "999888"

        save_otp(email, code)

        # First verification succeeds
        self.assertTrue(verify_otp(email, code))

        # Second verification with exact same code fails because token was deleted from DB
        self.assertFalse(verify_otp(email, code))

    def test_03_otp_rate_limiting(self):
        email = "ratelimit@example.com"
        ip = "192.168.1.100"

        # First 5 requests should pass check_otp_rate_limit
        for i in range(5):
            is_limited = check_otp_rate_limit(email, ip)
            self.assertFalse(is_limited, f"Request {i+1} should not be rate limited.")

        # 6th request must be rate limited
        self.assertTrue(check_otp_rate_limit(email, ip))

        # Also test via endpoint /api/public/request-lead-otp
        reset_otp_rate_limit()
        for i in range(5):
            res = self.client.post("/api/public/request-lead-otp", json={"email": "endpoint_rl@example.com"})
            self.assertEqual(res.status_code, 200, f"Endpoint request {i+1} failed")

        res_limited = self.client.post("/api/public/request-lead-otp", json={"email": "endpoint_rl@example.com"})
        self.assertEqual(res_limited.status_code, 429)
        self.assertIn("Rate limit exceeded", res_limited.json()["detail"])

    def test_04_public_lead_otp_and_booking_protection(self):
        lead_email = "lead_booking@example.com"
        slot = "2026-08-15T10:00:00Z"

        # 1. Attempt booking without verification -> 403 Forbidden
        unverified_res = self.client.post("/api/booking", json={"email": lead_email, "slot_time": slot})
        self.assertEqual(unverified_res.status_code, 403)
        self.assertEqual(unverified_res.json()["detail"], "Lead email must be OTP-verified before booking consultation.")

        # 2. Request lead OTP
        req_res = self.client.post("/api/public/request-lead-otp", json={"email": lead_email})
        self.assertEqual(req_res.status_code, 200)
        otp_code = req_res.json()["otp_code"]

        # 3. Verify lead OTP with invalid code -> 400 Bad Request
        bad_ver = self.client.post("/api/public/verify-lead-otp", json={"email": lead_email, "otp_code": "000000"})
        self.assertEqual(bad_ver.status_code, 400)

        # 4. Verify lead OTP with valid code -> 200 OK
        good_ver = self.client.post("/api/public/verify-lead-otp", json={"email": lead_email, "otp_code": otp_code})
        self.assertEqual(good_ver.status_code, 200)
        self.assertEqual(good_ver.json()["status"], "success")
        self.assertTrue(is_lead_verified(lead_email))

        # 5. Now attempt booking again -> 200 OK
        booking_res = self.client.post("/api/booking", json={"email": lead_email, "slot_time": slot})
        self.assertEqual(booking_res.status_code, 200)
        booking_data = booking_res.json()
        self.assertEqual(booking_data["status"], "success")
        self.assertEqual(booking_data["booking"]["email"], lead_email)

if __name__ == "__main__":
    unittest.main()
