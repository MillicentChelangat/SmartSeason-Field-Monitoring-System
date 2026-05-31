import {
  Leaf, LayoutDashboard, MapPin, LogOut,
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
  { id: 'my-fields', label: 'My Fields', icon: MapPin,           section: 'menu' },
];

function initials(name: string) {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'A';
}

export function AgentShell({ children, activePage, onNavigate, onLogout, user }: Props) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#eef0eb', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width: 200, flexShrink: 0, margin: 12, background: '#0f2e1a', borderRadius: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Logo */}
        <div style={{ padding: '18px 16px 16px', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, background: '#2d7a45', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={15} color="#a8e6be" />
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: -0.3 }}>
              SmartSeason
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
          {(['menu'] as const).map(section => (
            <div key={section}>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, padding: '12px 8px 6px', fontWeight: 500 }}>
                {section}
              </p>
              {NAV_ITEMS.filter(i => i.section === section).map(({ id, label, icon: Icon }) => {
                const isActive = activePage === id;
                return (
                  <button
                    key={id}
                    onClick={() => onNavigate(id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                      padding: '8px 10px', borderRadius: 8, marginBottom: 1,
                      background: isActive ? '#2d7a45' : 'transparent',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                      fontSize: 14.5, fontWeight: isActive ? 500 : 400,
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      fontFamily: "'DM Sans', sans-serif", transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Icon size={15} />
                    <span style={{ flex: 1 }}>{label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: '10px 8px', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginBottom: 3 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2d7a45', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#a8e6be', fontWeight: 600, flexShrink: 0 }}>
              {user?.full_name ? initials(user.full_name) : 'A'}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 14, color: '#fff', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.full_name || 'Agent'}
              </p>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Field Agent</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, color: 'rgba(255,100,80,0.75)', fontSize: 14.5, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,60,0.1)'; e.currentTarget.style.color = '#ff6e5a'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,100,80,0.75)'; }}
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px 12px 12px 0' }}>
        {children}
      </div>
    </div>
  );
}