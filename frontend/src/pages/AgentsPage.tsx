import { useEffect, useState } from 'react';
import { Users, MapPin, Phone, Mail, Home, Plus, X, Search } from 'lucide-react';
import API from '../api/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AdminShell } from '../components/AdminShell';

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

const emptyForm = { full_name: '', email: '', password: '', phone: '', residence: '' };

const AVATAR_COLORS = [
  { bg: '#e8f0fb', color: '#1a5ac2' },
  { bg: '#e8f5ee', color: '#1d6b35' },
  { bg: '#fef3e2', color: '#b56c10' },
  { bg: '#fde8e4', color: '#c0392b' },
  { bg: '#f3effe', color: '#6d28d9' },
  { bg: '#fef9e7', color: '#b7770d' },
];

function initials(name: string) {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
}

interface Props {
  onNavigate: (page: string, fieldId?: string) => void;
  onLogout: () => void;
  user: any;
  openIssuesCount: number;
}

export function AgentsPage({ onNavigate, onLogout, user, openIssuesCount }: Props) {
  const [agents, setAgents]       = useState<Agent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState<Agent | null>(null);

  const token = localStorage.getItem('access');
  const headers = { Authorization: `Bearer ${token}` };

  async function loadAgents() {
    try {
      const res = await API.get('/admin/agents/', { headers });
      setAgents(res.data);
    } catch (err) {
      console.error('Failed to load agents:', err);
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
      await API.post('/admin/register-agent/', form, { headers });
      setShowModal(false);
      setForm(emptyForm);
      loadAgents();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to register agent.');
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = agents.filter(a =>
    a.full_name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    (a.residence ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#eef0eb' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <AdminShell activePage="agents" onNavigate={onNavigate} onLogout={onLogout} user={user} openIssuesCount={openIssuesCount}>


      {/* Body: agent grid + detail panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>

        {/* Action row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search agents..."
              style={{ paddingLeft: 28, paddingRight: 12, paddingTop: 6, paddingBottom: 6, borderRadius: 8, border: '0.5px solid #ddd', fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: 'none', width: 180 }}
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, background: '#1d6b35', color: '#fff', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
          >
            <Plus size={13} /> Register Agent
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', gap: 10, minHeight: 0 }}>
        </div>

        {/* Agent Grid */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa' }}>
              <Users size={36} style={{ opacity: 0.2, marginBottom: 8 }} />
              <p style={{ fontSize: 13 }}>No agents found</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {filtered.map((agent, idx) => {
                const col = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                const isSelected = selected?.id === agent.id;
                return (
                  <div
                    key={agent.id}
                    onClick={() => setSelected(isSelected ? null : agent)}
                    style={{
                      background: '#fff', borderRadius: 12, padding: 16, cursor: 'pointer',
                      border: isSelected ? '1.5px solid #1d6b35' : '0.5px solid #e8eae4',
                      transition: 'box-shadow 0.15s, border 0.15s',
                      boxShadow: isSelected ? '0 0 0 3px rgba(29,107,53,0.08)' : 'none',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    {/* Avatar + name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: col.bg, color: col.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                        {initials(agent.full_name)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.full_name}</p>
                        <p style={{ fontSize: 10.5, color: '#aaa' }}>Joined {new Date(agent.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Contact */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: '#555' }}>
                        <Mail size={11} color="#1d6b35" />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.email}</span>
                      </div>
                      {agent.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: '#555' }}>
                          <Phone size={11} color="#1d6b35" /> {agent.phone}
                        </div>
                      )}
                      {agent.residence && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: '#555' }}>
                          <Home size={11} color="#1d6b35" /> {agent.residence}
                        </div>
                      )}
                    </div>

                    {/* Fields count */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#555' }}>
                        <MapPin size={11} color="#1d6b35" />
                        {agent.fields?.length || 0} field{agent.fields?.length !== 1 ? 's' : ''} assigned
                      </div>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2d7a45' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ width: 260, background: '#fff', borderRadius: 12, padding: 18, flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Agent Details</p>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa' }}><X size={15} /></button>
            </div>

            {/* Big avatar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              {(() => {
                const idx = filtered.findIndex(a => a.id === selected.id);
                const col = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                return (
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: col.bg, color: col.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>
                    {initials(selected.full_name)}
                  </div>
                );
              })()}
              <p style={{ fontSize: 14, fontWeight: 700, color: '#111', textAlign: 'center' }}>{selected.full_name}</p>
              <p style={{ fontSize: 11, color: '#aaa' }}>Joined {new Date(selected.created_at).toLocaleDateString()}</p>
            </div>

            {/* Contact info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: <Mail size={13} color="#1d6b35" />, label: 'Email', val: selected.email },
                { icon: <Phone size={13} color="#1d6b35" />, label: 'Phone', val: selected.phone || '—' },
                { icon: <Home size={13} color="#1d6b35" />, label: 'Location', val: selected.residence || '—' },
              ].map(({ icon, label, val }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flexShrink: 0, marginTop: 1 }}>{icon}</div>
                  <div>
                    <p style={{ fontSize: 10, color: '#aaa', fontWeight: 500 }}>{label}</p>
                    <p style={{ fontSize: 12, color: '#333' }}>{val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Assigned fields */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#111', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={12} color="#1d6b35" /> Assigned Fields
              </p>
              {selected.fields?.length === 0 ? (
                <p style={{ fontSize: 11.5, color: '#aaa' }}>No fields assigned yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selected.fields?.map(field => (
                    <div key={field.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#f8faf8', borderRadius: 7 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2d7a45', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 500, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{field.name}</p>
                        <p style={{ fontSize: 10.5, color: '#888' }}>{field.crop_type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── REGISTER MODAL ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: '#111' }}>Register New Agent</h2>
              <button onClick={() => { setShowModal(false); setError(''); setForm(emptyForm); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Full Name *', key: 'full_name', type: 'text', placeholder: 'e.g. John Doe' },
                { label: 'Email Address *', key: 'email', type: 'email', placeholder: 'agent@example.com' },
                { label: 'Password *', key: 'password', type: 'password', placeholder: '••••••••' },
                { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+254 700 000 000' },
                { label: 'Residence', key: 'residence', type: 'text', placeholder: 'e.g. Nairobi, Kenya' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#666', marginBottom: 5 }}>{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={(form as any)[key]}
                    onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    style={{ width: '100%', border: '0.5px solid #ddd', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
            </div>
            {error && <p style={{ color: '#e85d3a', fontSize: 11.5, marginTop: 10 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => { setShowModal(false); setError(''); setForm(emptyForm); }} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '0.5px solid #ddd', background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", color: '#555' }}>
                Cancel
              </button>
              <button onClick={handleRegister} disabled={submitting} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: '#1d6b35', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Registering…' : 'Register Agent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}