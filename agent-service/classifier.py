import os
import json
from typing import Dict, Any, Optional
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_SEED_PATH = os.path.join(BASE_DIR, "data", "seed_queries.json")
DEFAULT_MODEL_PATH = os.path.join(BASE_DIR, "data", "classifier_pipeline.joblib")


class ConfidenceGateClassifier:
    """
    Confidence Gate Classifier (Stage 2) using TF-IDF Vectorizer + Logistic Regression.
    Classifies incoming user queries into RETRIEVAL_ONLY (0) vs ESCALATE_LLM (1).
    Evaluates both ML model classification probability and vector retrieval score.
    """

    def __init__(
        self,
        seed_data_path: str = DEFAULT_SEED_PATH,
        model_path: str = DEFAULT_MODEL_PATH,
        force_retrain: bool = False
    ):
        self.seed_data_path = seed_data_path
        self.model_path = model_path
        self.pipeline: Optional[Pipeline] = None

        if not force_retrain and os.path.exists(self.model_path):
            self.load_model()
        else:
            self.train()

    def train(self) -> None:
        """Train TF-IDF + LogisticRegression pipeline on seed queries and save model artifact."""
        if not os.path.exists(self.seed_data_path):
            raise FileNotFoundError(f"Seed data file not found at: {self.seed_data_path}")

        with open(self.seed_data_path, "r", encoding="utf-8") as f:
            seed_data = json.load(f)

        queries = [item["query"] for item in seed_data]
        labels = [item["label"] for item in seed_data]

        self.pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), lowercase=True)),
            ("clf", LogisticRegression(C=1.0, random_state=42))
        ])

        self.pipeline.fit(queries, labels)

        # Save model pipeline
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(self.pipeline, self.model_path)

    def load_model(self) -> None:
        """Load pre-trained model pipeline from joblib artifact."""
        self.pipeline = joblib.load(self.model_path)

    def predict(self, query: str, retrieval_score: float = 0.0, low_retrieval_threshold: float = 0.35) -> Dict[str, Any]:
        """
        Classifies query and determines whether retrieval is sufficient or LLM escalation is required.

        Args:
            query: The visitor query string.
            retrieval_score: Similarity score from vector retrieval (0.0 to 1.0 scale).
            low_retrieval_threshold: Similarity score threshold below which query is escalated to LLM.

        Returns:
            Dict containing 'decision', 'confidence', and 'reason'.
        """
        if self.pipeline is None:
            self.train()

        probabilities = self.pipeline.predict_proba([query])[0]
        classes = list(self.pipeline.classes_)

        # Class 0: RETRIEVAL_ONLY, Class 1: ESCALATE_LLM
        idx_retrieval = classes.index(0) if 0 in classes else 0
        idx_escalate = classes.index(1) if 1 in classes else 1

        p_retrieval = float(probabilities[idx_retrieval])
        p_escalate = float(probabilities[idx_escalate])

        if p_escalate >= 0.5:
            decision = "ESCALATE_LLM"
            confidence = round(p_escalate, 4)
            reason = f"Query intent classified as complex reasoning/generation (ML score: {confidence})"
        else:
            # Query is retrieval intent; verify if vector retrieval score is sufficient
            if retrieval_score < low_retrieval_threshold:
                decision = "ESCALATE_LLM"
                confidence = round(p_retrieval, 4)
                reason = f"Query classified as retrieval-only, but vector retrieval score ({round(retrieval_score, 4)}) is below threshold ({low_retrieval_threshold}); escalating to LLM"
            else:
                decision = "RETRIEVAL_ONLY"
                combined_confidence = (p_retrieval * 0.5) + (min(1.0, max(0.0, retrieval_score)) * 0.5)
                confidence = round(combined_confidence, 4)
                reason = f"Query classified as retrieval-only with strong vector retrieval score ({round(retrieval_score, 4)})"

        return {
            "decision": decision,
            "confidence": confidence,
            "reason": reason
        }


if __name__ == "__main__":
    classifier = ConfidenceGateClassifier()
    test_queries = [
        ("What tech stack was used for sentinel-mcp?", 0.8),
        ("Can you write a custom code snippet for YOLOv8?", 0.9),
        ("Show me the computer vision projects", 0.75),
        ("How would you solve an edge case in distributed RAG?", 0.85)
    ]
    for q, score in test_queries:
        res = classifier.predict(q, score)
        print(f"Query: '{q}' | Score: {score} -> {res}")
