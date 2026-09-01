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
	query := `INSERT INTO classification_results (id, capture_id, protocol_detected, ike_version, ipsec_mode, encryption_algo, auth_algo, dh_group, pfs_detected, replay_protection, sa_lifetime, raw_features, confidence_score, model_version, analysis_method, traffic_inference)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
		RETURNING created_at`
	
	// Convert TrafficInference to JSONB
	var trafficInferenceJSON []byte
	if cr.TrafficInference != nil {
		trafficInferenceJSON, _ = json.Marshal(cr.TrafficInference)
	}

	return r.db.QueryRow(ctx, query,
		cr.ID, cr.CaptureID, cr.ProtocolDetected, cr.IKEVersion, cr.IPSecMode,
		cr.EncryptionAlgo, cr.AuthAlgo, cr.DHGroup, cr.PFSDetected, cr.ReplayProtection,
		cr.SALifetime, cr.RawFeatures, cr.ConfidenceScore, cr.ModelVersion,
		cr.AnalysisMethod, trafficInferenceJSON,
	).Scan(&cr.CreatedAt)
}

func (r *Repository) GetClassificationByCaptureID(ctx context.Context, captureID string) (*models.ClassificationResult, error) {
	cr := &models.ClassificationResult{}
	query := `SELECT id, capture_id, protocol_detected, ike_version, ipsec_mode, encryption_algo, auth_algo, dh_group, pfs_detected, replay_protection, sa_lifetime, raw_features, confidence_score, model_version, analysis_method, traffic_inference, created_at
		FROM classification_results WHERE capture_id = $1 ORDER BY created_at DESC LIMIT 1`
	
	var trafficInferenceJSON []byte
	err := r.db.QueryRow(ctx, query, captureID).Scan(
		&cr.ID, &cr.CaptureID, &cr.ProtocolDetected, &cr.IKEVersion, &cr.IPSecMode,
		&cr.EncryptionAlgo, &cr.AuthAlgo, &cr.DHGroup, &cr.PFSDetected, &cr.ReplayProtection,
		&cr.SALifetime, &cr.RawFeatures, &cr.ConfidenceScore, &cr.ModelVersion,
		&cr.AnalysisMethod, &trafficInferenceJSON, &cr.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	
	if len(trafficInferenceJSON) > 0 && string(trafficInferenceJSON) != "null" {
		var ti models.TrafficInference
		if err := json.Unmarshal(trafficInferenceJSON, &ti); err == nil {
			cr.TrafficInference = &ti
		}
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

	// Average risk score & avg crypto strength
	err = r.db.QueryRow(ctx, `SELECT COALESCE(AVG(risk_score), 0), COALESCE(AVG(crypto_strength), 100) FROM security_assessments`).Scan(&summary.AverageRiskScore, &summary.AvgCryptoScore)
	if err != nil {
		return nil, err
	}

	// Anomalies count
	_ = r.db.QueryRow(ctx, `SELECT COUNT(*) FROM anomaly_results WHERE is_anomalous = TRUE`).Scan(&summary.AnomaliesCount)

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

	// Recent analyses joined with anomaly results
	recentRows, err := r.db.Query(ctx, `
		SELECT c.id, c.filename, sa.risk_score, sa.severity, 
		       COALESCE(ar.anomaly_score, 0), COALESCE(ar.is_anomalous, FALSE), sa.created_at
		FROM security_assessments sa
		JOIN captures c ON c.id = sa.capture_id
		LEFT JOIN anomaly_results ar ON ar.capture_id = c.id
		ORDER BY sa.created_at DESC LIMIT 10
	`)
	if err != nil {
		return nil, err
	}
	defer recentRows.Close()
	for recentRows.Next() {
		item := models.RecentItem{}
		if err := recentRows.Scan(&item.CaptureID, &item.Filename, &item.RiskScore, &item.Severity, &item.AnomalyScore, &item.IsAnomalous, &item.CreatedAt); err != nil {
			return nil, err
		}
		summary.RecentAnalyses = append(summary.RecentAnalyses, item)
	}

	return summary, nil
}

// ── Anomaly Results ──

func (r *Repository) CreateAnomalyResult(ctx context.Context, a *models.AnomalyResult) error {
	signalsJSON, err := json.Marshal(a.ContributingSignals)
	if err != nil {
		signalsJSON = []byte("[]")
	}

	query := `INSERT INTO anomaly_results (id, capture_id, anomaly_score, is_anomalous, severity, status, explanation, contributing_signals, model_version, algorithm, validation_status, method_source)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		ON CONFLICT (id) DO UPDATE SET
			anomaly_score = EXCLUDED.anomaly_score,
			is_anomalous = EXCLUDED.is_anomalous,
			severity = EXCLUDED.severity,
			status = EXCLUDED.status,
			explanation = EXCLUDED.explanation,
			contributing_signals = EXCLUDED.contributing_signals
		RETURNING created_at`

	return r.db.QueryRow(ctx, query,
		a.ID, a.CaptureID, a.AnomalyScore, a.IsAnomalous, a.Severity, a.Status,
		a.Explanation, signalsJSON, a.ModelVersion, a.Algorithm, a.ValidationStatus, a.MethodSource,
	).Scan(&a.CreatedAt)
}

func (r *Repository) GetAnomalyByCaptureID(ctx context.Context, captureID string) (*models.AnomalyResult, error) {
	a := &models.AnomalyResult{}
	var signalsRaw json.RawMessage
	query := `SELECT id, capture_id, anomaly_score, is_anomalous, severity, status, explanation, contributing_signals, model_version, algorithm, validation_status, method_source, created_at
		FROM anomaly_results WHERE capture_id = $1 ORDER BY created_at DESC LIMIT 1`

	err := r.db.QueryRow(ctx, query, captureID).Scan(
		&a.ID, &a.CaptureID, &a.AnomalyScore, &a.IsAnomalous, &a.Severity, &a.Status,
		&a.Explanation, &signalsRaw, &a.ModelVersion, &a.Algorithm, &a.ValidationStatus, &a.MethodSource, &a.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	if len(signalsRaw) > 0 {
		_ = json.Unmarshal(signalsRaw, &a.ContributingSignals)
	}
	return a, nil
}

// ── Security Posture Summary ──

func (r *Repository) GetSecurityPosture(ctx context.Context) (*models.SecurityPostureSummary, error) {
	summary := &models.SecurityPostureSummary{
		IKEVersionCounts: make(map[string]int),
		SeverityCounts:   make(map[string]int),
		RecentFindings:   make([]models.FindingItem, 0),
	}

	// Total captures audited
	_ = r.db.QueryRow(ctx, `SELECT COUNT(*) FROM security_assessments`).Scan(&summary.TotalAuditedCaptures)

	// Posture scores
	var avgRisk, avgCrypto float64
	_ = r.db.QueryRow(ctx, `SELECT COALESCE(AVG(risk_score), 0), COALESCE(AVG(crypto_strength), 100) FROM security_assessments`).Scan(&avgRisk, &avgCrypto)
	summary.CryptoScore = int(avgCrypto)
	summary.OverallPostureScore = max(0, 100-int(avgRisk))

	// Protocol score based on modern IKE & cipher adoption
	var v2Count, totalClass int
	_ = r.db.QueryRow(ctx, `SELECT COUNT(*), COUNT(CASE WHEN ike_version ILIKE '%2%' THEN 1 END) FROM classification_results`).Scan(&totalClass, &v2Count)
	if totalClass > 0 {
		summary.ProtocolScore = int((float64(v2Count) / float64(totalClass)) * 100)
	} else {
		summary.ProtocolScore = 100
	}

	// Behavioral score based on anomaly rates
	var anomCount, totalAnom int
	_ = r.db.QueryRow(ctx, `SELECT COUNT(*), COUNT(CASE WHEN is_anomalous = TRUE THEN 1 END) FROM anomaly_results`).Scan(&totalAnom, &anomCount)
	if totalAnom > 0 {
		summary.BehavioralScore = max(0, 100-int((float64(anomCount)/float64(totalAnom))*100))
	} else {
		summary.BehavioralScore = 100
	}

	// High and Critical count
	_ = r.db.QueryRow(ctx, `SELECT COUNT(*) FROM security_assessments WHERE severity IN ('HIGH', 'CRITICAL')`).Scan(&summary.HighCriticalFindings)

	// PFS and Replay Adoption rates
	var pfsCount, replayCount int
	_ = r.db.QueryRow(ctx, `SELECT COUNT(CASE WHEN pfs_detected = TRUE THEN 1 END), COUNT(CASE WHEN replay_protection = TRUE THEN 1 END) FROM classification_results`).Scan(&pfsCount, &replayCount)
	if totalClass > 0 {
		summary.PFSAdoptionRate = float64(pfsCount) / float64(totalClass)
		summary.ReplayProtectionRate = float64(replayCount) / float64(totalClass)
	}

	// IKE Version breakdown
	ikeRows, err := r.db.Query(ctx, `SELECT COALESCE(ike_version, 'Unknown'), COUNT(*) FROM classification_results GROUP BY ike_version`)
	if err == nil {
		defer ikeRows.Close()
		for ikeRows.Next() {
			var ver string
			var count int
			if err := ikeRows.Scan(&ver, &count); err == nil {
				summary.IKEVersionCounts[ver] = count
			}
		}
	}

	// Weak ciphers and weak DH count
	_ = r.db.QueryRow(ctx, `SELECT COUNT(*) FROM classification_results WHERE encryption_algo ILIKE '%3DES%' OR encryption_algo ILIKE '%DES%' OR encryption_algo ILIKE '%NULL%'`).Scan(&summary.WeakCipherCount)
	_ = r.db.QueryRow(ctx, `SELECT COUNT(*) FROM classification_results WHERE dh_group IS NOT NULL AND dh_group < 14`).Scan(&summary.WeakDHCount)

	// Severity breakdown
	sevRows, err := r.db.Query(ctx, `SELECT severity, COUNT(*) FROM security_assessments GROUP BY severity`)
	if err == nil {
		defer sevRows.Close()
		for sevRows.Next() {
			var sev string
			var count int
			if err := sevRows.Scan(&sev, &count); err == nil {
				summary.SeverityCounts[sev] = count
			}
		}
	}

	// Recent findings
	fRows, err := r.db.Query(ctx, `
		SELECT c.id, c.filename, sa.findings
		FROM security_assessments sa
		JOIN captures c ON c.id = sa.capture_id
		ORDER BY sa.created_at DESC LIMIT 5
	`)
	if err == nil {
		defer fRows.Close()
		for fRows.Next() {
			var capID, fname string
			var findingsRaw json.RawMessage
			if err := fRows.Scan(&capID, &fname, &findingsRaw); err == nil && len(findingsRaw) > 0 {
				var findingsList []struct {
					ID       string `json:"id"`
					Title    string `json:"title"`
					Severity string `json:"severity"`
					Source   string `json:"source"`
				}
				if err := json.Unmarshal(findingsRaw, &findingsList); err == nil {
					for _, f := range findingsList {
						src := f.Source
						if src == "" {
							src = "RULE_BASED"
						}
						summary.RecentFindings = append(summary.RecentFindings, models.FindingItem{
							CaptureID: capID,
							Filename:  fname,
							FindingID: f.ID,
							Title:     f.Title,
							Severity:  f.Severity,
							Source:    src,
						})
					}
				}
			}
		}
	}

	return summary, nil
}

// ── Remediation Aggregation ──

func (r *Repository) GetRemediations(ctx context.Context) ([]models.RemediationItem, error) {
	rows, err := r.db.Query(ctx, `
		SELECT c.id, sa.recommendations
		FROM security_assessments sa
		JOIN captures c ON c.id = sa.capture_id
		ORDER BY sa.created_at DESC LIMIT 30
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	recMap := make(map[string]*models.RemediationItem)

	for rows.Next() {
		var capID string
		var recsRaw json.RawMessage
		if err := rows.Scan(&capID, &recsRaw); err != nil || len(recsRaw) == 0 {
			continue
		}

		var recList []struct {
			ID          string `json:"id"`
			Priority    string `json:"priority"`
			Category    string `json:"category"`
			Title       string `json:"title"`
			Description string `json:"description"`
			Action      string `json:"action"`
		}
		if err := json.Unmarshal(recsRaw, &recList); err != nil {
			continue
		}

		for _, item := range recList {
			key := item.Title
			if existing, found := recMap[key]; found {
				// add affected capture if not already present
				hasCap := false
				for _, id := range existing.AffectedCaptures {
					if id == capID {
						hasCap = true
						break
					}
				}
				if !hasCap {
					existing.AffectedCaptures = append(existing.AffectedCaptures, capID)
				}
			} else {
				recMap[key] = &models.RemediationItem{
					ID:               item.ID,
					Title:            item.Title,
					Priority:         item.Priority,
					Category:         item.Category,
					Description:      item.Description,
					Action:           item.Action,
					AffectedCaptures: []string{capID},
					Source:           "NIST_SP_800_131A",
				}
			}
		}
	}

	remediations := make([]models.RemediationItem, 0, len(recMap))
	for _, item := range recMap {
		remediations = append(remediations, *item)
	}
	return remediations, nil
}

// ── Capture Comparison ──

func (r *Repository) CompareCaptures(ctx context.Context, baseID, targetID string) (*models.CaptureComparison, error) {
	baseCap, err := r.GetCapture(ctx, baseID)
	if err != nil {
		return nil, err
	}
	targetCap, err := r.GetCapture(ctx, targetID)
	if err != nil {
		return nil, err
	}

	baseCr, _ := r.GetClassificationByCaptureID(ctx, baseID)
	targetCr, _ := r.GetClassificationByCaptureID(ctx, targetID)

	baseSa, _ := r.GetSecurityAssessmentByCaptureID(ctx, baseID)
	targetSa, _ := r.GetSecurityAssessmentByCaptureID(ctx, targetID)

	baseAnom, _ := r.GetAnomalyByCaptureID(ctx, baseID)
	targetAnom, _ := r.GetAnomalyByCaptureID(ctx, targetID)

	baseRisk := 0
	if baseSa != nil {
		baseRisk = baseSa.RiskScore
	}
	targetRisk := 0
	if targetSa != nil {
		targetRisk = targetSa.RiskScore
	}

	scoreDiff := baseRisk - targetRisk // positive = improved security
	postureImprovement := "UNCHANGED"
	if scoreDiff > 0 {
		postureImprovement = "IMPROVED"
	} else if scoreDiff < 0 {
		postureImprovement = "DEGRADED"
	}

	baseClassMap := make(map[string]interface{})
	if baseCr != nil {
		baseClassMap["protocol"] = baseCr.ProtocolDetected
		baseClassMap["ike_version"] = baseCr.IKEVersion
		baseClassMap["encryption_algo"] = baseCr.EncryptionAlgo
		baseClassMap["auth_algo"] = baseCr.AuthAlgo
		baseClassMap["dh_group"] = baseCr.DHGroup
		baseClassMap["pfs_detected"] = baseCr.PFSDetected
		baseClassMap["replay_protection"] = baseCr.ReplayProtection
	}

	targetClassMap := make(map[string]interface{})
	if targetCr != nil {
		targetClassMap["protocol"] = targetCr.ProtocolDetected
		targetClassMap["ike_version"] = targetCr.IKEVersion
		targetClassMap["encryption_algo"] = targetCr.EncryptionAlgo
		targetClassMap["auth_algo"] = targetCr.AuthAlgo
		targetClassMap["dh_group"] = targetCr.DHGroup
		targetClassMap["pfs_detected"] = targetCr.PFSDetected
		targetClassMap["replay_protection"] = targetCr.ReplayProtection
	}

	baseSecMap := make(map[string]interface{})
	if baseSa != nil {
		baseSecMap["risk_score"] = baseSa.RiskScore
		baseSecMap["severity"] = baseSa.Severity
		baseSecMap["crypto_strength"] = baseSa.CryptoStrength
	}

	targetSecMap := make(map[string]interface{})
	if targetSa != nil {
		targetSecMap["risk_score"] = targetSa.RiskScore
		targetSecMap["severity"] = targetSa.Severity
		targetSecMap["crypto_strength"] = targetSa.CryptoStrength
	}

	return &models.CaptureComparison{
		BaseCaptureID:        baseID,
		BaseFilename:         baseCap.Filename,
		TargetCaptureID:      targetID,
		TargetFilename:       targetCap.Filename,
		ScoreDifference:      scoreDiff,
		PostureImprovement:   postureImprovement,
		BaseClassification:   baseClassMap,
		TargetClassification: targetClassMap,
		BaseSecurity:         baseSecMap,
		TargetSecurity:       targetSecMap,
		BaseAnomaly:          baseAnom,
		TargetAnomaly:        targetAnom,
	}, nil
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

	// Get capture
	cap, err := r.GetCapture(ctx, captureID)
	if err != nil {
		return nil, err
	}

	// Get anomaly assessment if exists
	anom, _ := r.GetAnomalyByCaptureID(ctx, captureID)

	// Build combined result
	result := map[string]interface{}{
		"capture": cap,
		"classification": map[string]interface{}{
			"protocol":            cr.ProtocolDetected,
			"ike_version":         cr.IKEVersion,
			"mode":                cr.IPSecMode,
			"encryption_algo":     cr.EncryptionAlgo,
			"auth_algo":           cr.AuthAlgo,
			"dh_group":            cr.DHGroup,
			"pfs_detected":        cr.PFSDetected,
			"replay_protection":   cr.ReplayProtection,
			"confidence_score":    cr.ConfidenceScore,
			"model_version":       cr.ModelVersion,
			"sa_lifetime_seconds": cr.SALifetime,
			"analysis_method":     cr.AnalysisMethod,
			"method_source":       cr.MethodSource,
			"traffic_inference":   cr.TrafficInference,
		},
		"security": map[string]interface{}{
			"risk_score":      sa.RiskScore,
			"severity":        sa.Severity,
			"crypto_strength": sa.CryptoStrength,
			"method_source":   "HYBRID_RISK",
		},
	}

	if anom != nil {
		result["anomaly_assessment"] = anom
	}

	// Parse JSON fields
	var findings, recommendations json.RawMessage
	if sa.Findings != nil {
		findings = sa.Findings
	}
	if sa.Recommendations != nil {
		recommendations = sa.Recommendations
	}
	result["security"].(map[string]interface{})["findings"] = json.RawMessage(findings)
	result["security"].(map[string]interface{})["recommendations"] = json.RawMessage(recommendations)

	// Parse raw features
	if cr.RawFeatures != nil {
		result["classification"].(map[string]interface{})["raw_features"] = json.RawMessage(cr.RawFeatures)
	}

	return json.Marshal(result)
}

