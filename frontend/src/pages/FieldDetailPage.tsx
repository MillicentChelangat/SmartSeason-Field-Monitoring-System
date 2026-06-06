import { useEffect, useState } from 'react';
import { MapPin, Calendar, Activity, Plus, Layers, ChevronRight } from 'lucide-react';
import API from '../api/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { computeFieldStatus } from '../lib/fieldStatus';
import { AdminShell } from '../components/AdminShell';
import { AgentShell } from '../components/AgentShell';

const STAGES = ['planted', 'growing', 'ready', 'harvested'] as const;
type FieldStage = typeof STAGES[number];

interface Props {
  fieldId: string;
  onBack: () => void;
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
  const mins  = Math.floor(diff / 60000);
  const hrs   = Math.floor(mins / 60);
  const days  = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0)  return `${hrs}h ago`;
  return `${mins}m ago`;
}

export function FieldDetailPage({ fieldId, onBack, onNavigate, onLogout, user }: Props) {
  const storedUser = user ?? JSON.parse(localStorage.getItem('user') || 'null');
  const isAdmin    = storedUser?.role === 'admin';

  const [field, setField]                   = useState<any>(null);
  const [updates, setUpdates]               = useState<any[]>([]);
  const [loading, setLoading]               = useState(true);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [updateForm, setUpdateForm]         = useState({ stage: 'planted' as FieldStage, notes: '' });

  async function loadData() {
    try {
      setLoading(true);
      const [fieldRes, updatesRes] = await Promise.all([
        API.get(`fields/${fieldId}/`),
        API.get(`fields/${fieldId}/updates/`),
      ]);
      setField(fieldRes.data);
      setUpdates(updatesRes.data);
      if (fieldRes.data?.current_stage) {
        setUpdateForm(prev => ({ ...prev, stage: fieldRes.data.current_stage }));
      }
    } catch (err) {
      console.error('Error loading field:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [fieldId]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!storedUser) return;
    setSaving(true);
    try {
      await API.post(`fields/${fieldId}/updates/add/`, {
        stage: updateForm.stage,
        notes: updateForm.notes,
        agent_id: storedUser.id,
      });
      await loadData();
      setShowUpdateForm(false);
      setUpdateForm(prev => ({ ...prev, notes: '' }));
    } catch (err) {
      console.error('Error submitting update:', err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#eef0eb' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const Shell      = isAdmin ? AdminShell : AgentShell;
  const activePage = isAdmin ? 'fields' : 'my-fields';

  if (!field) {
    return (
      <Shell activePage={activePage} onNavigate={onNavigate} onLogout={onLogout} user={storedUser}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#aaa' }}>
          <p style={{ fontSize: 13 }}>Field not found.</p>
          <button onClick={onBack} style={{ marginTop: 12, fontSize: 12, color: '#1d6b35', background: 'none', border: 'none', cursor: 'pointer' }}>← Go back</button>
        </div>
      </Shell>
    );
  }

  const daysSincePlanting = Math.floor((Date.now() - new Date(field.planting_date).getTime()) / (1000 * 60 * 60 * 24));
  const status            = computeFieldStatus(field, updates[0] ?? null);
  const currentStepIdx    = STAGE_STEPS.indexOf(field.current_stage);

  return (
    <Shell activePage={activePage} onNavigate={onNavigate} onLogout={onLogout} user={storedUser}>

      {/* ── TOPBAR with breadcrumb ── */}
      <div style={{
        background: '#fff', borderRadius: 12,
        padding: '0 20px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, marginBottom: 14,
      }}>
        {/* Breadcrumb: Fields → Field Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={onBack}
            style={{
              fontSize: 13.5, color: '#9ca3af', fontWeight: 500,
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", padding: 0,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1d6b35')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
          >
            Fields
          </button>
          <ChevronRight size={14} color="#d1d5db" />
          <span style={{ fontSize: 13.5, color: '#111', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
            {field.name}
          </span>
        </div>

        {/* Right: badges + optional action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StageBadge stage={field.current_stage} />
          <StatusBadge status={status} />
          {!isAdmin && (
            <button
              onClick={() => setShowUpdateForm(!showUpdateForm)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8,
                background: '#1d6b35', color: '#fff',
                border: 'none', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                marginLeft: 4,
              }}
            >
              <Plus size={13} /> Add Update
            </button>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: 'flex', gap: 14, minHeight: 0 }}>

        {/* Left column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>

          {/* Growth stage tracker */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', flexShrink: 0, border: '1px solid #e8ede8' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 7, margin: '0 0 20px' }}>
              <Layers size={14} color="#1d6b35" /> Growth Progress
            </p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {STAGE_STEPS.map((stage, i) => {
                const done    = i <= currentStepIdx;
                const current = i === currentStepIdx;
                const color   = done ? STAGE_COLORS[stage] : '#d1d5db';
                return (
                  <div key={stage} style={{ display: 'flex', alignItems: 'center', flex: i < STAGE_STEPS.length - 1 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                      {/* Circle */}
                      <div style={{
                        width: current ? 34 : 26, height: current ? 34 : 26,
                        borderRadius: '50%',
                        background: done ? color : '#f3f4f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: current ? `2.5px solid ${color}` : '2px solid transparent',
                        boxShadow: current ? `0 0 0 4px ${color}22` : 'none',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                      }}>
                        {done && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      <p style={{ fontSize: 11, color: done ? color : '#9ca3af', fontWeight: current ? 700 : 400, textTransform: 'capitalize', margin: 0, whiteSpace: 'nowrap' }}>
                        {stage}
                      </p>
                    </div>
                    {/* Connector line */}
                    {i < STAGE_STEPS.length - 1 && (
                      <div style={{
                        flex: 1, height: 2.5, borderRadius: 2,
                        background: i < currentStepIdx ? STAGE_COLORS[STAGE_STEPS[i + 1]] : '#e5e7eb',
                        margin: '0 6px', marginBottom: 22,
                        transition: 'background 0.3s',
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add update form */}
          {showUpdateForm && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ede8', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ padding: '13px 20px', borderBottom: '1px solid #f3f4f6', background: '#fafcfa', display: 'flex', alignItems: 'center', gap: 7 }}>
                <Activity size={14} color="#1d6b35" />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Submit Field Update</span>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <form onSubmit={handleUpdate}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Stage</label>
                      <select
                        value={updateForm.stage}
                        onChange={e => setUpdateForm({ ...updateForm, stage: e.target.value as FieldStage })}
                        style={{ width: '100%', border: '1px solid #e2e8e2', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none', background: '#fff' }}
                      >
                        {STAGES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Notes</label>
                      <input
                        value={updateForm.notes}
                        onChange={e => setUpdateForm({ ...updateForm, notes: e.target.value })}
                        placeholder="Add observations..."
                        style={{ width: '100%', border: '1px solid #e2e8e2', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#1d6b35')}
                        onBlur={e => (e.currentTarget.style.borderColor = '#e2e8e2')}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="submit"
                      disabled={saving}
                      style={{ padding: '8px 20px', borderRadius: 8, background: '#1d6b35', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: saving ? 0.65 : 1 }}
                    >
                      {saving ? 'Saving…' : 'Submit Update'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUpdateForm(false)}
                      style={{ padding: '8px 18px', borderRadius: 8, background: '#fff', color: '#6b7280', border: '1px solid #e2e8e2', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Updates timeline */}
          <div style={{ flex: 1, background: '#fff', borderRadius: 12, border: '1px solid #e8ede8', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Card header */}
            <div style={{ padding: '13px 20px', borderBottom: '1px solid #f3f4f6', background: '#fafcfa', display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
              <Activity size={14} color="#1d6b35" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Field Updates</span>
              <span style={{ marginLeft: 'auto', fontSize: 11.5, color: '#9ca3af' }}>{updates.length} update{updates.length !== 1 ? 's' : ''}</span>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '12px 0' }}>
              {updates.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', padding: '32px 0' }}>
                  <Activity size={28} style={{ opacity: 0.2, marginBottom: 8, display: 'block' }} />
                  <p style={{ fontSize: 13, margin: 0 }}>No updates yet</p>
                </div>
              ) : (
                <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column' }}>
                  {updates.map((u, idx) => (
                    <div key={u.id} style={{ display: 'flex', gap: 14, paddingBottom: idx < updates.length - 1 ? 18 : 0 }}>
                      {/* Timeline spine */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 3 }}>
                        <div style={{ width: 11, height: 11, borderRadius: '50%', background: STAGE_COLORS[u.stage] ?? '#888', flexShrink: 0, boxShadow: `0 0 0 3px ${(STAGE_COLORS[u.stage] ?? '#888')}22` }} />
                        {idx < updates.length - 1 && (
                          <div style={{ width: 1.5, flex: 1, background: '#f0f2ee', marginTop: 5 }} />
                        )}
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, paddingBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: 0 }}>{u.agent_name ?? 'Agent'}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <StageBadge stage={u.stage} />
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>{timeAgo(u.created_at)}</span>
                          </div>
                        </div>
                        {u.notes && (
                          <p style={{ fontSize: 12.5, color: '#6b7280', background: '#f8fbf8', borderRadius: 7, padding: '7px 12px', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
                            "{u.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ width: 230, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Field Info card */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ede8', overflow: 'hidden' }}>
            <div style={{ padding: '13px 16px', borderBottom: '1px solid #f3f4f6', background: '#fafcfa', display: 'flex', alignItems: 'center', gap: 7 }}>
              <MapPin size={14} color="#1d6b35" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Field Info</span>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 13 }}>
              {[
                { icon: <MapPin size={13} color="#1d6b35" />,    label: 'Location',            val: field.location || '—' },
                { icon: <Calendar size={13} color="#1d6b35" />,  label: 'Planting Date',       val: new Date(field.planting_date).toLocaleDateString() },
                { icon: <Calendar size={13} color="#1d6b35" />,  label: 'Days Since Planting', val: `${daysSincePlanting} days` },
                { icon: <Layers size={13} color="#1d6b35" />,    label: 'Crop Type',           val: field.crop_type },
              ].map(({ icon, label, val }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: '#eef6f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 10.5, color: '#9ca3af', fontWeight: 500, margin: 0 }}>{label}</p>
                    <p style={{ fontSize: 13, color: '#111', fontWeight: 500, margin: 0, marginTop: 2 }}>{val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Update Summary card */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ede8', overflow: 'hidden' }}>
            <div style={{ padding: '13px 16px', borderBottom: '1px solid #f3f4f6', background: '#fafcfa', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Activity size={14} color="#1d6b35" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Update Summary</span>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Total Updates', val: String(updates.length) },
                { label: 'Last Update',   val: updates.length > 0 ? timeAgo(updates[0].created_at) : '—' },
                { label: 'Current Stage', val: field.current_stage, color: STAGE_COLORS[field.current_stage] },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12.5, color: '#6b7280' }}>{label}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: color ?? '#111', textTransform: 'capitalize' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}