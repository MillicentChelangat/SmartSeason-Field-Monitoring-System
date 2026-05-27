import { useEffect, useState } from 'react';
import { Plus, Search, MapPin, Trash2, UserPlus, X, ChevronRight } from 'lucide-react';
import API from '../api/api';
import type { Field, FieldUpdate, Profile } from '../types/database';
import { computeFieldStatus } from '../lib/fieldStatus';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AdminShell } from '../components/AdminShell';

interface FieldWithExtras extends Field {
  status: ReturnType<typeof computeFieldStatus>;
}

interface Props {
  onNavigate: (page: string, fieldId?: string) => void;
  onLogout: () => void;
  user: any;
}

const CROP_TYPES = ['Maize', 'Wheat', 'Rice', 'Sorghum', 'Millet', 'Soybean', 'Cotton', 'Sunflower', 'Barley', 'Other'];

const STAGE_COLORS: Record<string, { bg: string; color: string }> = {
  planted:   { bg: '#e0f0fe', color: '#0369a1' },
  growing:   { bg: '#d1fae5', color: '#065f46' },
  ready:     { bg: '#fef3c7', color: '#92400e' },
  harvested: { bg: '#f1f5f9', color: '#475569' },
};

export function FieldsPage({ onNavigate, onLogout, user }: Props) {
  const [fields, setFields]               = useState<FieldWithExtras[]>([]);
  const [agents, setAgents]               = useState<Profile[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [showCreate, setShowCreate]       = useState(false);
  const [saving, setSaving]               = useState(false);
  const [assigningFieldId, setAssigningFieldId] = useState<number | null>(null);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [filterStage, setFilterStage]     = useState('all');

  const [form, setForm] = useState({ name: '', crop_type: 'Maize', planting_date: '', location: '' });

  async function loadData() {
    try {
      const [fieldsRes, updatesRes, agentsRes] = await Promise.all([
        API.get('fields/'),
        API.get('field-updates/'),
        API.get('agents/'),
      ]);
      const rawFields: Field[]      = fieldsRes.data;
      const updates: FieldUpdate[]  = updatesRes.data;
      const agentsData: Profile[]   = agentsRes.data;
      const enriched: FieldWithExtras[] = rawFields.map(f => ({
        ...f,
        status: computeFieldStatus(f, updates.filter(u => u.field_id === f.id)[0] ?? null),
      }));
      setFields(enriched);
      setAgents(agentsData);
    } catch (err) {
      console.error('Failed to load fields:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await API.post('fields/create/', { ...form, current_stage: 'planted' });
      setShowCreate(false);
      setForm({ name: '', crop_type: 'Maize', planting_date: '', location: '' });
      loadData();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this field?')) return;
    try {
      await API.delete(`fields/${id}/delete/`);
      setFields(prev => prev.filter(f => f.id !== id));
    } catch (err) { console.error(err); }
  }

  async function handleAssign(fieldId: number) {
    try {
      await API.post(`fields/${fieldId}/assign/`, { agent_id: selectedAgent ? Number(selectedAgent) : null });
      setAssigningFieldId(null);
      setSelectedAgent('');
      loadData();
    } catch (err: any) { console.error(err); }
  }

  const filtered = fields.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.crop_type.toLowerCase().includes(search.toLowerCase()) ||
      (f.location ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStage = filterStage === 'all' || f.current_stage === filterStage;
    return matchSearch && matchStage;
  });

  const stageCounts = {
    all: fields.length,
    planted: fields.filter(f => f.current_stage === 'planted').length,
    growing: fields.filter(f => f.current_stage === 'growing').length,
    ready: fields.filter(f => f.current_stage === 'ready').length,
    harvested: fields.filter(f => f.current_stage === 'harvested').length,
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#eef0eb' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <AdminShell activePage="fields" onNavigate={onNavigate} onLogout={onLogout} user={user}>

      {/* Topbar */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '0 18px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, marginBottom: 10 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: '#111' }}>Fields</h1>
          <p style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{fields.length} fields total</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, background: '#1d6b35', color: '#fff', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
        >
          <Plus size={13} /> New Field
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', gap: 10, minHeight: 0 }}>

        {/* Main panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>

          {/* Filter tabs + Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {(['all', 'planted', 'growing', 'ready', 'harvested'] as const).map(stage => (
              <button
                key={stage}
                onClick={() => setFilterStage(stage)}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 500, cursor: 'pointer', border: 'none',
                  background: filterStage === stage ? '#1d6b35' : '#fff',
                  color: filterStage === stage ? '#fff' : '#555',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {stage.charAt(0).toUpperCase() + stage.slice(1)} ({stageCounts[stage]})
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search fields..."
                style={{ paddingLeft: 28, paddingRight: 12, paddingTop: 7, paddingBottom: 7, borderRadius: 8, border: '0.5px solid #ddd', fontSize: 12, background: '#fff', fontFamily: "'DM Sans', sans-serif", outline: 'none', width: 200 }}
              />
            </div>
          </div>

          {/* Fields list */}
          <div style={{ flex: 1, background: '#fff', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filtered.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa' }}>
                  <MapPin size={32} style={{ opacity: 0.2, marginBottom: 8 }} />
                  <p style={{ fontSize: 13 }}>No fields found</p>
                </div>
              ) : (
                filtered.map((field, idx) => {
                  const stageStyle = STAGE_COLORS[field.current_stage] ?? { bg: '#f1f5f9', color: '#475569' };
                  const agentName = field.assigned_agent_id
                    ? agents.find(a => a.user_id === field.assigned_agent_id)?.full_name ?? 'Assigned'
                    : null;
                  return (
                    <div key={field.id}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: idx < filtered.length - 1 ? '0.5px solid #f0f2ee' : 'none' }}
                      >
                        {/* Stage colour dot */}
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: stageStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <MapPin size={16} color={stageStyle.color} />
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{field.name}</p>
                          <p style={{ fontSize: 11, color: '#888', marginTop: 1 }}>
                            {field.crop_type}
                            {field.location ? ` · ${field.location}` : ''}
                            {agentName ? ` · ${agentName}` : ' · Unassigned'}
                          </p>
                        </div>

                        {/* Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <StageBadge stage={field.current_stage} />
                          <StatusBadge status={field.status} />
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <button
                            onClick={() => { setAssigningFieldId(field.id === assigningFieldId ? null : field.id); setSelectedAgent(''); }}
                            title="Assign agent"
                            style={{ width: 28, height: 28, borderRadius: 6, border: '0.5px solid #e0e2dc', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <UserPlus size={13} color="#1a5ac2" />
                          </button>
                          <button
                            onClick={() => handleDelete(field.id)}
                            style={{ width: 28, height: 28, borderRadius: 6, border: '0.5px solid #e0e2dc', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={13} color="#e85d3a" />
                          </button>
                          <button
                            onClick={() => onNavigate('field-detail', String(field.id))}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: '#f0f7f2', color: '#1d6b35', border: 'none', fontSize: 11.5, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                          >
                            View <ChevronRight size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Assign inline panel */}
                      {assigningFieldId === field.id && (
                        <div style={{ margin: '0 16px 10px', padding: '10px 14px', background: '#f8faf8', borderRadius: 8, border: '0.5px solid #d0e8d8', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 12, color: '#555', fontWeight: 500, flexShrink: 0 }}>Assign to:</span>
                          <select
                            value={selectedAgent}
                            onChange={e => setSelectedAgent(e.target.value)}
                            style={{ flex: 1, border: '0.5px solid #ccc', borderRadius: 6, padding: '5px 8px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: 'none' }}
                          >
                            <option value="">— Unassign —</option>
                            {agents.map(a => <option key={a.user_id} value={String(a.user_id)}>{a.full_name}</option>)}
                          </select>
                          <button onClick={() => handleAssign(Number(field.id))} style={{ padding: '5px 14px', borderRadius: 6, background: '#1d6b35', color: '#fff', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                            Save
                          </button>
                          <button onClick={() => setAssigningFieldId(null)} style={{ padding: '5px 14px', borderRadius: 6, background: '#fff', color: '#555', border: '0.5px solid #ccc', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CREATE MODAL ── */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: '#111' }}>New Field</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Field Name *', key: 'name', type: 'text', placeholder: 'e.g. Field A' },
                  { label: 'Location', key: 'location', type: 'text', placeholder: 'e.g. North Zone' },
                  { label: 'Planting Date *', key: 'planting_date', type: 'date', placeholder: '' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key} style={{ gridColumn: key === 'planting_date' ? 'span 1' : 'span 1' }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#666', marginBottom: 5 }}>{label}</label>
                    <input
                      required={label.includes('*')}
                      type={type}
                      placeholder={placeholder}
                      value={(form as any)[key]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      style={{ width: '100%', border: '0.5px solid #ddd', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#666', marginBottom: 5 }}>Crop Type *</label>
                  <select
                    value={form.crop_type}
                    onChange={e => setForm({ ...form, crop_type: e.target.value })}
                    style={{ width: '100%', border: '0.5px solid #ddd', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, fontFamily: "'DM Sans', sans-serif", outline: 'none' }}
                  >
                    {CROP_TYPES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '0.5px solid #ddd', background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", color: '#555' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: '#1d6b35', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Creating…' : 'Create Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}