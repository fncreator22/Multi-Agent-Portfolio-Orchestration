import unittest
import os
import json
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app
from llm_stage import LLMEscalationStage, verify_grounding, extract_key_terms


class TestStage3LLMEscalation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.stage = LLMEscalationStage(timeout=0.5)

    def test_01_llm_stage_initialization(self):
        """Verify LLMEscalationStage initialization and configuration."""
        stage = LLMEscalationStage(model_name="llama3.2:3b", base_url="http://localhost:11434", timeout=2.0)
        self.assertEqual(stage.model_name, "llama3.2:3b")
        self.assertEqual(stage.base_url, "http://localhost:11434")
        self.assertEqual(stage.timeout, 2.0)
        self.assertTrue(os.path.exists(stage.log_dir), "Logs directory should exist")

    def test_02_grounding_check_verification(self):
        """Verify verify_grounding function with grounded vs ungrounded text."""
        sample_context = [
            {
                "name": "sentinel-mcp",
                "tech": "Python, FastMCP, OpenCV, YOLOv8",
                "description": "Real-time automated computer vision surveillance agent.",
                "solution": "Deploys YOLOv8 detection models with MCP protocol integration."
            }
        ]

        # Well-grounded response
        grounded_text = "sentinel-mcp is a real-time computer vision surveillance agent built with Python, FastMCP, OpenCV, and YOLOv8."
        is_grounded, score = verify_grounding(grounded_text, sample_context)
        self.assertTrue(is_grounded, f"Response should be verified as grounded (score: {score})")
        self.assertGreaterEqual(score, 0.25)

        # Ungrounded / hallucinated response
        ungrounded_text = "The quick brown fox jumps over the lazy dog in a sunny tropical meadow with baking recipes."
        is_grounded_bad, bad_score = verify_grounding(ungrounded_text, sample_context)
        self.assertFalse(is_grounded_bad, f"Ungrounded response should fail verification (score: {bad_score})")
        self.assertLess(bad_score, 0.25)

    def test_03_fallback_offline_llm(self):
        """Verify fallback behavior when local LLM server is unreachable or times out."""
        offline_stage = LLMEscalationStage(base_url="http://127.0.0.1:59999", timeout=0.1)
        sample_context = [{"name": "sentinel-mcp", "tech": "Python, FastMCP", "description": "Surveillance system"}]
        
        result = offline_stage.escalate_and_generate("Explain sentinel-mcp", sample_context)
        
        self.assertIn("llm_response", result)
        self.assertIn("[FALLBACK: LOCAL_LLM_UNAVAILABLE]", result["llm_response"])
        self.assertFalse(result["grounding_verified"])
        self.assertEqual(result["grounding_score"], 0.0)
        self.assertEqual(result["status"], "LLM_OFFLINE_FALLBACK")
        self.assertTrue(os.path.exists(offline_stage.log_file), "Log file should be created")

    @patch("requests.post")
    def test_04_fallback_ungrounded_response(self, mock_post):
        """Verify fallback behavior when LLM returns an ungrounded response."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "response": "Astronomy and quantum astrophysics explain black hole singularities in deep space."
        }
        mock_post.return_value = mock_response

        sample_context = [{"name": "sentinel-mcp", "tech": "Python, FastMCP", "description": "Surveillance system"}]
        stage = LLMEscalationStage()
        result = stage.escalate_and_generate("What is sentinel-mcp?", sample_context)

        self.assertIn("[FALLBACK: UNGROUNDED_LLM_RESPONSE]", result["llm_response"])
        self.assertFalse(result["grounding_verified"])
        self.assertEqual(result["status"], "UNGROUNDED_FALLBACK")

    def test_05_health_endpoint(self):
        """Verify /health endpoint returns STAGE 3 LLM ESCALATION & GROUNDING READY and slm status."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["stage"], "STAGE 3 LLM ESCALATION & GROUNDING READY")
        self.assertIn("slm", data)
        self.assertIn("status", data["slm"])

    @patch("main.classifier.predict")
    def test_06_api_query_end_to_end_retrieval_only(self, mock_predict):
        """Verify /api/query endpoint when decision is RETRIEVAL_ONLY."""
        mock_predict.return_value = {
            "decision": "RETRIEVAL_ONLY",
            "confidence": 0.95,
            "reason": "High vector similarity match found in portfolio documents."
        }
        response = self.client.get("/api/query?q=What tech stack was used for sentinel-mcp?")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["query"], "What tech stack was used for sentinel-mcp?")
        self.assertIn("retrieved_docs", data)
        self.assertEqual(data["gate_decision"], "RETRIEVAL_ONLY")
        self.assertEqual(data["active_stage"], "STAGE 3 LLM ESCALATION & GROUNDING READY")
        self.assertIsNone(data.get("llm_response"))
        self.assertIsNone(data.get("grounding_verified"))

    @patch("main.classifier.predict")
    def test_07_api_query_end_to_end_escalation(self, mock_predict):
        """Verify /api/query endpoint when decision is ESCALATE_LLM."""
        mock_predict.return_value = {
            "decision": "ESCALATE_LLM",
            "confidence": 0.85,
            "reason": "Escalating query to LLM generation."
        }
        payload = {"query": "Write a custom python code snippet for YOLOv8 model inference", "top_k": 3}
        response = self.client.post("/api/query", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["query"], payload["query"])
        self.assertEqual(data["gate_decision"], "ESCALATE_LLM")
        self.assertIsNotNone(data.get("llm_response"))
        self.assertIsInstance(data.get("grounding_verified"), bool)
        self.assertEqual(data["active_stage"], "STAGE 3 LLM ESCALATION & GROUNDING READY")

    @patch("requests.get")
    def test_08_check_slm_health_online(self, mock_get):
        """Verify check_slm_health method returns online dictionary when Ollama is reachable."""
        mock_res = MagicMock()
        mock_res.status_code = 200
        mock_res.json.return_value = {"models": [{"name": "llama3.2:3b"}]}
        mock_get.return_value = mock_res

        stage = LLMEscalationStage(model_name="llama3.2:3b", base_url="http://localhost:11434")
        health_info = stage.check_slm_health(timeout=1.0)

        self.assertEqual(health_info["status"], "online")
        self.assertEqual(health_info["base_url"], "http://localhost:11434")
        self.assertEqual(health_info["model"], "llama3.2:3b")
        self.assertIsInstance(health_info["latency_ms"], float)
        self.assertIn("details", health_info)

    def test_09_check_slm_health_offline(self):
        """Verify check_slm_health method returns offline dictionary when host is unreachable."""
        stage = LLMEscalationStage(model_name="llama3.2:3b", base_url="http://127.0.0.1:59999")
        health_info = stage.check_slm_health(timeout=0.1)

        self.assertEqual(health_info["status"], "offline")
        self.assertEqual(health_info["base_url"], "http://127.0.0.1:59999")
        self.assertEqual(health_info["model"], "llama3.2:3b")
        self.assertIsInstance(health_info["latency_ms"], float)
        self.assertIn("details", health_info)

    def test_10_api_slm_health_endpoint(self):
        """Verify dedicated GET /api/slm/health endpoint."""
        response = self.client.get("/api/slm/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("status", data)
        self.assertIn(data["status"], ["online", "offline"])
        self.assertIn("base_url", data)
        self.assertIn("model", data)
        self.assertIn("latency_ms", data)
        self.assertIn("details", data)

    def test_11_env_url_configuration(self):
        """Verify LLMEscalationStage configures host via OLLAMA_HOST or OLLAMA_BASE_URL env vars."""
        with patch.dict(os.environ, {"OLLAMA_HOST": "192.168.1.50:11434"}, clear=False):
            stage = LLMEscalationStage()
            self.assertEqual(stage.base_url, "http://192.168.1.50:11434")

        with patch.dict(os.environ, {"OLLAMA_HOST": "", "OLLAMA_BASE_URL": "http://ollama-server:11434"}, clear=False):
            stage = LLMEscalationStage()
            self.assertEqual(stage.base_url, "http://ollama-server:11434")


if __name__ == "__main__":
    unittest.main()

