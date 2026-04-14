import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import API from '../api';

// ─── SVG Charts ───────────────────────────────────────────────────────────────
function AreaChart({ data, labels, color, h = 120 }) {
  if (!data.length) return null;
  const w = 500;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w;
    const y = h - (v / max) * (h - 16) - 4;
    return `${x},${y}`;
  }).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#ag)" />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((v, i) => {
          const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w;
          const y = h - (v / max) * (h - 16) - 4;
          return <circle key={i} cx={x} cy={y} r="4" fill={color} stroke="#fff" strokeWidth="1.5" />;
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {labels.map(l => <div key={l} style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>{l}</div>)}
      </div>
    </div>
  );
}

function HBarChart({ data, isDark }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data.map((d, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
            <span style={{ color: isDark ? '#e2e8f0' : '#1e293b', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>{d.label}</span>
            <span style={{ color: d.color, fontWeight: 700 }}>{d.value} students</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(d.value / max) * 100}%`, borderRadius: 4, background: `linear-gradient(90deg,${d.color},${d.color2 || d.color})`, transition: 'width 1s ease' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Skel({ w = '100%', h = 14, r = 6 }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: 'rgba(148,163,184,0.12)', animation: 'shimmer 1.5s infinite linear' }} />;
}

function formatMonth(str) {
  if (!str) return '';
  const [y, m] = str.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleString('default', { month: 'short' });
}

const PALETTE = ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminAnalytics() {
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const [stats,     setStats]     = useState(null);
  const [growth,    setGrowth]    = useState([]);
  const [courses,   setCourses]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const text    = isDark ? '#e2e8f0' : '#1e293b';
  const textSub = isDark ? '#94a3b8' : '#64748b';
  const cardBg  = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const border  = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0';
  const shadow  = isDark ? '0 4px 24px rgba(0,0,0,0.2)' : '0 2px 12px rgba(0,0,0,0.05)';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, growthRes, coursesRes] = await Promise.allSettled([
        API.get('/admin/dashboard/stats'),
        API.get('/admin/dashboard/user-growth'),
        API.get('/admin/dashboard/popular-courses'),
      ]);

      if (statsRes.status === 'fulfilled')   setStats(statsRes.value.data);
      if (growthRes.status === 'fulfilled')  setGrowth(growthRes.value.data?.growth || []);
      if (coursesRes.status === 'fulfilled') setCourses(coursesRes.value.data?.popularCourses || []);
    } catch (e) {
      setError('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const kpiCards = stats ? [
    { icon: '👥', label: 'Total Users',       value: stats.totalUsers,        color: '#6366f1', sub: 'registered' },
    { icon: '📚', label: 'Total Courses',      value: stats.totalCourses,      color: '#a855f7', sub: 'imported' },
    { icon: '🎓', label: 'Total Enrollments',  value: stats.totalEnrollments,  color: '#06b6d4', sub: 'active students' },
    { icon: '🟢', label: 'Active Courses',     value: stats.activeCourses,     color: '#10b981', sub: 'with enrollments' },
    { icon: '🏆', label: 'Avg Completion',     value: `${stats.avgCompletionPct ?? 0}%`, color: '#f59e0b', sub: 'across all students' },
  ] : [];

  const completionBars = courses.map((c, i) => ({
    label: c.courseName,
    value: c.enrolledCount,
    color: PALETTE[i % PALETTE.length],
    color2: PALETTE[(i + 2) % PALETTE.length],
  }));

  const card = (title, sub, content) => (
    <div style={{ background: cardBg, border, borderRadius: 16, padding: '22px 24px', boxShadow: shadow }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: text }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: textSub, marginTop: 2 }}>{sub}</div>}
      </div>
      {content}
    </div>
  );

  return (
    <div style={{ maxWidth: 1100 }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        .ana-kpi-grid   { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; margin-bottom:22px; }
        .ana-chart-grid { display:grid; grid-template-columns:1fr; gap:16px; margin-bottom:16px; }
        @media(min-width:540px)  { .ana-kpi-grid { grid-template-columns:repeat(3,1fr); } }
        @media(min-width:900px)  { .ana-kpi-grid { grid-template-columns:repeat(5,1fr); } .ana-chart-grid { grid-template-columns:1.6fr 1fr; } }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 22, color: text, letterSpacing: '-0.4px' }}>Analytics</div>
          <div style={{ fontSize: 13, color: textSub, marginTop: 2 }}>Real-time platform performance & insights</div>
        </div>
        <button onClick={fetchData} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 10, border,
          background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
          color: text, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>🔄 Refresh</button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 18px', borderRadius: 12, marginBottom: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="ana-kpi-grid">
        {loading
          ? [1,2,3,4,5].map(i => (
              <div key={i} style={{ background: cardBg, border, borderRadius: 14, padding: '16px 18px', boxShadow: shadow }}>
                <Skel w={40} h={40} r={10} />
                <div style={{ marginTop: 14 }}><Skel h={28} w="55%" /></div>
                <div style={{ marginTop: 8 }}><Skel h={12} w="70%" /></div>
              </div>
            ))
          : kpiCards.map(k => (
              <div key={k.label} style={{ background: cardBg, border, borderRadius: 14, padding: '16px 18px', boxShadow: shadow, animation: 'fadeUp 0.4s ease both' }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{k.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: k.color, letterSpacing: '-1px' }}>{k.value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: text, marginTop: 2 }}>{k.label}</div>
                <div style={{ fontSize: 11, color: textSub, marginTop: 1 }}>{k.sub}</div>
              </div>
            ))
        }
      </div>

      {/* Charts row */}
      <div className="ana-chart-grid">
        {/* User Growth */}
        {card(
          '📈 User Growth',
          'New registrations — last 6 months (real data)',
          loading
            ? <Skel h={120} r={8} />
            : growth.length === 0
              ? <div style={{ textAlign: 'center', padding: '40px 0', color: textSub }}>No registration data yet</div>
              : <AreaChart
                  data={growth.map(g => g.count)}
                  labels={growth.map(g => formatMonth(g.month))}
                  color="#6366f1"
                  h={130}
                />
        )}

        {/* Summary stats */}
        <div style={{ background: cardBg, border, borderRadius: 16, padding: '22px 24px', boxShadow: shadow }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: text, marginBottom: 4 }}>📊 Platform Summary</div>
          <div style={{ fontSize: 12, color: textSub, marginBottom: 20 }}>Live stats from database</div>
          {loading
            ? [1,2,3,4].map(i => <div key={i} style={{ marginBottom: 16 }}><Skel h={14} w="90%" /><div style={{ marginTop: 6 }}><Skel h={8} w="100%" r={4} /></div></div>)
            : [
                { label: 'Platform Users', value: stats?.totalUsers ?? 0, max: Math.max(stats?.totalUsers ?? 0, 1), color: '#6366f1' },
                { label: 'Courses Available', value: stats?.totalCourses ?? 0, max: Math.max(stats?.totalCourses ?? 0, 1), color: '#a855f7' },
                { label: 'Total Enrollments', value: stats?.totalEnrollments ?? 0, max: Math.max(stats?.totalEnrollments ?? 1, 1), color: '#06b6d4' },
                { label: 'Avg Completion', value: stats?.avgCompletionPct ?? 0, max: 100, color: '#f59e0b', suffix: '%' },
              ].map(row => (
                <div key={row.label} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                    <span style={{ color: text, fontWeight: 500 }}>{row.label}</span>
                    <span style={{ color: row.color, fontWeight: 700 }}>{row.value}{row.suffix || ''}</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min((row.value / row.max) * 100, 100)}%`, borderRadius: 4, background: row.color, transition: 'width 1s ease' }} />
                  </div>
                </div>
              ))
          }
        </div>
      </div>

      {/* Course Enrollment Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        {card(
          '🏅 Course Enrollments',
          'Students enrolled per course (real data)',
          loading
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3,4].map(i => <div key={i}><Skel h={14} w="80%" /><div style={{ marginTop: 6 }}><Skel h={8} r={4} /></div></div>)}</div>
            : completionBars.length === 0
              ? <div style={{ textAlign: 'center', padding: '40px 0', color: textSub }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                  No enrollments yet. Import courses and have students enroll.
                </div>
              : <HBarChart data={completionBars} isDark={isDark} />
        )}
      </div>
    </div>
  );
}
