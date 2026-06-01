import { useEffect, useState } from 'react';
import { MapPin, Search, ChevronRight, Calendar, Layers } from 'lucide-react';
import API from '../api/api';
import type { Field, FieldUpdate } from '../types/database';
import { computeFieldStatus } from '../lib/fieldStatus';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AgentShell } from '../components/AgentShell';

interface FieldWithStatus extends Field {
  status: ReturnType<typeof computeFieldStatus>;
  lastUpdate?: FieldUpdate | null;
}

interface Props {
  onNavigate: (page: string, fieldId?: string) => void;
  onLogout: () => void;
  user: any;
}

const STAGE_COLORS: Record<string, { bg: string; color: string }> = {
  planted:   { bg: '#e0f0fe', color: '#0369a1' },
  growing:   { bg: '#d1fae5', color: '#065f46' },
  ready:     { bg: '#fef3c7', color: '#92400e' },
  harvested: { bg: '#f1f5f9', color: '#475569' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0)  return `${hrs}h ago`;
  return `${mins}m ago`;
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
          return { ...f, status: computeFieldStatus(f, lastUpdate), lastUpdate };
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

        {/* Fields grid */}
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
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
              {filtered.map(field => {
                const stageStyle = STAGE_COLORS[field.current_stage] ?? { bg: '#f1f5f9', color: '#475569' };
                const daysSince  = Math.floor((Date.now() - new Date(field.planting_date).getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <button
                    key={field.id}
                    onClick={() => onNavigate('field-detail', String(field.id))}
                    style={{ background: '#fff', borderRadius: 12, padding: 16, textAlign: 'left', border: '0.5px solid #e8eae4', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'box-shadow 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                  >
                    {/* Card top */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: stageStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MapPin size={16} color={stageStyle.color} />
                      </div>
                      <StatusBadge status={field.status} />
                    </div>

                    {/* Name */}
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: '#111', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{field.name}</p>
                    {field.location && <p style={{ fontSize: 11, color: '#aaa', marginBottom: 10 }}>{field.location}</p>}

                    {/* Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#888' }}>
                          <Layers size={11} color="#1d6b35" /> Crop
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#333' }}>{field.crop_type}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#888' }}>
                          <MapPin size={11} color="#1d6b35" /> Stage
                        </span>
                        <StageBadge stage={field.current_stage} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#888' }}>
                          <Calendar size={11} color="#1d6b35" /> Days
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#333' }}>{daysSince}d since planting</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{ paddingTop: 10, borderTop: '0.5px solid #f0f2ee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <p style={{ fontSize: 10.5, color: '#aaa' }}>
                        {field.lastUpdate ? `Updated ${timeAgo(field.lastUpdate.created_at)}` : 'No updates yet'}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11.5, color: '#1d6b35', fontWeight: 500 }}>
                        View <ChevronRight size={12} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AgentShell>
  );
}