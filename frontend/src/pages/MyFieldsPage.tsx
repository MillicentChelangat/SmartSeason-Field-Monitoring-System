import { useEffect, useState } from 'react';
import { MapPin, Search, ChevronRight } from 'lucide-react';
import API from '../api/api';
import type { Field, FieldUpdate } from '../types/database';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AgentShell } from '../components/AgentShell';

interface FieldWithStatus extends Field {
  lastUpdate?: FieldUpdate | null;
}

interface Props {
  onNavigate: (page: string, fieldId?: string) => void;
  onLogout: () => void;
  user: any;
}

export function MyFieldsPage({ onNavigate, onLogout, user }: Props) {
  const [fields, setFields]   = useState<FieldWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filterStage, setFilterStage] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('access');
        const headers = { Authorization: `Bearer ${token}` };
        const [fieldsRes, updatesRes] = await Promise.all([
          API.get('agent/fields/', { headers }),
          API.get('agent/updates/', { headers }),
        ]);
        const rawFields: Field[]      = fieldsRes.data;
        const allUpdates: FieldUpdate[] = updatesRes.data;
        const enriched: FieldWithStatus[] = rawFields.map(f => {
          const updates   = allUpdates.filter(u => u.field_id === f.id);
          const lastUpdate = updates[0] ?? null;
          return { ...f, status: f.status, lastUpdate };
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

  const stageCounts = {
    all:       fields.length,
    planted:   fields.filter(f => f.current_stage === 'planted').length,
    growing:   fields.filter(f => f.current_stage === 'growing').length,
    ready:     fields.filter(f => f.current_stage === 'ready').length,
    harvested: fields.filter(f => f.current_stage === 'harvested').length,
  };

  const filtered = fields.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.crop_type.toLowerCase().includes(search.toLowerCase());
    const matchStage = filterStage === 'all' || f.current_stage === filterStage;
    return matchSearch && matchStage;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#eef0eb' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <AgentShell activePage="my-fields" onNavigate={onNavigate} onLogout={onLogout} user={user}>

      {/* Topbar */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '0 18px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, marginBottom: 10 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: '#111' }}>My Fields</h1>
          <p style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{fields.length} field{fields.length !== 1 ? 's' : ''} assigned to you</p>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>

        {/* Filter tabs + search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {(['all', 'planted', 'growing', 'ready', 'harvested'] as const).map(stage => (
            <button
              key={stage}
              onClick={() => setFilterStage(stage)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 500,
                cursor: 'pointer', border: 'none',
                background: filterStage === stage ? '#1d6b35' : '#fff',
                color: filterStage === stage ? '#fff' : '#555',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {stage.charAt(0).toUpperCase() + stage.slice(1)} ({stageCounts[stage]})
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search fields..."
              style={{ paddingLeft: 28, paddingRight: 12, paddingTop: 7, paddingBottom: 7, borderRadius: 8, border: '0.5px solid #ddd', fontSize: 12, background: '#fff', fontFamily: "'DM Sans', sans-serif", outline: 'none', width: 200 }}
            />
          </div>
        </div>

        {/* Fields table */}
        {fields.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 12, color: '#aaa' }}>
            <MapPin size={36} style={{ opacity: 0.2, marginBottom: 8 }} />
            <p style={{ fontSize: 13 }}>No fields assigned yet.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 12, color: '#aaa', fontSize: 13 }}>
            No fields match your search.
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', background: '#fff', borderRadius: 12, border: '0.5px solid #e8eae4' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans', sans-serif" }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #f0f2ee' }}>
                  <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#888' }}>Field</th>
                  <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#888' }}>Crop</th>
                  <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#888' }}>Stage</th>
                  <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#888' }}>Days</th>
                  <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#888' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#888' }}>Joined</th>
                  <th style={{ padding: '10px 16px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(field => {
                  const daysSince = Math.floor((Date.now() - new Date(field.planting_date).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr
                      key={field.id}
                      onClick={() => onNavigate('field-detail', String(field.id))}
                      style={{ borderBottom: '0.5px solid #f0f2ee', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafbf9')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{field.name}</p>
                        {field.location && <p style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{field.location}</p>}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#333' }}>{field.crop_type}</td>
                      <td style={{ padding: '12px 16px' }}><StageBadge stage={field.current_stage} /></td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#333' }}>{daysSince}d</td>
                      <td style={{ padding: '12px 16px' }}><StatusBadge status={field.status} /></td>
                      <td style={{ padding: '12px 16px', fontSize: 11.5, color: '#aaa' }}>{new Date(field.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11.5, color: '#1d6b35', fontWeight: 500 }}>
                          View <ChevronRight size={12} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AgentShell>
  );
}