import { useEffect, useState } from 'react';
import {
  Leaf, LayoutDashboard, MapPin, Users, AlertTriangle,
  CheckCircle2, Activity, TrendingUp, BarChart2,
  FileText, Settings, HelpCircle, LogOut, Download,
  Plus, Menu, X, Bell, ChevronRight, Circle
} from 'lucide-react';
import API from '../api/api.ts';
import type { Field, FieldUpdate, Profile } from '../types/database';
import { computeFieldStatus } from '../lib/fieldStatus';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface FieldWithStatus extends Field {
  status: ReturnType<typeof computeFieldStatus>;
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

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'menu' },
  { id: 'fields',    label: 'Fields',    icon: MapPin,          section: 'menu' },
  { id: 'agents',    label: 'Agents',    icon: Users,           section: 'menu' },
  { id: 'analytics', label: 'Analytics', icon: BarChart2,       section: 'reports' },
  { id: 'reports',   label: 'Reports',   icon: FileText,        section: 'reports' },
  { id: 'settings',  label: 'Settings',  icon: Settings,        section: 'system' },
  { id: 'help',      label: 'Help',      icon: HelpCircle,      section: 'system' },
];

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

function initials(name: string) {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
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
  const [sidebarOpen, setSidebarOpen]     = useState(false);

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
          return { ...field, status: computeFieldStatus(field, lastUpdate), lastUpdate, assignedAgents: [] };
        });

        const enrichedUpdates: EnrichedUpdate[] = allUpdates.map(update => {
          const field = rawFields.find(f => f.id === update.field_id);
          const agent = agents.find(a => a.user_id === update.agent_id);
          return {
            ...update,
            field_name: field?.name ?? `Field #${update.field_id}`,
            agent_name: update.agent_name ?? agent?.full_name ?? 'Unknown Agent',
          };
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0f2ef' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const atRisk    = fields.filter(f => f.status === 'at_risk').length;
  const completed = fields.filter(f => f.status === 'completed').length;
  const active    = fields.filter(f => f.status === 'active').length;

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
    {
      label: 'Total Fields', value: fields.length,
      icon: <MapPin size={16} />, iconBg: '#dcfce7', iconColor: '#16a34a',
      trend: '+2 this season', trendUp: true,
    },
    {
      label: 'Field Agents', value: agentCount,
      icon: <Users size={16} />, iconBg: '#dbeafe', iconColor: '#2563eb',
      trend: `${agentCount} active`, trendUp: null,
    },
    {
      label: 'At Risk', value: atRisk,
      icon: <AlertTriangle size={16} />, iconBg: '#fef3c7', iconColor: '#d97706',
      trend: atRisk > 0 ? 'Needs attention' : 'All clear', trendUp: atRisk === 0,
    },
    {
      label: 'Completed', value: completed,
      icon: <CheckCircle2 size={16} />, iconBg: '#f1f5f9', iconColor: '#64748b',
      trend: 'Ready to harvest', trendUp: null,
    },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f0f2ef', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── MOBILE OVERLAY ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 220,
        flexShrink: 0,
        background: '#0f2e1a',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        // Mobile: slide in/out
        position: window.innerWidth < 768 ? 'fixed' : 'relative',
        top: 0, left: 0, bottom: 0,
        zIndex: 50,
        transform: window.innerWidth < 768 ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        transition: 'transform 0.25s ease',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#2d7a45,#1a5c30)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(45,122,69,0.4)' }}>
                <Leaf size={15} color="#a8e6be" />
              </div>
              <div>
                <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: -0.3, lineHeight: 1 }}>SmartSeason</p>
                <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>Field Management</p>
              </div>
            </div>
            {/* Close button on mobile */}
            <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 2, display: window.innerWidth < 768 ? 'flex' : 'none' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
          {(['menu', 'reports', 'system'] as const).map(section => (
            <div key={section} style={{ marginBottom: 4 }}>
              <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.2, padding: '10px 8px 5px', fontWeight: 600 }}>
                {section}
              </p>
              {NAV_ITEMS.filter(i => i.section === section).map(({ id, label, icon: Icon }) => {
                const isActive = activePage === id;
                const badge = id === 'fields' ? fields.length : id === 'agents' ? agentCount : undefined;
                return (
                  <button
                    key={id}
                    onClick={() => handleNav(id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                      padding: '8px 10px', borderRadius: 8, marginBottom: 2,
                      background: isActive ? 'rgba(45,122,69,0.9)' : 'transparent',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                      fontSize: 13, fontWeight: isActive ? 600 : 400,
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      fontFamily: "'DM Sans', sans-serif",
                      transition: 'all 0.15s',
                      boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = isActive ? '#fff' : 'rgba(255,255,255,0.75)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isActive ? '#fff' : 'rgba(255,255,255,0.45)'; }}
                  >
                    <Icon size={15} />
                    <span style={{ flex: 1 }}>{label}</span>
                    {badge !== undefined && (
                      <span style={{ background: isActive ? 'rgba(255,255,255,0.2)' : '#e85d3a', color: '#fff', fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 10, minWidth: 18, textAlign: 'center' }}>
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: '10px 10px 14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', marginBottom: 4 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#2d7a45,#1a5c30)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#a8e6be', fontWeight: 700, flexShrink: 0 }}>
              {user?.full_name ? initials(user.full_name) : 'A'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 12, color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.full_name || 'Admin User'}
              </p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Administrator</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, color: 'rgba(255,100,80,0.7)', fontSize: 12.5, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,60,0.1)'; e.currentTarget.style.color = '#ff6e5a'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,100,80,0.7)'; }}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* ── TOPBAR ── */}
        <header style={{ background: '#fff', borderBottom: '1px solid #eaeceb', padding: '0 20px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Hamburger on mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 4, display: 'flex', alignItems: 'center' }}
              className="md:hidden"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: '#111', lineHeight: 1 }}>Dashboard</h1>
              <p style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Notification bell */}
            <button style={{ position: 'relative', width: 34, height: 34, borderRadius: 8, background: '#f5f6f4', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
              <Bell size={15} />
              {atRisk > 0 && (
                <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: '#e85d3a', border: '1.5px solid #fff' }} />
              )}
            </button>
            <button
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 8, background: '#f5f6f4', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', color: '#555', fontFamily: "'DM Sans', sans-serif" }}
            >
              <Download size={12} />
              <span style={{ display: window.innerWidth < 480 ? 'none' : 'inline' }}>Export</span>
            </button>
            <button
              onClick={() => onNavigate('fields')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 8, background: '#1d6b35', color: '#fff', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
            >
              <Plus size={12} />
              <span style={{ display: window.innerWidth < 480 ? 'none' : 'inline' }}>Add Field</span>
            </button>
          </div>
        </header>

        {/* ── SCROLLABLE BODY ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── STAT CARDS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {STAT_CARDS.map(({ label, value, icon, iconBg, iconColor, trend, trendUp }) => (
              <div
                key={label}
                style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #eaeceb', transition: 'transform 0.18s, box-shadow 0.18s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.07)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor }}>
                    {icon}
                  </div>
                </div>
                <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700, color: '#111', lineHeight: 1, marginBottom: 6 }}>{value}</p>
                <p style={{ fontSize: 11, color: trendUp === true ? '#16a34a' : trendUp === false ? '#e85d3a' : '#999' }}>
                  {trendUp === true ? '↑ ' : trendUp === false ? '↓ ' : ''}{trend}
                </p>
              </div>
            ))}
          </div>

          {/* ── MIDDLE ROW: Fields table + Stage chart ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(200px,1fr)', gap: 12 }}>

            {/* Fields Table */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eaeceb', display: 'flex', flexDirection: 'column', minHeight: 280, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #f0f2ee' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <MapPin size={14} color="#1d6b35" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>All Fields</span>
                  <span style={{ fontSize: 11, background: '#f0f2ee', color: '#666', padding: '1px 7px', borderRadius: 10, fontWeight: 500 }}>{fields.length}</span>
                </div>
                <button onClick={() => onNavigate('fields')} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#1d6b35', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Manage <ChevronRight size={13} />
                </button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {fields.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', fontSize: 12, color: '#bbb' }}>
                    <MapPin size={28} style={{ opacity: 0.2, margin: '0 auto 8px', display: 'block' }} />
                    No fields yet
                  </div>
                ) : fields.map((field, idx) => (
                  <button
                    key={field.id}
                    onClick={() => onNavigate('field-detail', String(field.id))}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                      borderBottom: idx < fields.length - 1 ? '1px solid #f8f9f7' : 'none',
                      background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                      fontFamily: "'DM Sans', sans-serif", transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafbf9'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f0f7f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MapPin size={14} color="#1d6b35" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{field.name}</p>
                      <p style={{ fontSize: 11, color: '#999', marginTop: 1 }}>{field.crop_type}{field.location ? ` · ${field.location}` : ''}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      <StageBadge stage={field.current_stage} />
                      <StatusBadge status={field.status} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right column — Stage chart + agents */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Stage Distribution */}
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eaeceb', padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <TrendingUp size={14} color="#1d6b35" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Stage Distribution</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <DonutChart data={stageBreakdown} total={stageTotal} colors={STAGE_COLORS} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {Object.entries(stageBreakdown).map(([stage, count]) => (
                    <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#555' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: STAGE_COLORS[stage], flexShrink: 0 }} />
                      <span style={{ textTransform: 'capitalize' }}>{stage}</span>
                      <span style={{ fontWeight: 600, color: '#111', marginLeft: 'auto' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Agents */}
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eaeceb', padding: 16, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users size={14} color="#1d6b35" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Agents</span>
                  </div>
                  <button onClick={() => onNavigate('agents')} style={{ fontSize: 11.5, color: '#1d6b35', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                    View all
                  </button>
                </div>
                {agentList.length === 0 ? (
                  <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', padding: '8px 0' }}>No agents yet.</p>
                ) : agentList.slice(0, 5).map((agent, idx) => {
                  const col = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  return (
                    <div key={agent.user_id} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: idx < agentList.length - 1 ? 10 : 0 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: col.bg, color: col.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, flexShrink: 0 }}>
                        {initials(agent.full_name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12.5, fontWeight: 500, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.full_name}</p>
                        <p style={{ fontSize: 10.5, color: '#999' }}>Field Agent</p>
                      </div>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── RECENT ACTIVITY ── */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eaeceb', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #f0f2ee' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Activity size={14} color="#1d6b35" />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Recent Activity</span>
              </div>
              <button style={{ fontSize: 12, color: '#1d6b35', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                View all
              </button>
            </div>
            {recentUpdates.length === 0 ? (
              <div style={{ padding: 28, textAlign: 'center', fontSize: 12, color: '#bbb' }}>No activity recorded yet.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {recentUpdates.slice(0, 6).map((update, idx) => (
                  <div
                    key={update.id}
                    style={{ display: 'flex', gap: 10, padding: '12px 16px', borderBottom: '1px solid #f8f9f7', borderRight: '1px solid #f8f9f7' }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: update.status === 'at_risk' ? '#e85d3a' : '#22c55e', flexShrink: 0, marginTop: 5 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: '#333', lineHeight: 1.5 }}>
                        <strong style={{ color: '#1d6b35' }}>{update.agent_name}</strong>
                        {' updated '}
                        <span style={{ fontWeight: 500 }}>{update.field_name}</span>
                        {' → '}
                        <span style={{ textTransform: 'capitalize', fontWeight: 500, color: '#555' }}>{update.stage}</span>
                      </p>
                      {update.notes && (
                        <p style={{ fontSize: 11, color: '#bbb', marginTop: 3, fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>"{update.notes}"</p>
                      )}
                      <p style={{ fontSize: 10.5, color: '#bbb', marginTop: 3 }}>{timeAgo(update.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Donut Chart (pure SVG) ── */
function DonutChart({ data, total, colors }: { data: Record<string, number>; total: number; colors: Record<string, string> }) {
  const cx = 55, cy = 55, r = 44, ir = 30;
  let startAngle = -Math.PI / 2;
  const slices = Object.entries(data).map(([key, val]) => {
    const angle = total ? (val / total) * Math.PI * 2 : 0;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(startAngle + angle);
    const y2 = cy + r * Math.sin(startAngle + angle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    startAngle += angle;
    return { key, path, color: colors[key] };
  });

  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      {total === 0
        ? <circle cx={cx} cy={cy} r={r} fill="#f0f2ee" />
        : slices.map(s => <path key={s.key} d={s.path} fill={s.color} />)
      }
      <circle cx={cx} cy={cy} r={ir} fill="#fff" />
      <text x={cx} y={cy - 5} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, fill: '#111' }}>{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fill: '#999' }}>fields</text>
    </svg>
  );
}