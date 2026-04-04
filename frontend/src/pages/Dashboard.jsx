// Dashboard.jsx — Premium Analytics Dashboard
// Uses /api/progress/stats (Task 9) + /api/student-courses + /api/schedule/smart
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import API from '../api';
import TodaySchedule from '../components/TodaySchedule';
import WeakTopics     from '../components/WeakTopics';

// ── Motivational quote popup component ──────────────────────────────────────────
import QuotePopup from '../components/QuotePopup';

// ── Animation presets ─────────────────────────────────────────────────────────
const smoothFade   = { hidden: { opacity: 0, scale: 0.97 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: 'easeOut' } } };
const stagger      = { hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };
const cardEntry    = { hidden: { opacity: 0, scale: 0.94, y: 8 }, visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };
const slideUp      = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } };

// ── Custom Recharts tooltip ───────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={S.tooltip}>
      <p style={{ color: 'var(--sm-text-sub)', fontSize: 11, marginBottom: 4 }}>{label}</p>
      <p style={{ color: 'var(--sm-indigo)', fontSize: 15, fontWeight: 800, margin: 0 }}>{payload[0].value} topics</p>
    </div>
  );
}

// ── Streak Flame component ────────────────────────────────────────────────────
function StreakFlame({ streak }) {
  return (
    <div style={S.flameWrap}>
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [-3, 3, -3] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        style={{ fontSize: 36, lineHeight: 1, filter: streak > 0 ? 'drop-shadow(0 0 8px var(--sm-orange))' : 'grayscale(1)' }}
      >🔥</motion.div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: streak > 0 ? 'var(--sm-orange)' : 'var(--sm-text-muted)', lineHeight: 1 }}>
          {streak}
        </div>
        <div style={{ fontSize: 11, color: 'var(--sm-text-sub)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {streak === 1 ? 'day streak' : 'day streak'}
        </div>
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function Skeleton({ h = 200, w = '100%', r = 18, mb = 16 }) {
  return (
    <motion.div
      animate={{ opacity: [0.2, 0.45, 0.2] }}
      transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
      style={{ background: 'var(--sm-card-bg, var(--sm-surface-4))', borderRadius: r, height: h, width: w, marginBottom: mb, border: '1px solid var(--sm-surface-6)' }}
    />
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [courses,      setCourses]      = useState([]);
  const [schedule,     setSchedule]     = useState(null);
  const [stats,        setStats]        = useState(null);        // NEW: /api/progress/stats
  const [loading,      setLoading]      = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [schedLoading, setSchedLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error,        setError]        = useState('');
  const navigate = useNavigate();

  const user      = JSON.parse(localStorage.getItem('user') || '{}');
  const studentId = user._id || user.id;
  const firstName = user.name?.split(' ')[0] || 'Student';

  // Greeting
  const greetHour = new Date().getHours();
  const greeting  = greetHour < 12 ? '☀️ Good morning' : greetHour < 17 ? '🌤 Good afternoon' : '🌙 Good evening';

  // ── Data fetchers ───────────────────────────────────────────────────────────
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/student-courses');
      setCourses(res.data.courses || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses.');
    } finally { setLoading(false); }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await API.get('/progress/stats');
      setStats(res.data);
    } catch { /* stats optional */ }
    finally { setStatsLoading(false); }
  }, []);

  const fetchSchedule = useCallback(async () => {
    try {
      setSchedLoading(true);
      const res = await API.get('/schedule/smart');
      setSchedule(res.data?.schedule || res.data || null);
    } catch { /* no schedule yet */ }
    finally { setSchedLoading(false); }
  }, []);

  const regenerate = async () => {
    setRegenerating(true); setError('');
    try {
      await API.post('/schedule/generate-smart', {});
      await fetchSchedule();
    } catch (err) {
      setError(err.response?.data?.message || 'Regeneration failed.');
    } finally { setRegenerating(false); }
  };

  useEffect(() => {
    if (studentId) { fetchCourses(); fetchSchedule(); fetchStats(); }
  }, [studentId, fetchCourses, fetchSchedule, fetchStats]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const totalCourses  = courses.length;
  const completedCrs  = courses.filter(e => e.progress === 100).length;
  const inProgressCrs = courses.filter(e => e.progress > 0 && e.progress < 100).length;
  const overallAvg    = totalCourses > 0
    ? Math.round(courses.reduce((s, c) => s + (c.progress || 0), 0) / totalCourses) : 0;

  const scheduleDays = schedule?.days || [];
  const allTasks     = scheduleDays.flatMap(d => d.tasks || []);
  const doneCount    = allTasks.filter(t => t.status === 'completed').length;
  const schedPct     = allTasks.length > 0 ? Math.round((doneCount / allTasks.length) * 100) : 0;

  // Progress API stats
  const streak         = stats?.streak || 0;
  const totalCompleted = stats?.totalCompleted || 0;
  const last7Days      = stats?.dashboard?.last7Days || [];
  const courseProgress = stats?.courseProgress || [];

  // Chart data — format dates nicely
  const chartData = last7Days.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    topics: d.count
  }));

  // Stat cards config
  const STATS = [
    {
      label: 'Topics Done',
      value: totalCompleted,
      icon: '📘',
      color: 'var(--sm-indigo)',
      glow: 'rgba(129,140,248,0.3)',
      sub: 'total completed',
      loading: statsLoading
    },
    {
      label: 'Day Streak',
      value: streak,
      icon: null, // uses StreakFlame
      color: 'var(--sm-orange)',
      glow: 'rgba(251,146,60,0.3)',
      sub: streak > 0 ? '🔥 Keep it up!' : 'Start today!',
      isStreak: true,
      loading: statsLoading
    },
    {
      label: 'Avg Progress',
      value: `${overallAvg}%`,
      icon: '📊',
      color: 'var(--sm-emerald-muted)',
      glow: 'rgba(52,211,153,0.3)',
      sub: `${completedCrs} courses done`,
      loading: false
    },
    {
      label: 'Tasks Done',
      value: doneCount,
      icon: '✅',
      color: 'var(--sm-cyan-muted)',
      glow: 'rgba(56,189,248,0.3)',
      sub: `${schedPct}% of schedule`,
      loading: false
    },
  ];

  // ── Full-page loading ───────────────────────────────────────────────────────
  if (loading) return (
    <div style={S.centered}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={S.spinner} />
      <p style={{ color: 'var(--sm-text-muted, #475569)', fontSize: 14 }}>Loading your dashboard…</p>
    </div>
  );

  return (
    <motion.div variants={smoothFade} initial="hidden" animate="visible" style={S.page}>

      {/* ── Motivational quote popup ──────────────────────────────────────── */}
      <QuotePopup />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>{greeting}, <span style={S.gradientName}>{firstName}!</span></h1>
          <p style={S.subtitle}>Here's your study progress overview.</p>
        </div>
        <div style={S.headerRight}>
          {/* Overall mini-pill */}
          <div style={S.pill}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallAvg}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={S.pillFill}
            />
            <span style={S.pillText}>Overall {overallAvg}%</span>
          </div>
          {/* Regenerate button */}
          <motion.button
            whileHover={{ opacity: 0.88, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.18 }}
            style={regenerating ? S.btnBusy : S.btnRegen}
            onClick={regenerate}
            disabled={regenerating}
          >
            {regenerating
              ? <><RotatingIcon /> Regenerating…</>
              : '🔄 Regenerate Schedule'}
          </motion.button>
        </div>
      </div>

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.25 }}
            style={S.error}
          >
            ⚠️ {error}
            <button style={S.errClose} onClick={() => setError('')}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <motion.div variants={stagger} initial="hidden" animate="visible" style={S.statGrid}>
        {STATS.map((s) => (
          <motion.div
            key={s.label}
            variants={cardEntry}
            whileHover={{ y: -4, boxShadow: `0 20px 48px rgba(0,0,0,0.5), 0 0 0 1px ${s.color}30` }}
            transition={{ duration: 0.2 }}
            style={{ ...S.statCard, borderTop: `2px solid ${s.color}55` }}
          >
            {s.loading ? (
              <Skeleton h={72} r={8} mb={0} />
            ) : s.isStreak ? (
              <StreakFlame streak={s.value} />
            ) : (
              <>
                <div style={S.statIconRow}>
                  <span style={{ fontSize: 22 }}>{s.icon}</span>
                  <div style={{ ...S.statGlowDot, background: s.glow }} />
                </div>
                <span style={{ ...S.statValue, color: s.color }}>{s.value}</span>
                <span style={S.statLabel}>{s.label}</span>
                <span style={S.statSub}>{s.sub}</span>
              </>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* ── Activity chart + Course progress (2-col) ────────────────────────── */}
      <div style={S.twoCol}>

        {/* Activity Area Chart */}
        <motion.div variants={cardEntry} initial="hidden" animate="visible" style={{ ...S.card, flex: '1 1 380px' }}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>📈 7-Day Activity</span>
            {statsLoading && <span style={S.loadingBadge}>loading…</span>}
          </div>
          {statsLoading ? (
            <Skeleton h={200} r={8} mb={0} />
          ) : chartData.every(d => d.topics === 0) ? (
            <div style={S.emptyChart}>
              <span style={{ fontSize: 32 }}>📋</span>
              <p style={{ color: 'var(--sm-text-muted,#475569)', fontSize: 13, margin: '8px 0 0' }}>
                No study activity yet this week.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--sm-indigo)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--sm-indigo)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--sm-surface-4)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--sm-text-sub)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'var(--sm-text-sub)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(129,140,248,0.2)', strokeWidth: 1 }} />
                <Area
                  type="monotone" dataKey="topics" stroke="var(--sm-indigo)" strokeWidth={2.5}
                  fill="url(#areaGrad)" dot={{ r: 4, fill: 'var(--sm-indigo)', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#c084fc', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Course Progress Bars (from /api/progress/stats) */}
        <motion.div variants={cardEntry} initial="hidden" animate="visible" style={{ ...S.card, flex: '1 1 320px' }}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>🎯 Course Progress</span>
            {statsLoading && <span style={S.loadingBadge}>loading…</span>}
          </div>
          {statsLoading ? (
            <>
              {[1,2,3].map(i => <Skeleton key={i} h={48} r={8} mb={12} />)}
            </>
          ) : courseProgress.length === 0 ? (
            <div style={S.emptyChart}>
              <span style={{ fontSize: 32 }}>📚</span>
              <p style={{ color: 'var(--sm-text-muted,#475569)', fontSize: 13, margin: '8px 0 0' }}>
                Enroll in a course to see progress.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {courseProgress.map((cp, i) => {
                const pct  = cp.percentage || 0;
                const done = pct === 100;
                const bar  = done
                  ? 'linear-gradient(90deg,var(--sm-emerald-muted),#059669)'
                  : i % 3 === 0
                  ? 'linear-gradient(90deg,var(--sm-indigo),#a78bfa)'
                  : i % 3 === 1
                  ? 'linear-gradient(90deg,var(--sm-cyan-muted),var(--sm-indigo))'
                  : 'linear-gradient(90deg,var(--sm-orange),#f472b6)';
                return (
                  <div key={cp.courseId}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: 'var(--sm-text,#f1f5f9)', fontSize: 13, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 10 }}>
                        {cp.courseName}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: done ? 'var(--sm-emerald-muted)' : 'var(--sm-indigo)', flexShrink: 0 }}>
                        {cp.completedTopics}/{cp.totalTopics}
                      </span>
                    </div>
                    <div style={S.progressTrack}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                        style={{ height: '100%', background: bar, borderRadius: 4 }}
                      />
                    </div>
                    <div style={{ marginTop: 4, fontSize: 11, color: 'var(--sm-text-sub)' }}>
                      {pct}% complete {done && '✅'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Task analytics + Weak topics (existing components) ──────────────── */}
      <motion.h2 variants={cardEntry} initial="hidden" animate="visible" style={S.sectionTitle}>📊 Schedule Analytics</motion.h2>
      <div style={S.twoCol}>
        <div style={{ flex: '1 1 280px', minWidth: 0 }}>
          {schedLoading ? <Skeleton h={300} /> : <AnalyticsDonut days={scheduleDays} />}
        </div>
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          {schedLoading ? <Skeleton h={300} /> : <WeakTopics days={scheduleDays} />}
        </div>
      </div>

      {/* ── Today's plan ────────────────────────────────────────────────────── */}
      {schedLoading
        ? <Skeleton h={180} mb={24} />
        : <TodaySchedule days={scheduleDays} onRefresh={fetchSchedule} />}

      {/* ── Course list ─────────────────────────────────────────────────────── */}
      <motion.h2 variants={cardEntry} initial="hidden" animate="visible" style={S.sectionTitle}>📚 My Courses</motion.h2>

      {totalCourses === 0 ? (
        <motion.div variants={cardEntry} initial="hidden" animate="visible" style={S.emptyBox}>
          <span style={{ fontSize: 52, display: 'block', marginBottom: 14 }}>📋</span>
          <h3 style={{ color: 'var(--sm-text,#f1f5f9)', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>No courses yet</h3>
          <p style={{ color: 'var(--sm-text-muted,#475569)', margin: '0 0 24px', fontSize: 14 }}>
            Enroll in courses to start tracking your progress.
          </p>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={S.browseBtn}
            onClick={() => navigate('/all-courses')}>Browse Courses →</motion.button>
        </motion.div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" style={S.courseList}>
          {courses.map((entry) => {
            const course      = entry.courseId;
            const progress    = entry.progress || 0;
            const isDone      = progress === 100;
            const isNotStart  = progress === 0;
            if (!course) return null;

            const st = isDone
              ? { label: '🏆 Completed',   bg: 'rgba(52,211,153,0.1)',   color: 'var(--sm-emerald)', pip: 'var(--sm-emerald-muted)' }
              : isNotStart
              ? { label: '⏸ Not Started', bg: 'rgba(100,116,139,0.08)', color: 'var(--sm-text-sub,#94a3b8)', pip: 'var(--sm-text-muted)' }
              : { label: '⏳ In Progress', bg: 'rgba(251,191,36,0.1)',   color: 'var(--sm-yellow)', pip: '#fbbf24' };

            return (
              <motion.div
                key={entry._id}
                variants={cardEntry}
                whileHover={{ y: -2, boxShadow: '0 16px 44px rgba(0,0,0,0.4)' }}
                transition={{ duration: 0.2 }}
                style={{ ...S.courseCard, ...(isDone ? { borderColor: 'rgba(52,211,153,0.15)', background: 'rgba(52,211,153,0.03)' } : {}) }}
              >
                <div style={S.courseLeft}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: st.pip, boxShadow: `0 0 8px ${st.pip}60`, marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <p style={S.courseName}>{course.courseName || 'Untitled'}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ ...S.badge, background: st.bg, color: st.color }}>{st.label}</span>
                      <span style={{ color: 'var(--sm-text-muted,#475569)', fontSize: 12 }}>
                        {entry.completedCount || 0}/{entry.totalLessons || course.topics?.length || 0} lessons
                      </span>
                    </div>
                  </div>
                </div>

                <div style={S.courseRight}>
                  <div style={{ flex: '1 1 140px', minWidth: 130 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: 'var(--sm-text-muted,#475569)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: isDone ? 'var(--sm-emerald-muted)' : 'var(--sm-indigo)' }}>{progress}%</span>
                    </div>
                    <div style={{ width: '100%', height: 5, background: 'var(--sm-surface-5)', borderRadius: 3, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}
                        style={{ height: '100%', borderRadius: 3, background: isDone ? 'linear-gradient(90deg,var(--sm-emerald-muted),#059669)' : 'linear-gradient(90deg,var(--sm-indigo),#a78bfa)' }}
                      />
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    style={S.openBtn}
                    onClick={() => navigate(`/course/${course._id}`)}
                  >Open →</motion.button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Inline donut chart (replaces import from ProgressChart so it's self-contained here) ──
import { PieChart, Pie, Cell, Sector } from 'recharts';

function AnalyticsDonut({ days }) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const all   = days.flatMap(d => d.tasks || []);
  const done  = all.filter(t => t.status === 'completed').length;
  const pend  = all.filter(t => t.status === 'pending').length;
  const miss  = all.filter(t => t.status === 'missed').length;
  const total = all.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  const data = [
    { name: 'Completed', value: done,  color: 'var(--sm-emerald-muted)' },
    { name: 'Pending',   value: pend,  color: 'var(--sm-indigo)' },
    { name: 'Missed',    value: miss,  color: 'var(--sm-red-muted)' },
  ].filter(d => d.value > 0);

  const onPieEnter = (_, index) => setActiveIndex(index);
  const onPieLeave = () => setActiveIndex(-1);

  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: `drop-shadow(0px 0px 10px ${fill}80)`, cursor: 'pointer', transition: 'all 0.25s ease' }}
      />
    );
  };

  return (
    <motion.div 
      variants={cardEntry} 
      initial="hidden" 
      animate="visible" 
      whileHover={{ y: -4, boxShadow: '0 20px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.2)' }}
      transition={{ duration: 0.2 }}
      style={S.card}
    >
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>📊 Task Analytics</span>
        <span style={S.countBadge}>{total} tasks</span>
      </div>
      {total === 0 ? (
        <div style={S.emptyChart}>
          <span style={{ fontSize: 36 }}>📋</span>
          <p style={{ color: 'var(--sm-text-muted,#334155)', fontSize: 13, margin: '8px 0 0' }}>Generate a schedule to see analytics</p>
        </div>
      ) : (
        <>
          <div style={{ position: 'relative' }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie 
                  data={data} cx="50%" cy="50%" 
                  innerRadius={58} outerRadius={84} 
                  paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  style={{ cursor: 'pointer', outline: 'none' }}
                >
                  {data.map(e => <Cell key={e.name} fill={e.color} style={{ transition: 'all 0.25s', cursor: 'pointer', outline: 'none' }} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={S.donutCenter}>
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={S.donutPct}>{pct}%</motion.span>
              <span style={{ display: 'block', fontSize: 10, color: 'var(--sm-text-sub)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>complete</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 4, flexWrap: 'wrap' }}>
            {[{ k:'Completed', c:'var(--sm-emerald-muted)', v:done }, { k:'Pending', c:'var(--sm-indigo)', v:pend }, { k:'Missed', c:'var(--sm-red-muted)', v:miss }].filter(x=>x.v>0).map(x =>(
              <div key={x.k} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:x.c }} />
                <span style={{ color:'var(--sm-text-sub)', fontSize:12 }}>{x.k}</span>
                <span style={{ color:'var(--sm-text,#cbd5e1)', fontSize:13, fontWeight:700 }}>{x.v}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}

// ── Mini helpers ──────────────────────────────────────────────────────────────
function RotatingIcon() {
  return (
    <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
      style={{ display: 'inline-block', marginRight: 6 }}>⟳</motion.span>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const CARD = {
  background:    'var(--sm-card-bg,    var(--sm-surface-4))',
  border:        'var(--sm-card-border, 1px solid var(--sm-surface-8))',
  borderRadius:  18,
  backdropFilter:'blur(16px)',
  boxShadow:     'var(--sm-card-shadow, 0 4px 24px rgba(0,0,0,0.35))',
  transition:    'background 0.35s ease, border 0.35s ease, box-shadow 0.35s ease',
};

const S = {
  page:    { padding: '4px 0 64px', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" },
  centered:{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:16 },
  spinner: { width:36, height:36, border:'3px solid rgba(99,102,241,0.2)', borderTop:'3px solid #6366f1', borderRadius:'50%' },

  // Quote Popup
  quoteOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  quotePopup: {
    ...CARD,
    position: 'relative',
    padding: '44px 32px 36px',
    maxWidth: '480px',
    width: '90%',
    textAlign: 'center',
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
    border: '1px solid rgba(129, 140, 248, 0.3)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(129, 140, 248, 0.1) inset',
  },
  quoteCloseBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'var(--sm-surface-5)',
    border: 'none',
    color: 'var(--sm-text-muted, #94a3b8)',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    transition: 'all 0.2s',
  },
  quotePopupIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '16px',
  },
  quotePopupText: {
    color: 'var(--sm-text, #f1f5f9)',
    fontSize: '20px',
    fontStyle: 'italic',
    fontWeight: '600',
    lineHeight: 1.45,
    margin: '0 0 16px 0',
  },
  quotePopupAuthor: {
    color: 'var(--sm-indigo)',
    fontSize: '14px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: 0,
  },

  // Header
  header:      { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:16 },
  title:       { fontSize:28, fontWeight:800, color:'var(--sm-text,#f1f5f9)', margin:'0 0 5px', letterSpacing:'-0.6px', lineHeight:1.15 },
  gradientName:{ background:'var(--sm-accent-grad,linear-gradient(90deg,var(--sm-indigo),#c084fc,#f472b6))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' },
  subtitle:    { color:'var(--sm-text-muted,#475569)', fontSize:14, margin:0 },
  headerRight: { display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' },

  pill:     { position:'relative', width:130, height:26, background:'var(--sm-surface-4)', border:'1px solid var(--sm-surface-8)', borderRadius:13, overflow:'hidden' },
  pillFill: { position:'absolute', inset:0, background:'linear-gradient(90deg,rgba(129,140,248,0.4),rgba(192,132,252,0.4))', borderRadius:13 },
  pillText: { position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--sm-text,#e2e8f0)' },

  btnRegen: { display:'inline-flex', alignItems:'center', background:'linear-gradient(90deg,#6366f1,#a855f7,#ec4899)', border:'none', borderRadius:12, padding:'10px 20px', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', gap:6, boxShadow:'0 4px 20px rgba(99,102,241,0.35)' },
  btnBusy:  { display:'inline-flex', alignItems:'center', background:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:12, padding:'10px 20px', color:'var(--sm-indigo-muted)', fontWeight:700, fontSize:13, cursor:'not-allowed', gap:6 },

  error:    { ...CARD, padding:'10px 16px', color:'var(--sm-red)', fontSize:13, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' },
  errClose: { background:'none', border:'none', color:'var(--sm-red)', cursor:'pointer', fontSize:18, lineHeight:1 },

  // Stat grid
  statGrid:    { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))', gap:14, marginBottom:24 },
  statCard:    { ...CARD, padding:'20px', display:'flex', flexDirection:'column', gap:4, cursor:'default', position:'relative', overflow:'hidden' },
  statIconRow: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 },
  statGlowDot: { width:32, height:32, borderRadius:'50%', opacity:0.25, filter:'blur(10px)' },
  statValue:   { fontSize:30, fontWeight:800, lineHeight:1 },
  statLabel:   { fontSize:12, fontWeight:600, color:'var(--sm-text,#94a3b8)' },
  statSub:     { fontSize:10, color:'var(--sm-text-muted,#334155)', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:2 },

  // Streak flame
  flameWrap: { display:'flex', alignItems:'center', gap:12, padding:'4px 0' },

  // Two-column layout
  twoCol: { display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' },

  // Generic card
  card:       { ...CARD, padding:'22px 20px' },
  cardHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  cardTitle:  { color:'var(--sm-text,#e2e8f0)', fontSize:15, fontWeight:700 },
  countBadge: { background:'rgba(129,140,248,0.12)', border:'1px solid rgba(129,140,248,0.2)', color:'var(--sm-indigo)', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 },
  loadingBadge:{ color:'var(--sm-text-sub)', fontSize:11, fontStyle:'italic' },
  emptyChart: { textAlign:'center', padding:'40px 0', display:'flex', flexDirection:'column', alignItems:'center' },
  progressTrack:{ width:'100%', height:6, background:'var(--sm-surface-6)', borderRadius:4, overflow:'hidden' },

  // Tooltip
  tooltip: { background:'rgba(15,23,42,0.95)', border:'1px solid var(--sm-surface-8)', borderRadius:10, padding:'10px 14px', backdropFilter:'blur(10px)' },

  // Donut
  donutCenter: { position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', pointerEvents:'none' },
  donutPct:    { display:'block', fontSize:26, fontWeight:800, lineHeight:1, background:'linear-gradient(135deg,var(--sm-indigo),#c084fc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' },

  sectionTitle: { fontSize:17, fontWeight:700, color:'var(--sm-text,#cbd5e1)', marginBottom:14, marginTop:8, letterSpacing:'-0.3px' },
  emptyBox:     { ...CARD, padding:'64px 20px', textAlign:'center' },
  browseBtn:    { background:'var(--sm-accent-grad,linear-gradient(90deg,#6366f1,#a855f7))', border:'none', borderRadius:12, padding:'11px 24px', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' },

  // Course list
  courseList:  { display:'flex', flexDirection:'column', gap:10 },
  courseCard:  { ...CARD, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', flexWrap:'wrap', gap:16, cursor:'default' },
  courseLeft:  { display:'flex', alignItems:'flex-start', gap:14, flex:'1 1 240px' },
  courseName:  { color:'var(--sm-text,#f1f5f9)', fontSize:15, fontWeight:700, margin:'0 0 7px', lineHeight:1.25 },
  badge:       { fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 },
  courseRight: { display:'flex', alignItems:'center', gap:18, flex:'1 1 220px', justifyContent:'flex-end', flexWrap:'wrap' },
  openBtn:     { background:'rgba(129,140,248,0.12)', border:'1px solid rgba(129,140,248,0.25)', borderRadius:10, padding:'8px 18px', color:'var(--sm-indigo)', fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' },
};
