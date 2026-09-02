import type { AnalysisStatus, AnalysisStage } from '../types';

// ── Stage progression snapshots ────────────────────────────
// Simulates GET /api/v1/captures/{id}/status at different moments

export const statusMocks: Record<string, AnalysisStatus> = {
  // cap-007: currently mid-way through feature extraction
  'cap-007': {
    status: 'processing',
    stage: 'feature_extraction',
    progress: 48,
  },

  // Simulated snapshots for use in progress page demo cycling
  stage_upload: {
    status: 'processing',
    stage: 'upload',
    progress: 5,
  },
  stage_validate: {
    status: 'processing',
    stage: 'validate',
    progress: 15,
  },
  stage_parse: {
    status: 'processing',
    stage: 'parse',
    progress: 30,
  },
  stage_feature_extraction: {
    status: 'processing',
    stage: 'feature_extraction',
    progress: 48,
  },
  stage_classify: {
    status: 'processing',
    stage: 'classify',
    progress: 65,
  },
  stage_security_assessment: {
    status: 'processing',
    stage: 'security_assessment',
    progress: 82,
  },
  stage_report: {
    status: 'processing',
    stage: 'report',
    progress: 95,
  },
  stage_completed: {
    status: 'completed',
    stage: 'report',
    progress: 100,
  },
  stage_failed: {
    status: 'failed',
    stage: 'parse',
    progress: 30,
    error_message: 'Failed to parse PCAP: file appears truncated or corrupted.',
  },
};

// ── Ordered stage list (for pipeline UI rendering) ─────────
export const PIPELINE_STAGES: { key: AnalysisStage; label: string; description: string }[] = [
  { key: 'upload',             label: 'Upload',             description: 'File received and stored' },
  { key: 'validate',           label: 'Validate',           description: 'Format and integrity check' },
  { key: 'parse',              label: 'Parse',              description: 'PCAP packet dissection' },
  { key: 'feature_extraction', label: 'Extract Features',   description: 'Protocol field extraction' },
  { key: 'classify',           label: 'Classify',           description: 'IPsec protocol classification' },
  { key: 'security_assessment',label: 'Security Assessment','description': 'Risk scoring and finding generation' },
  { key: 'report',             label: 'Report',             description: 'Technical report generation' },
];

// Stage order index for progress comparison
export const STAGE_ORDER: Record<AnalysisStage, number> = {
  upload:             0,
  validate:           1,
  parse:              2,
  feature_extraction: 3,
  classify:           4,
  security_assessment:5,
  report:             6,
};
