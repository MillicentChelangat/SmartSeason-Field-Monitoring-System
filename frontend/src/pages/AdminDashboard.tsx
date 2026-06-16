import { useEffect, useState } from 'react';
import {
  Leaf, MapPin, Users, AlertTriangle,
  CheckCircle2, Activity, TrendingUp,  Download,
  Plus, Menu, Bell, ChevronRight,
} from 'lucide-react';
import API from '../api/api.ts';
import type { Field, FieldUpdate, Profile } from '../types/database';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AdminSidebar } from '../components/AdminSidebar.tsx';

interface FieldWithStatus extends Field {
  lastUpdate?: FieldUpdate | null;
  assignedAgents: Profile[];
}
interface EnrichedUpdate extends FieldUpdate {
  field_name: string;
  agent_name: string;
}
interface Props {
  onNavigate: (page: string, fieldId?: string) => void;
  onLogout: () => void;
  user: any;
}

const STAGE_COLORS: Record<string, string> = {
  planted:   '#e8a020',
  growing:   '#1a5ac2',
  ready:     '#2d7a45',
  harvested: '#888888',
};
const AVATAR_COLORS = [
  { bg: '#e8f0fb', color: '#1a5ac2' },
  { bg: '#e8f5ee', color: '#1d6b35' },
  { bg: '#fef3e2', color: '#b56c10' },
  { bg: '#fde8e4', color: '#c0392b' },
  { bg: '#f0f2ee', color: '#555555' },
];

const CARD_STYLES = [
  { bg: 'linear-gradient(135deg,#1d6b35,#2d9e54)', iconBg: 'rgba(255,255,255,0.2)', iconColor: '#fff', textColor: '#fff', subColor: 'rgba(255,255,255,0.75)' },
  { bg: 'linear-gradient(135deg,#1a4fa0,#2563eb)', iconBg: 'rgba(255,255,255,0.2)', iconColor: '#fff', textColor: '#fff', subColor: 'rgba(255,255,255,0.75)' },
  { bg: 'linear-gradient(135deg,#b45309,#d97706)', iconBg: 'rgba(255,255,255,0.2)', iconColor: '#fff', textColor: '#fff', subColor: 'rgba(255,255,255,0.75)' },
  { bg: 'linear-gradient(135deg,#374151,#6b7280)', iconBg: 'rgba(255,255,255,0.2)', iconColor: '#fff', textColor: '#fff', subColor: 'rgba(255,255,255,0.75)' },
];

function initials(name: string) {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
}
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs  > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'just now';
}

export function AdminDashboard({ onNavigate, onLogout, user }: Props) {
  const [fields, setFields]               = useState<FieldWithStatus[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<EnrichedUpdate[]>([]);
  const [agentList, setAgentList]         = useState<Profile[]>([]);
  const [agentCount, setAgentCount]       = useState(0);
  const [loading, setLoading]             = useState(true);
  const [activePage, setActivePage]       = useState('dashboard');
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [isMobile, setIsMobile]           = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [fieldsRes, updatesRes, agentsRes] = await Promise.all([
          API.get('fields/'),
          API.get('field-updates/'),
          API.get('agents/'),
        ]);
        const rawFields: Field[]  = fieldsRes.data;
        const allUpdates: any[]   = updatesRes.data;
        const agents: Profile[]   = agentsRes.data;
        const enriched: FieldWithStatus[] = rawFields.map(field => {
          const fieldUpdates = allUpdates.filter(u => u.field_id === field.id);
          const lastUpdate   = fieldUpdates[0] ?? null;
return { ...field, lastUpdate, assignedAgents: [] };        });
        const enrichedUpdates: EnrichedUpdate[] = allUpdates.map(update => {
          const field = rawFields.find(f => f.id === update.field_id);
          const agent = agents.find(a => a.user_id === update.agent_id);
          return { ...update, field_name: field?.name ?? `Field #${update.field_id}`, agent_name: update.agent_name ?? agent?.full_name ?? 'Unknown Agent' };
        });
        setFields(enriched);
        setRecentUpdates(enrichedUpdates);
        setAgentCount(agents.length);
        setAgentList(agents);
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0f4f0' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  
  const atRisk    = fields.filter(f => f.status === 'at_risk').length;
  const completed = fields.filter(f => f.current_stage === 'harvested').length;
  const stageBreakdown = {
    planted:   fields.filter(f => f.current_stage === 'planted').length,
    growing:   fields.filter(f => f.current_stage === 'growing').length,
    ready:     fields.filter(f => f.current_stage === 'ready').length,
    harvested: fields.filter(f => f.current_stage === 'harvested').length,
  };
  const stageTotal = Object.values(stageBreakdown).reduce((a, b) => a + b, 0);

  function handleNav(id: string) {
    setActivePage(id);
    setSidebarOpen(false);
    if (['dashboard', 'fields', 'agents'].includes(id)) onNavigate(id);
  }

  const STAT_CARDS = [
    { label: 'Total Fields', value: fields.length,  icon: <MapPin size={18} />,        trend: '+2 this season',  trendUp: true  },
    { label: 'Field Agents', value: agentCount,      icon: <Users size={18} />,         trend: `${agentCount} active`, trendUp: null },
    { label: 'At Risk',      value: atRisk,           icon: <AlertTriangle size={18} />, trend: atRisk > 0 ? 'Needs attention' : 'All clear', trendUp: atRisk === 0 },
    { label: 'Completed',    value: completed,        icon: <CheckCircle2 size={18} />,  trend: 'Ready to harvest', trendUp: null },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#eef2ee', fontFamily: "'DM Sans', sans-serif" }}>

      {/* MOBILE OVERLAY */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
      )}

      {/* ══ SIDEBAR — now white ══ */}
    <aside style={{
         width: sidebarOpen ? 240 : 56,
         flexShrink: 0, height: '100vh',
         borderRight: '1px solid #e0f5e0',
         position: isMobile ? 'fixed' : 'relative',
         top: 0, left: 0, zIndex: isMobile ? 50 : 'auto',
         transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
         transition: 'width 0.25s ease, transform 0.25s ease',
         overflow: 'hidden',
         boxShadow: isMobile && sidebarOpen ? '6px 0 30px rgba(0,0,0,0.12)' : 'none',
    }}>
       <AdminSidebar
        activePage={activePage}
        onNavigate={handleNav}
        onLogout={onLogout}
        user={user}
        fieldCount={fields.length}
        agentCount={agentCount}
        onClose={() => setSidebarOpen(false)}
        collapsed={!isMobile && !sidebarOpen} 

       />
    </aside>

      {/* ══ MAIN — only this scrolls ══ */}
      <div style={{ flex: 1, minWidth: 0, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* TOPBAR */}
        <header style={{ position: 'sticky', top: 0, zIndex: 30, background: '#fff', borderBottom: '1px solid #e2e8e2', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSidebarOpen(prev => !prev)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 6, display: 'flex', alignItems: 'center', borderRadius: 7, transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
            <Menu size={20} />
            </button>
            {/* Title only — date removed */}
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: '#111', lineHeight: 1, margin: 0 }}>Dashboard</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button style={{ position: 'relative', width: 36, height: 36, borderRadius: 9, background: '#f3f4f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              <Bell size={16} />
              {atRisk > 0 && <span style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: '50%', background: '#ef4444', border: '1.5px solid #fff' }} />}
            </button>
            {!isMobile && (
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: '#f3f4f6', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#374151', fontFamily: "'DM Sans', sans-serif" }}>
                <Download size={14} /> Export
              </button>
            )}
            <button onClick={() => onNavigate('fields')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: '#1d6b35', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
            >
              <Plus size={14} /> {isMobile ? '' : 'Add Field'}
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main style={{ padding: isMobile ? '16px 14px 32px' : '24px 24px 40px', display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20 }}>

          {/* Welcome banner */}
          <div style={{ background: 'linear-gradient(135deg,#0f2e1a,#1d6b35)', borderRadius: 14, padding: isMobile ? '18px 18px' : '22px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
            <div style={{ position: 'absolute', right: 40, bottom: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <div>
              <p style={{ fontSize: isMobile ? 12 : 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Welcome back,</p>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: isMobile ? 18 : 22, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{user?.full_name?.split(' ')[0] || 'Admin'}</p>
              <p style={{ fontSize: isMobile ? 11 : 12, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>You have {fields.length} fields and {agentCount} agents active</p>
            </div>
            <Leaf size={isMobile ? 40 : 56} color="rgba(168,230,190,0.25)" />
          </div>

          {/* STAT CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 16 }}>
            {STAT_CARDS.map(({ label, value, icon, trend, trendUp }, i) => {
              const style = CARD_STYLES[i];
              return (
                <div key={label} style={{ background: style.bg, borderRadius: 14, padding: isMobile ? '14px 14px' : '20px 20px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', right: -10, top: -10, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: isMobile ? 9.5 : 11, fontWeight: 600, color: style.subColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: style.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: style.iconColor }}>
                      {icon}
                    </div>
                  </div>
                  <p style={{ fontFamily: "'Syne', sans-serif", fontSize: isMobile ? 26 : 30, fontWeight: 700, color: style.textColor, lineHeight: 1, marginBottom: 6 }}>{value}</p>
                  <p style={{ fontSize: isMobile ? 10 : 11, color: style.subColor }}>
                    {trendUp === true ? '↑ ' : trendUp === false ? '↓ ' : ''}{trend}
                  </p>
                </div>
              );
            })}
          </div>

          {/* MIDDLE ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,2fr) minmax(260px,1fr)', gap: isMobile ? 14 : 16, alignItems: 'start' }}>

            {/* ALL FIELDS */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8e2', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f3f4f6', background: '#fafcfa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={15} color="#1d6b35" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>All Fields</span>
                  <span style={{ fontSize: 11, background: '#eef2ee', color: '#1d6b35', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{fields.length}</span>
                </div>
                <button onClick={() => onNavigate('fields')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: '#1d6b35', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Manage <ChevronRight size={13} />
                </button>
              </div>
              {fields.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <MapPin size={30} style={{ color: '#d1d5db', margin: '0 auto 10px', display: 'block' }} />
                  <p style={{ fontSize: 13, color: '#9ca3af' }}>No fields yet. Add your first field.</p>
                </div>
              ) : fields.map((field, idx) => (
                <button key={field.id} onClick={() => onNavigate('field-detail', String(field.id))}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: idx < fields.length - 1 ? '1px solid #f9fafb' : 'none', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9fbf9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eef6f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={15} color="#1d6b35" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 500, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{field.name}</p>
                    <p style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2, margin: 0 }}>{field.crop_type}{field.location ? ` · ${field.location}` : ''}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <StageBadge stage={field.current_stage} />
                    <StatusBadge status={field.status} />
                  </div>
                </button>
              ))}
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* STAGE DISTRIBUTION */}
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8e2', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f3f4f6' }}>
                  <TrendingUp size={15} color="#1d6b35" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Stage Distribution</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                  <DonutChart data={stageBreakdown} total={stageTotal} colors={STAGE_COLORS} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {Object.entries(stageBreakdown).map(([stage, count]) => (
                    <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#6b7280', background: '#fafafa', borderRadius: 8, padding: '6px 8px' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 3, background: STAGE_COLORS[stage], flexShrink: 0 }} />
                      <span style={{ textTransform: 'capitalize', flex: 1 }}>{stage}</span>
                      <span style={{ fontWeight: 700, color: '#111' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AGENTS */}
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8e2', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={15} color="#1d6b35" />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Active Agents</span>
                  </div>
                  <button onClick={() => onNavigate('agents')} style={{ fontSize: 12, color: '#1d6b35', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>View all</button>
                </div>
                {agentList.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: '8px 0', margin: 0 }}>No agents yet.</p>
                ) : agentList.slice(0, 5).map((agent, idx) => {
                  const col = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  return (
                    <div key={agent.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: idx < Math.min(agentList.length, 5) - 1 ? 12 : 0 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: col.bg, color: col.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {initials(agent.full_name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{agent.full_name}</p>
                        <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Field Agent</p>
                      </div>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RECENT ACTIVITY */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8e2', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f3f4f6', background: '#fafcfa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={15} color="#1d6b35" />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Recent Activity</span>
              </div>
              <button style={{ fontSize: 12.5, color: '#1d6b35', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>View all</button>
            </div>
            {recentUpdates.length === 0 ? (
              <div style={{ padding: '36px 24px', textAlign: 'center' }}>
                <Activity size={28} style={{ color: '#d1d5db', margin: '0 auto 10px', display: 'block' }} />
                <p style={{ fontSize: 13, color: '#9ca3af' }}>No activity recorded yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {recentUpdates.slice(0, 6).map((update, idx) => (
                  <div key={update.id} style={{ display: 'flex', gap: 12, padding: '14px 18px', borderBottom: '1px solid #f9fafb', borderRight: '1px solid #f9fafb' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0, marginTop: 6 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, margin: 0 }}>
                        <strong style={{ color: '#1d6b35' }}>{update.agent_name}</strong>{' updated '}
                        <span style={{ fontWeight: 500 }}>{update.field_name}</span>{' → '}
                        <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{update.stage}</span>
                      </p>
                      {update.notes && <p style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 3, fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>"{update.notes}"</p>}
                      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, margin: 0 }}>{timeAgo(update.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}

/* ── Donut Chart ── */
function DonutChart({ data, total, colors }: { data: Record<string, number>; total: number; colors: Record<string, string> }) {
  const cx = 60, cy = 60, r = 50, ir = 34;
  let startAngle = -Math.PI / 2;
  const slices = Object.entries(data).map(([key, val]) => {
    const angle = total ? (val / total) * Math.PI * 2 : 0;
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(startAngle + angle), y2 = cy + r * Math.sin(startAngle + angle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    startAngle += angle;
    return { key, path, color: colors[key] };
  });
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      {total === 0 ? <circle cx={cx} cy={cy} r={r} fill="#f0f4f0" /> : slices.map(s => <path key={s.key} d={s.path} fill={s.color} />)}
      <circle cx={cx} cy={cy} r={ir} fill="#fff" />
      <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, fill: '#111' }}>{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fill: '#9ca3af' }}>fields</text>
    </svg>
  );
}