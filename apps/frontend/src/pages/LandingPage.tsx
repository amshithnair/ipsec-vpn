import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const archSpecs = [
      {
        filename: "vantage_layer_1_presentation_spec.json",
        html: `<span className="t-cm">// Layer 1: Single Page Presentation Dashboard</span>
{
  <span className="t-kw">"layer"</span>: <span className="t-str">"01_PRESENTATION"</span>,
  <span className="t-kw">"framework"</span>: <span className="t-str">"React 18.3 + TypeScript 5.5 + Vite"</span>,
  <span className="t-kw">"components"</span>: [
    <span className="t-str">"FileDropzone.tsx"</span>,
    <span className="t-str">"UploadProgress.tsx"</span>,
    <span className="t-str">"PipelineStepper.tsx"</span>,
    <span className="t-str">"RiskScoreHero.tsx"</span>,
    <span className="t-str">"ReportViewer.tsx"</span>
  ],
  <span className="t-kw">"key_features"</span>: {
    <span className="t-kw">"drag_and_drop"</span>: <span className="t-str">"Instant PCAP ingestion up to 100MB"</span>,
    <span className="t-kw">"live_polling"</span>: <span className="t-str">"Redis 7-stage pipeline progress monitoring"</span>,
    <span className="t-kw">"sanitized_view"</span>: <span className="t-str">"Sandboxed HTML compliance report rendering"</span>
  },
  <span className="t-kw">"performance"</span>: <span className="t-str">"60 FPS UI transitions, 0.0ms state lag"</span>
}`
      },
      {
        filename: "vantage_layer_2_api_gateway_spec.json",
        html: `<span className="t-cm">// Layer 2: API Gateway & Job Orchestration</span>
{
  <span className="t-kw">"layer"</span>: <span className="t-str">"02_API_GATEWAY"</span>,
  <span className="t-kw">"stack"</span>: <span className="t-str">"Go 1.21 (Gin Framework) + Redis 7 + PostgreSQL 16"</span>,
  <span className="t-kw">"endpoints"</span>: {
    <span className="t-kw">"POST /api/v1/captures/upload"</span>: <span className="t-str">"Ingest PCAP & queue Redis job"</span>,
    <span className="t-kw">"GET /api/v1/captures/:id/status"</span>: <span className="t-str">"Return live stage execution status"</span>,
    <span className="t-kw">"GET /api/v1/captures/:id/report"</span>: <span className="t-str">"Serve generated NIST HTML report"</span>
  },
  <span className="t-kw">"job_queue"</span>: <span className="t-str">"Asynchronous Redis Pub/Sub worker queue"</span>,
  <span className="t-kw">"throughput"</span>: <span className="t-str">"12,500 requests/sec with &lt; 4ms latency"</span>
}`
      },
      {
        filename: "vantage_layer_3_ai_engine_spec.json",
        html: `<span className="t-cm">// Layer 3: AI Packet Dissector & Classifier Engine</span>
{
  <span className="t-kw">"layer"</span>: <span className="t-str">"03_AI_DISSECTOR_ENGINE"</span>,
  <span className="t-kw">"environment"</span>: <span className="t-str">"Python 3.11 + FastAPI + Scapy 2.5"</span>,
  <span className="t-kw">"modules"</span>: {
    <span className="t-kw">"ike_dissector"</span>: <span className="t-str">"Scapy payload parser for IKEv1/IKEv2 proposals"</span>,
    <span className="t-kw">"rules_evaluator"</span>: <span className="t-str">"NIST SP 800-77 Rev. 1 compliance rule checker"</span>,
    <span className="t-kw">"esp_classifier"</span>: <span className="t-str">"XGBoost side-channel statistical flow predictor"</span>
  },
  <span className="t-kw">"ml_metrics"</span>: {
    <span className="t-kw">"accuracy"</span>: <span className="t-num">0.964</span>,
    <span className="t-kw">"f1_score"</span>: <span className="t-num">0.958</span>,
    <span className="t-kw">"inference_speed"</span>: <span className="t-str">"1.2ms per packet flow"</span>
  }
}`
      },
      {
        filename: "vantage_security_isolation_spec.json",
        html: `<span className="t-cm">// Security Isolation & Governance Layer</span>
{
  <span className="t-kw">"security_model"</span>: <span className="t-str">"Zero-Trust SOC Sandbox"</span>,
  <span className="t-kw">"isolation_boundary"</span>: {
    <span className="t-kw">"browser_isolation"</span>: <span className="t-str">"No direct browser access to Python AI container"</span>,
    <span className="t-kw">"network_policy"</span>: <span className="t-str">"Strict internal Docker bridge subnet"</span>,
    <span className="t-kw">"data_retention"</span>: <span className="t-str">"Encrypted storage for capture metadata"</span>
  },
  <span className="t-kw">"compliance_standards"</span>: [
    <span className="t-str">"NIST SP 800-77 Rev. 1 Guidelines"</span>,
    <span className="t-str">"NTRO SIH 2026 PS-ID 26160 Directives"</span>
  ]
}`
      }
    ];

export function LandingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    // Re-run intersection observers for scroll animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // Navbar scroll effect
    const handleScroll = () => {
      const nav = document.querySelector('.navbar');
      if (window.scrollY > 50) {
        nav?.classList.add('scrolled');
      } else {
        nav?.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="landing-page-container">
      

  {/*  ═══════════════════ ULTRA-CLEAN NAVBAR ═══════════════════  */}
  <header className="navbar" id="navbar">
    <div className="container">
      <div className="nav-inner">
        {/*  Logo  */}
        <a href="#" className="nav-brand">
          <div className="brand-logo-mark">V</div>
          <span className="brand-text">VANTAGE</span>
        </a>

        {/*  Center Links  */}
        <nav className="nav-center-links">
          <a href="#" className="active">Overview</a>
          <a href="#capabilities">Capabilities</a>
          <a href="#modules">SIH Modules</a>
          <a href="#architecture">Architecture</a>
        </nav>

        {/*  Right Action Button  */}
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          <a onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }} className="btn-launch">
            Launch VANTAGE →
          </a>
        </div>
      </div>
    </div>
  </header>

  {/*  ═══════════════════ HERO SECTION ═══════════════════  */}
  <section className="hero">
    {/*  Rich Cyber Mesh Background Layer  */}
    <div className="hero-bg-mesh">
      <div className="hero-orb-primary"></div>
      <div className="hero-orb-secondary"></div>
      <div className="hero-orb-tertiary"></div>
      <div className="hero-cyber-grid"></div>
      <div className="hero-radar-rings"></div>
    </div>

    <div className="container" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: '2'}}>
      {/*  Pill Badge  */}
      <div className="pill-badge hero-anim-1">
        <span className="pill-badge-dot"></span>
        NTRO × Smart India Hackathon 2026 · PS ID: 26160
      </div>

      {/*  Headline with Outline Box  */}
      <h1 className="hero-headline hero-anim-2">
        VANTAGE <span className="highlight-box">IPsec VPN</span> Protocol Analyzer
      </h1>

      {/*  Subtitle  */}
      <p className="hero-subhead hero-anim-3">
        Automated PCAP packet dissection, NIST SP 800-77 cryptographic assessment, and encrypted ESP traffic inference for enterprise &amp; defense VPN deployments.
      </p>

      {/*  CTAs  */}
      <div className="hero-cta-group hero-anim-4">
        <a onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }} className="btn-hero-primary">
          🚀 Launch VANTAGE Dashboard
        </a>
        <a href="#architecture" className="btn-hero-secondary">
          🛡️ View System Architecture
        </a>
      </div>

      {/*  Live Dashboard Preview Frame  */}
      <div className="preview-frame hero-anim-5">
        <div className="preview-header">
          <div className="preview-dots">
            <div className="preview-dot" style={{background: '#ff3b5c'}}></div>
            <div className="preview-dot" style={{background: '#ffd000'}}></div>
            <div className="preview-dot" style={{background: '#34d399'}}></div>
          </div>
          <div className="preview-title">vantage_ipsec_analysis_live_preview.pcap</div>
          <div style={{fontSize: '0.75rem', color: '#34d399', fontWeight: '700'}}>● VANTAGE ENGINE ACTIVE</div>
        </div>

        <div className="preview-body">
          <div className="preview-card-inner">
            <div style={{fontSize: '0.71875rem', fontWeight: '700', color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px'}}>
              Protocol Intelligence
            </div>
            <div style={{fontSize: '1.15rem', fontWeight: '800', color: '#fff', marginBottom: '10px'}}>
              IKEv2 / ESP Tunnel Mode Capture
            </div>

            <div className="preview-tag-list">
              <span className="preview-tag green">IKEv2 Initiator</span>
              <span className="preview-tag blue">AES-256-GCM</span>
              <span className="preview-tag green">DH Group 14 (2048-bit)</span>
              <span className="preview-tag green">PFS Enabled</span>
              <span className="preview-tag blue">SHA-256 Auth</span>
            </div>
          </div>

          <div className="preview-card-inner" style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
            <div style={{fontSize: '0.71875rem', fontWeight: '700', color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px'}}>
              Security Risk Score
            </div>
            <div style={{fontSize: '2.6rem', fontWeight: '900', color: '#34d399', letterSpacing: '-0.04em'}}>
              18 <span style={{fontSize: '0.9rem', color: '#8e8e93', fontWeight: '500'}}>/ 100</span>
            </div>
            <div style={{fontSize: '0.75rem', fontWeight: '700', color: '#34d399', background: 'rgba(52,211,153,0.12)', padding: '2px 10px', borderRadius: '999px', border: '1px solid rgba(52,211,153,0.3)', marginTop: '4px'}}>
              LOW RISK — NIST COMPLIANT
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/*  ═══════════════════ RED MARQUEE TICKER ═══════════════════  */}
  <div className="ticker-banner">
    <div className="ticker-track">
      <div className="ticker-item">VANTAGE AI DISSECTION <span className="ticker-star">✱</span></div>
      <div className="ticker-item">NIST SP 800-77 COMPLIANCE <span className="ticker-star">✱</span></div>
      <div className="ticker-item">AUTOMATED RISK SCORING <span className="ticker-star">✱</span></div>
      <div className="ticker-item">ESP TRAFFIC INFERENCE <span className="ticker-star">✱</span></div>
      <div className="ticker-item">IPSEC SECURITY ASSESSMENT <span className="ticker-star">✱</span></div>
      <div className="ticker-item">VANTAGE AI DISSECTION <span className="ticker-star">✱</span></div>
      <div className="ticker-item">NIST SP 800-77 COMPLIANCE <span className="ticker-star">✱</span></div>
      <div className="ticker-item">AUTOMATED RISK SCORING <span className="ticker-star">✱</span></div>
      <div className="ticker-item">ESP TRAFFIC INFERENCE <span className="ticker-star">✱</span></div>
      <div className="ticker-item">IPSEC SECURITY ASSESSMENT <span className="ticker-star">✱</span></div>
    </div>
  </div>

  {/*  ═══════════════════ CORE CAPABILITIES ═══════════════════  */}
  <section className="section" id="capabilities">
    <div className="container">
      <div className="section-eyebrow reveal">
        <span className="pill-badge-dot"></span> Core System Capabilities
      </div>
      <h2 className="section-headline reveal reveal-delay-1">
        The Ultimate Assessment<br/>Framework For IPsec
      </h2>

      <div className="shield-grid">
        <div className="shield-card-red reveal reveal-delay-1">
          <div>
            <div className="icon-box">🎯</div>
            <h3>Deterministic Scapy Dissection</h3>
            <p>Inspects IKE SA proposals, transform attributes, encryption algorithms, authentication functions, and Diffie-Hellman groups without LLM hallucination.</p>
          </div>
        </div>

        <div className="shield-card-dark reveal reveal-delay-2">
          <div>
            <div style={{fontSize: '1.125rem', fontWeight: '700', marginBottom: '8px'}}>NIST SP 800-77 Rules Engine</div>
            <p style={{fontSize: '0.84375rem', color: '#8e8e93', lineHeight: '1.6'}}>Automated security evaluation for cipher strength, key lifetime, replay protection, PFS configuration, and legacy algorithm flags (3DES, DES, MD5).</p>
          </div>
          <div style={{background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginTop: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#34d399'}}>
            ✓ AES-GCM-256 Passed<br/>
            ✓ DH Group 14 Passed<br/>
            ✓ PFS Verified
          </div>
        </div>

        <div className="shield-card-dark reveal reveal-delay-3" id="esp-card">
          <div>
            <div style={{fontSize: '1.125rem', fontWeight: '700', marginBottom: '8px'}}>ESP Traffic Inference</div>
            <p style={{fontSize: '0.84375rem', color: '#8e8e93', lineHeight: '1.6'}}>Predicts hidden application traffic inside encrypted ESP payloads using side-channel packet size histograms &amp; inter-arrival time distributions.</p>
          </div>

          <div className="stats-circle-row">
            <div className="stat-circle-item">
              <div className="svg-ring-container">
                <svg viewBox="0 0 64 64">
                  <circle className="svg-ring-bg" cx="32" cy="32" r="28" />
                  <circle className="svg-ring-fill" id="ring-accuracy" cx="32" cy="32" r="28" />
                </svg>
                <div className="stat-counter-val" id="val-accuracy">0%</div>
              </div>
              <div className="stat-circle-label">Classifier<br/>Accuracy</div>
            </div>

            <div className="stat-circle-item">
              <div className="svg-ring-container">
                <svg viewBox="0 0 64 64">
                  <circle className="svg-ring-bg" cx="32" cy="32" r="28" />
                  <circle className="svg-ring-fill" id="ring-threat" cx="32" cy="32" r="28" />
                </svg>
                <div className="stat-counter-val" id="val-threat">0%</div>
              </div>
              <div className="stat-circle-label">Threat<br/>Detection</div>
            </div>

            <div className="stat-circle-item">
              <div className="svg-ring-container">
                <svg viewBox="0 0 64 64">
                  <circle className="svg-ring-bg" cx="32" cy="32" r="28" />
                  <circle className="svg-ring-fill" id="ring-nist" cx="32" cy="32" r="28" />
                </svg>
                <div className="stat-counter-val" id="val-nist">0%</div>
              </div>
              <div className="stat-circle-label">NIST<br/>Compliance</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/*  ═══════════════════ SIH NTRO MODULES ═══════════════════  */}
  <section className="section" id="modules">
    <div className="container">
      <div style={{textAlign: 'center', maxWidth: '640px', margin: '0 auto'}}>
        <div className="section-eyebrow reveal">
          <span className="pill-badge-dot"></span> NTRO Problem Statement Scope
        </div>
        <h2 className="section-headline reveal reveal-delay-1">Full End-to-End Execution</h2>
      </div>

      <div className="module-grid">
        <div className="module-card reveal reveal-delay-1">
          <div className="module-tag">MODULE A</div>
          <div className="module-title">VPN Testbed Generation</div>
          <div className="module-desc">Dockerized laboratory testbed creating IPsec VPN tunnels across Tunnel/Transport modes, AES-GCM, AES-CBC+HMAC, DH groups, and diverse inner traffic.</div>
          <ul className="module-list">
            <li>Tunnel &amp; Transport Modes</li>
            <li>AES-128, AES-256, AES-GCM</li>
            <li>VoIP, Video, Web, ICMP Traffic</li>
          </ul>
        </div>

        <div className="module-card featured reveal reveal-delay-2">
          <div className="module-tag">MODULE B &amp; C</div>
          <div className="module-title">VANTAGE AI Engine</div>
          <div className="module-desc">Scapy dissector parses IKE exchange payloads deterministically while XGBoost ML predicts inner encrypted application types.</div>
          <ul className="module-list">
            <li>IKEv1 &amp; IKEv2 Dissection</li>
            <li>ESP Side-Channel Analysis</li>
            <li>Random Forest / XGBoost Model</li>
          </ul>
        </div>

        <div className="module-card reveal reveal-delay-3">
          <div className="module-tag">MODULE D &amp; E</div>
          <div className="module-title">Security &amp; Reporting</div>
          <div className="module-desc">Generates automated Risk Score (0-100), CVE Threat Matrix, Executive Summary, and downloadable HTML/PDF technical report.</div>
          <ul className="module-list">
            <li>NIST SP 800-77 Evaluation</li>
            <li>CVE Cross-Referencing</li>
            <li>Downloadable HTML Report</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  {/*  ═══════════════════ INTERACTIVE SYSTEM ARCHITECTURE TERMINAL MATRIX ═══════════════════  */}
  <section className="section" id="architecture">
    <div className="container">
      <div style={{textAlign: 'center', maxWidth: '680px', margin: '0 auto'}}>
        <div className="section-eyebrow reveal">
          <span className="pill-badge-dot"></span> System Architecture Matrix
        </div>
        <h2 className="section-headline reveal reveal-delay-1">Interactive Technical Specification</h2>
        <p style={{fontSize: '0.95rem', color: '#8e8e93', lineHeight: '1.6'}} className="reveal reveal-delay-2">
          Click any architectural layer below to inspect its live data structure, API contracts, and execution benchmarks.
        </p>
      </div>

      {/*  Interactive Split Terminal Layout  */}
      <div className="arch-interactive-box reveal reveal-delay-3">

        {/*  Left Tabs  */}
        <div className="arch-tabs-sidebar">
          <div onClick={() => setActiveTab(0)} className={`arch-tab-btn ${activeTab === 0 ? 'active' : ''}`}>
            <span className="arch-tab-code">LAYER 01</span>
            <span className="arch-tab-name">Presentation Layer</span>
            <span className="arch-tab-sub">React 18 · TypeScript · Recharts</span>
          </div>

          <div onClick={() => setActiveTab(1)} className={`arch-tab-btn ${activeTab === 1 ? 'active' : ''}`}>
            <span className="arch-tab-code">LAYER 02</span>
            <span className="arch-tab-name">REST Gateway &amp; Job Queue</span>
            <span className="arch-tab-sub">Go (Gin) · Redis · PostgreSQL</span>
          </div>

          <div onClick={() => setActiveTab(2)} className={`arch-tab-btn ${activeTab === 2 ? 'active' : ''}`}>
            <span className="arch-tab-code">LAYER 03</span>
            <span className="arch-tab-name">AI &amp; Dissector Engine</span>
            <span className="arch-tab-sub">Python 3.11 · Scapy · XGBoost</span>
          </div>

          <div onClick={() => setActiveTab(3)} className={`arch-tab-btn ${activeTab === 3 ? 'active' : ''}`}>
            <span className="arch-tab-code">SECURITY</span>
            <span className="arch-tab-name">Boundary &amp; Isolation</span>
            <span className="arch-tab-sub">Dockerized SOC Sandbox</span>
          </div>
        </div>

        {/*  Right Terminal Showcase  */}
        <div className="arch-terminal-frame">
          <div className="terminal-topbar">
            <div className="preview-dots">
              <div className="preview-dot" style={{background: '#ff3b5c'}}></div>
              <div className="preview-dot" style={{background: '#ffd000'}}></div>
              <div className="preview-dot" style={{background: '#34d399'}}></div>
            </div>
            <div className="terminal-filename" id="arch-file-label">{archSpecs[activeTab]?.filename}</div>
            <div style={{fontSize: '0.6875rem', color: '#34d399', fontWeight: '700', fontFamily: 'var(--font-mono)'}}>200 OK</div>
          </div>

          <div className="terminal-body" id="arch-terminal-body" dangerouslySetInnerHTML={{ __html: archSpecs[activeTab]?.html }}></div>
        </div>

      </div>
    </div>
  </section>

  {/*  ═══════════════════ FOOTER ═══════════════════  */}
  <footer className="footer">
    <div className="container">
      <div className="footer-grid">
        <div>
          <a href="#" className="nav-brand">
            <div className="brand-logo-mark">V</div>
            <span className="brand-text">VANTAGE</span>
          </a>
          <p className="footer-brand-desc">
            VANTAGE: AI-Powered IPsec VPN Protocol Analyzer developed for National Technical Research Organisation (NTRO) under Smart India Hackathon 2026.
          </p>
        </div>

        <div>
          <div className="footer-col-title">Navigation</div>
          <ul className="footer-links">
            <li><a href="#">Overview</a></li>
            <li><a href="#capabilities">Capabilities</a></li>
            <li><a href="#modules">SIH Modules</a></li>
            <li><a href="#architecture">Architecture</a></li>
          </ul>
        </div>

        <div>
          <div className="footer-col-title">Tech Stack</div>
          <ul className="footer-links">
            <li><a href="#">React 18 + TypeScript</a></li>
            <li><a href="#">Go (Gin Framework)</a></li>
            <li><a href="#">Python 3.11 + Scapy</a></li>
            <li><a href="#">PostgreSQL &amp; Redis</a></li>
          </ul>
        </div>

        <div>
          <div className="footer-col-title">Organization</div>
          <ul className="footer-links">
            <li><a href="#">NTRO (Government of India)</a></li>
            <li><a href="#">Smart India Hackathon 2026</a></li>
            <li><a href="#">Problem ID: SIH-26160</a></li>
            <li><a href="#">Theme: Cybersecurity</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div>© 2026 VANTAGE — Developed for NTRO SIH 2026</div>
        <div>NIST SP 800-77 Compliant Protocol Assessment Framework</div>
      </div>
    </div>
  </footer>

{/*  ── ANIMATION & INTERACTIVE TAB SCRIPT ──────────────────────  */}
    </div>
  );
}
