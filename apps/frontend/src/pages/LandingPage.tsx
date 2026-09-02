import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const [accuracyVal, setAccuracyVal] = useState(0);
  const [threatVal, setThreatVal] = useState(0);
  const [nistVal, setNistVal] = useState(0);
  const [ringsFilled, setRingsFilled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const espCard = document.getElementById('esp-card-landing');
    if (!espCard) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !ringsFilled) {
          setRingsFilled(true);

          const duration = 1500;
          const startTime = performance.now();

          const step = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);

            setAccuracyVal(Math.floor(ease * 96));
            setThreatVal(Math.floor(ease * 99));
            setNistVal(Math.floor(ease * 96));

            if (progress < 1) {
              requestAnimationFrame(step);
            }
          };
          requestAnimationFrame(step);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    observer.observe(espCard);
    return () => observer.disconnect();
  }, [ringsFilled]);

  const calcDashOffset = (pct: number) => {
    const circumference = 175;
    return circumference - (pct / 100) * circumference;
  };

  return (
    <div style={{ backgroundColor: '#050507', color: '#f5f5f7', minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif", overflowX: 'hidden' }}>

      {/* ═══════════════════ NAVBAR ═══════════════════ */}
      <header className={`landing-navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="landing-container">
          <div className="landing-nav-inner">
            <a href="#" className="landing-nav-brand">
              <div className="landing-brand-logo">V</div>
              <span className="landing-brand-text">VANTAGE</span>
            </a>

            <nav className="landing-nav-links">
              <a href="#" className="active">Overview</a>
              <a href="#capabilities">Capabilities</a>
              <a href="#modules">SIH Modules</a>
              <a href="#architecture">Architecture</a>
            </nav>

            <button className="landing-btn-launch" onClick={() => navigate('/dashboard')}>
              Launch VANTAGE →
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="landing-hero">
        <div className="landing-hero-bg">
          <div className="landing-orb-primary" />
          <div className="landing-orb-secondary" />
          <div className="landing-cyber-grid" />
          <div className="landing-radar-rings" />
        </div>

        <div className="landing-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          <div className="landing-pill-badge">
            <span className="landing-pill-dot" />
            NTRO × Smart India Hackathon 2026 · PS ID: 26160
          </div>

          <h1 className="landing-hero-title">
            VANTAGE <span className="landing-highlight-box">IPsec VPN</span> Protocol Analyzer
          </h1>

          <p className="landing-hero-sub">
            Automated PCAP packet dissection, NIST SP 800-77 cryptographic assessment, and encrypted ESP traffic inference for enterprise & defense VPN deployments.
          </p>

          <div className="landing-cta-group">
            <button className="landing-btn-primary" onClick={() => navigate('/dashboard')}>
              🚀 Launch VANTAGE Dashboard
            </button>
            <a href="#architecture" className="landing-btn-secondary">
              🛡️ View System Architecture
            </a>
          </div>

          {/* Live Preview Frame */}
          <div className="landing-preview-frame">
            <div className="landing-preview-head">
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff3b5c' }} />
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ffd000' }} />
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#34d399' }} />
              </div>
              <div style={{ fontSize: '0.781rem', fontFamily: 'JetBrains Mono', color: '#8e8e93' }}>
                vantage_ipsec_analysis_live_preview.pcap
              </div>
              <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>● VANTAGE ENGINE ACTIVE</div>
            </div>

            <div className="landing-preview-body">
              <div className="landing-preview-card">
                <div style={{ fontSize: '0.718rem', fontWeight: 700, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Protocol Intelligence
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: 10 }}>
                  IKEv2 / ESP Tunnel Mode Capture
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <span className="landing-tag green">IKEv2 Initiator</span>
                  <span className="landing-tag blue">AES-256-GCM</span>
                  <span className="landing-tag green">DH Group 14 (2048-bit)</span>
                  <span className="landing-tag green">PFS Enabled</span>
                  <span className="landing-tag blue">SHA-256 Auth</span>
                </div>
              </div>

              <div className="landing-preview-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ fontSize: '0.718rem', fontWeight: 700, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  Security Risk Score
                </div>
                <div style={{ fontSize: '2.6rem', fontWeight: 900, color: '#34d399', letterSpacing: '-0.04em' }}>
                  18 <span style={{ fontSize: '0.9rem', color: '#8e8e93', fontWeight: 500 }}>/ 100</span>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.12)', padding: '2px 10px', borderRadius: 999, border: '1px solid rgba(52,211,153,0.3)', marginTop: 4 }}>
                  LOW RISK — NIST COMPLIANT
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ TICKER ═══════════════════ */}
      <div className="landing-ticker-banner">
        <div className="landing-ticker-track">
          {[...Array(2)].map((_, i) => (
            <span key={i} style={{ display: 'inline-flex', gap: 32 }}>
              <span className="landing-ticker-item">VANTAGE AI DISSECTION <span className="landing-ticker-star">✱</span></span>
              <span className="landing-ticker-item">NIST SP 800-77 COMPLIANCE <span className="landing-ticker-star">✱</span></span>
              <span className="landing-ticker-item">AUTOMATED RISK SCORING <span className="landing-ticker-star">✱</span></span>
              <span className="landing-ticker-item">ESP TRAFFIC INFERENCE <span className="landing-ticker-star">✱</span></span>
              <span className="landing-ticker-item">IPSEC SECURITY ASSESSMENT <span className="landing-ticker-star">✱</span></span>
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════════════ CAPABILITIES ═══════════════════ */}
      <section className="landing-section" id="capabilities">
        <div className="landing-container">
          <div className="landing-eyebrow"><span className="landing-pill-dot" /> Core System Capabilities</div>
          <h2 className="landing-headline">The Ultimate Assessment<br />Framework For IPsec</h2>

          <div className="landing-grid-3">
            <div className="landing-card-red">
              <div className="icon-box">🎯</div>
              <h3>Deterministic Scapy Dissection</h3>
              <p>Inspects IKE SA proposals, transform attributes, encryption algorithms, authentication functions, and Diffie-Hellman groups without LLM hallucination.</p>
            </div>

            <div className="landing-card-dark">
              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 8 }}>NIST SP 800-77 Rules Engine</div>
                <p style={{ fontSize: '0.843rem', color: '#8e8e93', lineHeight: 1.6 }}>Automated security evaluation for cipher strength, key lifetime, replay protection, PFS configuration, and legacy algorithm flags (3DES, DES, MD5).</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', marginTop: 16, fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: '#34d399' }}>
                ✓ AES-GCM-256 Passed<br />
                ✓ DH Group 14 Passed<br />
                ✓ PFS Verified
              </div>
            </div>

            <div className="landing-card-dark" id="esp-card-landing">
              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 8 }}>ESP Traffic Inference</div>
                <p style={{ fontSize: '0.843rem', color: '#8e8e93', lineHeight: 1.6 }}>Predicts hidden application traffic inside encrypted ESP payloads using side-channel packet size histograms & inter-arrival time distributions.</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', paddingTop: 20, marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="stat-circle-item">
                  <div className="svg-ring-container">
                    <svg viewBox="0 0 64 64">
                      <circle className="svg-ring-bg" cx="32" cy="32" r="28" />
                      <circle className="svg-ring-fill" cx="32" cy="32" r="28" style={{ strokeDashoffset: ringsFilled ? calcDashOffset(96) : 175 }} />
                    </svg>
                    <div className="stat-counter-val">{accuracyVal}%</div>
                  </div>
                  <div style={{ fontSize: '0.687rem', color: '#8e8e93', textAlign: 'center', fontWeight: 600, marginTop: 4 }}>Classifier<br />Accuracy</div>
                </div>

                <div className="stat-circle-item">
                  <div className="svg-ring-container">
                    <svg viewBox="0 0 64 64">
                      <circle className="svg-ring-bg" cx="32" cy="32" r="28" />
                      <circle className="svg-ring-fill" cx="32" cy="32" r="28" style={{ strokeDashoffset: ringsFilled ? calcDashOffset(99) : 175 }} />
                    </svg>
                    <div className="stat-counter-val">{threatVal}%</div>
                  </div>
                  <div style={{ fontSize: '0.687rem', color: '#8e8e93', textAlign: 'center', fontWeight: 600, marginTop: 4 }}>Threat<br />Detection</div>
                </div>

                <div className="stat-circle-item">
                  <div className="svg-ring-container">
                    <svg viewBox="0 0 64 64">
                      <circle className="svg-ring-bg" cx="32" cy="32" r="28" />
                      <circle className="svg-ring-fill" cx="32" cy="32" r="28" style={{ strokeDashoffset: ringsFilled ? calcDashOffset(96) : 175 }} />
                    </svg>
                    <div className="stat-counter-val">{nistVal}%</div>
                  </div>
                  <div style={{ fontSize: '0.687rem', color: '#8e8e93', textAlign: 'center', fontWeight: 600, marginTop: 4 }}>NIST<br />Compliance</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ SIH MODULES ═══════════════════ */}
      <section className="landing-section" id="modules">
        <div className="landing-container">
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
            <div className="landing-eyebrow"><span className="landing-pill-dot" /> NTRO Problem Statement Scope</div>
            <h2 className="landing-headline">Full End-to-End Scope</h2>
          </div>

          <div className="landing-grid-3">
            <div className="landing-card-dark">
              <div style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono', color: '#ff1e42', fontWeight: 700, marginBottom: 6 }}>MODULE A</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 10 }}>VPN Testbed Generation</div>
              <p style={{ fontSize: '0.843rem', color: '#8e8e93', lineHeight: 1.6, marginBottom: 20 }}>Dockerized laboratory testbed creating IPsec VPN tunnels across Tunnel/Transport modes, AES-GCM, AES-CBC+HMAC, DH groups, and diverse inner traffic.</p>
            </div>

            <div className="landing-card-red" style={{ transform: 'scale(1.03)' }}>
              <div style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono', color: '#fff', fontWeight: 700, marginBottom: 6 }}>MODULE B & C</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 10 }}>VANTAGE AI Engine</div>
              <p style={{ fontSize: '0.843rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, marginBottom: 20 }}>Scapy dissector parses IKE exchange payloads deterministically while XGBoost ML predicts inner encrypted application types.</p>
            </div>

            <div className="landing-card-dark">
              <div style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono', color: '#ff1e42', fontWeight: 700, marginBottom: 6 }}>MODULE D & E</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 10 }}>Security & Reporting</div>
              <p style={{ fontSize: '0.843rem', color: '#8e8e93', lineHeight: 1.6, marginBottom: 20 }}>Generates automated Risk Score (0-100), CVE Threat Matrix, Executive Summary, and downloadable HTML/PDF technical report.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ INTERACTIVE ARCHITECTURE MATRIX ═══════════════════ */}
      <section className="landing-section" id="architecture">
        <div className="landing-container">
          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
            <div className="landing-eyebrow"><span className="landing-pill-dot" /> System Architecture Matrix</div>
            <h2 className="landing-headline">Interactive Technical Specification</h2>
            <p style={{ fontSize: '0.95rem', color: '#8e8e93', lineHeight: 1.6 }}>Click any architectural layer below to inspect its live data structure, API contracts, and execution benchmarks.</p>
          </div>

          <div className="landing-arch-interactive">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { code: "LAYER 01", title: "Presentation Layer", sub: "React 18 · TypeScript · Recharts" },
                { code: "LAYER 02", title: "REST Gateway & Queue", sub: "Go (Gin) · Redis · PostgreSQL" },
                { code: "LAYER 03", title: "AI & Dissector Engine", sub: "Python 3.11 · Scapy · XGBoost" },
                { code: "SECURITY", title: "Boundary & Isolation", sub: "Dockerized SOC Sandbox" }
              ].map((tab, i) => (
                <div
                  key={i}
                  className={`landing-arch-tab ${activeTab === i ? 'active' : ''}`}
                  onClick={() => setActiveTab(i)}
                >
                  <span style={{ fontSize: '0.687rem', fontFamily: 'JetBrains Mono', fontWeight: 700, color: '#ff1e42' }}>{tab.code}</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>{tab.title}</span>
                  <span style={{ fontSize: '0.75rem', color: '#8e8e93' }}>{tab.sub}</span>
                </div>
              ))}
            </div>

            <div className="landing-terminal-frame">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff3b5c' }} />
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ffd000' }} />
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#34d399' }} />
                </div>
                <div style={{ fontSize: '0.781rem', fontFamily: 'JetBrains Mono', color: '#8e8e93' }}>
                  {archSpecs[activeTab].filename}
                </div>
                <div style={{ fontSize: '0.687rem', color: '#34d399', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>200 OK</div>
              </div>

              <pre className="landing-terminal-body">
                {archSpecs[activeTab].html}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-grid">
            <div>
              <a href="#" className="landing-nav-brand">
                <div className="landing-brand-logo">V</div>
                <span className="landing-brand-text">VANTAGE</span>
              </a>
              <p style={{ fontSize: '0.812rem', color: '#8e8e93', lineHeight: 1.6, marginTop: 14, maxWidth: 320 }}>
                VANTAGE: AI-Powered IPsec VPN Protocol Analyzer developed for National Technical Research Organisation (NTRO) under Smart India Hackathon 2026.
              </p>
            </div>

            <div>
              <div style={{ fontSize: '0.843rem', fontWeight: 700, color: '#fff', marginBottom: 16 }}>Navigation</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.812rem', color: '#8e8e93' }}>
                <a href="#" style={{ color: '#8e8e93', textDecoration: 'none' }}>Overview</a>
                <a href="#capabilities" style={{ color: '#8e8e93', textDecoration: 'none' }}>Capabilities</a>
                <a href="#modules" style={{ color: '#8e8e93', textDecoration: 'none' }}>SIH Modules</a>
                <a href="#architecture" style={{ color: '#8e8e93', textDecoration: 'none' }}>Architecture</a>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.843rem', fontWeight: 700, color: '#fff', marginBottom: 16 }}>Tech Stack</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.812rem', color: '#8e8e93' }}>
                <div>React 18 + TypeScript</div>
                <div>Go (Gin Framework)</div>
                <div>Python 3.11 + Scapy</div>
                <div>PostgreSQL & Redis</div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.843rem', fontWeight: 700, color: '#fff', marginBottom: 16 }}>Organization</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.812rem', color: '#8e8e93' }}>
                <div>NTRO (Govt of India)</div>
                <div>Smart India Hackathon 2026</div>
                <div>Problem ID: SIH-26160</div>
                <div>Theme: Cybersecurity</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.75rem', color: '#48484a' }}>
            <div>© 2026 VANTAGE — Developed for NTRO SIH 2026</div>
            <div>NIST SP 800-77 Compliant Protocol Assessment Framework</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
