package api

import (
	"github.com/gin-gonic/gin"

	"ipsec-vpn/backend/internal/handlers"
)

// RegisterRoutes sets up all API routes.
func RegisterRoutes(r *gin.Engine, h *handlers.Handler) {
	// Health check (root level)
	r.GET("/api/v1/health", h.HealthCheck)

	v1 := r.Group("/api/v1")
	{
		// Captures
		captures := v1.Group("/captures")
		{
			captures.POST("/upload", h.UploadCapture)
			captures.GET("", h.ListCaptures)
			captures.GET("/:id", h.GetCapture)
			captures.DELETE("/:id", h.DeleteCapture)
		}

		// Analysis
		analysis := v1.Group("/analysis")
		{
			analysis.POST("/start/:id", h.StartAnalysis)
			analysis.GET("/status/:id", h.GetAnalysisStatus)
			analysis.GET("/results/:id", h.GetAnalysisResults)
		}

		// Classification
		v1.GET("/classification/:id", h.GetClassification)

		// Security
		v1.GET("/security/:id", h.GetSecurityAssessment)

		// Behavioral Anomalies
		v1.GET("/anomalies/:id", h.GetAnomalies)

		// Security Posture
		v1.GET("/posture", h.GetSecurityPosture)

		// Remediation
		v1.GET("/remediation", h.GetRemediations)

		// Capture Comparison
		v1.GET("/compare", h.CompareCaptures)

		// Model Transparency Registry
		v1.GET("/models", h.GetModelRegistry)
		v1.GET("/models/:id", h.GetModelCard)

		// Demo Lab
		v1.GET("/demo/scenarios", h.GetDemoScenarios)

		// Reports
		reports := v1.Group("/reports")
		{
			reports.POST("/generate/:id", h.GenerateReport)
			reports.GET("/:id", h.GetReport)
			reports.GET("/:id/download", h.DownloadReport)
		}

		// Dashboard
		dashboard := v1.Group("/dashboard")
		{
			dashboard.GET("/summary", h.GetDashboardSummary)
		}
	}
}
