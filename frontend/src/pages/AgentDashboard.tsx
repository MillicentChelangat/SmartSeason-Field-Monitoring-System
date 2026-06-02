import { useEffect, useState } from 'react';
import {
  MapPin, CheckCircle2, AlertTriangle, Activity,
  Plus, ChevronRight, Clock, Layers
} from 'lucide-react';
import API from '../api/api';
import type { Field, FieldUpdate } from '../types/database';
import { computeFieldStatus } from '../lib/fieldStatus';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AgentShell } from '../components/AgentShell';


interface FieldWithStatus extends Field {
  status: ReturnType<typeof computeFieldStatus>;
  lastUpdate?: FieldUpdate | null;
}

interface Props {
  onNavigate: (page: string, fieldId?: string) => void;
  onLogout: () => void;
  user: any;
}

const STAGE_STEPS = ['planted', 'growing', 'ready', 'harvested'];

const STAGE_COLORS: Record<string, string> = {
  planted:   '#e8a020',
  growing:   '#1a5ac2',
  ready:     '#2d7a45',
  harvested: '#888',
};

const STAT_HOVER_BG = '#1d6b35';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0)  return `${hrs}h ago`;
  return `${mins}m ago`;
}

function StageProgressBar({ stage }: { stage: string }) {
  const idx = STAGE_STEPS.indexOf(stage);
  return (
    <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
      {STAGE_STEPS.map((s, i) => (
        <div
          key={s}
          style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i <= idx ? STAGE_COLORS[s] : '#f0f2ee',
            transition: 'background 0.2s',
          }}
        />
      ))}
    </div>
  );
}

export function AgentDashboard({ onNavigate, onLogout, user }: Props) {
  const [fields, setFields]               = useState<FieldWithStatus[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<FieldUpdate[]>([]);
  const [loading, setLoading]             = useState(true);
  const [showQuickUpdate, setShowQuickUpdate] = useState(false);
  const [selectedField, setSelectedField] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('access');
        const headers = { Authorization: `Bearer ${token}` };
        const [fieldsRes, updatesRes] = await Promise.all([
          API.get('agent/fields/', { headers }),
          API.get('agent/updates/', { headers }),
        ]);
        const rawFields: Field[]     = fieldsRes.data;
        const updates: FieldUpdate[] = updatesRes.data;
        const enriched: FieldWithStatus[] = rawFields.map(field => {
          const fieldUpdates = updates.filter(u => u.field_id === field.id);
          const lastUpdate   = fieldUpdates[0] ?? null;
          return { ...field, status: computeFieldStatus(field, lastUpdate), lastUpdate };
        });
        setFields(enriched);
        setRecentUpdates(updates.slice(0, 8));
      } catch (error) {
        console.error('Failed to load agent dashboard:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#eef0eb' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const active    = fields.filter(f => f.status === 'active').length;
  const atRisk    = fields.filter(f => f.status === 'at_risk').length;
  const completed = fields.filter(f => f.status === 'completed').length;
  const atRiskFields = fields.filter(f => f.status === 'at_risk');

  const statCards = [
    { label: 'My Fields',  value: fields.length, icon: <MapPin size={14} color="#1d6b35" />,        iconBg: '#e8f5ee', valueColor: '#111', trend: 'total assigned',     trendColor: '#888' },
    { label: 'Active',     value: active,         icon: <Activity size={14} color="#1a5ac2" />,      iconBg: '#e8f0fb', valueColor: '#111', trend: 'in progress',        trendColor: '#888' },
    { label: 'At Risk',    value: atRisk,         icon: <AlertTriangle size={14} color="#b56c10" />, iconBg: '#fef3e2', valueColor: atRisk > 0 ? '#b56c10' : '#111', trend: atRisk > 0 ? 'needs attention' : 'all clear', trendColor: atRisk > 0 ? '#e85d3a' : '#2d7a45' },
    { label: 'Completed',  value: completed,      icon: <CheckCircle2 size={14} color="#555" />,     iconBg: '#f0f2ee', valueColor: '#111', trend: 'harvested',          trendColor: '#888' },
  ];

  return (
    <AgentShell activePage="dashboard" onNavigate={onNavigate} onLogout={onLogout} user={user}>

      {/* Topbar */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '0 18px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, marginBottom: 10 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: '#111' }}>
            Welcome back, {user?.full_name?.split(' ')[0] || 'Agent'} 👋
          </h1>
          <p style={{ fontSize: 11, color: '#888', marginTop: 1 }}>Here's what's happening with your fields today</p>
        </div>
        <button
          onClick={() => setShowQuickUpdate(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, background: '#1d6b35', color: '#fff', border: 'none', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 2px 8px rgba(29,107,53,0.3)' }}
        >
          <Plus size={14} /> Add Update
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, flexShrink: 0, marginBottom: 10 }}>
        {statCards.map(({ label, value, icon, iconBg, valueColor, trend, trendColor }) => (
          <div
            key={label}
            style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', cursor: 'pointer', transition: 'transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease' }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.background = STAT_HOVER_BG;
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(29,107,53,0.25)';
              e.currentTarget.querySelectorAll('span, p').forEach((el: any) => { el.style.color = 'rgba(255,255,255,0.9)'; });
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.querySelectorAll('span, p').forEach((el: any) => { el.style.color = ''; });
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
            </div>
            <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700, color: valueColor, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 10, color: trendColor, marginTop: 5 }}>{trend}</p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ flex: 1, display: 'flex', gap: 10, minHeight: 0 }}>

        {/* Left col — fields + at risk */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>

          {/* My Fields with stage progress */}
          <div style={{ flex: 2, background: '#fff', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '0.5px solid #f0f2ee', flexShrink: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: '#111' }}>
                <MapPin size={14} color="#1d6b35" /> My Fields
              </span>
              <button onClick={() => onNavigate('my-fields')} style={{ fontSize: 11.5, color: '#1d6b35', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 3 }}>
                View all <ChevronRight size={12} />
              </button>
            </div>

            {fields.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#aaa', gap: 6 }}>
                <MapPin size={28} style={{ opacity: 0.2 }} />
                <p style={{ fontSize: 12 }}>No fields assigned yet.</p>
              </div>
            ) : (
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {fields.slice(0, 6).map((field, idx) => {
                  const stageIdx = STAGE_STEPS.indexOf(field.current_stage);
                  return (
                    <button
                      key={field.id}
                      onClick={() => onNavigate('field-detail', String(field.id))}
                      style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 16px', borderBottom: idx < Math.min(fields.length, 6) - 1 ? '0.5px solid #f5f6f4' : 'none', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fbf9')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Stage colour indicator */}
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: `${STAGE_COLORS[field.current_stage]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        <Layers size={15} color={STAGE_COLORS[field.current_stage]} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{field.name}</p>
                          <StatusBadge status={field.status} />
                        </div>
                        <p style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
                          {field.crop_type}{field.location ? ` · ${field.location}` : ''}
                        </p>
                        {/* Stage progress bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, display: 'flex', gap: 3 }}>
                            {STAGE_STEPS.map((s, i) => (
                              <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= stageIdx ? STAGE_COLORS[s] : '#f0f2ee', transition: 'background 0.2s' }} />
                            ))}
                          </div>
                          <span style={{ fontSize: 10, color: STAGE_COLORS[field.current_stage], fontWeight: 600, textTransform: 'capitalize', flexShrink: 0 }}>{field.current_stage}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* At Risk Alert Panel */}
          <div style={{ flex: 1, background: '#fff', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '0.5px solid #f0f2ee', flexShrink: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: '#111' }}>
                <AlertTriangle size={14} color="#e85d3a" /> At-Risk Fields
                {atRiskFields.length > 0 && (
                  <span style={{ background: '#fde8e4', color: '#e85d3a', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10 }}>
                    {atRiskFields.length}
                  </span>
                )}
              </span>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {atRiskFields.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 6 }}>
                  <CheckCircle2 size={24} color="#2d7a45" style={{ opacity: 0.4 }} />
                  <p style={{ fontSize: 12, color: '#aaa' }}>All fields are healthy!</p>
                </div>
              ) : (
                atRiskFields.map((field, idx) => (
                  <button
                    key={field.id}
                    onClick={() => onNavigate('field-detail', String(field.id))}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: idx < atRiskFields.length - 1 ? '0.5px solid #f5f6f4' : 'none', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fff8f7')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fde8e4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <AlertTriangle size={15} color="#e85d3a" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: '#111' }}>{field.name}</p>
                      <p style={{ fontSize: 11, color: '#888' }}>{field.crop_type} · {field.current_stage}</p>
                    </div>
                    <div style={{ display: 'flex', flex: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{ fontSize: 10.5, color: '#e85d3a', fontWeight: 600, background: '#fde8e4', padding: '2px 8px', borderRadius: 5 }}>At Risk</span>
                    </div>
                    <ChevronRight size={13} color="#ccc" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right col — recent updates */}
        <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Recent Updates timeline */}
          <div style={{ flex: 1, background: '#fff', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '11px 16px', borderBottom: '0.5px solid #f0f2ee', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} color="#1d6b35" />
              <p style={{ fontSize: 12.5, fontWeight: 600, color: '#111' }}>My Recent Updates</p>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '10px 16px' }}>
              {recentUpdates.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 6, color: '#aaa' }}>
                  <Activity size={24} style={{ opacity: 0.2 }} />
                  <p style={{ fontSize: 12 }}>No updates yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {recentUpdates.map((update, idx) => (
                    <div key={update.id} style={{ display: 'flex', gap: 10, paddingBottom: idx < recentUpdates.length - 1 ? 14 : 0 }}>
                      {/* Timeline dot + line */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: STAGE_COLORS[update.stage] ?? '#888', marginTop: 3, flexShrink: 0 }} />
                        {idx < recentUpdates.length - 1 && (
                          <div style={{ width: 1.5, flex: 1, background: '#f0f2ee', marginTop: 3 }} />
                        )}
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, paddingBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>
                            {fields.find(f => f.id === update.field_id)?.name ?? `Field #${update.field_id}`}
                          </p>
                          <span style={{ fontSize: 10, color: '#aaa' }}>{timeAgo(update.created_at)}</span>
                        </div>
                        <StageBadge stage={update.stage} />
                        {update.notes && (
                          <p style={{ fontSize: 11, color: '#888', fontStyle: 'italic', marginTop: 4, lineHeight: 1.4 }}>"{update.notes}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick stats summary */}
          <div style={{ background: '#0f2e1a', borderRadius: 12, padding: 16, flexShrink: 0 }}>
            <p style={{ fontSize: 11.5, fontWeight: 600, color: 'rgba(168,230,190,0.8)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Activity size={13} color="#a8e6be" /> Season Summary
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Total Updates Submitted', value: recentUpdates.length },
                { label: 'Fields in Progress',      value: active },
                { label: 'Fields Completed',        value: completed },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Update Modal */}
      {showQuickUpdate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: '#111' }}>Quick Field Update</h2>
              <button onClick={() => setShowQuickUpdate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 18 }}>✕</button>
            </div>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>Select a field to add a full update.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {fields.map(field => (
                <button
                  key={field.id}
                  onClick={() => { setShowQuickUpdate(false); onNavigate('field-detail', String(field.id)); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 9, border: '0.5px solid #e8eae4', background: '#fff', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fbf9')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${STAGE_COLORS[field.current_stage]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={14} color={STAGE_COLORS[field.current_stage]} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{field.name}</p>
                    <p style={{ fontSize: 11, color: '#888' }}>{field.crop_type} · {field.current_stage}</p>
                  </div>
                  <ChevronRight size={13} color="#ccc" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </AgentShell>
  );
}