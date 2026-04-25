import { useEffect, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import API from '../api/api';
import type { Field, FieldUpdate } from '../types/database';
import { computeFieldStatus } from '../lib/fieldStatus';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface FieldWithStatus extends Field {
  status: ReturnType<typeof computeFieldStatus>;
  lastUpdate?: FieldUpdate | null;
}

interface Props {
  onNavigate: (page: string, fieldId?: string) => void;
}

export function MyFieldsPage({ onNavigate }: Props) {
  const [fields, setFields] = useState<FieldWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('access');
        const headers = { Authorization: `Bearer ${token}` };

        const [fieldsRes, updatesRes] = await Promise.all([
          API.get('agent/fields/', { headers }),
          API.get('agent/updates/', { headers }),
        ]);

        const rawFields: Field[] = fieldsRes.data;
        const allUpdates: FieldUpdate[] = updatesRes.data;

        const enriched: FieldWithStatus[] = rawFields.map(f => {
          const updates = allUpdates.filter(u => u.field_id === f.id);
          const lastUpdate = updates[0] ?? null;
          return {
            ...f,
            status: computeFieldStatus(f, lastUpdate),
            lastUpdate,
          };
        });

        setFields(enriched);
      } catch (err) {
        console.error('Failed to load fields:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filtered = fields.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.crop_type.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Fields</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {fields.length} field{fields.length !== 1 ? 's' : ''} assigned to you.
        </p>
      </div>

      {/* SEARCH */}
      {fields.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search fields..."
            className="w-full pl-9 pr-4 py-2.5 border rounded-lg"
          />
        </div>
      )}

      {/* EMPTY STATE */}
      {fields.length === 0 ? (
        <div className="bg-white rounded-xl border p-20 text-center text-slate-400">
          <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No fields assigned yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center text-slate-400">
          No fields match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(field => (
            <button
              key={field.id}
              onClick={() => onNavigate('field-detail', String(field.id))}
              className="bg-white rounded-xl border p-5 text-left hover:shadow-md transition"
            >
              {/* FIELD NAME & LOCATION */}
              <div className="flex justify-between mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{field.name}</h3>
                  {field.location && (
                    <p className="text-xs text-slate-400 truncate">{field.location}</p>
                  )}
                </div>
                <StatusBadge status={field.status} />
              </div>

              {/* FIELD DETAILS */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Crop</span>
                  <span>{field.crop_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Stage</span>
                  <StageBadge stage={field.current_stage} />
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Planted</span>
                  <span>{new Date(field.planting_date).toLocaleDateString()}</span>
                </div>
              </div>

              {/* LAST UPDATE */}
              <div className="pt-3 mt-3 border-t text-xs text-slate-400">
                {field.lastUpdate
                  ? `Last updated: ${new Date(field.lastUpdate.created_at).toLocaleDateString()}`
                  : 'No updates yet'}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}