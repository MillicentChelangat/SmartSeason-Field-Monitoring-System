import { useEffect, useState } from 'react';
import { FileText, Download, MapPin, Users, ChevronDown, ChevronUp } from 'lucide-react';
import API from '../api/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AdminShell } from '../components/AdminShell';
import { StageBadge } from '../components/StageBadge';
import { StatusBadge } from '../components/StatusBadge';

interface Props {
  onNavigate: (page: string, fieldId?: string) => void;
  onLogout: () => void;
  user: any;
  openIssuesCount: number;
}

type Tab = 'fields' | 'agents';

const STAGE_COLORS: Record<string, string> = {
  planted: '#e8a020', growing: '#1a5ac2', ready: '#2d7a45', harvested: '#888',
};

const AVATAR_COLORS = [
  { bg: '#e8f0fb', color: '#1a5ac2' },
  { bg: '#e8f5ee', color: '#1d6b35' },
  { bg: '#fef3e2', color: '#b56c10' },
  { bg: '#fde8e4', color: '#c0392b' },
  { bg: '#f0f2ee', color: '#555555' },
];

function initials(name: string) {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
}

function downloadCSV(filename: string, rows: string[][], headers: string[]) {
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage({ onNavigate, onLogout, user, openIssuesCount }: Props) {
  const [fields, setFields]     = useState<any[]>([]);
  const [updates, setUpdates]   = useState<any[]>([]);
  const [agents, setAgents]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<Tab>('fields');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [fRes, uRes, aRes] = await Promise.all([
          API.get('fields/'),
          API.get('field-updates/'),
          API.get('agents/'),
        ]);
        setFields(fRes.data);
        setUpdates(uRes.data);
        setAgents(aRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#eef0eb' }}>
      <LoadingSpinner size="lg" />
    </div>
  );

  const enrichedFields = fields.map(f => ({
    ...f,
    status: f.status,
    updateCount: updates.filter(u => u.field_id === f.id).length,
    lastUpdate: updates.filter(u => u.field_id === f.id)[0] ?? null,
    agentName: agents.find(a => a.user_id === f.assigned_agent_id)?.full_name ?? 'Unassigned',
  }));

  const enrichedAgents = agents.map(a => ({
    ...a,
    updateCount: updates.filter(u => u.agent_id === a.user_id).length,
    fieldCount: fields.filter(f => f.assigned_agent_id === a.user_id).length,
    lastActivity: updates.filter(u => u.agent_id === a.user_id)[0] ?? null,
  }));

  function exportFieldsCSV() {
    const headers = ['Field Name','Crop Type','Location','Stage','Status','Agent','Updates','Planting Date'];
    const rows = enrichedFields.map(f => [f.name, f.crop_type, f.location ?? '', f.current_stage, f.status, f.agentName, String(f.updateCount), f.planting_date ?? '']);
    downloadCSV('smartseason-fields-report.csv', rows, headers);
  }

  function exportAgentsCSV() {
    const headers = ['Agent Name','Email','Phone','Residence','Fields Assigned','Updates Submitted','Joined'];
    const rows = enrichedAgents.map(a => [a.full_name, a.email, a.phone ?? '', a.residence ?? '', String(a.fieldCount), String(a.updateCount), new Date(a.created_at).toLocaleDateString()]);
    downloadCSV('smartseason-agents-report.csv', rows, headers);
  }

  return (
    <>
      <style>{`
        .reports-table-header {
          display: grid;
          padding: 10px 16px;
          border-bottom: 1px solid #f0f2ee;
          background: #fafbf9;
        }
        .reports-table-header.fields-cols {
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 32px;
        }
        .reports-table-header.agents-cols {
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 32px;
        }
        .reports-table-row {
          display: grid;
          padding: 11px 16px;
          border-bottom: 1px solid #f5f6f4;
          cursor: pointer;
          transition: background 0.12s;
          align-items: center;
        }
        .reports-table-row.fields-cols {
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 32px;
        }
        .reports-table-row.agents-cols {
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 32px;
        }
        .reports-table-row:hover { background: #fafbf9; }
        .reports-th {
          font-size: 10.5px;
          font-weight: 600;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        /* Mobile field card */
        .report-card {
          background: #fff;
          border-radius: 12px;
          border: 1px solid #e8ede8;
          margin-bottom: 10px;
          overflow: hidden;
        }
        .report-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          cursor: pointer;
        }
        .report-card-body {
          padding: 0 16px 14px;
          border-top: 1px solid #f3f4f6;
          background: #fafcfa;
        }
        .report-card-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
          font-size: 12.5px;
        }
        .report-card-row:last-child { border-bottom: none; }
        .report-card-label { color: #9ca3af; font-size: 11.5px; }
        .report-card-value { color: #111; font-weight: 500; font-size: 12.5px; }
      `}</style>

      <AdminShell activePage="reports" onNavigate={onNavigate} onLogout={onLogout} user={user} openIssuesCount={openIssuesCount}>

        {/* Tabs + Export */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>     
          {([['fields', 'Field Reports', <MapPin size={13} />], ['agents', 'Agent Reports', <Users size={13} />]] as const).map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => { setTab(id as Tab); setExpanded(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 9,
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                background: tab === id ? '#1d6b35' : '#fff',
                color: tab === id ? '#fff' : '#555',
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: tab === id ? '0 2px 8px rgba(29,107,53,0.25)' : 'none',
                border: tab === id ? 'none' : '1px solid #e8ede8',
                } as any}
            >
              {icon} {label}
              <span style={{ background: tab === id ? 'rgba(255,255,255,0.25)' : '#f0f2ee', color: tab === id ? '#fff' : '#888', fontSize: 10.5, fontWeight: 600, padding: '1px 7px', borderRadius: 10 }}>
                {id === 'fields' ? fields.length : agents.length}
              </span>
            </button>
          ))}
          </div>
          <button
            onClick={tab === 'fields' ? exportFieldsCSV : exportAgentsCSV}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#1d6b35', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
          >
            <Download size={13} />
            {!isMobile && ' Export CSV'}
          </button>
        </div>

        {/* ── MOBILE VIEW — cards ── */}
        {isMobile ? (
          <div>
            {tab === 'fields' ? (
              enrichedFields.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 12, padding: '40px 20px', textAlign: 'center', border: '1px solid #e8ede8' }}>
                  <MapPin size={28} style={{ color: '#d1d5db', margin: '0 auto 8px', display: 'block' }} />
                  <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>No fields yet.</p>
                </div>
              ) : enrichedFields.map(field => (
                <div key={field.id} className="report-card">
                  <div className="report-card-header" onClick={() => setExpanded(expanded === String(field.id) ? null : String(field.id))}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: '#f0f7f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MapPin size={15} color="#1d6b35" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{field.name}</p>
                        <p style={{ fontSize: 11.5, color: '#9ca3af', margin: 0, marginTop: 2 }}>{field.crop_type}{field.location ? ` · ${field.location}` : ''}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 10 }}>
                      <StageBadge stage={field.current_stage} />
                      {expanded === String(field.id) ? <ChevronUp size={15} color="#9ca3af" /> : <ChevronDown size={15} color="#9ca3af" />}
                    </div>
                  </div>

                  {expanded === String(field.id) && (
                    <div className="report-card-body">
                      <div className="report-card-row">
                        <span className="report-card-label">Status</span>
                        <StatusBadge status={field.status} />
                      </div>
                      <div className="report-card-row">
                        <span className="report-card-label">Agent</span>
                        <span className="report-card-value">{field.agentName}</span>
                      </div>
                      <div className="report-card-row">
                        <span className="report-card-label">Updates</span>
                        <span className="report-card-value">{field.updateCount}</span>
                      </div>
                      <div className="report-card-row">
                        <span className="report-card-label">Planting Date</span>
                        <span className="report-card-value">{field.planting_date ? new Date(field.planting_date).toLocaleDateString() : '—'}</span>
                      </div>
                      {/* Update history */}
                      {updates.filter(u => u.field_id === field.id).length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Update History</p>
                          {updates.filter(u => u.field_id === field.id).slice(0, 4).map(u => (
                            <div key={u.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                              <div style={{ width: 7, height: 7, borderRadius: '50%', background: STAGE_COLORS[u.stage] ?? '#888', flexShrink: 0, marginTop: 4 }} />
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 12, color: '#374151', margin: 0 }}><strong>{u.agent_name ?? 'Agent'}</strong> → {u.stage}</p>
                                {u.notes && <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0', fontStyle: 'italic' }}>"{u.notes}"</p>}
                                <p style={{ fontSize: 10.5, color: '#9ca3af', margin: '2px 0 0' }}>{new Date(u.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              enrichedAgents.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 12, padding: '40px 20px', textAlign: 'center', border: '1px solid #e8ede8' }}>
                  <Users size={28} style={{ color: '#d1d5db', margin: '0 auto 8px', display: 'block' }} />
                  <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>No agents yet.</p>
                </div>
              ) : enrichedAgents.map((agent, idx) => {
                const col = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                return (
                  <div key={agent.id} className="report-card">
                    <div className="report-card-header" onClick={() => setExpanded(expanded === agent.id ? null : agent.id)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: col.bg, color: col.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                          {initials(agent.full_name)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.full_name}</p>
                          <p style={{ fontSize: 11.5, color: '#9ca3af', margin: 0, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.email}</p>
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, marginLeft: 10 }}>
                        {expanded === agent.id ? <ChevronUp size={15} color="#9ca3af" /> : <ChevronDown size={15} color="#9ca3af" />}
                      </div>
                    </div>

                    {expanded === agent.id && (
                      <div className="report-card-body">
                        <div className="report-card-row">
                          <span className="report-card-label">Fields Assigned</span>
                          <span className="report-card-value">{agent.fieldCount}</span>
                        </div>
                        <div className="report-card-row">
                          <span className="report-card-label">Updates Submitted</span>
                          <span className="report-card-value">{agent.updateCount}</span>
                        </div>
                        <div className="report-card-row">
                          <span className="report-card-label">Last Active</span>
                          <span className="report-card-value">{agent.lastActivity ? new Date(agent.lastActivity.created_at).toLocaleDateString() : '—'}</span>
                        </div>
                        <div className="report-card-row">
                          <span className="report-card-label">Residence</span>
                          <span className="report-card-value">{agent.residence || '—'}</span>
                        </div>
                        {/* Assigned fields */}
                        {fields.filter(f => f.assigned_agent_id === agent.user_id).length > 0 && (
                          <div style={{ marginTop: 10 }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Assigned Fields</p>
                            {fields.filter(f => f.assigned_agent_id === agent.user_id).map(f => (
                              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <div style={{ width: 7, height: 7, borderRadius: '50%', background: STAGE_COLORS[f.current_stage] ?? '#888', flexShrink: 0 }} />
                                <span style={{ fontSize: 12.5, color: '#374151', fontWeight: 500 }}>{f.name}</span>
                                <span style={{ fontSize: 11.5, color: '#9ca3af' }}>{f.crop_type}</span>
                                <StageBadge stage={f.current_stage} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* ── DESKTOP VIEW — table ── */
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ede8', overflow: 'hidden' }}>

            {/* Table header */}
            <div className={`reports-table-header ${tab === 'fields' ? 'fields-cols' : 'agents-cols'}`}>
              {(tab === 'fields'
                ? ['Field','Crop','Stage','Status','Agent','Updates']
                : ['Agent','Email','Fields','Updates','Last Active']
              ).map(h => <span key={h} className="reports-th">{h}</span>)}
              <span />
            </div>

            <div>
              {tab === 'fields' ? (
                enrichedFields.length === 0 ? (
                  <div style={{ padding: '48px 20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No fields yet.</div>
                ) : enrichedFields.map(field => (
                  <div key={field.id}>
                    <div
                      className="reports-table-row fields-cols"
                      onClick={() => setExpanded(expanded === String(field.id) ? null : String(field.id))}
                      style={{ background: expanded === String(field.id) ? '#fafbf9' : '#fff' }}
                    >
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#111', margin: 0 }}>{field.name}</p>
                        <p style={{ fontSize: 11, color: '#aaa', margin: '2px 0 0' }}>{field.location || '—'}</p>
                      </div>
                      <span style={{ fontSize: 12.5, color: '#555' }}>{field.crop_type}</span>
                      <div><StageBadge stage={field.current_stage} /></div>
                      <div><StatusBadge status={field.status} /></div>
                      <span style={{ fontSize: 12.5, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{field.agentName}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{field.updateCount}</span>
                      <div>{expanded === String(field.id) ? <ChevronUp size={14} color="#aaa" /> : <ChevronDown size={14} color="#aaa" />}</div>
                    </div>
                    {expanded === String(field.id) && (
                      <div style={{ background: '#f8faf8', borderBottom: '1px solid #f0f2ee', padding: '12px 16px 12px 32px' }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#888', margin: '0 0 8px' }}>Update History</p>
                        {updates.filter(u => u.field_id === field.id).length === 0 ? (
                          <p style={{ fontSize: 12, color: '#aaa', margin: 0 }}>No updates recorded.</p>
                        ) : updates.filter(u => u.field_id === field.id).slice(0, 5).map(u => (
                          <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: STAGE_COLORS[u.stage] ?? '#888', flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: '#555' }}><strong>{u.agent_name ?? 'Agent'}</strong> → {u.stage}</span>
                            {u.notes && <span style={{ fontSize: 11, color: '#aaa', fontStyle: 'italic' }}>"{u.notes}"</span>}
                            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#aaa' }}>{new Date(u.created_at).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                enrichedAgents.length === 0 ? (
                  <div style={{ padding: '48px 20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No agents yet.</div>
                ) : enrichedAgents.map((agent, idx) => {
                  const col = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  return (
                    <div key={agent.id}>
                      <div
                        className="reports-table-row agents-cols"
                        onClick={() => setExpanded(expanded === agent.id ? null : agent.id)}
                        style={{ background: expanded === agent.id ? '#fafbf9' : '#fff' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: col.bg, color: col.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, flexShrink: 0 }}>
                            {initials(agent.full_name)}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 500, color: '#111', margin: 0 }}>{agent.full_name}</p>
                            <p style={{ fontSize: 11, color: '#aaa', margin: '2px 0 0' }}>{agent.residence || '—'}</p>
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.email}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{agent.fieldCount}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{agent.updateCount}</span>
                        <span style={{ fontSize: 12, color: '#888' }}>{agent.lastActivity ? new Date(agent.lastActivity.created_at).toLocaleDateString() : '—'}</span>
                        <div>{expanded === agent.id ? <ChevronUp size={14} color="#aaa" /> : <ChevronDown size={14} color="#aaa" />}</div>
                      </div>
                      {expanded === agent.id && (
                        <div style={{ background: '#f8faf8', borderBottom: '1px solid #f0f2ee', padding: '12px 16px 12px 32px' }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: '#888', margin: '0 0 8px' }}>Assigned Fields</p>
                          {fields.filter(f => f.assigned_agent_id === agent.user_id).length === 0 ? (
                            <p style={{ fontSize: 12, color: '#aaa', margin: 0 }}>No fields assigned.</p>
                          ) : fields.filter(f => f.assigned_agent_id === agent.user_id).map(f => (
                            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                              <div style={{ width: 7, height: 7, borderRadius: '50%', background: STAGE_COLORS[f.current_stage] ?? '#888', flexShrink: 0 }} />
                              <span style={{ fontSize: 12.5, color: '#374151', fontWeight: 500 }}>{f.name}</span>
                              <span style={{ fontSize: 12, color: '#aaa' }}>{f.crop_type}</span>
                              <StageBadge stage={f.current_stage} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </AdminShell>
    </>
  );
}