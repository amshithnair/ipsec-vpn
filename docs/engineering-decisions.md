# Architecture & Engineering Decisions Record (ADR)

## ADR 001: Monorepo Structure & Service Separation
**Date:** 2026-08-31
**Status:** Accepted

**Context:** The system needs a Go backend for orchestration and a Python service for AI/ML and Scapy processing.
**Decision:** We adopted a monorepo structure. The Go backend acts as the single entry point for the frontend, handling all persistence, job orchestration, and caching. The Python service is completely isolated and stateless, handling only heavy computation (PCAP parsing via Scapy, ML classification, rule evaluation).
**Consequences:**
- Frontend only needs to know one API contract (Go).
- Go backend protects Python service from overwhelming concurrent PCAP uploads.
- We avoid Python GIL limitations in the API layer.

## ADR 002: Deterministic Rules Engine for MVP
**Date:** 2026-08-31
**Status:** Accepted

**Context:** We need to generate a security assessment based on cryptographic primitives detected in the PCAP.
**Decision:** Instead of using an LLM to generate the risk score (which is slow, non-deterministic, and prone to hallucinations), we implemented a deterministic YAML-based Rules Engine in the Python service. The engine maps algorithmic matches (e.g., "AES-256") to specific, predefined severity penalties (e.g., "AES-128 is LOW risk, 3DES is CRITICAL risk").
**Consequences:**
- 100% reproducible security scores.
- Lightning fast evaluation.
- Easy to audit and update via `security-rules.yaml`.

## ADR 003: Scapy for PCAP Parsing
**Date:** 2026-08-31
**Status:** Accepted

**Context:** We need to extract IKE and ESP data from raw packet captures.
**Decision:** We used Scapy because of its extensive protocol support. However, we also implemented manual fallback byte-parsing for IKEv1/v2 payload extraction where Scapy's built-in IKE dissectors are incomplete or fail to parse deeply nested payloads (like SA transforms).
**Consequences:**
- Robust parsing even for malformed or proprietary IPsec extensions.

## ADR 004: Asynchronous Job Orchestration
**Date:** 2026-08-31
**Status:** Accepted

**Context:** PCAP analysis can take several seconds to minutes depending on file size.
**Decision:** We implemented an async job orchestration pattern in the Go backend.
1. `POST /analysis/start/:id` returns a 202 Accepted and a Job ID.
2. The Go backend runs a goroutine that calls the Python AI service.
3. The Frontend polls `GET /analysis/status/:id` to track progress.
**Consequences:**
- API remains responsive.
- No HTTP timeout issues on large PCAPs.

## ADR 005: PostgreSQL + Redis Stack
**Date:** 2026-08-31
**Status:** Accepted

**Context:** Data needs to be persisted and retrieved quickly.
**Decision:** 
- **PostgreSQL 16** is the primary source of truth (captures, jobs, results, reports).
- **Redis** is used as a read-through cache for the full analysis results, ensuring the dashboard and reports load instantly without complex SQL joins every time.
**Consequences:**
- Strong data integrity via Postgres constraints.
- High performance reads via Redis.
