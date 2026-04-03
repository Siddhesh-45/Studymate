import { useState, useEffect } from 'react';
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
          <span style={{ flex: 1, fontSize: '13px', color: '#e2e8f0' }}>{t.message}</span>
          <button onClick={() => removeToast(t.id)} style={S.toastClose}>×</button>
        </div>
      ))}
    </div>
  );
}

export default function AdminContent() {
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Form states
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDiff, setNewCourseDiff] = useState('medium');
  
  const [selectedCourseForChap, setSelectedCourseForChap] = useState('');
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterOrder, setNewChapterOrder] = useState('');

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (activeTab === 'chapters') {
      fetchChapters();
    }
  }, [activeTab, selectedCourseForChap]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/master-courses');
      setCourses(res.data.courses || []);
    } catch (e) {
      addToast('Failed to load courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchChapters = async () => {
    try {
      setLoading(true);
      const url = selectedCourseForChap ? `/admin/chapters?courseId=${selectedCourseForChap}` : `/admin/chapters`;
      const res = await API.get(url);
      setChapters(res.data.chapters || []);
    } catch (e) {
      addToast('Failed to load chapters', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;
    try {
      await API.post('/admin/master-courses', { title: newCourseTitle, difficulty: newCourseDiff });
      addToast('Course added successfully');
      setNewCourseTitle('');
      fetchCourses();
    } catch (e) {
      addToast(e.response?.data?.message || 'Failed to add course', 'error');
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!confirm('Are you sure? This deletes the course and ALL its chapters.')) return;
    try {
      await API.delete(`/admin/master-courses/${id}`);
      addToast('Course deleted');
      fetchCourses();
      if (selectedCourseForChap === id) setSelectedCourseForChap('');
    } catch (e) {
      addToast('Failed to delete course', 'error');
    }
  };

  const handleAddChapter = async (e) => {
    e.preventDefault();
    if (!selectedCourseForChap || !newChapterTitle.trim()) return;
    try {
      await API.post('/admin/chapters', { 
        courseId: selectedCourseForChap, 
        title: newChapterTitle,
        order: newChapterOrder ? Number(newChapterOrder) : undefined
      });
      addToast('Chapter added successfully');
      setNewChapterTitle('');
      setNewChapterOrder('');
      fetchChapters();
    } catch (e) {
      addToast(e.response?.data?.message || 'Failed to add chapter', 'error');
    }
  };

  const handleDeleteChapter = async (id) => {
    if (!confirm('Delete this chapter?')) return;
    try {
      await API.delete(`/admin/chapters/${id}`);
      addToast('Chapter deleted');
      fetchChapters();
    } catch (e) {
      addToast('Failed to delete chapter', 'error');
    }
  };

  return (
    <div style={S.page}>
      <Toast toasts={toasts} removeToast={(id) => setToasts(p => p.filter(t => t.id !== id))} />

      <h1 style={S.title}>📋 Manage Study Catalog</h1>
      
      <div style={S.tabs}>
        <button 
          style={{ ...S.tab, ...(activeTab === 'courses' ? S.activeTab : {}) }}
          onClick={() => setActiveTab('courses')}
        >
          Master Courses
        </button>
        <button 
          style={{ ...S.tab, ...(activeTab === 'chapters' ? S.activeTab : {}) }}
          onClick={() => setActiveTab('chapters')}
        >
          Course Chapters
        </button>
      </div>

      <div style={S.content}>
        {/* COURSES TAB */}
        {activeTab === 'courses' && (
          <div style={S.layout}>
            <div style={S.formCard}>
              <h3 style={S.cardTitle}>Add New Course</h3>
              <form onSubmit={handleAddCourse} style={S.form}>
                <input 
                  type="text" 
                  placeholder="Course Title (e.g. DSA full course)" 
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  style={S.input}
                  required
                />
                <select 
                  value={newCourseDiff} 
                  onChange={(e) => setNewCourseDiff(e.target.value)}
                  style={S.input}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <button type="submit" style={S.btnPrimary}>Save Course</button>
              </form>
            </div>

            <div style={S.listCard}>
              <h3 style={S.cardTitle}>Existing Courses ({courses.length})</h3>
              {loading ? <p style={S.muted}>Loading...</p> : (
                <div style={S.list}>
                  {courses.map(c => (
                    <div key={c._id} style={S.listItem}>
                      <div>
                        <strong>{c.title}</strong> <span style={S.badge}>{c.difficulty}</span>
                      </div>
                      <button onClick={() => handleDeleteCourse(c._id)} style={S.btnDanger}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHAPTERS TAB */}
        {activeTab === 'chapters' && (
          <div style={S.layout}>
            <div style={S.formCard}>
              <h3 style={S.cardTitle}>Add Chapter</h3>
              <form onSubmit={handleAddChapter} style={S.form}>
                <select 
                  value={selectedCourseForChap} 
                  onChange={(e) => setSelectedCourseForChap(e.target.value)}
                  style={S.input}
                  required
                >
                  <option value="">-- Select Course --</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
                
                <input 
                  type="text" 
                  placeholder="Chapter Title" 
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  style={S.input}
                  required
                />
                
                <input 
                  type="number" 
                  placeholder="Order (optional)" 
                  value={newChapterOrder}
                  onChange={(e) => setNewChapterOrder(e.target.value)}
                  style={S.input}
                />
                <button type="submit" disabled={!selectedCourseForChap} style={S.btnPrimary}>Add Chapter</button>
              </form>
            </div>

            <div style={S.listCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{...S.cardTitle, margin: 0}}>Chapters List</h3>
                <select 
                  value={selectedCourseForChap} 
                  onChange={(e) => setSelectedCourseForChap(e.target.value)}
                  style={{ ...S.input, width: 'auto', padding: '6px 10px', margin: 0 }}
                >
                  <option value="">All Courses</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
              </div>

              {loading ? <p style={S.muted}>Loading...</p> : (
                <div style={S.list}>
                  {chapters.map(ch => (
                    <div key={ch._id} style={S.listItem}>
                      <div>
                        <span style={S.muted}>[{ch.courseId?.title || 'Unknown'}]</span>
                        <br/>
                        <strong>{ch.order}. {ch.title}</strong>
                      </div>
                      <button onClick={() => handleDeleteChapter(ch._id)} style={S.btnDanger}>Delete</button>
                    </div>
                  ))}
                  {chapters.length === 0 && <p style={S.muted}>No chapters found.</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  page:         { maxWidth: '1000px', margin: '0 auto', fontFamily: 'Segoe UI, sans-serif' },
  title:        { fontSize: '24px', fontWeight: 'bold', color: '#f1f5f9', marginBottom: '24px' },
  tabs:         { display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' },
  tab:          { background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '15px', fontWeight: '600', padding: '8px 16px', cursor: 'pointer', borderRadius: '8px' },
  activeTab:    { background: 'rgba(99,102,241,0.15)', color: '#818cf8' },
  content:      { display: 'flex', flexDirection: 'column', gap: '20px' },
  layout:       { display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' },
  formCard:     { background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '20px', width: '300px', flexShrink: 0 },
  listCard:     { flex: 1, minWidth: '400px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '20px' },
  cardTitle:    { margin: '0 0 16px 0', fontSize: '16px', color: '#e2e8f0' },
  form:         { display: 'flex', flexDirection: 'column', gap: '12px' },
  input:        { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '14px', boxSizing: 'border-box' },
  btnPrimary:   { background: '#6366f1', color: '#fff', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer' },
  btnDanger:    { background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)', fontSize: '12px', cursor: 'pointer' },
  list:         { display: 'flex', flexDirection: 'column', gap: '8px' },
  listItem:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' },
  badge:        { background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', textTransform: 'uppercase' },
  muted:        { color: 'rgba(255,255,255,0.4)', fontSize: '13px' },
  toastContainer:{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '300px' },
  toast:         { display: 'flex', alignItems: 'center', gap: '10px', backdropFilter: 'blur(12px)', border: '1px solid', borderRadius: '8px', padding: '12px 16px', animation: 'slideIn 0.25s ease' },
  toastClose:    { background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '16px' },
};
