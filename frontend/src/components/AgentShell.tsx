import { useState } from 'react';
import {
  Leaf, LayoutDashboard, MapPin, LogOut, Menu, X, BarChart2, Settings, HelpCircle,
} from 'lucide-react';

interface Props {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  user: any;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'menu' },
  { id: 'my-fields', label: 'My Fields', icon: MapPin, section: 'menu' },
  { id: 'analytics', label: 'Analytics', icon: BarChart2, section: 'reports' },
  { id: 'settings', label: 'Settings', icon: Settings, section: 'system' },
  { id: 'help', label: 'Help', icon: HelpCircle, section: 'system' },
];

function initials(name: string) {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'A';
}

export function AgentShell({ children, activePage, onNavigate, onLogout, user }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setSidebarOpen(false);
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: '18px 16px 16px', borderBottom: '0.5px solid #f0f2ee' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, background: '#2d7a45', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={15} color="#a8e6be" />
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 500, color: '#111', letterSpacing: -0.3 }}>
              SmartSeason
            </span>
            <span style={{ fontSize: 11, color: '#888', display: 'block' }}>Field Management</span>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', padding: 4 }}
            className="lg:hidden"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
       {['menu', 'reports', 'system'].map(section => {
       const sectionItems = NAV_ITEMS.filter(item => item.section === section);
       return (
      <div key={section}>
        <p style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, padding: '12px 8px 6px', fontWeight: 500 }}>
          {section}
        </p>
        {sectionItems.map(({ id, label, icon: Icon }) => {
          const isActive = activePage === id;
          return (
            <button
              key={id}
              onClick={() => handleNavigate(id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 10px', borderRadius: 8, marginBottom: 1,
                background: isActive ? '#e8f5ee' : 'transparent',
                color: isActive ? '#1d6b35' : '#555',
                fontSize: 14.5, fontWeight: isActive ? 600 : 400,
                border: 'none', cursor: 'pointer', textAlign: 'left',
                fontFamily: "'DM Sans', sans-serif", transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f5f6f4'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={15} />
              <span style={{ flex: 1 }}>{label}</span>
            </button>
          );
        })}
      </div>
    );
  })}
</nav>

      {/* User + Logout */}
      <div style={{ padding: '10px 8px', borderTop: '0.5px solid #f0f2ee' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginBottom: 3 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2d7a45', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 600, flexShrink: 0 }}>
            {user?.full_name ? initials(user.full_name) : 'A'}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, color: '#111', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
              {user?.full_name || 'Agent'}
            </p>
            <p style={{ fontSize: 11, color: '#888', margin: 0 }}>Field Agent</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, color: '#e85d3a', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fde8e4'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#eef0eb', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className="hidden lg:flex"
        style={{ width: 200, flexShrink: 0, margin: 12, background: '#fff', borderRadius: 14, flexDirection: 'column', overflow: 'hidden' }}
      >
        <SidebarContent />
      </aside>

      {/* ── MOBILE OVERLAY ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
          className="lg:hidden"
        />
      )}

      {/* ── MOBILE SIDEBAR (drawer) ── */}
      <aside
        className="lg:hidden"
        style={{
          position: 'fixed', top: 0, left: 0, height: '100vh',
          width: 220, background: '#fff',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          zIndex: 50,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
        }}
      >
        <SidebarContent />
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Mobile hamburger only — no SmartSeason title */}
        <div
          className="lg:hidden"
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#eef0eb' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: '#fff', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Menu size={18} color="#555" />
          </button>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '0 12px 12px', paddingTop: 0 }} className="lg:pt-3 lg:pr-3 lg:pb-3 lg:pl-0">
          {children}
        </div>
      </div>
    </div>
  );
}