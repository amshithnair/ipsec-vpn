// ============================================================
//  Shared TypeScript types — mirrors Go API response contracts
// ============================================================

// ── Severity & Status ──────────────────────────────────────
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CaptureStatus = 'uploaded' | 'processing' | 'completed' | 'failed';
export type AnalysisStage =
  | 'upload'
  | 'validate'
  | 'parse'
  | 'feature_extraction'
  | 'classify'
  | 'security_assessment'
  | 'report';

// ── Dashboard ──────────────────────────────────────────────
export interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface RecentCapture {
  id: string;
  filename: string;
  protocol: string;
  risk_score: number;
  severity: Severity;
  status: CaptureStatus;
  analyzed_at?: string;
  created_at: string;
}

export interface DashboardSummary {
  total_captures: number;
  analyzed: number;
  high_risk: number;
  critical: number;
  risk_distribution: RiskDistribution;
  recent_captures: RecentCapture[];
}

// ── Capture ────────────────────────────────────────────────
export interface Capture {
  id: string;
  filename: string;
  file_size?: number;
  status: CaptureStatus;
  created_at: string;
  analyzed_at?: string;
  source?: string;
  capture_start?: string;
  capture_end?: string;
  duration_seconds?: number;
  packet_count?: number;
}

export interface CaptureListItem {
  id: string;
  filename: string;
  protocol: string;
  risk_score: number;
  severity: Severity;
  status: CaptureStatus;
  analyzed_at?: string;
  created_at: string;
}

// ── Upload ─────────────────────────────────────────────────
export interface UploadResponse {
  id: string;
  filename: string;
  status: CaptureStatus;
}

// ── Analysis Status ────────────────────────────────────────
export interface AnalysisStatus {
  status: CaptureStatus;
  stage: AnalysisStage;
  progress: number;
  error_message?: string;
}

// ── Classification ─────────────────────────────────────────
export interface Classification {
  protocol: string;
  protocol_confidence: number;
  ike_version: string | null;
  mode: string | null;
  encryption_algo: string | null;
  auth_algo: string | null;
  dh_group: number | null;
  pfs_detected: boolean | null;
  replay_protection: boolean | null;
  sa_lifetime_seconds: number | null;
  confidence_score: number;
}

// ── Security Finding ───────────────────────────────────────
export interface SecurityFinding {
  id: string;
  title: string;
  severity: Severity;
  explanation: string;
  impact: string;
  cve?: string;
}

// ── Recommendation ─────────────────────────────────────────
export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: Severity;
}

// ── Compliance ─────────────────────────────────────────────
export interface ComplianceBaseline {
  name: string;
  pass: boolean;
  details?: string;
}

// ── Threat Matrix ──────────────────────────────────────────
export interface ThreatMatrixItem {
  threat: string;
  likelihood: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  mitigation?: string;
}

// ── Security Assessment ────────────────────────────────────
export interface SecurityAssessment {
  risk_score: number;
  severity: Severity;
  crypto_strength_score: number;
  findings: SecurityFinding[];
  recommendations: Recommendation[];
  ai_confidence_score: number;
  compliance_baseline?: ComplianceBaseline[];
  threat_matrix?: ThreatMatrixItem[];
}

// ── Technical IKE ──────────────────────────────────────────
export interface IKEProposal {
  encryption: string;
  auth: string;
  dh_group: number;
  prf?: string;
}

export interface IKEDetails {
  version: string | null;
  exchange_type: string | null;
  proposals: IKEProposal[];
  dh_group: number | null;
  nonce_length?: number | null;
  initiator_identity?: string | null;
  responder_identity?: string | null;
}

// ── Technical ESP/AH ───────────────────────────────────────
export interface ESPAHDetails {
  spi?: string | null;
  sequence_numbers?: string | null;
  icv_length?: number | null;
  padding_detected?: boolean | null;
  next_header?: string | null;
  protocol_used: 'ESP' | 'AH' | 'both' | null;
}

// ── Flow Statistics ────────────────────────────────────────
export interface FlowStatistics {
  packet_size_min?: number | null;
  packet_size_max?: number | null;
  packet_size_avg?: number | null;
  inter_arrival_avg_ms?: number | null;
  flow_duration_seconds?: number | null;
  byte_volume?: number | null;
  directionality?: string | null;
}

// ── Technical Details ──────────────────────────────────────
export interface TechnicalDetails {
  capture: Capture;
  ike: IKEDetails;
  esp_ah: ESPAHDetails;
  flow_stats?: FlowStatistics | null;
  raw_features?: Record<string, unknown> | null;
}

// ── Full Analysis (Analysis Overview page) ─────────────────
export interface FullAnalysis {
  capture: Capture;
  classification: Classification;
  security: SecurityAssessment;
}

// ── Report ─────────────────────────────────────────────────
export interface ReportMeta {
  title: string;
  capture_id: string;
  filename: string;
  generated_at: string;
  ruleset_version?: string;
  model_version?: string;
}

// ── API response wrapper ───────────────────────────────────
export interface ApiError {
  error: string;
  code?: string;
}
