import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  Upload,
  Shield,
  Activity,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  onAnalyze?: () => void;
}

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard',        end: true },
  { to: '/captures',  icon: FolderOpen,      label: 'Capture History',  end: false },
  { to: '/captures/new', icon: Upload,       label: 'New Capture',      end: false },
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
          <span className="sidebar-logo-subtitle">Protocol Analyzer</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-section">Navigation</div>

        {navItems.map(({ to, icon: Icon, label, end }) => (
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

        <div className="sidebar-nav-section" style={{ marginTop: 8 }}>Actions</div>

        <button
          className="sidebar-nav-item"
          onClick={() => onAnalyze ? onAnalyze() : navigate('/captures/new')}
        >
          <Activity size={15} className="nav-icon" />
          Analyze PCAP
        </button>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ marginBottom: 4 }}>IPsec Intelligence</div>
        <div>Frontend MVP · Phase 1</div>
      </div>
    </aside>
  );
}
