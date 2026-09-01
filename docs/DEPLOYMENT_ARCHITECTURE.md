# IPsec Security Intelligence Platform — Architecture & Deployment Guide

## 1. System Overview

The **IPsec Security Intelligence Platform** transforms encrypted network traffic into explainable security intelligence without requiring payload decryption. It evaluates cryptographic configurations against NIST SP 800-131A standards, detects flow anomalies using Isolation Forests, and classifies traffic profiles using Random Forest models.

```
+-------------------------------------------------------------------------+
|                           BROWSER (React + Vite)                        |
|   Dashboard | Posture | Investigations | Remediation | Models | Demo    |
+------------------------------------+------------------------------------+
                                     |  HTTP (JSON) on :3000 / :8080
                                     v
+-------------------------------------------------------------------------+
|                         GO BACKET REST API (Port 8080)                  |
|  - Capture ingestion & storage       - Security Posture Aggregator      |
|  - Analysis lifecycle coordinator    - Remediation Engine               |
|  - Capture Comparison Matrix Engine  - Model Registry Proxy             |
+-------------------+--------------------------------+--------------------+
                    |                                |
        gRPC / HTTP | :8000                          | PostgreSQL (SQL/JSONB)
                    v                                v
+------------------------------------+  +---------------------------------+
|     PYTHON AI SERVICE (Port 8000)  |  |    POSTGRESQL 16 (Port 5432)    |
| - Scapy & TShark Protocol Parser   |  | - captures                      |
| - NIST SP 800-131A Rules Engine    |  | - classifications               |
| - Isolation Forest Anomaly Engine  |  | - security_assessments          |
| - Random Forest Classifier         |  | - anomaly_results (JSONB)       |
| - Transparent Model Card Registry  |  | - analysis_jobs                 |
| - Standalone HTML Report Generator |  | - reports                       |
+------------------------------------+  +---------------------------------+
```

---

## 2. Strict Architectural Boundaries

1. **Browser Boundary**: The React frontend communicates **exclusively** with the Go REST API (`http://localhost:8080/api/v1`).
2. **AI Service Isolation**: The Python AI service runs as an internal compute worker (`http://ai-service:8000`), invoked by Go background jobs.
3. **Data Integrity & Provenance**:
   - Every result is tagged with an explicit origin (`DETERMINISTIC`, `RULE_BASED`, `ML_CLASSIFIER`, `ML_ANOMALY`, `HYBRID_RISK`).
   - Baseline ML models are marked `"Development / Synthetic-Data Validated"`.
   - Never fabricates packet data or scores.

---

## 3. Database Schema Overview

| Table | Purpose |
|-------|---------|
| `captures` | Stores PCAP upload metadata, file paths, packet counts, durations |
| `classifications` | Parsed IKE/ESP parameters (ciphers, auth, DH group, PFS, raw JSON features) |
| `security_assessments` | NIST compliance findings, risk scores (0-100), crypto scores, recommendations |
| `anomaly_results` | Isolation Forest behavioral anomaly scores, status, top Z-score contributing signals |
| `analysis_jobs` | Background task orchestration and stage tracking |
| `reports` | Pre-rendered technical HTML reports with cryptographic matrices |

---

## 4. API Endpoints Reference

### Captures & Analysis
- `POST /api/v1/captures/upload` — Ingest `.pcap` or `.pcapng` file.
- `GET /api/v1/captures` — List all ingested captures.
- `POST /api/v1/analysis/start/:id` — Start full analysis job.
- `GET /api/v1/analysis/results/:id` — Get unified classification and assessment.

### Security Posture & Remediation
- `GET /api/v1/posture` — Aggregated organizational security posture score, cipher adoption, and findings.
- `GET /api/v1/remediation` — Actionable hardening recommendations grouped by priority.
- `GET /api/v1/anomalies/:id` — Behavioral anomaly assessment and feature deviations.
- `GET /api/v1/compare?base=:id1&target=:id2` — Side-by-side Before/After configuration matrix and risk score delta.

### Model Transparency & Demo Lab
- `GET /api/v1/models` — Query Model Registry cards and synthetic validation limitations.
- `GET /api/v1/demo/scenarios` — List interactive demo scenarios.
- `POST /api/v1/reports/generate/:id` — Generate printable/downloadable HTML technical intelligence report.

---

## 5. Local Development & Startup

```bash
# 1. Start backend infrastructure and AI services
docker compose up -d --build

# 2. Start frontend dev server
cd apps/frontend
npm install
npm run dev
```

Platform URL: `http://localhost:3000`  
Go API URL: `http://localhost:8080/api/v1`
