import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Calendar, Activity, Plus, Layers } from 'lucide-react';
import API from '../api/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { computeFieldStatus } from '../lib/fieldStatus';
import { AdminShell } from '../components/AdminShell';

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

  const [field, setField]             = useState<any>(null);
  const [updates, setUpdates]         = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [updateForm, setUpdateForm]   = useState({ stage: 'planted' as FieldStage, notes: '' });

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

  if (!field) {
    return (
      <AdminShell activePage="fields" onNavigate={onNavigate} onLogout={onLogout} user={storedUser}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#aaa' }}>
          <p style={{ fontSize: 13 }}>Field not found.</p>
          <button onClick={onBack} style={{ marginTop: 12, fontSize: 12, color: '#1d6b35', background: 'none', border: 'none', cursor: 'pointer' }}>← Go back</button>
        </div>
      </AdminShell>
    );
  }

  const daysSincePlanting = Math.floor((Date.now() - new Date(field.planting_date).getTime()) / (1000 * 60 * 60 * 24));
  const status            = computeFieldStatus(field, updates[0] ?? null);
  const currentStepIdx    = STAGE_STEPS.indexOf(field.current_stage);

  return (
    <AdminShell activePage="fields" onNavigate={onNavigate} onLogout={onLogout} user={storedUser}>

      {/* Topbar */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '0 18px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f0f2ee', border: 'none', borderRadius: 7, padding: '5px 10px', fontSize: 12, color: '#555', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
          >
            <ArrowLeft size={13} /> Back
          </button>
          <div style={{ width: 1, height: 20, background: '#e8eae4' }} />
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: '#111' }}>{field.name}</h1>
            <p style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{field.crop_type}{field.location ? ` · ${field.location}` : ''}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StageBadge stage={field.current_stage} />
          <StatusBadge status={status} />
          {!isAdmin && (
            <button
              onClick={() => setShowUpdateForm(!showUpdateForm)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, background: '#1d6b35', color: '#fff', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginLeft: 6 }}
            >
              <Plus size={13} /> Add Update
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', gap: 10, minHeight: 0 }}>

        {/* Left: timeline + update form */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>

          {/* Growth stage tracker */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', flexShrink: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers size={14} color="#1d6b35" /> Growth Progress
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              {STAGE_STEPS.map((stage, i) => {
                const done    = i <= currentStepIdx;
                const current = i === currentStepIdx;
                const color   = done ? STAGE_COLORS[stage] : '#e0e2dc';
                return (
                  <div key={stage} style={{ display: 'flex', alignItems: 'center', flex: i < STAGE_STEPS.length - 1 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                      <div style={{
                        width: current ? 32 : 26, height: current ? 32 : 26,
                        borderRadius: '50%', background: done ? color : '#f0f2ee',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: current ? `2px solid ${color}` : '2px solid transparent',
                        boxShadow: current ? `0 0 0 3px ${color}22` : 'none',
                        transition: 'all 0.2s',
                      }}>
                        {done && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      <p style={{ fontSize: 10.5, color: done ? color : '#aaa', fontWeight: current ? 600 : 400, textTransform: 'capitalize' }}>{stage}</p>
                    </div>
                    {i < STAGE_STEPS.length - 1 && (
                      <div style={{ flex: 1, height: 2, background: i < currentStepIdx ? STAGE_COLORS[STAGE_STEPS[i + 1]] : '#e0e2dc', margin: '0 4px', marginBottom: 18, transition: 'background 0.2s' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add update form */}
          {showUpdateForm && (
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', flexShrink: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 12 }}>Submit Field Update</p>
              <form onSubmit={handleUpdate}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#666', marginBottom: 4 }}>Stage</label>
                    <select
                      value={updateForm.stage}
                      onChange={e => setUpdateForm({ ...updateForm, stage: e.target.value as FieldStage })}
                      style={{ width: '100%', border: '0.5px solid #ddd', borderRadius: 7, padding: '7px 10px', fontSize: 12.5, fontFamily: "'DM Sans', sans-serif", outline: 'none' }}
                    >
                      {STAGES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#666', marginBottom: 4 }}>Notes</label>
                    <input
                      value={updateForm.notes}
                      onChange={e => setUpdateForm({ ...updateForm, notes: e.target.value })}
                      placeholder="Add observations..."
                      style={{ width: '100%', border: '0.5px solid #ddd', borderRadius: 7, padding: '7px 10px', fontSize: 12.5, fontFamily: "'DM Sans', sans-serif", outline: 'none' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={saving} style={{ padding: '7px 18px', borderRadius: 7, background: '#1d6b35', color: '#fff', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: saving ? 0.6 : 1 }}>
                    {saving ? 'Saving…' : 'Submit Update'}
                  </button>
                  <button type="button" onClick={() => setShowUpdateForm(false)} style={{ padding: '7px 18px', borderRadius: 7, background: '#fff', color: '#555', border: '0.5px solid #ddd', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Updates timeline */}
          <div style={{ flex: 1, background: '#fff', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '12px 18px', borderBottom: '0.5px solid #f0f2ee', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <Activity size={14} color="#1d6b35" />
              <p style={{ fontSize: 12.5, fontWeight: 600, color: '#111' }}>Field Updates</p>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#aaa' }}>{updates.length} update{updates.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
              {updates.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa' }}>
                  <Activity size={28} style={{ opacity: 0.2, marginBottom: 6 }} />
                  <p style={{ fontSize: 12 }}>No updates yet</p>
                </div>
              ) : (
                <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {updates.map((u, idx) => (
                    <div key={u.id} style={{ display: 'flex', gap: 12, paddingBottom: idx < updates.length - 1 ? 16 : 0 }}>
                      {/* Timeline line */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: STAGE_COLORS[u.stage] ?? '#888', marginTop: 3, flexShrink: 0 }} />
                        {idx < updates.length - 1 && <div style={{ width: 1.5, flex: 1, background: '#f0f2ee', marginTop: 4 }} />}
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, paddingBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                          <p style={{ fontSize: 12.5, fontWeight: 600, color: '#111' }}>{u.agent_name ?? 'Agent'}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <StageBadge stage={u.stage} />
                            <span style={{ fontSize: 10.5, color: '#aaa' }}>{timeAgo(u.created_at)}</span>
                          </div>
                        </div>
                        {u.notes && (
                          <p style={{ fontSize: 12, color: '#666', background: '#f8faf8', borderRadius: 6, padding: '6px 10px', fontStyle: 'italic' }}>"{u.notes}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: field info card */}
        <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 12 }}>Field Info</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: <MapPin size={13} color="#1d6b35" />, label: 'Location', val: field.location || '—' },
                { icon: <Calendar size={13} color="#1d6b35" />, label: 'Planting Date', val: new Date(field.planting_date).toLocaleDateString() },
                { icon: <Calendar size={13} color="#1d6b35" />, label: 'Days Since Planting', val: `${daysSincePlanting} days` },
                { icon: <Layers size={13} color="#1d6b35" />, label: 'Crop Type', val: field.crop_type },
              ].map(({ icon, label, val }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flexShrink: 0, marginTop: 1 }}>{icon}</div>
                  <div>
                    <p style={{ fontSize: 10, color: '#aaa', fontWeight: 500 }}>{label}</p>
                    <p style={{ fontSize: 12.5, color: '#333', fontWeight: 500 }}>{val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Updates summary */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 10 }}>Update Summary</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#666' }}>Total Updates</span>
                <span style={{ fontWeight: 600, color: '#111' }}>{updates.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#666' }}>Last Update</span>
                <span style={{ fontWeight: 600, color: '#111' }}>{updates.length > 0 ? timeAgo(updates[0].created_at) : '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#666' }}>Current Stage</span>
                <span style={{ fontWeight: 600, color: STAGE_COLORS[field.current_stage] ?? '#111', textTransform: 'capitalize' }}>{field.current_stage}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}