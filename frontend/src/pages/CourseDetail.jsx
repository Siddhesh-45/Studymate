import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course,           setCourse]           = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [studentCourseId,  setStudentCourseId]  = useState(null);
  const [progress,         setProgress]         = useState(0);
  const [activeVideo,      setActiveVideo]       = useState(null);
  const [loading,          setLoading]           = useState(true);
  const [error,            setError]             = useState(null);
  const [marking,          setMarking]           = useState(false);  // loading state for button
  const [toast,            setToast]             = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCourse = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get(`/courses/${courseId}`);
      setCourse(res.data.course);
      setCompletedLessons(res.data.completedLessons || []);
      setStudentCourseId(res.data.studentCourseId || null);
      setProgress(res.data.progress || 0);
      if (res.data.course?.topics?.length > 0) {
        setActiveVideo(res.data.course.topics[0]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchCourse(); }, [fetchCourse]);

  const isCompleted = (topicId) => completedLessons.includes(String(topicId));



  const getEmbedUrl = (url) => {
    if (!url) return '';
    const m = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : '';
  };

  const completedCount = completedLessons.length;
  const totalCount     = course?.topics?.length || 0;

  if (loading) return (
    <div style={S.center}>
      <div style={S.spinner} />
      <p style={{ color: 'var(--sm-text-sub, #94a3b8)', marginTop: 16 }}>Loading course...</p>
    </div>
  );
  if (error)   return <div style={S.errorBox}>⚠️ {error}</div>;
  if (!course) return <div style={S.errorBox}>Course not found.</div>;

  const activeIsDone = activeVideo ? isCompleted(activeVideo._id) : false;

  return (
    <div style={S.page}>
      {/* Toast */}
      {toast && (
        <div style={{ ...S.toast, ...(toast.type === 'error' ? S.toastErr : S.toastOk) }}>
          {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <button style={S.backBtn} onClick={() => navigate(-1)}>← Back to My Courses</button>
      <h1 style={S.title}>{course.courseName}</h1>
      {course.description && <p style={S.desc}>{course.description}</p>}

      {/* Overall progress bar */}
      <div style={S.progressWrap}>
        <div style={S.progressRow}>
          <span style={S.progressLabel}>Overall Progress</span>
          <span style={S.progressPct}>{progress}% · {completedCount}/{totalCount} lessons</span>
        </div>
        <div style={S.progressTrack}>
          <div style={{ ...S.progressFill, width: `${progress}%` }} />
        </div>
      </div>

      {/* Main layout */}
      <div style={S.layout}>
        {/* LEFT: Player */}
        <div style={S.playerCol}>
          {activeVideo ? (
            <div style={S.playerCard}>
              {getEmbedUrl(activeVideo.youtubeUrl) ? (
                <iframe
                  key={activeVideo._id}
                  src={getEmbedUrl(activeVideo.youtubeUrl)}
                  title={activeVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={S.iframe}
                />
              ) : (
                <div style={S.noVideo}>🎬 No video URL for this lesson</div>
              )}

              <div style={S.videoMeta}>
                <div style={S.videoMetaLeft}>
                  <h2 style={S.videoTitle}>{activeVideo.title}</h2>
                  <div style={S.metaRow}>
                    <span style={{ ...S.statusBadge, ...(activeIsDone ? S.badgeDone : S.badgePending) }}>
                      {activeIsDone ? '✓ Completed' : '○ Pending'}
                    </span>
                    <span style={S.metaDetail}>⏱ {activeVideo.estimatedHours}h est.</span>
                    {activeVideo.youtubeUrl && (
                      <a href={activeVideo.youtubeUrl} target="_blank" rel="noreferrer" style={S.watchLink}>
                        ▶ Open in YouTube
                      </a>
                    )}
                  </div>
                </div>

                {/* QUIZ TRIGGER button */}
                {studentCourseId && (
                  <button
                    onClick={() => {
                      navigate(`/quiz/${courseId}/${activeVideo._id}`);
                    }}
                    style={{
                      ...S.markBtn,
                      ...(activeIsDone ? S.markBtnUndo : S.markBtnDo),
                    }}
                  >
                    {activeIsDone ? '✅ Completed — Retake Quiz' : '🧠 Take Quiz to Complete'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={S.emptyPlayer}>No lessons in this course yet.</div>
          )}
        </div>

        {/* RIGHT: Playlist */}
        <div style={S.playlistCol}>
          <div style={S.playlistHeader}>
            <h3 style={S.playlistTitle}>Lessons</h3>
            <span style={S.playlistCount}>{completedCount}/{totalCount} done</span>
          </div>
          <div style={S.playlist}>
            {course.topics?.map((topic, idx) => {
              const done   = isCompleted(topic._id);
              const active = activeVideo?._id === topic._id;
              return (
                <div
                  key={topic._id}
                  onClick={() => setActiveVideo(topic)}
                  style={{
                    ...S.lessonRow,
                    ...(active ? S.lessonRowActive : {}),
                    ...(done   ? S.lessonRowDone  : {}),
                  }}
                >
                  {/* Index / done indicator */}
                  <div style={{ ...S.lessonNum, ...(done ? S.lessonNumDone : active ? S.lessonNumActive : {}) }}>
                    {done ? '✓' : idx + 1}
                  </div>

                  <div style={S.lessonInfo}>
                    <p style={{ ...S.lessonName, color: active ? 'var(--sm-text, #f1f5f9)' : done ? '#86efac' : 'var(--sm-text, #cbd5e1)' }}>
                      {topic.title}
                    </p>
                    <p style={S.lessonMeta}>
                      {done
                        ? <span style={{ color: '#86efac' }}>Completed</span>
                        : <span>⏱ {topic.estimatedHours}h</span>}
                    </p>
                  </div>

                  {active && <span style={S.nowPlaying}>▶</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const A = '#6366f1', A2 = '#8b5cf6';

const S = {
  page:       { padding: '28px 36px', color: 'var(--sm-text, #e2e8f0)', fontFamily: "'Segoe UI', system-ui, sans-serif", position: 'relative' },
  backBtn:    { background: 'none', border: 'none', color: 'var(--sm-indigo)', cursor: 'pointer', fontSize: '14px', fontWeight: 500, marginBottom: '16px', padding: 0 },
  title:      { fontSize: '28px', color: 'var(--sm-text)', margin: '0 0 8px', fontWeight: 700, letterSpacing: '-0.4px' },
  desc:       { color: 'var(--sm-text-sub, #94a3b8)', fontSize: '15px', marginBottom: '20px', lineHeight: 1.6, maxWidth: '700px' },

  progressWrap: { background: 'var(--sm-surface-3)', borderRadius: '12px', padding: '16px 20px', marginBottom: '28px', border: '1px solid var(--sm-surface-6)' },
  progressRow:  { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  progressLabel:{ fontSize: '13px', color: 'var(--sm-text-sub, #94a3b8)', fontWeight: 500 },
  progressPct:  { fontSize: '13px', color: 'var(--sm-indigo-muted)', fontWeight: 600 },
  progressTrack:{ height: '8px', background: 'var(--sm-surface-8)', borderRadius: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', background: `linear-gradient(90deg,${A},${A2})`, borderRadius: '4px', transition: 'width 0.5s ease' },

  layout:     { display: 'flex', gap: '28px', flexWrap: 'wrap', alignItems: 'flex-start' },
  playerCol:  { flex: '1 1 580px', minWidth: 0 },
  playlistCol:{ flex: '0 0 360px', background: 'var(--sm-surface-2)', borderRadius: '16px', border: '1px solid var(--sm-surface-6)', overflow: 'hidden' },

  playerCard: { background: 'var(--sm-surface-2)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--sm-surface-6)', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' },
  iframe:     { width: '100%', aspectRatio: '16/9', display: 'block', background: '#000' },
  noVideo:    { width: '100%', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'var(--sm-text-muted, #475569)', fontSize: '18px' },

  videoMeta:     { padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' },
  videoMetaLeft: { flex: 1 },
  videoTitle:    { fontSize: '20px', margin: '0 0 10px', color: 'var(--sm-text, #f1f5f9)', fontWeight: 600, lineHeight: 1.3 },
  metaRow:       { display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' },
  statusBadge:   { fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  badgeDone:     { background: 'rgba(34,197,94,0.15)', color: '#86efac', border: '1px solid rgba(34,197,94,0.3)' },
  badgePending:  { background: 'var(--sm-surface-6)', color: 'var(--sm-text-sub, #94a3b8)', border: '1px solid var(--sm-surface-10)' },
  metaDetail:    { fontSize: '13px', color: 'var(--sm-text-sub)' },
  watchLink:     { fontSize: '13px', color: 'var(--sm-indigo)', textDecoration: 'none', fontWeight: 500 },

  markBtn:         { padding: '10px 20px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', border: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0 },
  markBtnDo:       { background: `linear-gradient(135deg,${A},${A2})`, color: '#fff', boxShadow: `0 4px 14px rgba(99,102,241,0.35)` },
  markBtnUndo:     { background: 'rgba(34,197,94,0.12)', color: '#86efac', border: '1px solid rgba(34,197,94,0.3)' },
  markBtnDisabled: { opacity: 0.55, cursor: 'not-allowed' },

  emptyPlayer: { padding: '80px 20px', textAlign: 'center', background: 'var(--sm-surface-2)', borderRadius: '16px', color: 'var(--sm-text-sub)', fontSize: '16px' },

  playlistHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid var(--sm-surface-7)' },
  playlistTitle: { margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--sm-text)' },
  playlistCount: { fontSize: '12px', color: 'var(--sm-indigo)', fontWeight: 600, background: 'rgba(99,102,241,0.12)', padding: '3px 10px', borderRadius: '20px' },
  playlist:      { maxHeight: '560px', overflowY: 'auto' },

  lessonRow:       { display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', cursor: 'pointer', borderBottom: '1px solid var(--sm-surface-3)', transition: 'background 0.15s' },
  lessonRowActive: { background: 'rgba(99,102,241,0.1)' },
  lessonRowDone:   { background: 'rgba(34,197,94,0.03)' },

  lessonNum:       { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0, background: 'var(--sm-surface-6)', color: 'var(--sm-text-sub)' },
  lessonNumActive: { background: 'rgba(99,102,241,0.25)', color: 'var(--sm-indigo)' },
  lessonNumDone:   { background: 'rgba(34,197,94,0.2)', color: '#86efac' },

  lessonInfo:  { flex: 1, minWidth: 0 },
  lessonName:  { margin: 0, fontSize: '14px', fontWeight: 500, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  lessonMeta:  { margin: '3px 0 0', fontSize: '12px', color: 'var(--sm-text-sub)' },
  nowPlaying:  { color: 'var(--sm-indigo)', fontSize: '14px', flexShrink: 0 },

  center:   { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '100px 20px' },
  spinner:  { width: '40px', height: '40px', border: '3px solid var(--sm-surface-10)', borderTopColor: A, borderRadius: '50%', animation: 'spin 0.9s linear infinite' },
  errorBox: { margin: '40px', padding: '20px 24px', background: 'rgba(239,68,68,0.1)', color: 'var(--sm-red)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)', fontSize: '15px' },

  toast:    { position: 'fixed', top: '24px', right: '24px', zIndex: 9999, padding: '14px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 500, backdropFilter: 'blur(12px)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', animation: 'slideIn 0.3s ease' },
  toastOk:  { background: 'rgba(34,197,94,0.18)', color: '#86efac', border: '1px solid rgba(34,197,94,0.35)' },
  toastErr: { background: 'rgba(239,68,68,0.18)', color: 'var(--sm-red)', border: '1px solid rgba(239,68,68,0.35)' },
};
