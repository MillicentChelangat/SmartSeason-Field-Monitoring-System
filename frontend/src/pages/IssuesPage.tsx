import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Filter } from 'lucide-react';
import { AdminShell } from '../components/AdminShell';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { getAllIssues, updateIssueStatus } from '../api/api';
import type { FieldIssue, IssueSeverity, IssueStatus } from '../types/database';

interface Props {
  onNavigate: (page: string, fieldId?: string) => void;
  onLogout: () => void;
  user: any;
  openIssuesCount?: number;
}

const SEVERITY_COLORS: Record<IssueSeverity, { bg: string; color: string; label: string }> = {
  low:    { bg: '#f0fdf4', color: '#16a34a', label: 'Low' },
  medium: { bg: '#fef9c3', color: '#b45309', label: 'Medium' },
  high:   { bg: '#fef2f2', color: '#dc2626', label: 'High' },
};

const STATUS_COLORS: Record<IssueStatus, { bg: string; color: string; label: string }> = {
  open:        { bg: '#fef2f2', color: '#dc2626', label: 'Open' },
  in_progress: { bg: '#eff6ff', color: '#2563eb', label: 'In Progress' },
  resolved:    { bg: '#f0fdf4', color: '#16a34a', label: 'Resolved' },
};

const ISSUE_TYPE_LABELS: Record<string, string> = {
  pest:                 'Pest Infestation',
  disease:              'Crop Disease',
  drought:              'Drought / Water Stress',
  flood:                'Flood / Waterlogging',
  crop_failure:         'Crop Failure',
  poor_germination:     'Poor Germination',
  nutrient_deficiency:  'Nutrient Deficiency',
  other:                'Other',
};

export function IssuesPage({ onNavigate, onLogout, user, openIssuesCount }: Props) {
  const [issues, setIssues]           = useState<FieldIssue[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus]     = useState<string>('all');
  const [updating, setUpdating]       = useState<number | null>(null);

  useEffect(() => {
    getAllIssues()
      .then(res => setIssues(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  async function handleStatusChange(issueId: number, newStatus: IssueStatus) {
    setUpdating(issueId);
    try {
      await updateIssueStatus(issueId, newStatus);
      setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: newStatus } : i));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  }

  const filtered = issues.filter(i => {
    if (filterSeverity !== 'all' && i.severity !== filterSeverity) return false;
    if (filterStatus   !== 'all' && i.status   !== filterStatus)   return false;
    return true;
  });

  const openCount     = issues.filter(i => i.status === 'open').length;
  const inProgressCount = issues.filter(i => i.status === 'in_progress').length;
  const resolvedCount = issues.filter(i => i.status === 'resolved').length;

  if (loading) {
    return (
      <AdminShell activePage="issues" onNavigate={onNavigate} onLogout={onLogout} user={user} openIssuesCount={openIssuesCount}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <LoadingSpinner size="lg" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell activePage="issues" onNavigate={onNavigate} onLogout={onLogout} user={user} openIssuesCount={openIssuesCount}>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Open',        value: openCount,       color: '#dc2626', bg: '#fef2f2', icon: <AlertTriangle size={16} /> },
            { label: 'In Progress', value: inProgressCount, color: '#2563eb', bg: '#eff6ff', icon: <Clock size={16} /> },
            { label: 'Resolved',    value: resolvedCount,   color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircle2 size={16} /> },
          ].map(({ label, value, color, bg, icon }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e2e8e2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {icon}
                </div>
                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{label}</span>
              </div>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#111', fontFamily: "'Syne', sans-serif", margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Filter size={14} color="#6b7280" />
          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8e2', fontSize: 13, color: '#374151', background: '#fff', cursor: 'pointer' }}
          >
            <option value="all">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8e2', fontSize: 13, color: '#374151', background: '#fff', cursor: 'pointer' }}
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {/* Issues list */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8e2', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <CheckCircle2 size={32} style={{ color: '#d1d5db', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontSize: 14, color: '#9ca3af' }}>No issues found.</p>
            </div>
          ) : filtered.map((issue, idx) => {
            const sev = SEVERITY_COLORS[issue.severity];
            const sta = STATUS_COLORS[issue.status];
            return (
              <div key={issue.id} style={{ padding: '16px 20px', borderBottom: idx < filtered.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                
                {/* Severity indicator */}
                <div style={{ width: 4, borderRadius: 4, alignSelf: 'stretch', background: sev.color, flexShrink: 0 }} />

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
                      {ISSUE_TYPE_LABELS[issue.issue_type] || issue.issue_type}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: sev.bg, color: sev.color }}>
                      {sev.label}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: sta.bg, color: sta.color }}>
                      {sta.label}
                    </span>
                  </div>
                  <p style={{ fontSize: 12.5, color: '#6b7280', margin: '0 0 4px' }}>
                    <button onClick={() => onNavigate('field-detail', String(issue.field_id))}
                      style={{ color: '#1d6b35', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12.5, fontFamily: "'DM Sans', sans-serif" }}>
                      {issue.field_name}
                    </button>
                    {' · Reported by '}{issue.reported_by_name}
                  </p>
                  {issue.description && (
                    <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic', margin: '0 0 8px' }}>"{issue.description}"</p>
                  )}
                  <p style={{ fontSize: 11, color: '#d1d5db', margin: 0 }}>
                    {new Date(issue.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                {/* Status action */}
                {issue.status !== 'resolved' && (
                  <div style={{ flexShrink: 0 }}>
                    {issue.status === 'open' && (
                      <button
                        onClick={() => handleStatusChange(issue.id, 'in_progress')}
                        disabled={updating === issue.id}
                        style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', cursor: 'pointer', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {updating === issue.id ? '...' : 'Acknowledge'}
                      </button>
                    )}
                    {issue.status === 'in_progress' && (
                      <button
                        onClick={() => handleStatusChange(issue.id, 'resolved')}
                        disabled={updating === issue.id}
                        style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', cursor: 'pointer', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {updating === issue.id ? '...' : 'Confirm Resolved'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
}