// ============================================================
//  Centralized API client — all backend communication
//  Proxied via Vite dev server → Go backend on :8080
// ============================================================

import type {
  DashboardSummary,
  CaptureListItem,
  Capture,
  Classification,
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

  let captureObj: any = null;
  try {
    captureObj = await request(`/captures/${captureId}`);
  } catch {
    // Graceful fallback if capture meta not directly queryable
  }

  const rawCls = result.classification || {};
  const rawCrypto = result.crypto_analysis || {};
  const rawMeta = result.metadata || {};
  const rawSecurity = result.security_assessment || result.security || {};

  const mappedSecurity = mapSecurityData(rawSecurity) || {
    risk_score: 0,
    severity: 'LOW',
    crypto_strength_score: 100,
    findings: [],
    recommendations: [],
    method_source: 'HYBRID_RISK',
  };

  const fullCapture: Capture = {
    id: captureId,
    filename: captureObj?.filename || rawMeta.filename || `${captureId.substring(0, 8)}.pcap`,
    file_size: captureObj?.file_size || rawMeta.file_size_bytes,
    status: captureObj?.status || result.status || 'analyzed',
    created_at: captureObj?.created_at || result.timestamp || new Date().toISOString(),
    packet_count: captureObj?.packet_count || rawMeta.packets_analyzed || rawMeta.ipsec_packets,
    duration_seconds: captureObj?.duration_seconds || rawMeta.capture_duration_seconds,
  };

  const fullClassification: Classification = {
    protocol: rawCls.protocol || 'IPsec',
    protocol_confidence: rawCls.protocol_confidence ?? result.confidence?.classification_confidence ?? 0.9,
    ike_version: rawCls.ike_version || null,
    mode: rawCls.ipsec_mode || rawCls.mode || 'tunnel',
    encryption_algo: rawCrypto.encryption?.algorithm || rawCls.encryption_algo || 'Unknown',
    auth_algo: rawCrypto.authentication?.algorithm || rawCls.auth_algo || 'Unknown',
    dh_group: rawCrypto.dh_group?.group_number || rawCls.dh_group || null,
    pfs_detected: rawCrypto.pfs?.detected ?? rawCls.pfs_detected ?? null,
    replay_protection: rawCls.replay_protection ?? null,
    sa_lifetime_seconds: rawCls.sa_lifetime_seconds || null,
    confidence_score: result.confidence?.overall_score ?? rawCls.confidence_score ?? 0.85,
    traffic_inference: rawCls.traffic_inference || null,
    method_source: rawCls.method_source || 'DETERMINISTIC',
  };

  return {
    capture: fullCapture,
    classification: fullClassification,
    security: mappedSecurity,
    anomaly_assessment: result.anomaly_assessment || null,
  };
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
  const full = await fetchAnalysisResults(captureId);

  return {
    capture: full.capture,
    ike: {
      version: full.classification.ike_version || null,
      exchange_type: null,
      dh_group: full.classification.dh_group || null,
      nonce_length: null,
      initiator_identity: null,
      responder_identity: null,
      proposals: [
        {
          encryption: full.classification.encryption_algo || 'Unknown',
          auth: full.classification.auth_algo || 'Unknown',
          dh_group: full.classification.dh_group || 0,
        },
      ],
    },
    esp_ah: {
      protocol_used: (full.classification.mode as any) || 'ESP',
      spi: null,
      sequence_numbers: null,
      icv_length: null,
      padding_detected: null,
      next_header: null,
    },
    flow_stats: full.capture.duration_seconds
      ? {
          flow_duration_seconds: full.capture.duration_seconds,
          byte_volume: full.capture.file_size,
          packet_size_avg: full.capture.file_size && full.capture.packet_count ? full.capture.file_size / full.capture.packet_count : null,
        }
      : null,
    raw_features: null,
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

