# 🛡️ IPsec/IKE VPN Security Analysis & Auditing Platform

[![Go Version](https://img.shields.io/badge/Go-1.23-00ADD8?style=flat&logo=go)](https://go.dev/)
[![Python Version](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python)](https://python.org/)
[![React Version](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat&logo=redis)](https://redis.io/)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)](https://www.docker.com/)

A modern, enterprise-grade network security analysis platform designed to ingest, dissect, classify, and audit **IPsec (ESP/AH)** and **IKE (v1/v2)** packet captures (`.pcap`, `.pcapng`, `.cap`). Built with a hybrid engine combining deterministic RFC/NIST cryptographic compliance evaluation, machine learning traffic inference, and statistical anomaly detection with full model provenance.

---

## 📑 Table of Contents

- [Overview & Key Features](#-overview--key-features)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Quickstart with Docker Compose](#quickstart-with-docker-compose-recommended)
  - [Hybrid Local Development (Frontend HMR + Containerized Services)](#hybrid-local-development)
  - [Bare-Metal Local Setup (Manual)](#bare-metal-local-setup-manual)
- [Configuration & Environment Variables](#-configuration--environment-variables)
- [REST API Reference](#-rest-api-reference)
- [Analysis Engine & Method Attribution](#-analysis-engine--method-attribution)
- [Compliance & Security Standards](#-compliance--security-standards)
- [Testing & Synthetic PCAP Generation](#-testing--synthetic-pcap-generation)
- [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 🌟 Overview & Key Features

Modern enterprise networks rely on IPsec tunnels for zero-trust perimeter defense and site-to-site connectivity. However, configuration drift, legacy ciphers (3DES, MD5, DH Groups 1/2), missing Perfect Forward Secrecy (PFS), and disabled replay protection leave infrastructure vulnerable to eavesdropping, Logjam, Sweet32, and replay attacks.

This platform provides automated, deep packet-level cryptographic visibility:

- 🔍 **Deterministic Protocol Dissection**: Deep packet inspection of IKEv1/IKEv2 exchanges (ISAKMP Security Associations, Proposals, Transforms, Key Exchanges, Nonces, Vendor IDs) and ESP/AH encapsulation headers via Scapy.
- ⚖️ **NIST-Aligned Cryptographic Auditing**: Evaluates cipher suites against NIST SP 800-77 Rev 1, CNSA Suite, and RFC specifications. Computes granular 0–100 risk scores with weighted penalties across encryption, authentication, DH key exchange, protocol version, and SA configuration.
- 🤖 **Hybrid ML Traffic Inference & Anomaly Detection**:
  - **Random Forest Classifier**: Classifies encrypted tunnel traffic profiles (VoIP, interactive shell, bulk data transfer).
  - **Isolation Forest Anomaly Detector**: Detects out-of-distribution traffic burstiness, packet length variance anomalies, and potential tunnel data exfiltration.
- 🏷️ **Strict Model Transparency & Provenance**: Every security finding and traffic metric is explicitly tagged with its origin (`DETERMINISTIC_RULES`, `ML_TRAFFIC_INFERENCE`, or `ML_ANOMALY`) and linked to registered Model Cards.
- 📊 **Interactive Investigation Workspace**:
  - Real-time ESP sequence number continuity and anti-replay window inspection.
  - SPI (Security Parameter Index) session tracking and lifetime breakdown.
  - Security posture distribution and threat matrix mapping.
- 🔄 **Capture Comparison Diff Engine**: Side-by-side visual diffing of two captures to verify migration outcomes, cipher deprecations, and configuration drift.
- 🛠️ **Remediation Center & Playbooks**: Generates ready-to-deploy configuration snippets and hardening commands for Cisco ASA, strongSwan, Fortinet FortiOS, and Linux `ip xfrm`.
- 📑 **Exportable Compliance Reports**: Generates standalone, printable HTML technical audit reports ready for stakeholders and compliance officers.
- 🧪 **Built-in Demo Lab**: Includes simulated capture scenarios (Legacy Weak, Mixed Enterprise, Hardened Suite-B, and Anomalous Flow) for zero-configuration testing.

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph Host["Host Machine / Client Tier"]
        UI["React 19 SPA (Vite + TypeScript)<br/><code>http://localhost:3000</code>"]
    end

    subgraph Docker["🐳 Docker Platform (Docker Compose Orchestration / Network: ipsecvpn-net)"]
        subgraph BackendContainer["ipsecvpn-backend (Container)"]
            API["Go 1.23 Gin API Gateway<br/>Exposed: :8080"]
        end

        subgraph AIContainer["ipsecvpn-ai-service (Container)"]
            AI["Python 3.11 FastAPI Service<br/>Exposed: :8000"]
            SCAP["Scapy PCAP Dissector"]
            RE["Deterministic Rules Engine<br/>(NIST SP 800-77 / RFC 7296)"]
            ML["ML Pipeline<br/>(Random Forest + Isolation Forest)"]
            REP["Jinja2 Report Generator"]

            AI --> SCAP
            SCAP --> RE
            SCAP --> ML
            RE & ML --> REP
        end

        subgraph StorageContainers["Database & In-Memory Cache Containers"]
            PG[("ipsecvpn-postgres (PostgreSQL 16)<br/>Port: 5432<br/>Volume: postgres_data")]
            RD[("ipsecvpn-redis (Redis 7)<br/>Port: 6379<br/>Volume: redis_data")]
        end

        VOL[("📁 Shared Docker Bind Mounts<br/>./uploads (PCAP Storage) & ./rules (YAML Policies)")]
    end

    UI -->|"HTTP REST / Multipart Upload (:8080)"| API
    API -->|"pgx Connection Pool"| PG
    API -->|"go-redis Cache & Queue"| RD
    API -->|"Internal Bridge HTTP (http://ai-service:8000)"| AI
    AI -->|"Analysis & Risk Assessment"| API
    BackendContainer -.->|"Read/Write"| VOL
    AIContainer -.->|"Read/Write"| VOL
```

### Microservice & Container Breakdown

| Service / Container | Docker Image / Base | Host Port | Internal Network | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend UI** | Node.js 20 / Vite | `3000` | Host / Proxy | Responsive SOC/NOC dashboard, packet timeline inspection, visual diff, and report generator. |
| **`ipsecvpn-backend`** | `golang:1.23-alpine` (Multi-stage) | `8080` | `ipsecvpn-net` | Go Gin API gateway, job coordinator, relational storage queries, and AI service proxy. |
| **`ipsecvpn-ai-service`** | `python:3.11-slim` + `libpcap` | `8000` | `ipsecvpn-net` | Protocol dissection via Scapy, NIST rules evaluation, Random Forest / Isolation Forest ML pipelines. |
| **`ipsecvpn-postgres`** | `postgres:16-alpine` | `5432` | `ipsecvpn-net` | Relational storage for PCAP captures, findings, security assessments, and JSONB telemetry. |
| **`ipsecvpn-redis`** | `redis:7-alpine` | `6379` | `ipsecvpn-net` | High-speed cache for job progression states, health checks, and analysis results. |

---

## 💻 Technology Stack

- **Frontend**: React 19, TypeScript 6.0, Vite 8.2, React Router 7, Recharts 3.10, Lucide Icons, Custom CSS Design System (zero heavy runtime CSS overhead).
- **Backend**: Go 1.23, Gin Web Framework 1.10, `pgx/v5` PostgreSQL Driver, `go-redis/v9`, Google UUID.
- **AI & Analytics Engine**: Python 3.11, FastAPI 0.115, Scapy 2.6, scikit-learn 1.5, NumPy 2.0, Pandas 2.2, PyYAML 6.0, Pydantic v2, Jinja2.
- **Infrastructure**: Docker & Docker Compose v2, PostgreSQL 16, Redis 7.

---

## 📁 Repository Structure

```text
.
├── apps/
│   ├── ai-service/              # Python FastAPI analysis microservice
│   │   ├── app/
│   │   │   ├── anomaly/         # Isolation Forest anomaly detection engine
│   │   │   ├── api/             # FastAPI route handlers (/analyze, /models, etc.)
│   │   │   ├── classifier/      # Protocol & Random Forest traffic classifier
│   │   │   ├── models/          # Model registry, schemas, and Pydantic models
│   │   │   ├── parser/          # Scapy PCAP/PCAPNG protocol dissectors
│   │   │   ├── reports/         # Jinja2 HTML report generator templates
│   │   │   ├── scoring/         # Deterministic rules evaluation engine
│   │   │   └── main.py          # FastAPI application entrypoint
│   │   └── requirements.txt     # Python dependencies
│   ├── backend/                 # Go Gin API backend microservice
│   │   ├── cmd/
│   │   │   └── server/          # Main application entrypoint (main.go)
│   │   ├── internal/
│   │   │   ├── api/             # Route registrations
│   │   │   ├── config/          # Environment configuration loader
│   │   │   ├── handlers/        # HTTP controllers (captures, analysis, reports)
│   │   │   ├── models/          # Domain structs & JSON mappings
│   │   │   ├── repository/      # PostgreSQL and Redis persistence queries
│   │   │   └── services/        # Business logic & AI service HTTP client
│   │   ├── go.mod
│   │   └── go.sum
│   └── frontend/                # React 19 Single Page Application
│       ├── src/
│       │   ├── components/      # UI components (Navbar, MetricCards, Charts)
│       │   ├── pages/           # View controllers (Dashboard, Workspace, Diff, Lab)
│       │   ├── services/        # Axios/Fetch API clients
│       │   ├── types/           # TypeScript interfaces matching backend models
│       │   ├── App.tsx          # Router setup
│       │   └── index.css        # Core custom design system tokens
│       ├── package.json
│       └── vite.config.ts
├── infrastructure/
│   ├── docker/                  # Multi-stage Dockerfiles
│   │   ├── ai-service.Dockerfile
│   │   └── backend.Dockerfile
│   └── postgres/
│       └── init.sql             # Database schema, indexes, and extensions
├── rules/
│   └── security-rules.yaml      # NIST/RFC security evaluation ruleset
├── scripts/
│   ├── generate_demo_pcaps.py   # Scapy synthetic PCAP generator (Weak, Strong, Anomaly)
│   ├── test-ai-service.ps1      # Automated PowerShell test suite for AI service
│   └── test-api.ps1             # Automated PowerShell E2E test suite for Go API
├── .env.example                 # Example environment configuration
├── docker-compose.yml           # Multi-container orchestration definition
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Docker & Docker Compose**: Docker Desktop 4.20+ (with Compose v2)
- **Node.js**: `v18.x` or `v20.x+` *(only for non-Docker frontend development)*
- **Go**: `1.22+` *(only for non-Docker backend development)*
- **Python**: `3.10+` *(only for non-Docker AI service development)*

---

### Quickstart with Docker Compose (Recommended)

Start all services (PostgreSQL, Redis, AI Service, and Go Backend) with a single command:

1. **Clone the repository and prepare environment variables**:
   ```bash
   git clone https://github.com/amshithnair/ipsec-vpn.git
   cd ipsec-vpn
   cp .env.example .env
   ```

2. **Launch the stack**:
   ```bash
   docker compose up -d --build
   ```

3. **Verify container health**:
   ```bash
   docker compose ps
   ```

4. **Access the application**:
   - **Go Backend API**: `http://localhost:8080/api/v1/health`
   - **Python AI Service**: `http://localhost:8000/health`
   - **PostgreSQL**: `localhost:5432`
   - **Redis**: `localhost:6379`

---

### Hybrid Local Development

For the fastest developer loop (hot-module reloading for the React UI while keeping microservices containerized):

1. **Start backend services in Docker**:
   ```bash
   docker compose up -d postgres redis ai-service backend
   ```

2. **Start the Frontend development server**:
   ```bash
   cd apps/frontend
   npm install
   npm run dev
   ```

3. Open **`http://localhost:3000`** in your browser. All API calls will automatically proxy to `http://localhost:8080`.

---

### Bare-Metal Local Setup (Manual)

<details>
<summary>Click to view step-by-step instructions for running without Docker</summary>

#### 1. PostgreSQL & Redis
Ensure PostgreSQL 16 is running with a database named `ipsecvpn` and run the migration in `infrastructure/postgres/init.sql`. Ensure Redis is running on port `6379`.

#### 2. Python AI Service
```bash
cd apps/ai-service
python -m venv venv
# Linux / macOS
source venv/bin/activate
# Windows
.\venv\Scripts\Activate.ps1

pip install -r requirements.txt
export RULES_PATH=../../rules/security-rules.yaml
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 3. Go Backend
```bash
cd apps/backend
export DATABASE_URL="postgresql://ipsecvpn:ipsecvpn_secret_2026@localhost:5432/ipsecvpn?sslmode=disable"
export REDIS_URL="redis://localhost:6379/0"
export AI_SERVICE_URL="http://localhost:8000"
export UPLOAD_DIR="./uploads"
export PORT="8080"
go run cmd/server/main.go
```

#### 4. React Frontend
```bash
cd apps/frontend
npm install
npm run dev
```

</details>

---

## ⚙️ Configuration & Environment Variables

The project reads configurations from `.env` at the root. Key variables include:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `POSTGRES_USER` | `ipsecvpn` | PostgreSQL database user |
| `POSTGRES_PASSWORD` | `ipsecvpn_secret_2026` | PostgreSQL database password |
| `POSTGRES_DB` | `ipsecvpn` | Target database name |
| `DATABASE_URL` | `postgresql://...` | Connection URI for the Go Backend |
| `REDIS_URL` | `redis://redis:6379/0` | Connection URI for Redis caching |
| `BACKEND_PORT` | `8080` | Port exposed by Go Gin API |
| `AI_SERVICE_URL` | `http://ai-service:8000` | Internal URL for backend to reach AI service |
| `AI_SERVICE_PORT` | `8000` | Port exposed by Python FastAPI service |
| `RULES_PATH` | `/app/rules/security-rules.yaml` | Path to the YAML security policy ruleset |
| `MAX_FILE_SIZE` | `52428800` | Max PCAP upload size in bytes (50 MB) |
| `GIN_MODE` | `release` | Gin runtime mode (`debug` or `release`) |
| `VITE_API_URL` | `http://localhost:8080` | Frontend backend API target URL |

---

## 📡 REST API Reference

The Go API Gateway exposes the following unified endpoints:

### Captures & Ingestion
- `POST /api/v1/captures/upload` — Upload a new PCAP/PCAPNG file (multipart/form-data).
- `GET /api/v1/captures` — List all uploaded captures with pagination and status filters.
- `GET /api/v1/captures/:id` — Retrieve metadata and processing state of a specific capture.
- `DELETE /api/v1/captures/:id` — Purge a capture, its analysis results, and stored files.

### Analysis & Security Assessment
- `POST /api/v1/analysis/start/:id` — Trigger full asynchronous analysis for a capture.
- `GET /api/v1/analysis/status/:id` — Poll current job state (`pending`, `processing`, `completed`, `failed`).
- `GET /api/v1/analysis/results/:id` — Fetch complete analysis output (classification, crypto, findings).
- `GET /api/v1/classification/:id` — Protocol, cipher, DH group, and traffic classification results.
- `GET /api/v1/security/:id` — Risk score, compliance breakdown, findings, and recommendations.
- `GET /api/v1/anomalies/:id` — Statistical anomaly metrics and contributing signals.

### Security Posture & Remediation
- `GET /api/v1/posture` — Aggregate security posture across all analyzed captures.
- `GET /api/v1/remediation` — Actionable playbooks and generated vendor CLI scripts.
- `GET /api/v1/compare?base_id=<id>&target_id=<id>` — Side-by-side diff comparing two captures.

### Model Transparency & Demo Lab
- `GET /api/v1/models` — List all active model cards with architecture, version, and training status.
- `GET /api/v1/models/:id` — Detailed specification for a specific model card.
- `GET /api/v1/demo/scenarios` — Load pre-configured synthetic demo scenarios into the workspace.

### Reports & Dashboard
- `POST /api/v1/reports/generate/:id` — Compile a standalone technical audit report.
- `GET /api/v1/reports/:id` — Fetch report metadata and raw HTML payload.
- `GET /api/v1/reports/:id/download` — Download report as an `.html` attachment.
- `GET /api/v1/dashboard/summary` — Global SOC metrics (total packets, avg risk score, cipher distributions).

---

## 🧠 Analysis Engine & Method Attribution

Every metric emitted by the pipeline contains strict provenance attribution to distinguish between formal cryptographic verification and statistical inference:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Analysis Provenance Types                       │
├──────────────────────────┬─────────────────────────────────────────────┤
│ Method Source            │ Description                                 │
├──────────────────────────┼─────────────────────────────────────────────┤
│ DETERMINISTIC_RULES      │ Hard rule matches against NIST SP 800-77,   │
│                          │ RFC 7296, RFC 2409, and parsed packet bytes │
├──────────────────────────┼─────────────────────────────────────────────┤
│ ML_TRAFFIC_INFERENCE     │ Supervised Random Forest classification of  │
│                          │ payload entropy and packet length dynamics  │
├──────────────────────────┼─────────────────────────────────────────────┤
│ ML_ANOMALY               │ Unsupervised Isolation Forest detection of  │
│                          │ out-of-band bursts and flow irregularities  │
└──────────────────────────┴─────────────────────────────────────────────┘
```

### Risk Scoring Formula

The deterministic security score starts at `0` (clean) and accumulates weighted penalties based on findings:

$$\text{Risk Score} = \min\left(100, \sum (\text{Rule Penalty} \times \text{Category Weight})\right)$$

- **Encryption (30% weight)**: NULL (50 pts), DES (40 pts), 3DES (30 pts), CBC mode without AEAD (10 pts).
- **Authentication (25% weight)**: MD5 (35 pts), SHA-1 (25 pts).
- **Key Exchange (20% weight)**: DH Group 1 (35 pts), DH Group 2 (30 pts), DH Group 5 (15 pts).
- **Protocol Version (15% weight)**: IKEv1 (25 pts), IKEv2 (0 pts).
- **Configuration (10% weight)**: Missing PFS (20 pts), Missing Anti-Replay (15 pts).

---

## 📜 Compliance & Security Standards

The platform evaluates configurations against industry cryptographic standards:

- **NIST SP 800-77 Rev. 1**: Guide to IPsec VPNs.
- **NIST SP 800-131A Rev. 2**: Transitioning the Use of Cryptographic Algorithms and Key Lengths.
- **RFC 7296**: Internet Key Exchange Protocol Version 2 (IKEv2).
- **RFC 8221**: Cryptographic Algorithm Implementation Requirements for ESP and AH.
- **NSA Commercial National Security Algorithm (CNSA) Suite 1.0 & 2.0**.

---

## 🧪 Testing & Synthetic PCAP Generation

### 1. Generating Test Captures

Use the bundled generator script to synthesize realistic test PCAP files representing different security postures:

```bash
# Set up Python environment
cd apps/ai-service
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
pip install -r requirements.txt

# Run generator
cd ../../scripts
python generate_demo_pcaps.py
```

Generated files in `data/demo_pcaps/`:
- `legacy_weak_ikev1.pcap` — 3DES-CBC + MD5 + DH Group 2 + IKEv1 (Critical Risk).
- `modern_secure_ikev2.pcap` — AES-256-GCM + SHA-384 + DH Group 19 (ECDH) + IKEv2 (Clean / Low Risk).
- `mixed_enterprise.pcap` — AES-128-CBC + SHA-1 + DH Group 14 + IKEv2 (Medium Risk).
- `anomaly_burst_tunnel.pcap` — Synthetic flow with artificial jitter and burst patterns (Triggers Isolation Forest).

### 2. Running Automated E2E Test Suite (PowerShell)

Validate the full end-to-end flow against a running Docker stack:

```powershell
# Run backend API tests
.\scripts\test-api.ps1

# Run AI service isolated tests
.\scripts\test-ai-service.ps1
```

---

## 🔧 Troubleshooting & FAQ

<details>
<summary><b>1. Docker build fails with "attribute version is obsolete"</b></summary>
Docker Compose v2 treats the <code>version: "3.8"</code> key as obsolete. It is safely ignored by modern Docker engines and does not impact functionality.
</details>

<details>
<summary><b>2. PCAP upload returns 413 "File Too Large"</b></summary>
The maximum upload limit is configured via <code>MAX_FILE_SIZE</code> (default 50MB). To support larger captures, increase this value in your <code>.env</code> file and restart the backend container.
</details>

<details>
<summary><b>3. Scapy fails to parse specific custom encapsulated packets</b></summary>
Ensure the capture contains valid IPsec headers on UDP port 500 (IKE), UDP port 4500 (NAT-T), or IP protocol 50 (ESP) / 51 (AH). Captures on non-standard ports can be remapped prior to analysis.
</details>

---

## 📄 License

This project is licensed under the **MIT License**. See `LICENSE` for details.
