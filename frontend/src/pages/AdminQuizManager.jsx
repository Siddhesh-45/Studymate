import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const MOCK_QUIZZES = [
  { id: '1', title: 'React Hooks Deep Dive',       course: 'React Fundamentals',      questions: 15, difficulty: 'medium', attempts: 234 },
  { id: '2', title: 'Python OOP Concepts',          course: 'Python for Data Science',  questions: 20, difficulty: 'hard',   attempts: 187 },
  { id: '3', title: 'Data Structures Basics',       course: 'Advanced DSA',             questions: 10, difficulty: 'easy',   attempts: 312 },
  { id: '4', title: 'ML Algorithms Explained',      course: 'Machine Learning A-Z',     questions: 25, difficulty: 'hard',   attempts: 98  },
  { id: '5', title: 'SQL Queries & Optimization',   course: 'SQL & DB Design',          questions: 12, difficulty: 'medium', attempts: 156 },
  { id: '6', title: 'JavaScript Async Patterns',    course: 'JavaScript Mastery',       questions: 18, difficulty: 'hard',   attempts: 201 },
];

const DIFF = {
  easy:   { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
  medium: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  hard:   { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444' },
};

function QuizCard({ quiz, isDark, onDelete }) {
  const [hover, setHover] = useState(false);
  const border = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0';
  const d = DIFF[quiz.difficulty] || DIFF.medium;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background:   isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
        border:       hover ? '1px solid rgba(99,102,241,0.35)' : border,
        borderRadius: 14,
        padding:      '20px',
        boxShadow:    hover
          ? (isDark ? '0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.2)' : '0 6px 20px rgba(0,0,0,0.1)')
          : (isDark ? '0 2px 12px rgba(0,0,0,0.2)' : '0 1px 6px rgba(0,0,0,0.05)'),
        transform:    hover ? 'translateY(-3px)' : 'none',
        transition:   'all 0.2s ease',
        cursor:       'default',
        animation:    'fadeUp 0.5s ease both',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>🧠</div>
        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10.5, fontWeight: 700, background: d.bg, color: d.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {quiz.difficulty}
        </span>
      </div>

      <div style={{ fontWeight: 700, fontSize: 14.5, color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: 6, lineHeight: 1.3 }}>
        {quiz.title}
      </div>
      <div style={{ fontSize: 12, color: isDark ? '#818cf8' : '#6366f1', fontWeight: 500, marginBottom: 14 }}>
        📚 {quiz.course}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: isDark ? '#fff' : '#0f172a' }}>{quiz.questions}</div>
          <div style={{ fontSize: 10, color: isDark ? '#94a3b8' : '#64748b', marginTop: 1 }}>Questions</div>
        </div>
        <div style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: isDark ? '#fff' : '#0f172a' }}>{quiz.attempts}</div>
          <div style={{ fontSize: 10, color: isDark ? '#94a3b8' : '#64748b', marginTop: 1 }}>Attempts</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        <button style={{
          padding: '7px 8px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.25)',
          background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          transition: 'all 0.15s',
        }}>✏️ Edit</button>
        <button onClick={() => onDelete(quiz.id)} style={{
          padding: '7px 8px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.25)',
          background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          transition: 'all 0.15s',
        }}>🗑️ Delete</button>
        <button style={{
          padding: '7px 8px', borderRadius: 8, border: '1px solid rgba(168,85,247,0.25)',
          background: 'rgba(168,85,247,0.1)', color: '#c084fc', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          transition: 'all 0.15s',
        }}>✨ AI</button>
      </div>
    </div>
  );
}

export default function AdminQuizManager() {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [quizzes, setQuizzes] = useState(MOCK_QUIZZES);
  const [generating, setGenerating] = useState(false);

  const text    = isDark ? '#e2e8f0' : '#1e293b';
  const textSub = isDark ? '#94a3b8' : '#64748b';
  const cardBg  = isDark ? 'rgba(255,255,255,0.04)' : '#fff';
  const border  = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0';

  const handleDelete = (id) => setQuizzes(prev => prev.filter(q => q.id !== id));

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const newQ = {
        id:         String(Date.now()),
        title:      'AI Generated: Advanced Concepts Quiz',
        course:     'Machine Learning A-Z',
        questions:  20,
        difficulty: 'hard',
        attempts:   0,
      };
      setQuizzes(prev => [newQ, ...prev]);
      setGenerating(false);
    }, 2000);
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 22, color: text, letterSpacing: '-0.4px' }}>Quiz Manager</div>
          <div style={{ fontSize: 13, color: textSub, marginTop: 2 }}>{quizzes.length} quizzes across all courses</div>
        </div>
        <button onClick={handleGenerate} disabled={generating} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 10, border: 'none',
          background: generating ? 'rgba(168,85,247,0.4)' : 'linear-gradient(135deg,#a855f7,#6366f1)',
          color: '#fff', fontSize: 13, fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 14px rgba(168,85,247,0.35)',
          transition: 'opacity 0.15s',
        }}>
          {generating ? (
            <><div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />Generating...</>
          ) : '✨ Generate AI Quiz'}
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Quizzes',   value: quizzes.length,                                              icon: '🧠', color: '#6366f1' },
          { label: 'Total Questions', value: quizzes.reduce((a, q) => a + q.questions, 0),                icon: '❓', color: '#a855f7' },
          { label: 'Total Attempts',  value: quizzes.reduce((a, q) => a + q.attempts, 0).toLocaleString(), icon: '📊', color: '#10b981' },
        ].map(s => (
          <div key={s.label} style={{ background: cardBg, border, borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.2)' : '0 1px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: `${s.color}22`, border: `1px solid ${s.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: text }}>{s.value}</div>
              <div style={{ fontSize: 11, color: textSub, fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quiz cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 16 }}>
        {quizzes.map(q => (
          <QuizCard key={q.id} quiz={q} isDark={isDark} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
