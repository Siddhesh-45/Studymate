import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const studentId = user._id || user.id;

  useEffect(() => {
    if (studentId) fetchDashboardData();
  }, [studentId]);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError('');
      const res = await API.get('/student-courses');
      setCourses(res.data.courses || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  // ── Derived statistics ───────────────────────────────────────────────────
  const totalCourses = courses.length;
  const completedCourses = courses.filter((e) => e.progress === 100).length;
  const inProgressCourses = courses.filter((e) => e.progress > 0 && e.progress < 100).length;
  const notStartedCourses = courses.filter((e) => !e.progress || e.progress === 0).length;
  
  const overallAvg = totalCourses > 0 
    ? Math.round(courses.reduce((s, c) => s + (c.progress || 0), 0) / totalCourses) 
    : 0;

  if (loading) return (
    <div style={S.centered}>
      <div style={S.spinner} />
      <p style={S.loadingText}>Loading your dashboard…</p>
    </div>
  );

  if (error) return (
    <div style={S.centered}>
      <span style={{ fontSize: '40px' }}>⚠️</span>
      <p style={{ color: '#fca5a5', marginTop: '12px' }}>{error}</p>
    </div>
  );

  return (
    <div style={S.page}>
      
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>👋 Welcome back, {user.name?.split(' ')[0] || 'Student'}!</h1>
          <p style={S.subtitle}>Here's an overview of your study progress.</p>
        </div>
      </div>

      {/* ── Summary Cards (Stats) ───────────────────────────────────────── */}
      <div style={S.statsGrid}>
        <div style={{ ...S.statCard, borderTop: '4px solid #6366f1' }}>
          <span style={S.statValue}>{totalCourses}</span>
          <span style={S.statLabel}>Total Selected</span>
        </div>
        <div style={{ ...S.statCard, borderTop: '4px solid #22c55e' }}>
          <span style={S.statValue}>{completedCourses}</span>
          <span style={S.statLabel}>Completed</span>
        </div>
        <div style={{ ...S.statCard, borderTop: '4px solid #f59e0b' }}>
          <span style={S.statValue}>{inProgressCourses}</span>
          <span style={S.statLabel}>In Progress</span>
        </div>
        <div style={{ ...S.statCard, borderTop: '4px solid #94a3b8' }}>
          <span style={S.statValue}>{notStartedCourses}</span>
          <span style={S.statLabel}>Not Started</span>
        </div>
      </div>

      {/* ── Overall Progress Bar ───────────────────────────────────────── */}
      {totalCourses > 0 && (
        <div style={S.overallCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '15px' }}>Overall Progress</span>
            <span style={{ color: '#8b5cf6', fontWeight: '700', fontSize: '15px' }}>{overallAvg}%</span>
          </div>
          <div style={S.overallTrack}>
            <div style={{ ...S.overallFill, width: `${overallAvg}%` }} />
          </div>
        </div>
      )}

      {/* ── Course List Section ─────────────────────────────────────────── */}
      <h2 style={S.sectionTitle}>📚 Course Progress</h2>
      
      {totalCourses === 0 ? (
        <div style={S.emptyBox}>
          <span style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}>📋</span>
          <h3 style={{ color: '#f1f5f9', margin: '0 0 8px', fontSize: '18px' }}>Your dashboard is empty</h3>
          <p style={{ color: '#94a3b8', margin: '0 0 24px' }}>Add some courses to your list to track your progress.</p>
          <button style={S.browseBtn} onClick={() => navigate('/all-courses')}>
            Browse Courses
          </button>
        </div>
      ) : (
        <div style={S.courseList}>
          {courses.map((entry) => {
            const course = entry.courseId;
            const progress = entry.progress || 0;
            const isDone = progress === 100;
            const isNotStarted = progress === 0;
            
            if (!course) return null;

            return (
              <div key={entry._id} style={{ ...S.listItem, ...(isDone ? S.listItemDone : {}) }}>
                <div style={S.itemLeft}>
                  {/* Status indicator pip */}
                  <div style={{
                    ...S.statusPip,
                    background: isDone ? '#22c55e' : isNotStarted ? '#475569' : '#f59e0b'
                  }} />
                  
                  <div>
                    <h3 style={S.courseTitle}>{course.courseName || 'Untitled Course'}</h3>
                    <div style={S.statusBadgeWrap}>
                      <span style={{
                        ...S.statusBadge,
                        background: isDone ? 'rgba(34,197,94,0.15)' : isNotStarted ? 'rgba(148,163,184,0.15)' : 'rgba(245,158,11,0.15)',
                        color: isDone ? '#86efac' : isNotStarted ? '#cbd5e1' : '#fcd34d',
                        border: `1px solid ${isDone ? 'rgba(34,197,94,0.3)' : isNotStarted ? 'rgba(148,163,184,0.3)' : 'rgba(245,158,11,0.3)'}`
                      }}>
                        {isDone ? '🏆 Completed' : isNotStarted ? '⏸️ Not Started' : '⏳ In Progress'}
                      </span>
                      <span style={S.lessonCountText}>
                        {entry.completedCount || 0} / {entry.totalLessons || course.topics?.length || 0} lessons done
                      </span>
                    </div>
                  </div>
                </div>

                <div style={S.itemRight}>
                  <div style={S.progressWrap}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={S.progressLabel}>Progress</span>
                      <span style={{ ...S.progressVal, color: isDone ? '#22c55e' : '#a5b4fc' }}>{progress}%</span>
                    </div>
                    <div style={S.progressTrack}>
                      <div style={{
                        ...S.progressFill,
                        width: `${progress}%`,
                        background: isDone 
                          ? 'linear-gradient(90deg, #22c55e, #16a34a)' 
                          : 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                      }} />
                    </div>
                  </div>
                  
                  <button 
                    style={S.openBtn} 
                    onClick={() => navigate(`/course/${course._id}`)}
                  >
                    Open
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page:         { padding: '8px 0 40px', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  centered:     { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' },
  spinner:      { width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.3)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText:  { color: 'rgba(255,255,255,0.4)', fontSize: '14px' },

  header:       { marginBottom: '28px' },
  title:        { fontSize: '30px', fontWeight: '800', color: '#f1f5f9', margin: '0 0 4px', letterSpacing: '-0.5px' },
  subtitle:     { color: '#94a3b8', fontSize: '15px', margin: 0 },

  statsGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard:     { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '4px' },
  statValue:    { fontSize: '32px', fontWeight: '700', color: '#f1f5f9', lineHeight: 1 },
  statLabel:    { fontSize: '13px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' },

  overallCard:  { background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px', padding: '20px', marginBottom: '32px' },
  overallTrack: { width: '100%', height: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', overflow: 'hidden' },
  overallFill:  { height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '4px', transition: 'width 0.8s ease' },

  sectionTitle: { fontSize: '20px', fontWeight: '700', color: '#e2e8f0', marginBottom: '16px' },

  emptyBox:     { background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px', padding: '60px 20px', textAlign: 'center' },
  browseBtn:    { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '10px', padding: '12px 24px', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },

  courseList:   { display: 'flex', flexDirection: 'column', gap: '12px' },
  listItem:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px', flexWrap: 'wrap', gap: '20px', transition: 'transform 0.2s, background 0.2s' },
  listItemDone: { background: 'rgba(34,197,94,0.03)', borderColor: 'rgba(34,197,94,0.15)' },
  
  itemLeft:     { display: 'flex', alignItems: 'flex-start', gap: '16px', flex: '1 1 300px' },
  statusPip:    { width: '12px', height: '12px', borderRadius: '50%', marginTop: '6px', flexShrink: 0, boxShadow: '0 0 10px rgba(0,0,0,0.5)' },
  courseTitle:  { margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#f1f5f9', lineHeight: '1.3' },
  
  statusBadgeWrap:{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  statusBadge:  { fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.04em' },
  lessonCountText:{ color: '#64748b', fontSize: '13px' },

  itemRight:    { display: 'flex', alignItems: 'center', gap: '24px', flex: '1 1 250px', justifyContent: 'flex-end', flexWrap: 'wrap' },
  progressWrap: { flex: '1 1 150px', minWidth: '150px' },
  progressLabel:{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' },
  progressVal:  { fontSize: '13px', fontWeight: '700' },
  progressTrack:{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '3px', transition: 'width 0.5s ease' },
  
  openBtn:      { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', color: '#e2e8f0', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' },
};
