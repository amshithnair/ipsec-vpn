# IPsec/IKE VPN Analysis Tool

An intelligent, full-stack packet analysis system designed to ingest, classify, and cryptographically assess IPsec and IKE traffic (PCAP/PCAPNG).

## Architecture

This project is structured as a monorepo containing three core microservices:

1. **Frontend (`apps/frontend/`)**
   - React + Vite SPA using TypeScript.
   - Provides an intuitive UI for uploading PCAPs, viewing deterministic analysis, and exporting compliance reports.
2. **Backend (`apps/backend/`)**
   - Go (Gin) API server.
   - Handles file storage, coordinates jobs, stores analysis results in Postgres, and caches in Redis.
3. **AI Service (`apps/ai-service/`)**
   - Python FastAPI service.
   - Uses `scapy` for packet parsing and runs the deterministic cryptographic analysis model.

---

## Getting Started

### Prerequisites

- **Docker and Docker Compose**: Ensure Docker is installed and running on your system.
- **Node.js (v18+)**: Required if you want to run the frontend locally outside of Docker.
- **Go (1.21+)**: Required if you want to run the backend locally outside of Docker.

### Running the Full Stack (Docker)

The easiest way to start the entire application (Frontend, Go Backend, Python AI Service, Postgres, and Redis) is via Docker Compose:

```bash
docker-compose up --build
```

**Services will be available at:**
- **Frontend UI**: `http://localhost:3000`
- **Go Backend API**: `http://localhost:8080/api/v1/health`
- **Python AI Service**: `http://localhost:8000/health`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`

### Local Development (Without Docker for Frontend)

If you prefer to run the frontend locally for development (with hot-reloading), while keeping the backend services in Docker:

1. Start the backend services:
   ```bash
   docker-compose up backend ai-service db redis
   ```
2. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd apps/frontend
   ```
3. Install dependencies and start the Vite dev server:
   ```bash
   npm install
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000` and will proxy API requests to `http://localhost:8080`.

---

## Testing the System

### E2E Flow

1. Open `http://localhost:3000` in your browser.
2. Click **Upload PCAP**.
3. Select a `.pcap` or `.pcapng` file containing IPsec/IKE traffic. (You can generate one using `tcpdump` or Wireshark, or use a sample IPsec PCAP).
4. Wait for the upload and analysis to complete.
5. Review the **Security Assessment** and **Technical Details**.
6. Generate and download the **Technical Report**.

### Test Scripts

The `scripts/` directory contains tools for generating PCAPs and testing the backend API directly:

- **Generate Sample PCAPs (`scripts/generate_pcaps.py`)**:
  Generates synthetic strong and weak IPsec PCAP files for testing the AI service's deterministic ruleset.
  ```bash
  cd scripts
  python3 -m venv venv
  source venv/bin/activate  # On Windows: venv\Scripts\activate
  pip install -r requirements.txt
  python generate_pcaps.py
  ```

- **E2E API Test (`scripts/test_e2e.py`)**:
  Uploads a PCAP to the Go backend API, polls for completion, and prints the full analysis result.
  ```bash
  python test_e2e.py ../tests/fixtures/strong_ipsec.pcap
  ```

---

## Design & Implementation Details

- **Deterministic Analysis**: The Python AI service does not use LLMs to guess protocols. It uses a strictly deterministic ruleset against `scapy` packet fields to classify IKE versions, encryption algorithms, and security postures against NIST guidelines.
- **Frontend Design System**: The frontend uses a custom, CSS-variable-based design system (`apps/frontend/src/index.css`) for consistent typography, colors, and layout components without relying on heavy UI libraries.
- **Data Contracts**: The TypeScript interfaces in `apps/frontend/src/types/index.ts` strictly mirror the JSON models defined in `apps/backend/internal/models/models.go`.
