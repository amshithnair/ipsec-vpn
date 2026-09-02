import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  Upload,
  ShieldCheck,
  Wrench,
  GitCompare,
  Cpu,
  FlaskConical,
  Shield,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  onAnalyze?: () => void;
}

const navSections = [
  {
    title: 'Overview',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/captures', icon: FolderOpen, label: 'Capture History', end: false },
      { to: '/captures/new', icon: Upload, label: 'New Capture', end: false },
    ]
  },
  {
    title: 'Security Posture',
    items: [
      { to: '/posture', icon: ShieldCheck, label: 'Security Posture', end: false },
      { to: '/remediation', icon: Wrench, label: 'Remediation Center', end: false },
    ]
  },
  {
    title: 'Analysis & Compare',
    items: [
      { to: '/compare', icon: GitCompare, label: 'Compare Captures', end: false },
    ]
  },
  {
    title: 'Intelligence & Demo',
    items: [
      { to: '/models', icon: Cpu, label: 'Model Center', end: false },
      { to: '/demo', icon: FlaskConical, label: 'Demo Lab', end: false },
    ]
  }
];

export function Sidebar({ onAnalyze }: SidebarProps) {
  const navigate = useNavigate();

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Shield size={18} color="#ffffff" strokeWidth={2.5} />
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">VANTAGE</span>
          <span className="sidebar-logo-subtitle">IPsec Protocol Intelligence</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navSections.map((sec, idx) => (
          <div key={sec.title} style={{ marginTop: idx > 0 ? 14 : 0 }}>
            <div className="sidebar-nav-section">{sec.title}</div>
            {sec.items.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `sidebar-nav-item${isActive ? ' active' : ''}`
                }
              >
                <Icon size={16} className="nav-icon" />
                {label}
              </NavLink>
            ))}
          </div>
        ))}

        <div className="sidebar-nav-section" style={{ marginTop: 18 }}>Quick Action</div>

        <button
          className="btn btn-primary btn-sm"
          style={{ width: '100%', marginTop: 4, justifyContent: 'flex-start', paddingLeft: 14 }}
          onClick={() => (onAnalyze ? onAnalyze() : navigate('/captures/new'))}
        >
          <Zap size={14} fill="currentColor" />
          <span>Analyze PCAP</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ marginBottom: 2, fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.813rem' }}>
          Securify IPsec v1.0
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>AI Cryptographic Shield</div>
      </div>
    </aside>
  );
}
