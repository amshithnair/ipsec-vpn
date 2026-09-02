package models

import (
	"encoding/json"
	"time"
)

// Capture represents a PCAP file upload.
type Capture struct {
	ID              string          `json:"id"`
	Filename        string          `json:"filename"`
	FileSize        int64           `json:"file_size"`
	FileHash        string          `json:"file_hash"`
	StoragePath     string          `json:"storage_path"`
	PacketCount     int             `json:"packet_count"`
	CaptureDuration float64         `json:"capture_duration"`
	Status          string          `json:"status"`
	Source          string          `json:"source"`
	Metadata        json.RawMessage `json:"metadata"`
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`
}

// AnalysisJob represents an analysis job.
type AnalysisJob struct {
	ID           string          `json:"id"`
	CaptureID    string          `json:"capture_id"`
	JobType      string          `json:"job_type"`
	Status       string          `json:"status"`
	Priority     int             `json:"priority"`
	Progress     int             `json:"progress"`
	StartedAt    *time.Time      `json:"started_at,omitempty"`
	CompletedAt  *time.Time      `json:"completed_at,omitempty"`
	ErrorMessage *string         `json:"error_message,omitempty"`
	WorkerID     *string         `json:"worker_id,omitempty"`
	Metadata     json.RawMessage `json:"metadata"`
	CreatedAt    time.Time       `json:"created_at"`
}

type TrafficInference struct {
	TrafficType  string  `json:"traffic_type"`
	Confidence   float64 `json:"confidence"`
	ModelVersion string  `json:"model_version"`
	MethodSource string  `json:"method_source,omitempty"`
}

// ClassificationResult stores protocol classification.
type ClassificationResult struct {
	ID               string            `json:"id"`
	CaptureID        string            `json:"capture_id"`
	ProtocolDetected string            `json:"protocol_detected"`
	IKEVersion       *string           `json:"ike_version,omitempty"`
	IPSecMode        *string           `json:"ipsec_mode,omitempty"`
	EncryptionAlgo   *string           `json:"encryption_algo,omitempty"`
	AuthAlgo         *string           `json:"auth_algo,omitempty"`
	DHGroup          *int              `json:"dh_group,omitempty"`
	PFSDetected      *bool             `json:"pfs_detected,omitempty"`
	ReplayProtection *bool             `json:"replay_protection,omitempty"`
	SALifetime       *int              `json:"sa_lifetime,omitempty"`
	RawFeatures      json.RawMessage   `json:"raw_features"`
	ConfidenceScore  float64           `json:"confidence_score"`
	ModelVersion     string            `json:"model_version"`
	AnalysisMethod   string            `json:"analysis_method,omitempty"`
	MethodSource     string            `json:"method_source,omitempty"`
	TrafficInference *TrafficInference `json:"traffic_inference,omitempty"`
	CreatedAt        time.Time         `json:"created_at"`
}

// SecurityAssessment stores security evaluation results.
type SecurityAssessment struct {
	ID                string          `json:"id"`
	CaptureID         string          `json:"capture_id"`
	ClassificationID  *string         `json:"classification_id,omitempty"`
	RiskScore         int             `json:"risk_score"`
	Severity          string          `json:"severity"`
	CryptoStrength    int             `json:"crypto_strength"`
	ComplianceStatus  json.RawMessage `json:"compliance_status"`
	Findings          json.RawMessage `json:"findings"`
	Recommendations   json.RawMessage `json:"recommendations"`
	ThreatMatrix      json.RawMessage `json:"threat_matrix"`
	AssessmentVersion string          `json:"assessment_version"`
	MethodSource      string          `json:"method_source,omitempty"`
	CreatedAt         time.Time       `json:"created_at"`
}

// ContributingSignal represents a feature deviation contributing to an anomaly score.
type ContributingSignal struct {
	FeatureName     string  `json:"feature_name"`
	ObservedValue   float64 `json:"observed_value"`
	BaselineMean    float64 `json:"baseline_mean"`
	DeviationZScore float64 `json:"deviation_z_score"`
	Direction       string  `json:"direction"`
	ImpactWeight    float64 `json:"impact_weight"`
}

// AnomalyResult represents behavioral anomaly detection findings.
type AnomalyResult struct {
	ID                  string               `json:"id"`
	CaptureID           string               `json:"capture_id"`
	AnomalyScore        float64              `json:"anomaly_score"`
	IsAnomalous         bool                 `json:"is_anomalous"`
	Severity            string               `json:"severity"`
	Status              string               `json:"status"`
	Explanation         string               `json:"explanation"`
	ContributingSignals []ContributingSignal `json:"contributing_signals"`
	ModelVersion        string               `json:"model_version"`
	Algorithm           string               `json:"algorithm"`
	ValidationStatus    string               `json:"validation_status"`
	MethodSource        string               `json:"method_source"`
	CreatedAt           time.Time            `json:"created_at"`
}

// Report stores generated reports.
type Report struct {
	ID           string          `json:"id"`
	CaptureID    string          `json:"capture_id"`
	AssessmentID *string         `json:"assessment_id,omitempty"`
	ReportType   string          `json:"report_type"`
	Format       string          `json:"format"`
	Content      string          `json:"content,omitempty"`
	StoragePath  *string         `json:"storage_path,omitempty"`
	GeneratedAt  time.Time       `json:"generated_at"`
	Metadata     json.RawMessage `json:"metadata"`
	CreatedAt    time.Time       `json:"created_at"`
}

// DashboardSummary provides aggregate stats.
type DashboardSummary struct {
	TotalCaptures    int            `json:"total_captures"`
	TotalAnalyses    int            `json:"total_analyses"`
	AverageRiskScore float64        `json:"average_risk_score"`
	SeverityCounts   map[string]int `json:"severity_counts"`
	RecentAnalyses   []RecentItem   `json:"recent_analyses"`
	AnomaliesCount   int            `json:"anomalies_count"`
	AvgCryptoScore   float64        `json:"avg_crypto_score"`
}

// RecentItem for dashboard.
type RecentItem struct {
	CaptureID    string    `json:"capture_id"`
	Filename     string    `json:"filename"`
	RiskScore    int       `json:"risk_score"`
	Severity     string    `json:"severity"`
	AnomalyScore float64   `json:"anomaly_score"`
	IsAnomalous  bool      `json:"is_anomalous"`
	CreatedAt    time.Time `json:"created_at"`
}

// SecurityPostureSummary aggregates organizational VPN posture.
type SecurityPostureSummary struct {
	OverallPostureScore  int            `json:"overall_posture_score"`
	CryptoScore          int            `json:"crypto_score"`
	ProtocolScore        int            `json:"protocol_score"`
	BehavioralScore      int            `json:"behavioral_score"`
	TotalAuditedCaptures int            `json:"total_audited_captures"`
	HighCriticalFindings int            `json:"high_critical_findings"`
	PFSAdoptionRate      float64        `json:"pfs_adoption_rate"`
	ReplayProtectionRate float64        `json:"replay_protection_rate"`
	IKEVersionCounts     map[string]int `json:"ike_version_counts"`
	WeakCipherCount      int            `json:"weak_cipher_count"`
	WeakDHCount          int            `json:"weak_dh_count"`
	SeverityCounts       map[string]int `json:"severity_counts"`
	RecentFindings       []FindingItem  `json:"recent_findings"`
}

// FindingItem summarizes a security finding across captures.
type FindingItem struct {
	CaptureID string `json:"capture_id"`
	Filename  string `json:"filename"`
	FindingID string `json:"finding_id"`
	Title     string `json:"title"`
	Severity  string `json:"severity"`
	Source    string `json:"source"`
}

// RemediationItem maps actionable fixes aggregated across captures.
type RemediationItem struct {
	ID               string   `json:"id"`
	Title            string   `json:"title"`
	Priority         string   `json:"priority"`
	Category         string   `json:"category"`
	Description      string   `json:"description"`
	Action           string   `json:"action"`
	AffectedCaptures []string `json:"affected_captures"`
	Source           string   `json:"source"`
}

// CaptureComparison compares two captures side by side.
type CaptureComparison struct {
	BaseCaptureID        string                 `json:"base_capture_id"`
	BaseFilename         string                 `json:"base_filename"`
	TargetCaptureID      string                 `json:"target_capture_id"`
	TargetFilename       string                 `json:"target_filename"`
	ScoreDifference      int                    `json:"score_difference"` // positive = improvement
	PostureImprovement   string                 `json:"posture_improvement"`
	BaseClassification   map[string]interface{} `json:"base_classification"`
	TargetClassification map[string]interface{} `json:"target_classification"`
	BaseSecurity         map[string]interface{} `json:"base_security"`
	TargetSecurity       map[string]interface{} `json:"target_security"`
	BaseAnomaly          *AnomalyResult         `json:"base_anomaly,omitempty"`
	TargetAnomaly        *AnomalyResult         `json:"target_anomaly,omitempty"`
}

// ModelCard represents transparent AI model documentation.
type ModelCard struct {
	ModelID           string                 `json:"model_id"`
	Name              string                 `json:"name"`
	Version           string                 `json:"version"`
	Type              string                 `json:"type"`
	Framework         string                 `json:"framework"`
	Task              string                 `json:"task"`
	InputFeatures     []string               `json:"input_features"`
	FeatureCount      int                    `json:"feature_count"`
	Classes           []string               `json:"classes"`
	DatasetType       string                 `json:"dataset_type"`
	ValidationStatus  string                 `json:"validation_status"`
	AccuracyStatement string                 `json:"accuracy_statement"`
	EvaluationMetrics map[string]interface{} `json:"evaluation_metrics"`
	Limitations       []string               `json:"limitations"`
	IntendedUse       string                 `json:"intended_use"`
}

// DemoScenario represents a runnable demo scenario.
type DemoScenario struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	ExpectedRisk string `json:"expected_risk"`
	Category    string `json:"category"`
	Filename    string `json:"filename"`
}

// AnalysisResult is the combined Python AI service response.
type AnalysisResult struct {
	CaptureID          string                 `json:"capture_id"`
	AnalysisID         string                 `json:"analysis_id"`
	Timestamp          string                 `json:"timestamp"`
	Status             string                 `json:"status"`
	Classification     map[string]interface{} `json:"classification"`
	CryptoAnalysis     map[string]interface{} `json:"crypto_analysis"`
	SecurityAssessment map[string]interface{} `json:"security_assessment"`
	AnomalyAssessment  map[string]interface{} `json:"anomaly_assessment"`
	Confidence         map[string]interface{} `json:"confidence"`
	AnalysisMetadata   map[string]interface{} `json:"metadata"`
}

// ErrorResponse is a standard error response.
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Code    int    `json:"code"`
}
