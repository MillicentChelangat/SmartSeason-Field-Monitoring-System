import { useState } from 'react';
import {
  Leaf, LayoutDashboard, MapPin, Users,
  BarChart2, FileText, LogOut, Menu, X,
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
  { id: 'fields',    label: 'Fields',    icon: MapPin,           section: 'menu' },
  { id: 'agents',    label: 'Agents',    icon: Users,            section: 'menu' },
  { id: 'analytics', label: 'Analytics', icon: BarChart2,        section: 'reports' },
  { id: 'reports',   label: 'Reports',   icon: FileText,         section: 'reports' },
];

const BOTTOM_TABS = [
  { id: 'dashboard', label: 'Home',   icon: LayoutDashboard },
  { id: 'fields',    label: 'Fields', icon: MapPin },
  { id: 'agents',    label: 'Agents', icon: Users },
  { id: '__menu__',  label: 'Menu',   icon: Menu },
];

function initials(name: string) {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'A';
}

export function AdminShell({ children, activePage, onNavigate, onLogout, user }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleNav(id: string) {
    onNavigate(id);
    setSidebarOpen(false);
  }

  const SidebarContent = ({ showClose }: { showClose?: boolean }) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Logo */}
      <div style={{
        padding: '20px 20px 18px',
        borderBottom: '1px solid #f0f2ee',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34,
            background: 'linear-gradient(135deg,#2d7a45,#1a5c30)',
            borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(45,122,69,0.3)', flexShrink: 0,
          }}>
            <Leaf size={17} color="#a8e6be" />
          </div>
          <div>
            <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1, margin: 0 }}>
              <span style={{ color: '#111' }}>Smart</span><span style={{ color: '#1d6b35' }}>Season</span>
            </p>
            <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 2, margin: 0 }}>Field Management</p>
          </div>
        </div>
        {showClose && (
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#111'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9ca3af'; }}
          >
            <X size={17} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {(['menu', 'reports'] as const).map(section => (
          <div key={section} style={{ marginBottom: 4 }}>
            <p style={{
              fontSize: 10, fontWeight: 600,
              color: '#9ca3af',
              textTransform: 'uppercase', letterSpacing: 1.3,
              padding: '14px 8px 6px', margin: 0,
            }}>
              {section}
            </p>
            {NAV_ITEMS.filter(i => i.section === section).map(({ id, label, icon: Icon }) => {
              const isActive = activePage === id;
              return (
                <button
                  key={id}
                  onClick={() => handleNav(id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 8, marginBottom: 2,
                    background: isActive ? '#eef6f0' : 'transparent',
                    color: isActive ? '#1d6b35' : '#6b7280',
                    fontSize: 13, fontWeight: isActive ? 600 : 400,
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    fontFamily: "'DM Sans', sans-serif",
                    transition: 'background 0.15s, color 0.15s',
                    minHeight: 42,
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = '#374151'; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; } }}
                >
                  <Icon size={16} strokeWidth={isActive ? 2 : 1.6} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {isActive && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1d6b35', flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: '10px 12px 14px', borderTop: '1px solid #f0f2ee', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 9, background: '#f9fafb', marginBottom: 4 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg,#2d7a45,#1a5c30)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: '#a8e6be', fontWeight: 700, flexShrink: 0,
          }}>
            {user?.full_name ? initials(user.full_name) : 'A'}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12.5, color: '#111', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.full_name || 'Admin User'}
            </p>
            <p style={{ fontSize: 10.5, color: '#9ca3af', margin: 0 }}>Administrator</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 9,
            padding: '9px 10px', borderRadius: 8,
            color: '#ef4444', fontSize: 13, fontWeight: 500,
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef2ee', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Desktop sidebar — white */}
      <aside
        className="hidden lg:block"
        style={{
          width: 220, flexShrink: 0,
          background: '#ffffff',
          borderRight: '1px solid #e8ede8',
          position: 'sticky', top: 0,
          height: '100vh',
          alignSelf: 'flex-start',
          overflow: 'hidden',
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile hamburger */}
      <button
        className="lg:hidden"
        onClick={() => setSidebarOpen(true)}
        style={{
          position: 'fixed', top: 14, left: 14, zIndex: 40,
          width: 38, height: 38, borderRadius: 10,
          background: '#fff', border: '1px solid #e8ede8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <Menu size={18} color="#374151" />
      </button>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="lg:hidden" style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div onClick={() => setSidebarOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
          <div style={{
            position: 'relative', zIndex: 51,
            width: 240, background: '#fff',
            display: 'flex', flexDirection: 'column',
            height: '100%', boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
          }}>
            <SidebarContent showClose />
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, padding: '16px 16px 80px 16px' }}
        className="lg:pb-4"
      >
        <div className="lg:hidden" style={{ height: 52 }} />
        {children}
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="lg:hidden"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: 64, background: '#fff',
          borderTop: '1px solid #e8ede8',
          display: 'flex', alignItems: 'center',
          zIndex: 40, boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
        }}
      >
        {BOTTOM_TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activePage === id;
          return (
            <button
              key={id}
              onClick={() => id === '__menu__' ? setSidebarOpen(true) : handleNav(id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                height: '100%', background: 'none', border: 'none', cursor: 'pointer',
                color: isActive ? '#1d6b35' : '#9ca3af',
                fontFamily: "'DM Sans', sans-serif", transition: 'color 0.15s',
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.6} />
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}