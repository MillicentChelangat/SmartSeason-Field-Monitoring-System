import { useState, useEffect } from 'react';
import { User, Bell, Globe, Shield, Save, Eye, EyeOff } from 'lucide-react';
import API from '../api/api';
import { AdminShell } from '../components/AdminShell';
import { AgentShell } from '../components/AgentShell';

interface Props {
  onNavigate: (page: string, fieldId?: string) => void;
  onLogout: () => void;
  user: any;
}

type Tab = 'profile' | 'preferences';

export function SettingsPage({ onNavigate, onLogout, user }: Props) {
  const isAdmin = user?.role === 'admin';
  const Shell = isAdmin ? AdminShell : AgentShell;
  const [tab, setTab]           = useState<Tab>('profile');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    residence: (user?.residence && user.residence !== user?.email) ? user.residence : '',
    current_password: '',
    new_password: '',
  });

  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    atRiskAlerts: true,
    weeklyDigest: false,
    language: 'English',
    timezone: 'Africa/Nairobi',
    dateFormat: 'DD/MM/YYYY',
  });

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await API.patch('profile/update/', {
        full_name: profile.full_name,
        phone: profile.phone,
        residence: profile.residence,
        ...(profile.new_password ? { current_password: profile.current_password, new_password: profile.new_password } : {}),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function handleSavePrefs(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '0.5px solid #ddd', borderRadius: 8,
    padding: '9px 12px', fontSize: 13, fontFamily: "'DM Sans', sans-serif",
    outline: 'none', boxSizing: 'border-box', color: '#111',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 500, color: '#666', marginBottom: 5,
  };

  return (
    <Shell activePage="settings" onNavigate={onNavigate} onLogout={onLogout} user={user}>

      {/* Topbar */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '0 18px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, marginBottom: 10 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: '#111' }}>Settings</h1>
          <p style={{ fontSize: 11, color: '#888', marginTop: 1 }}>Manage your account and preferences</p>
        </div>
        {saved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e8f5ee', color: '#1d6b35', fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 8 }}>
            <Save size={13} /> Changes saved!
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 10, minHeight: 0 }}>

        {/* Left: tabs */}
        <div style={{ width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {([
            ['profile', 'Profile', <User size={14} />],
            ['preferences', 'Preferences', <Bell size={14} />],
          ] as const).map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px',
                borderRadius: 9, fontSize: 13, fontWeight: tab === id ? 500 : 400,
                background: tab === id ? '#fff' : 'transparent',
                color: tab === id ? '#1d6b35' : '#666',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: tab === id ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Right: content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* ── PROFILE ── */}
          {tab === 'profile' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Avatar block */}
              <div style={{ background: '#fff', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#1d6b35', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#a8e6be', flexShrink: 0 }}>
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{user?.full_name || 'Admin User'}</p>
                    <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{user?.email}</p>
                    <span style={{ display: 'inline-block', marginTop: 5, background: '#e8f5ee', color: '#1d6b35', fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 5 }}>{user?.role === 'admin' ? 'Administrator' : 'Field Agent'}</span>
                  </div>
                </div>
              </div>

              {/* Personal info */}
              <div style={{ background: '#fff', borderRadius: 12, padding: 20 }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: '#111', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={14} color="#1d6b35" /> Personal Information
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input style={inputStyle} value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} placeholder="Full name" />
                  </div>
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input style={{ ...inputStyle, background: '#f8f8f8', color: '#aaa' }} value={profile.email} disabled placeholder="Email" />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone Number</label>
                    <input style={inputStyle} value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="+254 700 000 000" />
                  </div>
                  <div>
                    <label style={labelStyle}>Location</label>
                    <input style={inputStyle} value={profile.residence} onChange={e => setProfile({ ...profile, residence: e.target.value })} placeholder="e.g. Nairobi, Kenya" />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div style={{ background: '#fff', borderRadius: 12, padding: 20 }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: '#111', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Shield size={14} color="#1d6b35" /> Change Password
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Current Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        style={inputStyle} type={showPass ? 'text' : 'password'}
                        value={profile.current_password}
                        onChange={e => setProfile({ ...profile, current_password: e.target.value })}
                        placeholder="••••••••"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa' }}>
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>New Password</label>
                    <input style={inputStyle} type="password" value={profile.new_password} onChange={e => setProfile({ ...profile, new_password: e.target.value })} placeholder="••••••••" />
                  </div>
                </div>
              </div>

              <div>
                <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 8, background: '#1d6b35', color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: saving ? 0.6 : 1 }}>
                  <Save size={13} /> {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* ── PREFERENCES ── */}
          {tab === 'preferences' && (
            <form onSubmit={handleSavePrefs} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Notifications */}
              <div style={{ background: '#fff', borderRadius: 12, padding: 20 }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: '#111', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Bell size={14} color="#1d6b35" /> Notifications
                </p>
                {([
                  ['emailNotifications', 'Email Notifications', 'Receive updates and alerts via email'],
                  ['atRiskAlerts',       'At-Risk Alerts',      'Get notified immediately when a field is flagged at risk'],
                  ['weeklyDigest',       'Weekly Digest',       'Receive a weekly summary of all field activity'],
                ] as const).map(([key, label, desc]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, marginBottom: 14, borderBottom: key !== 'weeklyDigest' ? '0.5px solid #f0f2ee' : 'none' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{label}</p>
                      <p style={{ fontSize: 11.5, color: '#888', marginTop: 2 }}>{desc}</p>
                    </div>
                    <div
                      onClick={() => setPrefs({ ...prefs, [key]: !prefs[key] })}
                      style={{
                        width: 40, height: 22, borderRadius: 11, cursor: 'pointer', flexShrink: 0,
                        background: prefs[key] ? '#1d6b35' : '#e0e2dc',
                        position: 'relative', transition: 'background 0.2s',
                      }}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: 3,
                        left: prefs[key] ? 21 : 3,
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Regional */}
              <div style={{ background: '#fff', borderRadius: 12, padding: 20 }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: '#111', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Globe size={14} color="#1d6b35" /> Regional Settings
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  {([
                    ['language', 'Language', ['English', 'Swahili', 'French']],
                    ['timezone', 'Timezone', ['Africa/Nairobi', 'Africa/Lagos', 'UTC', 'Europe/London']],
                    ['dateFormat', 'Date Format', ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']],
                  ] as const).map(([key, label, options]) => (
                    <div key={key}>
                      <label style={labelStyle}>{label}</label>
                      <select
                        value={(prefs as any)[key]}
                        onChange={e => setPrefs({ ...prefs, [key]: e.target.value })}
                        style={{ ...inputStyle, appearance: 'none', background: '#fff' }}
                      >
                        {options.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 8, background: '#1d6b35', color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  <Save size={13} /> Save Preferences
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Shell>
  );
}