import { useEffect, useState } from 'react';
import { Plus, Search, MapPin, Trash2, UserPlus } from 'lucide-react';
import API from '../api/api';
import type { Field, FieldUpdate, Profile } from '../types/database';
import { computeFieldStatus } from '../lib/fieldStatus';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface FieldWithExtras extends Field {
  status: ReturnType<typeof computeFieldStatus>;
}

interface Props {
  onNavigate: (page: string, fieldId?: string) => void;
}

const CROP_TYPES = ['Maize', 'Wheat', 'Rice', 'Sorghum', 'Millet', 'Soybean', 'Cotton', 'Sunflower', 'Barley', 'Other'];

export function FieldsPage({ onNavigate }: Props) {
  const [fields, setFields] = useState<FieldWithExtras[]>([]);
  const [agents, setAgents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const [assigningFieldId, setAssigningFieldId] = useState<number | null>(null);
  const [selectedAgent, setSelectedAgent] = useState('');

  const [form, setForm] = useState({
    name: '',
    crop_type: 'Maize',
    planting_date: '',
    location: '',
  });

  async function loadData() {
    try {
      const [fieldsRes, updatesRes, agentsRes] = await Promise.all([
        API.get('fields/'),
        API.get('field-updates/'),
        API.get('agents/'),
      ]);

      const rawFields: Field[] = fieldsRes.data;
      const updates: FieldUpdate[] = updatesRes.data;
      const agentsData: Profile[] = agentsRes.data;

      const enriched: FieldWithExtras[] = rawFields.map((f) => {
        const lastUpdate = updates.filter(u => u.field_id === f.id)[0] ?? null;
        return {
          ...f,
          status: computeFieldStatus(f, lastUpdate),
        };
      });

      setFields(enriched);
      setAgents(agentsData);
    } catch (err) {
      console.error('Failed to load fields:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await API.post('fields/create/', {
        name: form.name,
        crop_type: form.crop_type,
        planting_date: form.planting_date,
        current_stage: 'planted',
        location: form.location,
      });
      setShowCreate(false);
      setForm({ name: '', crop_type: 'Maize', planting_date: '', location: '' });
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this field?')) return;
    try {
      await API.delete(`fields/${id}/delete/`);
      setFields(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAssign(fieldId: number) {
    try {
      await API.post(`fields/${fieldId}/assign/`, {
        agent_id: selectedAgent ? Number(selectedAgent) : null  // ✅ convert to number
      });
      setAssigningFieldId(null);
      setSelectedAgent('');
      loadData();
    } catch (err: any) {
      console.log("Error:", err.response?.data);
      console.error(err);
    }
  }

  const filtered = fields.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.crop_type.toLowerCase().includes(search.toLowerCase()) ||
    (f.location ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Fields</h1>
          <p className="text-slate-500 text-sm">Manage all crop fields</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> New Field
        </button>
      </div>

      {/* CREATE FORM */}
      {showCreate && (
        <div className="bg-white border rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="font-semibold mb-4">Create New Field</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              required
              placeholder="Field Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="border p-2.5 rounded-lg"
            />
            <select
              value={form.crop_type}
              onChange={e => setForm({ ...form, crop_type: e.target.value })}
              className="border p-2.5 rounded-lg"
            >
              {CROP_TYPES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input
              required
              type="date"
              value={form.planting_date}
              onChange={e => setForm({ ...form, planting_date: e.target.value })}
              className="border p-2.5 rounded-lg"
            />
            <input
              placeholder="Location (optional)"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              className="border p-2.5 rounded-lg"
            />
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-green-700 text-white px-6 py-2.5 rounded-lg disabled:opacity-60">
                {saving ? 'Saving...' : 'Create Field'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)}
                className="border px-6 py-2.5 rounded-lg">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SEARCH */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 py-2 border rounded-lg"
          placeholder="Search fields..."
        />
      </div>

      {/* LIST */}
      <div className="bg-white border rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <MapPin className="mx-auto mb-2 opacity-30" />
            No fields found
          </div>
        ) : (
          filtered.map(field => (
            <div key={field.id} className="flex flex-col p-4 border-b hover:bg-slate-50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{field.name}</p>
                  <p className="text-xs text-slate-500">
                    {field.crop_type} {field.location ? `· ${field.location}` : ''}
                    {field.assigned_agent_id
                      ? ` · Agent: ${agents.find(a => a.user_id === field.assigned_agent_id)?.full_name ?? 'Assigned'}`
                      : ' · Unassigned'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StageBadge stage={field.current_stage} />
                  <StatusBadge status={field.status} />
                  <button
                    onClick={() => { setAssigningFieldId(field.id); setSelectedAgent(''); }}
                    className="text-blue-600 hover:text-blue-800"
                    title="Assign agent"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(field.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onNavigate('field-detail', String(field.id))}
                    className="text-green-700 hover:underline text-sm"
                  >
                    View
                  </button>
                </div>
              </div>

              {/* ASSIGN DROPDOWN */}
              {assigningFieldId === field.id && (
                <div className="mt-3 flex items-center gap-3 bg-slate-50 p-3 rounded-lg border">
                  <span className="text-sm text-slate-600 font-medium">Assign to:</span>
                  <select
                    value={selectedAgent}
                    onChange={e => setSelectedAgent(e.target.value)}
                    className="border text-sm p-1.5 rounded-lg flex-1"
                  >
                    <option value="">-- Unassign --</option>
                    {agents.map(a => (
                      <option key={a.user_id} value={String(a.user_id)}>  {/* ✅ String(a.user_id) */}
                        {a.full_name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleAssign(Number(field.id))}
                    className="bg-green-700 text-white text-sm px-4 py-1.5 rounded-lg"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setAssigningFieldId(null)}
                    className="border text-sm px-4 py-1.5 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}