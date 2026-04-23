import { useEffect, useState } from 'react';
import { Plus, Search, MapPin, Trash2, UserPlus } from 'lucide-react';
import API from '../api/api';
import type { Field, FieldUpdate, FieldStage, Profile } from '../types/database';
import { computeFieldStatus } from '../lib/fieldStatus';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

interface FieldWithExtras extends Field {
  status: ReturnType<typeof computeFieldStatus>;
  assignedAgents: Profile[];
}

interface Props {
  onNavigate: (page: string, fieldId?: string) => void;
}

const CROP_TYPES = ['Maize', 'Wheat', 'Rice', 'Sorghum', 'Millet', 'Soybean', 'Cotton', 'Sunflower', 'Barley', 'Other'];
const STAGES: FieldStage[] = ['planted', 'growing', 'ready', 'harvested'];

export function FieldsPage({ onNavigate }: Props) {
  const { user } = useAuth();

  const [fields, setFields] = useState<FieldWithExtras[]>([]);
  const [agents, setAgents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    crop_type: 'Maize',
    planting_date: '',
    current_stage: 'planted' as FieldStage,
    location: '',
    size_hectares: '',
  });

  // ---------------- LOAD DATA ----------------
  async function loadData() {
    try {
      const [fieldsRes, updatesRes, agentsRes] = await Promise.all([
        API.get('/fields/'),
        API.get('/field-updates/'),
        API.get('/agents/'),
      ]);

      const rawFields: Field[] = fieldsRes.data;
      const updates: FieldUpdate[] = updatesRes.data;
      const agentsData: Profile[] = agentsRes.data;

      const enriched: FieldWithExtras[] = rawFields.map((f) => {
        const lastUpdate =
          updates.filter(u => u.field_id === f.id)[0] ?? null;

        return {
          ...f,
          status: computeFieldStatus(f, lastUpdate),
          assignedAgents: [], // if backend supports, replace later
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

  // ---------------- CREATE FIELD ----------------
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      await API.post('/fields/', {
        name: form.name,
        crop_type: form.crop_type,
        planting_date: form.planting_date,
        current_stage: form.current_stage,
        location: form.location,
        size_hectares: form.size_hectares ? Number(form.size_hectares) : null,
        created_by: user?.id,
      });

      setShowCreate(false);
      setForm({
        name: '',
        crop_type: 'Maize',
        planting_date: '',
        current_stage: 'planted',
        location: '',
        size_hectares: '',
      });

      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  // ---------------- DELETE FIELD ----------------
  async function handleDelete(id: string) {
    if (!confirm('Delete this field?')) return;

    try {
      await API.delete(`/fields/${id}/`);
      setFields(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = fields.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.crop_type.toLowerCase().includes(search.toLowerCase()) ||
    (f.location ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
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
          <Plus className="h-4 w-4" />
          New Field
        </button>
      </div>

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
            <div
              key={field.id}
              className="flex justify-between p-4 border-b hover:bg-slate-50"
            >
              <div>
                <p className="font-medium">{field.name}</p>
                <p className="text-xs text-slate-500">{field.crop_type}</p>
              </div>

              <div className="flex items-center gap-2">
                <StageBadge stage={field.current_stage} />
                <StatusBadge status={field.status} />

                <button
                  onClick={() => handleDelete(field.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <button
                  onClick={() => onNavigate('field-detail', field.id)}
                  className="text-green-700 hover:underline text-sm"
                >
                  View
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}