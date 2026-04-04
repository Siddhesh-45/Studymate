// ProgressChart.jsx — Polished: natural scale-fade, gradient accent, clean donut
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const cardEntry = { hidden: { opacity: 0, scale: 0.97 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: 'easeOut' } } };

const SLICES = [
  { key: 'completed', label: 'Completed', color: 'var(--sm-emerald-muted)' },
  { key: 'pending',   label: 'Pending',   color: 'var(--sm-indigo)' },
  { key: 'missed',    label: 'Missed',    color: 'var(--sm-red-muted)' },
];

export default function ProgressChart({ days = [] }) {
  const allTasks = days.flatMap(d => d.tasks || []);
  const counts   = {
    completed: allTasks.filter(t => t.status === 'completed').length,
    pending:   allTasks.filter(t => t.status === 'pending').length,
    missed:    allTasks.filter(t => t.status === 'missed').length,
  };
  const total = allTasks.length;
  const pct   = total > 0 ? Math.round((counts.completed / total) * 100) : 0;
  const data  = SLICES.map(s => ({ name: s.label, value: counts[s.key], color: s.color })).filter(d => d.value > 0);

  return (
    <motion.div variants={cardEntry} initial="hidden" animate="visible" style={C.card}>
      <div style={C.header}>
        <span style={C.heading}>📊 Task Analytics</span>
        <span style={C.badge}>{total} tasks</span>
      </div>

      {total === 0 ? (
        <div style={C.empty}>
          <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>📋</span>
          <p style={{ color: 'var(--sm-text-muted, #334155)', fontSize: 13, margin: 0 }}>Generate a schedule to see analytics</p>
        </div>
      ) : (
        <>
          <div style={{ position: 'relative' }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={58} outerRadius={84}
                     paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}
                     strokeWidth={0}>
                  {data.map(e => <Cell key={e.name} fill={e.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid var(--sm-surface-8)', borderRadius: 10, color: 'var(--sm-text, #f1f5f9)', fontSize: 12 }}
                  formatter={(v, n) => [`${v} tasks`, n]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Centre overlay */}
            <div style={C.centre}>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                style={C.centrePct}
              >{pct}%</motion.span>
              <span style={C.centreLabel}>complete</span>
            </div>
          </div>

          {/* Legend */}
          <div style={C.legend}>
            {SLICES.filter(s => counts[s.key] > 0).map(s => (
              <div key={s.key} style={C.legendItem}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                <span style={{ color: 'var(--sm-text-sub)', fontSize: 12 }}>{s.label}</span>
                <span style={{ color: 'var(--sm-text, #cbd5e1)', fontSize: 13, fontWeight: 700 }}>{counts[s.key]}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}

const GLASS = { background: 'var(--sm-surface-4)', border: '1px solid var(--sm-surface-8)', borderRadius: 18, backdropFilter: 'blur(16px)', boxShadow: '0 4px 24px rgba(0,0,0,0.35)' };
const C = {
  card:        { ...GLASS, padding: '22px 20px', height: '100%' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  heading:     { color: 'var(--sm-text, #e2e8f0)', fontSize: 15, fontWeight: 700 },
  badge:       { background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.2)', color: 'var(--sm-indigo)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 },
  empty:       { textAlign: 'center', padding: '40px 0' },
  centre:      { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' },
  centrePct:   { display: 'block', fontSize: 26, fontWeight: 800, lineHeight: 1, background: 'linear-gradient(135deg,var(--sm-indigo),#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  centreLabel: { display: 'block', fontSize: 10, color: 'var(--sm-text-muted, #475569)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 },
  legend:      { display: 'flex', justifyContent: 'center', gap: 18, marginTop: 4, flexWrap: 'wrap' },
  legendItem:  { display: 'flex', alignItems: 'center', gap: 6 },
};
