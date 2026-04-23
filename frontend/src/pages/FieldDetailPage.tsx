import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Calendar, Layers, Activity, Plus } from 'lucide-react';
import API from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';

const STAGES = ['planted', 'growing', 'ready', 'harvested'] as const;

type FieldStage = typeof STAGES[number];

interface Props {
  fieldId: string;
  onBack: () => void;
}

export function FieldDetailPage({ fieldId, onBack }: Props) {
  const { user, profile } = useAuth();

  const isAdmin = profile?.role === 'admin';

  const [field, setField] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [assignedAgents, setAssignedAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [updateForm, setUpdateForm] = useState({
    stage: 'planted' as FieldStage,
    notes: '',
  });

  async function loadData() {
    try {
      setLoading(true);

      const [fieldRes, updatesRes, agentsRes] = await Promise.all([
        API.get(`/fields/${fieldId}/`),
        API.get(`/fields/${fieldId}/updates/`),
        API.get(`/fields/${fieldId}/agents/`),
      ]);

      setField(fieldRes.data);
      setUpdates(updatesRes.data);
      setAssignedAgents(agentsRes.data);

      if (fieldRes.data) {
        setUpdateForm(prev => ({
          ...prev,
          stage: fieldRes.data.current_stage,
        }));
      }
    } catch (err) {
      console.error('Error loading field:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [fieldId]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);

      await API.post(`/fields/${fieldId}/updates/`, {
        stage: updateForm.stage,
        notes: updateForm.notes,
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
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!field) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={onBack} className="text-sm text-slate-500 mb-4 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <p className="text-slate-500">Field not found</p>
      </div>
    );
  }

  const daysSincePlanting = Math.floor(
    (Date.now() - new Date(field.planting_date).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* BACK BUTTON */}
      <button onClick={onBack} className="text-sm text-slate-500 mb-4 flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* FIELD HEADER */}
      <div className="bg-white p-6 rounded-xl border mb-6">
        <h1 className="text-2xl font-bold">{field.name}</h1>

        <div className="flex gap-4 text-sm text-slate-500 mt-2">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" /> {field.location}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {daysSincePlanting} days
          </span>
          <span className="flex items-center gap-1">
            <Layers className="h-4 w-4" />
            {field.size_hectares} ha
          </span>
        </div>

        <div className="flex gap-2 mt-3">
          <StageBadge stage={field.current_stage} />
          <StatusBadge status={field.status} />
        </div>
      </div>

      {/* UPDATE BUTTON */}
      {!isAdmin && (
        <button
          onClick={() => setShowUpdateForm(!showUpdateForm)}
          className="bg-green-700 text-white px-4 py-2 rounded-lg mb-4 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Update
        </button>
      )}

      {/* UPDATE FORM */}
      {showUpdateForm && (
        <form onSubmit={handleUpdate} className="bg-slate-50 p-4 rounded-lg mb-4">
          <select
            value={updateForm.stage}
            onChange={(e) =>
              setUpdateForm({ ...updateForm, stage: e.target.value as FieldStage })
            }
            className="border p-2 rounded w-full mb-3"
          >
            {STAGES.map(stage => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>

          <textarea
            value={updateForm.notes}
            onChange={(e) =>
              setUpdateForm({ ...updateForm, notes: e.target.value })
            }
            className="border p-2 rounded w-full mb-3"
            placeholder="Notes..."
          />

          <button
            type="submit"
            disabled={saving}
            className="bg-green-700 text-white px-4 py-2 rounded"
          >
            {saving ? 'Saving...' : 'Submit'}
          </button>
        </form>
      )}

      {/* UPDATES LIST */}
      <div className="bg-white border rounded-xl p-4">
        {updates.length === 0 ? (
          <p className="text-slate-400 text-center py-6">
            No updates yet
          </p>
        ) : (
          updates.map((u) => (
            <div key={u.id} className="border-b py-3">
              <div className="flex justify-between">
                <span className="font-medium">{u.agent_name}</span>
                <StageBadge stage={u.stage} />
              </div>
              <p className="text-sm text-slate-500">{u.notes}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}