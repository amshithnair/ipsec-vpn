// ============================================================
//  Centralized API Service Layer
//  All HTTP access goes through this file.
//  Currently returns mock fixtures — swap each function body
//  for an axios/fetch call when the Go backend is ready.
// ============================================================

import type {
  DashboardSummary,
  CaptureListItem,
  Capture,
  UploadResponse,
  AnalysisStatus,
  Classification,
  SecurityAssessment,
  TechnicalDetails,
  FullAnalysis,
} from '../types';

import { dashboardMock }                          from '../mocks/dashboard.mock';
import { captureListMock, captureMocks }          from '../mocks/captures.mock';
import { uploadResponseMock }                     from '../mocks/upload.mock';
import { statusMocks }                            from '../mocks/status.mock';
import { analysisMockMap, classificationMockMap } from '../mocks/analysis.mock';
import { securityMockMap }                        from '../mocks/security.mock';
import { technicalMockMap }                       from '../mocks/technical.mock';
import { generateReportHTML }                     from '../mocks/report.mock';

// ── Simulated network delay ────────────────────────────────
const delay = (ms = 600) => new Promise<void>(r => setTimeout(r, ms));

// ── Error helper ───────────────────────────────────────────
class ApiNotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'ApiNotFoundError';
  }
}

// ── Dashboard ───────────────────────────────────────────────
// GET /api/v1/dashboard/summary
export async function getDashboardSummary(): Promise<DashboardSummary> {
  await delay(400);
  return structuredClone(dashboardMock);
}

// ── Capture List ────────────────────────────────────────────
// GET /api/v1/captures  (history listing)
export async function getCaptureList(): Promise<CaptureListItem[]> {
  await delay(500);
  return structuredClone(captureListMock);
}

// ── Single Capture Metadata ─────────────────────────────────
// GET /api/v1/captures/{id}
export async function getCapture(captureId: string): Promise<Capture> {
  await delay(350);
  const capture = captureMocks[captureId];
  if (!capture) throw new ApiNotFoundError(`Capture ${captureId}`);
  return structuredClone(capture);
}

// ── Upload ──────────────────────────────────────────────────
// POST /api/v1/captures/upload  (multipart/form-data)
export async function uploadCapture(_file: File): Promise<UploadResponse> {
  await delay(1200); // Simulate upload time
  const response = structuredClone(uploadResponseMock);
  // Use the real filename in mock response
  response.filename = _file.name;
  return response;
}

// ── Start Analysis ──────────────────────────────────────────
// POST /api/v1/captures/{id}/analyze
export async function startAnalysis(captureId: string): Promise<{ id: string; status: string }> {
  await delay(300);
  return { id: captureId, status: 'processing' };
}

// ── Analysis Status ─────────────────────────────────────────
// GET /api/v1/captures/{id}/status
export async function getCaptureStatus(captureId: string): Promise<AnalysisStatus> {
  await delay(200);
  const status = statusMocks[captureId];
  if (!status) {
    // Default: not started
    return { status: 'uploaded', stage: 'upload', progress: 0 };
  }
  return structuredClone(status);
}

// ── Classification ──────────────────────────────────────────
// GET /api/v1/captures/{id}/classification
export async function getClassification(captureId: string): Promise<Classification> {
  await delay(350);
  const classification = classificationMockMap[captureId];
  if (!classification) throw new ApiNotFoundError(`Classification for ${captureId}`);
  return structuredClone(classification);
}

// ── Security Assessment ─────────────────────────────────────
// GET /api/v1/captures/{id}/security-assessment
export async function getSecurityAssessment(captureId: string): Promise<SecurityAssessment> {
  await delay(400);
  const assessment = securityMockMap[captureId];
  if (!assessment) throw new ApiNotFoundError(`Security assessment for ${captureId}`);
  return structuredClone(assessment);
}

// ── Full Analysis (Overview page — 3 calls bundled) ─────────
// Combines: GET capture + classification + security-assessment
export async function getFullAnalysis(captureId: string): Promise<FullAnalysis> {
  await delay(450);
  const analysis = analysisMockMap[captureId];
  if (!analysis) throw new ApiNotFoundError(`Analysis for ${captureId}`);
  return structuredClone(analysis);
}

// ── Technical Details ───────────────────────────────────────
// GET /api/v1/captures/{id}/technical  (or combined from capture+classification)
export async function getTechnicalDetails(captureId: string): Promise<TechnicalDetails> {
  await delay(400);
  const details = technicalMockMap[captureId];
  if (!details) throw new ApiNotFoundError(`Technical details for ${captureId}`);
  return structuredClone(details);
}

// ── Report ──────────────────────────────────────────────────
// GET /api/v1/captures/{id}/reports?type=technical&format=html
// Returns raw HTML string (as the backend report service would)
export async function getReport(captureId: string): Promise<string> {
  await delay(600);
  const html = generateReportHTML(captureId);
  if (!html) throw new ApiNotFoundError(`Report for ${captureId}`);
  return html;
}

// ── Type guard for not-found errors ────────────────────────
export function isNotFoundError(err: unknown): boolean {
  return err instanceof ApiNotFoundError;
}
