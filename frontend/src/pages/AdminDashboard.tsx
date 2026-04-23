import { useEffect, useState } from 'react';
import { MapPin, Users, TrendingUp, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';
import API from "../api/api.ts";

import type { Field, FieldUpdate, Profile } from '../types/database';
import { computeFieldStatus } from '../lib/fieldStatus';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface FieldWithStatus extends Field {
  status: ReturnType<typeof computeFieldStatus>;
  lastUpdate?: FieldUpdate | null;
  assignedAgents: Profile[];
}

interface Props {
  onNavigate: (page: string, fieldId?: string) => void;
}

export function AdminDashboard({ onNavigate }: Props) {
  const [fields, setFields] = useState<FieldWithStatus[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<FieldUpdate[]>([]);
  const [agentCount, setAgentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [fieldsRes, updatesRes, agentsRes] = await Promise.all([
          API.get("fields/"),
          API.get("field-updates/"),
          API.get("agents/")
        ]);

        const rawFields: Field[] = fieldsRes.data;
        const allUpdates: FieldUpdate[] = updatesRes.data;
        const agents: Profile[] = agentsRes.data;

        const enriched: FieldWithStatus[] = rawFields.map(field => {
          const fieldUpdates = allUpdates.filter(u => u.field_id === field.id);
          const lastUpdate = fieldUpdates[0] ?? null;

          return {
            ...field,
            status: computeFieldStatus(field, lastUpdate),
            lastUpdate,
            assignedAgents: []
          };
        });

        setFields(enriched);
        setRecentUpdates(allUpdates);
        setAgentCount(agents.length);

      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const active = fields.filter(f => f.status === 'active').length;
  const atRisk = fields.filter(f => f.status === 'at_risk').length;
  const completed = fields.filter(f => f.status === 'completed').length;

  const stageBreakdown = {
    planted: fields.filter(f => f.current_stage === 'planted').length,
    growing: fields.filter(f => f.current_stage === 'growing').length,
    ready: fields.filter(f => f.current_stage === 'ready').length,
    harvested: fields.filter(f => f.current_stage === 'harvested').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Overview Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Monitor all fields and agent activity.
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<MapPin className="h-5 w-5 text-green-700" />} label="Total Fields" value={fields.length} bg="bg-green-50" />
        <StatCard icon={<Users className="h-5 w-5 text-blue-700" />} label="Field Agents" value={agentCount} bg="bg-blue-50" />
        <StatCard icon={<AlertTriangle className="h-5 w-5 text-amber-600" />} label="At Risk" value={atRisk} bg="bg-amber-50" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5 text-slate-600" />} label="Completed" value={completed} bg="bg-slate-50" />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* FIELDS */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">All Fields</h2>
            <button onClick={() => onNavigate('fields')} className="text-sm text-green-700 hover:text-green-800 font-medium">
              Manage fields
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {fields.slice(0, 6).map(field => (
              <button
                key={field.id}
                onClick={() => onNavigate('field-detail', field.id)}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{field.name}</p>
                  <p className="text-xs text-slate-500">
                    {field.crop_type} {field.location ? `· ${field.location}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <StageBadge stage={field.current_stage} />
                  <StatusBadge status={field.status} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* SIDE PANEL */}
        <div className="space-y-6">

          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-700" />
              Status Breakdown
            </h2>

            <StatusBar label="Active" count={active} total={fields.length} color="bg-emerald-500" />
            <StatusBar label="At Risk" count={atRisk} total={fields.length} color="bg-amber-400" />
            <StatusBar label="Completed" count={completed} total={fields.length} color="bg-slate-400" />
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Stage Distribution</h2>

            {Object.entries(stageBreakdown).map(([stage, count]) => (
              <div key={stage} className="flex justify-between text-sm mb-1">
                <span className="capitalize text-slate-600">{stage}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b">
          <Activity className="h-4 w-4 text-green-700" />
          <h2 className="font-semibold">Recent Activity</h2>
        </div>

        <div className="divide-y">
          {recentUpdates.length === 0 && (
            <div className="p-6 text-sm text-slate-400 text-center">
              No updates recorded yet.
            </div>
          )}

          {recentUpdates.map(update => (
            <div key={update.id} className="px-6 py-3">
              <p className="text-sm">
                <span className="font-medium">Agent</span> updated a field
              </p>
              <p className="text-xs text-slate-400">
                {new Date(update.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* UI COMPONENTS */
function StatCard({ icon, label, value, bg }: any) {
  return (
    <div className={`p-5 rounded-xl border ${bg}`}>
      <div className="flex justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase">{label}</span>
        {icon}
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function StatusBar({ label, count, total, color }: any) {
  const pct = total ? (count / total) * 100 : 0;

  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{count}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded">
        <div className={`h-1.5 rounded ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}