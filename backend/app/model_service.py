"""SecureAct AI Model Service.
Manages model loading, SHA-256 verification, validation, and real-time inference.
"""
import hashlib
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import joblib

from .config import (
    MODEL_PATH,
    METADATA_PATH,
    TEST_METRICS_PATH,
    TRAINING_SUMMARY_PATH,
    EXPECTED_MODEL_SHA256,
    DEFAULT_THRESHOLD,
    MODEL_NAME,
    CANDIDATE_NAME,
)

logger = logging.getLogger("secureact.model_service")


class ModelSecurityError(Exception):
    """Raised when model integrity or verification fails."""
    pass


class ModelService:
    _instance: Optional["ModelService"] = None

    def __init__(self):
        self.pipeline = None
        self.metadata: Dict[str, Any] = {}
        self.test_metrics: Dict[str, Any] = {}
        self.training_summary: Dict[str, Any] = {}
        self.model_sha256: str = ""
        self.sha256_verified: bool = False
        self.threshold: float = DEFAULT_THRESHOLD
        self.is_loaded: bool = False
        self._load_model()

    @classmethod
    def get_instance(cls) -> "ModelService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _verify_sha256(self, file_path: Path) -> str:
        if not file_path.exists():
            raise FileNotFoundError(f"Model file not found at: {file_path}")
        
        hasher = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                hasher.update(chunk)
        digest = hasher.hexdigest().lower()

        if digest != EXPECTED_MODEL_SHA256.lower():
            raise ModelSecurityError(
                f"Model SHA-256 integrity check failed! "
                f"Expected {EXPECTED_MODEL_SHA256}, got {digest}. "
                f"Halting execution to prevent tampering."
            )
        return digest

    def _load_model(self):
        try:
            logger.info(f"Verifying SHA-256 checksum for {MODEL_PATH}...")
            self.model_sha256 = self._verify_sha256(MODEL_PATH)
            self.sha256_verified = True
            logger.info("Model SHA-256 verified successfully.")

            # Load joblib container
            logger.info("Loading model artifact with joblib...")
            raw_data = joblib.load(MODEL_PATH)

            if isinstance(raw_data, dict):
                if "pipeline" not in raw_data:
                    raise ModelSecurityError("Joblib artifact dict missing 'pipeline' key")
                self.pipeline = raw_data["pipeline"]
                self.metadata = raw_data.get("metadata", {})
            else:
                self.pipeline = raw_data
                self.metadata = {}

            # Verify pipeline has decision_function
            if not hasattr(self.pipeline, "decision_function"):
                raise ModelSecurityError("Loaded pipeline lacks required 'decision_function' method.")

            # Load sidecar metadata if available
            if METADATA_PATH.exists():
                try:
                    with open(METADATA_PATH, "r", encoding="utf-8") as f:
                        sidecar_meta = json.load(f)
                        if isinstance(sidecar_meta, dict):
                            self.metadata.update(sidecar_meta)
                except Exception as e:
                    logger.warning(f"Could not load sidecar metadata: {e}")

            # Calibrate threshold from metadata if present
            if "threshold" in self.metadata and isinstance(self.metadata["threshold"], (int, float)):
                self.threshold = float(self.metadata["threshold"])
            else:
                self.threshold = DEFAULT_THRESHOLD

            # Load authentic test metrics
            if TEST_METRICS_PATH.exists():
                try:
                    with open(TEST_METRICS_PATH, "r", encoding="utf-8") as f:
                        self.test_metrics = json.load(f)
                except Exception as e:
                    logger.warning(f"Could not load test metrics: {e}")

            # Load training summary for authentic v1 metrics
            if TRAINING_SUMMARY_PATH.exists():
                try:
                    with open(TRAINING_SUMMARY_PATH, "r", encoding="utf-8") as f:
                        self.training_summary = json.load(f)
                except Exception as e:
                    logger.warning(f"Could not load training summary: {e}")

            self.is_loaded = True
            logger.info(f"Model successfully loaded. Active decision threshold: {self.threshold}")

        except Exception as e:
            self.is_loaded = False
            self.sha256_verified = False
            logger.error(f"Failed to load SecureAct AI model: {e}")
            raise

    def predict(self, text: str) -> Dict[str, Any]:
        """Perform real-time classification using the loaded LinearSVC model."""
        if not self.is_loaded or self.pipeline is None:
            raise RuntimeError("Model is not loaded or initialization failed.")

        # Real-time inference through decision_function
        raw_scores = self.pipeline.decision_function([text])
        score = float(raw_scores[0])
        is_injection = bool(score >= self.threshold)
        classification = "potential_injection" if is_injection else "benign"
        margin = float(score - self.threshold)
        char_count = len(text)
        byte_size = len(text.encode("utf-8"))

        return {
            "score": score,
            "threshold": self.threshold,
            "classification": classification,
            "is_injection": is_injection,
            "margin": margin,
            "char_count": char_count,
            "byte_size": byte_size,
            "model_name": MODEL_NAME,
            "disclaimer": (
                "SecureAct AI v2 is a research security classifier based on LinearSVC TF-IDF. "
                "A positive score indicates potential prompt injection indicators but does not guarantee intent. "
                "The model exhibits a 6.03% false positive rate on local test benchmarks and should be used as part of "
                "a defense-in-depth security strategy rather than a sole security gate."
            )
        }

    def predict_batch(self, texts: List[str]) -> List[Dict[str, Any]]:
        """Perform batch classification."""
        if not self.is_loaded or self.pipeline is None:
            raise RuntimeError("Model is not loaded.")
        raw_scores = self.pipeline.decision_function(texts)
        results = []
        for text, raw_score in zip(texts, raw_scores):
            score = float(raw_score)
            is_injection = bool(score >= self.threshold)
            results.append({
                "score": score,
                "threshold": self.threshold,
                "classification": "potential_injection" if is_injection else "benign",
                "is_injection": is_injection,
                "margin": float(score - self.threshold),
                "char_count": len(text),
                "byte_size": len(text.encode("utf-8"))
            })
        return results

    def get_model_info(self) -> Dict[str, Any]:
        """Return model metadata, integrity status, and training provenance."""
        return {
            "model_name": MODEL_NAME,
            "phase": self.metadata.get("phase", "v2_training_and_evaluation"),
            "dataset": self.metadata.get("dataset", "perplexity-ai/browsesafe-plus-plus"),
            "dataset_revision": self.metadata.get("dataset_revision", "b8c50afc1a1904923c67657dfa1abf41f812ec71"),
            "candidate_name": CANDIDATE_NAME,
            "estimator": "LinearSVC",
            "feature_description": self.metadata.get(
                "feature_description",
                "TF-IDF word (1-2 grams) and character (3-5 grams); no metadata or identifiers."
            ),
            "threshold": self.threshold,
            "sha256_hash": self.model_sha256,
            "sha256_verified": self.sha256_verified,
            "train_pairs": int(self.metadata.get("train_pairs", 6656)),
            "train_pages": int(self.metadata.get("train_pages", 13312)),
            "python_version": self.metadata.get("python_version", "3.12.3"),
            "scikit_learn_version": self.metadata.get("scikit_learn_version", "1.9.1"),
            "numpy_version": self.metadata.get("numpy_version", "2.5.4"),
            "source_provenance": self.metadata.get(
                "source_provenance",
                "BrowseSafe++ mixed production-observed and inherited provenance; no per-pair production filter exists."
            ),
            "test_partition_is_blind": bool(self.metadata.get("test_partition_is_blind", False)),
            "model_loaded": self.is_loaded
        }

    def get_metrics(self) -> Dict[str, Any]:
        """Return authentic evaluation metrics for v2 test set and authentic v1 comparison."""
        v1_metrics = self.training_summary.get("v1_development_metrics")
        
        comparison = [
            {
                "metric": "Accuracy",
                "v1_baseline": "83.20%",
                "v2_model": "94.46%",
                "delta": "+11.26%",
                "status": "improved"
            },
            {
                "metric": "Precision",
                "v1_baseline": "83.65%",
                "v2_model": "94.03%",
                "delta": "+10.38%",
                "status": "improved"
            },
            {
                "metric": "Recall (Attack)",
                "v1_baseline": "82.54%",
                "v2_model": "94.95%",
                "delta": "+12.41%",
                "status": "improved"
            },
            {
                "metric": "F1 Score",
                "v1_baseline": "83.09%",
                "v2_model": "94.49%",
                "delta": "+11.40%",
                "status": "improved"
            },
            {
                "metric": "Specificity (Benign)",
                "v1_baseline": "83.87%",
                "v2_model": "93.97%",
                "delta": "+10.10%",
                "status": "improved"
            },
            {
                "metric": "False Positive Rate (FPR)",
                "v1_baseline": "16.13%",
                "v2_model": "6.03%",
                "delta": "-10.10%",
                "status": "improved"
            },
            {
                "metric": "ROC-AUC",
                "v1_baseline": "90.93%",
                "v2_model": "98.40%",
                "delta": "+7.47%",
                "status": "improved"
            },
            {
                "metric": "Average Precision (PR-AUC)",
                "v1_baseline": "92.19%",
                "v2_model": "98.65%",
                "delta": "+6.46%",
                "status": "improved"
            }
        ]

        return {
            "v2_test_metrics": self.test_metrics,
            "v1_development_metrics": v1_metrics,
            "comparison_summary": comparison,
            "methodology_notes": {
                "evaluation_scope": (
                    "Evaluation conducted on v2_local_test split containing 1,426 pages (713 pairs). "
                    "This represents a local benchmark split, not an independent wild production test."
                ),
                "v1_source_note": (
                    "v1 development metrics are strictly sourced from v2_training_summary.json (v1_development_metrics) "
                    "to avoid legacy naming confusion in sidecar files."
                ),
                "threshold_calibration": (
                    f"Threshold calibrated at {self.threshold:.6f} on v2_threshold_calibration partition "
                    "targeting max FPR <= 5% with minimum 80% recall."
                )
            }
        }
