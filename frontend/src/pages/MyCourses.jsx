import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function MyCourses() {
  const [courses,  setCourses ] = useState([]);
  const [loading,  setLoading ] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [toast,    setToast   ] = useState(null);
  const [error,    setError   ] = useState('');
  const navigate = useNavigate();

  const user      = JSON.parse(localStorage.getItem('user') || '{}');
  const studentId = user._id || user.id;

  useEffect(() => {
    if (studentId) fetchMyCourses();
  }, [studentId]);

  async function fetchMyCourses() {
    try {
      setLoading(true);
      setError('');
      // Use the token-based route (no studentId in URL) to get enriched data
      const res = await API.get('/student-courses');
      setCourses(res.data.courses || []);
    } catch (err) {
      console.error('MyCourses fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load your courses.');
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleRemove(studentCourseId, courseName) {
    setRemoving(studentCourseId);
    try {
      await API.delete(`/student-courses/${studentCourseId}`);
      setCourses((prev) => prev.filter((e) => e._id !== studentCourseId));
      showToast(`"${courseName}" removed from your courses.`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove course.', 'error');
    } finally {
      setRemoving(null);
    }
  }

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalCourses    = courses.length;
  const completedCourses = courses.filter((e) => e.progress === 100).length;
  const avgProgress     = totalCourses > 0
    ? Math.round(courses.reduce((s, e) => s + (e.progress || 0), 0) / totalCourses)
    : 0;

  if (loading) return (
    <div style={S.centered}>
      <div style={S.spinner} />
      <p style={S.loadingText}>Loading your courses…</p>
    </div>
  );

  if (error) return (
    <div style={S.centered}>
      <span style={{ fontSize: '40px' }}>⚠️</span>
      <p style={{ color: 'var(--sm-red)', marginTop: '12px' }}>{error}</p>
    </div>
  );

  return (
    <div style={S.page}>

      {/* Toast */}
      {toast && (
        <div style={{ ...S.toast, ...S.toastColors[toast.type] }}>
          {toast.type === 'success' ? '✅' : '⚠️'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>🎯 My Courses</h1>
          <p style={S.subtitle}>
            Your personal course list — only these appear in your schedule & progress tracking.
          </p>
        </div>
        <div style={S.countBadge}>{totalCourses} selected</div>
      </div>

      {/* Summary stats bar */}
      {totalCourses > 0 && (
        <div style={S.statsBar}>
          <div style={S.statItem}>
            <span style={S.statNum}>{totalCourses}</span>
            <span style={S.statLabel}>Enrolled</span>
          </div>
          <div style={S.statDivider} />
          <div style={S.statItem}>
            <span style={S.statNum}>{completedCourses}</span>
            <span style={S.statLabel}>Completed</span>
          </div>
          <div style={S.statDivider} />
          <div style={S.statItem}>
            <span style={{ ...S.statNum, color: 'var(--sm-indigo-muted)' }}>{avgProgress}%</span>
            <span style={S.statLabel}>Avg. Progress</span>
          </div>
          <div style={{ flex: 1, marginLeft: '20px' }}>
            <div style={S.overallTrack}>
              <div style={{ ...S.overallFill, width: `${avgProgress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {courses.length === 0 && (
        <div style={S.emptyBox}>
          <span style={S.emptyIcon}>📋</span>
          <p style={S.emptyTitle}>No courses selected yet</p>
          <p style={S.emptySubtitle}>
            Go to <strong style={{ color: 'var(--sm-indigo-muted)' }}>All Courses</strong> and click
            "Add to My Courses" to build your personal list.
          </p>
          <button style={S.browsBtn} onClick={() => navigate('/all-courses')}>
            Browse All Courses →
          </button>
        </div>
      )}

      {/* Course grid */}
      <div style={S.grid}>
        {courses.map((entry) => {
          const course       = entry.courseId;
          const progress     = entry.progress     ?? 0;
          const completed    = entry.completedCount  ?? 0;
          const total        = entry.totalLessons    ?? course?.topics?.length ?? 0;
          const isRemoving   = removing === entry._id;
          const isDone       = progress === 100;

          if (!course) return null;

          const addedDate = new Date(entry.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
          });

          return (
            <div key={entry._id} style={{ ...S.card, ...(isDone ? S.cardDone : {}) }}>

              {/* Banner */}
              <div style={{ ...S.cardBanner, ...(isDone ? S.cardBannerDone : {}) }}>
                <span style={S.cardIcon}>{isDone ? '🏆' : '📚'}</span>
                <span style={{ ...S.selectedBadge, ...(isDone ? S.selectedBadgeDone : {}) }}>
                  {isDone ? '✓ Completed!' : '✓ Enrolled'}
                </span>
              </div>

              {/* Body */}
              <div style={S.cardBody}>
                <h2 style={S.courseTitle}>{course.courseName || 'Untitled Course'}</h2>

                {course.description && (
                  <p style={S.courseDesc}>{course.description}</p>
                )}

                {/* Progress section */}
                <div style={S.progressSection}>
                  <div style={S.progressRow}>
                    <span style={S.progressLabel}>Progress</span>
                    <span style={{ ...S.progressPct, color: isDone ? '#86efac' : 'var(--sm-indigo-muted)' }}>
                      {progress}%
                    </span>
                  </div>
                  <div style={S.progressTrack}>
                    <div style={{
                      ...S.progressFill,
                      width: `${progress}%`,
                      background: isDone
                        ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                        : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                    }} />
                  </div>
                  <div style={S.lessonCount}>
                    <span style={{ color: isDone ? '#86efac' : 'var(--sm-indigo-muted)', fontWeight: 600 }}>
                      {completed}
                    </span>
                    <span style={{ color: 'var(--sm-text-sub)' }}> / {total} lessons completed</span>
                  </div>
                </div>

                {/* Meta chips */}
                <div style={S.metaRow}>
                  <span style={S.metaTag}>📖 {total} {total === 1 ? 'lesson' : 'lessons'}</span>
                  <span style={S.metaTag}>📅 Added {addedDate}</span>
                </div>

                {/* Action buttons */}
                <div style={S.btnRow}>
                  <button
                    style={S.openBtn}
                    onClick={() => navigate(`/course/${course._id}`)}
                  >
                    ▶ Open Course
                  </button>
                  <button
                    id={`remove-course-${entry._id}`}
                    onClick={() => handleRemove(entry._id, course.courseName)}
                    disabled={isRemoving}
                    style={{ ...S.removeBtn, ...(isRemoving ? S.removeBtnLoading : {}) }}
                  >
                    {isRemoving ? '⏳' : '🗑'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page:     { padding: '8px 0', position: 'relative' },
  centered: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' },
  spinner:  { width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.3)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText: { color: 'var(--sm-surface-40)', fontSize: '14px' },

  toast: { position: 'fixed', top: '24px', right: '24px', padding: '12px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '500', zIndex: 9999, backdropFilter: 'blur(10px)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' },
  toastColors: {
    success: { background: 'rgba(34,197,94,0.2)',  color: '#86efac', border: '1px solid rgba(34,197,94,0.3)'  },
    error:   { background: 'rgba(239,68,68,0.2)',   color: 'var(--sm-red)', border: '1px solid rgba(239,68,68,0.3)'  },
  },

  header:     { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  title:      { fontSize: '28px', fontWeight: '700', color: 'var(--sm-text, #e2e8f0)', margin: 0, marginBottom: '6px', letterSpacing: '-0.5px' },
  subtitle:   { color: 'var(--sm-surface-45)', fontSize: '14px', margin: 0, lineHeight: '1.5' },
  countBadge: { background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '20px', padding: '6px 16px', color: '#86efac', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' },

  statsBar:    { display: 'flex', alignItems: 'center', background: 'var(--sm-surface-3)', border: '1px solid var(--sm-surface-7)', borderRadius: '14px', padding: '16px 24px', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' },
  statItem:    { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', minWidth: '60px' },
  statNum:     { fontSize: '22px', fontWeight: '700', color: '#86efac', lineHeight: 1 },
  statLabel:   { fontSize: '12px', color: 'var(--sm-text-sub)', fontWeight: '500' },
  statDivider: { width: '1px', height: '32px', background: 'var(--sm-surface-8)' },
  overallTrack:{ height: '8px', background: 'var(--sm-surface-8)', borderRadius: '4px', overflow: 'hidden' },
  overallFill: { height: '100%', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: '4px', transition: 'width 0.6s ease' },

  emptyBox:    { textAlign: 'center', padding: '80px 24px', background: 'var(--sm-surface-2)', border: '1px dashed var(--sm-surface-10)', borderRadius: '20px' },
  emptyIcon:   { fontSize: '48px', display: 'block', marginBottom: '16px' },
  emptyTitle:  { color: 'var(--sm-text, #e2e8f0)', fontSize: '20px', fontWeight: '600', margin: '0 0 8px' },
  emptySubtitle:{ color: 'var(--sm-surface-40)', fontSize: '14px', margin: '0 0 20px', lineHeight: '1.6' },
  browsBtn:    { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '10px', padding: '12px 24px', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },

  card:     { background: 'var(--sm-surface-4)', border: '1px solid var(--sm-surface-8)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'border-color 0.2s' },
  cardDone: { border: '1px solid rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.03)' },

  cardBanner:     { height: '80px', background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.2) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottom: '1px solid var(--sm-surface-6)' },
  cardBannerDone: { background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(16,185,129,0.2) 100%)', borderBottom: '1px solid rgba(34,197,94,0.1)' },
  cardIcon:       { fontSize: '32px' },
  selectedBadge:  { position: 'absolute', top: '8px', right: '8px', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '20px', padding: '3px 10px', color: 'var(--sm-indigo-muted)', fontSize: '11px', fontWeight: '600' },
  selectedBadgeDone: { background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)', color: '#86efac' },

  cardBody:   { padding: '18px 20px', display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' },
  courseTitle:{ fontSize: '16px', fontWeight: '700', color: 'var(--sm-text, #e2e8f0)', margin: 0, lineHeight: '1.4' },
  courseDesc: { fontSize: '13px', color: 'var(--sm-surface-45)', margin: 0, lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },

  progressSection: { marginTop: '4px' },
  progressRow:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  progressLabel:   { color: 'var(--sm-surface-40)', fontSize: '12px', fontWeight: '500' },
  progressPct:     { fontSize: '13px', fontWeight: '700' },
  progressTrack:   { height: '7px', background: 'var(--sm-surface-8)', borderRadius: '4px', overflow: 'hidden' },
  progressFill:    { height: '100%', borderRadius: '4px', transition: 'width 0.4s ease' },
  lessonCount:     { marginTop: '5px', fontSize: '12px', color: 'var(--sm-text-sub)' },

  metaRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '6px' },
  metaTag: { background: 'var(--sm-surface-6)', border: '1px solid var(--sm-surface-8)', borderRadius: '20px', padding: '3px 10px', color: 'var(--sm-surface-50)', fontSize: '12px' },

  btnRow:    { display: 'flex', gap: '8px', marginTop: '4px' },
  openBtn:   { flex: 1, padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', transition: 'opacity 0.2s' },
  removeBtn: { padding: '10px 14px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: 'var(--sm-red)', transition: 'all 0.2s' },
  removeBtnLoading: { opacity: 0.5, cursor: 'not-allowed' },
};
