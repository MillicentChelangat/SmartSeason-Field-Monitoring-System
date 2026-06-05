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
        padding: '20px 16px 18px',
        borderBottom: '0.5px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, background: '#2d7a45', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Leaf size={15} color="#a8e6be" />
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 13.5, fontWeight: 700, color: '#fff', letterSpacing: -0.3 }}>
            SmartSeason
          </span>
        </div>
        {showClose && (
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
          >
            <X size={17} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
        {(['menu', 'reports'] as const).map(section => (
          <div key={section} style={{ marginBottom: 4 }}>
            {/* Section label — matches TailAdmin's grouped nav style */}
            <p style={{
              fontSize: 10, fontWeight: 600,
              color: 'rgba(255,255,255,0.28)',
              textTransform: 'uppercase', letterSpacing: 1.2,
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
                    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                    padding: '9px 10px', borderRadius: 8, marginBottom: 2,
                    background: isActive ? '#2d7a45' : 'transparent',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                    fontSize: 13, fontWeight: isActive ? 500 : 400,
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    fontFamily: "'DM Sans', sans-serif",
                    transition: 'background 0.15s, color 0.15s',
                    minHeight: 42,
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; } }}
                >
                  <Icon size={16} strokeWidth={isActive ? 2 : 1.6} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {/* Active indicator dot */}
                  {isActive && (
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a8e6be', flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User + Logout — pinned to bottom */}
      <div style={{ padding: '10px 10px 12px', borderTop: '0.5px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        {/* User row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 8px 10px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#2d7a45',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: '#a8e6be', fontWeight: 600, flexShrink: 0,
          }}>
            {user?.full_name ? initials(user.full_name) : 'A'}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12.5, color: '#fff', fontWeight: 500, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.full_name || 'Admin User'}
            </p>
            <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.38)', margin: 0 }}>Administrator</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 9,
            padding: '9px 10px', borderRadius: 8,
            color: 'rgba(255,100,80,0.7)', fontSize: 13,
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", minHeight: 42,
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,60,0.1)'; e.currentTarget.style.color = '#ff6e5a'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,100,80,0.7)'; }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef0eb', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:block"
        style={{
          width: 210, flexShrink: 0,
          margin: '12px 0 12px 12px',
          background: '#0f2e1a', borderRadius: 14,
          overflow: 'hidden',
          position: 'sticky', top: 12,
          height: 'calc(100vh - 24px)',
          alignSelf: 'flex-start',
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
          background: '#0f2e1a', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
        }}
      >
        <Menu size={18} color="#a8e6be" />
      </button>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="lg:hidden" style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div onClick={() => setSidebarOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
          <div style={{ position: 'relative', zIndex: 51, width: 240, background: '#0f2e1a', display: 'flex', flexDirection: 'column', height: '100%', boxShadow: '4px 0 24px rgba(0,0,0,0.3)' }}>
            <SidebarContent showClose />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, padding: '12px 12px 80px 12px' }}
        className="lg:pb-3"
      >
        <div className="lg:hidden" style={{ height: 52 }} />
        {children}
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="lg:hidden"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: 64, background: '#0f2e1a',
          display: 'flex', alignItems: 'center',
          zIndex: 40, boxShadow: '0 -1px 0 rgba(255,255,255,0.06), 0 -4px 20px rgba(0,0,0,0.25)',
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
                color: isActive ? '#a8e6be' : 'rgba(255,255,255,0.38)',
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