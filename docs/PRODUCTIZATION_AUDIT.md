# Productization Audit

## 1. Current Architecture
The system is built as a hybrid microservices monorepo.
- **Frontend**: Scaffolding complete (Vite + React + TS), but completely unimplemented placeholder.
- **Backend**: Go-based API acting as an orchestrator and gateway.
- **AI Service**: Python FastAPI service performing stateless deterministic PCAP dissection and scoring.
- **Data Persistence**: PostgreSQL for analysis state/results, Redis for caching.
- **Orchestration**: Fully dockerized via `docker-compose.yml`.

## 2. Existing Services
- `ipsecvpn-frontend`: Port 3000 (React placeholder)
- `ipsecvpn-backend`: Port 8080 (Go)
- `ipsecvpn-ai-service`: Port 8000 (Python)
- `ipsecvpn-postgres`: Port 5432
- `ipsecvpn-redis`: Port 6379

## 3. Existing API Endpoints
**Backend (Go)**:
- `POST /api/v1/captures/upload`
- `GET /api/v1/captures` and `GET /api/v1/captures/:id`
- `POST /api/v1/analysis/start/:id`
- `GET /api/v1/analysis/status/:id`
- `GET /api/v1/analysis/results/:id`
- `GET /api/v1/classification/:id`
- `GET /api/v1/security/:id`
- `POST /api/v1/reports/generate/:id` and `GET /api/v1/reports/:id/download`
- `GET /api/v1/dashboard/summary`

**AI Service (Python)**:
- `POST /analyze`, `/classify`, `/security-assess`
- `GET /health`, `/models/info`

## 4. Existing Database Schema
- `captures`: ID, filename, size, hash, status.
- `analysis_jobs`: ID, capture_id, status, priority, worker_id, timestamps.
- `classification_results`: ID, capture_id, protocol, encryption, dh_group, etc.
- `security_assessments`: ID, capture_id, risk_score, severity, crypto_strength.
- `reports`: ID, capture_id, format, content.

## 5. Existing Job Flow
1. File uploaded via Go API → saved locally.
2. Go API creates `analysis_job` in Postgres.
3. Go API triggers asynchronous goroutine calling Python AI service.
4. Python service responds immediately with extracted data.
5. Go API updates job state and stores classification/security assessment in Postgres + Redis.

## 6. Existing PCAP Pipeline
Uses `scapy` in Python to dissect IP packets and look for IKE (`ISAKMP`) and `ESP`/`AH` payloads. The pipeline is deterministic string extraction.

## 7. Existing Security Rules
The rules exist in `rules/security-rules.yaml`. They assign point penalties based on the presence of weak cryptographic primitives (e.g., 3DES, MD5, DH Group 2). This engine is functional and highly deterministic.

## 8. Existing Report Generation
Python Jinja2 templates consume the `ParseResult`, `ClassificationResult`, and `SecurityAssessment` to produce a static HTML report.

## 9. Existing Frontend
A default `create-vite` scaffold. Absolutely no IPSEC-VPN logic has been implemented.

## 10. Existing Tests
- `scripts/test-api.ps1`: 20/20 backend E2E tests passing.
- `scripts/test-ai-service.ps1`: 11/11 AI service tests passing.

## 11. Existing Limitations
- **No Machine Learning**: The entire protocol classification pipeline is deterministic string matching.
- **Traffic Inference is missing**: No models exist for classifying traffic types (VoIP, Video, HTTP).
- **Frontend is missing**: Requires complete implementation.

## 12. Components that MUST NOT be rewritten
- The Go backend endpoints and PostgreSQL database schema.
- The deterministic Scapy parser in the Python AI Service.
- The deterministic YAML security rules engine.
- The existing PowerShell test integration scripts.
