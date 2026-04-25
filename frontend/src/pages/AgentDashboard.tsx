import { useEffect, useState } from 'react';
import { MapPin, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';
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
  onLogout: () => void;
}

export function AgentDashboard({ onNavigate, onLogout }: Props) {
  const [fields, setFields] = useState<FieldWithStatus[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<FieldUpdate[]>([]);
  const [loading, setLoading] = useState(true);

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
        const updates: FieldUpdate[] = updatesRes.data;

        const enriched: FieldWithStatus[] = rawFields.map(field => {
          const fieldUpdates = updates.filter(u => u.field_id === field.id);
          const lastUpdate = fieldUpdates[0] ?? null;
          return {
            ...field,
            status: computeFieldStatus(field, lastUpdate),
            lastUpdate,
          };
        });

        setFields(enriched);
        setRecentUpdates(updates.slice(0, 6));
      } catch (error) {
        console.error('Failed to load agent dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const active = fields.filter(f => f.status === 'active').length;
  const atRisk = fields.filter(f => f.status === 'at_risk').length;
  const completed = fields.filter(f => f.status === 'completed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Your assigned fields at a glance.</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<MapPin className="h-5 w-5 text-green-700" />}
          label="My Fields"
          value={fields.length}
          bg="bg-green-50"
        />
        <StatCard
          icon={<Activity className="h-5 w-5 text-blue-700" />}
          label="Active"
          value={active}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          label="At Risk"
          value={atRisk}
          bg="bg-amber-50"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-slate-600" />}
          label="Completed"
          value={completed}
          bg="bg-slate-50"
        />
      </div>

      {/* EMPTY STATE */}
      {fields.length === 0 ? (
        <div className="bg-white rounded-xl border p-16 text-center text-slate-400">
          <MapPin className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No fields assigned yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* FIELDS */}
          <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="font-semibold">Assigned Fields</h2>
            </div>
            <div className="divide-y">
              {fields.slice(0, 6).map(field => (
                <button
                  key={field.id}
                  onClick={() => onNavigate('field-detail', String(field.id))}
                  className="w-full flex justify-between px-6 py-4 hover:bg-slate-50 text-left"
                >
                  <div>
                    <p className="font-medium">{field.name}</p>
                    <p className="text-xs text-slate-500">{field.crop_type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StageBadge stage={field.current_stage} />
                    <StatusBadge status={field.status} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* RECENT UPDATES */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-700" />
              Recent Updates
            </h2>
            {recentUpdates.length === 0 ? (
              <p className="text-sm text-slate-400">No updates yet.</p>
            ) : (
              recentUpdates.map(update => (
                <div key={update.id} className="border-l-2 border-green-200 pl-3 mb-3">
                  <p className="text-sm font-medium">Field #{update.field_id}</p>
                  <p className="text-xs text-slate-400 capitalize">{update.stage}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(update.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, bg }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
}) {
  return (
    <div className={`rounded-xl border p-5 ${bg}`}>
      <div className="flex justify-between mb-2">
        <span className="text-xs font-semibold uppercase text-slate-500">{label}</span>
        {icon}
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}