"""
AI Service API Routes — FastAPI endpoints for PCAP analysis.
These endpoints are called by the Go backend, NOT directly by the frontend.
"""

from __future__ import annotations

import os
import time
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, File, UploadFile, HTTPException, Request, Form
from fastapi.responses import HTMLResponse

from app.parser.pcap_parser import PcapParser
from app.classifier.protocol_classifier import classify
from app.scoring.rules_engine import RulesEngine
from app.reports.html_report import generate_html_report
from app.models.schemas import (
    AnalysisResponse,
    ClassificationResult,
    CryptoAnalysis,
    SecurityAssessment,
    ConfidenceInfo,
    AnalysisMetadata,
    ReportRequest,
)


router = APIRouter()
parser = PcapParser()


def _get_rules_engine(request: Request) -> RulesEngine:
    """Get the rules engine from app state."""
    return request.app.state.rules_engine


@router.post("/analyze")
async def analyze_pcap(
    request: Request,
    file: UploadFile = File(...),
    capture_id: str = Form(default=""),
):
    """
    Full analysis pipeline: parse → classify → score → return results.
    This is the primary endpoint called by the Go backend.
    """
    start_time = time.time()

    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in {".pcap", ".pcapng", ".cap"}:
        raise HTTPException(status_code=400, detail=f"Invalid file type: {ext}")

    # Save to temp location
    upload_dir = os.getenv("UPLOAD_DIR", "/app/uploads")
    os.makedirs(upload_dir, exist_ok=True)

    temp_path = os.path.join(upload_dir, f"analysis_{uuid.uuid4().hex}{ext}")
    try:
        content = await file.read()
        if len(content) > 50 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large (max 50MB)")

        with open(temp_path, "wb") as f:
            f.write(content)

        # ── Step 1: Parse PCAP ──
        parse_result = parser.parse(temp_path)
        if not parse_result.success:
            raise HTTPException(status_code=422, detail=f"PCAP parse error: {parse_result.error}")

        # ── Step 2: Classify ──
        classification, crypto, class_conf, extract_comp, overall_conf = classify(parse_result)

        # ── Step 3: Security Assessment ──
        rules_engine = _get_rules_engine(request)

        # Determine replay protection from ESP sequence numbers
        replay_protection = None
        if parse_result.has_esp and parse_result.esp_info.sequence_numbers:
            # If sequence numbers are strictly increasing, replay protection is likely enabled
            seqs = parse_result.esp_info.sequence_numbers
            if len(seqs) > 1:
                replay_protection = all(seqs[i] < seqs[i + 1] for i in range(len(seqs) - 1))

        security = rules_engine.evaluate(classification, crypto, replay_protection)

        # ── Step 4: Build response ──
        processing_time = int((time.time() - start_time) * 1000)

        capture_duration = 0.0
        if parse_result.stats.last_timestamp > parse_result.stats.first_timestamp:
            capture_duration = parse_result.stats.last_timestamp - parse_result.stats.first_timestamp

        analysis = AnalysisResponse(
            capture_id=capture_id or str(uuid.uuid4()),
            analysis_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc).isoformat(),
            status="completed",
            classification=classification,
            crypto_analysis=crypto,
            security_assessment=security,
            confidence=ConfidenceInfo(
                overall_score=round(overall_conf, 4),
                classification_confidence=round(class_conf, 4),
                extraction_completeness=round(extract_comp, 4),
                model_version=rules_engine.version,
            ),
            metadata=AnalysisMetadata(
                processing_time_ms=processing_time,
                packets_analyzed=parse_result.stats.total_packets,
                ipsec_packets=(
                    parse_result.stats.ike_packets
                    + parse_result.stats.esp_packets
                    + parse_result.stats.ah_packets
                ),
                capture_duration_seconds=round(capture_duration, 3),
                file_size_bytes=parse_result.file_size,
            ),
        )

        return analysis.model_dump()

    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass


@router.post("/classify")
async def classify_only(
    request: Request,
    file: UploadFile = File(...),
):
    """Classification-only endpoint — returns protocol classification without security assessment."""
    # Validate
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in {".pcap", ".pcapng", ".cap"}:
        raise HTTPException(status_code=400, detail=f"Invalid file type: {ext}")

    upload_dir = os.getenv("UPLOAD_DIR", "/app/uploads")
    os.makedirs(upload_dir, exist_ok=True)
    temp_path = os.path.join(upload_dir, f"classify_{uuid.uuid4().hex}{ext}")

    try:
        content = await file.read()
        with open(temp_path, "wb") as f:
            f.write(content)

        parse_result = parser.parse(temp_path)
        if not parse_result.success:
            raise HTTPException(status_code=422, detail=f"PCAP parse error: {parse_result.error}")

        classification, crypto, class_conf, extract_comp, overall_conf = classify(parse_result)

        return {
            "classification": classification.model_dump(),
            "crypto_analysis": crypto.model_dump(),
            "confidence": {
                "classification_confidence": round(class_conf, 4),
                "extraction_completeness": round(extract_comp, 4),
            },
            "metadata": {
                "packets_analyzed": parse_result.stats.total_packets,
                "ipsec_packets": (
                    parse_result.stats.ike_packets
                    + parse_result.stats.esp_packets
                    + parse_result.stats.ah_packets
                ),
            },
        }
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass


@router.post("/security-assess")
async def security_assess(
    request: Request,
    file: UploadFile = File(...),
):
    """Security assessment-only endpoint."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in {".pcap", ".pcapng", ".cap"}:
        raise HTTPException(status_code=400, detail=f"Invalid file type: {ext}")

    upload_dir = os.getenv("UPLOAD_DIR", "/app/uploads")
    os.makedirs(upload_dir, exist_ok=True)
    temp_path = os.path.join(upload_dir, f"assess_{uuid.uuid4().hex}{ext}")

    try:
        content = await file.read()
        with open(temp_path, "wb") as f:
            f.write(content)

        parse_result = parser.parse(temp_path)
        if not parse_result.success:
            raise HTTPException(status_code=422, detail=f"PCAP parse error: {parse_result.error}")

        classification, crypto, _, _, _ = classify(parse_result)
        rules_engine = _get_rules_engine(request)
        security = rules_engine.evaluate(classification, crypto)

        return security.model_dump()
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass


@router.post("/report/generate")
async def generate_report(report_req: ReportRequest):
    """Generate an HTML report from analysis results."""
    analysis = report_req.analysis
    html = generate_html_report(analysis, capture_filename=report_req.capture_id)
    return {"report_html": html, "format": "html"}


@router.get("/models/info")
async def model_info(request: Request):
    """Return model/rules information."""
    rules_engine = _get_rules_engine(request)
    return {
        "model_version": rules_engine.version,
        "model_type": "deterministic_rules_engine",
        "capabilities": [
            "ike_version_detection",
            "encryption_algorithm_identification",
            "authentication_algorithm_identification",
            "dh_group_identification",
            "pfs_detection",
            "replay_protection_detection",
            "security_risk_scoring",
            "html_report_generation",
        ],
    }
