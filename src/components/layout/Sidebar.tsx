import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderSearch, Upload,
  Shield, Activity, Cpu,
} from 'lucide-react';

const NAV = [
  { to: '/',        label: 'Dashboard',       icon: <LayoutDashboard size={15} />, end: true },
  { to: '/captures',label: 'Capture History', icon: <FolderSearch    size={15} /> },
];

export function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div
        className="sidebar-logo"
        style={{ cursor: 'pointer' }}
        onClick={() => navigate('/')}
      >
        <div className="sidebar-logo-icon">
          <Shield size={16} color="#fff" />
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-name">IPsec Intelligence</span>
          <span className="sidebar-logo-sub">Protocol Analyzer</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>

        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div className="sidebar-section-label" style={{ marginTop: 8 }}>Analysis</div>

        <NavLink
          to="/captures/new"
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <span className="sidebar-link-icon"><Upload size={15} /></span>
          New Capture
        </NavLink>
      </nav>

      {/* Footer status */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#33cc66',
            boxShadow: '0 0 6px #33cc66',
          }} />
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Service Online
          </span>
        </div>
        <div style={{ fontSize: '0.625rem', color: 'var(--text-disabled)', marginTop: 4 }}>
          v1.0.0-MVP
        </div>
      </div>
    </aside>
  );
}
