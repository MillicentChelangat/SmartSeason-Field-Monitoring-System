import {
  Leaf, LayoutDashboard, MapPin, Users, BarChart2,
  FileText, Settings, LogOut, X, Bell,
} from 'lucide-react';

interface Props {
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  user: any;
  fieldCount?: number;
  agentCount?: number;
  onClose?: () => void;
   collapsed?: boolean
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'menu' },
  { id: 'fields',    label: 'Fields',    icon: MapPin,           section: 'menu' },
  { id: 'agents',    label: 'Agents',    icon: Users,            section: 'menu' },
  { id: 'analytics', label: 'Analytics', icon: BarChart2,        section: 'reports' },
  { id: 'reports',   label: 'Reports',   icon: FileText,         section: 'reports' },
  { id: 'settings',  label: 'Settings',  icon: Settings,         section: 'system' },
  { id: 'notifications', label: 'Notifications', icon: Bell, section: 'menu' },
];

function initials(name: string) {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'A';
}

export function AdminSidebar({ activePage, onNavigate, onLogout, user, fieldCount, agentCount, onClose, collapsed }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#ffffff', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>

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

          {/* Hide text when collapsed */}
          {!collapsed && (
          <div>
            <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1, margin: 0 }}>
              <span style={{ color: '#111' }}>Smart</span><span style={{ color: '#1d6b35' }}>Season</span>
            </p>
            <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 2, margin: 0 }}>Field Management</p>
          </div>
          )}
        </div>
        {onClose && !collapsed && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 6, display: 'flex', alignItems: 'center', borderRadius: 6 }}>
            <X size={20} />
          </button>
        )}
      </div>
      
      {/* Nav */}
<nav style={{ flex: 1, overflowY: 'auto', padding: '12px', minHeight: 0 }}>
  {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
    const isActive = activePage === id;
    const badge = id === 'fields' ? fieldCount : id === 'agents' ? agentCount : undefined;
    return (
      <button key={id}
        onClick={() => { onNavigate(id); onClose?.(); }}
        title={collapsed ? label : undefined}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          gap: collapsed ? 0 : 10,
          padding: collapsed ? '9px 0' : '9px 10px',
          justifyContent: collapsed ? 'center' : 'flex-start',
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
        {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
        {!collapsed && badge !== undefined && (
          <span style={{ background: isActive ? '#1d6b35' : '#e85d3a', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>
            {badge}
          </span>
        )}
      </button>
    );
  })}
</nav>
      {/* User + Logout */}
      <div style={{ padding: '12px 12px 16px', borderTop: '1px solid #f0f4f0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px', borderRadius: 9, background: '#f9fafb', marginBottom: 6 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#2d7a45,#1a5c30)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#a8e6be', fontWeight: 700, flexShrink: 0 }}>
            {user?.full_name ? initials(user.full_name) : 'A'}
          </div>
          {!collapsed && (
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 12.5, color: '#111', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
              {user?.full_name || 'Admin'}
            </p>
            <p style={{ fontSize: 10.5, color: '#9ca3af', margin: 0 }}>Administrator</p>
          </div>
          )}
        </div>
        <button onClick={onLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, color: '#ef4444', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s', fontWeight: 500, justifyContent: collapsed ? 'center' : 'flex-start' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut size={15}   />
          {/* Hide label when collapsed */}
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );
}