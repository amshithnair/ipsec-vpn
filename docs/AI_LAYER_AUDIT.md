# AI Layer Audit

## Executive Summary
This forensic audit evaluated the existing Python AI Service (`apps/ai-service`) for the IPSEC-VPN platform to determine exactly what is genuinely implemented and working versus what is scaffolded, mocked, deterministic, or planned according to the TRD.

**Conclusion:** The current AI Service is entirely deterministic and rule-based. **No trained ML models or external AI APIs are currently integrated or invoked anywhere in the execution path.** All classifications, security assessments, and confidence scores are generated using static heuristics and deterministic string-matching logic based on Scapy parser outputs.

## What Is Actually Working
- **PCAP Parsing**: The `pcap_parser.py` successfully reads PCAPs using `scapy`, extracts IKE and ESP payloads, and correctly fetches algorithms, exchange types, and sequence numbers.
- **Protocol Classification**: The `protocol_classifier.py` successfully classifies the IPsec elements (IKE versions, encryption/auth algorithms, DH groups, PFS state) by deterministically mapping strings (e.g. mapping "AES-256-GCM" to 256-bit strong encryption).
- **Security Scoring**: The `rules_engine.py` successfully evaluates the parsed cryptographic primitives against a static `security-rules.yaml` file to produce reproducible risk scores.
- **Reporting**: HTML report generation works perfectly, rendering parsed outputs.
- **API Orchestration**: The FastAPI wrapper around this deterministic engine correctly processes uploaded PCAPs and returns standardized JSON.

## What Is Rule-Based
- **IPsec/IKE Classification**: Rule-based string mapping (`protocol_classifier.py`).
- **Cryptographic Strength Assessment**: Hardcoded lookup tables (e.g., `ENCRYPTION_STRENGTH` dict).
- **PFS & Replay Protection Detection**: Heuristic evaluation of IKE exchange payloads and ESP sequence numbers.
- **Security Risk Scoring**: Explicit YAML-based penalty logic.

## What Is ML-Based
- **Nothing**. There are zero machine learning models in this repository.

## What Is Mocked
- There are no explicit mocks returning hardcoded JSON responses in the primary `/analyze` endpoint; the endpoint legitimately parses the provided PCAPs and runs the deterministic rules against them.

## What Is Not Implemented
- **ML-based protocol classification for inference cases**
- **Traffic-type inference model**
- **Model Version Tracking** (the `/models/info` endpoint just returns a hardcoded "rules-v1" deterministic engine type)
- **Model Training / Dataset Generation Pipeline**

## PCAP Processing Pipeline
The execution trace for `POST /analyze` (in `app/api/routes.py`) is as follows:
1. **Request Received**: PCAP file received via `UploadFile`.
2. **PCAP Accessed**: Saved to a temporary location `/app/uploads`.
3. **Parser Invoked**: `PcapParser().parse()` reads the file via `scapy`. (IMPLEMENTED - Rule-based)
4. **Features Extracted**: IKE payloads, ESP sequence numbers are extracted into a `ParseResult` dataclass. (IMPLEMENTED - Rule-based)
5. **Classifier Invoked**: `protocol_classifier.classify()` runs deterministic lookups against the `ParseResult`. (IMPLEMENTED - Deterministic)
6. **Scoring Invoked**: `RulesEngine().evaluate()` computes a risk score via `security-rules.yaml`. (IMPLEMENTED - Deterministic)
7. **Result Generated**: JSON response compiled. (IMPLEMENTED)
8. **Response Returned**: Returned to the Go Backend. (IMPLEMENTED)

## Feature Extraction
Feature extraction relies entirely on the `scapy` networking library to dissect standard packet layers. There are no vectors generated for ML inference (no pandas dataframes, no tensors).

## IPsec Classification
Identified entirely via payload string extraction and deterministic mapping:
- **Protocol**: "IPsec" if IKE/ESP/AH payloads are found by Scapy.
- **IKE Version**: Extracted directly from Scapy `IKEv2` or `ISAKMP` payload headers.
- **Encryption/Auth/DH**: Extracted from Scapy IKE Transform payloads and matched against hardcoded Python dicts (`ENCRYPTION_STRENGTH`, `AUTH_STRENGTH`).
- **Mode**: Heuristically set to "tunnel" if ESP packets encapsulate IP packets.
- **PFS**: Detected by checking if `CREATE_CHILD_SA` or `Quick Mode` exchanges contain DH payloads.

## Security Scoring
The `risk_score` is fully **DETERMINISTIC**.
It is calculated by `RulesEngine.evaluate()` (in `scoring/rules_engine.py`). It reads from `rules/security-rules.yaml` which defines fixed penalties (e.g., +20 points for 3DES, +30 points for MD5).

## Confidence Scoring
The `confidence_score` is a **CALCULATED HEURISTIC**. 
It is explicitly NOT an ML probability. In `_calculate_confidence()` (inside `protocol_classifier.py`), the script mathematically aggregates arbitrary float values based on what was successfully extracted (e.g., `if parse_result.has_ike: confidence += 0.50`).

## Traffic-Type Inference
**NOT IMPLEMENTED.**
There is no code, dataset, training script, endpoint, or feature extraction pipeline for VoIP, HTTP, or Video traffic inference.

## Model Inventory
**No trained ML model is currently integrated.** 
- No sklearn, xgboost, torch, or tensorflow imports exist.
- No serialized models (`.pkl`, `.pt`, `.onnx`) exist in the repository.

## External AI/API Inventory
**No external AI API is currently integrated.**
There are no calls to OpenAI, Anthropic, Gemini, HuggingFace, or AWS Bedrock anywhere in the codebase. 

## Existing AI Tests
The 11 passing tests (in `test-ai-service.ps1`) validate the **deterministic pipeline**:
- They send a PCAP to FastAPI.
- They assert that the deterministic rules correctly evaluate the scapy-extracted strings.
- They ensure the risk scoring YAML adds up to expected thresholds.
- **They DO NOT validate any ML behavior, model probability, or AI inferences.**

## Actual Execution Trace
Running the AI service against the demo PCAPs produces the following:
- `strong-ipsec.pcap` → `scapy` parses IKEv2 → classifier extracts algorithms → Rules engine assigns 35 penalty points (MEDIUM).
- `weak-ipsec.pcap` → `scapy` parses IKEv1 → classifier extracts weak algorithms → Rules engine assigns 60 penalty points (HIGH).
The contrast test passes simply because the YAML engine is hardcoded to penalize IKEv1 more than IKEv2.

## Dependency Audit

| Dependency       | Installed | Imported | Actually Used             |
|------------------|-----------|----------|---------------------------|
| fastapi          | YES       | YES      | Routing & API Framework   |
| scapy            | YES       | YES      | PCAP Parsing              |
| pyyaml           | YES       | YES      | Rules Engine Config       |
| scikit-learn     | NO        | NO       | -                         |
| xgboost          | NO        | NO       | -                         |
| torch/tensorflow | NO        | NO       | -                         |
| joblib/onnx      | NO        | NO       | -                         |
| openai/gemini    | NO        | NO       | -                         |

## API Endpoint Audit

| Endpoint           | Method | Purpose                      | Current Status | Uses ML? | Uses Rules? | Uses Parser? |
|--------------------|--------|------------------------------|----------------|----------|-------------|--------------|
| `/health`          | GET    | Liveness check               | WORKING        | NO       | NO          | NO           |
| `/models/info`     | GET    | AI Engine metadata           | WORKING (Mock) | NO       | NO          | NO           |
| `/analyze`         | POST   | Full parse/classify/score    | WORKING        | NO       | YES         | YES          |
| `/classify`        | POST   | IPsec protocol dissection    | WORKING        | NO       | YES         | YES          |
| `/security-assess` | POST   | Run rules against PCAP       | WORKING        | NO       | YES         | YES          |

## Critical Classification Against TRD

| TRD Capability             | Current Status | Actual Technology                |
|----------------------------|----------------|----------------------------------|
| PCAP parsing               | WORKING        | Python Scapy                     |
| Feature extraction         | WORKING        | Deterministic payload extraction |
| IPsec detection            | WORKING        | Scapy heuristics                 |
| IKE classification         | WORKING        | Scapy payload dissection         |
| ML protocol classification | NOT IMPLEMENTED| -                                |
| Traffic-type ML            | NOT IMPLEMENTED| -                                |
| Security scoring           | WORKING        | Deterministic YAML rules engine  |
| Confidence scoring         | PARTIAL        | Hardcoded arithmetic heuristic   |
| Model serving              | NOT IMPLEMENTED| -                                |
| Model versioning           | MOCKED         | Hardcoded endpoint string        |
| Report generation          | WORKING        | Jinja2 HTML templates            |

## Final Conclusion

**"Is IPSEC-VPN currently AI-powered?"**

**NO** — the current implementation is completely deterministic and rule-based, and does not currently contain an integrated ML model. While the infrastructure (FastAPI endpoints, parsing pipelines) is in place to *host* an ML model, the logic executed during a PCAP analysis is purely heuristic packet dissection and YAML-based penalty assignments.
