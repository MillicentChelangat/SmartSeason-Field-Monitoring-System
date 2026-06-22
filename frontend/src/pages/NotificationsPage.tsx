import { useEffect, useState } from 'react';
import { Bell, AlertTriangle, Activity, CheckCircle2, Info, Trash2, Check } from 'lucide-react';
import API from '../api/api';
import { AdminShell } from '../components/AdminShell';
import { AgentShell } from '../components/AgentShell';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface Props {
  onNavigate: (page: string, fieldId?: string) => void;
  onLogout: () => void;
  user: any;
  openIssuesCount: number;
}

interface Notification {
  id: string;
  type: 'at_risk' | 'field_update' | 'agent_assigned' | 'harvest_ready' | 'new_agent';
  title: string;
  message: string;
  time: Date;
  read: boolean;
  fieldId?: string;
  fieldName?: string;
}

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs  > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'just now';
}

const TYPE_CONFIG: Record<Notification['type'], { icon: JSX.Element; color: string; bg: string; border: string }> = {
  at_risk:       { icon: <AlertTriangle size={15} />, color: '#c0392b', bg: '#fde8e4', border: '#f5c0b4' },
  field_update:  { icon: <Activity size={15} />,      color: '#1a5ac2', bg: '#e8f0fb', border: '#c2d5f5' },
  agent_assigned:{ icon: <Info size={15} />,          color: '#b56c10', bg: '#fef3e2', border: '#f5ddb0' },
  harvest_ready: { icon: <CheckCircle2 size={15} />,  color: '#2d7a45', bg: '#e8f5ee', border: '#b0ddc0' },
  new_agent:     { icon: <Bell size={15} />,           color: '#6d28d9', bg: '#f3effe', border: '#d4b8f5' },
};

function buildNotifications(fields: any[], updates: any[], agents: any[], isAdmin: boolean, userId?: string): Notification[] {
  const notifs: Notification[] = [];

  // At-risk fields
  fields.filter(f => f.status === 'at_risk').forEach(f => {
    notifs.push({
      id: `risk-${f.id}`,
      type: 'at_risk',
      title: 'Field at risk',
      message: `${f.name} has been flagged as at risk. Immediate attention required.`,
      time: new Date(Date.now() - Math.random() * 3600000 * 5),
      read: false,
      fieldId: String(f.id),
      fieldName: f.name,
    });
  });

  // Recent field updates
  const recentUpdates = isAdmin
    ? updates.slice(0, 8)
    : updates.filter(u => u.agent_id === userId).slice(0, 8);

  recentUpdates.forEach(u => {
    const field = fields.find(f => f.id === u.field_id);
    notifs.push({
      id: `update-${u.id}`,
      type: 'field_update',
      title: 'Field updated',
      message: isAdmin
        ? `${u.agent_name ?? 'An agent'} updated ${field?.name ?? 'a field'} → ${u.stage}${u.notes ? `: "${u.notes}"` : ''}`
        : `Your update on ${field?.name ?? 'a field'} was recorded → ${u.stage}`,
      time: new Date(u.created_at),
      read: Math.random() > 0.5,
      fieldId: String(u.field_id),
      fieldName: field?.name,
    });
  });

  // Harvest-ready fields
  fields.filter(f => f.current_stage === 'ready').forEach(f => {
    notifs.push({
      id: `harvest-${f.id}`,
      type: 'harvest_ready',
      title: 'Ready to harvest',
      message: `${f.name} has reached the ready stage and is awaiting harvest.`,
      time: new Date(Date.now() - Math.random() * 3600000 * 24),
      read: true,
      fieldId: String(f.id),
      fieldName: f.name,
    });
  });

  // New agents (admin only)
  if (isAdmin) {
    agents.slice(0, 3).forEach(a => {
      notifs.push({
        id: `agent-${a.user_id}`,
        type: 'new_agent',
        title: 'New agent registered',
        message: `${a.full_name} joined as a field agent.`,
        time: new Date(a.created_at),
        read: true,
      });
    });
  }

  // Sort newest first
  return notifs.sort((a, b) => b.time.getTime() - a.time.getTime());
}

type Filter = 'all' | 'unread' | 'at_risk' | 'field_update' | 'harvest_ready';

export function NotificationsPage({ onNavigate, onLogout, user, openIssuesCount }: Props) {
  const isAdmin = user?.role === 'admin';
  const Shell   = isAdmin ? AdminShell : AgentShell;

  const [fields, setFields]   = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [agents, setAgents]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<Filter>('all');
  const [notifs, setNotifs]   = useState<Notification[]>([]);

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
        setNotifs(buildNotifications(fRes.data, uRes.data, aRes.data, isAdmin, user?.id));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function markAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  function dismiss(id: string) {
    setNotifs(prev => prev.filter(n => n.id !== id));
  }

  const filtered = notifs.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'at_risk') return n.type === 'at_risk';
    if (filter === 'field_update') return n.type === 'field_update';
    if (filter === 'harvest_ready') return n.type === 'harvest_ready';
    return true;
  });

  const unreadCount = notifs.filter(n => !n.read).length;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#eef0eb' }}>
      <LoadingSpinner size="lg" />
    </div>
  );

  const FILTERS: { id: Filter; label: string; count?: number }[] = [
    { id: 'all',          label: 'All',           count: notifs.length },
    { id: 'unread',       label: 'Unread',         count: unreadCount },
    { id: 'at_risk',      label: 'At Risk',        count: notifs.filter(n => n.type === 'at_risk').length },
    { id: 'field_update', label: 'Field Updates',  count: notifs.filter(n => n.type === 'field_update').length },
    { id: 'harvest_ready',label: 'Harvest Ready',  count: notifs.filter(n => n.type === 'harvest_ready').length },
  ];

  return (
    <Shell activePage="notifications" onNavigate={onNavigate} onLogout={onLogout} user={user} openIssuesCount={openIssuesCount}>

      {/* Filter bar + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 4, background: '#fff', borderRadius: 10, padding: 4, border: '1px solid #f0f2ee', flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: filter === f.id ? 600 : 400,
                background: filter === f.id ? '#1d6b35' : 'transparent',
                color: filter === f.id ? '#fff' : '#6b7280',
                border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {f.label}
              {f.count !== undefined && f.count > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  background: filter === f.id ? 'rgba(255,255,255,0.25)' : (f.id === 'unread' ? '#e85d3a' : '#f0f2ee'),
                  color: filter === f.id ? '#fff' : (f.id === 'unread' ? '#fff' : '#6b7280'),
                  padding: '1px 6px', borderRadius: 10,
                }}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Mark all read */}
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: '#eef6f0', color: '#1d6b35', border: 'none', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}
          >
            <Check size={13} /> Mark all read
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ede8', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <Bell size={32} style={{ color: '#d1d5db', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>No notifications</p>
            <p style={{ fontSize: 12.5, color: '#9ca3af', margin: 0 }}>
              {filter === 'all' ? "You're all caught up!" : `No ${filter.replace('_', ' ')} notifications.`}
            </p>
          </div>
        ) : (
          filtered.map((notif, idx) => {
            const cfg = TYPE_CONFIG[notif.type];
            return (
              <div
                key={notif.id}
                onClick={() => {
                  markRead(notif.id);
                  if (notif.fieldId) onNavigate('field-detail', notif.fieldId);
                }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: '14px 18px',
                  borderBottom: idx < filtered.length - 1 ? '1px solid #f3f4f6' : 'none',
                  background: notif.read ? '#fff' : '#fafcff',
                  cursor: notif.fieldId ? 'pointer' : 'default',
                  transition: 'background 0.12s',
                  position: 'relative',
                }}
                onMouseEnter={e => { if (notif.fieldId) e.currentTarget.style.background = '#f9fbf9'; }}
                onMouseLeave={e => { e.currentTarget.style.background = notif.read ? '#fff' : '#fafcff'; }}
              >
                {/* Unread dot */}
                {!notif.read && (
                  <div style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', width: 6, height: 6, borderRadius: '50%', background: '#1d6b35' }} />
                )}

                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: cfg.bg, color: cfg.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${cfg.border}`,
                }}>
                  {cfg.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <p style={{ fontSize: 13.5, fontWeight: notif.read ? 500 : 700, color: '#111', margin: 0, lineHeight: 1.3 }}>
                      {notif.title}
                    </p>
                    <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, marginTop: 2 }}>{timeAgo(notif.time)}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: '#6b7280', margin: '4px 0 0', lineHeight: 1.5 }}>
                    {notif.message}
                  </p>
                  {notif.fieldName && (
                    <span style={{ display: 'inline-block', marginTop: 6, fontSize: 11, background: '#eef6f0', color: '#1d6b35', padding: '2px 8px', borderRadius: 6, fontWeight: 500 }}>
                      {notif.fieldName}
                    </span>
                  )}
                </div>

                {/* Dismiss */}
                <button
                  onClick={e => { e.stopPropagation(); dismiss(notif.id); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: 4, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#9ca3af'}
                  onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}
                  title="Dismiss"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </Shell>
  );
}