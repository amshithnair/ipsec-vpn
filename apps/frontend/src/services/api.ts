// ============================================================
//  Centralized API client — all backend communication
//  Proxied via Vite dev server → Go backend on :8080
// ============================================================

import type {
  DashboardSummary,
  CaptureListItem,
  UploadResponse,
  AnalysisStatus,
  FullAnalysis,
  SecurityAssessment,
  AnomalyAssessment,
  SecurityPostureSummary,
  RemediationItem,
  CaptureComparison,
  ModelCard,
  DemoScenario,
  TechnicalDetails,
  ReportMeta,
} from '@/types';

const BASE = '/api/v1';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, init);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Dashboard ──────────────────────────────────────────────
export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const raw: any = await request('/dashboard/summary');
  return {
    total_captures: raw.total_captures || 0,
    analyzed: raw.total_analyses || 0,
    high_risk: raw.severity_counts?.['HIGH'] || 0,
    critical: raw.severity_counts?.['CRITICAL'] || 0,
    anomalies_count: raw.anomalies_count || 0,
    avg_crypto_score: raw.avg_crypto_score || 0,
    risk_distribution: {
      low: raw.severity_counts?.['LOW'] || 0,
      medium: raw.severity_counts?.['MEDIUM'] || 0,
      high: raw.severity_counts?.['HIGH'] || 0,
      critical: raw.severity_counts?.['CRITICAL'] || 0,
    },
    recent_captures: (raw.recent_analyses || []).map((c: any) => ({
      id: c.capture_id,
      filename: c.filename,
      protocol: 'IPsec',
      risk_score: c.risk_score,
      severity: c.severity,
      anomaly_score: c.anomaly_score,
      is_anomalous: c.is_anomalous,
      status: 'completed',
      created_at: c.created_at,
    }))
  };
}

// ── Captures ───────────────────────────────────────────────
export async function fetchCaptures(): Promise<CaptureListItem[]> {
  const raw: any = await request('/captures');
  return raw.captures || [];
}

export async function fetchCapture(id: string): Promise<CaptureListItem> {
  return request(`/captures/${id}`);
}

export async function deleteCapture(id: string): Promise<void> {
  return request(`/captures/${id}`, { method: 'DELETE' });
}

// ── Upload ─────────────────────────────────────────────────
export async function uploadPcap(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return request('/captures/upload', {
    method: 'POST',
    body: formData,
  });
}

// ── Analysis ───────────────────────────────────────────────
export async function startAnalysis(captureId: string): Promise<AnalysisStatus> {
  return request(`/analysis/start/${captureId}`, { method: 'POST' });
}

export async function fetchAnalysisStatus(captureId: string): Promise<AnalysisStatus> {
  return request(`/analysis/status/${captureId}`);
}

const mapSecurityData = (securityData: any) => {
  if (!securityData) return securityData;
  return {
    ...securityData,
    method_source: securityData.method_source || 'HYBRID_RISK',
    findings: (securityData.findings || []).map((f: any) => ({
      ...f,
      explanation: f.description || f.explanation || 'Observed cryptographic configuration item.',
      impact: f.impact || f.category || 'Security risk',
      source: f.source || 'RULE_BASED'
    })),
    recommendations: (securityData.recommendations || []).map((r: any) => ({
      ...r,
      description: r.description || r.action || 'Configuration hardening recommended.'
    }))
  };
};

export async function fetchAnalysisResults(captureId: string): Promise<FullAnalysis> {
  const result: any = await request(`/analysis/results/${captureId}`);
  if (result.security) {
    result.security = mapSecurityData(result.security);
  }
  return result as FullAnalysis;
}

// ── Classification ─────────────────────────────────────────
export async function fetchClassification(captureId: string) {
  return request(`/classification/${captureId}`);
}

// ── Security Assessment ────────────────────────────────────
export async function fetchSecurityAssessment(captureId: string): Promise<SecurityAssessment> {
  const raw: any = await request(`/security/${captureId}`);
  return mapSecurityData(raw) as SecurityAssessment;
}

// ── Behavioral Anomalies ───────────────────────────────────
export async function fetchAnomalies(captureId: string): Promise<AnomalyAssessment> {
  return request(`/anomalies/${captureId}`);
}

// ── Security Posture ───────────────────────────────────────
export async function fetchSecurityPosture(): Promise<SecurityPostureSummary> {
  return request('/posture');
}

// ── Remediation Center ─────────────────────────────────────
export async function fetchRemediations(): Promise<RemediationItem[]> {
  const raw: any = await request('/remediation');
  return raw.remediations || [];
}

// ── Capture Comparison ─────────────────────────────────────
export async function fetchCaptureComparison(baseId: string, targetId: string): Promise<CaptureComparison> {
  return request(`/compare?base=${encodeURIComponent(baseId)}&target=${encodeURIComponent(targetId)}`);
}

// ── Model Registry ─────────────────────────────────────────
export async function fetchModels(): Promise<ModelCard[]> {
  const raw: any = await request('/models');
  return raw.models || [];
}

export async function fetchModelCard(modelId: string): Promise<ModelCard> {
  return request(`/models/${modelId}`);
}

// ── Demo Lab ───────────────────────────────────────────────
export async function fetchDemoScenarios(): Promise<DemoScenario[]> {
  const raw: any = await request('/demo/scenarios');
  return raw.scenarios || [];
}

// ── Technical ──────────────────────────────────────────────
export async function fetchTechnicalDetails(captureId: string): Promise<TechnicalDetails> {
  const result: any = await request(`/analysis/results/${captureId}`);
  const raw = result.classification?.raw_features || {};
  const cls = raw.classification || {};
  const crypto = raw.crypto_analysis || {};

  return {
    capture: result.capture,
    ike: {
      version: cls.ike_version || null,
      exchange_type: null,
      dh_group: crypto.dh_group?.group_number || null,
      nonce_length: null,
      initiator_identity: null,
      proposals: [
        {
          encryption: crypto.encryption?.algorithm || 'Unknown',
          auth: crypto.authentication?.algorithm || 'Unknown',
          dh_group: crypto.dh_group?.group_number || 0
        }
      ]
    },
    esp_ah: {
      protocol_used: cls.ipsec_mode || 'ESP',
      spi: null,
      sequence_numbers: null,
      icv_length: null,
      padding_detected: null,
      next_header: null
    },
    flow_stats: null,
    raw_features: raw
  };
}

// ── Reports ────────────────────────────────────────────────
export async function generateReport(captureId: string): Promise<ReportMeta> {
  return request(`/reports/generate/${captureId}`, { method: 'POST' });
}

export async function fetchReport(id: string): Promise<ReportMeta> {
  return request(`/reports/${id}`);
}

export function getReportDownloadUrl(id: string): string {
  return `${BASE}/reports/${id}/download`;
}
