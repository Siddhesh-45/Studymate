// TodaySchedule.jsx — Polished: scale-fade entry, AnimatePresence exit, no y-jumps
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const isToday = (d) => {
  const dt = new Date(d), now = new Date();
  return dt.getDate() === now.getDate() && dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
};

const cardEntry = { hidden: { opacity: 0, scale: 0.97 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: 'easeOut' } } };
const stagger   = { visible: { transition: { staggerChildren: 0.06 } } };
const taskEntry = { hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } } };
const taskExit  = { opacity: 0, scale: 0.95, transition: { duration: 0.2 } };

const DIFF = {
  Easy:   { icon: '🟢', bg: 'rgba(52,211,153,0.07)',  border: 'rgba(52,211,153,0.18)',  color: 'var(--sm-emerald)' },
  Medium: { icon: '🟡', bg: 'rgba(251,191,36,0.07)',  border: 'rgba(251,191,36,0.18)',  color: 'var(--sm-yellow)' },
  Hard:   { icon: '🔴', bg: 'rgba(248,113,113,0.07)', border: 'rgba(248,113,113,0.18)', color: 'var(--sm-red)' },
};

export default function TodaySchedule({ days = [], onRefresh }) {
  const [busy,  setBusy]  = useState({});
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const todayDay = days.find(d => isToday(d.date));
  const tasks    = todayDay?.tasks || [];
  const pending  = tasks.filter(t => t.status === 'pending');
  const done     = tasks.filter(t => t.status === 'completed').length;

  const mark = async (taskId, status) => {
    setBusy(p => ({ ...p, [taskId]: status }));
    setError('');
    try {
      await API.patch(`/schedule/task/${taskId}`, { status });
      onRefresh();
    } catch (e) {
      setError(e.response?.data?.message || 'Update failed.');
    } finally {
      setBusy(p => { const n = { ...p }; delete n[taskId]; return n; });
    }
  };

  const dateLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <motion.div variants={cardEntry} initial="hidden" animate="visible" style={T.card}>
      {/* Header */}
      <div style={T.header}>
        <div>
          <h2 style={T.heading}>📅 Today's Study Plan</h2>
          <p style={T.dateLabel}>{dateLabel}</p>
        </div>

        {/* SVG progress ring */}
        {tasks.length > 0 && (
          <div style={{ position: 'relative', width: 50, height: 50, flexShrink: 0 }}>
            <svg width="50" height="50" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" stroke="var(--sm-surface-4)" strokeWidth="4" />
              <motion.circle cx="25" cy="25" r="20" fill="none" stroke="url(#ringGrad)" strokeWidth="4"
                strokeLinecap="round" transform="rotate(-90 25 25)"
                initial={{ strokeDashoffset: 2 * Math.PI * 20 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 20 * (1 - done / tasks.length) }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                style={{ strokeDasharray: 2 * Math.PI * 20 }}
              />
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="var(--sm-indigo)" />
                  <stop offset="100%" stopColor="var(--sm-emerald-muted)" />
                </linearGradient>
              </defs>
            </svg>
            <span style={T.ringText}>{done}/{tasks.length}</span>
          </div>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={T.error}
          >⚠️ {error}</motion.p>
        )}
      </AnimatePresence>

      {/* Task list */}
      {pending.length === 0 ? (
        <div style={T.empty}>
          <motion.span
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            style={{ fontSize: 42, display: 'block' }}
          >
            {tasks.length > 0 ? '🎉' : '😴'}
          </motion.span>
          <p style={T.emptyTitle}>{tasks.length > 0 ? "All tasks done for today!" : "No tasks scheduled today."}</p>
          <p style={T.emptyHint}>{tasks.length > 0 ? "Excellent work — enjoy your rest." : "Regenerate your schedule to get started."}</p>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pending.map((task) => {
              const tid = String(task._id);
              const d   = DIFF[task.difficulty] || DIFF.Medium;
              const b   = busy[tid];
              return (
                <motion.div
                  key={tid}
                  variants={taskEntry}
                  exit={taskExit}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  style={{ ...T.taskCard, background: d.bg, borderColor: d.border }}
                >
                  <div style={T.taskLeft}>
                    <span style={{ fontSize: 18 }}>{d.icon}</span>
                    <div>
                      <p style={T.taskTitle}>{task.title}</p>
                      <div style={T.chips}>
                        <span style={T.chip}>{task.difficulty}</span>
                        <span style={T.chip}>⏱ {task.allocatedHours}h</span>
                        {task.courseName && <span style={T.chip}>📚 {task.courseName}</span>}
                      </div>
                    </div>
                  </div>

                  <div style={T.actions}>
                    <motion.button
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      style={{ ...T.btnDone, opacity: b ? 0.6 : 1, width: '110px' }}
                      disabled={!!b} onClick={() => navigate(`/quiz/${task.courseId}/${task.topicId}`)}
                    >{'🧠 Quiz → Done'}</motion.button>
                    <motion.button
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      style={{ ...T.btnMiss, opacity: b ? 0.6 : 1 }}
                      disabled={!!b} onClick={() => mark(tid, 'missed')}
                    >{b === 'missed' ? '…' : '❌ Miss'}</motion.button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Footer */}
      {tasks.length > 0 && (
        <div style={T.footer}>
          <span style={T.footerItem}>✅ <strong style={{ color: 'var(--sm-emerald)' }}>{done}</strong> done</span>
          <span style={T.footerItem}>⏳ <strong style={{ color: 'var(--sm-indigo)' }}>{pending.length}</strong> remaining</span>
          {tasks.filter(t => t.status === 'missed').length > 0 && (
            <span style={T.footerItem}>❌ <strong style={{ color: 'var(--sm-red)' }}>{tasks.filter(t => t.status === 'missed').length}</strong> missed</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

const GLASS = { background: 'var(--sm-surface-4)', border: '1px solid var(--sm-surface-8)', borderRadius: 18, backdropFilter: 'blur(16px)', boxShadow: '0 4px 24px rgba(0,0,0,0.35)' };
const T = {
  card:       { ...GLASS, padding: '22px 24px', marginBottom: 16 },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  heading:    { color: 'var(--sm-text, #e2e8f0)', fontSize: 17, fontWeight: 700, margin: '0 0 3px' },
  dateLabel:  { color: 'var(--sm-text-muted, #475569)', fontSize: 13, margin: 0 },
  ringText:   { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 10, fontWeight: 700, color: 'var(--sm-text-sub, #94a3b8)' },
  error:      { color: 'var(--sm-red)', fontSize: 13, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: '8px 12px', marginBottom: 12 },
  empty:      { textAlign: 'center', padding: '28px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  emptyTitle: { color: 'var(--sm-text, #f1f5f9)', fontSize: 15, fontWeight: 700, margin: 0 },
  emptyHint:  { color: 'var(--sm-text-muted, #334155)', fontSize: 13, margin: 0 },
  taskCard:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid', borderRadius: 14, padding: '13px 16px', flexWrap: 'wrap', gap: 10 },
  taskLeft:   { display: 'flex', alignItems: 'flex-start', gap: 12, flex: '1 1 200px' },
  taskTitle:  { color: 'var(--sm-text, #f1f5f9)', fontSize: 13, fontWeight: 600, margin: '0 0 6px', lineHeight: 1.3 },
  chips:      { display: 'flex', gap: 6, flexWrap: 'wrap' },
  chip:       { fontSize: 10, color: 'var(--sm-text-sub)', background: 'var(--sm-surface-5)', border: '1px solid var(--sm-surface-7)', borderRadius: 6, padding: '2px 8px' },
  actions:    { display: 'flex', gap: 8, flexShrink: 0 },
  btnDone:    { background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', color: 'var(--sm-emerald)', fontSize: 12, fontWeight: 700, borderRadius: 10, padding: '7px 14px', cursor: 'pointer' },
  btnMiss:    { background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--sm-red)', fontSize: 12, fontWeight: 700, borderRadius: 10, padding: '7px 14px', cursor: 'pointer' },
  footer:     { display: 'flex', gap: 18, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--sm-surface-5)', fontSize: 13, flexWrap: 'wrap' },
  footerItem: { color: 'var(--sm-text-sub)' },
};
