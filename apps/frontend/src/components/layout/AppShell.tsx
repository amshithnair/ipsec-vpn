import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell() {
  const location = useLocation();
  const [animKey, setAnimKey] = useState(location.pathname);
  const [isNavigating, setIsNavigating] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setIsNavigating(true);
    setAnimKey(location.pathname);

    // Reset scroll to top
    const contentEl = document.querySelector('.app-content');
    if (contentEl) contentEl.scrollTop = 0;

    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className={`app-shell ${collapsed ? 'dock-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />

      <div className="app-main">
        <Topbar />
        
        {/* Top HUD Laser Beam Sweep Indicator */}
        <div className={`hud-top-laser-beam ${isNavigating ? 'active' : ''}`} />

        <main className="app-content">
          <div key={animKey} className="page-transition-wrapper">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
