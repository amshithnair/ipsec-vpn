import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield, Zap, CheckCircle2, ArrowRight, Lock,
  Cpu, FileText, Activity, Server, ChevronRight, Terminal, BarChart2, Layers
} from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

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
    <div className="landing-root">
      {/* ── SEAMLESS NAVBAR (Blends 100% Into Background) ── */}
      <header className={`landing-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container landing-nav-inner">
          <Link to="/landing" className="landing-brand">
            <div className="brand-icon-box">
              <Shield size={18} color="#ffffff" />
            </div>
            <span className="brand-title">IPsec Intelligence</span>
          </Link>

          <nav className="landing-pill-menu">
            <a href="#overview" className="active">Overview</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#modules">SIH Modules</a>
            <a href="#architecture">Architecture</a>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-landing-cta"
            >
              Launch Dashboard <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION (Compact Spacing & Rich Mesh BG) ── */}
      <section className="landing-hero" id="overview">
        {/* Rich Ambient Mesh Layer */}
        <div className="hero-bg-mesh">
          <div className="hero-orb-primary" />
          <div className="hero-orb-secondary" />
          <div className="hero-cyber-grid" />
          <div className="hero-radar-rings" />
        </div>

        <div className="container hero-container">
          {/* Pill Badge */}
          <div className="landing-badge">
            <span className="badge-dot-pulsing" />
            NTRO × Smart India Hackathon 2026 · PS ID: 26160
          </div>

          {/* Headline */}
          <h1 className="landing-headline">
            AI-Powered <span className="highlight-stroke-box">IPsec VPN</span> Protocol Analyzer
          </h1>

          {/* Subtitle */}
          <p className="landing-subhead">
            Automated PCAP packet dissection, NIST SP 800-77 cryptographic assessment, and encrypted ESP traffic inference for enterprise &amp; defense VPN deployments.
          </p>

          {/* Action CTAs */}
          <div className="landing-cta-group">
            <button onClick={() => navigate('/dashboard')} className="btn-hero-main">
              <Zap size={16} /> Launch Analyst Dashboard
            </button>
            <a href="#architecture" className="btn-hero-sub">
              <Shield size={15} /> System Architecture
            </a>
          </div>

          {/* Live Preview Frame (Fits Comfortably Above The Fold) */}
          <div className="landing-preview-frame">
            <div className="preview-topbar">
              <div className="preview-dots">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <div className="preview-filename">
                <Terminal size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                ipsec_vpn_analysis_live_preview.pcap
              </div>
              <div className="preview-status">
                <span className="status-live-dot" /> SERVICE ONLINE
              </div>
            </div>

            <div className="preview-content-grid">
              <div className="preview-panel">
                <div className="preview-panel-label">Protocol Intelligence</div>
                <div className="preview-panel-title">IKEv2 / ESP Tunnel Mode Capture</div>
                <div className="preview-tags">
                  <span className="ptag ptag-green">IKEv2 Initiator</span>
                  <span className="ptag ptag-blue">AES-256-GCM</span>
                  <span className="ptag ptag-green">DH Group 14 (2048-bit)</span>
                  <span className="ptag ptag-green">PFS Enabled</span>
                  <span className="ptag ptag-blue">SHA-256 Auth</span>
                </div>
              </div>

              <div className="preview-panel preview-score-box">
                <div className="preview-panel-label">Security Risk Score</div>
                <div className="score-big">
                  18 <span className="score-denom">/ 100</span>
                </div>
                <div className="score-badge-compliant">
                  <CheckCircle2 size={12} /> LOW RISK — NIST COMPLIANT
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── RED MARQUEE TICKER ── */}
      <div className="landing-ticker">
        <div className="ticker-scroll-track">
          <div className="ticker-cell">AI PROTOCOL DISSECTION <span className="star">✱</span></div>
          <div class="ticker-cell">NIST SP 800-77 COMPLIANCE <span className="star">✱</span></div>
          <div className="ticker-cell">AUTOMATED RISK SCORING <span className="star">✱</span></div>
          <div className="ticker-cell">ESP TRAFFIC INFERENCE <span class="star">✱</span></div>
          <div className="ticker-cell">IPSEC SECURITY ASSESSMENT <span className="star">✱</span></div>
          <div className="ticker-cell">AI PROTOCOL DISSECTION <span className="star">✱</span></div>
          <div className="ticker-cell">NIST SP 800-77 COMPLIANCE <span className="star">✱</span></div>
          <div className="ticker-cell">AUTOMATED RISK SCORING <span className="star">✱</span></div>
          <div className="ticker-cell">ESP TRAFFIC INFERENCE <span className="star">✱</span></div>
          <div className="ticker-cell">IPSEC SECURITY ASSESSMENT <span className="star">✱</span></div>
        </div>
      </div>

      {/* ── CORE CAPABILITIES ── */}
      <section className="landing-section" id="capabilities">
        <div className="container">
          <div className="section-eyebrow-red">
            <span className="eyebrow-dot" /> Core System Capabilities
          </div>
          <h2 className="landing-section-title">
            The Ultimate Assessment<br />Framework For IPsec
          </h2>

          <div className="landing-cards-grid">
            <div className="card-red-solid">
              <div className="card-red-icon">
                <Shield size={24} color="#ffffff" />
              </div>
              <h3>Deterministic Scapy Dissection</h3>
              <p>Inspects IKE SA proposals, transform attributes, encryption algorithms, authentication functions, and Diffie-Hellman groups without LLM hallucination.</p>
            </div>

            <div className="card-dark-glass">
              <div>
                <div className="card-dark-title">NIST SP 800-77 Rules Engine</div>
                <p className="card-dark-desc">Automated security evaluation for cipher strength, key lifetime, replay protection, PFS configuration, and legacy algorithm flags (3DES, DES, MD5).</p>
              </div>
              <div className="code-box-mini">
                <span style={{ color: '#34d399' }}>✓ AES-GCM-256 Passed</span><br />
                <span style={{ color: '#34d399' }}>✓ DH Group 14 Passed</span><br />
                <span style={{ color: '#34d399' }}>✓ PFS Verified</span>
              </div>
            </div>

            <div className="card-dark-glass">
              <div>
                <div className="card-dark-title">ESP Traffic Inference</div>
                <p className="card-dark-desc">Predicts hidden application traffic inside encrypted ESP payloads using side-channel packet size histograms &amp; inter-arrival time distributions.</p>
              </div>
              <div className="rings-row">
                <div className="ring-unit">
                  <div className="ring-circle">96%</div>
                  <div className="ring-lbl">Classifier<br />Accuracy</div>
                </div>
                <div className="ring-unit">
                  <div className="ring-circle">99%</div>
                  <div className="ring-lbl">Threat<br />Detection</div>
                </div>
                <div className="ring-unit">
                  <div className="ring-circle">96%</div>
                  <div className="ring-lbl">NIST<br />Compliance</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SIH NTRO MODULES ── */}
      <section className="landing-section" id="modules" style={{ background: 'rgba(255, 30, 66, 0.02)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
            <div className="section-eyebrow-red" style={{ justifyContent: 'center' }}>
              <span className="eyebrow-dot" /> NTRO Problem Statement Modules
            </div>
            <h2 className="landing-section-title">Full End-to-End Architecture</h2>
          </div>

          <div className="modules-grid-3">
            <div className="module-box">
              <div className="mod-tag">MODULE A</div>
              <div className="mod-title">VPN Testbed Generation</div>
              <div className="mod-desc">Dockerized laboratory testbed creating IPsec VPN tunnels across Tunnel/Transport modes, AES-GCM, AES-CBC+HMAC, DH groups, and diverse inner traffic.</div>
              <ul className="mod-list">
                <li><CheckCircle2 size={13} color="#ff1e42" /> Tunnel &amp; Transport Modes</li>
                <li><CheckCircle2 size={13} color="#ff1e42" /> AES-128, AES-256, AES-GCM</li>
                <li><CheckCircle2 size={13} color="#ff1e42" /> VoIP, Video, Web, ICMP Traffic</li>
              </ul>
            </div>

            <div className="module-box module-box-featured">
              <div className="mod-tag mod-tag-featured">MODULE B &amp; C</div>
              <div className="mod-title">AI Engine &amp; ESP Inference</div>
              <div className="mod-desc">Scapy dissector parses IKE exchange payloads deterministically while XGBoost ML predicts inner encrypted application types.</div>
              <ul className="mod-list">
                <li><CheckCircle2 size={13} color="#ffffff" /> IKEv1 &amp; IKEv2 Dissection</li>
                <li><CheckCircle2 size={13} color="#ffffff" /> ESP Side-Channel Analysis</li>
                <li><CheckCircle2 size={13} color="#ffffff" /> Random Forest / XGBoost Model</li>
              </ul>
            </div>

            <div className="module-box">
              <div className="mod-tag">MODULE D &amp; E</div>
              <div className="mod-title">Security &amp; Reporting</div>
              <div className="mod-desc">Generates automated Risk Score (0-100), CVE Threat Matrix, Executive Summary, and downloadable HTML/PDF technical report.</div>
              <ul className="mod-list">
                <li><CheckCircle2 size={13} color="#ff1e42" /> NIST SP 800-77 Evaluation</li>
                <li><CheckCircle2 size={13} color="#ff1e42" /> CVE Cross-Referencing</li>
                <li><CheckCircle2 size={13} color="#ff1e42" /> Downloadable HTML Report</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-grid-4">
            <div>
              <Link to="/landing" className="landing-brand" style={{ marginBottom: 16 }}>
                <div className="brand-icon-box">
                  <Shield size={16} color="#ffffff" />
                </div>
                <span className="brand-title">IPsec Intelligence</span>
              </Link>
              <p className="footer-desc">
                AI-Powered IPsec VPN Protocol Analyzer developed for National Technical Research Organisation (NTRO) under Smart India Hackathon 2026.
              </p>
            </div>

            <div>
              <div className="foot-col-title">Navigation</div>
              <ul className="foot-links">
                <li><a href="#overview">Overview</a></li>
                <li><a href="#capabilities">Capabilities</a></li>
                <li><a href="#modules">SIH Modules</a></li>
                <li><a href="#architecture">Architecture</a></li>
              </ul>
            </div>

            <div>
              <div className="foot-col-title">Tech Stack</div>
              <ul className="foot-links">
                <li><a href="#">React 18 + TypeScript</a></li>
                <li><a href="#">Go (Gin Framework)</a></li>
                <li><a href="#">Python 3.11 + Scapy</a></li>
                <li><a href="#">PostgreSQL &amp; Redis</a></li>
              </ul>
            </div>

            <div>
              <div className="foot-col-title">Organization</div>
              <ul className="foot-links">
                <li><a href="#">NTRO (Govt. of India)</a></li>
                <li><a href="#">Smart India Hackathon 2026</a></li>
                <li><a href="#">Problem ID: SIH-26160</a></li>
                <li><a href="#">Theme: Cybersecurity</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom-row">
            <div>© 2026 IPsec Intelligence — Developed for NTRO SIH 2026</div>
            <div>NIST SP 800-77 Compliant Protocol Assessment Framework</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
