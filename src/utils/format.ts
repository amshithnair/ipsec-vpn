// ============================================================
//  Shared utility functions
// ============================================================

import type { Severity } from '../types';

// ── Date formatting ─────────────────────────────────────────
export function formatDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatRelativeDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1)   return 'Just now';
    if (minutes < 60)  return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)    return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return iso;
  }
}

// ── File size formatting ────────────────────────────────────
export function formatFileSize(bytes: number | undefined | null): string {
  if (bytes == null) return '—';
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ── Duration formatting ─────────────────────────────────────
export function formatDuration(seconds: number | undefined | null): string {
  if (seconds == null) return '—';
  if (seconds < 60)  return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

// ── Severity color helpers ──────────────────────────────────
export function getSeverityColor(severity: Severity | string): string {
  switch (severity) {
    case 'CRITICAL': return 'var(--sev-critical-text)';
    case 'HIGH':     return 'var(--sev-high-text)';
    case 'MEDIUM':   return 'var(--sev-medium-text)';
    case 'LOW':      return 'var(--sev-low-text)';
    default:         return 'var(--text-muted)';
  }
}

export function getSeverityBg(severity: Severity | string): string {
  switch (severity) {
    case 'CRITICAL': return 'var(--sev-critical-bg)';
    case 'HIGH':     return 'var(--sev-high-bg)';
    case 'MEDIUM':   return 'var(--sev-medium-bg)';
    case 'LOW':      return 'var(--sev-low-bg)';
    default:         return 'var(--bg-overlay)';
  }
}

// ── Risk score → severity mapping ──────────────────────────
export function scoreToSeverity(score: number): Severity {
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MEDIUM';
  return 'LOW';
}

// ── DH Group label helper ───────────────────────────────────
export function dhGroupLabel(group: number | null | undefined): string {
  if (group == null) return '—';
  const labels: Record<number, string> = {
    1:  'Group 1 (768-bit MODP)',
    2:  'Group 2 (1024-bit MODP)',
    5:  'Group 5 (1536-bit MODP)',
    14: 'Group 14 (2048-bit MODP)',
    15: 'Group 15 (3072-bit MODP)',
    16: 'Group 16 (4096-bit MODP)',
    19: 'Group 19 (256-bit ECP)',
    20: 'Group 20 (384-bit ECP)',
    21: 'Group 21 (521-bit ECP)',
  };
  return labels[group] ?? `Group ${group}`;
}

// ── Truncate string ─────────────────────────────────────────
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return `${str.slice(0, maxLen - 1)}…`;
}

// ── Percentage from 0-1 float ───────────────────────────────
export function toPct(value: number): string {
  return `${Math.round(value * 100)}%`;
}
