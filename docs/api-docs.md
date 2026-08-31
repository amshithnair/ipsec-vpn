# IPSEC-VPN — API Documentation

This document outlines the REST API exposed by the Go Backend to the Frontend.

**Base URL**: `http://localhost:8080/api/v1`

---

## 1. Captures

### `POST /captures/upload`
Uploads a new PCAP file for analysis.
- **Request Body**: `multipart/form-data` with key `file`.
- **Response**: `201 Created`
```json
{
  "id": "uuid",
  "filename": "capture.pcap",
  "file_size": 1048576,
  "status": "uploaded",
  "created_at": "2026-09-01T00:00:00Z"
}
```

### `GET /captures`
Lists all captures with pagination.
- **Query Params**: `limit` (default: 20), `offset` (default: 0)
- **Response**: `200 OK`
```json
{
  "count": 1,
  "captures": [
    {
      "id": "uuid",
      "filename": "capture.pcap",
      "status": "analyzed"
    }
  ]
}
```

### `GET /captures/:id`
Gets details of a specific capture.

### `DELETE /captures/:id`
Deletes a capture and its associated data/file.

---

## 2. Analysis

### `POST /analysis/start/:id`
Triggers the AI analysis pipeline for an uploaded capture.
- **Response**: `202 Accepted`
```json
{
  "id": "job_uuid",
  "capture_id": "uuid",
  "status": "pending"
}
```

### `GET /analysis/status/:id`
Checks the progress of an analysis job.
- **Response**: `200 OK`
```json
{
  "id": "job_uuid",
  "status": "processing",
  "progress": 60
}
```

### `GET /analysis/results/:id`
Retrieves the full aggregated analysis results (classification + security assessment).
- **Response**: `200 OK`
```json
{
  "capture_id": "uuid",
  "classification": {
    "protocol_detected": "IPsec",
    "ike_version": "2.0",
    "encryption_algo": "AES-256-GCM"
  },
  "security_assessment": {
    "risk_score": 10,
    "severity": "LOW",
    "crypto_strength": 95,
    "findings": [],
    "recommendations": []
  }
}
```

---

## 3. Classification & Security

### `GET /classification/:id`
Retrieves only the protocol classification data.

### `GET /security/:id`
Retrieves only the security assessment data (findings, recommendations, risk score).

---

## 4. Reports

### `POST /reports/generate/:id`
Generates a comprehensive HTML report from the analysis results.
- **Response**: `201 Created`
```json
{
  "report_id": "report_uuid",
  "format": "html"
}
```

### `GET /reports/:id`
Retrieves report metadata or raw HTML (if `Accept: text/html` is passed).

### `GET /reports/:id/download`
Downloads the generated HTML report.

---

## 5. Dashboard

### `GET /dashboard/summary`
Retrieves aggregated statistics for the frontend dashboard.
- **Response**: `200 OK`
```json
{
  "total_captures": 15,
  "total_analyses": 15,
  "average_risk_score": 34.5,
  "severity_counts": {
    "LOW": 10,
    "HIGH": 3,
    "CRITICAL": 2
  },
  "recent_analyses": [
    {
      "capture_id": "uuid",
      "filename": "site-to-site.pcap",
      "risk_score": 10,
      "severity": "LOW"
    }
  ]
}
```
