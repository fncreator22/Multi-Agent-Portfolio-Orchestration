import unittest
import json
import os
from fastapi.testclient import TestClient
from main import app
from classifier import ConfidenceGateClassifier, DEFAULT_SEED_PATH


class TestStage2ConfidenceGate(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.classifier = ConfidenceGateClassifier()

    def test_01_seed_dataset_validity(self):
        """Verify seed_queries.json contains 30+ labeled samples."""
        self.assertTrue(os.path.exists(DEFAULT_SEED_PATH), "seed_queries.json does not exist")
        with open(DEFAULT_SEED_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertGreaterEqual(len(data), 30, f"Dataset contains {len(data)} items, expected >= 30")
        
        labels = [item.get("label") for item in data]
        self.assertIn(0, labels, "Dataset must contain label 0 (retrieval_only)")
        self.assertIn(1, labels, "Dataset must contain label 1 (escalate_llm)")

    def test_02_classifier_training_and_predictions(self):
        """Verify ConfidenceGateClassifier predictions for known retrieval and escalation intents."""
        # Retrieval-only query test
        res_retrieval = self.classifier.predict("What tech stack was used for sentinel-mcp?", retrieval_score=0.8)
        self.assertEqual(res_retrieval["decision"], "RETRIEVAL_ONLY")
        self.assertIn("confidence", res_retrieval)
        self.assertIn("reason", res_retrieval)

        # Escalate LLM query test
        res_escalate = self.classifier.predict("Can you write a custom code snippet for YOLOv8?", retrieval_score=0.9)
        self.assertEqual(res_escalate["decision"], "ESCALATE_LLM")
        self.assertIn("confidence", res_escalate)

        # Retrieval query with low retrieval score should escalate
        res_low_score = self.classifier.predict("Show me the computer vision projects", retrieval_score=0.1)
        self.assertEqual(res_low_score["decision"], "ESCALATE_LLM")

    def test_03_health_endpoint(self):
        """Verify /health payload contains active stage."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn(data["stage"], ["STAGE 2 CONFIDENCE GATE READY", "STAGE 3 LLM ESCALATION & GROUNDING READY"])

    def test_04_query_api_get(self):
        """Verify /api/query GET endpoint execution and schema."""
        response = self.client.get("/api/query?q=What tech stack was used for sentinel-mcp?")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["query"], "What tech stack was used for sentinel-mcp?")
        self.assertIn("retrieved_docs", data)
        self.assertIn("gate_decision", data)
        self.assertIn(data["gate_decision"], ["RETRIEVAL_ONLY", "ESCALATE_LLM"])
        self.assertIn("confidence_score", data)
        self.assertIn(data["active_stage"], ["STAGE 2 CONFIDENCE GATE READY", "STAGE 3 LLM ESCALATION & GROUNDING READY"])

    def test_05_query_api_post(self):
        """Verify /api/query POST endpoint for escalation scenario."""
        payload = {"query": "Tell me a joke about computer vision", "top_k": 3}
        response = self.client.post("/api/query", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["query"], payload["query"])
        self.assertEqual(data["gate_decision"], "ESCALATE_LLM")
        self.assertGreater(data["confidence_score"], 0.0)
        self.assertIn(data["active_stage"], ["STAGE 2 CONFIDENCE GATE READY", "STAGE 3 LLM ESCALATION & GROUNDING READY"])


if __name__ == "__main__":
    unittest.main()
