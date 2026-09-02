"""
HTML Report Generator — Produces professional technical security intelligence reports.
Distinguishes deterministic packet evidence from rule-based and ML-derived insights.
"""

from __future__ import annotations

from datetime import datetime, timezone
from app.models.schemas import AnalysisResponse


def generate_html_report(analysis: AnalysisResponse, capture_filename: str = "Unknown") -> str:
    """Generate a comprehensive, professional HTML security intelligence report."""

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

    # Findings
    findings_html = ""
    if not analysis.security_assessment.findings:
        findings_html = """
        <div class="empty-notice">
            <span>✓ No critical security weaknesses identified in this capture.</span>
        </div>
        """
    else:
        for f in analysis.security_assessment.findings:
            f_color = severity_colors.get(f.severity, "#6b7280")
            source_badge = f.source if hasattr(f, 'source') and f.source else "RULE_BASED"
            findings_html += f"""
            <div class="finding" style="border-left: 4px solid {f_color};">
                <div class="finding-header">
                    <span class="severity-badge" style="background:{f_color};">{f.severity}</span>
                    <span class="source-badge">{source_badge}</span>
                    <strong>{f.title}</strong>
                    <span class="finding-id">{f.id}</span>
                </div>
                <p class="finding-desc">{f.description}</p>
                <div class="evidence-box">
                    <span class="evidence-label">Observed Evidence:</span>
                    <code>{f.evidence}</code>
                </div>
            </div>
            """

    # Recommendations
    recommendations_html = ""
    if not analysis.security_assessment.recommendations:
        recommendations_html = """
        <div class="empty-notice">
            <span>No pending configuration actions recommended.</span>
        </div>
        """
    else:
        for r in analysis.security_assessment.recommendations:
            r_color = severity_colors.get(r.priority, "#6b7280")
            recommendations_html += f"""
            <div class="recommendation">
                <div class="rec-header">
                    <span class="priority-badge" style="background:{r_color};">{r.priority}</span>
                    <strong>{r.title}</strong>
                </div>
                <p>{r.description}</p>
                {f'<div class="action-box"><strong>Recommended Action:</strong> {r.action}</div>' if r.action else ''}
            </div>
            """

    # Anomaly Section
    anomaly = getattr(analysis, 'anomaly_assessment', None)
    anomaly_html = ""
    if anomaly and anomaly.status == "EVALUATED":
        anom_color = severity_colors.get(anomaly.severity, "#22c55e")
        signals_html = ""
        for sig in anomaly.contributing_signals:
            signals_html += f"""
            <tr>
                <td><code>{sig.feature_name}</code></td>
                <td>{sig.observed_value}</td>
                <td>{sig.baseline_mean}</td>
                <td><strong>{sig.deviation_z_score}σ ({sig.direction})</strong></td>
            </tr>
            """
        
        if not anomaly.contributing_signals:
            signals_html = "<tr><td colspan='4' style='text-align:center; color:#94a3b8;'>No anomalous feature deviations detected.</td></tr>"

        anomaly_html = f"""
        <div class="section">
            <div class="section-header">
                <h2>Behavioral Anomaly Analysis</h2>
                <span class="source-badge">ML_ANOMALY</span>
            </div>
            <div class="anomaly-summary">
                <div class="stat-card">
                    <div class="stat-val" style="color: {anom_color};">{anomaly.anomaly_score} / 100</div>
                    <div class="stat-lbl">Anomaly Score (Isolation Forest)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-val" style="color: {anom_color};">{anomaly.severity}</div>
                    <div class="stat-lbl">Behavioral Risk</div>
                </div>
                <div class="stat-card">
                    <div class="stat-val">{anomaly.algorithm}</div>
                    <div class="stat-lbl">Engine ({anomaly.model_version})</div>
                </div>
            </div>
            <p style="margin: 16px 0; color: #cbd5e1;">{anomaly.explanation}</p>
            
            <h3 style="font-size: 14px; text-transform: uppercase; color: #94a3b8; margin-top: 16px; margin-bottom: 8px;">Top Contributing Signals</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Flow Feature</th>
                        <th>Observed Value</th>
                        <th>Baseline Mean</th>
                        <th>Deviation</th>
                    </tr>
                </thead>
                <tbody>
                    {signals_html}
                </tbody>
            </table>
        </div>
        """
    else:
        anomaly_html = """
        <div class="section">
            <div class="section-header">
                <h2>Behavioral Anomaly Analysis</h2>
                <span class="source-badge">ML_ANOMALY</span>
            </div>
            <p style="color: #94a3b8; font-style: italic;">Behavioral flow analysis unavailable — capture contains insufficient flow volume (< 5 packets).</p>
        </div>
        """

    # ML Traffic Classification Section
    traffic_inf = getattr(analysis.classification, 'traffic_inference', None)
    ml_class_html = ""
    if traffic_inf and traffic_inf.traffic_type:
        ml_class_html = f"""
        <div class="section">
            <div class="section-header">
                <h2>Encrypted Traffic Classification</h2>
                <span class="source-badge">ML_CLASSIFIER</span>
            </div>
            <div class="anomaly-summary">
                <div class="stat-card">
                    <div class="stat-val" style="color: #38bdf8;">{traffic_inf.traffic_type}</div>
                    <div class="stat-lbl">Inferred Traffic Class</div>
                </div>
                <div class="stat-card">
                    <div class="stat-val">Random Forest v1.0</div>
                    <div class="stat-lbl">Model Architecture</div>
                </div>
                <div class="stat-card">
                    <div class="stat-val" style="font-size: 14px; color: #94a3b8;">Development / Synthetic Baseline</div>
                    <div class="stat-lbl">Validation Status</div>
                </div>
            </div>
            <p style="margin-top: 12px; font-size: 13px; color: #94a3b8;">
                Classification inferred strictly from statistical flow characteristics (packet sizes, timing, burst ratios) without payload decryption.
            </p>
        </div>
        """

    timestamp = analysis.timestamp or datetime.now(timezone.utc).isoformat()
    ike_ver = analysis.classification.ike_version or "Unknown"
    ipsec_mode = analysis.classification.ipsec_mode or "Unknown"
    enc_algo = analysis.crypto_analysis.encryption.algorithm or "Unknown"
    auth_algo = analysis.crypto_analysis.authentication.algorithm or "Unknown"
    dh_group = f"Group {analysis.crypto_analysis.dh_group.group_number}" if analysis.crypto_analysis.dh_group.group_number else "None"
    pfs = "Enabled" if analysis.crypto_analysis.pfs.detected else "Disabled / Not Detected"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IPsec Security Intelligence Report — {capture_filename}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #090d16;
            color: #e2e8f0;
            line-height: 1.6;
            padding: 40px 20px;
        }}
        .container {{ max-width: 960px; margin: 0 auto; }}

        /* Header */
        .report-header {{
            text-align: center;
            padding: 32px 0;
            border-bottom: 1px solid #1e293b;
            margin-bottom: 28px;
        }}
        .report-header h1 {{
            font-size: 26px;
            font-weight: 700;
            color: #f8fafc;
            letter-spacing: -0.5px;
        }}
        .report-header .subtitle {{
            color: #38bdf8;
            font-size: 14px;
            font-weight: 600;
            margin-top: 4px;
        }}
        .report-meta {{
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 14px;
            font-size: 13px;
            color: #64748b;
        }}

        /* Executive Banner */
        .risk-banner {{
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 12px;
            padding: 28px;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            gap: 16px;
            text-align: center;
            margin-bottom: 24px;
        }}
        .banner-stat {{
            padding: 8px;
        }}
        .banner-val {{
            font-size: 32px;
            font-weight: 800;
            line-height: 1.1;
        }}
        .banner-lbl {{
            font-size: 12px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 6px;
        }}

        /* Sections */
        .section {{
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
        }}
        .section-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 18px;
            border-bottom: 1px solid #1e293b;
            padding-bottom: 10px;
        }}
        .section-header h2 {{
            font-size: 18px;
            font-weight: 600;
            color: #f1f5f9;
        }}

        /* Badges */
        .source-badge {{
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
            background: #1e293b;
            color: #94a3b8;
            border: 1px solid #334155;
        }}
        .severity-badge, .priority-badge {{
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            color: #fff;
        }}

        /* Data Tables */
        .data-table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }}
        .data-table th {{
            text-align: left;
            padding: 10px;
            background: #1e293b;
            color: #94a3b8;
            font-weight: 600;
            border-bottom: 1px solid #334155;
        }}
        .data-table td {{
            padding: 10px;
            border-bottom: 1px solid #1e293b;
            color: #cbd5e1;
        }}

        /* Findings */
        .finding {{
            background: #131d31;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 14px;
        }}
        .finding-header {{
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
        }}
        .finding-id {{
            font-size: 11px;
            color: #64748b;
            margin-left: auto;
            font-family: monospace;
        }}
        .finding-desc {{
            color: #cbd5e1;
            font-size: 14px;
            margin-bottom: 10px;
        }}
        .evidence-box {{
            background: #0a0f1d;
            border: 1px solid #1e293b;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 12px;
            color: #94a3b8;
        }}
        .evidence-label {{
            color: #38bdf8;
            font-weight: 600;
            margin-right: 6px;
        }}

        /* Recommendations */
        .recommendation {{
            background: #131d31;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 14px;
            border-left: 4px solid #3b82f6;
        }}
        .rec-header {{
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
        }}
        .action-box {{
            margin-top: 10px;
            padding: 8px 12px;
            background: #0a0f1d;
            border-radius: 6px;
            font-size: 13px;
            color: #e2e8f0;
        }}

        /* Anomaly Grid */
        .anomaly-summary {{
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12px;
            margin-bottom: 16px;
        }}
        .stat-card {{
            background: #131d31;
            border: 1px solid #1e293b;
            border-radius: 8px;
            padding: 14px;
            text-align: center;
        }}
        .stat-val {{
            font-size: 20px;
            font-weight: 700;
        }}
        .stat-lbl {{
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            margin-top: 4px;
        }}

        /* Disclaimer Footer */
        .disclaimer-footer {{
            margin-top: 32px;
            padding: 20px;
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 8px;
            font-size: 12px;
            color: #64748b;
            line-height: 1.5;
        }}
    </style>
</head>
<body>
    <div class="container">
        
        <!-- Header -->
        <div class="report-header">
            <h1>IPsec Security Intelligence Report</h1>
            <div class="subtitle">Passive Encrypted Traffic Audit & Cryptographic Assessment</div>
            <div class="report-meta">
                <span>Capture: <strong>{capture_filename}</strong></span>
                <span>Generated: {timestamp[:19].replace('T', ' ')} UTC</span>
                <span>Packets Analyzed: {analysis.metadata.packets_analyzed}</span>
            </div>
        </div>

        <!-- Executive Banner -->
        <div class="risk-banner">
            <div class="banner-stat">
                <div class="banner-val" style="color: {severity_color};">{risk_score} / 100</div>
                <div class="banner-lbl">System Risk Score</div>
            </div>
            <div class="banner-stat">
                <div class="banner-val" style="color: {severity_color};">{severity}</div>
                <div class="banner-lbl">Severity Tier</div>
            </div>
            <div class="banner-stat">
                <div class="banner-val" style="color: #38bdf8;">{analysis.security_assessment.crypto_strength_score} / 100</div>
                <div class="banner-lbl">Crypto Strength</div>
            </div>
            <div class="banner-stat">
                <div class="banner-val">{len(analysis.security_assessment.findings)}</div>
                <div class="banner-lbl">Security Findings</div>
            </div>
        </div>

        <!-- Protocol & Cryptographic Assessment -->
        <div class="section">
            <div class="section-header">
                <h2>Observed Protocol & Cryptographic Negotiation</h2>
                <span class="source-badge">DETERMINISTIC</span>
            </div>
            <table class="data-table">
                <tbody>
                    <tr>
                        <td style="width: 35%; font-weight: 600;">Protocol Detected</td>
                        <td>{analysis.classification.protocol} ({analysis.classification.analysis_method})</td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600;">IKE Version</td>
                        <td>{ike_ver}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600;">IPsec Operational Mode</td>
                        <td>{ipsec_mode}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600;">Encryption Cipher</td>
                        <td>{enc_algo} ({analysis.crypto_analysis.encryption.strength.upper()})</td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600;">Integrity / Authentication</td>
                        <td>{auth_algo} ({analysis.crypto_analysis.authentication.strength.upper()})</td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600;">Diffie-Hellman Group</td>
                        <td>{dh_group}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600;">Perfect Forward Secrecy (PFS)</td>
                        <td>{pfs}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Behavioral Anomaly Detection -->
        {anomaly_html}

        <!-- ML Traffic Classification -->
        {ml_class_html}

        <!-- Security Findings -->
        <div class="section">
            <div class="section-header">
                <h2>Deterministic & Behavioral Findings ({len(analysis.security_assessment.findings)})</h2>
                <span class="source-badge">RULE_BASED & ML</span>
            </div>
            {findings_html}
        </div>

        <!-- Remediation Guidance -->
        <div class="section">
            <div class="section-header">
                <h2>Actionable Remediation Guidance</h2>
                <span class="source-badge">RECOMMENDED</span>
            </div>
            {recommendations_html}
        </div>

        <!-- Transparency & Methodology Disclosure -->
        <div class="disclaimer-footer">
            <strong>Methodology & Limitations Disclosure:</strong><br>
            • <em>Deterministic Evidence:</em> IKE headers, transform payloads, and ESP parameters are parsed directly from observed packet bytes without payload decryption.<br>
            • <em>AI/ML Models:</em> Random Forest Classifier v1.0 and Isolation Forest Anomaly Detector v1.0 are <strong>Development / Synthetic-Data Validated</strong> baseline models. Anomaly scores represent mathematical distance from baseline statistical norms and must not be interpreted as certainty probabilities.<br>
            • <em>Passive Architecture:</em> Analysis is passive and non-intrusive based on packet metadata.
        </div>

    </div>
</body>
</html>
"""
