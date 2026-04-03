import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

function Toast({ toasts, removeToast }) {
  return (
    <div style={S.toastContainer}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          ...S.toast,
          background:   t.type === 'success' ? 'rgba(34,197,94,0.18)' : t.type === 'warn' ? 'rgba(245,158,11,0.18)' : 'rgba(239,68,68,0.18)',
          borderColor:  t.type === 'success' ? 'rgba(34,197,94,0.4)'  : t.type === 'warn' ? 'rgba(245,158,11,0.4)'  : 'rgba(239,68,68,0.4)',
        }}>
          <span style={{ fontSize: '16px' }}>
            {t.type === 'success' ? '✅' : t.type === 'warn' ? '⚠️' : '❌'}
          </span>
          <span style={{ flex: 1, fontSize: '13px', color: '#e2e8f0' }}>{t.message}</span>
          <button onClick={() => removeToast(t.id)} style={S.toastClose}>×</button>
        </div>
      ))}
    </div>
  );
}

export default function SelectChapters() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [courseChapters, setCourseChapters] = useState({}); // { courseId: [] }
  const [selections, setSelections] = useState({}); // { chapterId: { deadline } }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4500);
  }, []);
  const removeToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  // 1. Fetch user selected courses, then for each, fetch chapters and existing selections
  useEffect(() => {
    (async () => {
      try {
        // Fetch My Courses
        const courseRes = await API.get('/courses');
        const userCourses = courseRes.data.courses || [];
        setCourses(userCourses);

        if (userCourses.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch Chapters for each course
        const chaptersMap = {};
        for (const c of userCourses) {
          try {
            const masterId = c.courseId?._id || c.courseId;
            const chapRes = await API.get(`/admin/chapters?courseId=${masterId}`);
            chaptersMap[masterId] = chapRes.data.chapters || [];
          } catch (e) {
            const masterId = c.courseId?._id || c.courseId;
            console.warn(`Failed fetching chapters for course ${masterId}`);
            chaptersMap[masterId] = [];
          }
        }
        setCourseChapters(chaptersMap);

        // Fetch previously selected chapters to prepopulate UI
        const savedRes = await API.get('/user/chapters');
        const saved = savedRes.data.chapters || [];
        const initSelections = {};
        saved.forEach(sc => {
          initSelections[sc.chapterId._id] = {
            courseId: sc.courseId._id,
            deadline: sc.deadline ? new Date(sc.deadline).toISOString().split('T')[0] : ''
          };
        });
        setSelections(initSelections);

      } catch (err) {
        addToast('Error loading study data.', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [addToast]);

  const toggleChapter = (courseId, chapterId) => {
    setSelections(prev => {
      const next = { ...prev };
      if (next[chapterId]) {
        delete next[chapterId];
      } else {
        // Default deadline: 3 days from now
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 3);
        next[chapterId] = {
          courseId,
          deadline: defaultDate.toISOString().split('T')[0]
        };
      }
      return next;
    });
  };

  const updateDeadline = (chapterId, dateStr) => {
    setSelections(prev => {
      if (!prev[chapterId]) return prev;
      return {
        ...prev,
        [chapterId]: { ...prev[chapterId], deadline: dateStr }
      };
    });
  };

  const handleSave = async () => {
    const payload = Object.entries(selections).map(([chapterId, data]) => ({
      courseId: data.courseId,
      chapterId: chapterId,
      deadline: data.deadline
    }));

    if (payload.length === 0) {
      addToast('Please select at least one chapter.', 'warn');
      return;
    }

    // Validate deadlines
    if (payload.some(p => !p.deadline)) {
      addToast('Please set a deadline for all selected chapters.', 'warn');
      return;
    }

    try {
      setSubmitting(true);
      const res = await API.post('/user/chapters', payload);
      addToast(res.data.message || 'Chapters saved successfully!', 'success');
      setTimeout(() => navigate('/schedule'), 1500);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save chapters.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const totalSelected = Object.keys(selections).length;

  return (
    <div style={S.page}>
      <Toast toasts={toasts} removeToast={removeToast} />

      <header style={S.header}>
        <div>
          <h1 style={S.title}>📖 Select Chapters</h1>
          <p style={S.subtitle}>Choose specific chapters to study and assign deadlines.</p>
        </div>
        <div style={S.statPill}>
          {totalSelected} chapter{totalSelected !== 1 ? 's' : ''} selected
        </div>
      </header>

      {loading ? (
        <div style={S.centerState}>
          <div style={S.spinnerLg} />
          <p style={S.stateText}>Loading your study material…</p>
        </div>
      ) : courses.length === 0 ? (
        <div style={S.centerState}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
          <p style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
            No courses selected
          </p>
          <p style={S.stateText}>Go back to "My Courses" to add courses first.</p>
          <button 
            onClick={() => navigate('/manage-courses')}
            style={S.backBtn}
          >
            ← My Courses
          </button>
        </div>
      ) : (
        <div style={S.contentLayout}>
          <div style={S.mainSection}>
            {courses.map(course => {
              const masterId = course.courseId?._id || course.courseId;
              const chaps = courseChapters[masterId] || [];
              if (chaps.length === 0) return null; // Hide course if no chapters

              return (
                <div key={course._id} style={S.courseCard}>
                  <div style={S.courseHeader}>
                    <h3 style={S.courseTitle}>{course.courseId?.title || 'Unknown Course'}</h3>
                    <span style={S.chapCount}>{chaps.length} chapters</span>
                  </div>
                  
                  <div style={S.chapterList}>
                    {chaps.map(chap => {
                      const sel = selections[chap._id];
                      const isSelected = !!sel;
                      return (
                        <div key={chap._id} style={{
                          ...S.chapterRow,
                          background: isSelected ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)',
                          borderColor: isSelected ? 'rgba(99,102,241,0.4)' : 'transparent'
                        }}>
                          <label style={S.checkboxLabel}>
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => toggleChapter(masterId, chap._id)}
                              style={S.checkbox}
                            />
                            <span style={S.chapterTitle}>{chap.order}. {chap.title}</span>
                          </label>

                          {isSelected && (
                            <div style={S.deadlineWrapper}>
                              <span style={S.deadlineBox}>Deadline:</span>
                              <input 
                                type="date"
                                value={sel.deadline}
                                onChange={(e) => updateDeadline(chap._id, e.target.value)}
                                min={new Date().toISOString().split('T')[0]} // prevent past dates
                                style={S.dateInput}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={S.sidebar}>
            <div style={S.summaryCard}>
              <h3 style={S.summaryTitle}>Scheduling Summary</h3>
              <p style={S.summaryText}>
                You have selected <strong>{totalSelected}</strong> chapters to study.
              </p>
              
              <button
                onClick={handleSave}
                disabled={submitting || totalSelected === 0}
                style={{
                  ...S.saveBtn,
                  opacity: (submitting || totalSelected === 0) ? 0.6 : 1,
                  cursor: (submitting || totalSelected === 0) ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Saving...' : 'Save & Generate Schedule →'}
              </button>

              <button onClick={() => navigate('/manage-courses')} style={S.sidebarBackBtn}>
                ← Needs more courses?
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page:         { maxWidth: '1000px', margin: '0 auto', fontFamily: 'Segoe UI, sans-serif' },
  header:       { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' },
  title:        { fontSize: '28px', fontWeight: '800', color: '#f1f5f9', margin: 0, letterSpacing: '-0.5px' },
  subtitle:     { color: 'rgba(255,255,255,0.45)', fontSize: '14px', marginTop: '6px' },
  statPill:     { background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '20px', padding: '6px 14px', color: '#a5b4fc', fontSize: '13px', fontWeight: '600', alignSelf: 'center' },
  
  centerState:  { textAlign: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' },
  stateText:    { color: 'rgba(255,255,255,0.4)', fontSize: '14px' },
  spinnerLg:    { width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' },
  
  contentLayout:{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' },
  mainSection:  { flex: 1, minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px' },
  sidebar:      { width: '300px', flexShrink: 0 },

  courseCard:   { background: 'rgba(255,255,255,0.04)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' },
  courseHeader: { background: 'rgba(0,0,0,0.2)', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  courseTitle:  { margin: 0, color: '#e2e8f0', fontSize: '16px', fontWeight: '700' },
  chapCount:    { color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: '600' },
  
  chapterList:  { padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  chapterRow:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '10px', transition: 'all 0.2s', border: '1px solid transparent' },
  checkboxLabel:{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 },
  checkbox:     { width: '18px', height: '18px', accentColor: '#6366f1', cursor: 'pointer' },
  chapterTitle: { color: '#e2e8f0', fontSize: '15px', fontWeight: '500' },
  
  deadlineWrapper:{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: '8px' },
  deadlineBox:  { fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' },
  dateInput:    { background: 'transparent', border: 'none', color: '#6366f1', outline: 'none', fontSize: '14px', fontWeight: '600', fontFamily: 'inherit', colorScheme: 'dark' },
  
  summaryCard:  { position: 'sticky', top: '24px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' },
  summaryTitle: { margin: '0 0 16px 0', color: '#e2e8f0', fontSize: '16px', fontWeight: '700' },
  summaryText:  { color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' },
  saveBtn:      { width: '100%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', padding: '14px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center' },
  backBtn:      { marginTop: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '10px 20px', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  sidebarBackBtn:{ width: '100%', marginTop: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', color: '#e2e8f0', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  
  toastContainer:{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '340px' },
  toast:         { display: 'flex', alignItems: 'center', gap: '10px', backdropFilter: 'blur(12px)', border: '1px solid', borderRadius: '10px', padding: '12px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', animation: 'slideIn 0.25s ease' },
  toastClose:    { background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: 0 },
};
