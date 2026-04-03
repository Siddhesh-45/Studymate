import { useState, useEffect } from 'react';
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

export default function ManageCourses() {
  const navigate = useNavigate();
  const [masterCourses, setMasterCourses] = useState([]);   // predefined list from admin
  const [selectedIds, setSelectedIds] = useState([]);       // user's currently selected IDs
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  const removeToast = (id) => setToasts((p) => p.filter((t) => t.id !== id));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch catalog
      const masterRes = await API.get('/master-courses');
      setMasterCourses(masterRes.data.courses || []);

      // Fetch user's currently enrolled courses
      const userRes = await API.get('/courses');
      const userCourses = userRes.data.courses || [];
      // user.courseId contains the reference/populated object. Just get the inner IDs
      const activeIds = userCourses.map(c => c.courseId?._id || c.courseId);
      setSelectedIds(activeIds);

    } catch (err) {
      addToast('Error loading study data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleCourse = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleSaveSelections = async () => {
    try {
      setSubmitting(true);
      // Strict rule API: POST /api/user/courses/select
      const res = await API.post('/user/courses/select', { courseIds: selectedIds });
      addToast(res.data.message || 'Course selections saved!', 'success');
      setTimeout(() => navigate('/select-chapters'), 1500);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update selection.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const DIFF_COLORS = {
    easy:   { bg: 'rgba(34, 197, 94, 0.15)',  col: '#86efac', border: 'rgba(34, 197, 94, 0.3)' },
    medium: { bg: 'rgba(234, 179, 8, 0.15)',  col: '#fde047', border: 'rgba(234, 179, 8, 0.3)' },
    hard:   { bg: 'rgba(239, 68, 68, 0.15)',  col: '#fca5a5', border: 'rgba(239, 68, 68, 0.3)' },
  };

  return (
    <div style={S.page}>
      <Toast toasts={toasts} removeToast={removeToast} />

      <header style={S.header}>
        <div>
          <h1 style={S.title}>📚 My Courses</h1>
          <p style={S.subtitle}>Select the core subjects you want to study. These are provided by the Admin.</p>
        </div>
        <div style={S.statPill}>
          {selectedIds.length} enrolled
        </div>
      </header>

      {loading ? (
        <div style={S.centerState}>
          <div style={S.spinnerLg} />
          <p style={S.stateText}>Loading course catalog…</p>
        </div>
      ) : (
        <div style={S.layout}>
          <div style={S.main}>
            {masterCourses.map(course => {
              const isSelected = selectedIds.includes(course._id);
              const colors = DIFF_COLORS[course.difficulty] || DIFF_COLORS.medium;
              
              return (
                <div key={course._id} style={{
                  ...S.card,
                  borderColor: isSelected ? '#6366f1' : 'rgba(255,255,255,0.08)',
                  background: isSelected ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.03)'
                }}>
                  <label style={S.cardClickArea}>
                    <input 
                      type="checkbox" 
                      checked={isSelected} 
                      onChange={() => toggleCourse(course._id)}
                      style={S.checkbox}
                    />
                    <div style={S.cardContent}>
                      <h3 style={S.courseName}>{course.title}</h3>
                      <span style={{...S.difficultyBadge, background: colors.bg, color: colors.col, borderColor: colors.border}}>
                        {course.difficulty}
                      </span>
                    </div>
                  </label>
                </div>
              );
            })}
            
            {masterCourses.length === 0 && (
               <div style={{ padding: '20px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                 No Master Courses available yet. Admin needs to import YouTube playlists or create them.
               </div>
            )}
          </div>

          <div style={S.sidebar}>
            <div style={S.sidebarCard}>
              <h3 style={S.sidebarTitle}>Finalize Selection</h3>
              <p style={S.sidebarText}>
                You have marked <strong>{selectedIds.length}</strong> courses for study. Keep track of your pacing properly.
              </p>
              
              <button 
                onClick={handleSaveSelections}
                disabled={submitting}
                style={{
                  ...S.saveBtn,
                  opacity: submitting ? 0.6 : 1,
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Saving...' : 'Save & Proceed to Chapters →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page:         { maxWidth: '900px', margin: '0 auto', fontFamily: 'Segoe UI, sans-serif' },
  header:       { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' },
  title:        { fontSize: '28px', fontWeight: '800', color: '#f1f5f9', margin: 0, letterSpacing: '-0.5px' },
  subtitle:     { color: 'rgba(255,255,255,0.5)', fontSize: '15px', marginTop: '6px' },
  statPill:     { background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '20px', padding: '6px 14px', color: '#a5b4fc', fontSize: '13px', fontWeight: '600', alignSelf: 'center' },
  
  centerState:  { textAlign: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' },
  stateText:    { color: 'rgba(255,255,255,0.4)', fontSize: '14px' },
  spinnerLg:    { width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' },
  
  layout:       { display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' },
  main:         { flex: 1, minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' },
  sidebar:      { width: '300px', flexShrink: 0 },
  
  card:         { borderRadius: '12px', border: '1px solid', overflow: 'hidden', transition: 'all 0.2s ease', position: 'relative' },
  cardClickArea:{ display: 'flex', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', gap: '16px' },
  checkbox:     { width: '22px', height: '22px', accentColor: '#6366f1', cursor: 'pointer', flexShrink: 0 },
  cardContent:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 },
  courseName:   { margin: 0, fontSize: '16px', fontWeight: '600', color: '#e2e8f0' },
  difficultyBadge: { padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', border: '1px solid' },
  
  sidebarCard:  { position: 'sticky', top: '24px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' },
  sidebarTitle: { margin: '0 0 16px 0', color: '#e2e8f0', fontSize: '17px', fontWeight: '700' },
  sidebarText:  { color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' },
  saveBtn:      { width: '100%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', padding: '14px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center' },
  
  toastContainer:{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '340px' },
  toast:         { display: 'flex', alignItems: 'center', gap: '10px', backdropFilter: 'blur(12px)', border: '1px solid', borderRadius: '10px', padding: '12px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', animation: 'slideIn 0.25s ease' },
  toastClose:    { background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: 0 }
};
