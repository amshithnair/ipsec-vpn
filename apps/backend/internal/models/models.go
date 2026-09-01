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
}

// ClassificationResult stores protocol classification.
type ClassificationResult struct {
	ID               string           `json:"id"`
	CaptureID        string           `json:"capture_id"`
	ProtocolDetected string           `json:"protocol_detected"`
	IKEVersion       *string          `json:"ike_version,omitempty"`
	IPSecMode        *string          `json:"ipsec_mode,omitempty"`
	EncryptionAlgo   *string          `json:"encryption_algo,omitempty"`
	AuthAlgo         *string          `json:"auth_algo,omitempty"`
	DHGroup          *int             `json:"dh_group,omitempty"`
	PFSDetected      *bool            `json:"pfs_detected,omitempty"`
	ReplayProtection *bool            `json:"replay_protection,omitempty"`
	SALifetime       *int             `json:"sa_lifetime,omitempty"`
	RawFeatures      json.RawMessage  `json:"raw_features"`
	ConfidenceScore  float64          `json:"confidence_score"`
	ModelVersion     string           `json:"model_version"`
	AnalysisMethod   string           `json:"analysis_method,omitempty"`
	TrafficInference *TrafficInference `json:"traffic_inference,omitempty"`
	CreatedAt        time.Time        `json:"created_at"`
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
	CreatedAt         time.Time       `json:"created_at"`
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
}

// RecentItem for dashboard.
type RecentItem struct {
	CaptureID string    `json:"capture_id"`
	Filename  string    `json:"filename"`
	RiskScore int       `json:"risk_score"`
	Severity  string    `json:"severity"`
	CreatedAt time.Time `json:"created_at"`
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
	Confidence         map[string]interface{} `json:"confidence"`
	AnalysisMetadata   map[string]interface{} `json:"metadata"`
}

// ErrorResponse is a standard error response.
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Code    int    `json:"code"`
}
