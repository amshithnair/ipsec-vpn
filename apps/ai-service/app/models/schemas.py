"""
Pydantic models for the AI service request/response contracts.
"""

from __future__ import annotations

from typing import Optional, List, Dict, Any
from pydantic import BaseModel as _BaseModel, Field

class BaseModel(_BaseModel):
    model_config = {"protected_namespaces": ()}


# ── Classification Models ──

class EncryptionInfo(BaseModel):
    algorithm: str = "Unknown"
    key_length: Optional[int] = None
    strength: str = "unknown"  # strong, acceptable, weak, critical


class AuthenticationInfo(BaseModel):
    algorithm: str = "Unknown"
    hmac_length: Optional[int] = None
    strength: str = "unknown"


class DHGroupInfo(BaseModel):
    group_number: Optional[int] = None
    name: str = "Unknown"
    strength: str = "unknown"


class PFSInfo(BaseModel):
    detected: bool = False
    group: Optional[int] = None


class TrafficInference(BaseModel):
    traffic_type: str = "Unknown"
    confidence: float = 0.0
    model_version: str = "rf-v1.0.0"
    method_source: str = "ML_CLASSIFIER"


class ClassificationResult(BaseModel):
    protocol: str = "Unknown"
    protocol_confidence: float = 0.0
    ike_version: Optional[str] = None
    ipsec_mode: Optional[str] = None
    sub_protocols: list[str] = Field(default_factory=list)
    analysis_method: str = "Deterministic"  # Deterministic or ML
    method_source: str = "DETERMINISTIC"
    traffic_inference: Optional[TrafficInference] = None


class CryptoAnalysis(BaseModel):
    encryption: EncryptionInfo = Field(default_factory=EncryptionInfo)
    authentication: AuthenticationInfo = Field(default_factory=AuthenticationInfo)
    dh_group: DHGroupInfo = Field(default_factory=DHGroupInfo)
    pfs: PFSInfo = Field(default_factory=PFSInfo)
    method_source: str = "DETERMINISTIC"


# ── Behavioral Anomaly Models ──

class ContributingSignal(BaseModel):
    feature_name: str
    observed_value: float
    baseline_mean: float
    deviation_z_score: float
    direction: str  # higher, lower
    impact_weight: float = 0.0


class AnomalyAssessment(BaseModel):
    anomaly_score: float = 0.0  # 0 to 100 (distance metric, NOT probability)
    is_anomalous: bool = False
    severity: str = "LOW"  # LOW, MEDIUM, HIGH, CRITICAL
    status: str = "EVALUATED"  # EVALUATED, INSUFFICIENT_DATA
    explanation: str = ""
    contributing_signals: List[ContributingSignal] = Field(default_factory=list)
    model_version: str = "if-v1.0.0"
    algorithm: str = "Isolation Forest"
    validation_status: str = "Development / Synthetic-Data Validated"
    method_source: str = "ML_ANOMALY"


# ── Security Assessment Models ──

class Finding(BaseModel):
    id: str
    category: str
    severity: str
    title: str
    description: str
    evidence: dict = Field(default_factory=dict)
    recommendation: str = ""
    source: str = "RULE_BASED"  # DETERMINISTIC, RULE_BASED, ML_CLASSIFIER, ML_ANOMALY, HYBRID_RISK


class Recommendation(BaseModel):
    id: str
    priority: str
    category: str
    title: str
    description: str
    action: str = ""


class SecurityAssessment(BaseModel):
    risk_score: int = 0  # 0 to 100 system-derived security risk
    severity: str = "LOW"
    crypto_strength_score: int = 100
    protocol_score: int = 100
    behavioral_score: int = 100
    findings: list[Finding] = Field(default_factory=list)
    recommendations: list[Recommendation] = Field(default_factory=list)
    method_source: str = "HYBRID_RISK"


# ── Confidence Models ──

class ConfidenceInfo(BaseModel):
    overall_score: float = 0.0
    classification_confidence: float = 0.0
    extraction_completeness: float = 0.0
    model_version: str = "rules-v1"


# ── Metadata Models ──

class AnalysisMetadata(BaseModel):
    processing_time_ms: int = 0
    packets_analyzed: int = 0
    ipsec_packets: int = 0
    capture_duration_seconds: float = 0.0
    file_size_bytes: int = 0


# ── Full Analysis Response ──

class AnalysisResponse(BaseModel):
    capture_id: str = ""
    analysis_id: str = ""
    timestamp: str = ""
    status: str = "completed"
    classification: ClassificationResult = Field(default_factory=ClassificationResult)
    crypto_analysis: CryptoAnalysis = Field(default_factory=CryptoAnalysis)
    security_assessment: SecurityAssessment = Field(default_factory=SecurityAssessment)
    anomaly_assessment: AnomalyAssessment = Field(default_factory=AnomalyAssessment)
    confidence: ConfidenceInfo = Field(default_factory=ConfidenceInfo)
    metadata: AnalysisMetadata = Field(default_factory=AnalysisMetadata)


# ── Model Registry Schemas ──

class ModelCard(BaseModel):
    model_id: str
    name: str
    version: str
    type: str
    framework: str
    task: str
    input_features: List[str]
    feature_count: int
    classes: List[str]
    dataset_type: str
    validation_status: str
    accuracy_statement: str
    evaluation_metrics: Dict[str, Any]
    limitations: List[str]
    intended_use: str


# ── Report Models ──

class ReportRequest(BaseModel):
    capture_id: str
    analysis: AnalysisResponse
    report_type: str = "technical"
    format: str = "html"
