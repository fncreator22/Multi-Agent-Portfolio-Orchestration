import unittest
import os
import json
from fastapi.testclient import TestClient
from main import app, parse_stage3_log, IN_MEMORY_TRACES


class TestPipelineTrace(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_parse_stage3_log(self):
        """Verify parse_stage3_log correctly parses traces from stage3.log."""
        traces = parse_stage3_log()
        self.assertIsInstance(traces, list)
        if traces:
            first = traces[0]
            self.assertIn("query", first)
            self.assertIn("timestamp", first)
            self.assertIn("stage1_hits", first)
            self.assertIn("stage2_decision", first)
            self.assertIn("confidence_score", first)
            self.assertIn("stage3_response", first)
            self.assertIn("grounding_score", first)
            self.assertIn("grounding_verified", first)

    def test_02_pipeline_trace_endpoint_schema(self):
        """Verify GET /api/pipeline/trace payload structure and count."""
        response = self.client.get("/api/pipeline/trace")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data.get("status"), "success")
        self.assertIn("count", data)
        self.assertIsInstance(data["count"], int)
        self.assertIn("traces", data)
        self.assertIsInstance(data["traces"], list)
        self.assertEqual(data["count"], len(data["traces"]))

        if data["traces"]:
            item = data["traces"][0]
            required_keys = [
                "query", "timestamp", "stage1_hits", "stage2_decision",
                "confidence_score", "stage3_response", "grounding_score", "grounding_verified"
            ]
            for key in required_keys:
                self.assertIn(key, item, f"Missing key '{key}' in trace item")

    def test_03_in_memory_trace_addition(self):
        """Verify executing /api/query records a trace in in-memory query history."""
        initial_res = self.client.get("/api/pipeline/trace")
        initial_count = initial_res.json()["count"]

        # Execute a new query
        query_payload = {"query": "Test pipeline trace recording query", "top_k": 3}
        query_res = self.client.post("/api/query", json=query_payload)
        self.assertEqual(query_res.status_code, 200)

        # Check updated traces endpoint
        updated_res = self.client.get("/api/pipeline/trace")
        updated_data = updated_res.json()
        self.assertGreaterEqual(updated_data["count"], initial_count + 1)
        
        # Verify the most recent trace matches our executed query
        recent_trace = updated_data["traces"][0]
        self.assertEqual(recent_trace["query"], query_payload["query"])
        self.assertIn(recent_trace["stage2_decision"], ["RETRIEVAL_ONLY", "ESCALATE_LLM"])
        self.assertIsInstance(recent_trace["confidence_score"], float)
        self.assertIsInstance(recent_trace["grounding_verified"], bool)


if __name__ == "__main__":
    unittest.main()
