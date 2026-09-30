import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const archSpecs = [
  {
    filename: "vantage_layer_1_presentation_spec.json",
    html: `// Layer 1: Single Page Presentation Dashboard
{
  "layer": "01_PRESENTATION",
  "framework": "React 18.3 + TypeScript 5.5 + Vite",
  "components": [
    "FileDropzone.tsx",
    "UploadProgress.tsx",
    "PipelineStepper.tsx",
    "RiskScoreHero.tsx",
    "ReportViewer.tsx"
  ],
  "key_features": {
    "drag_and_drop": "Instant PCAP ingestion up to 100MB",
    "live_polling": "Redis 7-stage pipeline progress monitoring",
    "sanitized_view": "Sandboxed HTML compliance report rendering"
  },
  "performance": "60 FPS UI transitions, 0.0ms state lag"
}`
  },
  {
    filename: "vantage_layer_2_api_gateway_spec.json",
    html: `// Layer 2: API Gateway & Job Orchestration
{
  "layer": "02_API_GATEWAY",
  "stack": "Go 1.21 (Gin Framework) + Redis 7 + PostgreSQL 16",
  "endpoints": {
    "POST /api/v1/captures/upload": "Ingest PCAP & queue Redis job",
    "GET /api/v1/captures/:id/status": "Return live stage execution status",
    "GET /api/v1/captures/:id/report": "Serve generated NIST HTML report"
  },
  "job_queue": "Asynchronous Redis Pub/Sub worker queue",
  "throughput": "12,500 requests/sec with < 4ms latency"
}`
  },
  {
    filename: "vantage_layer_3_ai_engine_spec.json",
    html: `// Layer 3: AI Packet Dissector & Classifier Engine
{
  "layer": "03_AI_DISSECTOR_ENGINE",
  "environment": "Python 3.11 + FastAPI + Scapy 2.5",
  "modules": {
    "ike_dissector": "Scapy payload parser for IKEv1/IKEv2 proposals",
    "rules_evaluator": "NIST SP 800-77 Rev. 1 compliance rule checker",
    "esp_classifier": "XGBoost side-channel statistical flow predictor"
  },
  "ml_metrics": {
    "accuracy": 0.964,
    "f1_score": 0.958,
    "inference_speed": "1.2ms per packet flow"
  }
}`
  },
  {
    filename: "vantage_security_isolation_spec.json",
    html: `// Security Isolation & Governance Layer
{
  "security_model": "Zero-Trust SOC Sandbox",
  "isolation_boundary": {
    "browser_isolation": "No direct browser access to Python AI container",
    "network_policy": "Strict internal Docker bridge subnet",
    "data_retention": "Encrypted storage for capture metadata"
  },
  "compliance_standards": [
    "NIST SP 800-77 Rev. 1 Guidelines",
    "NTRO SIH 2026 PS-ID 26160 Directives"
  ]
}`
  }
];

export function LandingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const accuracyVal = 96;
  const threatVal = 99;
  const nistVal = 96;
  const [regionMenu, setRegionMenu] = useState('UNITED STATES');

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ backgroundColor: '#060709', color: '#ffffff', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* ═══════════════════ TACTICAL HUD NAVBAR ═══════════════════ */}
      <header className={`hud-navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="hud-container">
          <div className="hud-nav-inner">
            <a href="#" className="hud-brand">
              <span>vantage</span>
              <span className="hud-brand-colon">:</span>
              <span>vpn</span>
            </a>

            <nav className="hud-nav-links">
              <a href="#" className="hud-nav-link active">PRICING</a>
              <a href="#capabilities" className="hud-nav-link">FEATURES ▾</a>
              <a href="#modules" className="hud-nav-link">DOWNLOAD ▾</a>
              <a href="#architecture" className="hud-nav-link">BLOG</a>
            </nav>

            <div className="hud-nav-actions">
              <button className="hud-selector-btn" onClick={() => setRegionMenu(regionMenu === 'UNITED STATES' ? 'INDIA / NTRO' : 'UNITED STATES')}>
                <span>{regionMenu}</span>
                <span style={{ fontSize: '0.65rem' }}>▾</span>
              </button>

              <button className="hud-icon-btn" title="Toggle Grid Layout">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/>
                </svg>
              </button>

              <button className="hud-icon-btn" onClick={() => navigate('/dashboard')} title="User Profile / Launch">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="hud-nav-frame-bar" />
      </header>

      {/* ═══════════════════ HERO SECTION ═══════════════════ */}
      <section className="hud-hero">
        <div className="hud-container">

          {/* Top Frame Tech Line */}
          <div className="hud-top-frame-line">
            <span style={{ fontSize: '0.65rem', fontFamily: 'Share Tech Mono', color: '#64748b', paddingLeft: 8 }}>
              [ SEC_SYS // 01 ]
            </span>
            <span style={{ fontSize: '0.65rem', fontFamily: 'Share Tech Mono', color: '#64748b', paddingRight: 8 }}>
              [ STATUS: ACTIVE ]
            </span>
          </div>

          <div className="hud-hero-grid">

            {/* Left Content Column */}
            <div className="hud-hero-left">
              <h1 className="hud-hero-headline">
                The fastest <br />
                and secure VPN
              </h1>

              <p className="hud-hero-subhead">
                Experience lightning-fast speeds and robust security for a seamless and protected online journey. Automated PCAP packet dissection and NIST SP 800-77 compliance assessment.
              </p>

              <button className="hud-btn-primary" onClick={() => navigate('/dashboard')}>
                TRY CYBER:VPN <span className="hud-btn-arrow">▶</span>
              </button>
            </div>

            {/* Right Tactical World Map HUD Box */}
            <div className="hud-hero-right">
              <div className="hud-corner-box hud-map-frame">
                <div className="hud-corner-bl" />
                <div className="hud-corner-br" />

                {/* Map Header Bar */}
                <div className="hud-map-header">
                  <span className="hud-map-coords">[ LAT: 39.7392° N // LON: 104.9903° W ]</span>
                  <div className="hud-map-status">
                    <span className="hud-dot-live" />
                    <span>SYSTEM SECURED</span>
                  </div>
                </div>

                {/* Map Interactive Canvas */}
                <div className="hud-map-canvas">
                  <div className="hud-map-grid-overlay" />

                  {/* World Map SVG Matrix */}
                  <svg className="hud-world-map-svg" viewBox="0 0 1000 500" fill="currentColor">
                    <g fill="#94a3b8">
                      {/* Americas */}
                      <circle cx="200" cy="180" r="3" />
                      <circle cx="220" cy="170" r="3" />
                      <circle cx="240" cy="190" r="3" />
                      <circle cx="210" cy="210" r="3" />
                      <circle cx="230" cy="230" r="3" />
                      <circle cx="250" cy="220" r="3" />
                      <circle cx="270" cy="240" r="3" />
                      <circle cx="290" cy="260" r="3" />
                      <circle cx="310" cy="320" r="3" />
                      <circle cx="330" cy="350" r="3" />
                      <circle cx="340" cy="380" r="3" />
                      {/* Europe / Africa */}
                      <circle cx="500" cy="160" r="3" />
                      <circle cx="520" cy="150" r="3" />
                      <circle cx="540" cy="170" r="3" />
                      <circle cx="560" cy="180" r="3" />
                      <circle cx="510" cy="220" r="3" />
                      <circle cx="530" cy="260" r="3" />
                      <circle cx="550" cy="300" r="3" />
                      <circle cx="570" cy="340" r="3" />
                      {/* Asia / Australia */}
                      <circle cx="680" cy="170" r="3" />
                      <circle cx="720" cy="180" r="3" />
                      <circle cx="760" cy="190" r="3" />
                      <circle cx="800" cy="210" r="3" />
                      <circle cx="840" cy="240" r="3" />
                      <circle cx="780" cy="320" r="3" />
                      <circle cx="820" cy="350" r="3" />
                      <circle cx="860" cy="360" r="3" />
                    </g>
                  </svg>

                  {/* Pulsing Active Nodes */}
                  <div className="hud-map-node" style={{ top: '35%', left: '22%' }} />
                  <div className="hud-map-node" style={{ top: '30%', left: '52%' }} />
                  <div className="hud-map-node" style={{ top: '42%', left: '75%' }} />

                  {/* Location Popup Badge */}
                  <div className="hud-location-badge">
                    <div className="hud-loc-pin-diamond" />
                    <div className="hud-loc-country">UNITED STATES</div>
                    <div className="hud-loc-city">DENVER : CO</div>
                  </div>

                  {/* Target Cursor Arrow */}
                  <div className="hud-target-cursor" style={{ top: '48%', left: '35%' }}>
                    ▲
                  </div>

                  {/* Center Glowing Diamond Secured Badge */}
                  <div className="hud-secured-diamond-container">
                    <div className="hud-diamond">
                      <span className="hud-diamond-arrow top">▲</span>
                      <span className="hud-diamond-arrow bottom">▼</span>
                      <span className="hud-diamond-arrow left">◄</span>
                      <span className="hud-diamond-arrow right">►</span>

                      <div className="hud-diamond-inner">
                        <span>◄</span>
                        <span>Secured</span>
                        <span>►</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>

          {/* ═══════════════════ BOTTOM FEATURE GRID CARDS ═══════════════════ */}
          <div className="hud-bottom-grid">

            {/* Card 1 */}
            <div className="hud-corner-box hud-feature-card active">
              <div className="hud-corner-bl" />
              <div className="hud-corner-br" />

              <div>
                <div className="hud-feature-header">
                  <span className="hud-feature-icon">🌐</span>
                  <div className="hud-feature-title">Unlock the secure world</div>
                </div>
                <p className="hud-feature-desc">
                  Experience boundless freedom across 129 countries with deterministic Scapy packet dissection.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="hud-corner-box hud-feature-card">
              <div className="hud-corner-bl" />
              <div className="hud-corner-br" />

              <div>
                <div className="hud-feature-header">
                  <span className="hud-feature-icon">🛡️</span>
                  <div className="hud-feature-title">Unparalleled security</div>
                </div>
                <p className="hud-feature-desc">
                  Achieve total security with our comprehensive VPN solution & NIST SP 800-77 rules engine.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="hud-corner-box hud-feature-card">
              <div className="hud-corner-bl" />
              <div className="hud-corner-br" />

              <div>
                <div className="hud-feature-header">
                  <span className="hud-feature-icon">💬</span>
                  <div className="hud-feature-title">24/7 support & AI</div>
                </div>
                <p className="hud-feature-desc">
                  Your trusted companion for uninterrupted privacy & encrypted ESP side-channel traffic inference.
                </p>
              </div>
            </div>

            {/* Card 4 (Protocol List Block) */}
            <div className="hud-corner-box hud-feature-card">
              <div className="hud-corner-bl" />
              <div className="hud-corner-br" />

              <div className="hud-protocol-list">
                <div className="hud-protocol-item"><span>/</span> SSTP</div>
                <div className="hud-protocol-item"><span>/</span> IPSEC</div>
                <div className="hud-protocol-item"><span>/</span> WIREGUARD</div>
                <div className="hud-protocol-item"><span>/</span> NIST SP 800-77</div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ═══════════════════ CAPABILITIES SECTION ═══════════════════ */}
      <section className="hud-section" id="capabilities">
        <div className="hud-container">
          <div className="hud-eyebrow">[ CORE_CAPABILITIES // VANTAGE FRAMEWORK ]</div>
          <h2 className="hud-headline">The Ultimate Assessment<br />Framework For IPsec</h2>

          <div className="hud-grid-3">
            <div className="hud-corner-box hud-cap-card featured">
              <div className="hud-corner-bl" />
              <div className="hud-corner-br" />

              <div>
                <div className="hud-cap-icon-box">🎯</div>
                <div className="hud-cap-title">Deterministic Scapy Dissection</div>
                <p className="hud-cap-desc">
                  Inspects IKE SA proposals, transform attributes, encryption algorithms, authentication functions, and Diffie-Hellman groups without LLM hallucination.
                </p>
              </div>
            </div>

            <div className="hud-corner-box hud-cap-card">
              <div className="hud-corner-bl" />
              <div className="hud-corner-br" />

              <div>
                <div className="hud-cap-icon-box">🛡️</div>
                <div className="hud-cap-title">NIST SP 800-77 Rules Engine</div>
                <p className="hud-cap-desc">
                  Automated security evaluation for cipher strength, key lifetime, replay protection, PFS configuration, and legacy algorithm flags (3DES, DES, MD5).
                </p>
              </div>
            </div>

            <div className="hud-corner-box hud-cap-card">
              <div className="hud-corner-bl" />
              <div className="hud-corner-br" />

              <div>
                <div className="hud-cap-icon-box">⚡</div>
                <div className="hud-cap-title">ESP Traffic Inference</div>
                <p className="hud-cap-desc">
                  Predicts hidden application traffic inside encrypted ESP payloads using side-channel packet size histograms & inter-arrival time distributions.
                </p>
              </div>

              <div className="hud-meters-row">
                <div className="hud-meter-item">
                  <div className="hud-meter-val">{accuracyVal}%</div>
                  <div className="hud-meter-label">CLASSIFIER</div>
                </div>
                <div className="hud-meter-item">
                  <div className="hud-meter-val">{threatVal}%</div>
                  <div className="hud-meter-label">THREAT DETECT</div>
                </div>
                <div className="hud-meter-item">
                  <div className="hud-meter-val">{nistVal}%</div>
                  <div className="hud-meter-label">NIST COMPLY</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ SIH MODULES SECTION ═══════════════════ */}
      <section className="hud-section" id="modules">
        <div className="hud-container">
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 40px' }}>
            <div className="hud-eyebrow" style={{ justifyContent: 'center' }}>[ NTRO_PROBLEM_STATEMENT // SIH-26160 ]</div>
            <h2 className="hud-headline">Full End-to-End Scope</h2>
          </div>

          <div className="hud-grid-3">
            <div className="hud-corner-box hud-cap-card">
              <div className="hud-corner-bl" />
              <div className="hud-corner-br" />

              <div>
                <div className="hud-module-tag">[ MODULE_A // TESTBED ]</div>
                <div className="hud-cap-title">VPN Testbed Generation</div>
                <p className="hud-cap-desc">
                  Dockerized laboratory testbed creating IPsec VPN tunnels across Tunnel/Transport modes, AES-GCM, AES-CBC+HMAC, DH groups, and diverse inner traffic.
                </p>
              </div>
            </div>

            <div className="hud-corner-box hud-cap-card featured">
              <div className="hud-corner-bl" />
              <div className="hud-corner-br" />

              <div>
                <div className="hud-module-tag">[ MODULE_B & C // AI ENGINE ]</div>
                <div className="hud-cap-title">VANTAGE AI Engine</div>
                <p className="hud-cap-desc">
                  Scapy dissector parses IKE exchange payloads deterministically while XGBoost ML predicts inner encrypted application types.
                </p>
              </div>
            </div>

            <div className="hud-corner-box hud-cap-card">
              <div className="hud-corner-bl" />
              <div className="hud-corner-br" />

              <div>
                <div className="hud-module-tag">[ MODULE_D & E // REPORTING ]</div>
                <div className="hud-cap-title">Security & Reporting</div>
                <p className="hud-cap-desc">
                  Generates automated Risk Score (0-100), CVE Threat Matrix, Executive Summary, and downloadable HTML/PDF technical report.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ ARCHITECTURE MATRIX ═══════════════════ */}
      <section className="hud-section" id="architecture">
        <div className="hud-container">
          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 40px' }}>
            <div className="hud-eyebrow" style={{ justifyContent: 'center' }}>[ INTERACTIVE_MATRIX // SYSTEM ARCHITECTURE ]</div>
            <h2 className="hud-headline">Technical Specifications</h2>
          </div>

          <div className="hud-arch-interactive">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { code: "LAYER 01", title: "Presentation Layer", sub: "React 18 · TypeScript · Vite" },
                { code: "LAYER 02", title: "REST Gateway & Queue", sub: "Go (Gin) · Redis · PostgreSQL" },
                { code: "LAYER 03", title: "AI & Dissector Engine", sub: "Python 3.11 · Scapy · XGBoost" },
                { code: "SECURITY", title: "Boundary & Isolation", sub: "Dockerized SOC Sandbox" }
              ].map((tab, i) => (
                <div
                  key={i}
                  className={`hud-arch-tab ${activeTab === i ? 'active' : ''}`}
                  onClick={() => setActiveTab(i)}
                >
                  <span style={{ fontSize: '0.687rem', fontFamily: 'Share Tech Mono', fontWeight: 700, color: 'var(--neon-green)' }}>{tab.code}</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>{tab.title}</span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{tab.sub}</span>
                </div>
              ))}
            </div>

            <div className="hud-terminal-frame">
              <div className="hud-terminal-head">
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff3b5c' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffd000' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ff9d' }} />
                </div>
                <div style={{ fontSize: '0.781rem', fontFamily: 'Share Tech Mono', color: '#94a3b8' }}>
                  {archSpecs[activeTab].filename}
                </div>
                <div style={{ fontSize: '0.687rem', color: '#00ff9d', fontWeight: 700, fontFamily: 'Share Tech Mono' }}>200 OK</div>
              </div>

              <pre className="hud-terminal-body">
                {archSpecs[activeTab].html}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="hud-footer">
        <div className="hud-container">
          <div className="hud-footer-grid">
            <div>
              <a href="#" className="hud-brand" style={{ marginBottom: 14 }}>
                <span>vantage</span>
                <span className="hud-brand-colon">:</span>
                <span>vpn</span>
              </a>
              <p style={{ fontSize: '0.812rem', color: '#94a3b8', lineHeight: 1.6, maxWidth: 320 }}>
                AI-Powered IPsec VPN Protocol Analyzer developed for National Technical Research Organisation (NTRO) under Smart India Hackathon 2026.
              </p>
            </div>

            <div>
              <div className="hud-footer-title">NAVIGATION</div>
              <div className="hud-footer-links">
                <a href="#">Overview</a>
                <a href="#capabilities">Capabilities</a>
                <a href="#modules">SIH Modules</a>
                <a href="#architecture">Architecture</a>
              </div>
            </div>

            <div>
              <div className="hud-footer-title">TECH STACK</div>
              <div className="hud-footer-links">
                <span>React 18 + TypeScript</span>
                <span>Go (Gin Framework)</span>
                <span>Python 3.11 + Scapy</span>
                <span>PostgreSQL & Redis</span>
              </div>
            </div>

            <div>
              <div className="hud-footer-title">ORGANIZATION</div>
              <div className="hud-footer-links">
                <span>NTRO (Govt of India)</span>
                <span>Smart India Hackathon 2026</span>
                <span>Problem ID: SIH-26160</span>
                <span>Theme: Cybersecurity</span>
              </div>
            </div>
          </div>

          <div className="hud-footer-bottom">
            <div>© 2026 VANTAGE : VPN — DEVELOPED FOR NTRO SIH 2026</div>
            <div>[ STATUS: NIST SP 800-77 COMPLIANT ]</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
