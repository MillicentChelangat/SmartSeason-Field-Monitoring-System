import { useState } from 'react';
import { User, Shield, Save, Eye, EyeOff } from 'lucide-react';
import API from '../api/api';
import { AgentShell } from '../components/AgentShell';

interface Props {
  onNavigate: (page: string, fieldId?: string) => void;
  onLogout: () => void;
  user: any;
}

export function ProfilePage({ onNavigate, onLogout, user }: Props) {
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

  async function handleSave(e: React.FormEvent) {
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

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '0.5px solid #ddd', borderRadius: 8,
    padding: '9px 12px', fontSize: 13, fontFamily: "'DM Sans', sans-serif",
    outline: 'none', boxSizing: 'border-box', color: '#111',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 500, color: '#666', marginBottom: 5,
  };

  return (
    <AgentShell activePage="profile" onNavigate={onNavigate} onLogout={onLogout} user={user}>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 700 }}>

        {saved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e8f5ee', color: '#1d6b35', fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 8 }}>
            <Save size={13} /> Changes saved!
          </div>
        )}

        {/* Avatar block */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#1d6b35', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#a8e6be', flexShrink: 0 }}>
              {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{user?.full_name || 'Agent'}</p>
              <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{user?.email}</p>
              <span style={{ display: 'inline-block', marginTop: 5, background: '#e8f5ee', color: '#1d6b35', fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 5 }}>Field Agent</span>
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
              <input style={{ ...inputStyle, background: '#f8f8f8', color: '#aaa' }} value={profile.email} disabled />
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
    </AgentShell>
  );
}