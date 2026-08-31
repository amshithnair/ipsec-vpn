"""
Pydantic models for the AI service request/response contracts.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


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


class ClassificationResult(BaseModel):
    protocol: str = "Unknown"
    protocol_confidence: float = 0.0
    ike_version: Optional[str] = None
    ipsec_mode: Optional[str] = None
    sub_protocols: list[str] = Field(default_factory=list)


class CryptoAnalysis(BaseModel):
    encryption: EncryptionInfo = Field(default_factory=EncryptionInfo)
    authentication: AuthenticationInfo = Field(default_factory=AuthenticationInfo)
    dh_group: DHGroupInfo = Field(default_factory=DHGroupInfo)
    pfs: PFSInfo = Field(default_factory=PFSInfo)


# ── Security Assessment Models ──

class Finding(BaseModel):
    id: str
    category: str
    severity: str
    title: str
    description: str
    evidence: dict = Field(default_factory=dict)
    recommendation: str = ""


class Recommendation(BaseModel):
    id: str
    priority: str
    category: str
    title: str
    description: str
    action: str = ""


class SecurityAssessment(BaseModel):
    risk_score: int = 0
    severity: str = "LOW"
    crypto_strength_score: int = 100
    findings: list[Finding] = Field(default_factory=list)
    recommendations: list[Recommendation] = Field(default_factory=list)


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
    confidence: ConfidenceInfo = Field(default_factory=ConfidenceInfo)
    metadata: AnalysisMetadata = Field(default_factory=AnalysisMetadata)


# ── Report Models ──

class ReportRequest(BaseModel):
    capture_id: str
    analysis: AnalysisResponse
    report_type: str = "technical"
    format: str = "html"
