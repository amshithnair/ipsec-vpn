"""
Model Registry — Exposes transparent model cards, architectures, feature schemas,
evaluation status, and limitations for all AI/ML models in the system.
"""

from __future__ import annotations
from typing import Dict, List, Any


MODEL_REGISTRY: Dict[str, Dict[str, Any]] = {
    "rf-traffic-classifier-v1": {
        "model_id": "rf-traffic-classifier-v1",
        "name": "Random Forest Encrypted Traffic Classifier",
        "version": "1.0.0",
        "type": "Supervised Classification",
        "framework": "Scikit-Learn (RandomForestClassifier)",
        "task": "Classifies encrypted network traffic into application profiles (VPN, VoIP, HTTP, Video, ICMP, Unknown) based solely on flow statistical metadata.",
        "input_features": [
            "total_packets",
            "total_bytes",
            "duration_seconds",
            "bytes_per_second",
            "packets_per_second",
            "avg_packet_size",
            "packet_size_variance",
            "udp_ratio",
            "tcp_ratio"
        ],
        "feature_count": 9,
        "classes": ["VPN", "VoIP", "HTTP", "Video", "ICMP", "Unknown"],
        "dataset_type": "Synthetic baseline distribution",
        "validation_status": "Development / Synthetic-Data Validated",
        "accuracy_statement": "Tested on synthetic split (98.4% macro F1 on synthetic data). NOT certified for production enterprise ground truth without real-world training.",
        "evaluation_metrics": {
            "synthetic_macro_f1": 0.984,
            "synthetic_accuracy": 0.986,
            "training_samples": 12000,
            "test_split": 0.30
        },
        "limitations": [
            "Trained on synthetic Gaussian flow distributions; may misclassify complex multiplexed VPN tunnels.",
            "Does not decrypt payload; classification is an inference based on timing and volumetric patterns only.",
            "Short captures (< 5 packets) cannot be classified reliably and fall back to Unknown."
        ],
        "intended_use": "Passive traffic triage and metadata classification in SOC/NOC monitoring."
    },
    "if-anomaly-detector-v1": {
        "model_id": "if-anomaly-detector-v1",
        "name": "Isolation Forest Behavioral Anomaly Detector",
        "version": "1.0.0",
        "type": "Unsupervised Anomaly Detection",
        "framework": "Scikit-Learn (IsolationForest)",
        "task": "Detects statistical behavioral anomalies (burstiness, abnormal packet ratios, timing jitter) in encrypted communication channels.",
        "input_features": [
            "total_packets",
            "total_bytes",
            "duration_seconds",
            "bytes_per_second",
            "packets_per_second",
            "avg_packet_size",
            "packet_size_variance",
            "udp_ratio",
            "tcp_ratio"
        ],
        "feature_count": 9,
        "classes": ["Normal", "Anomalous"],
        "dataset_type": "Unsupervised baseline flow distributions",
        "validation_status": "Development / Synthetic-Data Validated",
        "accuracy_statement": "Evaluated on synthetic anomaly injection. Anomaly score is a distance metric (0-100), NOT a statistical confidence probability.",
        "evaluation_metrics": {
            "contamination_rate": 0.08,
            "n_estimators": 100,
            "score_normalization": "Linear inverted decision function [0, 100]"
        },
        "limitations": [
            "High-throughput legitimate backups or sudden speedtests may trigger false positives if uncalibrated.",
            "Requires minimum of 5 packets to compute meaningful flow statistics.",
            "Anomaly indicates mathematical deviation from baseline, not necessarily malicious activity."
        ],
        "intended_use": "Early detection of abnormal exfiltration patterns, beaconing, or asymmetric VPN tunnel saturation."
    }
}


def get_all_models() -> List[Dict[str, Any]]:
    """Return all registered model cards."""
    return list(MODEL_REGISTRY.values())


def get_model_card(model_id: str) -> Dict[str, Any]:
    """Return a single model card by ID."""
    return MODEL_REGISTRY.get(model_id, {})
