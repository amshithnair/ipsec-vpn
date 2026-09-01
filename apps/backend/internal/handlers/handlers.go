package handlers

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"ipsec-vpn/backend/internal/config"
	"ipsec-vpn/backend/internal/models"
	"ipsec-vpn/backend/internal/services"
)

// Handler holds HTTP handler methods.
type Handler struct {
	svc *services.Service
	cfg *config.Config
}

// New creates a new Handler.
func New(svc *services.Service, cfg *config.Config) *Handler {
	return &Handler{svc: svc, cfg: cfg}
}

// ── Health ──

func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "backend",
		"version": "1.0.0",
	})
}

// ── Captures ──

func (h *Handler) UploadCapture(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided", "message": err.Error()})
		return
	}
	defer file.Close()

	capture, err := h.svc.UploadCapture(c.Request.Context(), file, header)
	if err != nil {
		log.Printf("[Handler] Upload error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Upload failed", "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, capture)
}

func (h *Handler) ListCaptures(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	captures, err := h.svc.ListCaptures(c.Request.Context(), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list captures", "message": err.Error()})
		return
	}

	if captures == nil {
		captures = []models.Capture{} // return empty array not null
	}

	c.JSON(http.StatusOK, gin.H{"captures": captures, "count": len(captures)})
}

func (h *Handler) GetCapture(c *gin.Context) {
	id := c.Param("id")
	capture, err := h.svc.GetCapture(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Capture not found", "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, capture)
}

func (h *Handler) DeleteCapture(c *gin.Context) {
	id := c.Param("id")
	if err := h.svc.DeleteCapture(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Capture not found", "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Capture deleted"})
}

// ── Analysis ──

func (h *Handler) StartAnalysis(c *gin.Context) {
	captureID := c.Param("id")
	job, err := h.svc.StartAnalysis(c.Request.Context(), captureID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to start analysis", "message": err.Error()})
		return
	}
	c.JSON(http.StatusAccepted, job)
}

func (h *Handler) GetAnalysisStatus(c *gin.Context) {
	captureID := c.Param("id")
	job, err := h.svc.GetAnalysisStatus(c.Request.Context(), captureID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Analysis job not found", "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, job)
}

func (h *Handler) GetAnalysisResults(c *gin.Context) {
	captureID := c.Param("id")
	result, err := h.svc.GetFullAnalysisResult(c.Request.Context(), captureID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Analysis results not found", "message": err.Error()})
		return
	}
	c.Data(http.StatusOK, "application/json", result)
}

// ── Classification ──

func (h *Handler) GetClassification(c *gin.Context) {
	captureID := c.Param("id")
	result, err := h.svc.GetClassification(c.Request.Context(), captureID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Classification not found", "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// ── Security Assessment ──

func (h *Handler) GetSecurityAssessment(c *gin.Context) {
	captureID := c.Param("id")
	result, err := h.svc.GetSecurityAssessment(c.Request.Context(), captureID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Security assessment not found", "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// ── Reports ──

func (h *Handler) GenerateReport(c *gin.Context) {
	captureID := c.Param("id")
	report, err := h.svc.GenerateReport(c.Request.Context(), captureID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Report generation failed", "message": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"report_id":  report.ID,
		"capture_id": report.CaptureID,
		"format":     report.Format,
		"type":       report.ReportType,
		"generated_at": report.GeneratedAt,
	})
}

func (h *Handler) GetReport(c *gin.Context) {
	id := c.Param("id")

	// Try by report ID first, then by capture ID
	report, err := h.svc.GetReport(c.Request.Context(), id)
	if err != nil {
		report, err = h.svc.GetReportByCaptureID(c.Request.Context(), id)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Report not found", "message": err.Error()})
			return
		}
	}

	// If client wants HTML, return raw HTML
	accept := c.GetHeader("Accept")
	if accept == "text/html" {
		c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(report.Content))
		return
	}

	c.JSON(http.StatusOK, report)
}

func (h *Handler) DownloadReport(c *gin.Context) {
	id := c.Param("id")
	report, err := h.svc.GetReport(c.Request.Context(), id)
	if err != nil {
		report, err = h.svc.GetReportByCaptureID(c.Request.Context(), id)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Report not found"})
			return
		}
	}

	c.Header("Content-Disposition", "attachment; filename=report.html")
	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(report.Content))
}

// ── Dashboard ──

func (h *Handler) GetDashboardSummary(c *gin.Context) {
	summary, err := h.svc.GetDashboardSummary(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dashboard summary", "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, summary)
}

// ── Behavioral Anomalies ──

func (h *Handler) GetAnomalies(c *gin.Context) {
	captureID := c.Param("id")
	result, err := h.svc.GetAnomaly(c.Request.Context(), captureID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Anomaly assessment unavailable",
			"message": "No behavioral anomaly assessment recorded for this capture (capture may have < 5 packets or failed evaluation).",
			"status":  "UNAVAILABLE",
		})
		return
	}
	c.JSON(http.StatusOK, result)
}

// ── Security Posture ──

func (h *Handler) GetSecurityPosture(c *gin.Context) {
	summary, err := h.svc.GetSecurityPosture(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to aggregate security posture", "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, summary)
}

// ── Remediation ──

func (h *Handler) GetRemediations(c *gin.Context) {
	remediations, err := h.svc.GetRemediations(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch remediations", "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"remediations": remediations, "count": len(remediations)})
}

// ── Capture Comparison ──

func (h *Handler) CompareCaptures(c *gin.Context) {
	baseID := c.Query("base")
	targetID := c.Query("target")
	if baseID == "" || targetID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required query parameters: 'base' and 'target'"})
		return
	}

	comparison, err := h.svc.CompareCaptures(c.Request.Context(), baseID, targetID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comparison failed", "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, comparison)
}

// ── Model Registry ──

func (h *Handler) GetModelRegistry(c *gin.Context) {
	models, err := h.svc.GetModelRegistry(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to query AI service model registry", "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"models": models, "count": len(models)})
}

func (h *Handler) GetModelCard(c *gin.Context) {
	modelID := c.Param("id")
	card, err := h.svc.GetModelCard(c.Request.Context(), modelID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Model card not found", "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, card)
}

// ── Demo Lab ──

func (h *Handler) GetDemoScenarios(c *gin.Context) {
	scenarios := h.svc.GetDemoScenarios()
	c.JSON(http.StatusOK, gin.H{"scenarios": scenarios, "count": len(scenarios)})
}

