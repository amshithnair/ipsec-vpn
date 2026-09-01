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
  Activity,
  Shield,
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
          <Shield size={16} color="#fff" strokeWidth={2.5} />
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">IPsec Intelligence</span>
          <span className="sidebar-logo-subtitle">Security Platform</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navSections.map((sec, idx) => (
          <div key={sec.title} style={{ marginTop: idx > 0 ? 12 : 0 }}>
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
                <Icon size={15} className="nav-icon" />
                {label}
              </NavLink>
            ))}
          </div>
        ))}

        <div className="sidebar-nav-section" style={{ marginTop: 14 }}>Live Action</div>

        <button
          className="sidebar-nav-item"
          style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}
          onClick={() => (onAnalyze ? onAnalyze() : navigate('/captures/new'))}
        >
          <Activity size={15} className="nav-icon" style={{ color: 'var(--accent-primary)' }} />
          Analyze PCAP
        </button>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ marginBottom: 2, fontWeight: 600, color: 'var(--text-secondary)' }}>IPsec Intelligence</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Security Intelligence v1.0</div>
      </div>
    </aside>
  );
}
