import type { ReportMeta } from '../types';
import { analysisMockMap } from './analysis.mock';

// ── Report metadata map ─────────────────────────────────────
export const reportMetaMockMap: Record<string, ReportMeta> = {
  'cap-001': {
    title: 'IPsec Security Analysis Report',
    capture_id: 'cap-001',
    filename: 'strong-ipsec.pcap',
    generated_at: '2026-08-31T18:22:15Z',
    ruleset_version: 'v1.4.2',
    model_version: 'ipsec-classifier-v2.1',
  },
  'cap-002': {
    title: 'IPsec Security Analysis Report',
    capture_id: 'cap-002',
    filename: 'weak-crypto-des.pcap',
    generated_at: '2026-08-31T14:05:40Z',
    ruleset_version: 'v1.4.2',
    model_version: 'ipsec-classifier-v2.1',
  },
  'cap-003': {
    title: 'IPsec Security Analysis Report',
    capture_id: 'cap-003',
    filename: 'weak-dh-group1.pcap',
    generated_at: '2026-08-30T09:45:20Z',
    ruleset_version: 'v1.4.2',
    model_version: 'ipsec-classifier-v2.1',
  },
  'cap-004': {
    title: 'IPsec Security Analysis Report',
    capture_id: 'cap-004',
    filename: 'ikev1-main-mode.pcap',
    generated_at: '2026-08-29T22:10:12Z',
    ruleset_version: 'v1.4.2',
    model_version: 'ipsec-classifier-v2.1',
  },
  'cap-005': {
    title: 'Protocol Classification Report — Non-IPsec Traffic',
    capture_id: 'cap-005',
    filename: 'non-ipsec-http.pcap',
    generated_at: '2026-08-29T11:30:05Z',
    ruleset_version: 'v1.4.2',
    model_version: 'ipsec-classifier-v2.1',
  },
  'cap-006': {
    title: 'IPsec Security Analysis Report',
    capture_id: 'cap-006',
    filename: 'pfs-disabled-aes256.pcap',
    generated_at: '2026-08-28T16:55:50Z',
    ruleset_version: 'v1.4.2',
    model_version: 'ipsec-classifier-v2.1',
  },
};

// ── Report HTML generator (frontend-rendered from mock data) ─
// In production, GET /api/v1/captures/{id}/reports?type=technical&format=html
// returns a pre-rendered HTML string from the backend report service.
// In mock mode, we generate it from our analysis fixture data.

export function generateReportHTML(captureId: string): string {
  const analysis = analysisMockMap[captureId];
  const meta = reportMetaMockMap[captureId];
  if (!analysis || !meta) return '<p>Report not available for this capture.</p>';

  const { capture, classification, security } = analysis;

  const severityColor: Record<string, string> = {
    LOW: '#4ade80', MEDIUM: '#fbbf24', HIGH: '#fb923c', CRITICAL: '#f87171',
  };
  const sColor = severityColor[security.severity] ?? '#94a3b8';

  const formatParam = (label: string, value: unknown, notAvailable = false): string => {
    if (value === null || value === undefined || notAvailable) {
      return `<tr><td class="param-label">${label}</td><td class="param-value na">Not available from capture</td></tr>`;
    }
    if (typeof value === 'boolean') {
      return `<tr><td class="param-label">${label}</td><td class="param-value ${value ? 'yes' : 'no'}">${value ? 'Yes' : 'No'}</td></tr>`;
    }
    return `<tr><td class="param-label">${label}</td><td class="param-value">${value}</td></tr>`;
  };

  const findingsHTML = security.findings.length === 0
    ? '<p class="no-findings">No security findings identified.</p>'
    : security.findings.map(f => `
        <div class="finding finding-${f.severity.toLowerCase()}">
          <div class="finding-header">
            <span class="finding-severity">${f.severity}</span>
            <span class="finding-title">${f.title}</span>
            ${f.cve ? `<span class="finding-cve">${f.cve}</span>` : ''}
          </div>
          <div class="finding-body">
            <p><strong>Explanation:</strong> ${f.explanation}</p>
            <p><strong>Impact:</strong> ${f.impact}</p>
          </div>
        </div>
      `).join('');

  const recsHTML = security.recommendations.length === 0
    ? '<p class="no-findings">No recommendations generated.</p>'
    : security.recommendations.map(r => `
        <div class="recommendation rec-${r.priority.toLowerCase()}">
          <div class="rec-header">
            <span class="rec-priority">${r.priority}</span>
            <span class="rec-title">${r.title}</span>
          </div>
          <p class="rec-desc">${r.description}</p>
        </div>
      `).join('');

  const nonIPsec = classification.protocol !== 'IPsec';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${meta.title} — ${capture.filename}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, sans-serif; background: #0b0e14; color: #e2e8f0; font-size: 14px; line-height: 1.6; }
    .report { max-width: 900px; margin: 0 auto; padding: 48px 32px; }
    .report-header { border-bottom: 2px solid #1e2840; padding-bottom: 24px; margin-bottom: 32px; }
    .report-title { font-size: 22px; font-weight: 700; color: #e2e8f0; margin-bottom: 4px; }
    .report-subtitle { font-size: 13px; color: #64748b; }
    .report-meta { display: flex; gap: 32px; margin-top: 16px; flex-wrap: wrap; }
    .meta-item { display: flex; flex-direction: column; gap: 2px; }
    .meta-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em; color: #64748b; }
    .meta-value { font-size: 13px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: #64748b; border-bottom: 1px solid #1e2840; padding-bottom: 8px; margin-bottom: 16px; }
    .score-block { display: flex; align-items: center; gap: 24px; background: #111620; border: 1px solid #1e2840; border-radius: 12px; padding: 20px 24px; }
    .score-value { font-size: 48px; font-weight: 700; color: ${sColor}; line-height: 1; }
    .score-label { font-size: 12px; color: #64748b; }
    .score-severity { font-size: 18px; font-weight: 700; color: ${sColor}; }
    .score-meta { font-size: 12px; color: #64748b; margin-top: 4px; }
    .param-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .param-table tr { border-bottom: 1px solid #1e2840; }
    .param-table tr:last-child { border-bottom: none; }
    .param-label { padding: 10px 16px; color: #94a3b8; width: 200px; background: #111620; }
    .param-value { padding: 10px 16px; color: #e2e8f0; font-family: 'JetBrains Mono', monospace; }
    .param-value.na { color: #475569; font-style: italic; }
    .param-value.yes { color: #4ade80; }
    .param-value.no  { color: #f87171; }
    .finding { background: #111620; border-radius: 8px; padding: 14px 16px; margin-bottom: 12px; border-left: 3px solid transparent; }
    .finding-critical { border-left-color: #dc2626; }
    .finding-high     { border-left-color: #ea580c; }
    .finding-medium   { border-left-color: #ca8a04; }
    .finding-low      { border-left-color: #16a34a; }
    .finding-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
    .finding-severity { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: rgba(255,255,255,0.06); }
    .finding-title { font-weight: 600; color: #e2e8f0; font-size: 14px; }
    .finding-cve { font-size: 11px; padding: 2px 6px; border-radius: 4px; background: rgba(59,130,246,0.15); color: #60a5fa; font-family: monospace; }
    .finding-body p { font-size: 13px; color: #94a3b8; margin-bottom: 6px; }
    .finding-body p:last-child { margin-bottom: 0; }
    .recommendation { background: #111620; border-radius: 8px; padding: 14px 16px; margin-bottom: 12px; }
    .rec-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .rec-priority { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: rgba(255,255,255,0.06); }
    .rec-title { font-weight: 600; color: #e2e8f0; }
    .rec-desc { font-size: 13px; color: #94a3b8; }
    .no-findings { color: #64748b; font-style: italic; font-size: 13px; }
    .confidence-row { display: flex; gap: 24px; }
    .conf-item { flex: 1; }
    .conf-label { font-size: 12px; color: #64748b; margin-bottom: 6px; }
    .conf-bar-wrap { height: 6px; background: #1e2840; border-radius: 99px; overflow: hidden; }
    .conf-bar { height: 100%; border-radius: 99px; background: #3b82f6; }
    .conf-pct { font-size: 13px; font-weight: 600; color: #e2e8f0; margin-top: 4px; }
    .report-footer { border-top: 1px solid #1e2840; padding-top: 20px; margin-top: 40px; font-size: 12px; color: #475569; display: flex; justify-content: space-between; }
    .evidence-block { background: #111620; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .evidence-block h4 { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: #64748b; margin-bottom: 12px; }
    .evidence-badge { display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 4px; font-family: monospace; background: rgba(59,130,246,0.12); color: #60a5fa; margin: 2px; }
    .evidence-na { color: #475569; font-style: italic; font-size: 12px; }
    @media print { body { background: #fff; color: #111; } .report { padding: 24px; } }
  </style>
</head>
<body>
  <div class="report">
    <!-- Header -->
    <div class="report-header">
      <div class="report-title">${meta.title}</div>
      <div class="report-subtitle">AI-Powered IPsec VPN Protocol Analyzer</div>
      <div class="report-meta">
        <div class="meta-item"><span class="meta-label">Capture ID</span><span class="meta-value">${capture.id}</span></div>
        <div class="meta-item"><span class="meta-label">Filename</span><span class="meta-value">${capture.filename}</span></div>
        <div class="meta-item"><span class="meta-label">Analyzed</span><span class="meta-value">${capture.analyzed_at ?? 'N/A'}</span></div>
        <div class="meta-item"><span class="meta-label">Generated</span><span class="meta-value">${meta.generated_at}</span></div>
        ${meta.ruleset_version ? `<div class="meta-item"><span class="meta-label">Ruleset</span><span class="meta-value">${meta.ruleset_version}</span></div>` : ''}
        ${meta.model_version  ? `<div class="meta-item"><span class="meta-label">Model</span><span class="meta-value">${meta.model_version}</span></div>` : ''}
      </div>
    </div>

    <!-- Security Summary -->
    <div class="section">
      <div class="section-title">Security Summary</div>
      <div class="score-block">
        <div>
          <div class="score-label">Risk Score</div>
          <div class="score-value">${security.risk_score}</div>
        </div>
        <div>
          <div class="score-severity">${security.severity}</div>
          <div class="score-meta">Crypto Strength: ${security.crypto_strength_score}/100</div>
          <div class="score-meta">AI Confidence: ${Math.round(security.ai_confidence_score * 100)}%</div>
        </div>
      </div>
    </div>

    <!-- Protocol Classification -->
    <div class="section">
      <div class="section-title">Protocol Classification</div>
      <table class="param-table">
        ${formatParam('Protocol', classification.protocol)}
        ${formatParam('Protocol Confidence', `${Math.round(classification.protocol_confidence * 100)}%`)}
        ${formatParam('Classification Confidence', `${Math.round(classification.confidence_score * 100)}%`)}
      </table>
    </div>

    ${!nonIPsec ? `
    <!-- IPsec / IKE Parameters -->
    <div class="section">
      <div class="section-title">IPsec / IKE Parameters</div>
      <table class="param-table">
        ${formatParam('IKE Version',        classification.ike_version)}
        ${formatParam('IPsec Mode',         classification.mode)}
        ${formatParam('Encryption',         classification.encryption_algo)}
        ${formatParam('Authentication',     classification.auth_algo)}
        ${formatParam('DH Group',           classification.dh_group !== null ? `Group ${classification.dh_group}` : null)}
        ${formatParam('Perfect Forward Secrecy', classification.pfs_detected)}
        ${formatParam('Replay Protection',  classification.replay_protection)}
        ${formatParam('SA Lifetime',        classification.sa_lifetime_seconds !== null ? `${classification.sa_lifetime_seconds}s` : null)}
      </table>
    </div>` : ''}

    <!-- Findings -->
    <div class="section">
      <div class="section-title">Security Findings (${security.findings.length})</div>
      ${findingsHTML}
    </div>

    <!-- Recommendations -->
    <div class="section">
      <div class="section-title">Recommendations (${security.recommendations.length})</div>
      ${recsHTML}
    </div>

    <!-- Technical Evidence (spec §11) -->
    ${!nonIPsec ? `
    <div class="section">
      <div class="section-title">Technical Evidence</div>
      <div class="evidence-block">
        <h4>Observed IKE Attributes</h4>
        <table class="param-table">
          ${formatParam('IKE Version',     classification.ike_version)}
          ${formatParam('Exchange Type',   classification.ike_version === 'IKEv1' ? 'Main Mode / Aggressive Mode' : 'IKE_SA_INIT / IKE_AUTH')}
          ${formatParam('DH Group',        classification.dh_group !== null ? `Group ${classification.dh_group}` : null)}
          ${formatParam('Initiator',       '10.0.0.1')}
          ${formatParam('Responder',       '10.0.0.2')}
        </table>
      </div>
      <div class="evidence-block">
        <h4>Observed Crypto Transforms</h4>
        <table class="param-table">
          ${formatParam('Encryption Algorithm', classification.encryption_algo)}
          ${formatParam('Authentication',       classification.auth_algo)}
          ${formatParam('PFS / DH Group',       classification.pfs_detected !== null ? (classification.pfs_detected ? `Yes — Group ${classification.dh_group}` : 'No') : null)}
        </table>
      </div>
      <div class="evidence-block">
        <h4>Captured Packet Evidence</h4>
        <table class="param-table">
          ${formatParam('IPsec Mode',     classification.mode)}
          ${formatParam('SA Lifetime',    classification.sa_lifetime_seconds !== null ? `${classification.sa_lifetime_seconds}s` : null)}
          ${formatParam('Replay Protection', classification.replay_protection)}
        </table>
      </div>
    </div>` : '<div class="section"><div class="section-title">Technical Evidence</div><p class="no-findings">Not available — no IPsec traffic detected in this capture.</p></div>'}

    <!-- Confidence -->
    <div class="section">
      <div class="section-title">Analysis Confidence</div>
      <div class="confidence-row">
        <div class="conf-item">
          <div class="conf-label">Protocol Classification</div>
          <div class="conf-bar-wrap"><div class="conf-bar" style="width:${Math.round(classification.protocol_confidence * 100)}%"></div></div>
          <div class="conf-pct">${Math.round(classification.protocol_confidence * 100)}%</div>
        </div>
        <div class="conf-item">
          <div class="conf-label">Security Assessment (AI)</div>
          <div class="conf-bar-wrap"><div class="conf-bar" style="width:${Math.round(security.ai_confidence_score * 100)}%"></div></div>
          <div class="conf-pct">${Math.round(security.ai_confidence_score * 100)}%</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="report-footer">
      <span>IPsec Intelligence — Protocol Analyzer</span>
      <span>Generated ${meta.generated_at}</span>
    </div>
  </div>
</body>
</html>`;
}
