// ============================================================
//  Shared TypeScript types — mirrors Go API response contracts
// ============================================================

// ── Severity, Status & Provenance ──────────────────────────
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CaptureStatus = 'uploaded' | 'processing' | 'completed' | 'failed' | 'analyzed';
export type MethodSource = 'DETERMINISTIC' | 'RULE_BASED' | 'ML_CLASSIFIER' | 'ML_ANOMALY' | 'HYBRID_RISK';

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
  anomaly_score?: number;
  is_anomalous?: boolean;
  analyzed_at?: string;
  created_at: string;
}

export interface DashboardSummary {
  total_captures: number;
  analyzed: number;
  high_risk: number;
  critical: number;
  anomalies_count?: number;
  avg_crypto_score?: number;
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
export interface TrafficInference {
  traffic_type: string;
  confidence: number;
  model_version: string;
  method_source?: MethodSource;
}

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
  analysis_method?: string;
  method_source?: MethodSource;
  traffic_inference?: TrafficInference | null;
}

// ── Behavioral Anomaly Detection ───────────────────────────
export interface ContributingSignal {
  feature_name: string;
  observed_value: number;
  baseline_mean: number;
  deviation_z_score: number;
  direction: string;
  impact_weight?: number;
}

export interface AnomalyAssessment {
  id?: string;
  capture_id?: string;
  anomaly_score: number;
  is_anomalous: boolean;
  severity: Severity;
  status: 'EVALUATED' | 'INSUFFICIENT_DATA' | 'UNAVAILABLE';
  explanation: string;
  contributing_signals: ContributingSignal[];
  model_version: string;
  algorithm: string;
  validation_status: string;
  method_source: MethodSource;
  created_at?: string;
}

// ── Security Finding & Recommendation ───────────────────────
export interface SecurityFinding {
  id: string;
  title: string;
  severity: Severity;
  explanation: string;
  impact: string;
  cve?: string;
  source?: MethodSource;
  evidence?: Record<string, unknown> | string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: Severity;
  action?: string;
  category?: string;
  source?: string;
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
  ai_confidence_score?: number;
  compliance_baseline?: ComplianceBaseline[];
  threat_matrix?: ThreatMatrixItem[];
  method_source?: MethodSource;
}

// ── Security Posture ───────────────────────────────────────
export interface FindingItem {
  capture_id: string;
  filename: string;
  finding_id: string;
  title: string;
  severity: Severity;
  source: string;
}

export interface SecurityPostureSummary {
  overall_posture_score: number;
  crypto_score: number;
  protocol_score: number;
  behavioral_score: number;
  total_audited_captures: number;
  high_critical_findings: number;
  pfs_adoption_rate: number;
  replay_protection_rate: number;
  ike_version_counts: Record<string, number>;
  weak_cipher_count: number;
  weak_dh_count: number;
  severity_counts: Record<string, number>;
  recent_findings: FindingItem[];
}

// ── Remediation ────────────────────────────────────────────
export interface RemediationItem {
  id: string;
  title: string;
  priority: Severity;
  category: string;
  description: string;
  action: string;
  affected_captures: string[];
  source: string;
}

// ── Capture Comparison ─────────────────────────────────────
export interface CaptureComparison {
  base_capture_id: string;
  base_filename: string;
  target_capture_id: string;
  target_filename: string;
  score_difference: number;
  posture_improvement: 'IMPROVED' | 'DEGRADED' | 'UNCHANGED';
  base_classification: Record<string, unknown>;
  target_classification: Record<string, unknown>;
  base_security: Record<string, unknown>;
  target_security: Record<string, unknown>;
  base_anomaly?: AnomalyAssessment | null;
  target_anomaly?: AnomalyAssessment | null;
}

// ── Model Registry ─────────────────────────────────────────
export interface ModelCard {
  model_id: string;
  name: string;
  version: string;
  type: string;
  framework: string;
  task: string;
  input_features: string[];
  feature_count: number;
  classes: string[];
  dataset_type: string;
  validation_status: string;
  accuracy_statement: string;
  evaluation_metrics: Record<string, unknown>;
  limitations: string[];
  intended_use: string;
}

// ── Demo Lab ───────────────────────────────────────────────
export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  expected_risk: string;
  category: string;
  filename: string;
}

// ── Technical Details ──────────────────────────────────────
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

export interface ESPAHDetails {
  spi?: string | null;
  sequence_numbers?: string | null;
  icv_length?: number | null;
  padding_detected?: boolean | null;
  next_header?: string | null;
  protocol_used: 'ESP' | 'AH' | 'both' | null;
}

export interface FlowStatistics {
  packet_size_min?: number | null;
  packet_size_max?: number | null;
  packet_size_avg?: number | null;
  inter_arrival_avg_ms?: number | null;
  flow_duration_seconds?: number | null;
  byte_volume?: number | null;
  directionality?: string | null;
}

export interface TechnicalDetails {
  capture: Capture;
  ike: IKEDetails;
  esp_ah: ESPAHDetails;
  flow_stats?: FlowStatistics | null;
  raw_features?: Record<string, unknown> | null;
}

// ── Full Analysis (Analysis Overview & Investigation) ───────
export interface FullAnalysis {
  capture: Capture;
  classification: Classification;
  security: SecurityAssessment;
  anomaly_assessment?: AnomalyAssessment | null;
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
