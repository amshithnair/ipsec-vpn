// ============================================================
//  Reusable data-fetching hooks
//  Each hook wraps a service call with loading/error state.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  getDashboardSummary,
  getCaptureList,
  getCapture,
  getCaptureStatus,
  getFullAnalysis,
  getSecurityAssessment,
  getTechnicalDetails,
  getReport,
  isNotFoundError,
} from '../services/api';
import type {
  DashboardSummary,
  CaptureListItem,
  Capture,
  AnalysisStatus,
  FullAnalysis,
  SecurityAssessment,
  TechnicalDetails,
} from '../types';

// ── Generic async hook factory ──────────────────────────────
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  refetch: () => void;
}

function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[]
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);

    fn()
      .then(result => {
        if (!cancelled) { setData(result); setLoading(false); }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoading(false);
          if (isNotFoundError(err)) {
            setNotFound(true);
          } else {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
          }
        }
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  return { data, loading, error, notFound, refetch };
}

// ── Dashboard ───────────────────────────────────────────────
export function useDashboard(): AsyncState<DashboardSummary> {
  return useAsync(getDashboardSummary, []);
}

// ── Capture List ────────────────────────────────────────────
export function useCaptureList(): AsyncState<CaptureListItem[]> {
  return useAsync(getCaptureList, []);
}

// ── Single Capture ──────────────────────────────────────────
export function useCapture(captureId: string): AsyncState<Capture> {
  return useAsync(() => getCapture(captureId), [captureId]);
}

// ── Analysis Status (with optional polling) ─────────────────
export function useCaptureStatus(
  captureId: string,
  pollIntervalMs = 0
): AsyncState<AnalysisStatus> & { isPolling: boolean } {
  const [data, setData] = useState<AnalysisStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tick, setTick] = useState(0);

  const fetch = useCallback(async () => {
    try {
      const result = await getCaptureStatus(captureId);
      setData(result);
      setLoading(false);
      return result;
    } catch (err: unknown) {
      setLoading(false);
      if (isNotFoundError(err)) setNotFound(true);
      else setError(err instanceof Error ? err.message : 'Error fetching status');
      return null;
    }
  }, [captureId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);

    fetch();

    if (pollIntervalMs > 0) {
      const interval = setInterval(async () => {
        if (cancelled) return;
        const result = await fetch();
        // Stop polling when terminal state reached
        if (result && (result.status === 'completed' || result.status === 'failed')) {
          clearInterval(interval);
        }
      }, pollIntervalMs);
      return () => { cancelled = true; clearInterval(interval); };
    }

    return () => { cancelled = true; };
  }, [captureId, pollIntervalMs, tick, fetch]);

  const refetch = useCallback(() => setTick(t => t + 1), []);
  const isPolling = pollIntervalMs > 0 && data?.status === 'processing';

  return { data, loading, error, notFound, refetch, isPolling };
}

// ── Full Analysis ────────────────────────────────────────────
export function useFullAnalysis(captureId: string): AsyncState<FullAnalysis> {
  return useAsync(() => getFullAnalysis(captureId), [captureId]);
}

// ── Security Assessment ──────────────────────────────────────
export function useSecurityAssessment(captureId: string): AsyncState<SecurityAssessment> {
  return useAsync(() => getSecurityAssessment(captureId), [captureId]);
}

// ── Technical Details ────────────────────────────────────────
export function useTechnicalDetails(captureId: string): AsyncState<TechnicalDetails> {
  return useAsync(() => getTechnicalDetails(captureId), [captureId]);
}

// ── Report HTML ───────────────────────────────────────────────
export function useReport(captureId: string): AsyncState<string> {
  return useAsync(() => getReport(captureId), [captureId]);
}
