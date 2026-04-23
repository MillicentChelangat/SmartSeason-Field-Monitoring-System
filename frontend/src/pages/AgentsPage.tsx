import { useEffect, useState } from 'react';
import { Users, MapPin } from 'lucide-react';
import API from '../api/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface Field {
  id: string;
  name: string;
  crop_type: string;
}

interface Agent {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  fields: Field[];
}

interface AgentWithFields extends Agent {
  fieldCount: number;
}

export function AgentsPage() {
  const [agents, setAgents] = useState<AgentWithFields[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("access");

        const res = await API.get("/admin/agents/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const rawAgents: Agent[] = res.data;

        const enriched: AgentWithFields[] = rawAgents.map(agent => ({
          ...agent,
          fieldCount: agent.fields?.length || 0,
        }));

        setAgents(enriched);
      } catch (err) {
        console.error("Failed to load agents:", err);
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Field Agents</h1>
        <p className="text-slate-500 text-sm mt-1">
          {agents.length} registered agent{agents.length !== 1 ? 's' : ''}
        </p>
      </div>

      {agents.length === 0 ? (
        <div className="bg-white rounded-xl border p-20 text-center text-slate-400">
          <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No field agents registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {agents.map(agent => (
            <div
              key={agent.id}
              className="bg-white rounded-xl border p-5 hover:shadow-md transition"
            >

              {/* HEADER */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-800">
                  {agent.full_name?.charAt(0).toUpperCase()}
                </div>

                <div>
                  <p className="font-semibold text-slate-900">
                    {agent.full_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {agent.email}
                  </p>
                </div>
              </div>

              {/* FIELD COUNT */}
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                <MapPin className="h-4 w-4 text-green-600" />
                <span>
                  {agent.fieldCount} field{agent.fieldCount !== 1 ? 's' : ''} assigned
                </span>
              </div>

              {/* FIELDS LIST */}
              {agent.fields?.length > 0 && (
                <div className="space-y-1">
                  {agent.fields.slice(0, 3).map(field => (
                    <div
                      key={field.id}
                      className="flex items-center gap-2 text-xs bg-slate-50 rounded px-2 py-1"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <span className="truncate">{field.name}</span>
                      <span className="text-slate-400">
                        · {field.crop_type}
                      </span>
                    </div>
                  ))}

                  {agent.fields.length > 3 && (
                    <p className="text-xs text-slate-400 pl-2">
                      +{agent.fields.length - 3} more
                    </p>
                  )}
                </div>
              )}

              {/* FOOTER */}
              <div className="mt-3 pt-3 border-t text-xs text-slate-400">
                Joined {new Date(agent.created_at).toLocaleDateString()}
              </div>

            </div>
          ))}

        </div>
      )}
    </div>
  );
}