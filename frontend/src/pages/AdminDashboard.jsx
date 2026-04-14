import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { useTheme } from '../context/ThemeContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatMonth(str) {
  if (!str) return '';
  const [y, m] = str.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleString('default', { month: 'short' });
}

function getInitials(name = '') {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || '?';
}

function avatarColor(name = '') {
  const hue = (name.charCodeAt(0) * 37 + (name.charCodeAt(1) || 0) * 13) % 360;
  return `hsl(${hue},55%,45%)`;
}

// ─── Animated count-up ────────────────────────────────────────────────────────
function CountUp({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const end = Number(value) || 0;
    if (end === 0) { setDisplay(0); return; }
    let cur = 0;
    const step = Math.max(1, Math.ceil(end / 40));
    const t = setInterval(() => {
      cur += step;
      if (cur >= end) { setDisplay(end); clearInterval(t); }
      else setDisplay(cur);
    }, 25);
    return () => clearInterval(t);
  }, [value]);
  return <>{display.toLocaleString()}</>;
}

// ─── Skeleton line ────────────────────────────────────────────────────────────
function Skel({ w = '100%', h = 14, r = 6 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'rgba(148,163,184,0.12)',
      animation: 'shimmer 1.5s infinite linear',
    }} />
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, color = 'linear-gradient(90deg,#6366f1,#a855f7)', isDark }) {
  return (
    <div style={{ height: 6, borderRadius: 3, background: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: 3,
        width: `${Math.min(value, 100)}%`,
        background: color,
        transition: 'width 0.9s cubic-bezier(.4,0,.2,1)',
      }} />
    </div>
  );
}

// ─── Horizontal Course Popularity Chart ──────────────────────────────────────
function MiniBarChart({ courses, isDark }) {
  const [hovered, setHovered] = React.useState(null);
  if (!courses || !courses.length) return null;
  const maxVal = Math.max(...courses.map(c => c.enrolledCount), 1);
  const COLORS = ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];
  const text    = isDark ? '#e2e8f0' : '#1e293b';
  const textSub = isDark ? '#94a3b8' : '#64748b';
  const trackBg = isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {courses.map((c, i) => {
        const pct = Math.round((c.enrolledCount / maxVal) * 100);
        const color = COLORS[i % COLORS.length];
        const isHov = hovered === i;
        return (
          <div
            key={c.courseId || i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            title={`${c.enrolledCount} student${c.enrolledCount !== 1 ? 's' : ''} enrolled${c.avgCompletion != null ? ` · ${c.avgCompletion}% avg completion` : ''}`}
            style={{
              padding: '8px 10px', borderRadius: 10,
              background: isHov ? (isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc') : 'transparent',
              border: `1px solid ${isHov ? color + '55' : 'transparent'}`,
              transition: 'all 0.18s ease', cursor: 'default',
            }}
          >
            {/* Top row: rank + name + count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              {/* Rank badge */}
              <div style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                background: color + '25', color,
                fontSize: 10, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{i + 1}</div>
              {/* Course name */}
              <div style={{
                flex: 1, fontSize: 12.5, fontWeight: 600, color: text,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{c.courseName || 'Untitled'}</div>
              {/* Enrollment pill */}
              <div style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, flexShrink: 0,
                background: color + '20', color,
              }}>
                {c.enrolledCount} {c.enrolledCount === 1 ? 'student' : 'students'}
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ height: 6, borderRadius: 3, background: trackBg, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3, width: `${pct}%`,
                background: `linear-gradient(90deg,${color},${COLORS[(i + 2) % COLORS.length]})`,
                transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
              }} />
            </div>
            {/* Bottom meta */}
            {c.avgCompletion != null && (
              <div style={{ fontSize: 10.5, color: textSub, marginTop: 4 }}>
                Avg completion: <span style={{ color, fontWeight: 600 }}>{c.avgCompletion}%</span>
                {c.totalTopics != null && <span style={{ marginLeft: 8 }}>· {c.totalTopics} topics</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Line chart (SVG) ─────────────────────────────────────────────────────────
function LineChart({ data, color = '#6366f1', isDark }) {
  if (!data.length) return null;
  const w = 300, h = 80;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w;
    const y = h - Math.max((v / max) * (h - 12), 2) - 4;
    return `${x},${y}`;
  }).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="line-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#line-grad)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w;
        const y = h - Math.max((v / max) * (h - 12), 2) - 4;
        return <circle key={i} cx={x} cy={y} r="3.5" fill={color} stroke={isDark ? '#0f172a' : '#fff'} strokeWidth="2" />;
      })}
    </svg>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, sub, color, isDark, suffix = '' }) {
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const border = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0';
  return (
    <div style={{
      background: cardBg, border, borderRadius: 18,
      padding: '22px 24px', position: 'relative', overflow: 'hidden',
      boxShadow: isDark ? '0 4px 28px rgba(0,0,0,0.35)' : '0 2px 16px rgba(0,0,0,0.07)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      animation: 'fadeUp 0.4s ease both',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = isDark ? '0 10px 32px rgba(0,0,0,0.5)' : '0 8px 28px rgba(0,0,0,0.13)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = isDark ? '0 4px 28px rgba(0,0,0,0.35)' : '0 2px 16px rgba(0,0,0,0.07)'; }}
    >
      {/* Glow */}
      <div style={{ position: 'absolute', top: -28, right: -28, width: 100, height: 100, borderRadius: '50%', background: `radial-gradient(circle,${color}44 0%,transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 13,
          background: `linear-gradient(135deg,${color}33,${color}18)`,
          border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>{icon}</div>
        {sub && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
            background: 'rgba(16,185,129,0.14)', color: '#10b981',
          }}>{sub}</span>
        )}
      </div>
      <div style={{ fontSize: 34, fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a', lineHeight: 1, letterSpacing: '-1px' }}>
        <CountUp value={value} />{suffix}
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, color: isDark ? '#94a3b8' : '#64748b', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ icon, message, isDark }) {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', color: isDark ? '#64748b' : '#94a3b8' }}>
      <div style={{ fontSize: 38, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{message}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { mode } = useTheme();
  const isDark  = mode === 'dark';

  const [stats,       setStats]       = useState(null);
  const [users,       setUsers]       = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [courses,     setCourses]     = useState([]);
  const [growth,      setGrowth]      = useState([]);
  const [loadingStats,     setLoadingStats]     = useState(true);
  const [loadingUsers,     setLoadingUsers]     = useState(true);
  const [loadingCourses,   setLoadingCourses]   = useState(true);
  const [loadingGrowth,    setLoadingGrowth]    = useState(true);
  const [error,            setError]            = useState(null);
  const [userSearch,       setUserSearch]       = useState('');
  const [activeTab,        setActiveTab]        = useState('recent'); // 'recent' | 'all'

  const adminName = (JSON.parse(localStorage.getItem('user') || '{}').name || 'Admin').split(' ')[0];

  // ── Fetch all in parallel
  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [statsRes, recentRes, allUsersRes, coursesRes, growthRes] = await Promise.allSettled([
        API.get('/admin/dashboard/stats'),
        API.get('/admin/dashboard/recent-users'),
        API.get('/admin/dashboard/all-users'),
        API.get('/admin/dashboard/popular-courses'),
        API.get('/admin/dashboard/user-growth'),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      else setError('Could not load dashboard stats.');

      if (recentRes.status === 'fulfilled') setRecentUsers(recentRes.value.data?.recentUsers || []);
      if (allUsersRes.status === 'fulfilled') setUsers(allUsersRes.value.data?.users || []);
      if (coursesRes.status === 'fulfilled') setCourses(coursesRes.value.data?.popularCourses || []);
      if (growthRes.status === 'fulfilled') setGrowth(growthRes.value.data?.growth || []);
    } catch (e) {
      setError('Unexpected error loading dashboard.');
    } finally {
      setLoadingStats(false);
      setLoadingUsers(false);
      setLoadingCourses(false);
      setLoadingGrowth(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Theme tokens
  const cardBg  = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const border  = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0';
  const textMain = isDark ? '#f1f5f9' : '#0f172a';
  const textSub  = isDark ? '#94a3b8' : '#64748b';
  const rowHover = isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc';
  const headBg   = isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc';

  // ── Filtered user list
  const displayedUsers = activeTab === 'recent' ? recentUsers : users;
  const filteredUsers  = displayedUsers.filter(u =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1200, paddingBottom: 40 }}>
      {/* ── CSS animations ─────────────────────────────────────────────── */}
      <style>{`
        @keyframes fadeUp   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
        @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        @keyframes barUp    { from { transform:scaleY(0); } to { transform:scaleY(1); } }
        .skel { background:linear-gradient(90deg,rgba(148,163,184,.08) 0%,rgba(148,163,184,.18) 50%,rgba(148,163,184,.08) 100%); background-size:400px 100%; animation:shimmer 1.5s infinite linear; }
        .adm-stat-grid  { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; margin-bottom:28px; }
        .adm-chart-grid { display:grid; grid-template-columns:1fr; gap:16px; margin-bottom:28px; }
        .adm-table-wrap { overflow-x:auto; }
        .adm-table-row-head { display:grid; grid-template-columns:2.2fr 2fr 80px 180px 70px; padding:10px 22px; }
        .adm-table-row      { display:grid; grid-template-columns:2.2fr 2fr 80px 180px 70px; padding:13px 22px; align-items:center; }
        .adm-course-row-head{ display:grid; grid-template-columns:2fr 80px 90px 170px 70px; padding:10px 22px; }
        .adm-course-row     { display:grid; grid-template-columns:2fr 80px 90px 170px 70px; padding:13px 22px; align-items:center; }
        @media(min-width:640px)  { .adm-stat-grid { grid-template-columns:repeat(3,1fr); } }
        @media(min-width:900px)  { .adm-stat-grid { grid-template-columns:repeat(5,1fr); } .adm-chart-grid { grid-template-columns:1fr 1fr; } }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{
            fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px',
            background: 'linear-gradient(90deg,#6366f1,#a855f7,#ec4899)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: 4,
          }}>
            Good {['morning','morning','afternoon','afternoon','afternoon','evening','evening'][Math.floor(new Date().getHours()/4)]}, {adminName} 👋
          </div>
          <div style={{ color: textSub, fontSize: 13.5 }}>
            Here's a real-time snapshot of StudyMate — all data from the database.
          </div>
        </div>
        <button onClick={fetchAll} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 10, border,
          background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
          color: textMain, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          transition: 'background 0.2s',
        }}>
          🔄 Refresh
        </button>
      </div>

      {/* ── Error banner ───────────────────────────────────────────────── */}
      {error && (
        <div style={{
          padding: '12px 18px', borderRadius: 12, marginBottom: 20,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
          color: '#ef4444', fontSize: 13, fontWeight: 500,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="adm-stat-grid">
        {loadingStats ? (
          [1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ background: cardBg, border, borderRadius: 18, padding: '22px 24px' }}>
              <Skel w={46} h={46} r={13} /><div style={{ marginTop: 18 }}><Skel h={34} w="55%" /><div style={{ marginTop: 8 }}><Skel h={12} w="70%" /></div></div>
            </div>
          ))
        ) : (
          <>
            <StatCard isDark={isDark} icon="👥" value={stats?.totalUsers ?? 0}        label="Total Users"       color="#6366f1" />
            <StatCard isDark={isDark} icon="📚" value={stats?.totalCourses ?? 0}       label="Total Courses"     color="#a855f7" />
            <StatCard isDark={isDark} icon="🎓" value={stats?.totalEnrollments ?? 0}  label="Total Enrollments" color="#06b6d4" />
            <StatCard isDark={isDark} icon="🟢" value={stats?.activeCourses ?? 0}     label="Active Courses"    color="#10b981" sub="Running" />
            <StatCard isDark={isDark} icon="🏆" value={stats?.avgCompletionPct ?? 0}  label="Avg Completion"    color="#f59e0b" suffix="%" />
          </>
        )}
      </div>

      {/* ── Charts row ────────────────────────────────────────────────────── */}
      <div className="adm-chart-grid">

        {/* User Growth line chart */}
        <div style={{ background: cardBg, border, borderRadius: 18, padding: '20px 24px', boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.25)' : '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: textMain }}>User Growth</div>
              <div style={{ fontSize: 12, color: textSub, marginTop: 2 }}>New registrations — last 6 months</div>
            </div>
            <div style={{ padding: '3px 10px', background: 'rgba(99,102,241,0.12)', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#818cf8' }}>Live</div>
          </div>
          {loadingGrowth ? <Skel h={80} r={8} /> : growth.length === 0 ? (
            <EmptyState icon="📈" message="No registration data yet" isDark={isDark} />
          ) : (
            <>
              <LineChart data={growth.map(g => g.count)} color="#6366f1" isDark={isDark} />
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 8 }}>
                {growth.map(g => (
                  <div key={g.month} style={{ fontSize: 9.5, color: textSub, textAlign: 'center' }}>
                    {formatMonth(g.month)}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Course Popularity bar chart */}
        <div style={{ background: cardBg, border, borderRadius: 18, padding: '20px 24px', boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.25)' : '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: textMain }}>Course Popularity</div>
            <div style={{ fontSize: 12, color: textSub, marginTop: 2 }}>Enrolments per course (top 8)</div>
          </div>
          {loadingCourses ? <Skel h={80} r={8} /> : courses.length === 0 ? (
            <EmptyState icon="📊" message="No enrollments yet" isDark={isDark} />
          ) : (
            <MiniBarChart
              courses={courses}
              isDark={isDark}
            />
          )}
        </div>
      </div>

      {/* ── Users table ───────────────────────────────────────────────────── */}
      <div style={{ background: cardBg, border, borderRadius: 18, overflow: 'hidden', boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.25)' : '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 28 }}>
      <div className="adm-table-wrap">
        {/* Table header */}
        <div style={{ padding: '16px 22px', borderBottom: border, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: textMain }}>Users</div>
            <div style={{ fontSize: 12, color: textSub, marginTop: 2 }}>
              {activeTab === 'recent'
                ? `${recentUsers.length} joined in the last 7 days`
                : `${users.length} total registered users`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Tabs */}
            {['recent', 'all'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeTab === tab
                  ? 'linear-gradient(135deg,#6366f1,#a855f7)'
                  : isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                color: activeTab === tab ? '#fff' : textSub,
                border: 'none',
              }}>
                {tab === 'recent' ? '🕐 Recent (7d)' : '👥 All Users'}
              </button>
            ))}
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 12, pointerEvents: 'none' }}>🔍</span>
              <input
                value={userSearch} onChange={e => setUserSearch(e.target.value)}
                placeholder="Search..."
                style={{
                  paddingLeft: 28, paddingRight: 10, height: 32, borderRadius: 8,
                  background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                  border, color: textMain, fontSize: 12, outline: 'none', width: 170,
                }}
              />
            </div>
          </div>
        </div>

        {/* Col headers */}
        <div className="adm-table-row-head" style={{ background: headBg, borderBottom: border }}>
          {['User', 'Email', 'Courses', 'Progress', 'Joined'].map(h => (
            <div key={h} style={{ fontSize: 10.5, fontWeight: 700, color: textSub, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {loadingUsers ? (
          [1, 2, 3, 4, 5].map(i => (
            <div key={i} className="adm-table-row" style={{ borderBottom: border, gap: 0 }}>
              {[1, 2, 3, 4, 5].map(j => <Skel key={j} h={14} w="60%" />)}
            </div>
          ))
        ) : filteredUsers.length === 0 ? (
          <EmptyState icon="👤" message={userSearch ? 'No users match your search' : 'No users available'} isDark={isDark} />
        ) : (
          filteredUsers.map((u, i) => (
            <div key={u._id} className="adm-table-row" style={{
              borderBottom: i < filteredUsers.length - 1 ? border : 'none',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = rowHover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: avatarColor(u.name), color: '#fff',
                  fontWeight: 700, fontSize: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{getInitials(u.name)}</div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: textMain }}>{u.name}</div>
                  <div style={{ fontSize: 10.5, color: textSub, marginTop: 1, textTransform: 'capitalize' }}>
                    {u.role} {u.status === 'blocked' ? '🚫' : ''}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div style={{ fontSize: 12.5, color: textSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{u.email}</div>

              {/* Courses */}
              <div style={{ fontSize: 13, fontWeight: 700, color: textMain }}>{u.enrolledCourses ?? 0}</div>

              {/* Progress */}
              <div style={{ paddingRight: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: textSub }}>{u.avgProgress ?? 0}%</span>
                </div>
                <ProgressBar value={u.avgProgress ?? 0} isDark={isDark} />
              </div>

              {/* Joined */}
              <div style={{ fontSize: 11.5, color: textSub }}>{timeAgo(u.createdAt)}</div>
            </div>
          ))
        )}

        {/* Footer */}
        {!loadingUsers && users.length > 0 && (
          <div style={{ padding: '12px 22px', borderTop: border, display: 'flex', justifyContent: 'flex-end' }}>
            <Link to="/admin/users" style={{ fontSize: 12.5, fontWeight: 600, color: '#6366f1', textDecoration: 'none' }}>
              View all users →
            </Link>
          </div>
        )}
      </div>{/* /adm-table-wrap */}
      </div>

      {/* ── Popular courses table ─────────────────────────────────────────── */}
      <div style={{ background: cardBg, border, borderRadius: 18, overflow: 'hidden', boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.25)' : '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '16px 22px', borderBottom: border, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: textMain }}>Most Popular Courses</div>
            <div style={{ fontSize: 12, color: textSub, marginTop: 2 }}>Ranked by number of enrollments</div>
          </div>
          <Link to="/admin/courses" style={{ fontSize: 12.5, fontWeight: 600, color: '#6366f1', textDecoration: 'none' }}>
            Manage courses →
          </Link>
        </div>

        <div className="adm-table-wrap">
        {/* Col headers */}
        <div className="adm-course-row-head" style={{ background: headBg, borderBottom: border }}>
          {['Course', 'Students', 'Topics', 'Avg Completion', 'Status'].map(h => (
            <div key={h} style={{ fontSize: 10.5, fontWeight: 700, color: textSub, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
          ))}
        </div>

        {loadingCourses ? (
          [1, 2, 3, 4, 5].map(i => (
            <div key={i} className="adm-course-row" style={{ borderBottom: border }}>
              {[1, 2, 3, 4, 5].map(j => <Skel key={j} h={14} w="65%" />)}
            </div>
          ))
        ) : courses.length === 0 ? (
          <EmptyState icon="📚" message="No courses available" isDark={isDark} />
        ) : (
          courses.map((c, i) => (
            <div key={c.courseId || i} className="adm-course-row" style={{
              borderBottom: i < courses.length - 1 ? border : 'none',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = rowHover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Course name + description */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: `hsl(${(i * 47) % 360},55%,45%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13,
                  }}>
                    {['📘', '🎯', '🧪', '💡', '🔬', '⚙️', '🛠️', '📊'][i % 8]}
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: textMain }}>{c.courseName}</div>
                    {c.description && (
                      <div style={{ fontSize: 11, color: textSub, marginTop: 1, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.description}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enrolled students */}
              <div style={{ fontSize: 13.5, fontWeight: 700, color: textMain }}>{c.enrolledCount}</div>

              {/* Topics */}
              <div style={{ fontSize: 13, color: textSub }}>{c.totalTopics} topics</div>

              {/* Avg completion */}
              <div style={{ paddingRight: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: textSub }}>{c.avgCompletion}%</span>
                </div>
                <ProgressBar
                  value={c.avgCompletion}
                  color={`linear-gradient(90deg,hsl(${(i * 47) % 360},60%,55%),hsl(${(i * 47 + 40) % 360},60%,55%))`}
                  isDark={isDark}
                />
              </div>

              {/* Status badge */}
              <div>
                <span style={{
                  padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: c.enrolledCount > 0 ? 'rgba(16,185,129,0.13)' : 'rgba(100,116,139,0.13)',
                  color: c.enrolledCount > 0 ? '#10b981' : '#64748b',
                }}>
                  {c.enrolledCount > 0 ? '● Active' : '○ Idle'}
                </span>
              </div>
            </div>
          ))
        )}
        </div>{/* /adm-table-wrap */}
      </div>
    </div>
  );
}
