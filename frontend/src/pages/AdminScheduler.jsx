import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Mock tasks: keyed by "YYYY-MM-DD"
const MOCK_TASKS = {
  '2026-04-07': [{ text: 'React Module 3', status: 'done' }, { text: 'Quiz: Hooks', status: 'done' }],
  '2026-04-08': [{ text: 'Python OOP', status: 'missed' }],
  '2026-04-09': [{ text: 'DSA: Trees', status: 'done' }, { text: 'Practice test', status: 'missed' }],
  '2026-04-10': [{ text: 'ML: Regression', status: 'done' }],
  '2026-04-11': [{ text: 'SQL joins', status: 'pending' }, { text: 'Review notes', status: 'pending' }],
  '2026-04-14': [{ text: 'Mock interview', status: 'pending' }],
  '2026-04-16': [{ text: 'Final project', status: 'pending' }],
  '2026-04-18': [{ text: 'JavaScript async', status: 'pending' }],
  '2026-04-21': [{ text: 'Exam revision', status: 'pending' }],
};

const STATUS_STYLE = {
  done:    { bg: 'rgba(16,185,129,0.15)', color: '#10b981', icon: '✅' },
  missed:  { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444', icon: '❌' },
  pending: { bg: 'rgba(99,102,241,0.12)', color: '#818cf8', icon: '🔵' },
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function toKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function AdminScheduler() {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const now = new Date();
  const [cur, setCur] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState(null);

  const text    = isDark ? '#e2e8f0' : '#1e293b';
  const textSub = isDark ? '#94a3b8' : '#64748b';
  const cardBg  = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const border  = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0';
  const cellHover = isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc';

  const { year, month } = cur;
  const daysInMonth  = getDaysInMonth(year, month);
  const firstDay     = getFirstDayOfMonth(year, month);
  const today        = toKey(now.getFullYear(), now.getMonth(), now.getDate());

  const prevMonth = () => setCur(p => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 });
  const nextMonth = () => setCur(p => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedTasks = selected ? (MOCK_TASKS[selected] || []) : [];
  const selectedDate = selected ? new Date(selected + 'T00:00:00') : null;

  // Stats
  const allTasks = Object.values(MOCK_TASKS).flat();
  const done   = allTasks.filter(t => t.status === 'done').length;
  const missed = allTasks.filter(t => t.status === 'missed').length;
  const pending= allTasks.filter(t => t.status === 'pending').length;

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 22, color: text, letterSpacing: '-0.4px' }}>Scheduler Monitor</div>
        <div style={{ fontSize: 13, color: textSub, marginTop: 2 }}>Track student task completion across the platform</div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Completed',  value: done,   color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: '✅' },
          { label: 'Missed',     value: missed,  color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: '❌' },
          { label: 'Upcoming',   value: pending, color: '#818cf8', bg: 'rgba(99,102,241,0.12)', icon: '🔵' },
        ].map(s => (
          <div key={s.label} style={{ background: cardBg, border, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.2)' : '0 1px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: textSub }}>{s.label} Tasks</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 300px' : '1fr', gap: 16 }}>
        {/* Calendar */}
        <div style={{ background: cardBg, border, borderRadius: 16, overflow: 'hidden', boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.2)' : '0 2px 12px rgba(0,0,0,0.05)' }}>
          {/* Nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: border }}>
            <button onClick={prevMonth} style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', border, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: text, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            <div style={{ fontWeight: 700, fontSize: 15, color: text }}>{MONTHS[month]} {year}</div>
            <button onClick={nextMonth} style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', border, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: text, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
          </div>

          {/* Day labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', padding: '8px 12px 4px' }}>
            {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: textSub, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 0' }}>{d}</div>)}
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, padding: '4px 12px 14px' }}>
            {cells.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const key      = toKey(year, month, day);
              const tasks    = MOCK_TASKS[key] || [];
              const isToday  = key === today;
              const isSel    = key === selected;
              const hasM     = tasks.some(t => t.status === 'missed');
              const hasD     = tasks.some(t => t.status === 'done');
              const isWknd   = (i % 7 === 0 || i % 7 === 6);

              return (
                <div
                  key={key}
                  onClick={() => setSelected(isSel ? null : key)}
                  style={{
                    borderRadius: 10, padding: '8px 4px 6px', minHeight: 64, cursor: 'pointer',
                    background: isSel
                      ? 'rgba(99,102,241,0.18)'
                      : isToday
                        ? 'rgba(99,102,241,0.1)'
                        : 'transparent',
                    border: isSel
                      ? '1.5px solid rgba(99,102,241,0.4)'
                      : isToday
                        ? '1.5px solid rgba(99,102,241,0.25)'
                        : '1.5px solid transparent',
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = cellHover; }}
                  onMouseLeave={e => { if (!isSel && !isToday) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    textAlign: 'center', fontSize: 12.5, fontWeight: isToday ? 700 : 500,
                    color: isToday ? (isDark ? '#a5b4fc' : '#6366f1') : isWknd ? textSub : text,
                    marginBottom: 4,
                  }}>{day}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {tasks.slice(0, 2).map((t, ti) => {
                      const ss = STATUS_STYLE[t.status];
                      return (
                        <div key={ti} style={{ fontSize: 9, padding: '2px 4px', borderRadius: 4, background: ss.bg, color: ss.color, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ss.icon} {t.text}
                        </div>
                      );
                    })}
                    {tasks.length > 2 && <div style={{ fontSize: 9, color: textSub, fontWeight: 600 }}>+{tasks.length - 2} more</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ padding: '10px 20px 16px', display: 'flex', gap: 16, borderTop: border }}>
            {[['done','✅','Completed'],['missed','❌','Missed'],['pending','🔵','Upcoming']].map(([st, ic, lb]) => (
              <div key={st} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: textSub }}>
                <span>{ic}</span> {lb}
              </div>
            ))}
          </div>
        </div>

        {/* Task detail panel */}
        {selected && (
          <div style={{ background: cardBg, border, borderRadius: 16, padding: '20px', boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.2)' : '0 2px 12px rgba(0,0,0,0.05)', animation: 'fadeUp 0.3s ease both' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: text }}>
                  {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
                <div style={{ fontSize: 11.5, color: textSub, marginTop: 2 }}>{selectedTasks.length} tasks</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: textSub, cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            {selectedTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: textSub }}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>📅</div>
                <div style={{ fontSize: 13 }}>No tasks this day</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedTasks.map((t, i) => {
                  const ss = STATUS_STYLE[t.status];
                  return (
                    <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background: ss.bg, border: `1px solid ${ss.color}33`, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{ss.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: text }}>{t.text}</div>
                        <div style={{ fontSize: 11, color: ss.color, fontWeight: 500, marginTop: 2, textTransform: 'capitalize' }}>{t.status}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
