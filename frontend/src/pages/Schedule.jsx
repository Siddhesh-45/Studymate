import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { useTheme } from '../context/ThemeContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DEFAULT_HOURS = [2,2,2,2,2,4,4];

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Education is the passport to the future.", author: "Malcolm X" },
  { text: "Study hard, for the well is deep and our brains are shallow.", author: "Richard Baxter" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
];

const COLORS = [
  { bg:'rgba(99,102,241,.15)',  border:'rgba(99,102,241,.4)',  text:'#a5b4fc' },
  { bg:'rgba(16,185,129,.12)',  border:'rgba(16,185,129,.35)', text:'#6ee7b7' },
  { bg:'rgba(245,158,11,.12)',  border:'rgba(245,158,11,.35)', text:'#fcd34d' },
  { bg:'rgba(239,68,68,.12)',   border:'rgba(239,68,68,.3)',   text:'#fca5a5' },
  { bg:'rgba(6,182,212,.12)',   border:'rgba(6,182,212,.35)',  text:'#67e8f9' },
  { bg:'rgba(168,85,247,.15)',  border:'rgba(168,85,247,.4)',  text:'#d8b4fe' },
  { bg:'rgba(236,72,153,.12)',  border:'rgba(236,72,153,.3)',  text:'#f9a8d4' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const today = () => new Date();
const toKey = (y, m, d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
const isDateToday = (d) => { const n=today(); return d===toKey(n.getFullYear(),n.getMonth(),n.getDate()); };
const fmtDate = (s) => new Date(s+'T00:00:00').toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'});
const fmtShort = (s) => new Date(s+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
const getDaysInMonth = (y,m) => new Date(y,m+1,0).getDate();
const getFirstDay   = (y,m) => new Date(y,m,1).getDay();
const buildColorMap = (days=[]) => { const map={}; let i=0; days.forEach(d=>d.tasks?.forEach(t=>{ const k=String(t.courseId); if(!(k in map)) map[k]=i++%COLORS.length; })); return map; };

// ─── CSS injection ────────────────────────────────────────────────────────────
const CSS = `
@keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
@keyframes spin   { to{transform:rotate(360deg)} }
@keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.5} }
@keyframes glow   { 0%,100%{box-shadow:0 0 12px rgba(99,102,241,.3)} 50%{box-shadow:0 0 28px rgba(99,102,241,.6)} }
@keyframes pop    { 0%{transform:scale(.8);opacity:0} 70%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
@keyframes shimmer{ 0%{background-position:-400px 0} 100%{background-position:400px 0} }
.sched-card:hover { transform:translateY(-2px)!important; }
.task-chip:hover  { filter:brightness(1.12); }
.sched-btn:hover  { opacity:.88; }
::-webkit-scrollbar{width:5px;height:5px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:rgba(99,102,241,.3);border-radius:4px}
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
@media (max-width: 640px) {
  .sched-2col { grid-template-columns: 1fr !important; }
  .sched-3col { grid-template-columns: 1fr !important; }
}
`;
if (!document.querySelector('[data-sched-css]')) {
  const el = document.createElement('style');
  el.setAttribute('data-sched-css','1');
  el.textContent = CSS;
  document.head.appendChild(el);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MotivationPanel({ isDark, tasks }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const name = (user.name || 'Student').split(' ')[0];
  const hour = today().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const quote = QUOTES[today().getDate() % QUOTES.length];

  const done    = tasks.filter(t=>t.status==='completed').length;
  const total   = tasks.length;
  const pct     = total ? Math.round((done/total)*100) : 0;
  const streak  = 5; // would come from API in real app

  const text    = isDark ? '#e2e8f0' : '#1e293b';
  const textSub = isDark ? '#94a3b8' : '#64748b';
  const cardBg  = isDark ? 'rgba(255,255,255,0.04)' : '#fff';
  const border  = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0';

  return (
    <div style={{ marginBottom: 24, animation: 'fadeUp .5s ease' }}>
      {/* Greeting + streak row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:16 }}>
        <div>
          <div style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.5px', background:'linear-gradient(90deg,#6366f1,#a855f7,#ec4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            {greeting}, {name} 👋
          </div>
          <div style={{ fontSize:14, color:textSub, marginTop:4 }}>Here's your study plan for today.</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', borderRadius:40, background:isDark?'rgba(245,158,11,.12)':'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.3)', animation:'glow 3s ease infinite' }}>
          <span style={{ fontSize:22 }}>🔥</span>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:'#f59e0b', lineHeight:1 }}>{streak}</div>
            <div style={{ fontSize:10, color:'#f59e0b', fontWeight:600 }}>DAY STREAK</div>
          </div>
        </div>
      </div>

      <div className="sched-2col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {/* Daily progress */}
        <div style={{ background:cardBg, border, borderRadius:16, padding:'18px 20px', boxShadow:isDark?'0 4px 20px rgba(0,0,0,.2)':'0 2px 12px rgba(0,0,0,.06)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ fontSize:13, fontWeight:600, color:text }}>Today's Progress</div>
            <div style={{ fontSize:13, fontWeight:700, color:'#6366f1' }}>{done}/{total} tasks</div>
          </div>
          <div style={{ height:10, borderRadius:5, background:isDark?'rgba(255,255,255,.06)':'#f1f5f9', overflow:'hidden', marginBottom:8 }}>
            <div style={{ height:'100%', width:`${pct}%`, borderRadius:5, background:'linear-gradient(90deg,#6366f1,#a855f7)', transition:'width 1s ease' }} />
          </div>
          <div style={{ fontSize:12, color:textSub }}>{pct}% complete · {total-done} remaining</div>
        </div>

        {/* Quote card */}
        <div style={{ background:isDark?'rgba(99,102,241,.08)':'rgba(99,102,241,.05)', border:'1px solid rgba(99,102,241,.2)', borderRadius:16, padding:'18px 20px', backdropFilter:'blur(12px)', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
          <div style={{ fontSize:16, marginBottom:8 }}>✨</div>
          <div style={{ fontSize:13, fontStyle:'italic', color:text, lineHeight:1.5 }}>"{quote.text}"</div>
          <div style={{ fontSize:11, color:'#818cf8', fontWeight:600, marginTop:8 }}>— {quote.author}</div>
        </div>
      </div>
    </div>
  );
}

function StatsRow({ tasks, isDark }) {
  const todayKey = toKey(today().getFullYear(), today().getMonth(), today().getDate());
  const done    = tasks.filter(t=>t.status==='completed').length;
  const missed  = tasks.filter(t=>t.status==='missed' || (t.status==='pending' && t.date < todayKey)).length;
  const pending = tasks.filter(t=>t.status==='pending' && t.date >= todayKey).length;
  const cards = [
    { icon:'✅', label:'Completed', value:done,    color:'#10b981', bg:'rgba(16,185,129,.12)', border:'rgba(16,185,129,.25)' },
    { icon:'❌', label:'Missed',    value:missed,   color:'#ef4444', bg:'rgba(239,68,68,.12)',  border:'rgba(239,68,68,.25)'  },
    { icon:'🔵', label:'Upcoming',  value:pending,  color:'#6366f1', bg:'rgba(99,102,241,.12)', border:'rgba(99,102,241,.25)' },
  ];
  return (
    <div className="sched-3col" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
      {cards.map(c=>(
        <div key={c.label} className="sched-card" style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:14, padding:'14px 18px', display:'flex', alignItems:'center', gap:12, cursor:'default', transition:'transform .2s ease, box-shadow .2s ease', boxShadow:isDark?'0 2px 12px rgba(0,0,0,.2)':'0 1px 6px rgba(0,0,0,.05)' }}>
          <div style={{ width:40, height:40, borderRadius:12, background:c.bg, border:`1px solid ${c.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{c.icon}</div>
          <div>
            <div style={{ fontSize:24, fontWeight:800, color:c.color, lineHeight:1 }}>{c.value}</div>
            <div style={{ fontSize:11, color:c.color, fontWeight:600, marginTop:2, opacity:.8 }}>{c.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CalendarGrid({ scheduleDays, colorMap, onDayClick, view, isDark }) {
  const n = today();
  const [cur, setCur] = useState({ year:n.getFullYear(), month:n.getMonth() });
  const { year, month } = cur;
  const todayKey = toKey(n.getFullYear(), n.getMonth(), n.getDate());

  const tasksByDay = {};
  scheduleDays.forEach(d => {
    if(d.date) {
      d.tasks?.forEach(t => {
        const dStr = t.date || new Date(d.date).toISOString().split('T')[0];
        if (!tasksByDay[dStr]) tasksByDay[dStr] = [];
        tasksByDay[dStr].push(t);
      });
    }
  });

  // ── Week view ──
  if (view === 'week') {
    const startOfWeek = new Date(n);
    startOfWeek.setDate(n.getDate() - n.getDay());
    const weekDays = Array.from({length:7}, (_,i)=>{ const d=new Date(startOfWeek); d.setDate(d.getDate()+i); return d; });
    const text    = isDark ? '#e2e8f0' : '#1e293b';
    const textSub = isDark ? '#94a3b8' : '#64748b';
    const cardBg  = isDark ? 'rgba(255,255,255,.04)' : '#fff';
    const border  = isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid #e2e8f0';
    return (
      <div style={{ overflowX:'auto', paddingBottom:12 }} className="no-scrollbar">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8, minWidth:700 }}>
          {weekDays.map((d,i)=>{
            const key = toKey(d.getFullYear(),d.getMonth(),d.getDate());
            const isTd = key===todayKey;
            const tasks = tasksByDay[key]||[];
            return (
              <div key={i} onClick={()=>onDayClick(key)} style={{ background:isTd?'rgba(99,102,241,.12)':cardBg, border:isTd?'1px solid rgba(99,102,241,.4)':border, borderRadius:14, padding:'12px 8px', cursor:'pointer', minHeight:120, transition:'all .2s', animation:`fadeUp .4s ease ${i*.06}s both` }}>
                <div style={{ textAlign:'center', marginBottom:8 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:textSub, textTransform:'uppercase' }}>{DAYS_SHORT[d.getDay()]}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:isTd?'#818cf8':text, background:isTd?'rgba(99,102,241,.2)':'transparent', width:34, height:34, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'4px auto 0' }}>{d.getDate()}</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  {tasks.slice(0,2).map((t,ti)=>{
                    const c=COLORS[colorMap[String(t.courseId)]??0];
                    let st=t.status;
                    if (st==='pending' && key < todayKey) st = 'missed';
                    return (<div key={ti} className="task-chip" style={{ fontSize:9, padding:'3px 6px', borderRadius:6, background:st==='completed'?'rgba(16,185,129,.15)':st==='missed'?'rgba(239,68,68,.12)':c.bg, color:st==='completed'?'#10b981':st==='missed'?'#ef4444':c.text, border:`1px solid ${st==='completed'?'rgba(16,185,129,.3)':st==='missed'?'rgba(239,68,68,.25)':c.border}`, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', transition:'filter .15s' }}>{t.title}</div>);
                  })}
                  {tasks.length>2&&<div style={{fontSize:9,color:textSub}}>+{tasks.length-2} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Month view ──
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDay(year, month);
  const cells = [];
  for(let i=0;i<firstDay;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(d);

  const text    = isDark ? '#e2e8f0' : '#1e293b';
  const textSub = isDark ? '#94a3b8' : '#64748b';
  const cardBg  = isDark ? 'rgba(255,255,255,.04)' : '#fff';
  const border  = isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid #e2e8f0';

  return (
    <div>
      {/* Nav */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <button onClick={()=>setCur(p=>p.month===0?{year:p.year-1,month:11}:{...p,month:p.month-1})} style={{ background:isDark?'rgba(255,255,255,.06)':'#f1f5f9', border, borderRadius:8, width:32, height:32, cursor:'pointer', color:text, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
        <div style={{ fontWeight:700, fontSize:16, color:text }}>{MONTHS[month]} {year}</div>
        <button onClick={()=>setCur(p=>p.month===11?{year:p.year+1,month:0}:{...p,month:p.month+1})} style={{ background:isDark?'rgba(255,255,255,.06)':'#f1f5f9', border, borderRadius:8, width:32, height:32, cursor:'pointer', color:text, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
      </div>

      <div style={{ overflowX:'auto', paddingBottom:12 }} className="no-scrollbar">
        <div style={{ minWidth: 700 }}>
          {/* Day labels */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:6 }}>
            {DAYS_SHORT.map(d=><div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:700, color:textSub, padding:'4px 0', textTransform:'uppercase' }}>{d}</div>)}
          </div>
          {/* Cells */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
            {cells.map((day,i)=>{
              if(day===null) return <div key={`e${i}`}/>;
              const key   = toKey(year, month, day);
              const isTd  = key===todayKey;
              const tasks = tasksByDay[key]||[];
              const isWknd = (i%7===0||i%7===6);
              return (
                <div key={key} onClick={()=>onDayClick(key)} style={{ borderRadius:10, padding:'6px 4px', minHeight:72, cursor:'pointer', background:isTd?'rgba(99,102,241,.14)':cardBg, border:isTd?'1.5px solid rgba(99,102,241,.5)':'1.5px solid transparent', boxShadow:isTd?'0 0 16px rgba(99,102,241,.25)':'none', transition:'all .15s', animation:`fadeUp .4s ease ${(i%7)*.05}s both` }}
                  onMouseEnter={e=>{e.currentTarget.style.background=isTd?'rgba(99,102,241,.2)':isDark?'rgba(255,255,255,.06)':'#f8fafc';e.currentTarget.style.transform='scale(1.03)';}}
                  onMouseLeave={e=>{e.currentTarget.style.background=isTd?'rgba(99,102,241,.14)':cardBg;e.currentTarget.style.transform='';}}
                >
                  <div style={{ textAlign:'center', fontSize:13, fontWeight:isTd?800:500, color:isTd?'#818cf8':isWknd?textSub:text, background:isTd?'rgba(99,102,241,.25)':'transparent', width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 4px' }}>{day}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                    {tasks.slice(0,2).map((t,ti)=>{
                      const c=COLORS[colorMap[String(t.courseId)]??0];
                      let st=t.status;
                      if (st==='pending' && key < todayKey) st = 'missed';
                      return (<div key={ti} className="task-chip" style={{ fontSize:9, padding:'2px 5px', borderRadius:5, background:st==='completed'?'rgba(16,185,129,.15)':st==='missed'?'rgba(239,68,68,.12)':c.bg, color:st==='completed'?'#10b981':st==='missed'?'#ef4444':c.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', transition:'filter .15s' }}>{t.title}</div>);
                    })}
                    {tasks.length>2&&<div style={{fontSize:9,color:textSub,textAlign:'center'}}>+{tasks.length-2}</div>}
                  </div>
                  {/* Status dot */}
                  {tasks.length>0&&<div style={{ display:'flex', justifyContent:'center', gap:3, marginTop:3 }}>
                    {tasks.some(t => t.status==='completed')&&<div style={{width:5,height:5,borderRadius:'50%',background:'#10b981'}}/>}
                    {tasks.some(t => t.status==='missed' || (t.status==='pending' && key < todayKey))&&<div style={{width:5,height:5,borderRadius:'50%',background:'#ef4444'}}/>}
                    {tasks.some(t => t.status==='pending' && key >= todayKey)&&<div style={{width:5,height:5,borderRadius:'50%',background:'#6366f1'}}/>}
                  </div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskModal({ dayKey, tasks, colorMap, onClose, onUpdateTask, taskLoading, isDark }) {
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [timerOn, setTimerOn] = useState(false);
  const timerRef = useRef(null);

  useEffect(()=>{
    if(timerOn) timerRef.current = setInterval(()=>setTimeSpent(p=>p+1), 1000);
    else clearInterval(timerRef.current);
    return ()=>clearInterval(timerRef.current);
  },[timerOn]);

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const text    = isDark ? '#e2e8f0' : '#1e293b';
  const textSub = isDark ? '#94a3b8' : '#64748b';
  const bg      = isDark ? '#0f172a' : '#fff';
  const border  = isDark ? '1px solid rgba(255,255,255,.1)' : '1px solid #e2e8f0';

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(8px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:bg, borderRadius:20, width:'100%', maxWidth:520, maxHeight:'85vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 24px 80px rgba(0,0,0,.5)', animation:'pop .3s ease', border }}>
        {/* Header */}
        <div style={{ padding:'20px 22px', borderBottom:border, display:'flex', justifyContent:'space-between', alignItems:'center', background:'linear-gradient(135deg,rgba(99,102,241,.08),rgba(168,85,247,.06))' }}>
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:text }}>{fmtDate(dayKey)}</div>
            <div style={{ fontSize:12, color:textSub, marginTop:2 }}>{tasks.length} tasks scheduled</div>
          </div>
          <button onClick={onClose} style={{ background:isDark?'rgba(255,255,255,.08)':'#f1f5f9', border, borderRadius:8, width:32, height:32, cursor:'pointer', color:text, fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>

        <div style={{ overflowY:'auto', flex:1, padding:'20px 22px', display:'flex', flexDirection:'column', gap:16 }}>
          {/* Study timer */}
          <div style={{ background:isDark?'rgba(99,102,241,.08)':'rgba(99,102,241,.05)', border:'1px solid rgba(99,102,241,.2)', borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'#818cf8', textTransform:'uppercase', letterSpacing:'.06em' }}>Study Timer</div>
              <div style={{ fontSize:28, fontWeight:800, color:text, fontFamily:'monospace', marginTop:4 }}>{fmt(timeSpent)}</div>
            </div>
            <button onClick={()=>setTimerOn(p=>!p)} style={{ padding:'9px 18px', borderRadius:10, border:'none', background:timerOn?'rgba(239,68,68,.15)':'linear-gradient(135deg,#6366f1,#a855f7)', color:timerOn?'#f87171':'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
              {timerOn ? '⏸ Pause' : '▶ Start'}
            </button>
          </div>

          {/* Task list */}
          {tasks.length===0 ? (
            <div style={{ textAlign:'center', padding:'30px 0', color:textSub }}>
              <div style={{ fontSize:36, marginBottom:8 }}>📅</div>
              <div>No tasks this day</div>
            </div>
          ) : tasks.map((t,i)=>{
            const c = COLORS[colorMap[String(t.courseId)]??0];
            let st = t.status;
            const todayKey = toKey(today().getFullYear(), today().getMonth(), today().getDate());
            if (st === 'pending' && dayKey < todayKey) st = 'missed';
            const loading = taskLoading[String(t._id)];
            return (
              <div key={i} style={{ borderRadius:14, padding:'14px 16px', background:st==='completed'?'rgba(16,185,129,.08)':st==='missed'?'rgba(239,68,68,.07)':c.bg, border:`1px solid ${st==='completed'?'rgba(16,185,129,.25)':st==='missed'?'rgba(239,68,68,.2)':c.border}`, display:'flex', gap:12, alignItems:'flex-start', animation:`fadeUp .3s ease ${i*.07}s both` }}>
                {/* Status dot */}
                <div style={{ width:10, height:10, borderRadius:'50%', background:st==='completed'?'#10b981':st==='missed'?'#ef4444':'#6366f1', marginTop:4, flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:c.text, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>{t.courseName}</div>
                  <div style={{ fontSize:14, fontWeight:600, color:text, textDecoration:st==='completed'?'line-through':'none', opacity:st==='completed'?.6:1, marginBottom:6 }}>{t.title}</div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:st==='pending'?10:0 }}>
                    <span style={{ fontSize:11, color:textSub }}>⏱ {t.allocatedHours}h</span>
                    {t.difficulty&&<span style={{ fontSize:11, padding:'1px 7px', borderRadius:20, background:t.difficulty==='Easy'?'rgba(16,185,129,.15)':t.difficulty==='Hard'?'rgba(239,68,68,.12)':'rgba(245,158,11,.12)', color:t.difficulty==='Easy'?'#10b981':t.difficulty==='Hard'?'#ef4444':'#f59e0b', fontWeight:600 }}>{t.difficulty}</span>}
                    {t.youtubeUrl&&<a href={t.youtubeUrl} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'#818cf8', fontWeight:600, textDecoration:'none' }}>▶ Watch</a>}
                  </div>
                  {st==='pending'&&(
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => navigate(`/quiz/${t.courseId}/${t.topicId}`)} disabled={!!loading} style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid rgba(16,185,129,.3)', background:'rgba(16,185,129,.12)', color:'#10b981', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                        {loading==='completed'?'...':'✅ Take Quiz & Mark Done'}
                      </button>
                      <button onClick={()=>onUpdateTask(String(t._id),'missed')} disabled={!!loading} style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid rgba(239,68,68,.25)', background:'rgba(239,68,68,.1)', color:'#f87171', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                        {loading==='missed'?'...':'❌ Missed'}
                      </button>
                    </div>
                  )}
                  {st!=='pending'&&<div style={{ fontSize:12, fontWeight:700, color:st==='completed'?'#10b981':'#f87171' }}>{st==='completed'?'✅ Completed':'❌ Missed'}</div>}
                </div>
              </div>
            );
          })}

          {/* Notes */}
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:text, marginBottom:8 }}>📝 Notes</div>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add notes for this day..." style={{ width:'100%', minHeight:80, padding:'10px 12px', borderRadius:10, border:`1px solid ${isDark?'rgba(255,255,255,.1)':'#e2e8f0'}`, background:isDark?'rgba(255,255,255,.05)':'#f8fafc', color:text, fontSize:13, resize:'vertical', outline:'none', boxSizing:'border-box' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function NextTaskBanner({ tasks, onDayClick, isDark }) {
  const n = new Date();
  const todayKey = `${n.getFullYear()}${String(n.getMonth()+1).padStart(2,'0')}${String(n.getDate()).padStart(2,'0')}`;
  
  const next = tasks.find(t => {
    if (t.status !== 'pending') return false;
    if (!t.date) return true;
    const [y, m, d] = t.date.split('-');
    const tKey = `${y}${String(parseInt(m)).padStart(2,'0')}${String(parseInt(d)).padStart(2,'0')}`;
    return tKey >= todayKey;
  });

  if (!next) return null;
  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:150, maxWidth:300, background:isDark?'rgba(15,23,42,.95)':'rgba(255,255,255,.95)', border:'1px solid rgba(99,102,241,.35)', borderRadius:16, padding:'14px 18px', boxShadow:'0 8px 32px rgba(99,102,241,.25)', backdropFilter:'blur(16px)', animation:'fadeUp .5s .3s ease both' }}>
      <div style={{ fontSize:10, fontWeight:700, color:'#818cf8', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>⚡ Next Task</div>
      <div style={{ fontSize:13, fontWeight:700, color:isDark?'#e2e8f0':'#1e293b', marginBottom:10, lineHeight:1.4 }}>{next.title}</div>
      <button onClick={()=>next.date&&onDayClick(next.date)} style={{ width:'100%', padding:'8px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#6366f1,#a855f7)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
        🚀 Start Now
      </button>
    </div>
  );
}

function AvailabilityTab({ isDark }) {
  const [weeklyHours,  setWeeklyHours ] = useState([...DEFAULT_HOURS]);
  const [sessionDur,   setSessionDur  ] = useState(1);
  const [priority,     setPriority    ] = useState('deadline');
  const [saving,       setSaving      ] = useState(false);
  const [msg,          setMsg         ] = useState('');
  const [myCourses,    setMyCourses   ] = useState([]);
  const [selectedIds,  setSelectedIds ] = useState([]);
  const [generating,   setGenerating  ] = useState(false);

  const text    = isDark ? '#e2e8f0' : '#1e293b';
  const textSub = isDark ? '#94a3b8' : '#64748b';
  const cardBg  = isDark ? 'rgba(255,255,255,.04)' : '#fff';
  const border  = isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid #e2e8f0';

  useEffect(()=>{
    API.get('/schedule/availability').then(r=>{ if(r.data?.weeklyHours) setWeeklyHours(r.data.weeklyHours); if(r.data?.sessionDuration) setSessionDur(r.data.sessionDuration); if(r.data?.priority) setPriority(r.data.priority); }).catch(()=>{});
    API.get('/student-courses').then(r=>{ const list=r.data?.courses||[]; const ex=list.map(c=>c.courseId).filter(Boolean); setMyCourses(ex); setSelectedIds(ex.map(c=>c._id)); }).catch(()=>{});
  },[]);

  const save = async()=>{
    setSaving(true); setMsg('');
    try { await API.post('/schedule/availability',{weeklyHours,sessionDuration:sessionDur,priority}); setMsg('✅ Saved! Regenerating schedule...'); setTimeout(generate, 800); } catch { setMsg('❌ Save failed.'); } finally { setSaving(false); }
  };
  const generate = async()=>{
    if(!selectedIds.length){setMsg('❌ Select at least one course.'); return;}
    setGenerating(true);
    try { await API.post('/schedule/generate-smart',{selectedCourseIds:selectedIds}); setMsg('🎉 Schedule generated!'); } catch { setMsg('❌ Generation failed.'); } finally { setGenerating(false); }
  };

  const DAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, animation:'fadeUp .4s ease' }}>
      {/* Daily hours */}
      <div style={{ background:cardBg, border, borderRadius:16, padding:'20px 22px', boxShadow:isDark?'0 4px 20px rgba(0,0,0,.2)':'0 2px 12px rgba(0,0,0,.05)' }}>
        <div style={{ fontWeight:700, fontSize:15, color:text, marginBottom:4 }}>📆 Daily Study Hours</div>
        <div style={{ fontSize:12, color:textSub, marginBottom:16 }}>Set 0 for days you can't study</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:10 }}>
          {DAYS_FULL.map((day,i)=>(
            <div key={i} style={{ background:isDark?'rgba(255,255,255,.03)':'#f8fafc', border, borderRadius:12, padding:12, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
              <div style={{ fontSize:13, fontWeight:700, color:text }}>{day.slice(0,3)}</div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <button onClick={()=>{const h=[...weeklyHours];h[i]=Math.max(0,h[i]-.5);setWeeklyHours(h);}} style={{ width:24, height:24, borderRadius:6, border, background:'transparent', color:text, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                <span style={{ fontSize:14, fontWeight:700, color:weeklyHours[i]===0?textSub:'#818cf8', minWidth:32, textAlign:'center' }}>{weeklyHours[i]===0?'OFF':`${weeklyHours[i]}h`}</span>
                <button onClick={()=>{const h=[...weeklyHours];h[i]=Math.min(12,h[i]+.5);setWeeklyHours(h);}} style={{ width:24, height:24, borderRadius:6, border, background:'transparent', color:text, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
              </div>
              <div style={{ width:'100%', height:4, borderRadius:2, background:isDark?'rgba(255,255,255,.06)':'#f1f5f9', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${(weeklyHours[i]/12)*100}%`, borderRadius:2, background:'linear-gradient(90deg,#6366f1,#a855f7)', transition:'width .3s' }}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', paddingTop:14, marginTop:14, borderTop:border, fontSize:13, color:textSub }}>
          <span>Weekly total:</span>
          <span style={{ fontWeight:700, color:'#818cf8' }}>{weeklyHours.reduce((a,b)=>a+b,0).toFixed(1)}h / week</span>
        </div>
      </div>

      {/* Courses */}
      <div style={{ background:cardBg, border, borderRadius:16, padding:'20px 22px' }}>
        <div style={{ fontWeight:700, fontSize:15, color:text, marginBottom:4 }}>📚 Courses to Schedule</div>
        <div style={{ fontSize:12, color:textSub, marginBottom:14 }}>Select which courses to include</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {myCourses.length===0 ? <span style={{fontSize:13,color:textSub}}>No courses found. Enroll in courses first.</span> :
          myCourses.map(c=>{
            const sel=selectedIds.includes(c._id);
            return (<label key={c._id} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:20, border:`1px solid ${sel?'rgba(99,102,241,.4)':'rgba(255,255,255,.08)'}`, background:sel?'rgba(99,102,241,.15)':'transparent', color:sel?'#a5b4fc':textSub, fontSize:13, fontWeight:500, cursor:'pointer' }}>
              <input type="checkbox" checked={sel} onChange={()=>setSelectedIds(p=>sel?p.filter(id=>id!==c._id):[...p,c._id])} style={{accentColor:'#6366f1'}}/>
              {c.courseName}
            </label>);
          })}
        </div>
      </div>

      {/* Preferences */}
      <div style={{ background:cardBg, border, borderRadius:16, padding:'20px 22px' }}>
        <div style={{ fontWeight:700, fontSize:15, color:text, marginBottom:14 }}>🎯 Study Preferences</div>
        <div className="sched-2col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:text, marginBottom:8 }}>Session Duration</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {[.5,1,1.5,2].map(v=>(
                <button key={v} onClick={()=>setSessionDur(v)} style={{ padding:'7px 14px', borderRadius:20, border:`1px solid ${sessionDur===v?'rgba(99,102,241,.4)':'rgba(255,255,255,.08)'}`, background:sessionDur===v?'rgba(99,102,241,.2)':'transparent', color:sessionDur===v?'#a5b4fc':textSub, fontSize:12, cursor:'pointer' }}>
                  {v===.5?'30m':v===1?'1h':v===1.5?'1.5h':'2h'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:text, marginBottom:8 }}>Priority</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {[['deadline','⚡ Deadline'],['balanced','⚖️ Balanced'],['difficulty','🧠 Easy→Hard']].map(([v,l])=>(
                <button key={v} onClick={()=>setPriority(v)} style={{ padding:'7px 12px', borderRadius:20, border:`1px solid ${priority===v?'rgba(99,102,241,.4)':'rgba(255,255,255,.08)'}`, background:priority===v?'rgba(99,102,241,.2)':'transparent', color:priority===v?'#a5b4fc':textSub, fontSize:12, cursor:'pointer' }}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {msg&&<div style={{ padding:'12px 16px', borderRadius:10, background:msg.startsWith('✅')||msg.startsWith('🎉')?'rgba(16,185,129,.1)':'rgba(239,68,68,.1)', border:`1px solid ${msg.startsWith('✅')||msg.startsWith('🎉')?'rgba(16,185,129,.25)':'rgba(239,68,68,.25)'}`, color:msg.startsWith('✅')||msg.startsWith('🎉')?'#10b981':'#f87171', fontSize:13 }}>{msg}</div>}
      <button onClick={save} disabled={saving||generating} style={{ padding:'13px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#6366f1,#a855f7)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 6px 20px rgba(99,102,241,.4)' }}>
        {saving?'💾 Saving..':generating?'⏳ Generating..':`💾 Save & Generate Schedule`}
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Schedule() {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [tab,          setTab        ] = useState('schedule');
  const [view,         setView       ] = useState('month');
  const [schedule,     setSchedule   ] = useState(null);
  const [colorMap,     setColorMap   ] = useState({});
  const [loading,      setLoading    ] = useState(false);
  const [error,        setError      ] = useState('');
  const [taskLoading,  setTaskLoading] = useState({});
  const [modalDay,     setModalDay   ] = useState(null);
  const [generating,  setGenerating ] = useState(false);

  const text    = isDark ? '#e2e8f0' : '#1e293b';
  const textSub = isDark ? '#94a3b8' : '#64748b';
  const cardBg  = isDark ? 'rgba(255,255,255,.04)' : '#fff';
  const border  = isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid #e2e8f0';

  const loadSchedule = useCallback(async()=>{
    setLoading(true); setError('');
    try { const r=await API.get('/schedule/smart'); const d=r.data?.schedule||r.data; if(d?.days){setSchedule(d);setColorMap(buildColorMap(d.days));} } catch(e){ setError(e.response?.data?.message||'Could not load schedule.'); } finally { setLoading(false); }
  },[]);

  useEffect(()=>{ loadSchedule(); },[loadSchedule]);

  const updateTask = async(taskId, status)=>{
    setTaskLoading(p=>({...p,[taskId]:status}));
    try { await API.patch(`/schedule/task/${taskId}`,{status}); await loadSchedule(); } catch(e){ setError(e.response?.data?.message||'Failed to update task.'); } finally { setTaskLoading(p=>{const n={...p};delete n[taskId];return n;}); }
  };

  const generateSchedule = async()=>{
    setGenerating(true); setError('');
    try { const ids=schedule?[]:null; const r=await API.post('/schedule/generate-smart',{selectedCourseIds:ids}); const d=r.data?.schedule; if(d?.days){setSchedule(d);setColorMap(buildColorMap(d.days));} } catch(e){ setError(e.response?.data?.message||'Generation failed.'); } finally { setGenerating(false); }
  };

  const days    = schedule?.days||[];
  const allTasks = days.flatMap(d=>d.tasks?.map(t=>({...t,date: t.date || new Date(d.date).toISOString().split('T')[0]}))||[]);

  // Modal tasks for selected day
  const modalTasks = [];
  if (modalDay) {
    days.forEach(d => {
      d.tasks?.forEach(t => {
        const dStr = t.date || new Date(d.date).toISOString().split('T')[0];
        if (dStr === modalDay) modalTasks.push({ ...t, date: dStr });
      });
    });
  }

  const tabStyle = (active) => ({
    padding:'9px 20px', borderRadius:9, border:'none', background:active?'rgba(99,102,241,.2)':'transparent',
    color:active?'#a5b4fc':textSub, fontSize:14, fontWeight:600, cursor:'pointer', transition:'all .15s',
  });

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',system-ui,sans-serif", color:text, paddingBottom:80 }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontWeight:800, fontSize:22, color:text, letterSpacing:'-0.4px' }}>📅 My Schedule</div>
          <div style={{ fontSize:13, color:textSub, marginTop:2 }}>Personalized · Adaptive · Smart</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          {/* View toggle */}
          {tab==='schedule'&&(
            <div style={{ display:'flex', background:isDark?'rgba(255,255,255,.05)':'#f1f5f9', borderRadius:10, padding:3, gap:2 }}>
              {[['month','📅 Month'],['week','📆 Week']].map(([v,l])=>(
                <button key={v} onClick={()=>setView(v)} style={{ padding:'6px 14px', borderRadius:8, border:'none', background:view===v?(isDark?'#6366f1':'#fff'):'transparent', color:view===v?'#fff':textSub, fontSize:12, fontWeight:600, cursor:'pointer', boxShadow:view===v?(isDark?'none':'0 1px 4px rgba(0,0,0,.1)'):'none', transition:'all .15s' }}>{l}</button>
              ))}
            </div>
          )}
          <button onClick={generateSchedule} disabled={generating} className="sched-btn" style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:10, border:'none', background:generating?'rgba(99,102,241,.4)':'linear-gradient(135deg,#6366f1,#a855f7)', color:'#fff', fontSize:13, fontWeight:600, cursor:generating?'not-allowed':'pointer', transition:'opacity .15s, transform .15s', boxShadow:'0 4px 14px rgba(99,102,241,.35)' }}>
            {generating?<><div style={{width:14,height:14,borderRadius:'50%',border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',animation:'spin .7s linear infinite'}}/>Generating…</>:'🔄 Regenerate'}
          </button>
        </div>
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:2, marginBottom:24, background:isDark?'rgba(255,255,255,.04)':'#f8fafc', padding:4, borderRadius:12, border, width:'fit-content' }}>
        <button style={tabStyle(tab==='schedule')}    onClick={()=>setTab('schedule')}>📅 My Schedule</button>
        <button style={tabStyle(tab==='availability')} onClick={()=>setTab('availability')}>⚙️ Availability</button>
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {error&&<div style={{ padding:'12px 16px', borderRadius:10, background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', color:'#f87171', fontSize:13, marginBottom:16, display:'flex', justifyContent:'space-between' }}>{error}<button onClick={()=>setError('')} style={{background:'none',border:'none',color:'#f87171',cursor:'pointer'}}>✕</button></div>}

      {/* ════════ TAB: AVAILABILITY ════════ */}
      {tab==='availability'&&<AvailabilityTab isDark={isDark}/>}

      {/* ════════ TAB: SCHEDULE ════════ */}
      {tab==='schedule'&&(
        <div style={{ animation:'fadeUp .4s ease' }}>
          {/* Motivation panel */}
          <MotivationPanel isDark={isDark} tasks={allTasks}/>

          {/* Stats */}
          <StatsRow tasks={allTasks} isDark={isDark}/>

          {/* Loading */}
          {loading&&<div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'60px 0'}}><div style={{width:40,height:40,borderRadius:'50%',border:'3px solid rgba(99,102,241,.2)',borderTopColor:'#6366f1',animation:'spin .8s linear infinite'}}/><div style={{color:textSub,marginTop:14,fontSize:14}}>Loading your schedule…</div></div>}

          {/* Calendar */}
          {!loading&&schedule&&(
            <div style={{ background:cardBg, border, borderRadius:16, padding:'20px 22px', boxShadow:isDark?'0 4px 24px rgba(0,0,0,.2)':'0 2px 12px rgba(0,0,0,.06)', marginBottom:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div style={{ fontWeight:700, fontSize:15, color:text }}>
                  {view==='month'?'📅 Monthly Overview':'📆 This Week'}
                </div>
                <div style={{ display:'flex', gap:12, fontSize:11 }}>
                  {[['#10b981','Completed'],['#ef4444','Missed'],['#6366f1','Upcoming']].map(([c,l])=>(<div key={l} style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:8,height:8,borderRadius:'50%',background:c}}/><span style={{color:textSub}}>{l}</span></div>))}
                </div>
              </div>
              <CalendarGrid scheduleDays={days} colorMap={colorMap} onDayClick={setModalDay} view={view} isDark={isDark}/>
            </div>
          )}

          {/* Empty state */}
          {!loading&&!schedule&&(
            <div style={{ textAlign:'center', padding:'60px 20px', background:cardBg, borderRadius:20, border:`1px dashed ${isDark?'rgba(255,255,255,.1)':'#e2e8f0'}` }}>
              <div style={{ fontSize:64, marginBottom:16 }}>📋</div>
              <div style={{ fontSize:20, fontWeight:700, color:text, marginBottom:8 }}>No schedule yet</div>
              <div style={{ fontSize:14, color:textSub, marginBottom:24 }}>Set your availability first, then generate your personalised plan.</div>
              <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
                <button onClick={()=>setTab('availability')} style={{ padding:'11px 22px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#6366f1,#a855f7)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>⚙️ Set Availability</button>
                <button onClick={generateSchedule} style={{ padding:'11px 22px', borderRadius:10, border:'1px solid rgba(99,102,241,.3)', background:'rgba(99,102,241,.1)', color:'#a5b4fc', fontSize:14, fontWeight:700, cursor:'pointer' }}>🔄 Generate Now</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task modal */}
      {modalDay&&(
        <TaskModal dayKey={modalDay} tasks={modalTasks} colorMap={colorMap} onClose={()=>setModalDay(null)} onUpdateTask={updateTask} taskLoading={taskLoading} isDark={isDark}/>
      )}

      {/* Next task floating card */}
      {tab==='schedule'&&!loading&&schedule&&(
        <NextTaskBanner tasks={allTasks} onDayClick={setModalDay} isDark={isDark}/>
      )}
    </div>
  );
}
