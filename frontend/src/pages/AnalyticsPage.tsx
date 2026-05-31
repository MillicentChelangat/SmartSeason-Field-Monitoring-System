import { useEffect, useState } from 'react';
import { BarChart2, TrendingUp, AlertTriangle, Users, MapPin, Activity } from 'lucide-react';
import API from '../api/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AdminShell } from '../components/AdminShell';
import { computeFieldStatus } from '../lib/fieldStatus';

interface Props {
  onNavigate: (page: string, fieldId?: string) => void;
  onLogout: () => void;
  user: any;
}

const STAGE_COLORS: Record<string, string> = {
  planted: '#e8a020',
  growing: '#1a5ac2',
  ready: '#2d7a45',
  harvested: '#888',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#2d7a45',
  at_risk: '#e85d3a',
  completed: '#888',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function Bar({ value, max, color, label, count }: { value: number; max: number; color: string; label: string; count: number }) {
  const pct = max ? (value / max) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span style={{ width: 72, fontSize: 11.5, color: '#555', textTransform: 'capitalize', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: '#f0f2ee', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ width: 24, fontSize: 11.5, fontWeight: 600, color: '#111', textAlign: 'right', flexShrink: 0 }}>{count}</span>
    </div>
  );
}

function MiniBarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
      {data.map(({ label, value }) => (
        <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ width: '100%', background: color, borderRadius: '3px 3px 0 0', height: `${(value / max) * 52}px`, minHeight: value > 0 ? 4 : 0, transition: 'height 0.5s ease' }} />
          <span style={{ fontSize: 9, color: '#aaa' }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsPage({ onNavigate, onLogout, user }: Props) {
  const [fields, setFields]   = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [agents, setAgents]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
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

  // Compute statuses
  const enriched = fields.map(f => ({
    ...f,
    status: computeFieldStatus(f, updates.filter(u => u.field_id === f.id)[0] ?? null),
  }));

  const stageBreakdown = {
    planted:   enriched.filter(f => f.current_stage === 'planted').length,
    growing:   enriched.filter(f => f.current_stage === 'growing').length,
    ready:     enriched.filter(f => f.current_stage === 'ready').length,
    harvested: enriched.filter(f => f.current_stage === 'harvested').length,
  };

  const statusBreakdown = {
    active:    enriched.filter(f => f.status === 'active').length,
    at_risk:   enriched.filter(f => f.status === 'at_risk').length,
    completed: enriched.filter(f => f.status === 'completed').length,
  };

  const maxStage  = Math.max(...Object.values(stageBreakdown), 1);
  const maxStatus = Math.max(...Object.values(statusBreakdown), 1);

  // Updates per month (last 6 months)
  const now = new Date();
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: MONTHS[d.getMonth()], month: d.getMonth(), year: d.getFullYear(), value: 0 };
  });
  updates.forEach(u => {
    const d = new Date(u.created_at);
    const entry = last6.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
    if (entry) entry.value++;
  });

  // Agent activity: updates per agent (top 5)
  const agentActivity = agents.map(a => ({
    name: a.full_name,
    count: updates.filter(u => u.agent_id === a.user_id).length,
  })).sort((a, b) => b.count - a.count).slice(0, 5);

  const maxAgentActivity = Math.max(...agentActivity.map(a => a.count), 1);

  // At-risk history per month
  const atRiskByMonth = last6.map(m => ({
    ...m,
    value: updates.filter(u => {
      const d = new Date(u.created_at);
      return d.getMonth() === m.month && d.getFullYear() === m.year && u.status === 'at_risk';
    }).length,
  }));

  // Summary stats
  const totalUpdates    = updates.length;
  const atRiskCount     = statusBreakdown.at_risk;
  const completedCount  = statusBreakdown.completed;
  const avgUpdatesPerField = fields.length ? (totalUpdates / fields.length).toFixed(1) : '0';

  return (
    <AdminShell activePage="analytics" onNavigate={onNavigate} onLogout={onLogout} user={user}>

      {/* Topbar */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '0 18px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, marginBottom: 10 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: '#111' }}>Analytics</h1>
          <p style={{ fontSize: 11, color: '#888', marginTop: 1 }}>Farm performance overview</p>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Summary stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, flexShrink: 0 }}>
          {[
            { label: 'Total Fields',   value: fields.length,       icon: <MapPin size={14} color="#1d6b35" />,      bg: '#e8f5ee', sub: 'across all zones' },
            { label: 'Total Updates',  value: totalUpdates,         icon: <Activity size={14} color="#1a5ac2" />,    bg: '#e8f0fb', sub: 'field updates logged' },
            { label: 'At Risk Fields', value: atRiskCount,          icon: <AlertTriangle size={14} color="#b56c10"/>,bg: '#fef3e2', sub: 'need attention' },
            { label: 'Avg Updates',    value: avgUpdatesPerField,   icon: <TrendingUp size={14} color="#6d28d9" />,  bg: '#f3effe', sub: 'per field' },
          ].map(({ label, value, icon, bg, sub }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
              </div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700, color: '#111', lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: 10, color: '#aaa', marginTop: 5 }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Row 2: Activity trend + Stage breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

          {/* Activity trend */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 12.5, fontWeight: 600, color: '#111', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Activity size={14} color="#1d6b35" /> Field Update Activity
            </p>
            <p style={{ fontSize: 11, color: '#aaa', marginBottom: 14 }}>Updates logged per month (last 6 months)</p>
            <MiniBarChart data={last6} color="#1d6b35" />
          </div>

          {/* Stage breakdown */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 12.5, fontWeight: 600, color: '#111', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart2 size={14} color="#1d6b35" /> Stage Distribution
            </p>
            <p style={{ fontSize: 11, color: '#aaa', marginBottom: 14 }}>Current stage of all fields</p>
            {Object.entries(stageBreakdown).map(([stage, count]) => (
              <Bar key={stage} label={stage} value={count} max={maxStage} color={STAGE_COLORS[stage]} count={count} />
            ))}
          </div>
        </div>

        {/* Row 3: Status breakdown + Agent activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

          {/* Status breakdown */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 12.5, fontWeight: 600, color: '#111', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} color="#1d6b35" /> Field Status Breakdown
            </p>
            <p style={{ fontSize: 11, color: '#aaa', marginBottom: 14 }}>Health status across all fields</p>
            {Object.entries(statusBreakdown).map(([status, count]) => (
              <Bar key={status} label={status.replace('_', ' ')} value={count} max={maxStatus} color={STATUS_COLORS[status]} count={count} />
            ))}
            {/* Donut summary */}
            <div style={{ display: 'flex', gap: 10, marginTop: 14, paddingTop: 12, borderTop: '0.5px solid #f0f2ee' }}>
              {Object.entries(statusBreakdown).map(([status, count]) => (
                <div key={status} style={{ flex: 1, background: '#f8faf8', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: STATUS_COLORS[status] }}>{count}</p>
                  <p style={{ fontSize: 10, color: '#888', textTransform: 'capitalize', marginTop: 2 }}>{status.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Agent activity */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 12.5, fontWeight: 600, color: '#111', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={14} color="#1d6b35" /> Agent Activity
            </p>
            <p style={{ fontSize: 11, color: '#aaa', marginBottom: 14 }}>Updates submitted per agent</p>
            {agentActivity.length === 0 ? (
              <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 20 }}>No activity yet.</p>
            ) : (
              agentActivity.map(({ name, count }) => (
                <Bar key={name} label={name.split(' ')[0]} value={count} max={maxAgentActivity} color="#1a5ac2" count={count} />
              ))
            )}
          </div>
        </div>

        {/* Row 4: At-risk history */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: '#111', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={14} color="#e85d3a" /> At-Risk History
          </p>
          <p style={{ fontSize: 11, color: '#aaa', marginBottom: 14 }}>At-risk flags logged per month</p>
          <MiniBarChart data={atRiskByMonth} color="#e85d3a" />
        </div>

      </div>
    </AdminShell>
  );
}