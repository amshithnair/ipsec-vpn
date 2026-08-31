package repository

import (
	"context"
	"encoding/json"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"ipsec-vpn/backend/internal/models"
)

// Repository handles all database operations.
type Repository struct {
	db *pgxpool.Pool
}

// New creates a new Repository.
func New(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// ── Captures ──

func (r *Repository) CreateCapture(ctx context.Context, c *models.Capture) error {
	query := `INSERT INTO captures (id, filename, file_size, file_hash, storage_path, packet_count, capture_duration, status, source, metadata)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING created_at, updated_at`
	return r.db.QueryRow(ctx, query,
		c.ID, c.Filename, c.FileSize, c.FileHash, c.StoragePath,
		c.PacketCount, c.CaptureDuration, c.Status, c.Source, c.Metadata,
	).Scan(&c.CreatedAt, &c.UpdatedAt)
}

func (r *Repository) GetCapture(ctx context.Context, id string) (*models.Capture, error) {
	c := &models.Capture{}
	query := `SELECT id, filename, file_size, file_hash, storage_path, packet_count, capture_duration, status, source, metadata, created_at, updated_at
		FROM captures WHERE id = $1`
	err := r.db.QueryRow(ctx, query, id).Scan(
		&c.ID, &c.Filename, &c.FileSize, &c.FileHash, &c.StoragePath,
		&c.PacketCount, &c.CaptureDuration, &c.Status, &c.Source, &c.Metadata,
		&c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return c, nil
}

func (r *Repository) ListCaptures(ctx context.Context, limit, offset int) ([]models.Capture, error) {
	if limit <= 0 {
		limit = 20
	}
	query := `SELECT id, filename, file_size, file_hash, storage_path, packet_count, capture_duration, status, source, metadata, created_at, updated_at
		FROM captures ORDER BY created_at DESC LIMIT $1 OFFSET $2`
	rows, err := r.db.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var captures []models.Capture
	for rows.Next() {
		c := models.Capture{}
		if err := rows.Scan(
			&c.ID, &c.Filename, &c.FileSize, &c.FileHash, &c.StoragePath,
			&c.PacketCount, &c.CaptureDuration, &c.Status, &c.Source, &c.Metadata,
			&c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, err
		}
		captures = append(captures, c)
	}
	return captures, nil
}

func (r *Repository) UpdateCaptureStatus(ctx context.Context, id, status string) error {
	query := `UPDATE captures SET status = $1 WHERE id = $2`
	_, err := r.db.Exec(ctx, query, status, id)
	return err
}

func (r *Repository) UpdateCaptureMetadata(ctx context.Context, id string, packetCount int, duration float64) error {
	query := `UPDATE captures SET packet_count = $1, capture_duration = $2 WHERE id = $3`
	_, err := r.db.Exec(ctx, query, packetCount, duration, id)
	return err
}

func (r *Repository) DeleteCapture(ctx context.Context, id string) error {
	query := `DELETE FROM captures WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

// ── Analysis Jobs ──

func (r *Repository) CreateJob(ctx context.Context, j *models.AnalysisJob) error {
	query := `INSERT INTO analysis_jobs (id, capture_id, job_type, status, priority, progress, metadata)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING created_at`
	return r.db.QueryRow(ctx, query,
		j.ID, j.CaptureID, j.JobType, j.Status, j.Priority, j.Progress, j.Metadata,
	).Scan(&j.CreatedAt)
}

func (r *Repository) GetJob(ctx context.Context, id string) (*models.AnalysisJob, error) {
	j := &models.AnalysisJob{}
	query := `SELECT id, capture_id, job_type, status, priority, progress, started_at, completed_at, error_message, worker_id, metadata, created_at
		FROM analysis_jobs WHERE id = $1`
	err := r.db.QueryRow(ctx, query, id).Scan(
		&j.ID, &j.CaptureID, &j.JobType, &j.Status, &j.Priority, &j.Progress,
		&j.StartedAt, &j.CompletedAt, &j.ErrorMessage, &j.WorkerID, &j.Metadata, &j.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return j, nil
}

func (r *Repository) GetJobByCaptureID(ctx context.Context, captureID string) (*models.AnalysisJob, error) {
	j := &models.AnalysisJob{}
	query := `SELECT id, capture_id, job_type, status, priority, progress, started_at, completed_at, error_message, worker_id, metadata, created_at
		FROM analysis_jobs WHERE capture_id = $1 ORDER BY created_at DESC LIMIT 1`
	err := r.db.QueryRow(ctx, query, captureID).Scan(
		&j.ID, &j.CaptureID, &j.JobType, &j.Status, &j.Priority, &j.Progress,
		&j.StartedAt, &j.CompletedAt, &j.ErrorMessage, &j.WorkerID, &j.Metadata, &j.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return j, nil
}

func (r *Repository) UpdateJobStatus(ctx context.Context, id, status string, progress int) error {
	query := `UPDATE analysis_jobs SET status = $1, progress = $2 WHERE id = $3`
	_, err := r.db.Exec(ctx, query, status, progress, id)
	return err
}

func (r *Repository) UpdateJobStarted(ctx context.Context, id string) error {
	now := time.Now()
	query := `UPDATE analysis_jobs SET status = 'processing', started_at = $1, progress = 10 WHERE id = $2`
	_, err := r.db.Exec(ctx, query, now, id)
	return err
}

func (r *Repository) UpdateJobCompleted(ctx context.Context, id string) error {
	now := time.Now()
	query := `UPDATE analysis_jobs SET status = 'completed', completed_at = $1, progress = 100 WHERE id = $2`
	_, err := r.db.Exec(ctx, query, now, id)
	return err
}

func (r *Repository) UpdateJobFailed(ctx context.Context, id, errMsg string) error {
	now := time.Now()
	query := `UPDATE analysis_jobs SET status = 'failed', completed_at = $1, error_message = $2 WHERE id = $3`
	_, err := r.db.Exec(ctx, query, now, errMsg, id)
	return err
}

// ── Classification Results ──

func (r *Repository) CreateClassification(ctx context.Context, cr *models.ClassificationResult) error {
	query := `INSERT INTO classification_results (id, capture_id, protocol_detected, ike_version, ipsec_mode, encryption_algo, auth_algo, dh_group, pfs_detected, replay_protection, sa_lifetime, raw_features, confidence_score, model_version)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		RETURNING created_at`
	return r.db.QueryRow(ctx, query,
		cr.ID, cr.CaptureID, cr.ProtocolDetected, cr.IKEVersion, cr.IPSecMode,
		cr.EncryptionAlgo, cr.AuthAlgo, cr.DHGroup, cr.PFSDetected, cr.ReplayProtection,
		cr.SALifetime, cr.RawFeatures, cr.ConfidenceScore, cr.ModelVersion,
	).Scan(&cr.CreatedAt)
}

func (r *Repository) GetClassificationByCaptureID(ctx context.Context, captureID string) (*models.ClassificationResult, error) {
	cr := &models.ClassificationResult{}
	query := `SELECT id, capture_id, protocol_detected, ike_version, ipsec_mode, encryption_algo, auth_algo, dh_group, pfs_detected, replay_protection, sa_lifetime, raw_features, confidence_score, model_version, created_at
		FROM classification_results WHERE capture_id = $1 ORDER BY created_at DESC LIMIT 1`
	err := r.db.QueryRow(ctx, query, captureID).Scan(
		&cr.ID, &cr.CaptureID, &cr.ProtocolDetected, &cr.IKEVersion, &cr.IPSecMode,
		&cr.EncryptionAlgo, &cr.AuthAlgo, &cr.DHGroup, &cr.PFSDetected, &cr.ReplayProtection,
		&cr.SALifetime, &cr.RawFeatures, &cr.ConfidenceScore, &cr.ModelVersion, &cr.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return cr, nil
}

// ── Security Assessments ──

func (r *Repository) CreateSecurityAssessment(ctx context.Context, sa *models.SecurityAssessment) error {
	query := `INSERT INTO security_assessments (id, capture_id, classification_id, risk_score, severity, crypto_strength, compliance_status, findings, recommendations, threat_matrix, assessment_version)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING created_at`
	return r.db.QueryRow(ctx, query,
		sa.ID, sa.CaptureID, sa.ClassificationID, sa.RiskScore, sa.Severity,
		sa.CryptoStrength, sa.ComplianceStatus, sa.Findings, sa.Recommendations,
		sa.ThreatMatrix, sa.AssessmentVersion,
	).Scan(&sa.CreatedAt)
}

func (r *Repository) GetSecurityAssessmentByCaptureID(ctx context.Context, captureID string) (*models.SecurityAssessment, error) {
	sa := &models.SecurityAssessment{}
	query := `SELECT id, capture_id, classification_id, risk_score, severity, crypto_strength, compliance_status, findings, recommendations, threat_matrix, assessment_version, created_at
		FROM security_assessments WHERE capture_id = $1 ORDER BY created_at DESC LIMIT 1`
	err := r.db.QueryRow(ctx, query, captureID).Scan(
		&sa.ID, &sa.CaptureID, &sa.ClassificationID, &sa.RiskScore, &sa.Severity,
		&sa.CryptoStrength, &sa.ComplianceStatus, &sa.Findings, &sa.Recommendations,
		&sa.ThreatMatrix, &sa.AssessmentVersion, &sa.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return sa, nil
}

// ── Reports ──

func (r *Repository) CreateReport(ctx context.Context, rpt *models.Report) error {
	query := `INSERT INTO reports (id, capture_id, assessment_id, report_type, format, content, storage_path, metadata)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING generated_at, created_at`
	return r.db.QueryRow(ctx, query,
		rpt.ID, rpt.CaptureID, rpt.AssessmentID, rpt.ReportType, rpt.Format,
		rpt.Content, rpt.StoragePath, rpt.Metadata,
	).Scan(&rpt.GeneratedAt, &rpt.CreatedAt)
}

func (r *Repository) GetReportByCaptureID(ctx context.Context, captureID string) (*models.Report, error) {
	rpt := &models.Report{}
	query := `SELECT id, capture_id, assessment_id, report_type, format, content, storage_path, generated_at, metadata, created_at
		FROM reports WHERE capture_id = $1 ORDER BY created_at DESC LIMIT 1`
	err := r.db.QueryRow(ctx, query, captureID).Scan(
		&rpt.ID, &rpt.CaptureID, &rpt.AssessmentID, &rpt.ReportType, &rpt.Format,
		&rpt.Content, &rpt.StoragePath, &rpt.GeneratedAt, &rpt.Metadata, &rpt.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return rpt, nil
}

func (r *Repository) GetReport(ctx context.Context, id string) (*models.Report, error) {
	rpt := &models.Report{}
	query := `SELECT id, capture_id, assessment_id, report_type, format, content, storage_path, generated_at, metadata, created_at
		FROM reports WHERE id = $1`
	err := r.db.QueryRow(ctx, query, id).Scan(
		&rpt.ID, &rpt.CaptureID, &rpt.AssessmentID, &rpt.ReportType, &rpt.Format,
		&rpt.Content, &rpt.StoragePath, &rpt.GeneratedAt, &rpt.Metadata, &rpt.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return rpt, nil
}

// ── Dashboard ──

func (r *Repository) GetDashboardSummary(ctx context.Context) (*models.DashboardSummary, error) {
	summary := &models.DashboardSummary{
		SeverityCounts: make(map[string]int),
	}

	// Total captures
	err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM captures`).Scan(&summary.TotalCaptures)
	if err != nil {
		return nil, err
	}

	// Total analyses
	err = r.db.QueryRow(ctx, `SELECT COUNT(*) FROM security_assessments`).Scan(&summary.TotalAnalyses)
	if err != nil {
		return nil, err
	}

	// Average risk score
	err = r.db.QueryRow(ctx, `SELECT COALESCE(AVG(risk_score), 0) FROM security_assessments`).Scan(&summary.AverageRiskScore)
	if err != nil {
		return nil, err
	}

	// Severity distribution
	rows, err := r.db.Query(ctx, `SELECT severity, COUNT(*) FROM security_assessments GROUP BY severity`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var sev string
		var count int
		if err := rows.Scan(&sev, &count); err != nil {
			return nil, err
		}
		summary.SeverityCounts[sev] = count
	}

	// Recent analyses
	recentRows, err := r.db.Query(ctx, `
		SELECT c.id, c.filename, sa.risk_score, sa.severity, sa.created_at
		FROM security_assessments sa
		JOIN captures c ON c.id = sa.capture_id
		ORDER BY sa.created_at DESC LIMIT 10
	`)
	if err != nil {
		return nil, err
	}
	defer recentRows.Close()
	for recentRows.Next() {
		item := models.RecentItem{}
		if err := recentRows.Scan(&item.CaptureID, &item.Filename, &item.RiskScore, &item.Severity, &item.CreatedAt); err != nil {
			return nil, err
		}
		summary.RecentAnalyses = append(summary.RecentAnalyses, item)
	}

	return summary, nil
}

// ── Full Analysis Result ──

func (r *Repository) GetFullAnalysisResult(ctx context.Context, captureID string) (json.RawMessage, error) {
	// Get classification
	cr, err := r.GetClassificationByCaptureID(ctx, captureID)
	if err != nil {
		return nil, err
	}

	// Get security assessment
	sa, err := r.GetSecurityAssessmentByCaptureID(ctx, captureID)
	if err != nil {
		return nil, err
	}

	// Build combined result
	result := map[string]interface{}{
		"capture_id": captureID,
		"classification": map[string]interface{}{
			"protocol_detected": cr.ProtocolDetected,
			"ike_version":       cr.IKEVersion,
			"ipsec_mode":        cr.IPSecMode,
			"encryption_algo":   cr.EncryptionAlgo,
			"auth_algo":         cr.AuthAlgo,
			"dh_group":          cr.DHGroup,
			"pfs_detected":      cr.PFSDetected,
			"replay_protection": cr.ReplayProtection,
			"confidence_score":  cr.ConfidenceScore,
			"model_version":     cr.ModelVersion,
		},
		"security_assessment": map[string]interface{}{
			"risk_score":      sa.RiskScore,
			"severity":        sa.Severity,
			"crypto_strength": sa.CryptoStrength,
		},
	}

	// Parse JSON fields
	var findings, recommendations json.RawMessage
	if sa.Findings != nil {
		findings = sa.Findings
	}
	if sa.Recommendations != nil {
		recommendations = sa.Recommendations
	}
	result["security_assessment"].(map[string]interface{})["findings"] = json.RawMessage(findings)
	result["security_assessment"].(map[string]interface{})["recommendations"] = json.RawMessage(recommendations)

	// Parse raw features
	if cr.RawFeatures != nil {
		result["classification"].(map[string]interface{})["raw_features"] = json.RawMessage(cr.RawFeatures)
	}

	return json.Marshal(result)
}
