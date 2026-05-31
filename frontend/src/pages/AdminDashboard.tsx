import { useEffect, useState } from 'react';
import {
  Leaf, LayoutDashboard, MapPin, Users, AlertTriangle,
  CheckCircle2, Activity, TrendingUp, BarChart2,
  FileText, Settings, HelpCircle, LogOut, Download, Plus
} from 'lucide-react';
import API from "../api/api.ts";

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

export function AdminDashboard({ onNavigate, onLogout, user }: Props) {
  const [fields, setFields]             = useState<FieldWithStatus[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<EnrichedUpdate[]>([]);
  const [agentList, setAgentList]       = useState<Profile[]>([]);
  const [agentCount, setAgentCount]     = useState(0);
  const [loading, setLoading]           = useState(true);
  const [activePage, setActivePage]     = useState('dashboard');

  useEffect(() => {
    async function load() {
      try {
        const [fieldsRes, updatesRes, agentsRes] = await Promise.all([
          API.get('fields/'),
          API.get('field-updates/'),
          API.get('agents/'),
        ]);

        const rawFields: Field[]   = fieldsRes.data;
        const allUpdates: any[]    = updatesRes.data;
        const agents: Profile[]    = agentsRes.data;

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
      <div className="flex items-center justify-center h-screen bg-[#eef0eb]">
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

  const stageTotal  = Object.values(stageBreakdown).reduce((a, b) => a + b, 0);
  const stageColors: Record<string, string> = {
    planted:  '#e8a020',
    growing:  '#1a5ac2',
    ready:    '#2d7a45',
    harvested:'#888888',
  };

  const initials = (name: string) =>
    name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  const avatarColors = [
    { bg: '#e8f0fb', color: '#1a5ac2' },
    { bg: '#e8f5ee', color: '#1d6b35' },
    { bg: '#fef3e2', color: '#b56c10' },
    { bg: '#fde8e4', color: '#c0392b' },
    { bg: '#f0f2ee', color: '#555555' },
  ];

  function handleNav(id: string) {
    setActivePage(id);
    if (['dashboard', 'fields', 'agents'].includes(id)) {
      onNavigate(id);
    }
  }

  // ---------- RENDER ----------
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: '#eef0eb', fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── SIDEBAR ── */}
      <aside
        className="flex flex-col flex-shrink-0"
        style={{
          width: 200,
          margin: 12,
          background: '#0f2e1a',
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '18px 16px 16px', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2">
            <div style={{ width: 28, height: 28, background: '#2d7a45', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={15} color="#a8e6be" />
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: -0.3 }}>
              SmartSeason
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto" style={{ padding: '12px 8px' }}>
          {(['menu', 'reports', 'system'] as const).map(section => (
            <div key={section}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, padding: '12px 8px 6px', fontWeight: 500 }}>
                {section}
              </p>
              {NAV_ITEMS.filter(i => i.section === section).map(({ id, label, icon: Icon }) => {
                const isActive = activePage === id;
                const badge = id === 'fields' ? fields.length : id === 'agents' ? agentCount : undefined;
                return (
                  <button
                    key={id}
                    onClick={() => handleNav(id)}
                    className="w-full flex items-center gap-2 text-left"
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      marginBottom: 1,
                      background: isActive ? '#2d7a45' : 'transparent',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                      fontSize: 12.5,
                      fontWeight: isActive ? 500 : 400,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    <Icon size={15} />
                    <span className="flex-1">{label}</span>
                    {badge !== undefined && (
                      <span style={{ background: '#e85d3a', color: '#fff', fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 10 }}>
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
        <div style={{ padding: '10px 8px', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2" style={{ padding: '8px 10px', marginBottom: 2 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2d7a45', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#a8e6be', fontWeight: 600, flexShrink: 0 }}>
              {user?.full_name ? initials(user.full_name) : 'A'}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12, color: '#fff', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.full_name || 'Admin User'}
              </p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Administrator</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2"
            style={{ padding: '8px 10px', borderRadius: 8, color: 'rgba(255,100,80,0.75)', fontSize: 12.5, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif', transition: 'background 0.15s'" }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,80,60,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ padding: '12px 12px 12px 0' }}>

        {/* Topbar */}
        <div
          className="flex items-center justify-between flex-shrink-0"
          style={{ background: '#fff', borderRadius: 12, padding: '0 18px', height: 52, marginBottom: 10 }}
        >
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: '#111' }}>
              Overview Dashboard
            </h1>
            <p style={{ fontSize: 11, color: '#888', marginTop: 1 }}>Monitor all fields and agent activity</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 7, background: '#fff', border: '0.5px solid #ddd', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
            >
              <Download size={12} /> Export
            </button>
            <button
              onClick={() => onNavigate('fields')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 7, background: '#1d6b35', color: '#fff', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
            >
              <Plus size={12} /> Add Field
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-2 flex-shrink-0" style={{ marginBottom: 10 }}>
          {[
            {
              label: 'Total Fields', value: fields.length,
              icon: <MapPin size={14} color="#1d6b35" />,
              bg: '#fff', labelColor: '#888', valueColor: '#111',
              iconBg: '#e8f5ee', trend: '↑ 2 from last season', trendColor: '#2d7a45',
            },
            {
              label: 'Field Agents', value: agentCount,
              icon: <Users size={14} color="#1a5ac2" />,
              bg: '#fff', labelColor: '#888', valueColor: '#111',
              iconBg: '#e8f0fb', trend: `${agentCount > 0 ? agentCount - 1 : 0} currently active`, trendColor: '#888',
            },
            {
              label: 'At Risk', value: atRisk,
              icon: <AlertTriangle size={14} color="#b56c10" />,
              bg: '#fff', labelColor: '#888', valueColor: '#b56c10',
              iconBg: '#fef3e2', trend: atRisk > 0 ? 'Needs attention' : 'All clear', trendColor: atRisk > 0 ? '#e85d3a' : '#2d7a45',
            },
            {
              label: 'Completed', value: completed,
              icon: <CheckCircle2 size={14} color="#555" />,
              bg: '#fff', labelColor: '#888', valueColor: '#111',
              iconBg: '#f0f2ee', trend: 'Ready to harvest', trendColor: '#888',
            },
          ].map(({ label, value, icon, bg, labelColor, valueColor, iconBg, trend, trendColor }) => (
            <div
              key={label}
              style={{ background: bg, borderRadius: 12, padding: '12px 14px', cursor: 'pointer', transition: 'transform 0.18s ease, box-shadow 0.18s ease' }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.background = '#1d6b35';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(29,107,53,0.25)';
                // flip all text/icon colours to white
                e.currentTarget.querySelectorAll('span, p').forEach((el: any) => {
                  el.style.color = 'rgba(255,255,255,0.9)';
                });
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = bg;
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.querySelectorAll('span, p').forEach((el: any) => {
                  el.style.color = '';
                });
              }}
            >
              <div className="flex justify-between items-start" style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 500, color: labelColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
              </div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700, color: valueColor, lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: 10, color: trendColor, marginTop: 5 }}>{trend}</p>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="flex gap-2 flex-1 min-h-0">

          {/* Left Column */}
          <div className="flex flex-col gap-2 flex-1 min-h-0">

            {/* Fields Table */}
            <div className="flex flex-col" style={{ flex: 2, minHeight: 0, background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
              <div className="flex items-center justify-between flex-shrink-0" style={{ padding: '11px 14px', borderBottom: '0.5px solid #f0f2ee' }}>
                <span className="flex items-center gap-1" style={{ fontSize: 12.5, fontWeight: 600, color: '#111' }}>
                  <MapPin size={14} color="#1d6b35" /> All Fields
                </span>
                <button onClick={() => onNavigate('fields')} style={{ fontSize: 11.5, color: '#1d6b35', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Manage fields →
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                {fields.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: '#aaa' }}>No fields yet.</div>
                )}
                {fields.map((field, idx) => (
                  <button
                    key={field.id}
                    onClick={() => onNavigate('field-detail', String(field.id))}
                    className="w-full flex items-center text-left"
                    style={{ gap: 9, padding: '8px 14px', borderBottom: idx < fields.length - 1 ? '0.5px solid #f5f6f4' : 'none', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafbf9')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ width: 20, height: 20, borderRadius: 5, background: '#f0f2ee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#666', flexShrink: 0 }}>
                      {field.name?.charAt(field.name.length - 1) || idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 12.5, fontWeight: 500, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{field.name}</p>
                      <p style={{ fontSize: 10.5, color: '#888', marginTop: 1 }}>
                        {field.crop_type}{field.location ? ` · ${field.location}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <StageBadge stage={field.current_stage} />
                      <StatusBadge status={field.status} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="flex flex-col" style={{ flex: 1, minHeight: 0, background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
              <div className="flex items-center justify-between flex-shrink-0" style={{ padding: '11px 14px', borderBottom: '0.5px solid #f0f2ee' }}>
                <span className="flex items-center gap-1" style={{ fontSize: 12.5, fontWeight: 600, color: '#111' }}>
                  <Activity size={14} color="#1d6b35" /> Recent Activity
                </span>
                <button style={{ fontSize: 11.5, color: '#1d6b35', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  View all →
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                {recentUpdates.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: '#aaa' }}>No updates recorded yet.</div>
                )}
                {recentUpdates.slice(0, 5).map((update, idx) => (
                  <div key={update.id} className="flex items-start gap-2" style={{ padding: '8px 14px', borderBottom: idx < recentUpdates.length - 1 ? '0.5px solid #f5f6f4' : 'none' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: update.status === 'at_risk' ? '#e85d3a' : '#1d6b35', flexShrink: 0, marginTop: 4 }} />
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 11.5, color: '#111', lineHeight: 1.4 }}>
                        <strong style={{ color: '#1d6b35' }}>{update.agent_name}</strong>{' '}
                        updated {update.field_name} to{' '}
                        <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{update.stage}</span>
                      </p>
                      {update.notes && (
                        <p style={{ fontSize: 10.5, color: '#aaa', marginTop: 2, fontStyle: 'italic' }}>"{update.notes}"</p>
                      )}
                    </div>
                    <p style={{ fontSize: 10, color: '#aaa', flexShrink: 0, marginTop: 2 }}>
                      {new Date(update.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-2 flex-shrink-0" style={{ width: 260 }}>

            {/* Stage Distribution */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 18 }}>
              <p className="flex items-center gap-1" style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 10 }}>
                <TrendingUp size={14} color="#1d6b35" /> Stage Distribution
              </p>
              {/* Donut via SVG */}
              <div className="flex justify-center items-center" style={{ margin: '4px 0 10px' }}>
                <DonutChart data={stageBreakdown} total={stageTotal} colors={stageColors} />
              </div>
              <div className="grid grid-cols-2" style={{ gap: 5 }}>
                {Object.entries(stageBreakdown).map(([stage, count]) => (
                  <div key={stage} className="flex items-center gap-1" style={{ fontSize: 10.5, color: '#555' }}>
                    <div style={{ width: 7, height: 7, borderRadius: 2, background: stageColors[stage], flexShrink: 0 }} />
                    {stage.charAt(0).toUpperCase() + stage.slice(1)} ({count})
                  </div>
                ))}
              </div>
            </div>

            {/* Active Agents */}
            <div className="flex-1 overflow-hidden" style={{ background: '#fff', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column' }}>
              <p className="flex items-center gap-1 flex-shrink-0" style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 10 }}>
                <Users size={14} color="#1d6b35" /> Active Agents
              </p>
              <div className="overflow-y-auto flex-1">
                {agentList.length === 0 && (
                  <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 8 }}>No agents yet.</p>
                )}
                {agentList.map((agent, idx) => {
                  const col = avatarColors[idx % avatarColors.length];
                  return (
                    <div key={agent.user_id} className="flex items-center gap-2" style={{ marginBottom: idx < agentList.length - 1 ? 9 : 0 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: col.bg, color: col.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                        {initials(agent.full_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: 12, fontWeight: 500, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.full_name}</p>
                        <p style={{ fontSize: 10, color: '#888' }}>{agent.role || 'Field Agent'}</p>
                      </div>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2d7a45', flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Donut Chart (pure SVG, no lib needed) ── */
function DonutChart({ data, total, colors }: { data: Record<string, number>; total: number; colors: Record<string, string> }) {
  const cx = 55, cy = 55, r = 44, ir = 28;
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
      <text x={cx} y={cy - 5} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, fill: '#111' }}>{total}</text>
      <text x={cx} y={cy + 9} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fill: '#888' }}>fields</text>
    </svg>
  );
}