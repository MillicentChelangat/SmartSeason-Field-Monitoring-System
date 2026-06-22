import { useEffect, useState } from 'react';
import { MapPin, Calendar, Activity, Plus, Layers, ChevronRight, X, AlertTriangle } from 'lucide-react';
import API from '../api/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { AdminShell } from '../components/AdminShell';
import { AgentShell } from '../components/AgentShell';
import { AdminSidebar } from '../components/AdminSidebar';
import { getFieldIssues, reportIssue, updateIssueStatus } from '../api/api';
import type { FieldIssue, IssueType, IssueSeverity } from '../types/database';

const STAGES = ['planted', 'growing', 'ready', 'harvested'] as const;
type FieldStage = typeof STAGES[number];

interface Props {
  fieldId: string;
  onBack: () => void;
  onNavigate: (page: string, fieldId?: string) => void;
  onLogout: () => void;
  user: any;
  openIssuesCount?: number;

}

const STAGE_STEPS = ['planted', 'growing', 'ready', 'harvested'];
const STAGE_COLORS: Record<string, string> = {
  planted: '#e8a020',
  growing: '#1a5ac2',
  ready: '#2d7a45',
  harvested: '#888',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  return `${mins}m ago`;
}

export function FieldDetailPage({ fieldId, onBack, onNavigate, onLogout, user, openIssuesCount }: Props) {
  const storedUser = user ?? JSON.parse(localStorage.getItem('user') || 'null');
  const isAdmin = storedUser?.role === 'admin';

  const [field, setField] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updateForm, setUpdateForm] = useState({ stage: 'planted' as FieldStage, notes: '' });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueUpdating, setIssueUpdating] = useState<number | null>(null);
  const [issueForm, setIssueForm] = useState({
    issue_type: 'pest' as IssueType,
    severity: 'low' as IssueSeverity,
    description: '',
  });
  const [issueSaving, setIssueSaving] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [fieldRes, updatesRes, issuesRes] = await Promise.all([
        API.get(`fields/${fieldId}/`),
        API.get(`fields/${fieldId}/updates/`),
        API.get(`fields/${fieldId}/issues/`),

      ]);
      setField(fieldRes.data);
      setUpdates(updatesRes.data);
      setIssues(issuesRes.data);
      if (fieldRes.data?.current_stage) {
        setUpdateForm(prev => ({ ...prev, stage: fieldRes.data.current_stage }));
      }
    } catch (err) { console.error('Error loading field:', err); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, [fieldId]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!storedUser) return;
    setSaving(true);
    try {
      await API.post(`fields/${fieldId}/updates/add/`, {
        stage: updateForm.stage,
        notes: updateForm.notes,
        agent_id: storedUser.id,
      });
      await loadData();
      setShowUpdateForm(false);
      setUpdateForm(prev => ({ ...prev, notes: '' }));
    } catch (err) { console.error('Error submitting update:', err); }
    finally { setSaving(false); }
  }

  async function handleReportIssue(e: React.FormEvent) {
    e.preventDefault();
    setIssueSaving(true);
    try {
      await reportIssue(Number(fieldId), issueForm);
      await loadData();
      setShowIssueForm(false);
      setIssueForm({ issue_type: 'pest', severity: 'low', description: '' });
    } catch (err) { console.error(err); }
    finally { setIssueSaving(false); }
  }

  async function handleIssueStatusChange(issueId: number, status: string) {
    setIssueUpdating(issueId);
    try {
      await updateIssueStatus(issueId, status);
      await loadData();
    } catch (err) { console.error(err); }
    finally { setIssueUpdating(null); }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#eef0eb' }}>
      <LoadingSpinner size="lg" />
    </div>
  );

  const Shell = isAdmin ? AdminShell : AgentShell;
  const activePage = isAdmin ? 'fields' : 'my-fields';

  if (!field) return (
    <Shell activePage={activePage} onNavigate={onNavigate} onLogout={onLogout} user={storedUser} openIssuesCount={openIssuesCount}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#aaa', padding: '60px 20px' }}>
        <p style={{ fontSize: 13 }}>Field not found.</p>
        <button onClick={onBack} style={{ marginTop: 12, fontSize: 12, color: '#1d6b35', background: 'none', border: 'none', cursor: 'pointer' }}>← Go back</button>
      </div>
    </Shell>
  );

  const daysSincePlanting = Math.floor((Date.now() - new Date(field.planting_date).getTime()) / (1000 * 60 * 60 * 24));
  const status = field.status;
  const currentStepIdx = STAGE_STEPS.indexOf(field.current_stage);

  return (
    <>
      <style>{`
        .detail-body {
          display: flex;
          gap: 14px;
          flex-direction: column;
        }
        @media (min-width: 768px) {
          .detail-body { flex-direction: row; align-items: flex-start; }
        }
        .detail-right {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (min-width: 768px) {
          .detail-right {
            width: 230px;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
        }
        .update-form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 14px;
        }
        @media (min-width: 480px) {
          .update-form-grid { grid-template-columns: 1fr 1fr; }
        }
        .stage-tracker {
          display: flex;
          align-items: center;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 4px;
        }
        .stage-tracker::-webkit-scrollbar { display: none; }
      `}</style>

      <Shell activePage={activePage} onNavigate={onNavigate} onLogout={onLogout} user={storedUser} openIssuesCount={openIssuesCount}>

        {/* ── TOPBAR ── */}
        <div style={{
          background: '#fff', borderRadius: 12,
          padding: '12px 16px', marginBottom: 14,
          border: '1px solid #e8ede8',
        }}>
          {/* Row 1: breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <button
              onClick={onBack}
              style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: 0, transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#1d6b35'}
              onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
            >
              Fields
            </button>
            <ChevronRight size={13} color="#d1d5db" />
            <span style={{ fontSize: 13, color: '#111', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {field.name}
            </span>
          </div>

          {/* Row 2: badges + action button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <StageBadge stage={field.current_stage} />
              <StatusBadge status={status} />
            </div>

            {!isAdmin && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setShowUpdateForm(!showUpdateForm)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: showUpdateForm ? '#f3f4f6' : '#1d6b35', color: showUpdateForm ? '#6b7280' : '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                >
                  {showUpdateForm ? <><X size={13} /> Cancel</> : <><Plus size={13} /> Add Update</>}
                </button>
                <button
                  onClick={() => setShowIssueForm(!showIssueForm)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: showIssueForm ? '#f3f4f6' : '#dc2626', color: showIssueForm ? '#6b7280' : '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                >
                  {showIssueForm ? <><X size={13} /> Cancel</> : <><AlertTriangle size={13} /> Report Issue</>}
                </button>
              </div>
            )}


          </div>
        </div>

        {/* ── BODY ── */}
        <div className="detail-body">

          {/* Left column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>

            {/* Growth stage tracker */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '18px 16px', border: '1px solid #e8ede8' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 7 }}>
                <Layers size={14} color="#1d6b35" /> Growth Progress
              </p>
              <div className="stage-tracker">
                {STAGE_STEPS.map((stage, i) => {
                  const done = i <= currentStepIdx;
                  const current = i === currentStepIdx;
                  const color = done ? STAGE_COLORS[stage] : '#d1d5db';
                  return (
                    <div key={stage} style={{ display: 'flex', alignItems: 'center', flex: i < STAGE_STEPS.length - 1 ? 1 : 'none', minWidth: 60 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                        <div style={{
                          width: current ? 32 : 24, height: current ? 32 : 24,
                          borderRadius: '50%',
                          background: done ? color : '#f3f4f6',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: current ? `2.5px solid ${color}` : '2px solid transparent',
                          boxShadow: current ? `0 0 0 4px ${color}22` : 'none',
                          transition: 'all 0.2s', flexShrink: 0,
                        }}>
                          {done && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                        </div>
                        <p style={{ fontSize: 10.5, color: done ? color : '#9ca3af', fontWeight: current ? 700 : 400, textTransform: 'capitalize', margin: 0, whiteSpace: 'nowrap' }}>
                          {stage}
                        </p>
                      </div>
                      {i < STAGE_STEPS.length - 1 && (
                        <div style={{ flex: 1, height: 2.5, borderRadius: 2, background: i < currentStepIdx ? STAGE_COLORS[STAGE_STEPS[i + 1]] : '#e5e7eb', margin: '0 4px', marginBottom: 20, transition: 'background 0.3s', minWidth: 20 }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add update form */}
            {showUpdateForm && (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ede8', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', background: '#fafcfa', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Activity size={14} color="#1d6b35" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Submit Field Update</span>
                </div>
                <div style={{ padding: '16px' }}>
                  <form onSubmit={handleUpdate}>
                    <div className="update-form-grid">
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Stage</label>
                        <select
                          value={updateForm.stage}
                          onChange={e => setUpdateForm({ ...updateForm, stage: e.target.value as FieldStage })}
                          style={{ width: '100%', border: '1px solid #e2e8e2', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                        >
                          {STAGES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Notes</label>
                        <input
                          value={updateForm.notes}
                          onChange={e => setUpdateForm({ ...updateForm, notes: e.target.value })}
                          placeholder="Add observations..."
                          style={{ width: '100%', border: '1px solid #e2e8e2', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }}
                          onFocus={e => e.currentTarget.style.borderColor = '#1d6b35'}
                          onBlur={e => e.currentTarget.style.borderColor = '#e2e8e2'}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="submit"
                        disabled={saving}
                        style={{ flex: 1, padding: '9px 0', borderRadius: 8, background: '#1d6b35', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: saving ? 0.65 : 1 }}
                      >
                        {saving ? 'Saving…' : 'Submit Update'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowUpdateForm(false)}
                        style={{ flex: 1, padding: '9px 0', borderRadius: 8, background: '#fff', color: '#6b7280', border: '1px solid #e2e8e2', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {showIssueForm && !isAdmin && (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #fecaca', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #fef2f2', background: '#fff5f5', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <AlertTriangle size={14} color="#dc2626" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Report Field Issue</span>
                </div>
                <div style={{ padding: '16px' }}>
                  <form onSubmit={handleReportIssue}>
                    <div className="update-form-grid">
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Issue Type</label>
                        <select
                          value={issueForm.issue_type}
                          onChange={e => setIssueForm({ ...issueForm, issue_type: e.target.value as IssueType })}
                          style={{ width: '100%', border: '1px solid #e2e8e2', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                        >
                          <option value="pest">Pest Infestation</option>
                          <option value="disease">Crop Disease</option>
                          <option value="drought">Drought / Water Stress</option>
                          <option value="flood">Flood / Waterlogging</option>
                          <option value="crop_failure">Crop Failure</option>
                          <option value="poor_germination">Poor Germination</option>
                          <option value="nutrient_deficiency">Nutrient Deficiency</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Severity</label>
                        <select
                          value={issueForm.severity}
                          onChange={e => setIssueForm({ ...issueForm, severity: e.target.value as IssueSeverity })}
                          style={{ width: '100%', border: '1px solid #e2e8e2', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Description</label>
                      <textarea
                        value={issueForm.description}
                        onChange={e => setIssueForm({ ...issueForm, description: e.target.value })}
                        placeholder="Describe the issue in detail..."
                        rows={3}
                        style={{ width: '100%', border: '1px solid #e2e8e2', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                        onFocus={e => e.currentTarget.style.borderColor = '#dc2626'}
                        onBlur={e => e.currentTarget.style.borderColor = '#e2e8e2'}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="submit"
                        disabled={issueSaving}
                        style={{ flex: 1, padding: '9px 0', borderRadius: 8, background: '#dc2626', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: issueSaving ? 0.65 : 1 }}
                      >
                        {issueSaving ? 'Submitting…' : 'Submit Issue'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowIssueForm(false)}
                        style={{ flex: 1, padding: '9px 0', borderRadius: 8, background: '#fff', color: '#6b7280', border: '1px solid #e2e8e2', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {isAdmin && (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ede8', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', background: '#fafcfa', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <AlertTriangle size={14} color="#dc2626" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Field Issues</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11.5, color: '#9ca3af' }}>{issues.length} issue{issues.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ padding: '12px 0' }}>
                  {issues.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', padding: '32px 0' }}>
                      <AlertTriangle size={28} style={{ opacity: 0.2, marginBottom: 8, display: 'block' }} />
                      <p style={{ fontSize: 13, margin: 0 }}>No issues reported</p>
                    </div>
                  ) : issues.map((issue, idx) => (
                    <div key={issue.id} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: idx < issues.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                      <div style={{ width: 4, borderRadius: 4, background: issue.severity === 'high' ? '#dc2626' : issue.severity === 'medium' ? '#d97706' : '#16a34a', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#111', textTransform: 'capitalize' }}>
                            {issue.issue_type.replace(/_/g, ' ')}
                          </span>
                          <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 20, background: issue.severity === 'high' ? '#fef2f2' : issue.severity === 'medium' ? '#fef9c3' : '#f0fdf4', color: issue.severity === 'high' ? '#dc2626' : issue.severity === 'medium' ? '#b45309' : '#16a34a', fontWeight: 600 }}>
                            {issue.severity}
                          </span>
                          <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 20, background: issue.status === 'resolved' ? '#f0fdf4' : issue.status === 'in_progress' ? '#eff6ff' : '#fef2f2', color: issue.status === 'resolved' ? '#16a34a' : issue.status === 'in_progress' ? '#2563eb' : '#dc2626', fontWeight: 600 }}>
                            {issue.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {issue.description && (
                          <p style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic', margin: '0 0 6px' }}>"{issue.description}"</p>
                        )}
                        <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>By {issue.reported_by_name}</p>
                      </div>
                      {issue.status !== 'resolved' && (
                        <div style={{ flexShrink: 0 }}>
                          {issue.status === 'open' && (
                            <button
                              onClick={() => handleIssueStatusChange(issue.id, 'in_progress')}
                              disabled={issueUpdating === issue.id}
                              style={{ fontSize: 11, padding: '5px 10px', borderRadius: 7, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', cursor: 'pointer', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}
                            >
                              {issueUpdating === issue.id ? '...' : 'Acknowledge'}
                            </button>
                          )}
                          {issue.status === 'in_progress' && (
                            <button
                              onClick={() => handleIssueStatusChange(issue.id, 'resolved')}
                              disabled={issueUpdating === issue.id}
                              style={{ fontSize: 11, padding: '5px 10px', borderRadius: 7, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', cursor: 'pointer', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}
                            >
                              {issueUpdating === issue.id ? '...' : 'Confirm Resolved'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Updates timeline */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ede8', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', background: '#fafcfa', display: 'flex', alignItems: 'center', gap: 7 }}>
                <Activity size={14} color="#1d6b35" />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Field Updates</span>
                <span style={{ marginLeft: 'auto', fontSize: 11.5, color: '#9ca3af' }}>{updates.length} update{updates.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ padding: '12px 0' }}>
                {updates.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', padding: '32px 0' }}>
                    <Activity size={28} style={{ opacity: 0.2, marginBottom: 8, display: 'block' }} />
                    <p style={{ fontSize: 13, margin: 0 }}>No updates yet</p>
                  </div>
                ) : (
                  <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column' }}>
                    {updates.map((u, idx) => (
                      <div key={u.id} style={{ display: 'flex', gap: 12, paddingBottom: idx < updates.length - 1 ? 18 : 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 3 }}>
                          <div style={{ width: 11, height: 11, borderRadius: '50%', background: STAGE_COLORS[u.stage] ?? '#888', flexShrink: 0, boxShadow: `0 0 0 3px ${(STAGE_COLORS[u.stage] ?? '#888')}22` }} />
                          {idx < updates.length - 1 && <div style={{ width: 1.5, flex: 1, background: '#f0f2ee', marginTop: 5 }} />}
                        </div>
                        <div style={{ flex: 1, paddingBottom: 4, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 8, flexWrap: 'wrap' }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: 0 }}>{u.agent_name ?? 'Agent'}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                              <StageBadge stage={u.stage} />
                              <span style={{ fontSize: 11, color: '#9ca3af' }}>{timeAgo(u.created_at)}</span>
                            </div>
                          </div>
                          {u.notes && (
                            <p style={{ fontSize: 12.5, color: '#6b7280', background: '#f8fbf8', borderRadius: 7, padding: '7px 12px', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
                              "{u.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column — 2-col grid on mobile, stacked on desktop */}
          <div className="detail-right">

            {/* Field Info */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ede8', overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #f3f4f6', background: '#fafcfa', display: 'flex', alignItems: 'center', gap: 7 }}>
                <MapPin size={13} color="#1d6b35" />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#111' }}>Field Info</span>
              </div>
              <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: <MapPin size={12} color="#1d6b35" />, label: 'Location', val: field.location || '—' },
                  { icon: <Calendar size={12} color="#1d6b35" />, label: 'Planting Date', val: new Date(field.planting_date).toLocaleDateString() },
                  { icon: <Calendar size={12} color="#1d6b35" />, label: 'Days Since Planting', val: `${daysSincePlanting}d` },
                  { icon: <Layers size={12} color="#1d6b35" />, label: 'Crop Type', val: field.crop_type },
                ].map(({ icon, label, val }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: '#eef6f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {icon}
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500, margin: 0 }}>{label}</p>
                      <p style={{ fontSize: 12.5, color: '#111', fontWeight: 500, margin: 0, marginTop: 1 }}>{val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Update Summary */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ede8', overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #f3f4f6', background: '#fafcfa', display: 'flex', alignItems: 'center', gap: 7 }}>
                <Activity size={13} color="#1d6b35" />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#111' }}>Summary</span>
              </div>
              <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Total Updates', val: String(updates.length) },
                  { label: 'Last Update', val: updates.length > 0 ? timeAgo(updates[0].created_at) : '—' },
                  { label: 'Current Stage', val: field.current_stage, color: STAGE_COLORS[field.current_stage] },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: (color as any) ?? '#111', textTransform: 'capitalize' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Shell>
    </>
  );
}