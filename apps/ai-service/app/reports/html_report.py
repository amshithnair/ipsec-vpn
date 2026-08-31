"""
HTML Report Generator — Produces professional technical security analysis reports.
"""

from __future__ import annotations

from datetime import datetime, timezone
from app.models.schemas import AnalysisResponse


def generate_html_report(analysis: AnalysisResponse, capture_filename: str = "Unknown") -> str:
    """Generate a professional HTML technical report from analysis results."""

    severity_colors = {
        "LOW": "#22c55e",
        "MEDIUM": "#eab308",
        "HIGH": "#f97316",
        "CRITICAL": "#ef4444",
        "INFO": "#3b82f6",
    }

    risk_score = analysis.security_assessment.risk_score
    severity = analysis.security_assessment.severity
    severity_color = severity_colors.get(severity, "#6b7280")

    findings_html = ""
    for f in analysis.security_assessment.findings:
        f_color = severity_colors.get(f.severity, "#6b7280")
        findings_html += f"""
        <div class="finding" style="border-left: 4px solid {f_color};">
            <div class="finding-header">
                <span class="severity-badge" style="background:{f_color};">{f.severity}</span>
                <strong>{f.title}</strong>
                <span class="finding-id">{f.id}</span>
            </div>
            <p>{f.description}</p>
            <div class="evidence">Evidence: <code>{f.evidence}</code></div>
        </div>
        """

    recommendations_html = ""
    for r in analysis.security_assessment.recommendations:
        r_color = severity_colors.get(r.priority, "#6b7280")
        recommendations_html += f"""
        <div class="recommendation">
            <div class="rec-header">
                <span class="priority-badge" style="background:{r_color};">{r.priority}</span>
                <strong>{r.title}</strong>
            </div>
            <p>{r.description}</p>
            <div class="action"><strong>Action:</strong> {r.action}</div>
        </div>
        """

    timestamp = analysis.timestamp or datetime.now(timezone.utc).isoformat()

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IPsec Security Analysis Report — {capture_filename}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            line-height: 1.6;
        }}
        .container {{ max-width: 900px; margin: 0 auto; padding: 40px 24px; }}

        /* Header */
        .report-header {{
            text-align: center;
            padding: 40px 0 32px;
            border-bottom: 2px solid #1e293b;
            margin-bottom: 32px;
        }}
        .report-header h1 {{
            font-size: 28px;
            font-weight: 700;
            color: #f8fafc;
            margin-bottom: 8px;
        }}
        .report-header .subtitle {{
            color: #94a3b8;
            font-size: 14px;
        }}
        .report-header .report-meta {{
            display: flex;
            justify-content: center;
            gap: 24px;
            margin-top: 16px;
            font-size: 13px;
            color: #64748b;
        }}

        /* Risk Score Banner */
        .risk-banner {{
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 32px;
            text-align: center;
            margin-bottom: 32px;
        }}
        .risk-score {{
            font-size: 72px;
            font-weight: 800;
            color: {severity_color};
            line-height: 1;
        }}
        .risk-label {{
            font-size: 14px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 4px;
        }}
        .severity-tag {{
            display: inline-block;
            padding: 6px 20px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 16px;
            color: white;
            background: {severity_color};
            margin-top: 12px;
        }}

        /* Sections */
        .section {{
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
        }}
        .section h2 {{
            font-size: 18px;
            font-weight: 600;
            color: #f8fafc;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid #334155;
        }}

        /* Protocol Details Grid */
        .details-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }}
        .detail-item {{
            padding: 12px;
            background: #0f172a;
            border-radius: 8px;
        }}
        .detail-label {{
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        .detail-value {{
            font-size: 16px;
            font-weight: 600;
            color: #f8fafc;
            margin-top: 4px;
        }}

        /* Findings */
        .finding {{
            background: #0f172a;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
        }}
        .finding-header {{
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
        }}
        .severity-badge, .priority-badge {{
            display: inline-block;
            padding: 2px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 700;
            color: white;
            text-transform: uppercase;
        }}
        .finding-id {{
            color: #64748b;
            font-size: 12px;
            margin-left: auto;
        }}
        .evidence {{
            font-size: 12px;
            color: #64748b;
            margin-top: 8px;
        }}
        .evidence code {{
            background: #334155;
            padding: 2px 6px;
            border-radius: 4px;
            color: #94a3b8;
        }}

        /* Recommendations */
        .recommendation {{
            background: #0f172a;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            border-left: 3px solid #3b82f6;
        }}
        .rec-header {{
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
        }}
        .action {{
            font-size: 13px;
            color: #94a3b8;
            margin-top: 8px;
            padding: 8px;
            background: #1e293b;
            border-radius: 4px;
        }}

        /* Confidence */
        .confidence-bar {{
            height: 8px;
            background: #334155;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 4px;
        }}
        .confidence-fill {{
            height: 100%;
            background: #3b82f6;
            border-radius: 4px;
        }}

        /* Footer */
        .report-footer {{
            text-align: center;
            padding: 24px 0;
            color: #475569;
            font-size: 12px;
            border-top: 1px solid #1e293b;
            margin-top: 32px;
        }}

        @media print {{
            body {{ background: white; color: #1e293b; }}
            .section {{ border-color: #e2e8f0; }}
            .detail-item {{ background: #f8fafc; }}
            .finding {{ background: #f8fafc; }}
        }}
    </style>
</head>
<body>
<div class="container">
    <!-- Header -->
    <div class="report-header">
        <h1>🔒 IPsec VPN Security Analysis Report</h1>
        <p class="subtitle">IPSEC-VPN Automated Protocol Analyzer</p>
        <div class="report-meta">
            <span>📄 {capture_filename}</span>
            <span>🕐 {timestamp}</span>
            <span>📊 Model: {analysis.confidence.model_version}</span>
        </div>
    </div>

    <!-- Risk Score -->
    <div class="risk-banner">
        <div class="risk-score">{risk_score}</div>
        <div class="risk-label">Risk Score</div>
        <div class="severity-tag">{severity}</div>
        <div style="margin-top:12px; color:#94a3b8; font-size:13px;">
            Crypto Strength: {analysis.security_assessment.crypto_strength_score}/100
        </div>
    </div>

    <!-- Protocol Classification -->
    <div class="section">
        <h2>Protocol Classification</h2>
        <div class="details-grid">
            <div class="detail-item">
                <div class="detail-label">Protocol</div>
                <div class="detail-value">{analysis.classification.protocol}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">IKE Version</div>
                <div class="detail-value">{analysis.classification.ike_version or 'N/A'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">IPsec Mode</div>
                <div class="detail-value">{analysis.classification.ipsec_mode or 'N/A'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Sub-Protocols</div>
                <div class="detail-value">{', '.join(analysis.classification.sub_protocols) or 'N/A'}</div>
            </div>
        </div>
    </div>

    <!-- Cryptographic Analysis -->
    <div class="section">
        <h2>Cryptographic Analysis</h2>
        <div class="details-grid">
            <div class="detail-item">
                <div class="detail-label">Encryption</div>
                <div class="detail-value">{analysis.crypto_analysis.encryption.algorithm}</div>
                <div style="font-size:12px;color:#64748b;">Strength: {analysis.crypto_analysis.encryption.strength}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Authentication</div>
                <div class="detail-value">{analysis.crypto_analysis.authentication.algorithm}</div>
                <div style="font-size:12px;color:#64748b;">Strength: {analysis.crypto_analysis.authentication.strength}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">DH Group</div>
                <div class="detail-value">Group {analysis.crypto_analysis.dh_group.group_number or 'N/A'} ({analysis.crypto_analysis.dh_group.name})</div>
                <div style="font-size:12px;color:#64748b;">Strength: {analysis.crypto_analysis.dh_group.strength}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Perfect Forward Secrecy</div>
                <div class="detail-value">{'✅ Enabled' if analysis.crypto_analysis.pfs.detected else '❌ Not Detected'}</div>
            </div>
        </div>
    </div>

    <!-- Security Findings -->
    <div class="section">
        <h2>Security Findings ({len(analysis.security_assessment.findings)})</h2>
        {findings_html if findings_html else '<p style="color:#64748b;">No findings to report.</p>'}
    </div>

    <!-- Recommendations -->
    <div class="section">
        <h2>Recommendations ({len(analysis.security_assessment.recommendations)})</h2>
        {recommendations_html if recommendations_html else '<p style="color:#64748b;">No recommendations at this time.</p>'}
    </div>

    <!-- Confidence -->
    <div class="section">
        <h2>Analysis Confidence</h2>
        <div class="details-grid">
            <div class="detail-item">
                <div class="detail-label">Overall Confidence</div>
                <div class="detail-value">{analysis.confidence.overall_score:.0%}</div>
                <div class="confidence-bar"><div class="confidence-fill" style="width:{analysis.confidence.overall_score:.0%};"></div></div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Classification Confidence</div>
                <div class="detail-value">{analysis.confidence.classification_confidence:.0%}</div>
                <div class="confidence-bar"><div class="confidence-fill" style="width:{analysis.confidence.classification_confidence:.0%};"></div></div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Extraction Completeness</div>
                <div class="detail-value">{analysis.confidence.extraction_completeness:.0%}</div>
                <div class="confidence-bar"><div class="confidence-fill" style="width:{analysis.confidence.extraction_completeness:.0%};"></div></div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Packets Analyzed</div>
                <div class="detail-value">{analysis.metadata.packets_analyzed}</div>
                <div style="font-size:12px;color:#64748b;">IPsec packets: {analysis.metadata.ipsec_packets}</div>
            </div>
        </div>
    </div>

    <!-- Capture Metadata -->
    <div class="section">
        <h2>Capture Metadata</h2>
        <div class="details-grid">
            <div class="detail-item">
                <div class="detail-label">File</div>
                <div class="detail-value">{capture_filename}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">File Size</div>
                <div class="detail-value">{analysis.metadata.file_size_bytes:,} bytes</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Capture Duration</div>
                <div class="detail-value">{analysis.metadata.capture_duration_seconds:.1f}s</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Processing Time</div>
                <div class="detail-value">{analysis.metadata.processing_time_ms}ms</div>
            </div>
        </div>
    </div>

    <div class="report-footer">
        <p>Generated by IPSEC-VPN Protocol Analyzer • Rules Version: {analysis.confidence.model_version}</p>
        <p>This is an automated security assessment. Manual review is recommended for critical findings.</p>
    </div>
</div>
</body>
</html>"""
