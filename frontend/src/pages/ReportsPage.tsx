import { useEffect, useState } from 'react';
import { FileText, Download, MapPin, Users, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import API from '../api/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AdminShell } from '../components/AdminShell';
import { computeFieldStatus } from '../lib/fieldStatus';
import { StageBadge } from '../components/StageBadge';
import { StatusBadge } from '../components/StatusBadge';

interface Props {
  onNavigate: (page: string, fieldId?: string) => void;
  onLogout: () => void;
  user: any;
}

type Tab = 'fields' | 'agents';

function downloadCSV(filename: string, rows: string[][], headers: string[]) {
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage({ onNavigate, onLogout, user }: Props) {
  const [fields, setFields]   = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [agents, setAgents]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<Tab>('fields');
  const [expanded, setExpanded] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#eef0eb' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const enrichedFields = fields.map(f => ({
    ...f,
    status: computeFieldStatus(f, updates.filter(u => u.field_id === f.id)[0] ?? null),
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
    const headers = ['Field Name', 'Crop Type', 'Location', 'Stage', 'Status', 'Agent', 'Updates', 'Planting Date'];
    const rows = enrichedFields.map(f => [
      f.name, f.crop_type, f.location ?? '', f.current_stage, f.status,
      f.agentName, String(f.updateCount), f.planting_date ?? '',
    ]);
    downloadCSV('smartseason-fields-report.csv', rows, headers);
  }

  function exportAgentsCSV() {
    const headers = ['Agent Name', 'Email', 'Phone', 'Residence', 'Fields Assigned', 'Updates Submitted', 'Joined'];
    const rows = enrichedAgents.map(a => [
      a.full_name, a.email, a.phone ?? '', a.residence ?? '',
      String(a.fieldCount), String(a.updateCount),
      new Date(a.created_at).toLocaleDateString(),
    ]);
    downloadCSV('smartseason-agents-report.csv', rows, headers);
  }

  const STAGE_COLORS: Record<string, string> = {
    planted: '#e8a020', growing: '#1a5ac2', ready: '#2d7a45', harvested: '#888',
  };

  return (
    <AdminShell activePage="reports" onNavigate={onNavigate} onLogout={onLogout} user={user}>

      {/* Topbar */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '0 18px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, marginBottom: 10 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: '#111' }}>Reports</h1>
          <p style={{ fontSize: 11, color: '#888', marginTop: 1 }}>View and export field & agent reports</p>
        </div>
        <button
          onClick={tab === 'fields' ? exportFieldsCSV : exportAgentsCSV}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, background: '#1d6b35', color: '#fff', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
        >
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {([['fields', 'Field Reports', <MapPin size={13} />], ['agents', 'Agent Reports', <Users size={13} />]] as const).map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setTab(id as Tab)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: 'none',
                background: tab === id ? '#1d6b35' : '#fff',
                color: tab === id ? '#fff' : '#555',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {icon} {label}
              <span style={{ background: tab === id ? 'rgba(255,255,255,0.25)' : '#f0f2ee', color: tab === id ? '#fff' : '#888', fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 10 }}>
                {id === 'fields' ? fields.length : agents.length}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ flex: 1, background: '#fff', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: tab === 'fields' ? '2fr 1fr 1fr 1fr 1fr 1fr 32px' : '2fr 1fr 1fr 1fr 1fr 32px', gap: 0, padding: '10px 16px', borderBottom: '0.5px solid #f0f2ee', background: '#fafbf9' }}>
            {(tab === 'fields'
              ? ['Field', 'Crop', 'Stage', 'Status', 'Agent', 'Updates']
              : ['Agent', 'Email', 'Fields', 'Updates', 'Last Active']
            ).map(h => (
              <span key={h} style={{ fontSize: 10.5, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.4 }}>{h}</span>
            ))}
            <span />
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {tab === 'fields' ? (
              enrichedFields.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa', fontSize: 13 }}>No fields yet.</div>
              ) : enrichedFields.map((field, idx) => (
                <div key={field.id}>
                  <div
                    onClick={() => setExpanded(expanded === String(field.id) ? null : String(field.id))}
                    style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 32px', gap: 0, padding: '10px 16px', borderBottom: '0.5px solid #f5f6f4', cursor: 'pointer', background: expanded === String(field.id) ? '#fafbf9' : '#fff' }}
                    onMouseEnter={e => { if (expanded !== String(field.id)) e.currentTarget.style.background = '#fafbf9'; }}
                    onMouseLeave={e => { if (expanded !== String(field.id)) e.currentTarget.style.background = '#fff'; }}
                  >
                    <div>
                      <p style={{ fontSize: 12.5, fontWeight: 500, color: '#111' }}>{field.name}</p>
                      <p style={{ fontSize: 10.5, color: '#aaa', marginTop: 1 }}>{field.location || '—'}</p>
                    </div>
                    <span style={{ fontSize: 12, color: '#555', alignSelf: 'center' }}>{field.crop_type}</span>
                    <div style={{ alignSelf: 'center' }}><StageBadge stage={field.current_stage} /></div>
                    <div style={{ alignSelf: 'center' }}><StatusBadge status={field.status} /></div>
                    <span style={{ fontSize: 12, color: '#555', alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{field.agentName}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#111', alignSelf: 'center' }}>{field.updateCount}</span>
                    <div style={{ alignSelf: 'center' }}>
                      {expanded === String(field.id) ? <ChevronUp size={14} color="#aaa" /> : <ChevronDown size={14} color="#aaa" />}
                    </div>
                  </div>

                  {/* Expanded: field updates */}
                  {expanded === String(field.id) && (
                    <div style={{ background: '#f8faf8', borderBottom: '0.5px solid #f0f2ee', padding: '10px 16px 10px 32px' }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 8 }}>Update History</p>
                      {updates.filter(u => u.field_id === field.id).length === 0 ? (
                        <p style={{ fontSize: 11.5, color: '#aaa' }}>No updates recorded.</p>
                      ) : (
                        updates.filter(u => u.field_id === field.id).slice(0, 5).map(u => (
                          <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: STAGE_COLORS[u.stage] ?? '#888', flexShrink: 0 }} />
                            <span style={{ fontSize: 11.5, color: '#555' }}><strong>{u.agent_name ?? 'Agent'}</strong> → {u.stage}</span>
                            {u.notes && <span style={{ fontSize: 11, color: '#aaa', fontStyle: 'italic' }}>"{u.notes}"</span>}
                            <span style={{ marginLeft: 'auto', fontSize: 10.5, color: '#aaa' }}>{new Date(u.created_at).toLocaleDateString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              enrichedAgents.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa', fontSize: 13 }}>No agents yet.</div>
              ) : enrichedAgents.map(agent => (
                <div key={agent.id}>
                  <div
                    onClick={() => setExpanded(expanded === agent.id ? null : agent.id)}
                    style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 32px', gap: 0, padding: '10px 16px', borderBottom: '0.5px solid #f5f6f4', cursor: 'pointer', background: expanded === agent.id ? '#fafbf9' : '#fff' }}
                    onMouseEnter={e => { if (expanded !== agent.id) e.currentTarget.style.background = '#fafbf9'; }}
                    onMouseLeave={e => { if (expanded !== agent.id) e.currentTarget.style.background = '#fff'; }}
                  >
                    <div>
                      <p style={{ fontSize: 12.5, fontWeight: 500, color: '#111' }}>{agent.full_name}</p>
                      <p style={{ fontSize: 10.5, color: '#aaa', marginTop: 1 }}>{agent.residence || '—'}</p>
                    </div>
                    <span style={{ fontSize: 11.5, color: '#555', alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.email}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#111', alignSelf: 'center' }}>{agent.fieldCount}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#111', alignSelf: 'center' }}>{agent.updateCount}</span>
                    <span style={{ fontSize: 11.5, color: '#888', alignSelf: 'center' }}>
                      {agent.lastActivity ? new Date(agent.lastActivity.created_at).toLocaleDateString() : '—'}
                    </span>
                    <div style={{ alignSelf: 'center' }}>
                      {expanded === agent.id ? <ChevronUp size={14} color="#aaa" /> : <ChevronDown size={14} color="#aaa" />}
                    </div>
                  </div>

                  {/* Expanded: assigned fields */}
                  {expanded === agent.id && (
                    <div style={{ background: '#f8faf8', borderBottom: '0.5px solid #f0f2ee', padding: '10px 16px 10px 32px' }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 8 }}>Assigned Fields</p>
                      {fields.filter(f => f.assigned_agent_id === agent.user_id).length === 0 ? (
                        <p style={{ fontSize: 11.5, color: '#aaa' }}>No fields assigned.</p>
                      ) : (
                        fields.filter(f => f.assigned_agent_id === agent.user_id).map(f => (
                          <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: STAGE_COLORS[f.current_stage] ?? '#888', flexShrink: 0 }} />
                            <span style={{ fontSize: 11.5, color: '#555', fontWeight: 500 }}>{f.name}</span>
                            <span style={{ fontSize: 11, color: '#aaa' }}>{f.crop_type}</span>
                            <StageBadge stage={f.current_stage} />
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}