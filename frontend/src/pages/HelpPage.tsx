import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Send, MessageSquare, BookOpen, Mail } from 'lucide-react';
import { AdminShell } from '../components/AdminShell';
import { AgentShell } from '../components/Agentshell';

interface Props {
  onNavigate: (page: string, fieldId?: string) => void;
  onLogout: () => void;
  user: any;
}

const FAQS = [
  {
    category: 'Fields',
    items: [
      { q: 'How do I add a new field?', a: 'Go to the Fields page from the sidebar and click "New Field". Fill in the field name, crop type, planting date, and optional location, then click Create.' },
      { q: 'How do I assign an agent to a field?', a: 'On the Fields page, click the assign icon (person+) on any field row. A dropdown will appear where you can select an agent. Click Save to confirm.' },
      { q: 'What does "At Risk" status mean?', a: 'A field is marked At Risk when an agent flags it during an update, or when it has gone too long without an update based on your configured thresholds.' },
      { q: 'Can I delete a field?', a: 'Yes — click the trash icon on any field row in the Fields page. This action is permanent and cannot be undone.' },
    ],
  },
  {
    category: 'Agents',
    items: [
      { q: 'How do I register a new agent?', a: 'Go to the Agents page and click "Register Agent". Fill in their name, email, and password. The agent can then log in and access their assigned fields.' },
      { q: 'How many fields can one agent manage?', a: 'There is no hard limit. You can assign as many fields to an agent as needed. However, we recommend keeping it manageable — typically 3–5 fields per agent.' },
      { q: 'Can an agent update their own profile?', a: 'Yes. Agents can update their profile information (name, phone, location) from their Settings page after logging in.' },
    ],
  },
  {
    category: 'Reports & Analytics',
    items: [
      { q: 'How do I export a report?', a: 'Go to the Reports page, select either Field Reports or Agent Reports, then click the "Export CSV" button in the top right. The file will download to your device.' },
      { q: 'What does the Analytics page show?', a: 'The Analytics page shows field activity trends, stage distribution, status breakdown, agent activity rankings, and at-risk history over the last 6 months.' },
      { q: 'How often is data updated?', a: 'Data is fetched live every time you navigate to a page. There is no caching — everything you see reflects the latest state of your farm.' },
    ],
  },
];

export function HelpPage({ onNavigate, onLogout, user }: Props) {
  const isAdmin = user?.role === 'admin';
  const Shell = isAdmin ? AdminShell : AgentShell;
  const [openFaq, setOpenFaq]   = useState<string | null>(null);
  const [tab, setTab]           = useState<'faq' | 'contact'>('faq');
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm]         = useState({ subject: '', message: '', priority: 'normal' });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setForm({ subject: '', message: '', priority: 'normal' });
    setTimeout(() => setSubmitted(false), 4000);
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
    <Shell activePage="help" onNavigate={onNavigate} onLogout={onLogout} user={user}>

      {/* Topbar */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '0 18px', height: 52, display: 'flex', alignItems: 'center', flexShrink: 0, marginBottom: 10 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: '#111' }}>Help & Support</h1>
          <p style={{ fontSize: 11, color: '#888', marginTop: 1 }}>FAQs and contact support</p>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 10, minHeight: 0 }}>

        {/* Left sidebar tabs */}
        <div style={{ width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {([
            ['faq',     'FAQs',            <BookOpen size={14} />],
            ['contact', 'Contact Support', <MessageSquare size={14} />],
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

          {/* Quick links */}
          <div style={{ marginTop: 20, padding: '14px 12px', background: '#fff', borderRadius: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Quick Links</p>
            {[
              { label: 'Dashboard', page: 'dashboard' },
              { label: 'Fields', page: 'fields' },
              { label: 'Agents', page: 'agents' },
              { label: 'Analytics', page: 'analytics' },
            ].map(({ label, page }) => (
              <button
                key={page}
                onClick={() => onNavigate(page)}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 0', fontSize: 12.5, color: '#1d6b35', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
              >
                → {label}
              </button>
            ))}
          </div>
        </div>

        {/* Right content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* ── FAQ ── */}
          {tab === 'faq' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FAQS.map(section => (
                <div key={section.category} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 18px', borderBottom: '0.5px solid #f0f2ee', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <HelpCircle size={14} color="#1d6b35" />
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: '#111' }}>{section.category}</p>
                  </div>
                  {section.items.map((item, idx) => {
                    const key = `${section.category}-${idx}`;
                    const open = openFaq === key;
                    return (
                      <div key={key} style={{ borderBottom: idx < section.items.length - 1 ? '0.5px solid #f5f6f4' : 'none' }}>
                        <button
                          onClick={() => setOpenFaq(open ? null : key)}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: open ? '#fafbf9' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif" }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#111', flex: 1, paddingRight: 12 }}>{item.q}</span>
                          {open ? <ChevronUp size={15} color="#aaa" /> : <ChevronDown size={15} color="#aaa" />}
                        </button>
                        {open && (
                          <div style={{ padding: '0 18px 14px 18px', background: '#fafbf9' }}>
                            <p style={{ fontSize: 12.5, color: '#555', lineHeight: 1.6 }}>{item.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* ── CONTACT ── */}
          {tab === 'contact' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Info cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { icon: <Mail size={18} color="#1d6b35" />, label: 'Email Support', value: 'support@smartseason.io', sub: 'Response within 24 hours' },
                  { icon: <MessageSquare size={18} color="#1a5ac2" />, label: 'Live Chat', value: 'Available Mon–Fri', sub: '9:00 AM – 6:00 PM EAT' },
                ].map(({ icon, label, value, sub }) => (
                  <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f0f7f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {icon}
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>{label}</p>
                      <p style={{ fontSize: 13, color: '#333', marginTop: 2 }}>{value}</p>
                      <p style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contact form */}
              <div style={{ background: '#fff', borderRadius: 12, padding: 20 }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: '#111', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Send size={14} color="#1d6b35" /> Send a Message
                </p>

                {submitted && (
                  <div style={{ background: '#e8f5ee', color: '#1d6b35', fontSize: 13, fontWeight: 500, padding: '10px 14px', borderRadius: 8, marginBottom: 14 }}>
                    ✓ Message sent! We'll get back to you within 24 hours.
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Your Name</label>
                      <input style={{ ...inputStyle, background: '#f8f8f8', color: '#aaa' }} value={user?.full_name || ''} disabled />
                    </div>
                    <div>
                      <label style={labelStyle}>Priority</label>
                      <select
                        value={form.priority}
                        onChange={e => setForm({ ...form, priority: e.target.value })}
                        style={inputStyle}
                      >
                        <option value="low">Low — general question</option>
                        <option value="normal">Normal — need help</option>
                        <option value="high">High — something is broken</option>
                        <option value="urgent">Urgent — data loss / critical</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Subject *</label>
                    <input
                      required
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      placeholder="Brief description of your issue"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Message *</label>
                    <textarea
                      required
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      placeholder="Describe your issue in detail..."
                      rows={5}
                      style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 8, background: '#1d6b35', color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      <Send size={13} /> Send Message
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}