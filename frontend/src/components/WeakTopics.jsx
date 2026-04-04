// WeakTopics.jsx — Polished smooth stagger, clean bar animation
import { motion } from 'framer-motion';

const cardEntry  = { hidden: { opacity: 0, scale: 0.97 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: 'easeOut' } } };
const itemEntry  = { hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } } };
const stagger    = { visible: { transition: { staggerChildren: 0.07 } } };

const DIFF = {
  Easy:   { icon: '🟢', color: 'var(--sm-emerald)' },
  Medium: { icon: '🟡', color: 'var(--sm-yellow)' },
  Hard:   { icon: '🔴', color: 'var(--sm-red)' },
};

export default function WeakTopics({ days = [] }) {
  const map = {};
  days.forEach(day => (day.tasks || []).forEach(task => {
    const tid = String(task.topicId);
    if (!map[tid]) map[tid] = { title: task.title || 'Untitled', difficulty: task.difficulty || 'Medium', course: task.courseName || '', correct: 0, wrong: 0 };
    map[tid].correct += task.performance?.correct || 0;
    map[tid].wrong   += task.performance?.wrong   || 0;
  }));

  const weak = Object.values(map)
    .filter(t => t.wrong > t.correct && (t.correct + t.wrong) > 0)
    .sort((a, b) => (b.wrong - b.correct) - (a.wrong - a.correct))
    .slice(0, 5);

  return (
    <motion.div variants={cardEntry} initial="hidden" animate="visible" style={W.card}>
      <div style={W.header}>
        <span style={W.heading}>🧠 Weak Topics</span>
        {weak.length > 0 && (
          <span style={W.badge}>{weak.length} to focus on</span>
        )}
      </div>

      {weak.length === 0 ? (
        <div style={W.empty}>
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            style={{ fontSize: 38, display: 'block' }}
          >🎉</motion.span>
          <p style={{ color: 'var(--sm-text-sub, #94a3b8)', fontSize: 13, fontWeight: 600, margin: '10px 0 4px' }}>You're crushing it!</p>
          <p style={{ color: 'var(--sm-text-muted, #334155)', fontSize: 12, margin: 0 }}>Complete quizzes to track topic performance</p>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {weak.map((t, i) => {
            const total    = t.correct + t.wrong;
            const accuracy = Math.round((t.correct / total) * 100);
            const d        = DIFF[t.difficulty] || DIFF.Medium;
            return (
              <motion.div key={i} variants={itemEntry} style={W.item}>
                <div style={W.itemTop}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 16, marginTop: 1 }}>{d.icon}</span>
                    <div>
                      <p style={W.topicName}>{t.title}</p>
                      <p style={{ ...W.topicSub, color: d.color }}>{t.difficulty}</p>
                    </div>
                  </div>
                  <span style={W.score}>✅ {t.correct} &nbsp;❌ {t.wrong}</span>
                </div>
                <div style={W.barTrack}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${accuracy}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.06, ease: 'easeOut' }}
                    style={W.barFill}
                  />
                </div>
                <p style={W.accLabel}>{accuracy}% accuracy</p>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}

const GLASS = { background: 'var(--sm-surface-4)', border: '1px solid var(--sm-surface-8)', borderRadius: 18, backdropFilter: 'blur(16px)', boxShadow: '0 4px 24px rgba(0,0,0,0.35)' };
const W = {
  card:      { ...GLASS, padding: '22px 20px', height: '100%' },
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heading:   { color: 'var(--sm-text, #e2e8f0)', fontSize: 15, fontWeight: 700 },
  badge:     { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--sm-red)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 },
  empty:     { textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  item:      { background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.12)', borderRadius: 12, padding: '12px 14px' },
  itemTop:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  topicName: { color: 'var(--sm-text, #f1f5f9)', fontSize: 13, fontWeight: 600, margin: 0, lineHeight: 1.3 },
  topicSub:  { fontSize: 10, margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' },
  score:     { fontSize: 11, color: 'var(--sm-text-sub)', background: 'var(--sm-surface-4)', border: '1px solid var(--sm-surface-6)', borderRadius: 8, padding: '3px 8px', whiteSpace: 'nowrap' },
  barTrack:  { width: '100%', height: 4, background: 'var(--sm-surface-5)', borderRadius: 2, overflow: 'hidden' },
  barFill:   { height: '100%', background: 'linear-gradient(90deg,var(--sm-emerald-muted),#059669)', borderRadius: 2 },
  accLabel:  { color: 'var(--sm-red-muted)', fontSize: 10, fontWeight: 700, margin: '5px 0 0', textAlign: 'right' },
};
