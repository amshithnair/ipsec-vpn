package config

import "os"

// Config holds all application configuration.
type Config struct {
	DatabaseURL  string
	RedisURL     string
	AIServiceURL string
	UploadDir    string
	MaxFileSize  int64
	Port         string
	GinMode      string
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

// Load reads configuration from environment variables.
func Load() *Config {
	return &Config{
		DatabaseURL:  getEnv("DATABASE_URL", "postgresql://ipsecvpn:ipsecvpn_secret_2026@localhost:5432/ipsecvpn?sslmode=disable"),
		RedisURL:     getEnv("REDIS_URL", "redis://localhost:6379/0"),
		AIServiceURL: getEnv("AI_SERVICE_URL", "http://localhost:8000"),
		UploadDir:    getEnv("UPLOAD_DIR", "./uploads"),
		MaxFileSize:  52428800, // 50 MB
		Port:         getEnv("PORT", "8080"),
		GinMode:      getEnv("GIN_MODE", "debug"),
	}
}
