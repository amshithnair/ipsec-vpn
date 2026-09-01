"""
Behavioral Anomaly Detection Engine for Encrypted VPN Traffic.
Uses Scikit-Learn IsolationForest to detect statistical traffic deviations
from baseline communication patterns without payload inspection.
"""

from __future__ import annotations

import os
from typing import Optional
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib

from app.parser.pcap_parser import ParseResult
from app.parser.features import extract_flow_features


# Feature list for behavioral anomaly detection
ANOMALY_FEATURE_NAMES = [
    "total_packets",
    "total_bytes",
    "duration_seconds",
    "bytes_per_second",
    "packets_per_second",
    "avg_packet_size",
    "packet_size_variance",
    "udp_ratio",
    "tcp_ratio",
]

# Baseline statistical norms (mean, std) for computing standardized deviations / contributing signals
BASELINE_FEATURE_NORMS = {
    "total_packets": (5000.0, 3000.0),
    "total_bytes": (5000000.0, 3000000.0),
    "duration_seconds": (180.0, 90.0),
    "bytes_per_second": (35000.0, 20000.0),
    "packets_per_second": (40.0, 25.0),
    "avg_packet_size": (750.0, 350.0),
    "packet_size_variance": (50000.0, 30000.0),
    "udp_ratio": (0.75, 0.25),
    "tcp_ratio": (0.25, 0.25),
}


class BehavioralAnomalyDetector:
    """
    Unsupervised behavioral anomaly detector trained on baseline network flow characteristics.
    Detects irregular burstiness, asymmetric volume, and timing anomalies in encrypted traffic.
    """

    def __init__(self, model_path: Optional[str] = None):
        self.model_version = "if-v1.0.0"
        self.algorithm = "Isolation Forest"
        self.training_status = "Development / Synthetic-Data Validated"
        self.model: Optional[IsolationForest] = None
        self._load_or_initialize_model(model_path)

    def _load_or_initialize_model(self, model_path: Optional[str]):
        """Load pretrained IsolationForest model if exists, or fit baseline model."""
        if model_path and os.path.exists(model_path):
            try:
                self.model = joblib.load(model_path)
                print(f"[Anomaly] Loaded IsolationForest from {model_path}")
                return
            except Exception as e:
                print(f"[Anomaly] Warning: Failed to load {model_path}: {e}")

        # Initialize and fit a baseline IsolationForest model on standard baseline distributions
        self._train_baseline_model()

    def _train_baseline_model(self):
        """Fit a baseline IsolationForest model on representative synthetic normal VPN traffic."""
        np.random.seed(42)
        normal_samples = []
        for _ in range(1500):
            sample = {
                "total_packets": np.random.normal(5000, 1500),
                "total_bytes": np.random.normal(5000000, 1500000),
                "duration_seconds": np.random.normal(180, 60),
                "bytes_per_second": np.random.normal(35000, 10000),
                "packets_per_second": np.random.normal(40, 15),
                "avg_packet_size": np.random.normal(750, 150),
                "packet_size_variance": np.random.normal(50000, 15000),
                "udp_ratio": np.clip(np.random.normal(0.80, 0.10), 0, 1),
                "tcp_ratio": np.clip(np.random.normal(0.20, 0.10), 0, 1),
            }
            normal_samples.append(sample)

        df = pd.DataFrame(normal_samples).clip(lower=0)
        clf = IsolationForest(
            n_estimators=100,
            contamination=0.08,
            random_state=42,
            n_jobs=-1,
        )
        clf.fit(df[ANOMALY_FEATURE_NAMES])
        self.model = clf
        print("[Anomaly] Fitted baseline IsolationForest model v1.0.0 (Development / Synthetic-Data Validated)")

    def analyze(self, parse_result: ParseResult) -> dict:
        """
        Analyze flow statistics from ParseResult and compute behavioral anomaly metrics.
        Returns dictionary matching AnomalyAssessment schema.
        """
        features = extract_flow_features(parse_result)
        
        # Insufficient data check
        if not features or parse_result.stats.total_packets < 5:
            return {
                "anomaly_score": 0.0,
                "is_anomalous": False,
                "severity": "LOW",
                "status": "INSUFFICIENT_DATA",
                "explanation": "Behavioral analysis unavailable: capture contains fewer than 5 packets for statistical flow evaluation.",
                "contributing_signals": [],
                "model_version": self.model_version,
                "algorithm": self.algorithm,
                "validation_status": self.training_status,
            }

        # Build feature vector
        feature_vector = {name: features.get(name, 0.0) for name in ANOMALY_FEATURE_NAMES}
        df_feat = pd.DataFrame([feature_vector])[ANOMALY_FEATURE_NAMES]

        # Score with IsolationForest
        # raw decision function: higher = normal, lower = anomalous
        decision_score = float(self.model.decision_function(df_feat)[0])
        prediction = int(self.model.predict(df_feat)[0])  # 1 = normal, -1 = anomaly

        # Map decision score to normalized 0-100 anomaly score:
        # decision function typically spans roughly [-0.3, +0.2]
        # score = 50 - (decision_score * 120), clipped to [0, 100]
        raw_score = 50.0 - (decision_score * 130.0)
        anomaly_score = float(np.clip(raw_score, 0.0, 100.0))
        is_anomalous = bool(prediction == -1 or anomaly_score >= 65.0)

        # Determine severity
        if anomaly_score >= 80.0:
            severity = "CRITICAL"
        elif anomaly_score >= 65.0:
            severity = "HIGH"
        elif anomaly_score >= 45.0:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        # Calculate contributing signals (Z-score deviation from baseline norms)
        contributing_signals = []
        for feat_name, (mean_val, std_val) in BASELINE_FEATURE_NORMS.items():
            actual_val = float(feature_vector.get(feat_name, 0.0))
            if std_val > 0:
                z_score = abs(actual_val - mean_val) / std_val
                if z_score >= 1.2:
                    deviation_dir = "higher" if actual_val > mean_val else "lower"
                    contributing_signals.append({
                        "feature_name": feat_name,
                        "observed_value": round(actual_val, 3),
                        "baseline_mean": round(mean_val, 3),
                        "deviation_z_score": round(float(z_score), 2),
                        "direction": deviation_dir,
                        "impact_weight": min(1.0, round(float(z_score / 3.5), 2)),
                    })

        # Sort signals by highest deviation
        contributing_signals.sort(key=lambda s: s["deviation_z_score"], reverse=True)
        top_signals = contributing_signals[:5]

        # Formulate precise explanation without fabricating payload conclusions
        if is_anomalous:
            sig_summaries = [f"{s['feature_name']} is {s['direction']} than baseline (z={s['deviation_z_score']})" for s in top_signals[:3]]
            explanation = (
                f"Isolation Forest identified statistical behavioral divergence from learned baseline (Score: {round(anomaly_score, 1)}/100). "
                f"Primary contributing signals: {', '.join(sig_summaries) if sig_summaries else 'multi-feature distribution drift'}."
            )
        else:
            explanation = (
                f"Traffic flow characteristics align with standard baseline communication patterns (Anomaly Score: {round(anomaly_score, 1)}/100)."
            )

        return {
            "anomaly_score": round(anomaly_score, 2),
            "is_anomalous": is_anomalous,
            "severity": severity,
            "status": "EVALUATED",
            "explanation": explanation,
            "contributing_signals": top_signals,
            "model_version": self.model_version,
            "algorithm": self.algorithm,
            "validation_status": self.training_status,
        }


# Global detector instance
_detector_instance: Optional[BehavioralAnomalyDetector] = None

def get_anomaly_detector() -> BehavioralAnomalyDetector:
    global _detector_instance
    if _detector_instance is None:
        model_path = os.environ.get("ANOMALY_MODEL_PATH", "/app/models/anomaly/v1/model.joblib")
        _detector_instance = BehavioralAnomalyDetector(model_path)
    return _detector_instance
