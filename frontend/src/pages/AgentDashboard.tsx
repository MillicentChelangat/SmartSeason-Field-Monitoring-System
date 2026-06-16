import { useEffect, useState } from 'react';
import {
  MapPin, CheckCircle2, AlertTriangle, Activity,
  Plus, ChevronRight, Clock, Layers, X
} from 'lucide-react';
import API from '../api/api';
import type { Field, FieldUpdate } from '../types/database';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AgentShell } from '../components/AgentShell';

interface FieldWithStatus extends Field {
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

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0)  return `${hrs}h ago`;
  return `${mins}m ago`;
}

export function AgentDashboard({ onNavigate, onLogout, user }: Props) {
  const [fields, setFields]               = useState<FieldWithStatus[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<FieldUpdate[]>([]);
  const [loading, setLoading]             = useState(true);
  const [showQuickUpdate, setShowQuickUpdate] = useState(false);

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
        return { ...field, lastUpdate, assignedAgents: [] };        });
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
      <div className="flex items-center justify-center h-screen bg-[#eef0eb]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const active    = fields.filter(f => f.status === 'healthy' || f.status === 'monitor').length;
  const atRisk    = fields.filter(f => f.status === 'at_risk' || f.status === 'critical').length;
  const completed = fields.filter(f => f.current_stage === 'harvested').length;
  const atRiskFields = fields.filter(f => f.status === 'at_risk' || f.status === 'critical');

  const statCards = [
    { label: 'My Fields',  value: fields.length, icon: <MapPin size={14} color="#1d6b35" />,        iconBg: '#e8f5ee', valueColor: '#111', trend: 'total assigned',     trendColor: '#888' },
    { label: 'Active',     value: active,         icon: <Activity size={14} color="#1a5ac2" />,      iconBg: '#e8f0fb', valueColor: '#111', trend: 'in progress',        trendColor: '#888' },
    { label: 'At Risk',    value: atRisk,         icon: <AlertTriangle size={14} color="#b56c10" />, iconBg: '#fef3e2', valueColor: atRisk > 0 ? '#b56c10' : '#111', trend: atRisk > 0 ? 'needs attention' : 'all clear', trendColor: atRisk > 0 ? '#e85d3a' : '#2d7a45' },
    { label: 'Completed',  value: completed,      icon: <CheckCircle2 size={14} color="#555" />,     iconBg: '#f0f2ee', valueColor: '#111', trend: 'harvested',          trendColor: '#888' },
  ];

  return (
    <AgentShell activePage="dashboard" onNavigate={onNavigate} onLogout={onLogout} user={user}>
      {/* Scrollable page wrapper */}
      <div className="h-full overflow-y-auto">
        <div className="p-3 lg:p-0 flex flex-col gap-3">

          {/* ── Topbar ── */}
          <div className="bg-white rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="min-w-0">
              <h1 className="font-bold text-[#111] truncate" style={{ fontFamily: "'Syne', sans-serif", fontSize: 16 }}>
                Welcome back, {user?.full_name?.split(' ')[0] || 'Agent'} 👋
              </h1>
              <p className="text-[11px] text-[#888] mt-0.5 hidden sm:block">Here's what's happening with your fields today</p>
            </div>
            <button
              onClick={() => setShowQuickUpdate(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-[12.5px] font-semibold flex-shrink-0"
              style={{ background: '#1d6b35', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 2px 8px rgba(29,107,53,0.3)' }}
            >
              <Plus size={14} />
              <span>Add Update</span>
            </button>
          </div>

          {/* ── Stat Cards — 2×2 on mobile, 4×1 on desktop ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 flex-shrink-0">
            {statCards.map(({ label, value, icon, iconBg, valueColor, trend, trendColor }) => (
              <div
                key={label}
                className="bg-white rounded-xl p-3 lg:p-3.5 cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-medium text-[#888] uppercase tracking-wide">{label}</span>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
                    {icon}
                  </div>
                </div>
                <p className="font-bold leading-none mb-1.5" style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, color: valueColor }}>{value}</p>
                <p className="text-[10px]" style={{ color: trendColor }}>{trend}</p>
              </div>
            ))}
          </div>

          {/* ── Main content — stacked on mobile, side-by-side on desktop ── */}
          <div className="flex flex-col lg:flex-row gap-3 lg:min-h-0">

            {/* Left column */}
            <div className="flex flex-col gap-3 flex-1 lg:min-h-0">

              {/* My Fields */}
              <div className="bg-white rounded-xl overflow-hidden flex flex-col lg:flex-2 lg:min-h-0" style={{ minHeight: 220 }}>
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#f0f2ee] flex-shrink-0">
                  <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#111]">
                    <MapPin size={14} color="#1d6b35" /> My Fields
                  </span>
                  <button
                    onClick={() => onNavigate('my-fields')}
                    className="flex items-center gap-1 text-[11.5px] font-medium bg-none border-none cursor-pointer"
                    style={{ color: '#1d6b35', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    View all <ChevronRight size={12} />
                  </button>
                </div>

                {fields.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 gap-1.5 text-[#aaa] py-10">
                    <MapPin size={28} style={{ opacity: 0.2 }} />
                    <p className="text-xs">No fields assigned yet.</p>
                  </div>
                ) : (
                  <div className="overflow-y-auto lg:flex-1">
                    {fields.slice(0, 6).map((field, idx) => {
                      const stageIdx = STAGE_STEPS.indexOf(field.current_stage);
                      return (
                        <button
                          key={field.id}
                          onClick={() => onNavigate('field-detail', String(field.id))}
                          className="w-full flex items-start gap-3 px-4 py-2.5 bg-transparent border-none cursor-pointer text-left transition-colors duration-100 hover:bg-[#f8fbf9]"
                          style={{ borderBottom: idx < Math.min(fields.length, 6) - 1 ? '0.5px solid #f5f6f4' : 'none', fontFamily: "'DM Sans', sans-serif" }}
                        >
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: `${STAGE_COLORS[field.current_stage]}18` }}
                          >
                            <Layers size={15} color={STAGE_COLORS[field.current_stage]} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5 gap-2">
                              <p className="text-[13px] font-semibold text-[#111] truncate">{field.name}</p>
                              <StatusBadge status={field.status} />
                            </div>
                            <p className="text-[11px] text-[#888] mb-1.5">
                              {field.crop_type}{field.location ? ` · ${field.location}` : ''}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 flex gap-0.5">
                                {STAGE_STEPS.map((s, i) => (
                                  <div
                                    key={s}
                                    className="flex-1 h-1 rounded-sm transition-colors duration-200"
                                    style={{ background: i <= stageIdx ? STAGE_COLORS[s] : '#f0f2ee' }}
                                  />
                                ))}
                              </div>
                              <span
                                className="text-[10px] font-semibold capitalize flex-shrink-0"
                                style={{ color: STAGE_COLORS[field.current_stage] }}
                              >
                                {field.current_stage}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* At-Risk Fields */}
              <div className="bg-white rounded-xl overflow-hidden flex flex-col" style={{ minHeight: 140 }}>
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#f0f2ee] flex-shrink-0">
                  <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#111]">
                    <AlertTriangle size={14} color="#e85d3a" /> At-Risk Fields
                    {atRiskFields.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#fde8e4', color: '#e85d3a' }}>
                        {atRiskFields.length}
                      </span>
                    )}
                  </span>
                </div>
                <div className="overflow-y-auto flex-1">
                  {atRiskFields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-1.5 py-8">
                      <CheckCircle2 size={24} color="#2d7a45" style={{ opacity: 0.4 }} />
                      <p className="text-xs text-[#aaa]">All fields are healthy!</p>
                    </div>
                  ) : (
                    atRiskFields.map((field, idx) => (
                      <button
                        key={field.id}
                        onClick={() => onNavigate('field-detail', String(field.id))}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-transparent border-none cursor-pointer text-left transition-colors duration-100 hover:bg-[#fff8f7]"
                        style={{ borderBottom: idx < atRiskFields.length - 1 ? '0.5px solid #f5f6f4' : 'none', fontFamily: "'DM Sans', sans-serif" }}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#fde8e4' }}>
                          <AlertTriangle size={14} color="#e85d3a" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] font-semibold text-[#111]">{field.name}</p>
                          <p className="text-[11px] text-[#888]">{field.crop_type} · {field.current_stage}</p>
                        </div>
                        <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded flex-shrink-0" style={{ color: '#e85d3a', background: '#fde8e4' }}>
                          At Risk
                        </span>
                        <ChevronRight size={13} color="#ccc" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right column — full width on mobile, 260px on desktop */}
            <div className="flex flex-col gap-3 w-full lg:w-[260px] lg:flex-shrink-0">

              {/* Recent Updates */}
              <div className="bg-white rounded-xl overflow-hidden flex flex-col" style={{ minHeight: 200 }}>
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[#f0f2ee] flex-shrink-0">
                  <Clock size={14} color="#1d6b35" />
                  <p className="text-[12.5px] font-semibold text-[#111]">My Recent Updates</p>
                </div>
                <div className="overflow-y-auto flex-1 p-4">
                  {recentUpdates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-1.5 text-[#aaa] py-8">
                      <Activity size={24} style={{ opacity: 0.2 }} />
                      <p className="text-xs">No updates yet.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {recentUpdates.map((update, idx) => (
                        <div key={update.id} className="flex gap-2.5" style={{ paddingBottom: idx < recentUpdates.length - 1 ? 14 : 0 }}>
                          <div className="flex flex-col items-center flex-shrink-0">
                            <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: STAGE_COLORS[update.stage] ?? '#888' }} />
                            {idx < recentUpdates.length - 1 && (
                              <div className="w-px flex-1 mt-1" style={{ background: '#f0f2ee' }} />
                            )}
                          </div>
                          <div className="flex-1 pb-1">
                            <div className="flex items-center justify-between mb-0.5 gap-2">
                              <p className="text-[12px] font-semibold text-[#111] truncate">
                                {fields.find(f => f.id === update.field_id)?.name ?? `Field #${update.field_id}`}
                              </p>
                              <span className="text-[10px] text-[#aaa] flex-shrink-0">{timeAgo(update.created_at)}</span>
                            </div>
                            <StageBadge stage={update.stage} />
                            {update.notes && (
                              <p className="text-[11px] text-[#888] italic mt-1 leading-snug">"{update.notes}"</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Season Summary */}
              <div className="rounded-xl p-4 flex-shrink-0" style={{ background: '#0f2e1a' }}>
                <p className="text-[11.5px] font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'rgba(168,230,190,0.8)' }}>
                  <Activity size={13} color="#a8e6be" /> Season Summary
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'Total Updates Submitted', value: recentUpdates.length },
                    { label: 'Fields in Progress',      value: active },
                    { label: 'Fields Completed',        value: completed },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</span>
                      <span className="text-[13px] font-bold text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Update Modal ── */}
      {showQuickUpdate && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.4)' }}>
          {/* Bottom sheet on mobile, centered card on desktop */}
          <div
            className="bg-white w-full sm:w-auto sm:min-w-[360px] sm:max-w-[420px] sm:rounded-2xl rounded-t-2xl p-5 sm:p-6"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '85vh', overflowY: 'auto' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold text-[#111]" style={{ fontFamily: "'Syne', sans-serif" }}>Quick Field Update</h2>
              <button
                onClick={() => setShowQuickUpdate(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#f0f2ee] border-none cursor-pointer"
              >
                <X size={14} color="#555" />
              </button>
            </div>
            <p className="text-[12px] text-[#888] mb-3">Select a field to add a full update.</p>
            <div className="flex flex-col gap-2">
              {fields.length === 0 ? (
                <p className="text-center text-[12px] text-[#aaa] py-6">No fields assigned yet.</p>
              ) : fields.map(field => (
                <button
                  key={field.id}
                  onClick={() => { setShowQuickUpdate(false); onNavigate('field-detail', String(field.id)); }}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-[#e8eae4] bg-white cursor-pointer text-left transition-colors duration-100 hover:bg-[#f8fbf9] w-full"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${STAGE_COLORS[field.current_stage]}18` }}
                  >
                    <MapPin size={14} color={STAGE_COLORS[field.current_stage]} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#111] truncate">{field.name}</p>
                    <p className="text-[11px] text-[#888]">{field.crop_type} · {field.current_stage}</p>
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