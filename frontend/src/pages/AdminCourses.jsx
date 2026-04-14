import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { useTheme } from '../context/ThemeContext';

const DIFFICULTY_STYLES = {
  easy:   { bg: 'rgba(16,185,129,0.15)',  color: '#10b981', label: 'Easy'   },
  medium: { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b', label: 'Medium' },
  hard:   { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444', label: 'Hard'   },
};

function Badge({ level }) {
  const s = DIFFICULTY_STYLES[level] || DIFFICULTY_STYLES.medium;
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
      background: on ? 'linear-gradient(90deg,#6366f1,#a855f7)' : 'rgba(255,255,255,0.1)',
      position: 'relative', transition: 'background 0.25s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 20 : 2,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}

function ConfirmModal({ course, onConfirm, onCancel, isDark }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{
        background: isDark ? '#1e293b' : '#fff',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
        borderRadius: 16, padding: 28, maxWidth: 380, width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
        <div style={{ fontWeight: 700, fontSize: 17, color: isDark ? '#fff' : '#0f172a', marginBottom: 8 }}>Delete Course?</div>
        <div style={{ fontSize: 13.5, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 22 }}>
          Are you sure you want to delete <strong>"{course?.title}"</strong>? This action cannot be undone.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '10px', borderRadius: 8, border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
            background: 'transparent', color: isDark ? '#94a3b8' : '#64748b', cursor: 'pointer', fontSize: 14, fontWeight: 500,
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '10px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(90deg,#ef4444,#dc2626)', color: '#fff',
            cursor: 'pointer', fontSize: 14, fontWeight: 600,
          }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCourses() {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editForm, setEditForm] = useState({ courseName: '', description: '' });
  const [published, setPublished] = useState({});

  const cardBg  = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const border  = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0';
  const text    = isDark ? '#e2e8f0' : '#1e293b';
  const textSub = isDark ? '#94a3b8' : '#64748b';

  useEffect(() => {
    API.get('/course')
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : (data.courses || []);
        setCourses(list);
        const pub = {};
        list.forEach(c => { pub[c._id] = c.isActive !== false; });
        setPublished(pub);
      })
      .catch(() => {
        const mock = [
          { _id: '1', title: 'React Fundamentals',     instructor: 'John Doe',    videos: 24, difficulty: 'easy'   },
          { _id: '2', title: 'Python for Data Science', instructor: 'Jane Smith',  videos: 36, difficulty: 'medium' },
          { _id: '3', title: 'Advanced Data Structures',instructor: 'Arjun Mehta', videos: 18, difficulty: 'hard'   },
          { _id: '4', title: 'Machine Learning A-Z',    instructor: 'Priya Nair',  videos: 52, difficulty: 'hard'   },
          { _id: '5', title: 'SQL & Database Design',   instructor: 'Ravi Kumar',  videos: 15, difficulty: 'easy'   },
        ];
        setCourses(mock);
        const pub = {};
        mock.forEach(c => { pub[c._id] = true; });
        setPublished(pub);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c => {
    const titleMatch = (c.courseName || c.title || '').toLowerCase().includes(search.toLowerCase());
    const instMatch  = (c.instructor || c.createdBy?.name || '').toLowerCase().includes(search.toLowerCase());
    return titleMatch || instMatch;
  });

  const handleDelete = async () => {
    try { await API.delete(`/course/${toDelete._id}`); } catch (_) {}
    setCourses(prev => prev.filter(c => c._id !== toDelete._id));
    setToDelete(null);
  };

  const handleEditSave = async () => {
    if (!editingCourse || !editForm.courseName.trim()) return;
    try {
      await API.put(`/course/${editingCourse._id}`, {
        courseName: editForm.courseName,
        topics: editingCourse.topics || [],
      });
      setCourses(prev => prev.map(c => c._id === editingCourse._id ? { ...c, courseName: editForm.courseName } : c));
      setEditingCourse(null);
    } catch (_) {
      alert('Failed to update course');
    }
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 22, color: text, letterSpacing: '-0.4px' }}>Courses</div>
          <div style={{ fontSize: 13, color: textSub, marginTop: 2 }}>{courses.length} total courses on the platform</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search courses..."
              style={{
                paddingLeft: 30, paddingRight: 12, height: 36, borderRadius: 8,
                background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                border, color: text, fontSize: 13, outline: 'none', width: 200,
              }}
            />
          </div>
          {/* Add Course CTA */}
          <Link to="/admin/add-course" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 18px', borderRadius: 10, textDecoration: 'none',
            background: 'linear-gradient(135deg,#6366f1,#a855f7)',
            color: '#fff', fontSize: 13, fontWeight: 600,
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
            transition: 'opacity 0.15s, transform 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = ''; }}
          >
            ➕ Add Course
          </Link>
        </div>
      </div>

      {/* Table card */}
      <div style={{ background: cardBg, border, borderRadius: 16, overflow: 'hidden', boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.2)' : '0 2px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
        {/* Table head */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 80px 100px 100px 120px', gap: 0, padding: '12px 20px', background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderBottom: border, minWidth: 720 }}>
          {['Course Title','Instructor','Videos','Difficulty','Published','Actions'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: textSub, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          [1,2,3,4,5].map(i => (
            <div key={i} style={{ padding: '16px 20px', borderBottom: border, display: 'grid', gridTemplateColumns: '2fr 1.2fr 80px 100px 100px 120px', gap: 0, alignItems: 'center', minWidth: 720 }}>
              {[1,2,3,4,5,6].map(j => <div key={j} style={{ height: 14, borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', width: '60%', animation: 'shimmer 1.4s infinite' }} />)}
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: textSub }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
            No courses found
          </div>
        ) : (
          filtered.map((c, i) => (
            <div key={c._id}
              style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 80px 100px 100px 120px', gap: 0, padding: '14px 20px', alignItems: 'center', minWidth: 720, borderBottom: i < filtered.length - 1 ? border : 'none', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: text }}>{c.courseName || c.title || 'Untitled Course'}</div>
                <div style={{ fontSize: 11, color: textSub, marginTop: 2 }}>ID: {String(c._id).slice(-6)}</div>
              </div>
              <div style={{ fontSize: 13, color: textSub }}>{c.instructor || c.createdBy?.name || '—'}</div>
              <div style={{ fontSize: 13, color: text, fontWeight: 600 }}>{c.videos || c.chapters?.length || 0}</div>
              <div><Badge level={c.difficulty || 'medium'} /></div>
              <div><Toggle on={!!published[c._id]} onToggle={() => setPublished(p => ({ ...p, [c._id]: !p[c._id] }))} /></div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button 
                  onClick={() => { setEditingCourse(c); setEditForm({ courseName: c.courseName || c.title || '' }); }}
                  style={{
                  padding: '5px 10px', borderRadius: 7, border: `1px solid ${isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.25)'}`,
                  background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                }}>Edit</button>
                <button onClick={() => setToDelete(c)} style={{
                  padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.25)',
                  background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                }}>Delete</button>
              </div>
            </div>
          ))
        )}
        </div>{/* /overflow-x-auto */}
      </div>

      {/* Confirm delete modal */}
      {toDelete && (
        <ConfirmModal
          course={{ title: toDelete.courseName || toDelete.title }}
          isDark={isDark}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}

      {/* Edit Course Modal */}
      {editingCourse && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{
            background: isDark ? '#1e293b' : '#fff',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
            borderRadius: 16, padding: 28, maxWidth: 400, width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: isDark ? '#fff' : '#0f172a', marginBottom: 20 }}>✏️ Edit Course</div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: 8 }}>
              Course Name
            </label>
            <input
              autoFocus
              value={editForm.courseName}
              onChange={e => setEditForm({ ...editForm, courseName: e.target.value })}
              style={{
                width: '100%', height: 42, padding: '0 14px', borderRadius: 10,
                background: isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                color: isDark ? '#fff' : '#1e293b', fontSize: 13.5, outline: 'none',
                marginBottom: 24, boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditingCourse(null)} style={{
                flex: 1, padding: '10px', borderRadius: 8, border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                background: 'transparent', color: isDark ? '#94a3b8' : '#64748b', cursor: 'pointer', fontSize: 14, fontWeight: 500,
              }}>Cancel</button>
              <button onClick={handleEditSave} style={{
                flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(90deg,#6366f1,#a855f7)', color: '#fff',
                cursor: 'pointer', fontSize: 14, fontWeight: 600,
              }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
