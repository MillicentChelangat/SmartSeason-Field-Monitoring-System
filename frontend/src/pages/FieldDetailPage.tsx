import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Calendar, Layers, Activity, Plus } from 'lucide-react';
import API from '../api/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { computeFieldStatus } from '../lib/fieldStatus';

const STAGES = ['planted', 'growing', 'ready', 'harvested'] as const;
type FieldStage = typeof STAGES[number];

interface Props {
  fieldId: string;
  onBack: () => void;
}

export function FieldDetailPage({ fieldId, onBack }: Props) {
  // get user from localStorage directly — no useAuth needed
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAdmin = user?.role === 'admin';

  const [field, setField] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
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

  useEffect(() => {
    loadData();
  }, [fieldId]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      await API.post(`fields/${fieldId}/updates/add/`, { 
        stage: updateForm.stage,
        notes: updateForm.notes,
        agent_id: user.id,
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
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
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

  // compute status on frontend
  const status = computeFieldStatus(field, updates[0] ?? null);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* BACK */}
      <button onClick={onBack} className="text-sm text-slate-500 mb-4 flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* FIELD HEADER */}
      <div className="bg-white p-6 rounded-xl border mb-6">
        <h1 className="text-2xl font-bold">{field.name}</h1>
        <div className="flex gap-4 text-sm text-slate-500 mt-2">
          {field.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {field.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" /> {daysSincePlanting} days since planting
          </span>
        </div>
        <div className="flex gap-2 mt-3">
          <StageBadge stage={field.current_stage} />
          <StatusBadge status={status} />  {/* computed status */}
        </div>
      </div>

      {/* ADD UPDATE BUTTON — agents only */}
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
        <form onSubmit={handleUpdate} className="bg-slate-50 p-4 rounded-lg border mb-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Stage</label>
            <select
              value={updateForm.stage}
              onChange={e => setUpdateForm({ ...updateForm, stage: e.target.value as FieldStage })}
              className="border p-2 rounded w-full mt-1"
            >
              {STAGES.map(stage => (
                <option key={stage} value={stage} className="capitalize">{stage}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea
              value={updateForm.notes}
              onChange={e => setUpdateForm({ ...updateForm, notes: e.target.value })}
              className="border p-2 rounded w-full mt-1"
              rows={3}
              placeholder="Add observations or notes..."
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="bg-green-700 text-white px-4 py-2 rounded disabled:opacity-60">
              {saving ? 'Saving...' : 'Submit Update'}
            </button>
            <button type="button" onClick={() => setShowUpdateForm(false)}
              className="border px-4 py-2 rounded">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* UPDATES LIST */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b">
          <Activity className="h-4 w-4 text-green-700" />
          <h2 className="font-semibold">Field Updates</h2>
        </div>
        {updates.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No updates yet</p>
        ) : (
          updates.map(u => (
            <div key={u.id} className="px-6 py-4 border-b">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">
                  {u.agent_name ?? 'Agent'}
                </span>
                <StageBadge stage={u.stage} />
              </div>
              {u.notes && <p className="text-sm text-slate-500 mt-1">{u.notes}</p>}
              <p className="text-xs text-slate-400 mt-1">
                {new Date(u.created_at).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}