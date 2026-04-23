import { useEffect, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import API from '../api/api';
import type { Field, FieldUpdate } from '../types/database';
import { computeFieldStatus } from '../lib/fieldStatus';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

interface FieldWithStatus extends Field {
  status: ReturnType<typeof computeFieldStatus>;
  lastUpdate?: FieldUpdate | null;
  daysSincePlanting: number;
}

interface Props {
  onNavigate: (page: string, fieldId?: string) => void;
}

export function MyFieldsPage({ onNavigate }: Props) {
  const { user } = useAuth();

  const [fields, setFields] = useState<FieldWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      if (!user) return;

      try {
        const token = localStorage.getItem('access');

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // 1. Get assigned fields from backend
        const assignmentsRes = await API.get('/agent/field-ids/', { headers });
        const fieldIds: string[] = assignmentsRes.data;

        if (!fieldIds.length) {
          setLoading(false);
          return;
        }

        // 2. Get fields + updates
        const [fieldsRes, updatesRes] = await Promise.all([
          API.post('/fields/by-ids/', { ids: fieldIds }, { headers }),
          API.post('/field-updates/by-ids/', { ids: fieldIds }, { headers }),
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
            daysSincePlanting: Math.floor(
              (Date.now() - new Date(f.planting_date).getTime()) /
              (1000 * 60 * 60 * 24)
            ),
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
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const filtered = fields.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.crop_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

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
              onClick={() => onNavigate('field-detail', field.id)}
              className="bg-white rounded-xl border p-5 text-left hover:shadow-md transition"
            >
              <div className="flex justify-between mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{field.name}</h3>
                  {field.location && (
                    <p className="text-xs text-slate-400 truncate">
                      {field.location}
                    </p>
                  )}
                </div>

                <StatusBadge status={field.status} />
              </div>

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
                  <span className="text-slate-500">Days</span>
                  <span>{field.daysSincePlanting}d</span>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t text-xs text-slate-400">
                {field.lastUpdate
                  ? `Last updated ${Math.floor(
                      (Date.now() -
                        new Date(field.lastUpdate.created_at).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )} days ago`
                  : 'No updates yet'}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}