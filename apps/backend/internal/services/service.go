package services

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	"ipsec-vpn/backend/internal/config"
	"ipsec-vpn/backend/internal/models"
	"ipsec-vpn/backend/internal/repository"
)

// Service handles business logic and orchestration.
type Service struct {
	repo  *repository.Repository
	redis *redis.Client
	cfg   *config.Config
}

// New creates a new Service.
func New(repo *repository.Repository, redisClient *redis.Client, cfg *config.Config) *Service {
	return &Service{
		repo:  repo,
		redis: redisClient,
		cfg:   cfg,
	}
}

// ── Upload ──

// UploadCapture handles PCAP file upload, validation, and storage.
func (s *Service) UploadCapture(ctx context.Context, file multipart.File, header *multipart.FileHeader) (*models.Capture, error) {
	// Validate extension
	ext := filepath.Ext(header.Filename)
	validExts := map[string]bool{".pcap": true, ".pcapng": true, ".cap": true}
	if !validExts[ext] {
		return nil, fmt.Errorf("invalid file extension: %s", ext)
	}

	// Validate size
	if header.Size > s.cfg.MaxFileSize {
		return nil, fmt.Errorf("file too large: %d bytes (max %d)", header.Size, s.cfg.MaxFileSize)
	}

	// Read file content
	content, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	// Compute hash
	hash := sha256.Sum256(content)
	hashStr := hex.EncodeToString(hash[:])

	// Store file
	captureID := uuid.New().String()
	storagePath := filepath.Join(s.cfg.UploadDir, fmt.Sprintf("%s%s", captureID, ext))

	if err := os.MkdirAll(filepath.Dir(storagePath), 0755); err != nil {
		return nil, fmt.Errorf("failed to create upload dir: %w", err)
	}

	if err := os.WriteFile(storagePath, content, 0644); err != nil {
		return nil, fmt.Errorf("failed to write file: %w", err)
	}

	// Create database record
	capture := &models.Capture{
		ID:          captureID,
		Filename:    header.Filename,
		FileSize:    header.Size,
		FileHash:    hashStr,
		StoragePath: storagePath,
		Status:      "uploaded",
		Source:      "upload",
		Metadata:    json.RawMessage("{}"),
	}

	if err := s.repo.CreateCapture(ctx, capture); err != nil {
		// Clean up file on DB error
		os.Remove(storagePath)
		return nil, fmt.Errorf("failed to save capture: %w", err)
	}

	log.Printf("[Upload] Capture %s stored: %s (%d bytes)", captureID, header.Filename, header.Size)
	return capture, nil
}

// ── Analysis ──

// StartAnalysis triggers the analysis pipeline for a capture.
func (s *Service) StartAnalysis(ctx context.Context, captureID string) (*models.AnalysisJob, error) {
	// Get capture
	capture, err := s.repo.GetCapture(ctx, captureID)
	if err != nil {
		return nil, fmt.Errorf("capture not found: %w", err)
	}

	// Create job
	jobID := uuid.New().String()
	job := &models.AnalysisJob{
		ID:        jobID,
		CaptureID: captureID,
		JobType:   "full_analysis",
		Status:    "pending",
		Priority:  0,
		Progress:  0,
		Metadata:  json.RawMessage("{}"),
	}

	if err := s.repo.CreateJob(ctx, job); err != nil {
		return nil, fmt.Errorf("failed to create job: %w", err)
	}

	// Update capture status
	s.repo.UpdateCaptureStatus(ctx, captureID, "analyzing")

	// Run analysis asynchronously
	go s.runAnalysis(captureID, jobID, capture.StoragePath, capture.Filename)

	return job, nil
}

func (s *Service) runAnalysis(captureID, jobID, storagePath, filename string) {
	ctx := context.Background()
	log.Printf("[Analysis] Starting analysis for capture %s (%s, job %s)", captureID, filename, jobID)

	// Mark job as started
	s.repo.UpdateJobStarted(ctx, jobID)

	// Update progress to 20% — sending to AI service
	s.repo.UpdateJobStatus(ctx, jobID, "processing", 20)

	// Call Python AI service
	result, err := s.callAIService(storagePath, captureID)
	if err != nil {
		log.Printf("[Analysis] AI service error: %v", err)
		s.repo.UpdateJobFailed(ctx, jobID, err.Error())
		s.repo.UpdateCaptureStatus(ctx, captureID, "failed")
		return
	}

	// Update progress to 60% — storing results
	s.repo.UpdateJobStatus(ctx, jobID, "processing", 60)

	// Store classification result
	classID := uuid.New().String()
	classification := result["classification"].(map[string]interface{})
	cryptoAnalysis := result["crypto_analysis"].(map[string]interface{})

	rawFeatures, _ := json.Marshal(map[string]interface{}{
		"classification": classification,
		"crypto_analysis": cryptoAnalysis,
	})

	ikeVersion := getStringPtr(classification, "ike_version")
	ipsecMode := getStringPtr(classification, "ipsec_mode")

	// Extract crypto details
	encAlgo := ""
	if enc, ok := cryptoAnalysis["encryption"].(map[string]interface{}); ok {
		encAlgo, _ = enc["algorithm"].(string)
	}
	authAlgo := ""
	if auth, ok := cryptoAnalysis["authentication"].(map[string]interface{}); ok {
		authAlgo, _ = auth["algorithm"].(string)
	}
	var dhGroup *int
	if dh, ok := cryptoAnalysis["dh_group"].(map[string]interface{}); ok {
		if gn, ok := dh["group_number"].(float64); ok {
			g := int(gn)
			dhGroup = &g
		}
	}
	var pfsDetected *bool
	if pfs, ok := cryptoAnalysis["pfs"].(map[string]interface{}); ok {
		if detected, ok := pfs["detected"].(bool); ok {
			pfsDetected = &detected
		}
	}

	confidenceScore := 0.0
	modelVersion := "rules-v1"
	if conf, ok := result["confidence"].(map[string]interface{}); ok {
		if cs, ok := conf["overall_score"].(float64); ok {
			confidenceScore = cs
		}
		if mv, ok := conf["model_version"].(string); ok {
			modelVersion = mv
		}
	}

	cr := &models.ClassificationResult{
		ID:               classID,
		CaptureID:        captureID,
		ProtocolDetected: getStringValue(classification, "protocol"),
		IKEVersion:       ikeVersion,
		IPSecMode:        ipsecMode,
		EncryptionAlgo:   &encAlgo,
		AuthAlgo:         &authAlgo,
		DHGroup:          dhGroup,
		PFSDetected:      pfsDetected,
		RawFeatures:      rawFeatures,
		ConfidenceScore:  confidenceScore,
		ModelVersion:     modelVersion,
	}

	if err := s.repo.CreateClassification(ctx, cr); err != nil {
		log.Printf("[Analysis] Failed to store classification: %v", err)
		s.repo.UpdateJobFailed(ctx, jobID, "Failed to store classification: "+err.Error())
		return
	}

	// Update progress to 80% — storing security assessment
	s.repo.UpdateJobStatus(ctx, jobID, "processing", 80)

	// Store security assessment
	secAssessment := result["security_assessment"].(map[string]interface{})
	findingsJSON, _ := json.Marshal(secAssessment["findings"])
	recsJSON, _ := json.Marshal(secAssessment["recommendations"])

	riskScore := 0
	if rs, ok := secAssessment["risk_score"].(float64); ok {
		riskScore = int(rs)
	}
	severity := "LOW"
	if sev, ok := secAssessment["severity"].(string); ok {
		severity = sev
	}
	cryptoStrength := 0
	if cs, ok := secAssessment["crypto_strength_score"].(float64); ok {
		cryptoStrength = int(cs)
	}

	sa := &models.SecurityAssessment{
		ID:                uuid.New().String(),
		CaptureID:         captureID,
		ClassificationID:  &classID,
		RiskScore:         riskScore,
		Severity:          severity,
		CryptoStrength:    cryptoStrength,
		ComplianceStatus:  json.RawMessage("{}"),
		Findings:          findingsJSON,
		Recommendations:   recsJSON,
		ThreatMatrix:      json.RawMessage("{}"),
		AssessmentVersion: modelVersion,
	}

	if err := s.repo.CreateSecurityAssessment(ctx, sa); err != nil {
		log.Printf("[Analysis] Failed to store security assessment: %v", err)
		s.repo.UpdateJobFailed(ctx, jobID, "Failed to store assessment: "+err.Error())
		return
	}

	// Update capture metadata
	if meta, ok := result["metadata"].(map[string]interface{}); ok {
		packetCount := 0
		if pc, ok := meta["packets_analyzed"].(float64); ok {
			packetCount = int(pc)
		}
		duration := 0.0
		if d, ok := meta["capture_duration_seconds"].(float64); ok {
			duration = d
		}
		s.repo.UpdateCaptureMetadata(ctx, captureID, packetCount, duration)
	}

	// Mark complete
	s.repo.UpdateJobCompleted(ctx, jobID)
	s.repo.UpdateCaptureStatus(ctx, captureID, "analyzed")

	// Cache result in Redis if available
	if s.redis != nil {
		resultJSON, _ := json.Marshal(result)
		s.redis.Set(ctx, fmt.Sprintf("analysis:%s", captureID), resultJSON, 1*time.Hour)
	}

	log.Printf("[Analysis] Completed analysis for capture %s — Risk: %d (%s)", captureID, riskScore, severity)
}

func (s *Service) callAIService(filePath, captureID string) (map[string]interface{}, error) {
	// Open file
	f, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer f.Close()

	// Create multipart request
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	// Add file
	part, err := writer.CreateFormFile("file", filepath.Base(filePath))
	if err != nil {
		return nil, fmt.Errorf("failed to create form file: %w", err)
	}
	if _, err := io.Copy(part, f); err != nil {
		return nil, fmt.Errorf("failed to copy file: %w", err)
	}

	// Add capture_id
	writer.WriteField("capture_id", captureID)
	writer.Close()

	// Send request
	url := fmt.Sprintf("%s/analyze", s.cfg.AIServiceURL)
	req, err := http.NewRequest("POST", url, &buf)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("AI service request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("AI service returned %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to parse AI response: %w", err)
	}

	return result, nil
}

// ── Query Methods ──

func (s *Service) GetCapture(ctx context.Context, id string) (*models.Capture, error) {
	return s.repo.GetCapture(ctx, id)
}

func (s *Service) ListCaptures(ctx context.Context, limit, offset int) ([]models.Capture, error) {
	return s.repo.ListCaptures(ctx, limit, offset)
}

func (s *Service) DeleteCapture(ctx context.Context, id string) error {
	capture, err := s.repo.GetCapture(ctx, id)
	if err != nil {
		return err
	}
	// Remove file
	os.Remove(capture.StoragePath)
	return s.repo.DeleteCapture(ctx, id)
}

func (s *Service) GetAnalysisStatus(ctx context.Context, captureID string) (*models.AnalysisJob, error) {
	return s.repo.GetJobByCaptureID(ctx, captureID)
}

func (s *Service) GetClassification(ctx context.Context, captureID string) (*models.ClassificationResult, error) {
	return s.repo.GetClassificationByCaptureID(ctx, captureID)
}

func (s *Service) GetSecurityAssessment(ctx context.Context, captureID string) (*models.SecurityAssessment, error) {
	return s.repo.GetSecurityAssessmentByCaptureID(ctx, captureID)
}

func (s *Service) GetFullAnalysisResult(ctx context.Context, captureID string) (json.RawMessage, error) {
	// Try Redis cache first
	if s.redis != nil {
		cached, err := s.redis.Get(ctx, fmt.Sprintf("analysis:%s", captureID)).Bytes()
		if err == nil {
			return cached, nil
		}
	}
	return s.repo.GetFullAnalysisResult(ctx, captureID)
}

func (s *Service) GetDashboardSummary(ctx context.Context) (*models.DashboardSummary, error) {
	return s.repo.GetDashboardSummary(ctx)
}

// ── Reports ──

func (s *Service) GenerateReport(ctx context.Context, captureID string) (*models.Report, error) {
	// Get full analysis to send to AI service for report generation
	analysisJSON, err := s.repo.GetFullAnalysisResult(ctx, captureID)
	if err != nil {
		return nil, fmt.Errorf("analysis results not found: %w", err)
	}

	// Get capture for filename
	capture, err := s.repo.GetCapture(ctx, captureID)
	if err != nil {
		return nil, fmt.Errorf("capture not found: %w", err)
	}

	// Call AI service to generate report
	reportHTML, err := s.callReportGeneration(analysisJSON, capture.Filename)
	if err != nil {
		return nil, fmt.Errorf("report generation failed: %w", err)
	}

	// Store report
	report := &models.Report{
		ID:         uuid.New().String(),
		CaptureID:  captureID,
		ReportType: "technical",
		Format:     "html",
		Content:    reportHTML,
		Metadata:   json.RawMessage("{}"),
	}

	// Get assessment ID if exists
	sa, err := s.repo.GetSecurityAssessmentByCaptureID(ctx, captureID)
	if err == nil {
		report.AssessmentID = &sa.ID
	}

	if err := s.repo.CreateReport(ctx, report); err != nil {
		return nil, fmt.Errorf("failed to store report: %w", err)
	}

	return report, nil
}

func (s *Service) callReportGeneration(analysisJSON json.RawMessage, filename string) (string, error) {
	reqBody := map[string]interface{}{
		"capture_id":  filename,
		"analysis":    json.RawMessage(analysisJSON),
		"report_type": "technical",
		"format":      "html",
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	url := fmt.Sprintf("%s/report/generate", s.cfg.AIServiceURL)
	resp, err := http.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("report generation request failed: %w", err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to parse report response: %w", err)
	}

	html, ok := result["report_html"].(string)
	if !ok {
		return "", fmt.Errorf("no report_html in response")
	}

	return html, nil
}

func (s *Service) GetReport(ctx context.Context, id string) (*models.Report, error) {
	return s.repo.GetReport(ctx, id)
}

func (s *Service) GetReportByCaptureID(ctx context.Context, captureID string) (*models.Report, error) {
	return s.repo.GetReportByCaptureID(ctx, captureID)
}

// ── Helpers ──

func getStringValue(m map[string]interface{}, key string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return ""
}

func getStringPtr(m map[string]interface{}, key string) *string {
	if v, ok := m[key].(string); ok {
		return &v
	}
	return nil
}
