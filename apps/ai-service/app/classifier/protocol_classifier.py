"""
Protocol Classifier — Determines IPsec protocol details from parsed PCAP data.
Maps raw parser output to the classification contract.
"""

from __future__ import annotations

from app.parser.pcap_parser import ParseResult, DH_GROUPS
from app.parser.features import extract_flow_features
import joblib
import pandas as pd
import os

from app.models.schemas import (
    ClassificationResult,
    CryptoAnalysis,
    EncryptionInfo,
    AuthenticationInfo,
    DHGroupInfo,
    PFSInfo,
    TrafficInference,
)

# Load ML Model globally
MODEL_PATH = os.environ.get("MODEL_PATH", "/app/models")
TRAFFIC_MODEL_FILE = os.path.join(MODEL_PATH, "v1", "model.joblib")
_rf_model = None
try:
    if os.path.exists(TRAFFIC_MODEL_FILE):
        _rf_model = joblib.load(TRAFFIC_MODEL_FILE)
        print(f"[ML] Successfully loaded model from {TRAFFIC_MODEL_FILE}")
    else:
        print(f"[ML] Model file not found: {TRAFFIC_MODEL_FILE}")
except Exception as e:
    print(f"[ML] Warning: Failed to load traffic ML model: {e}")


# ── Strength Assessment Lookups ──

ENCRYPTION_STRENGTH = {
    "AES-256-GCM": ("strong", 256),
    "AES-256-CBC": ("strong", 256),
    "AES-256-CTR": ("strong", 256),
    "AES-256": ("strong", 256),
    "AES-128-GCM": ("acceptable", 128),
    "AES-128-CBC": ("acceptable", 128),
    "AES-128-CTR": ("acceptable", 128),
    "AES-128": ("acceptable", 128),
    "AES-CBC": ("acceptable", 128),  # default key length assumption
    "CHACHA20-POLY1305": ("strong", 256),
    "CAMELLIA-CBC": ("acceptable", 128),
    "3DES-CBC": ("weak", 112),
    "3DES": ("weak", 112),
    "DES-CBC": ("critical", 56),
    "DES": ("critical", 56),
    "BLOWFISH-CBC": ("weak", 128),
    "CAST-CBC": ("acceptable", 128),
    "NULL": ("critical", 0),
    "NONE": ("critical", 0),
}

AUTH_STRENGTH = {
    "HMAC-SHA-512-256": ("strong", 512),
    "HMAC-SHA-512": ("strong", 512),
    "HMAC-SHA-384-192": ("strong", 384),
    "HMAC-SHA-384": ("strong", 384),
    "HMAC-SHA-256-128": ("strong", 256),
    "HMAC-SHA-256": ("strong", 256),
    "SHA-256": ("strong", 256),
    "SHA-384": ("strong", 384),
    "SHA-512": ("strong", 512),
    "HMAC-SHA1-96": ("deprecated", 160),
    "SHA-1": ("deprecated", 160),
    "SHA1": ("deprecated", 160),
    "AES-CMAC-96": ("strong", 128),
    "HMAC-MD5-96": ("broken", 128),
    "MD5": ("broken", 128),
    "DES-MAC": ("broken", 56),
}


def _normalize_algo_name(name: str) -> str:
    """Normalize algorithm names for consistent matching."""
    return name.upper().strip()


def _determine_encryption(parse_result: ParseResult) -> EncryptionInfo:
    """Determine the encryption algorithm from parsed IKE data."""
    algos = parse_result.ike_info.encryption_algorithms
    if not algos:
        return EncryptionInfo(algorithm="Unknown", strength="unknown")

    # Take the first (preferred) algorithm
    algo = algos[0]
    normalized = _normalize_algo_name(algo)

    # Try exact match first, then prefix match
    strength, key_len = "unknown", None
    for known, (s, kl) in ENCRYPTION_STRENGTH.items():
        if _normalize_algo_name(known) == normalized or normalized.startswith(_normalize_algo_name(known)):
            strength, key_len = s, kl
            break

    # Check for key length in parsed data
    if parse_result.ike_info.key_lengths:
        key_len = parse_result.ike_info.key_lengths[0]
        # Adjust algo name to include key length
        base = algo.split("-")[0] if "-" in algo else algo
        if key_len and str(key_len) not in algo:
            algo = f"{algo}"  # keep original

    return EncryptionInfo(
        algorithm=algo,
        key_length=key_len,
        strength=strength,
    )


def _determine_authentication(parse_result: ParseResult) -> AuthenticationInfo:
    """Determine the authentication algorithm."""
    algos = parse_result.ike_info.auth_algorithms
    if not algos:
        return AuthenticationInfo(algorithm="Unknown", strength="unknown")

    algo = algos[0]
    normalized = _normalize_algo_name(algo)

    strength, hmac_len = "unknown", None
    for known, (s, hl) in AUTH_STRENGTH.items():
        if _normalize_algo_name(known) == normalized or normalized.startswith(_normalize_algo_name(known)):
            strength, hmac_len = s, hl
            break

    return AuthenticationInfo(
        algorithm=algo,
        hmac_length=hmac_len,
        strength=strength,
    )


def _determine_dh_group(parse_result: ParseResult) -> DHGroupInfo:
    """Determine the DH group."""
    groups = parse_result.ike_info.dh_groups
    if not groups:
        return DHGroupInfo(group_number=None, name="Unknown", strength="unknown")

    group_num = groups[0]
    info = DH_GROUPS.get(group_num, {"name": f"group{group_num}", "strength": "unknown"})

    return DHGroupInfo(
        group_number=group_num,
        name=info["name"],
        strength=info["strength"],
    )


def _determine_pfs(parse_result: ParseResult) -> PFSInfo:
    """
    Detect PFS: look for DH group in CREATE_CHILD_SA or Quick Mode,
    or multiple DH exchanges.
    """
    # Check for CREATE_CHILD_SA (IKEv2) or Quick Mode (IKEv1) with DH
    exchange_types = parse_result.ike_info.exchange_types
    has_child_sa = any("CREATE_CHILD_SA" in et for et in exchange_types)
    has_quick_mode = any("Quick Mode" in et for et in exchange_types)

    # If we see child SA / quick mode exchanges with DH, PFS is likely
    if (has_child_sa or has_quick_mode) and len(parse_result.ike_info.dh_groups) > 0:
        return PFSInfo(detected=True, group=parse_result.ike_info.dh_groups[0])

    # If multiple KE payloads seen, PFS is likely
    if parse_result.ike_info.has_ke and len(parse_result.ike_info.dh_groups) > 1:
        return PFSInfo(detected=True, group=parse_result.ike_info.dh_groups[-1])

    # Can't determine — mark as not detected
    return PFSInfo(detected=False)


def _determine_mode(parse_result: ParseResult) -> str | None:
    """Determine IPsec mode (tunnel or transport)."""
    # If ESP is encapsulating IP packets, it's tunnel mode
    # This is a heuristic — full determination would need deeper inspection
    if parse_result.has_esp and parse_result.stats.ip_packets > 0:
        return "tunnel"  # Most common, especially in VPN scenarios
    return None


def _calculate_confidence(parse_result: ParseResult) -> tuple[float, float, float]:
    """
    Calculate confidence scores.
    Returns: (classification_confidence, extraction_completeness, overall)
    """
    classification_confidence = 0.0
    extraction_completeness = 0.0

    # Classification confidence based on evidence strength
    if parse_result.has_ike:
        classification_confidence += 0.50
    if parse_result.has_esp or parse_result.has_ah:
        classification_confidence += 0.30
    if parse_result.ike_info.version:
        classification_confidence += 0.10
    if parse_result.ike_info.encryption_algorithms:
        classification_confidence += 0.05
    if parse_result.ike_info.proposals:
        classification_confidence += 0.05

    classification_confidence = min(classification_confidence, 1.0)

    # Extraction completeness
    fields_extracted = 0
    total_fields = 7  # encryption, auth, dh, pfs, version, mode, replay

    if parse_result.ike_info.encryption_algorithms:
        fields_extracted += 1
    if parse_result.ike_info.auth_algorithms:
        fields_extracted += 1
    if parse_result.ike_info.dh_groups:
        fields_extracted += 1
    if parse_result.ike_info.version:
        fields_extracted += 1
    if parse_result.has_esp or parse_result.has_ah:
        fields_extracted += 1
    if parse_result.ike_info.exchange_types:
        fields_extracted += 1
    if parse_result.esp_info.sequence_numbers:
        fields_extracted += 1

    extraction_completeness = fields_extracted / total_fields

    overall = (classification_confidence * 0.6) + (extraction_completeness * 0.4)

    return classification_confidence, extraction_completeness, overall


def classify(parse_result: ParseResult) -> tuple[ClassificationResult, CryptoAnalysis, float, float, float]:
    """
    Classify the parsed PCAP data into protocol details.
    Uses a hybrid approach: Deterministic classification for IPsec, and ML for Traffic Inference.

    Returns:
        Tuple of (ClassificationResult, CryptoAnalysis,
                  classification_confidence, extraction_completeness, overall_confidence)
    """
    # Determine sub-protocols
    sub_protocols = []
    if parse_result.has_ike:
        sub_protocols.append("IKE")
    if parse_result.has_esp:
        sub_protocols.append("ESP")
    if parse_result.has_ah:
        sub_protocols.append("AH")

    # Confidence scores (Deterministic)
    class_conf, extract_comp, overall_conf = _calculate_confidence(parse_result)
    
    # ML Traffic Inference
    traffic_inference = None
    analysis_method = "Deterministic"
    
    print(f"[ML] classify() called. _rf_model loaded: {_rf_model is not None}, total_packets: {parse_result.stats.total_packets}")
    
    if _rf_model is not None and parse_result.stats.total_packets > 0:
        try:
            features_dict = extract_flow_features(parse_result)
            if features_dict:
                df = pd.DataFrame([features_dict])
                
                # Predict probabilities
                probs = _rf_model.predict_proba(df)[0]
                max_prob = max(probs)
                class_idx = list(probs).index(max_prob)
                pred_class = _rf_model.classes_[class_idx]
                
                if max_prob < 0.60:
                    pred_class = "Unknown"
                    
                traffic_inference = TrafficInference(
                    traffic_type=str(pred_class),
                    confidence=float(max_prob),
                    model_version="rf-v1.0.0"
                )
                analysis_method = "Hybrid (ML + Deterministic)"
        except Exception as e:
            import traceback
            import sys
            print(f"ML Inference failed: {e}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)

    classification = ClassificationResult(
        protocol="IPsec" if parse_result.has_ipsec else "Non-IPsec",
        protocol_confidence=round(class_conf, 4),
        ike_version=parse_result.ike_info.version,
        ipsec_mode=_determine_mode(parse_result),
        sub_protocols=sub_protocols,
        analysis_method=analysis_method,
        traffic_inference=traffic_inference,
    )

    crypto = CryptoAnalysis(
        encryption=_determine_encryption(parse_result),
        authentication=_determine_authentication(parse_result),
        dh_group=_determine_dh_group(parse_result),
        pfs=_determine_pfs(parse_result),
    )

    return classification, crypto, class_conf, extract_comp, overall_conf
