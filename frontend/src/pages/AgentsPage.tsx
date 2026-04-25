import { useEffect, useState } from 'react';
import { Users, MapPin, Phone, Mail, Home, Plus, X } from 'lucide-react';
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
  phone: string;
  residence: string;
  created_at: string;
  fields: Field[];
}

const emptyForm = {
  full_name: '',
  email: '',
  password: '',
  phone: '',
  residence: '',
};

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem("access");
  const headers = { Authorization: `Bearer ${token}` };

  async function loadAgents() {
    try {
      const res = await API.get("/admin/agents/", { headers });
      setAgents(res.data);
    } catch (err) {
      console.error("Failed to load agents:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAgents(); }, []);

  async function handleRegister() {
    setError('');
    if (!form.full_name || !form.email || !form.password) {
      setError('Full name, email and password are required.');
      return;
    }

    setSubmitting(true);
    try {
      await API.post("/admin/register-agent/", form, { headers });
      setShowModal(false);
      setForm(emptyForm);
      loadAgents(); // refresh list
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to register agent.');
    } finally {
      setSubmitting(false);
    }
  }

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Field Agents</h1>
          <p className="text-slate-500 text-sm mt-1">
            {agents.length} registered agent{agents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus className="h-4 w-4" />
          Register Agent
        </button>
      </div>

      {/* AGENT CARDS */}
      {agents.length === 0 ? (
        <div className="bg-white rounded-xl border p-20 text-center text-slate-400">
          <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No field agents registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(agent => (
            <div key={agent.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition">

              {/* AVATAR + NAME */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-800 text-lg">
                  {agent.full_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{agent.full_name}</p>
                  <p className="text-xs text-slate-400">
                    Joined {new Date(agent.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* DETAILS */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="truncate">{agent.email}</span>
                </div>
                {agent.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="h-4 w-4 text-green-600 shrink-0" />
                    <span>{agent.phone}</span>
                  </div>
                )}
                {agent.residence && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Home className="h-4 w-4 text-green-600 shrink-0" />
                    <span>{agent.residence}</span>
                  </div>
                )}
              </div>

              {/* FIELDS */}
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <span>{agent.fields?.length || 0} field{agent.fields?.length !== 1 ? 's' : ''} assigned</span>
              </div>

              {agent.fields?.length > 0 && (
                <div className="space-y-1">
                  {agent.fields.slice(0, 3).map(field => (
                    <div key={field.id} className="flex items-center gap-2 text-xs bg-slate-50 rounded px-2 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <span className="truncate">{field.name}</span>
                      <span className="text-slate-400">· {field.crop_type}</span>
                    </div>
                  ))}
                  {agent.fields.length > 3 && (
                    <p className="text-xs text-slate-400 pl-2">+{agent.fields.length - 3} more</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* REGISTER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Register New Agent</h2>
              <button onClick={() => { setShowModal(false); setError(''); setForm(emptyForm); }}>
                <X className="h-5 w-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Full Name *', key: 'full_name', type: 'text', placeholder: 'e.g. John Doe' },
                { label: 'Email Address *', key: 'email', type: 'email', placeholder: 'agent@example.com' },
                { label: 'Password *', key: 'password', type: 'password', placeholder: '••••••••' },
                { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+254 700 000 000' },
                { label: 'Residence', key: 'residence', type: 'text', placeholder: 'e.g. Nairobi, Kenya' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
            </div>

            {error && (
              <p className="text-red-500 text-xs mt-3">{error}</p>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowModal(false); setError(''); setForm(emptyForm); }}
                className="flex-1 border rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRegister}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg py-2 text-sm font-medium transition disabled:opacity-50"
              >
                {submitting ? 'Registering...' : 'Register Agent'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}