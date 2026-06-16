import { useState, useEffect } from 'react';
import { Leaf, Menu } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';

interface Props {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  user: any;
  fieldCount?: number;
  agentCount?: number;
}

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard', fields: 'Fields', agents: 'Agents',
  analytics: 'Analytics', reports: 'Reports',
  settings: 'Settings', help: 'Help & Support',
};

export function AdminShell({ children, activePage, onNavigate, onLogout, user, fieldCount, agentCount }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [isMobile, setIsMobile]       = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#eef2ee', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Desktop sidebar */}
      {!isMobile && (
        <aside style={{
          width: sidebarOpen ? 240 : 56, flexShrink: 0,
          height: '100vh', overflow: 'hidden',
          borderRight: sidebarOpen ? '1px solid #e0f5e0' : 'none',
          transition: 'width 0.25s ease',
        }}>
          <AdminSidebar
            activePage={activePage} onNavigate={onNavigate}
            onLogout={onLogout} user={user}
            fieldCount={fieldCount} agentCount={agentCount}
            collapsed={!sidebarOpen}
          />
        </aside>
      )}

      {/* Mobile overlay drawer */}
      {isMobile && mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div onClick={() => setMobileOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'relative', zIndex: 51, width: '75vw', maxWidth: 280, height: '100%', boxShadow: '4px 0 32px rgba(0,0,0,0.15)' }}>
            <AdminSidebar
              activePage={activePage} onNavigate={onNavigate}
              onLogout={onLogout} user={user}
              fieldCount={fieldCount} agentCount={agentCount}
              onClose={() => setMobileOpen(false)}
              collapsed={false}
            />
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden' }}>

        {/* Mobile topbar */}
        {isMobile && (
          <div style={{ height: 56, flexShrink: 0, background: '#fff', borderBottom: '1px solid #e0f5e0', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, position: 'sticky', top: 0, zIndex: 30 }}>
            <button onClick={() => setMobileOpen(true)}
              style={{ width: 36, height: 36, borderRadius: 9, background: '#f9fafb', border: '1px solid #e8ede8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#374151' }}>
              <Menu size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#2d7a45,#1a5c30)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Leaf size={14} color="#a8e6be" />
              </div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700 }}>
                <span style={{ color: '#111' }}>Smart</span><span style={{ color: '#1d6b35' }}>Season</span>
              </span>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: '#374151' }}>
              {PAGE_TITLES[activePage] || ''}
            </span>
          </div>
        )}

        {/* Desktop hamburger */}
        {!isMobile && (
          <div style={{
            height: 48, flexShrink: 0, display: 'flex',
            alignItems: 'center', padding: '0 16px',
            borderBottom: '1px solid #f0f4f0', background: '#fff',
          }}>
            <button onClick={() => setSidebarOpen(p => !p)}
              style={{ width: 32, height: 32, borderRadius: 8, background: '#f9fafb', border: '1px solid #e8ede8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}>
              <Menu size={15} />
            </button>
            <span style={{ marginLeft: 12, fontSize: 14, fontWeight: 600, color: '#374151' }}>
              {PAGE_TITLES[activePage] || ''}
            </span>
          </div>
        )}

        {/* Page content — scroll happens here */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}