import type { SecurityAssessment } from '../types';
import { analysisMockMap } from './analysis.mock';

// Security assessment is a subset of the full analysis mock.
// Re-exported here for direct consumption by the security page service call.

export const securityMockMap: Record<string, SecurityAssessment> = Object.fromEntries(
  Object.entries(analysisMockMap).map(([id, a]) => [id, a.security])
);
