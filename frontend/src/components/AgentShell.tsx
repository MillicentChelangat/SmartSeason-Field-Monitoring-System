import { useState, useEffect } from 'react';
import { Leaf, LayoutDashboard, MapPin, LogOut, Menu, Settings, Bell } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  user: any;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'my-fields', label: 'My Fields', icon: MapPin },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings',  label: 'Settings',  icon: Settings },
];

function initials(name: string) {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'A';
}

export function AgentShell({ children, activePage, onNavigate, onLogout, user }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile]       = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  const collapsed = !isMobile && !sidebarOpen;

  const SidebarContent = ({ isCollapsed = false }: { isCollapsed?: boolean }) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', overflow: 'hidden' }}>

      {/* Logo */}
     <div style={{ 
      padding: collapsed ? '22px 8px 18px' : '22px 20px 18px', 
      borderBottom: '1px solid #f0f4f0', flexShrink: 0, 
      display: 'flex', alignItems: 'center', 
      justifyContent: 'space-between' 
     }}>       
      <div style={{ 
           display: 'flex', alignItems: 'center', 
           gap: collapsed ? 0 : 10,
           justifyContent: collapsed ? 'center' : 'flex-start',
           width: '100%'
  }}>
         {/* Leaf icon always visible */}
          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#2d7a45,#1a5c30)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(45,122,69,0.3)', flexShrink: 0 }}>
            <Leaf size={17} color="#a8e6be" />
          </div>
          {!isCollapsed && (
            <div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1, margin: 0 }}>
                <span style={{ color: '#111' }}>Smart</span><span style={{ color: '#1d6b35' }}>Season</span>
              </p>
              <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 2, margin: 0 }}>Field Management</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px', minHeight: 0 }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activePage === id;
          return (
            <button key={id}
              onClick={() => handleNavigate(id)}
              title={isCollapsed ? label : undefined}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: isCollapsed ? 0 : 10,
                padding: isCollapsed ? '9px 0' : '9px 10px',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                borderRadius: 8, marginBottom: 2,
                background: isActive ? '#eef6f0' : 'transparent',
                color: isActive ? '#1d6b35' : '#6b7280',
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                border: 'none', cursor: 'pointer', textAlign: 'left',
                fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = '#374151'; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}}
            >
              <Icon size={16} />
              {!isCollapsed && <span style={{ flex: 1 }}>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: '12px 12px 16px', borderTop: '1px solid #f0f4f0', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: isCollapsed ? 0 : 10, padding: '10px', borderRadius: 9, background: '#f9fafb', marginBottom: 6, justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#2d7a45,#1a5c30)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#a8e6be', fontWeight: 700, flexShrink: 0 }}>
    {user?.full_name ? initials(user.full_name) : 'A'}
  </div>
  {!isCollapsed && (
    <div style={{ minWidth: 0, flex: 1 }}>
      <p style={{ fontSize: 12.5, color: '#111', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
        {user?.full_name || 'Agent'}
      </p>
      <p style={{ fontSize: 10.5, color: '#9ca3af', margin: 0 }}>Field Agent</p>
    </div>
  )}
</div>
          {!isCollapsed && (
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 12.5, color: '#111', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                {user?.full_name || 'Agent'}
              </p>
              <p style={{ fontSize: 10.5, color: '#9ca3af', margin: 0 }}>Field Agent</p>
            </div>
          )}
        </div>
        <button onClick={onLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, color: '#ef4444', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s', fontWeight: 500, justifyContent: isCollapsed ? 'center' : 'flex-start' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut size={15} />
          {!isCollapsed && <span>Sign out</span>}
        </button>
      </div>
  );
 
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#eef2ee', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Desktop sidebar */}
      {!isMobile && (
        <aside style={{
          width: sidebarOpen ? 240 : 56, flexShrink: 0,
          height: '100vh', overflow: 'hidden',
          borderRight: '1px solid #e0f5e0',
          transition: 'width 0.25s ease',
        }}>
          <SidebarContent isCollapsed={collapsed} />
        </aside>
      )}

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div onClick={() => setMobileOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'relative', zIndex: 51, width: '75vw', maxWidth: 280, height: '100%', boxShadow: '4px 0 32px rgba(0,0,0,0.15)' }}>
            <SidebarContent isCollapsed={false} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden' }}>

        {/* Mobile topbar */}
        {isMobile && (
          <div style={{ height: 56, flexShrink: 0, background: '#fff', borderBottom: '1px solid #e0f5e0', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
            <button onClick={() => setMobileOpen(true)}
              style={{ width: 36, height: 36, borderRadius: 9, background: '#f9fafb', border: '1px solid #e8ede8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#374151' }}>
              <Menu size={18} />
            </button>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700 }}>
              <span style={{ color: '#111' }}>Smart</span><span style={{ color: '#1d6b35' }}>Season</span>
            </span>
          </div>
        )}

        {/* Desktop topbar with hamburger */}
        {!isMobile && (
          <div style={{ height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid #f0f4f0', background: '#fff' }}>
            <button onClick={() => setSidebarOpen(p => !p)}
              style={{ width: 32, height: 32, borderRadius: 8, background: '#f9fafb', border: '1px solid #e8ede8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}>
              <Menu size={15} />
            </button>
          </div>
        )}

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}