import React, { useEffect, useState } from 'react';
import API from '../api';
import { useTheme } from '../context/ThemeContext';

function ProgressBar({ value, isDark }) {
  return (
    <div style={{ height: 6, borderRadius: 3, background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9', overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: 3, width: `${value}%`,
        background: 'linear-gradient(90deg,#6366f1,#a855f7)',
        transition: 'width 0.8s ease',
      }} />
    </div>
  );
}

const MOCK_STUDENTS = [
  { _id: '1', name: 'Ayesha Khan',   email: 'ayesha@example.com',  courses: 4, progress: 72 },
  { _id: '2', name: 'Ravi Sharma',   email: 'ravi@example.com',    courses: 2, progress: 45 },
  { _id: '3', name: 'Sara Malik',    email: 'sara@example.com',    courses: 6, progress: 91 },
  { _id: '4', name: 'Arjun Mehta',   email: 'arjun@example.com',   courses: 1, progress: 18 },
  { _id: '5', name: 'Priya Nair',    email: 'priya@example.com',   courses: 3, progress: 63 },
  { _id: '6', name: 'Vikram Singh',  email: 'vikram@example.com',  courses: 5, progress: 84 },
];

export default function AdminStudents() {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [dropdown, setDropdown] = useState(null);

  const cardBg  = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const border  = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0';
  const text    = isDark ? '#e2e8f0' : '#1e293b';
  const textSub = isDark ? '#94a3b8' : '#64748b';

  useEffect(() => {
    API.get('/admin/dashboard/all-users')
      .then(({ data }) => setStudents(Array.isArray(data) ? data : (data.users || [])))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1000 }} onClick={() => setDropdown(null)}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 22, color: text, letterSpacing: '-0.4px' }}>Students</div>
          <div style={{ fontSize: 13, color: textSub, marginTop: 2 }}>{students.length} registered students</div>
        </div>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search students..."
            style={{
              paddingLeft: 30, paddingRight: 12, height: 36, borderRadius: 8,
              background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
              border, color: text, fontSize: 13, outline: 'none', width: 220,
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: cardBg, border, borderRadius: 16, overflow: 'hidden', boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.2)' : '0 2px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
        {/* Head */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 100px 180px 80px', gap: 0, padding: '12px 20px', background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderBottom: border, minWidth: 680 }}>
          {['Student','Email','Courses','Progress','Action'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: textSub, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          [1,2,3,4,5].map(i => (
            <div key={i} style={{ padding: '16px 20px', borderBottom: border, display: 'grid', gridTemplateColumns: '2fr 2fr 100px 180px 80px', gap: 0, alignItems: 'center', minWidth: 680 }}>
              {[1,2,3,4,5].map(j => <div key={j} style={{ height: 14, borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', width: '65%', animation: 'shimmer 1.4s infinite' }} />)}
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: textSub }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
            No students found
          </div>
        ) : (
          filtered.map((s, i) => {
            const progress = s.avgProgress ?? 0;
            const courseCount = s.enrolledCourses ?? 0;
            return (
              <div key={s._id} style={{
                display: 'grid', gridTemplateColumns: '2fr 2fr 100px 180px 80px', gap: 0,
                padding: '14px 20px', alignItems: 'center', minWidth: 680,
                borderBottom: i < filtered.length - 1 ? border : 'none',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: `hsl(${(s.name || 'U').charCodeAt(0) * 10 % 360},65%,${isDark ? '40%' : '55%'})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 13,
                  }}>{(s.name || 'U')[0].toUpperCase()}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: text }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: textSub }}>{s.role || 'Student'}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12.5, color: textSub }}>{s.email}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: text }}>{courseCount}</div>
                <div style={{ paddingRight: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: textSub }}>{progress}%</span>
                  </div>
                  <ProgressBar value={progress} isDark={isDark} />
                </div>
                <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => setDropdown(dropdown === s._id ? null : s._id)} style={{
                    padding: '5px 12px', borderRadius: 7,
                    background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                    border, color: text, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>⋯</button>
                  {dropdown === s._id && (
                    <div style={{
                      position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 10,
                      background: isDark ? '#1e293b' : '#fff',
                      border, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                      overflow: 'hidden', minWidth: 130,
                    }}>
                      {[['👁️ View Profile', '#818cf8'], ['🚫 Block Student', '#f87171']].map(([label, color]) => (
                        <button key={label} style={{
                          display: 'block', width: '100%', padding: '10px 14px',
                          background: 'transparent', border: 'none', textAlign: 'left',
                          color, fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                          transition: 'background 0.1s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >{label}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        </div>{/* /overflow-x-auto */}
      </div>
    </div>
  );
}
