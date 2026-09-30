import { useState } from 'react';
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  onAnalyze?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const navSections = [
  {
    title: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/captures', icon: FolderOpen, label: 'Capture History', end: true },
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

export function Sidebar({ onAnalyze, collapsed: propCollapsed, onToggleCollapse }: SidebarProps) {
  const navigate = useNavigate();
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const isCollapsed = propCollapsed !== undefined ? propCollapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  return (
    <aside className={`hud-floating-dock ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="hud-corner-box dock-inner">
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        {/* Dock Header & Logo */}
        <div className="dock-header">
          <div className="dock-logo" onClick={() => navigate('/')}>
            <div className="dock-logo-icon">
              <Shield size={18} color="#000000" strokeWidth={2.5} />
            </div>
            {!isCollapsed && (
              <div className="dock-logo-text">
                <span className="dock-logo-title">
                  vantage<span style={{ color: 'var(--accent-primary)' }}>:</span>vpn
                </span>
                <span className="dock-logo-subtitle">[ NTRO SIH-26160 ]</span>
              </div>
            )}
          </div>

          <button
            className="dock-toggle-btn"
            onClick={toggleCollapse}
            title={isCollapsed ? "Expand Navigation" : "Collapse Navigation"}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="dock-nav">
          {navSections.map((sec, idx) => (
            <div key={sec.title} style={{ marginTop: idx > 0 ? (isCollapsed ? 8 : 12) : 0 }}>
              {!isCollapsed && <div className="dock-nav-section">[ {sec.title} ]</div>}

              {sec.items.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `dock-nav-item${isActive ? ' active' : ''}`
                  }
                  title={isCollapsed ? label : undefined}
                >
                  <Icon size={17} className="dock-icon" />
                  {!isCollapsed && <span className="dock-label">{label}</span>}
                  {isCollapsed && <span className="dock-tooltip">{label}</span>}
                </NavLink>
              ))}
            </div>
          ))}

          {/* Quick Action Button */}
          <div style={{ marginTop: 16 }}>
            {!isCollapsed && <div className="dock-nav-section">[ QUICK ACTION ]</div>}

            <button
              className="btn btn-primary btn-sm dock-action-btn"
              onClick={() => (onAnalyze ? onAnalyze() : navigate('/captures/new'))}
              title="Analyze PCAP Capture"
            >
              <Zap size={15} fill="currentColor" />
              {!isCollapsed && <span>ANALYZE PCAP {'▶'}</span>}
            </button>
          </div>
        </nav>

        {/* Dock Footer */}
        <div className="dock-footer">
          <div className="dock-status-pulse">
            <span className="dock-pulse-dot" />
            {!isCollapsed && <span>SYS SECURED // NIST 800-77</span>}
          </div>
        </div>

      </div>
    </aside>
  );
}
