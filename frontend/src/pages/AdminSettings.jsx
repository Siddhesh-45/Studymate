import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

function SettingsCard({ title, description, children, isDark }) {
  const border = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0';
  return (
    <div style={{
      background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
      border, borderRadius: 16, padding: '24px',
      boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.2)' : '0 2px 12px rgba(0,0,0,0.05)',
      marginBottom: 16,
    }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: 4 }}>{title}</div>
      {description && <div style={{ fontSize: 12.5, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 18 }}>{description}</div>}
      {children}
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text', icon, isDark }) {
  const [focused, setFocused] = useState(false);
  const border = focused
    ? '1.5px solid rgba(99,102,241,0.6)'
    : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0');
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 8 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {icon && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15 }}>{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', height: 42, padding: `0 ${icon ? '12px 0 36px' : '14px'}`,
            borderRadius: 10, border, outline: 'none',
            background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
            color: isDark ? '#e2e8f0' : '#1e293b', fontSize: 13.5,
            boxSizing: 'border-box', transition: 'border 0.15s',
          }}
        />
      </div>
    </div>
  );
}

function ThemeToggleCard({ isDark, toggleTheme }) {
  const border = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 18px', borderRadius: 12,
      background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
      border,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: isDark ? 'rgba(250,204,21,0.15)' : 'rgba(250,204,21,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
          {isDark ? '🌙' : '☀️'}
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b' }}>{isDark ? 'Dark Mode' : 'Light Mode'}</div>
          <div style={{ fontSize: 11.5, color: isDark ? '#94a3b8' : '#64748b', marginTop: 1 }}>{isDark ? 'Easy on the eyes at night' : 'Clean and professional look'}</div>
        </div>
      </div>
      <button onClick={toggleTheme} style={{
        width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
        background: isDark ? 'linear-gradient(90deg,#6366f1,#a855f7)' : 'rgba(0,0,0,0.15)',
        position: 'relative', transition: 'background 0.25s', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 3, left: isDark ? 25 : 3,
          width: 20, height: 20, borderRadius: '50%', background: '#fff',
          transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }} />
      </button>
    </div>
  );
}

function ApiKeyRow({ label, icon, value, onChange, isDark }) {
  const [show, setShow] = useState(false);
  const border = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0';
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 8 }}>
        {icon} {label}
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={`Enter ${label}`}
          style={{
            flex: 1, height: 40, padding: '0 14px', borderRadius: 10, border, outline: 'none',
            background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
            color: isDark ? '#e2e8f0' : '#1e293b', fontSize: 13, fontFamily: show ? 'inherit' : 'monospace',
          }}
        />
        <button onClick={() => setShow(!show)} style={{
          height: 40, padding: '0 14px', borderRadius: 10, border,
          background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
          color: isDark ? '#94a3b8' : '#64748b', cursor: 'pointer', fontSize: 13,
        }}>{show ? '🙈' : '👁️'}</button>
      </div>
    </div>
  );
}

export default function AdminSettings() {
  const { mode, toggleTheme } = useTheme();
  const isDark = mode === 'dark';
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [profile, setProfile] = useState({
    name:  user.name  || 'Admin User',
    email: user.email || 'admin@studymate.test',
    title: 'Platform Administrator',
  });
  const [apiKeys, setApiKeys] = useState({
    youtube: 'AIzaSyCh1lDNgOO2rfD5APS-ybbhsuFvKDGYQXo',
    gemini:  'AIzaSyALc72ldpPgiwDGzwS1zaD4bS9KuECv4X8',
  });
  const [saved, setSaved] = useState(false);

  const text    = isDark ? '#e2e8f0' : '#1e293b';
  const textSub = isDark ? '#94a3b8' : '#64748b';

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 800, fontSize: 22, color: text, letterSpacing: '-0.4px' }}>Settings</div>
        <div style={{ fontSize: 13, color: textSub, marginTop: 2 }}>Manage profile, appearance, and integrations</div>
      </div>

      {/* Profile card */}
      <SettingsCard title="👤 Profile" description="Update your admin profile information" isDark={isDark}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,#6366f1,#a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 24,
            boxShadow: '0 0 0 4px rgba(99,102,241,0.2), 0 4px 14px rgba(99,102,241,0.3)',
          }}>{profile.name[0].toUpperCase()}</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: text }}>{profile.name}</div>
            <div style={{ fontSize: 12.5, color: textSub, marginTop: 2 }}>{profile.title}</div>
            <div style={{ marginTop: 8 }}>
              <button style={{
                padding: '5px 12px', borderRadius: 8,
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                color: '#818cf8', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}>📷 Change Avatar</button>
            </div>
          </div>
        </div>
        <InputField label="Full Name" value={profile.name} onChange={v => setProfile(p => ({ ...p, name: v }))} icon="👤" isDark={isDark} placeholder="Your name" />
        <InputField label="Email Address" value={profile.email} onChange={v => setProfile(p => ({ ...p, email: v }))} icon="📧" isDark={isDark} placeholder="your@email.com" type="email" />
        <InputField label="Role / Title" value={profile.title} onChange={v => setProfile(p => ({ ...p, title: v }))} icon="🏷️" isDark={isDark} placeholder="e.g. Platform Administrator" />
      </SettingsCard>

      {/* Appearance */}
      <SettingsCard title="🎨 Appearance" description="Customize how StudyMate looks for you" isDark={isDark}>
        <ThemeToggleCard isDark={isDark} toggleTheme={toggleTheme} />
      </SettingsCard>

      {/* API Keys */}
      <SettingsCard title="🔑 API Integrations" description="Manage your YouTube and AI API keys" isDark={isDark}>
        <ApiKeyRow label="YouTube Data API Key" icon="🎬" value={apiKeys.youtube} onChange={v => setApiKeys(p => ({ ...p, youtube: v }))} isDark={isDark} />
        <ApiKeyRow label="Gemini AI API Key"   icon="✨" value={apiKeys.gemini}  onChange={v => setApiKeys(p => ({ ...p, gemini: v }))}  isDark={isDark} />
        <div style={{ marginTop: 6, padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, color: '#f59e0b', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          ⚠️ API keys are stored in environment variables on the server. Update them there for production use.
        </div>
      </SettingsCard>

      {/* Save button */}
      <button onClick={handleSave} style={{
        width: '100%', height: 48, borderRadius: 12, border: 'none',
        background: saved ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#6366f1,#a855f7)',
        color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
        boxShadow: saved ? '0 6px 20px rgba(16,185,129,0.4)' : '0 6px 20px rgba(99,102,241,0.4)',
        transition: 'all 0.25s', letterSpacing: '0.02em',
      }}>
        {saved ? '✅ Changes Saved!' : '💾 Save Settings'}
      </button>
    </div>
  );
}
