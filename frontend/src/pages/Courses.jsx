import { useState, useEffect } from 'react';
import API from '../api';

// ─────────────────────────────────────────────────────────────────────────────
// Courses.jsx — Role-based course management
//
// ADMIN  sees: + New Course, Import Playlist, Edit ✏️, Delete 🗑️
//             does NOT see: Mark as Completed checkbox
//
// STUDENT sees: View courses, View topics, Mark as Completed checkbox
//              does NOT see: any create / edit / delete buttons
//
// API summary:
//   GET    /api/course                        → both roles
//   POST   /api/course                        → admin only
//   PUT    /api/course/:id                    → admin only
//   DELETE /api/course/:id                    → admin only
//   POST   /api/course/:id/import-playlist    → admin only
//   PATCH  /api/course/:id/topic/:tid/toggle  → student only
// ─────────────────────────────────────────────────────────────────────────────

const todayStr   = () => new Date().toISOString().split('T')[0];
const formatDate = (d) => !d ? '—' : new Date(d).toLocaleDateString('en-IN',
  { day: '2-digit', month: 'short', year: 'numeric' });
const isOverdue  = (d) => new Date(d) < new Date();
const getYtThumb = (url) => {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
};

const emptyCourseForm = { courseName: '', description: '' };
const emptyTopicForm  = { title: '', youtubeUrl: '', article: '',
                          deadline: todayStr(), estimatedHours: 1 };

// ─────────────────────────────────────────────────────────────────────────────
export default function Courses() {
  const user    = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  // ── State ──────────────────────────────────────────────────────────────────
  const [courses,      setCourses    ] = useState([]);
  const [loading,      setLoading    ] = useState(true);
  const [error,        setError      ] = useState('');
  const [openCourseId, setOpenCourseId] = useState(null);

  // Course modal (admin only)
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse,   setEditingCourse  ] = useState(null);
  const [courseForm,      setCourseForm     ] = useState(emptyCourseForm);
  const [courseErr,       setCourseErr      ] = useState('');
  const [courseSaving,    setCourseSaving   ] = useState(false);

  // Playlist modal (admin only)
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlistCourseId,  setPlaylistCourseId ] = useState(null);
  const [playlistUrl,       setPlaylistUrl      ] = useState('');
  const [replaceTopics,     setReplaceTopics    ] = useState(false);
  const [importing,         setImporting        ] = useState(false);
  const [importResult,      setImportResult     ] = useState(null);
  const [importErr,         setImportErr        ] = useState('');

  // Topic modal (admin only)
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [topicCourseId,  setTopicCourseId ] = useState(null);
  const [editingTopic,   setEditingTopic  ] = useState(null);
  const [topicForm,      setTopicForm     ] = useState(emptyTopicForm);
  const [topicErr,       setTopicErr      ] = useState('');
  const [topicSaving,    setTopicSaving   ] = useState(false);

  // Delete confirm (admin only)
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true); setError('');
      // Use the newly added standard GET /courses API
      const res = await API.get('/courses');
      // Handle both cases: { courses: [...] } or [...]
      const data = res.data?.courses || res.data;
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses.');
    } finally { setLoading(false); }
  };

  // ── Admin: Course CRUD ─────────────────────────────────────────────────────
  const openAddCourse  = () => {
    setEditingCourse(null); setCourseForm(emptyCourseForm);
    setCourseErr(''); setShowCourseModal(true);
  };
  const openEditCourse = (c) => {
    setEditingCourse(c);
    setCourseForm({ courseName: c.courseName, description: c.description || '' });
    setCourseErr(''); setShowCourseModal(true);
  };
  const saveCourse = async () => {
    setCourseErr('');
    if (!courseForm.courseName.trim()) { setCourseErr('Course name is required.'); return; }
    setCourseSaving(true);
    try {
      if (editingCourse) {
        await API.put(`/course/${editingCourse._id}`, {
          courseName: courseForm.courseName.trim(),
          topics: editingCourse.topics,
        });
      } else {
        await API.post('/course', {
          courseName:  courseForm.courseName.trim(),
          description: courseForm.description.trim(),
          topics: [],
        });
      }
      setShowCourseModal(false);
      await fetchCourses();
    } catch (err) {
      setCourseErr(err.response?.data?.message || 'Failed to save.');
    } finally { setCourseSaving(false); }
  };
  const confirmDeleteCourse = (c) =>
    setDeleteTarget({ type: 'course', courseId: c._id, label: c.courseName });
  const deleteCourse = async () => {
    const { courseId } = deleteTarget; setDeleteTarget(null);
    try {
      await API.delete(`/course/${courseId}`);
      if (openCourseId === courseId) setOpenCourseId(null);
      await fetchCourses();
    } catch { setError('Failed to delete course.'); }
  };

  // ── Admin: Playlist Import ─────────────────────────────────────────────────
  const openPlaylistModal = (cid) => {
    setPlaylistCourseId(cid); setPlaylistUrl(''); setReplaceTopics(false);
    setImportErr(''); setImportResult(null); setShowPlaylistModal(true);
  };
  const runImport = async () => {
    setImportErr(''); setImportResult(null);
    if (!playlistUrl.trim()) { setImportErr('Please paste a YouTube playlist URL.'); return; }
    if (!playlistUrl.includes('list=')) {
      setImportErr('Invalid URL — must contain "list=PLxxxxxx".'); return;
    }
    setImporting(true);
    try {
      const res = await API.post(`/course/${playlistCourseId}/import-playlist`,
        { playlistUrl: playlistUrl.trim(), replaceTopics });
      setImportResult({ count: res.data.importedCount, topics: res.data.course.topics.slice(-res.data.importedCount) });
      await fetchCourses();
    } catch (err) {
      setImportErr(err.response?.data?.message || 'Import failed. Is the playlist public?');
    } finally { setImporting(false); }
  };
  const closePlaylistModal = () => {
    setShowPlaylistModal(false); setImportResult(null);
    setPlaylistUrl(''); setImportErr('');
  };

  // ── Admin: Manual Topic CRUD ───────────────────────────────────────────────
  const openAddTopic  = (cid) => {
    setTopicCourseId(cid); setEditingTopic(null);
    setTopicForm(emptyTopicForm); setTopicErr(''); setShowTopicModal(true);
  };
  const openEditTopic = (cid, t) => {
    setTopicCourseId(cid); setEditingTopic(t);
    setTopicForm({
      title: t.title, youtubeUrl: t.youtubeUrl || '', article: t.article || '',
      deadline: t.deadline ? t.deadline.split('T')[0] : todayStr(),
      estimatedHours: t.estimatedHours,
    });
    setTopicErr(''); setShowTopicModal(true);
  };
  const saveTopic = async () => {
    setTopicErr('');
    if (!topicForm.title.trim())    { setTopicErr('Title is required.'); return; }
    if (!topicForm.deadline)        { setTopicErr('Deadline is required.'); return; }
    if (topicForm.estimatedHours < 0.1) { setTopicErr('Min 0.1 hours.'); return; }
    setTopicSaving(true);
    const newTopic = {
      title: topicForm.title.trim(), youtubeUrl: topicForm.youtubeUrl.trim(),
      article: topicForm.article.trim(), deadline: topicForm.deadline,
      estimatedHours: Number(topicForm.estimatedHours),
      status: editingTopic ? editingTopic.status : 'pending',
    };
    const course = courses.find((c) => c._id === topicCourseId);
    const updatedTopics = editingTopic
      ? (course.topics || []).map((t) => t._id === editingTopic._id ? { ...t, ...newTopic } : t)
      : [...(course.topics || []), newTopic];
    try {
      await API.put(`/course/${topicCourseId}`, { courseName: course.courseName, topics: updatedTopics });
      setShowTopicModal(false); await fetchCourses();
    } catch (err) {
      setTopicErr(err.response?.data?.message || 'Failed to save topic.');
    } finally { setTopicSaving(false); }
  };
  const confirmDeleteTopic = (cid, t) =>
    setDeleteTarget({ type: 'topic', courseId: cid, topicId: t._id, label: t.title });
  const deleteTopic = async () => {
    const { courseId, topicId } = deleteTarget; setDeleteTarget(null);
    const course = courses.find((c) => c._id === courseId);
    const updated = (course.topics || []).filter((t) => t._id !== topicId);
    try {
      await API.put(`/course/${courseId}`, { courseName: course.courseName, topics: updated });
      await fetchCourses();
    } catch { setError('Failed to delete topic.'); }
  };

  // ── Student ONLY: Toggle topic complete ───────────────────────────────────
  // Uses a dedicated PATCH endpoint — does NOT modify course name or other topics
  const toggleTopicStatus = async (courseId, topicId) => {
    try {
      await API.patch(`/course/${courseId}/topic/${topicId}/toggle`);
      // Optimistically update local state so UI responds instantly
      setCourses((prev) => prev.map((c) => {
        if (c._id !== courseId) return c;
        return {
          ...c,
          topics: (c.topics || []).map((t) =>
            t._id === topicId
              ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' }
              : t
          ),
        };
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update topic status.');
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getProgress = (course) => {
    const topics = course?.topics || [];
    if (!topics.length) return 0;
    return Math.round(
      topics.filter((t) => t.status === 'completed').length
      / topics.length * 100
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>📚 Courses</h1>
          <p style={S.pageSubtitle}>
            {isAdmin ? 'Manage courses and playlists' : 'Your learning library'}
            {' · '}{courses.length} course{courses.length !== 1 ? 's' : ''}
          </p>
        </div>
        {/* ADMIN ONLY — Add course button */}
        {isAdmin && (
          <button style={S.btnPrimary} onClick={openAddCourse}>+ New Course</button>
        )}
      </div>

      {/* ── Role banner ──────────────────────────────────────────────────── */}
      <div style={isAdmin ? S.adminBanner : S.studentBanner}>
        {isAdmin
          ? '🔐 Admin Mode — You can create, edit, delete courses and import YouTube playlists.'
          : '🎓 Student Mode — Browse courses and mark topics as completed using the checkboxes.'}
      </div>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div style={S.errorBanner}>
          ⚠️ {error}
          <button style={S.bannerClose} onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* ── Loading ───────────────────────────────────────────────────────── */}
      {loading && (
        <div style={S.center}>
          <div style={S.spinner} />
          <p style={{ color: '#94a3b8', marginTop: 12 }}>Loading courses...</p>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!loading && courses.length === 0 && (
        <div style={S.emptyState}>
          <div style={{ fontSize: 52 }}>📭</div>
          <h3 style={{ color: '#e2e8f0', margin: '12px 0 8px' }}>No courses yet</h3>
          <p style={{ color: '#64748b', marginBottom: 20 }}>
            {isAdmin
              ? 'Click "+ New Course" to create a course, then import a YouTube playlist.'
              : 'No courses are available yet. Check back later.'}
          </p>
          {isAdmin && (
            <button style={S.btnPrimary} onClick={openAddCourse}>+ New Course</button>
          )}
        </div>
      )}

      {/* ── Course grid ───────────────────────────────────────────────────── */}
      {!loading && courses.length > 0 && (
        <div style={S.grid}>
          {courses.map((course) => {
            const topics   = course.topics || [];
            const progress = getProgress(course);
            const done     = topics.filter((t) => t.status === 'completed').length;
            const isOpen   = openCourseId === course._id;

            return (
              <div key={course._id} style={S.card}>

                {/* Card header */}
                <div style={S.cardHeader}>
                  <div style={{ flex: 1 }}>
                    <div style={S.cardTitleRow}>
                      <h3 style={S.cardTitle}>{course.courseName}</h3>
                      <span style={{
                        ...S.badge,
                        ...(course.status === 'approved' ? S.badgeGreen
                          : course.status === 'blocked'  ? S.badgeRed
                          : S.badgeYellow),
                      }}>
                        {course.status}
                      </span>
                    </div>
                    {course.description && (
                      <p style={S.cardDesc}>{course.description}</p>
                    )}
                  </div>

                  {/* ADMIN ONLY — Edit + Delete course */}
                  {isAdmin && (
                    <div style={S.cardActions}>
                      <button style={S.btnIcon} title="Edit course"
                        onClick={() => openEditCourse(course)}>✏️</button>
                      <button style={S.btnIconRed} title="Delete course"
                        onClick={() => confirmDeleteCourse(course)}>🗑️</button>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 12 }}>
                  <span style={S.progressLabel}>
                    {done}/{topics.length} topics complete · {progress}%
                  </span>
                  <div style={S.progressTrack}>
                    <div style={{ ...S.progressFill, width: `${progress}%` }} />
                  </div>
                </div>

                {/* Expand button */}
                <button style={S.expandBtn}
                  onClick={() => setOpenCourseId(isOpen ? null : course._id)}>
                  {isOpen
                    ? '▲ Hide Topics'
                    : `▼ View Topics (${topics.length})`}
                </button>

                {/* ── Topics panel ────────────────────────────────────────── */}
                {isOpen && (
                  <div style={S.topicsPanel}>

                    {/* ADMIN ONLY — action buttons inside topic panel */}
                    {isAdmin && (
                      <div style={S.topicActions}>
                        <button style={S.btnPlaylist}
                          onClick={() => openPlaylistModal(course._id)}>
                          🎬 Import YouTube Playlist
                        </button>
                        <button style={S.btnSmall}
                          onClick={() => openAddTopic(course._id)}>
                          + Add Topic Manually
                        </button>
                      </div>
                    )}

                    {/* Empty topics */}
                    {topics.length === 0 && (
                      <div style={S.emptyTopics}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🎬</div>
                        <p style={{ color: '#64748b', fontSize: 14 }}>
                          {isAdmin
                            ? 'No topics yet. Import a YouTube Playlist to fill this course.'
                            : 'No topics added yet.'}
                        </p>
                      </div>
                    )}

                    {/* Topic list */}
                    {topics.map((topic, idx) => {
                      const thumb = getYtThumb(topic.youtubeUrl);
                      return (
                        <div key={topic._id || idx} style={{
                          ...S.topicRow,
                          ...(topic.status === 'completed' ? S.topicDone : {}),
                        }}>

                          {/* YouTube thumbnail */}
                          {thumb ? (
                            <a href={topic.youtubeUrl} target="_blank" rel="noreferrer"
                              style={{ flexShrink: 0 }}>
                              <img src={thumb} alt={topic.title} style={S.thumb}
                                onError={(e) => { e.target.style.display = 'none'; }} />
                            </a>
                          ) : (
                            <div style={S.thumbPlaceholder}>📄</div>
                          )}

                          {/* Topic info */}
                          <div style={S.topicInfo}>
                            <div style={S.topicTitleRow}>

                              {/* STUDENT ONLY — Mark as Completed checkbox */}
                              {!isAdmin && (
                                <button
                                  style={{
                                    ...S.checkbox,
                                    ...(topic.status === 'completed' ? S.checkboxDone : {}),
                                  }}
                                  onClick={() => toggleTopicStatus(course._id, topic._id)}
                                  title={topic.status === 'completed'
                                    ? 'Mark as pending' : 'Mark as completed'}
                                >
                                  {topic.status === 'completed' ? '✓' : ''}
                                </button>
                              )}

                              {/* Topic number + title */}
                              <span style={{
                                ...S.topicTitle,
                                ...(topic.status === 'completed' ? S.strikethrough : {}),
                              }}>
                                {idx + 1}. {topic.title}
                              </span>

                              {/* Completion badge for student */}
                              {!isAdmin && topic.status === 'completed' && (
                                <span style={S.doneBadge}>✓ Done</span>
                              )}
                            </div>

                            {/* Meta info row */}
                            <div style={S.topicMeta}>
                              <span>⏱ {topic.estimatedHours}h</span>
                              <span style={{
                                color: topic.status === 'completed' ? '#22c55e'
                                     : isOverdue(topic.deadline)    ? '#ef4444'
                                     : '#94a3b8',
                              }}>
                                📅 {formatDate(topic.deadline)}
                                {topic.status !== 'completed' && isOverdue(topic.deadline)
                                  && ' ⚠️ Overdue'}
                              </span>
                              {topic.youtubeUrl && (
                                <a href={topic.youtubeUrl} target="_blank" rel="noreferrer"
                                  style={S.topicLink}>▶ Watch</a>
                              )}
                              {topic.article && (
                                <a href={topic.article} target="_blank" rel="noreferrer"
                                  style={S.topicLink}>📄 Article</a>
                              )}
                            </div>
                          </div>

                          {/* ADMIN ONLY — Edit + Delete topic */}
                          {isAdmin && (
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                              <button style={S.btnIcon} title="Edit topic"
                                onClick={() => openEditTopic(course._id, topic)}>✏️</button>
                              <button style={S.btnIconRed} title="Delete topic"
                                onClick={() => confirmDeleteTopic(course._id, topic)}>🗑️</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ADMIN MODAL: Add / Edit Course
      ══════════════════════════════════════════════════════════════════ */}
      {showCourseModal && isAdmin && (
        <Overlay>
          <Modal>
            <ModalHeader
              title={editingCourse ? '✏️ Edit Course' : '+ New Course'}
              onClose={() => setShowCourseModal(false)}
            />
            {courseErr && <ErrBox msg={courseErr} />}
            <Field label="Course Name *">
              <input style={S.input} autoFocus type="text"
                placeholder="e.g. Data Structures & Algorithms"
                value={courseForm.courseName}
                onChange={(e) => setCourseForm({ ...courseForm, courseName: e.target.value })}
              />
            </Field>
            {!editingCourse && (
              <Field label="Description (optional)">
                <textarea style={{ ...S.input, height: 72, resize: 'vertical' }}
                  placeholder="What is this course about?"
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                />
              </Field>
            )}
            <ModalFooter>
              <button style={S.btnSecondary} onClick={() => setShowCourseModal(false)}>Cancel</button>
              <button style={courseSaving ? S.btnDisabled : S.btnPrimary}
                onClick={saveCourse} disabled={courseSaving}>
                {courseSaving ? 'Saving...' : editingCourse ? 'Save Changes' : 'Create Course'}
              </button>
            </ModalFooter>
          </Modal>
        </Overlay>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ADMIN MODAL: Import YouTube Playlist
      ══════════════════════════════════════════════════════════════════ */}
      {showPlaylistModal && isAdmin && (
        <Overlay>
          <Modal wide>
            <ModalHeader title="🎬 Import YouTube Playlist" onClose={closePlaylistModal} />
            {!importResult && (
              <>
                <p style={S.playlistHint}>
                  Paste a public YouTube playlist URL. All videos become topics automatically.
                </p>
                <Field label="YouTube Playlist URL *">
                  <input style={S.input} type="url" autoFocus
                    placeholder="https://www.youtube.com/playlist?list=PL..."
                    value={playlistUrl}
                    onChange={(e) => setPlaylistUrl(e.target.value)}
                    disabled={importing}
                  />
                </Field>
                <div style={S.toggleRow}>
                  <label style={S.toggleLabel}>
                    <input type="checkbox" checked={replaceTopics}
                      onChange={(e) => setReplaceTopics(e.target.checked)}
                      disabled={importing} style={{ marginRight: 8 }}
                    />
                    Replace existing topics with playlist videos
                  </label>
                  <p style={S.toggleHint}>
                    {replaceTopics
                      ? '⚠️ All current topics will be deleted and replaced.'
                      : '✅ Videos will be added after existing topics.'}
                  </p>
                </div>
                {importErr && <ErrBox msg={importErr} />}
                {importing && (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={S.spinner} />
                    <p style={{ color: '#94a3b8', marginTop: 12 }}>Fetching from YouTube...</p>
                  </div>
                )}
                <ModalFooter>
                  <button style={S.btnSecondary} onClick={closePlaylistModal} disabled={importing}>Cancel</button>
                  <button style={importing ? S.btnDisabled : S.btnPlaylist}
                    onClick={runImport} disabled={importing}>
                    {importing ? 'Importing...' : '🎬 Import Playlist'}
                  </button>
                </ModalFooter>
              </>
            )}
            {importResult && (
              <>
                <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                  <h3 style={{ color: '#86efac', margin: '0 0 4px' }}>
                    {importResult.count} videos imported!
                  </h3>
                  <p style={{ color: '#64748b', fontSize: 14 }}>All added as topics.</p>
                </div>
                <div style={S.importedList}>
                  {importResult.topics.map((t, i) => {
                    const thumb = getYtThumb(t.youtubeUrl);
                    return (
                      <div key={i} style={S.importedItem}>
                        {thumb
                          ? <img src={thumb} alt={t.title} style={S.importThumb}
                              onError={(e) => { e.target.style.display='none'; }} />
                          : <div style={S.thumbPlaceholder}>🎬</div>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={S.importedTitle}>{i + 1}. {t.title}</p>
                          {t.youtubeUrl && (
                            <a href={t.youtubeUrl} target="_blank" rel="noreferrer"
                              style={S.topicLink}>▶ Watch</a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <ModalFooter>
                  <button style={S.btnPrimary} onClick={closePlaylistModal}>Done ✓</button>
                </ModalFooter>
              </>
            )}
          </Modal>
        </Overlay>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ADMIN MODAL: Add / Edit Topic manually
      ══════════════════════════════════════════════════════════════════ */}
      {showTopicModal && isAdmin && (
        <Overlay>
          <Modal>
            <ModalHeader
              title={editingTopic ? '✏️ Edit Topic' : '+ Add Topic'}
              onClose={() => setShowTopicModal(false)}
            />
            {topicErr && <ErrBox msg={topicErr} />}
            <Field label="Topic Title *">
              <input style={S.input} autoFocus type="text"
                placeholder="e.g. Binary Search Trees"
                value={topicForm.title}
                onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
              />
            </Field>
            <div style={S.row2}>
              <Field label="Deadline *">
                <input style={S.input} type="date" value={topicForm.deadline}
                  onChange={(e) => setTopicForm({ ...topicForm, deadline: e.target.value })} />
              </Field>
              <Field label="Est. Hours *">
                <input style={S.input} type="number" min="0.1" step="0.5"
                  value={topicForm.estimatedHours}
                  onChange={(e) => setTopicForm({ ...topicForm, estimatedHours: e.target.value })} />
              </Field>
            </div>
            <Field label="YouTube URL (optional)">
              <input style={S.input} type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={topicForm.youtubeUrl}
                onChange={(e) => setTopicForm({ ...topicForm, youtubeUrl: e.target.value })} />
            </Field>
            <Field label="Article URL (optional)">
              <input style={S.input} type="url"
                placeholder="https://example.com/article"
                value={topicForm.article}
                onChange={(e) => setTopicForm({ ...topicForm, article: e.target.value })} />
            </Field>
            <ModalFooter>
              <button style={S.btnSecondary} onClick={() => setShowTopicModal(false)}>Cancel</button>
              <button style={topicSaving ? S.btnDisabled : S.btnPrimary}
                onClick={saveTopic} disabled={topicSaving}>
                {topicSaving ? 'Saving...' : editingTopic ? 'Save Changes' : 'Add Topic'}
              </button>
            </ModalFooter>
          </Modal>
        </Overlay>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ADMIN MODAL: Delete confirmation
      ══════════════════════════════════════════════════════════════════ */}
      {deleteTarget && isAdmin && (
        <Overlay>
          <Modal>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🗑️</div>
              <h2 style={{ color: '#f1f5f9', fontSize: 18, marginBottom: 10 }}>
                Delete {deleteTarget.type === 'course' ? 'Course' : 'Topic'}?
              </h2>
              <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 6 }}>
                You are about to delete:
              </p>
              <p style={{ color: '#f1f5f9', fontWeight: 600, marginBottom: 6 }}>
                "{deleteTarget.label}"
              </p>
              {deleteTarget.type === 'course' && (
                <p style={{ color: '#f87171', fontSize: 13, marginBottom: 20 }}>
                  ⚠️ All topics inside will also be deleted.
                </p>
              )}
            </div>
            <ModalFooter style={{ justifyContent: 'center' }}>
              <button style={S.btnSecondary} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button style={S.btnDanger}
                onClick={deleteTarget.type === 'course' ? deleteCourse : deleteTopic}>
                Yes, Delete
              </button>
            </ModalFooter>
          </Modal>
        </Overlay>
      )}
    </div>
  );
}

// ── Reusable sub-components ───────────────────────────────────────────────────
const Overlay = ({ children })           => <div style={S.overlay}>{children}</div>;
const Modal   = ({ children, wide })     => <div style={{ ...S.modal, ...(wide ? { maxWidth: 580 } : {}) }}>{children}</div>;
const ModalHeader = ({ title, onClose }) => (
  <div style={S.modalHeader}>
    <h2 style={S.modalTitle}>{title}</h2>
    <button style={S.modalClose} onClick={onClose}>✕</button>
  </div>
);
const ModalFooter = ({ children, style }) => (
  <div style={{ ...S.modalFooter, ...style }}>{children}</div>
);
const Field  = ({ label, children }) => (
  <div style={S.field}><label style={S.label}>{label}</label>{children}</div>
);
const ErrBox = ({ msg }) => <div style={S.modalError}>⚠️ {msg}</div>;

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const A = '#6366f1', A2 = '#8b5cf6';
const S = {
  page:         { fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#e2e8f0' },
  pageHeader:   { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                  marginBottom: 16, flexWrap: 'wrap', gap: 12 },
  pageTitle:    { fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' },
  pageSubtitle: { fontSize: 14, color: '#64748b', margin: 0 },

  adminBanner:  { background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.25)',
                  borderRadius: 10, padding: '10px 16px', color: '#a5b4fc',
                  fontSize: 13, marginBottom: 20 },
  studentBanner:{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)',
                  borderRadius: 10, padding: '10px 16px', color: '#86efac',
                  fontSize: 13, marginBottom: 20 },
  errorBanner:  { background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.35)',
                  borderRadius: 10, padding: '12px 16px', color: '#fca5a5', fontSize: 14,
                  marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  bannerClose:  { background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: 16 },
  center:       { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' },
  spinner:      { width: 36, height: 36, border: '3px solid rgba(99,102,241,.2)',
                  borderTop: `3px solid ${A}`, borderRadius: '50%', animation: 'spin .8s linear infinite' },
  emptyState:   { textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,.02)',
                  borderRadius: 16, border: '1px dashed rgba(255,255,255,.1)' },
  grid:         { display: 'flex', flexDirection: 'column', gap: 16 },
  card:         { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
                  borderRadius: 16, padding: 20 },
  cardHeader:   { display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  cardTitleRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 },
  cardTitle:    { fontSize: 17, fontWeight: 600, color: '#f1f5f9', margin: 0 },
  cardDesc:     { fontSize: 13, color: '#64748b', margin: '2px 0 0' },
  cardActions:  { display: 'flex', gap: 6, flexShrink: 0 },
  badge:        { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                  textTransform: 'uppercase', letterSpacing: '.05em' },
  badgeGreen:   { background: 'rgba(34,197,94,.15)',  color: '#86efac', border: '1px solid rgba(34,197,94,.25)' },
  badgeYellow:  { background: 'rgba(234,179,8,.15)',  color: '#fde047', border: '1px solid rgba(234,179,8,.25)' },
  badgeRed:     { background: 'rgba(239,68,68,.15)',  color: '#fca5a5', border: '1px solid rgba(239,68,68,.25)' },
  progressLabel:{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 5 },
  progressTrack:{ height: 6, background: 'rgba(255,255,255,.07)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', background: `linear-gradient(90deg,${A},${A2})`,
                  borderRadius: 3, transition: 'width .4s ease' },
  expandBtn:    { background: 'none', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8,
                  padding: '7px 14px', color: '#94a3b8', fontSize: 13, cursor: 'pointer', width: '100%' },

  topicsPanel:  { marginTop: 14, borderTop: '1px solid rgba(255,255,255,.07)',
                  paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 },
  topicActions: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  emptyTopics:  { textAlign: 'center', padding: '24px 0', borderRadius: 10,
                  background: 'rgba(255,255,255,.02)' },

  topicRow:     { display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(255,255,255,.03)', borderRadius: 10, padding: '10px 12px',
                  border: '1px solid rgba(255,255,255,.05)' },
  topicDone:    { background: 'rgba(34,197,94,.04)', borderColor: 'rgba(34,197,94,.12)' },
  thumb:        { width: 96, height: 54, objectFit: 'cover', borderRadius: 6, flexShrink: 0, display: 'block' },
  thumbPlaceholder: { width: 96, height: 54, background: 'rgba(255,255,255,.05)', borderRadius: 6,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, flexShrink: 0 },
  topicInfo:    { flex: 1, minWidth: 0 },
  topicTitleRow:{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  checkbox:     { width: 20, height: 20, borderRadius: 5, border: '2px solid rgba(255,255,255,.2)',
                  background: 'transparent', color: '#22c55e', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', transition: 'all .15s', marginTop: 2 },
  checkboxDone: { background: 'rgba(34,197,94,.2)', borderColor: '#22c55e' },
  topicTitle:   { fontSize: 14, fontWeight: 500, color: '#e2e8f0' },
  strikethrough:{ textDecoration: 'line-through', color: '#475569' },
  doneBadge:    { background: 'rgba(34,197,94,.15)', color: '#86efac',
                  border: '1px solid rgba(34,197,94,.25)', borderRadius: 12,
                  fontSize: 11, fontWeight: 600, padding: '1px 8px', flexShrink: 0 },
  topicMeta:    { display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: '#64748b' },
  topicLink:    { color: '#818cf8', textDecoration: 'none', fontWeight: 500 },

  playlistHint: { color: '#94a3b8', fontSize: 14, marginBottom: 20, lineHeight: 1.6 },
  toggleRow:    { marginBottom: 16 },
  toggleLabel:  { display: 'flex', alignItems: 'center', color: '#cbd5e1', fontSize: 14, cursor: 'pointer' },
  toggleHint:   { color: '#64748b', fontSize: 12, margin: '4px 0 0 24px' },
  importedList: { maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column',
                  gap: 8, marginTop: 12 },
  importedItem: { display: 'flex', gap: 10, alignItems: 'center',
                  background: 'rgba(255,255,255,.03)', borderRadius: 8, padding: '8px 10px' },
  importThumb:  { width: 80, height: 46, objectFit: 'cover', borderRadius: 5, flexShrink: 0 },
  importedTitle:{ fontSize: 13, color: '#e2e8f0', margin: '0 0 4px', lineHeight: 1.4 },

  btnPrimary:   { background: `linear-gradient(135deg,${A},${A2})`, border: 'none',
                  borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: 14,
                  fontWeight: 600, cursor: 'pointer', boxShadow: `0 2px 12px ${A}44` },
  btnPlaylist:  { background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)',
                  borderRadius: 9, padding: '8px 16px', color: '#fca5a5', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnSmall:     { background: `rgba(99,102,241,.15)`, border: `1px solid rgba(99,102,241,.3)`,
                  borderRadius: 8, padding: '7px 14px', color: '#a5b4fc', fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  btnSecondary: { background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)',
                  borderRadius: 10, padding: '10px 20px', color: '#cbd5e1', fontSize: 14, cursor: 'pointer' },
  btnDanger:    { background: 'rgba(239,68,68,.2)', border: '1px solid rgba(239,68,68,.4)',
                  borderRadius: 10, padding: '10px 20px', color: '#fca5a5', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnDisabled:  { background: 'rgba(255,255,255,.08)', border: 'none', borderRadius: 10,
                  padding: '10px 20px', color: 'rgba(255,255,255,.3)', fontSize: 14, cursor: 'not-allowed' },
  btnIcon:      { background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)',
                  borderRadius: 7, width: 30, height: 30, fontSize: 13, cursor: 'pointer' },
  btnIconRed:   { background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.15)',
                  borderRadius: 7, width: 30, height: 30, fontSize: 13, cursor: 'pointer' },

  overlay:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)',
                  backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', zIndex: 100, padding: 20 },
  modal:        { background: '#1e293b', border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 20, padding: 28, width: '100%', maxWidth: 460,
                  maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,.6)' },
  modalHeader:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle:   { color: '#f1f5f9', fontSize: 18, fontWeight: 700, margin: 0 },
  modalClose:   { background: 'none', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer' },
  modalError:   { background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)',
                  borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 16 },
  modalFooter:  { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 },

  field:  { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 },
  label:  { color: 'rgba(255,255,255,.65)', fontSize: 13, fontWeight: 500 },
  input:  { background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 9, padding: '10px 13px', color: '#f1f5f9',
            fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' },
  row2:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
};

const _s = document.createElement('style');
_s.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(.6); }
`;
if (!document.querySelector('[data-cr]')) { _s.setAttribute('data-cr','1'); document.head.appendChild(_s); }
