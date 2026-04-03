import { useEffect, useState } from 'react';
import API from '../api';

// ─────────────────────────────────────────────────────────────────────────────
// AllCourses — shows every course imported by admin.
// Student can click "Add to My Courses" to save it to their personal list.
// Already-added courses show a disabled "Added ✓" badge.
// ─────────────────────────────────────────────────────────────────────────────
export default function AllCourses() {
  const [courses, setCourses]       = useState([]);
  const [addedIds, setAddedIds]     = useState(new Set());
  const [loading, setLoading]       = useState(true);
  const [adding, setAdding]         = useState(null);   // courseId currently being added
  const [toast, setToast]           = useState(null);   // { msg, type }

  // ── Fetch all courses + student's already-added courses on mount ────────────
  useEffect(() => {
    async function load() {
      try {
        const [allRes, myRes] = await Promise.all([
          API.get('/courses'),
          API.get('/student-courses'),
        ]);

        setCourses(allRes.data.courses || []);

        // Build a Set of courseIds already in student's list
        const mySet = new Set(
          (myRes.data.courses || []).map((sc) =>
            sc.courseId?._id?.toString() || sc.courseId?.toString()
          )
        );
        setAddedIds(mySet);
      } catch (err) {
        console.error('AllCourses load error:', err);
        showToast('Failed to load courses. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Add to My Courses ───────────────────────────────────────────────────────
  async function handleAdd(courseId) {
    setAdding(courseId);
    try {
      await API.post('/student-courses', { courseId });
      setAddedIds((prev) => new Set([...prev, courseId]));
      showToast('Course added to your list! 🎉', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add course.';
      showToast(msg, msg.includes('already') ? 'info' : 'error');
    } finally {
      setAdding(null);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={S.centered}>
      <div style={S.spinner} />
      <p style={S.loadingText}>Loading courses…</p>
    </div>
  );

  return (
    <div style={S.page}>

      {/* ── Toast notification ── */}
      {toast && (
        <div style={{ ...S.toast, ...S.toastColors[toast.type] }}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>All Courses</h1>
          <p style={S.subtitle}>
            Browse all courses — click <strong>Add to My Courses</strong> to save any to your personal list.
          </p>
        </div>
        <div style={S.countBadge}>{courses.length} courses</div>
      </div>

      {/* ── Empty state ── */}
      {courses.length === 0 && (
        <div style={S.emptyBox}>
          <span style={S.emptyIcon}>📭</span>
          <p style={S.emptyTitle}>No courses yet</p>
          <p style={S.emptySubtitle}>The admin hasn't imported any courses yet. Check back soon!</p>
        </div>
      )}

      {/* ── Course grid ── */}
      <div style={S.grid}>
        {courses.map((course) => {
          const isAdded   = addedIds.has(course._id?.toString());
          const isAdding  = adding === course._id;
          const topicCount = course.topics?.length ?? 0;

          return (
            <div key={course._id} style={S.card}>

              {/* Gradient banner */}
              <div style={S.cardBanner}>
                <span style={S.cardIcon}>📚</span>
                {isAdded && <span style={S.addedBadge}>✓ Added</span>}
              </div>

              {/* Card body */}
              <div style={S.cardBody}>
                <h2 style={S.courseTitle}>{course.courseName || 'Untitled Course'}</h2>

                {course.description && (
                  <p style={S.courseDesc}>{course.description}</p>
                )}

                <div style={S.metaRow}>
                  <span style={S.metaTag}>📖 {topicCount} {topicCount === 1 ? 'lesson' : 'lessons'}</span>
                  <span style={S.metaTag}>
                    {new Date(course.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <button
                  id={`add-course-${course._id}`}
                  onClick={() => !isAdded && handleAdd(course._id)}
                  disabled={isAdded || isAdding}
                  style={{
                    ...S.addBtn,
                    ...(isAdded ? S.addBtnAdded : isAdding ? S.addBtnLoading : S.addBtnDefault),
                  }}
                >
                  {isAdding ? '⏳ Adding…' : isAdded ? '✓ Added to My Courses' : '+ Add to My Courses'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const S = {
  page: {
    padding: '8px 0',
    position: 'relative',
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(99,102,241,0.3)',
    borderTop: '3px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '14px',
  },
  toast: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    padding: '12px 20px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: 9999,
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.1)',
    animation: 'slideIn 0.3s ease',
  },
  toastColors: {
    success: { background: 'rgba(34,197,94,0.2)',  color: '#86efac', border: '1px solid rgba(34,197,94,0.3)'  },
    error:   { background: 'rgba(239,68,68,0.2)',   color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)'   },
    info:    { background: 'rgba(99,102,241,0.2)',  color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)'  },
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#e2e8f0',
    margin: 0,
    marginBottom: '6px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: '14px',
    margin: 0,
    lineHeight: '1.5',
  },
  countBadge: {
    background: 'rgba(99,102,241,0.15)',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: '20px',
    padding: '6px 16px',
    color: '#a5b4fc',
    fontSize: '13px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  emptyBox: {
    textAlign: 'center',
    padding: '80px 24px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px dashed rgba(255,255,255,0.1)',
    borderRadius: '20px',
  },
  emptyIcon:    { fontSize: '48px', display: 'block', marginBottom: '16px' },
  emptyTitle:   { color: '#e2e8f0', fontSize: '20px', fontWeight: '600', margin: '0 0 8px' },
  emptySubtitle:{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    overflow: 'hidden',
    transition: 'transform 0.2s, border-color 0.2s',
    display: 'flex',
    flexDirection: 'column',
  },
  cardBanner: {
    height: '90px',
    background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(139,92,246,0.25) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  cardIcon:  { fontSize: '36px' },
  addedBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'rgba(34,197,94,0.2)',
    border: '1px solid rgba(34,197,94,0.4)',
    borderRadius: '20px',
    padding: '3px 10px',
    color: '#86efac',
    fontSize: '12px',
    fontWeight: '600',
  },
  cardBody: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  courseTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#e2e8f0',
    margin: '0 0 8px',
    lineHeight: '1.4',
  },
  courseDesc: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.45)',
    margin: '0 0 12px',
    lineHeight: '1.5',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  metaRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '16px',
    marginTop: 'auto',
    paddingTop: '12px',
  },
  metaTag: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    padding: '3px 10px',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '12px',
  },
  addBtn: {
    width: '100%',
    padding: '11px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
    marginTop: '4px',
  },
  addBtnDefault: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
  },
  addBtnAdded: {
    background: 'rgba(34,197,94,0.1)',
    color: '#86efac',
    border: '1px solid rgba(34,197,94,0.3)',
    cursor: 'default',
  },
  addBtnLoading: {
    background: 'rgba(99,102,241,0.2)',
    color: '#a5b4fc',
    cursor: 'not-allowed',
  },
};
