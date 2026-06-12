import { useEffect, useState } from 'react';
import { Plus, Search, MapPin, Trash2, UserPlus, X, ChevronRight } from 'lucide-react';
import API from '../api/api';
import type { Field, FieldUpdate, Profile } from '../types/database';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AdminShell } from '../components/AdminShell';
import { AdminSidebar } from '../components/AdminSidebar';

interface FieldWithExtras extends Field {
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
status: f.status,      }));
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
    all:       fields.length,
    planted:   fields.filter(f => f.current_stage === 'planted').length,
    growing:   fields.filter(f => f.current_stage === 'growing').length,
    ready:     fields.filter(f => f.current_stage === 'ready').length,
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

      {/* ── TOPBAR ── */}
      <div style={{
        background: '#fff', borderRadius: 12,
        padding: '0 20px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, marginBottom: 14,
        borderBottom: '1px solid #f0f2ee',
      }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: '#111', margin: 0 }}>Fields</h1>
          <p style={{ fontSize: 11.5, color: '#9ca3af', margin: 0, marginTop: 2 }}>{fields.length} fields total</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8,
            background: '#1d6b35', color: '#fff',
            border: 'none', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <Plus size={14} /> New Field
        </button>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>

        {/* Filter tabs + Search row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, flexShrink: 0, flexWrap: 'wrap',
        }}>
          {/* Stage pill tabs in a contained bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: '#fff', borderRadius: 10, padding: '4px',
            border: '1px solid #f0f2ee',
          }}>
            {(['all', 'planted', 'growing', 'ready', 'harvested'] as const).map(stage => (
              <button
                key={stage}
                onClick={() => setFilterStage(stage)}
                style={{
                  padding: '5px 13px', borderRadius: 7,
                  fontSize: 12, fontWeight: filterStage === stage ? 600 : 400,
                  cursor: 'pointer', border: 'none',
                  background: filterStage === stage ? '#1d6b35' : 'transparent',
                  color: filterStage === stage ? '#fff' : '#6b7280',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 0.15s',
                }}
              >
                {stage.charAt(0).toUpperCase() + stage.slice(1)}
                <span style={{
                  marginLeft: 5, fontSize: 10.5,
                  opacity: filterStage === stage ? 0.8 : 0.6,
                }}>
                  {stageCounts[stage]}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search fields..."
              style={{
                paddingLeft: 32, paddingRight: 14,
                paddingTop: 8, paddingBottom: 8,
                borderRadius: 9, border: '1px solid #e8ede8',
                fontSize: 12.5, background: '#fff',
                fontFamily: "'DM Sans', sans-serif",
                outline: 'none', width: 210,
                color: '#111',
              }}
            />
          </div>
        </div>

        {/* Fields list card */}
        <div style={{
          flex: 1, background: '#fff', borderRadius: 12,
          border: '1px solid #e8ede8',
          overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0,
        }}>
          {/* Table column headers */}
          {filtered.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 160px 120px',
              gap: 8, padding: '9px 18px',
              borderBottom: '1px solid #f3f4f6',
              background: '#fafcfa',
            }}>
              <span />
              <span style={{ fontSize: 10.5, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6 }}>Field</span>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6 }}>Status</span>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, textAlign: 'right' }}>Actions</span>
            </div>
          )}

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '48px 0', color: '#9ca3af' }}>
                <MapPin size={32} style={{ opacity: 0.2, marginBottom: 10, display: 'block' }} />
                <p style={{ fontSize: 13, margin: 0 }}>No fields found</p>
                <p style={{ fontSize: 12, margin: '4px 0 0', color: '#d1d5db' }}>Try adjusting your search or filter</p>
              </div>
            ) : (
              filtered.map((field, idx) => {
                const stageStyle = STAGE_COLORS[field.current_stage] ?? { bg: '#f1f5f9', color: '#475569' };
                const agentName  = field.assigned_agent_id
                  ? agents.find(a => a.user_id === field.assigned_agent_id)?.full_name ?? 'Assigned'
                  : null;
                return (
                  <div key={field.id}>
                    {/* Row */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 1fr 160px 120px',
                        alignItems: 'center',
                        gap: 8,
                        padding: '11px 18px',
                        borderBottom: idx < filtered.length - 1 ? '1px solid #f9fafb' : 'none',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafcfa')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Icon */}
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: stageStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MapPin size={15} color={stageStyle.color} />
                      </div>

                      {/* Name + meta */}
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13.5, fontWeight: 500, color: '#111', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{field.name}</p>
                        <p style={{ fontSize: 11.5, color: '#9ca3af', margin: 0, marginTop: 2 }}>
                          {field.crop_type}
                          {field.location ? ` · ${field.location}` : ''}
                          {agentName ? ` · ${agentName}` : ' · Unassigned'}
                        </p>
                      </div>

                      {/* Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <StageBadge stage={field.current_stage} />
                        <StatusBadge status={field.status} />
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                        <button
                          onClick={() => { setAssigningFieldId(field.id === assigningFieldId ? null : field.id); setSelectedAgent(''); }}
                          title="Assign agent"
                          style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid #e8ede8', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.12s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f0f7fb')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                        >
                          <UserPlus size={13} color="#1a5ac2" />
                        </button>
                        <button
                          onClick={() => handleDelete(field.id)}
                          style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid #e8ede8', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.12s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                        >
                          <Trash2 size={13} color="#e85d3a" />
                        </button>
                        <button
                          onClick={() => onNavigate('field-detail', String(field.id))}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 3,
                            padding: '5px 11px', borderRadius: 7,
                            background: '#eef6f0', color: '#1d6b35',
                            border: 'none', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                            transition: 'background 0.12s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#d9eedf')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#eef6f0')}
                        >
                          View <ChevronRight size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Assign inline panel */}
                    {assigningFieldId === field.id && (
                      <div style={{
                        margin: '0 18px 12px',
                        padding: '12px 16px',
                        background: '#f8fbf8',
                        borderRadius: 9,
                        border: '1px solid #d0e8d8',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <span style={{ fontSize: 12.5, color: '#374151', fontWeight: 500, flexShrink: 0 }}>Assign to:</span>
                        <select
                          value={selectedAgent}
                          onChange={e => setSelectedAgent(e.target.value)}
                          style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 7, padding: '6px 10px', fontSize: 12.5, fontFamily: "'DM Sans', sans-serif", outline: 'none', background: '#fff' }}
                        >
                          <option value="">— Unassign —</option>
                          {agents.map(a => <option key={a.user_id} value={String(a.user_id)}>{a.full_name}</option>)}
                        </select>
                        <button
                          onClick={() => handleAssign(Number(field.id))}
                          style={{ padding: '6px 16px', borderRadius: 7, background: '#1d6b35', color: '#fff', border: 'none', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setAssigningFieldId(null)}
                          style={{ padding: '6px 14px', borderRadius: 7, background: '#fff', color: '#6b7280', border: '1px solid #d1d5db', fontSize: 12.5, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                        >
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

      {/* ── CREATE MODAL ── */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: 500, boxShadow: '0 24px 64px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
            {/* Modal header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: '#111', margin: 0 }}>New Field</h2>
                <p style={{ fontSize: 11.5, color: '#9ca3af', margin: 0, marginTop: 3 }}>Add a new field to your farm</p>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '20px 24px 24px' }}>
              <form onSubmit={handleCreate}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[
                    { label: 'Field Name', key: 'name', type: 'text', placeholder: 'e.g. Field A', required: true },
                    { label: 'Location', key: 'location', type: 'text', placeholder: 'e.g. North Zone', required: false },
                    { label: 'Planting Date', key: 'planting_date', type: 'date', placeholder: '', required: true },
                  ].map(({ label, key, type, placeholder, required }) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                        {label} {required && <span style={{ color: '#e85d3a' }}>*</span>}
                      </label>
                      <input
                        required={required}
                        type={type}
                        placeholder={placeholder}
                        value={(form as any)[key]}
                        onChange={e => setForm({ ...form, [key]: e.target.value })}
                        style={{ width: '100%', border: '1px solid #e2e8e2', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box', color: '#111', transition: 'border-color 0.15s' }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#1d6b35')}
                        onBlur={e => (e.currentTarget.style.borderColor = '#e2e8e2')}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                      Crop Type <span style={{ color: '#e85d3a' }}>*</span>
                    </label>
                    <select
                      value={form.crop_type}
                      onChange={e => setForm({ ...form, crop_type: e.target.value })}
                      style={{ width: '100%', border: '1px solid #e2e8e2', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none', background: '#fff', color: '#111' }}
                    >
                      {CROP_TYPES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Modal footer */}
                <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #e2e8e2', background: '#fff', fontSize: 13.5, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", color: '#6b7280', fontWeight: 500 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: '#1d6b35', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: saving ? 0.65 : 1 }}
                  >
                    {saving ? 'Creating…' : 'Create Field'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}