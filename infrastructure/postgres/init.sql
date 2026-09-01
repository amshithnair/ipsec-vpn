-- ═══════════════════════════════════════════════════════════
-- IPSEC-VPN Database Initialization
-- Runs automatically on first docker compose up
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── captures ──
CREATE TABLE IF NOT EXISTS captures (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename        VARCHAR(255) NOT NULL,
    file_size       BIGINT NOT NULL,
    file_hash       VARCHAR(64) NOT NULL,
    storage_path    VARCHAR(500) NOT NULL,
    packet_count    INTEGER DEFAULT 0,
    capture_duration DECIMAL(12,3) DEFAULT 0,
    status          VARCHAR(50) NOT NULL DEFAULT 'uploaded',
    source          VARCHAR(50) NOT NULL DEFAULT 'upload',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── analysis_jobs ──
CREATE TABLE IF NOT EXISTS analysis_jobs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    capture_id      UUID NOT NULL REFERENCES captures(id) ON DELETE CASCADE,
    job_type        VARCHAR(50) NOT NULL DEFAULT 'full_analysis',
    status          VARCHAR(50) NOT NULL DEFAULT 'pending',
    priority        INTEGER DEFAULT 0,
    progress        INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    started_at      TIMESTAMP WITH TIME ZONE,
    completed_at    TIMESTAMP WITH TIME ZONE,
    error_message   TEXT,
    worker_id       VARCHAR(100),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── classification_results ──
CREATE TABLE IF NOT EXISTS classification_results (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    capture_id        UUID NOT NULL REFERENCES captures(id) ON DELETE CASCADE,
    protocol_detected VARCHAR(50),
    ike_version       VARCHAR(10),
    ipsec_mode        VARCHAR(20),
    encryption_algo   VARCHAR(50),
    auth_algo         VARCHAR(50),
    dh_group          INTEGER,
    pfs_detected      BOOLEAN,
    replay_protection BOOLEAN,
    sa_lifetime       INTEGER,
    raw_features      JSONB DEFAULT '{}',
    confidence_score  DECIMAL(5,4) DEFAULT 0,
    model_version     VARCHAR(50) DEFAULT 'rules-v1',
    analysis_method   VARCHAR(50) DEFAULT 'Deterministic',
    traffic_inference JSONB DEFAULT NULL,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── security_assessments ──
CREATE TABLE IF NOT EXISTS security_assessments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    capture_id          UUID NOT NULL REFERENCES captures(id) ON DELETE CASCADE,
    classification_id   UUID REFERENCES classification_results(id) ON DELETE SET NULL,
    risk_score          INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    severity            VARCHAR(20) NOT NULL,
    crypto_strength     INTEGER DEFAULT 0 CHECK (crypto_strength >= 0 AND crypto_strength <= 100),
    compliance_status   JSONB DEFAULT '{}',
    findings            JSONB DEFAULT '[]',
    recommendations     JSONB DEFAULT '[]',
    threat_matrix       JSONB DEFAULT '{}',
    assessment_version  VARCHAR(20) DEFAULT 'rules-v1',
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── reports ──
CREATE TABLE IF NOT EXISTS reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    capture_id      UUID NOT NULL REFERENCES captures(id) ON DELETE CASCADE,
    assessment_id   UUID REFERENCES security_assessments(id) ON DELETE SET NULL,
    report_type     VARCHAR(20) NOT NULL DEFAULT 'technical',
    format          VARCHAR(10) NOT NULL DEFAULT 'html',
    content         TEXT,
    storage_path    VARCHAR(500),
    generated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_captures_status ON captures(status);
CREATE INDEX IF NOT EXISTS idx_captures_created ON captures(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_capture ON analysis_jobs(capture_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON analysis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_classification_capture ON classification_results(capture_id);
CREATE INDEX IF NOT EXISTS idx_assessment_capture ON security_assessments(capture_id);
CREATE INDEX IF NOT EXISTS idx_reports_capture ON reports(capture_id);

-- ── Updated_at trigger ──
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_captures_updated_at
    BEFORE UPDATE ON captures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
