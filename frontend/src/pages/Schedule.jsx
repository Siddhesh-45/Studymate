import { useState, useEffect, useCallback } from 'react';
import API from '../api';

// ─────────────────────────────────────────────────────────────────────────────
// Schedule.jsx — Dynamic Smart Study Scheduler
//
// TWO TABS:
//   Tab 1: ⚙️ My Availability  → weekly hours grid + preferences
//   Tab 2: 📅 My Schedule      → generated day-by-day plan + task marking
//
// API calls:
//   GET  /api/schedule/availability      → load saved availability
//   POST /api/schedule/availability      → save availability
//   POST /api/schedule/generate-smart    → regenerate schedule
//   GET  /api/schedule/smart             → load current schedule
//   PATCH /api/schedule/task/:id         → mark complete / missed
// ─────────────────────────────────────────────────────────────────────────────

// Day config
const DAYS = [
  { key: 0, label: 'Sunday',    short: 'Sun', weekend: true  },
  { key: 1, label: 'Monday',    short: 'Mon', weekend: false },
  { key: 2, label: 'Tuesday',   short: 'Tue', weekend: false },
  { key: 3, label: 'Wednesday', short: 'Wed', weekend: false },
  { key: 4, label: 'Thursday',  short: 'Thu', weekend: false },
  { key: 5, label: 'Friday',    short: 'Fri', weekend: false },
  { key: 6, label: 'Saturday',  short: 'Sat', weekend: true  },
];

const DEFAULT_HOURS = [2, 2, 2, 2, 2, 4, 4]; // Sun-Sat

// Course color palette
const COLORS = [
  { bg:'rgba(99,102,241,.18)',  border:'rgba(99,102,241,.4)',  text:'var(--sm-indigo-muted)' },
  { bg:'rgba(16,185,129,.15)',  border:'rgba(16,185,129,.35)', text:'var(--sm-emerald)' },
  { bg:'rgba(245,158,11,.15)',  border:'rgba(245,158,11,.35)', text:'var(--sm-yellow)' },
  { bg:'rgba(239,68,68,.15)',   border:'rgba(239,68,68,.35)',  text:'var(--sm-red)' },
  { bg:'rgba(14,165,233,.15)',  border:'rgba(14,165,233,.35)', text:'var(--sm-cyan)' },
  { bg:'rgba(168,85,247,.18)',  border:'rgba(168,85,247,.4)',  text:'#d8b4fe' },
  { bg:'rgba(236,72,153,.15)',  border:'rgba(236,72,153,.35)', text:'#f9a8d4' },
  { bg:'rgba(20,184,166,.15)',  border:'rgba(20,184,166,.35)', text:'#5eead4' },
];

// Date helpers
const isToday = (d) => {
  const date = new Date(d), now = new Date();
  return date.getDate()===now.getDate() && date.getMonth()===now.getMonth() && date.getFullYear()===now.getFullYear();
};
const isTomorrow = (d) => {
  const date=new Date(d), tom=new Date(); tom.setDate(tom.getDate()+1);
  return date.getDate()===tom.getDate() && date.getMonth()===tom.getMonth() && date.getFullYear()===tom.getFullYear();
};
const isOverdue = (d) => new Date(d) < new Date();
const fmtDay = (d) => new Date(d).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'});
const fmtDeadline = (d) => new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});

// Build courseId → color index map
const buildColorMap = (days=[]) => {
  const map={}; let i=0;
  days.forEach(day => day.tasks?.forEach(t => {
    const k=String(t.courseId); if(!(k in map)) map[k]=i++%COLORS.length;
  }));
  return map;
};

// ─────────────────────────────────────────────────────────────────────────────
export default function Schedule() {
  const [tab,          setTab         ] = useState('schedule'); // 'availability' | 'schedule'

  // Availability state
  const [weeklyHours,  setWeeklyHours ] = useState([...DEFAULT_HOURS]);
  const [sessionDur,   setSessionDur  ] = useState(1);
  const [priority,     setPriority    ] = useState('deadline');
  const [availSaving,  setAvailSaving ] = useState(false);
  const [availMsg,     setAvailMsg    ] = useState('');

  // Course Selection state
  const [myCourses, setMyCourses] = useState([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);

  // Schedule state
  const [schedule,     setSchedule    ] = useState(null);
  const [colorMap,     setColorMap    ] = useState({});
  const [schedLoading, setSchedLoading] = useState(false);
  const [generating,   setGenerating  ] = useState(false);
  const [schedError,   setSchedError  ] = useState('');

  // Task action state
  const [taskLoading,  setTaskLoading ] = useState({}); // { taskId: true }

  // ── Load availability + schedule on mount ─────────────────────────────────
  useEffect(() => {
    loadMyCourses();
    loadAvailability();
    loadSchedule();
  }, []);

  const loadMyCourses = async () => {
    try {
      const res = await API.get('/student-courses');
      const list = res.data?.courses || [];
      const extracted = list.map(c => c.courseId).filter(Boolean);
      setMyCourses(extracted);
      setSelectedCourseIds(extracted.map(c => c._id)); // default all enabled
    } catch (e) {
      console.error('Failed to load My Courses for scheduling', e);
    }
  };

  const loadAvailability = async () => {
    try {
      const res = await API.get('/schedule/availability');
      if (res.data?.weeklyHours) setWeeklyHours(res.data.weeklyHours);
      if (res.data?.sessionDuration) setSessionDur(res.data.sessionDuration);
      if (res.data?.priority) setPriority(res.data.priority);
    } catch { /* use defaults */ }
  };

  const loadSchedule = async () => {
    try {
      setSchedLoading(true); setSchedError('');
      const res = await API.get('/schedule/smart');
      const data = res.data?.schedule || res.data;
      if (data?.days) {
        setSchedule(data);
        setColorMap(buildColorMap(data.days));
      }
    } catch (err) {
      setSchedError(err.response?.data?.message || 'Could not load schedule.');
    } finally { setSchedLoading(false); }
  };

  // ── Save availability ──────────────────────────────────────────────────────
  const saveAvailability = async () => {
    setAvailSaving(true); setAvailMsg('');
    try {
      await API.post('/schedule/availability', {
        weeklyHours, sessionDuration: sessionDur, priority,
      });
      setAvailMsg('✅ Availability saved! Regenerating your schedule...');
      // Auto-regenerate after saving
      setTimeout(() => generateSchedule(), 800);
    } catch (err) {
      setAvailMsg('❌ ' + (err.response?.data?.message || 'Save failed.'));
    } finally { setAvailSaving(false); }
  };

  // ── Generate smart schedule ────────────────────────────────────────────────
  const generateSchedule = async () => {
    if (selectedCourseIds.length === 0) {
      setSchedError('Please select at least one course to schedule.');
      setTab('schedule');
      return;
    }
    
    try {
      setGenerating(true); setSchedError('');
      const res = await API.post('/schedule/generate-smart', { selectedCourseIds });
      const data = res.data?.schedule;
      if (data?.days) {
        setSchedule(data);
        setColorMap(buildColorMap(data.days));
      }
      setTab('schedule');
      setAvailMsg('');
    } catch (err) {
      setSchedError(err.response?.data?.message || 'Failed to generate schedule.');
    } finally { setGenerating(false); }
  };

  // ── Mark task complete or missed ───────────────────────────────────────────
  const updateTask = async (taskId, status) => {
    setTaskLoading((prev) => ({ ...prev, [taskId]: status }));
    try {
      await API.patch(`/schedule/task/${taskId}`, { status });
      // Reload schedule to see rescheduled tasks
      await loadSchedule();
    } catch (err) {
      setSchedError(err.response?.data?.message || 'Failed to update task.');
    } finally {
      setTaskLoading((prev) => { const n={...prev}; delete n[taskId]; return n; });
    }
  };

  // ── Summary stats ──────────────────────────────────────────────────────────
  const days         = schedule?.days || [];
  const activeDays   = days.filter(d => d.tasks?.some(t => t.status==='pending'));
  const totalPending = days.reduce((s,d) => s+d.tasks?.filter(t=>t.status==='pending').length, 0);
  const totalDone    = days.reduce((s,d) => s+d.tasks?.filter(t=>t.status==='completed').length, 0);
  const totalMissed  = days.reduce((s,d) => s+d.tasks?.filter(t=>t.status==='missed').length, 0);
  const totalHrs     = days.reduce((s,d) => s+d.tasks?.filter(t=>t.status==='pending').reduce((h,t)=>h+(t.allocatedHours||0),0), 0);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>📅 Smart Study Scheduler</h1>
          <p style={S.pageSubtitle}>Personalized · Adaptive · Dynamic</p>
        </div>
        <button
          style={generating ? S.btnDisabled : S.btnGenerate}
          onClick={generateSchedule}
          disabled={generating}
        >
          {generating ? '⏳ Generating...' : '🔄 Regenerate Schedule'}
        </button>
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <div style={S.tabBar}>
        <button
          style={{ ...S.tab, ...(tab==='schedule'    ? S.tabActive : {}) }}
          onClick={() => setTab('schedule')}
        >
          📅 My Schedule
        </button>
        <button
          style={{ ...S.tab, ...(tab==='availability' ? S.tabActive : {}) }}
          onClick={() => setTab('availability')}
        >
          ⚙️ My Availability
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TAB: AVAILABILITY SETUP
      ════════════════════════════════════════════════════════════════════ */}
      {tab === 'availability' && (
        <div style={S.section}>

          <p style={S.sectionDesc}>
            Set how many hours you can study each day. The scheduler will
            automatically fit your topics into these time windows.
          </p>

          {/* ── Weekly hours grid ─────────────────────────────────────────── */}
          <div style={S.availCard}>
            <h3 style={S.cardHeading}>📆 Daily Study Hours</h3>
            <p style={S.cardSubheading}>
              Set 0 for days you cannot study (college / holidays)
            </p>

            <div style={S.daysGrid}>
              {DAYS.map((day) => (
                <div key={day.key} style={{
                  ...S.daySlot,
                  ...(weeklyHours[day.key]===0 ? S.daySlotOff : {}),
                  ...(day.weekend ? S.daySlotWeekend : {}),
                }}>
                  <span style={S.dayShort}>{day.short}</span>
                  <span style={{
                    ...S.dayFull,
                    color: day.weekend ? 'var(--sm-yellow)' : 'var(--sm-text-sub, #94a3b8)',
                  }}>
                    {day.label}
                  </span>

                  {/* Hours stepper */}
                  <div style={S.stepper}>
                    <button style={S.stepBtn}
                      onClick={() => {
                        const h = [...weeklyHours];
                        h[day.key] = Math.max(0, h[day.key] - 0.5);
                        setWeeklyHours(h);
                      }}>−</button>

                    <span style={{
                      ...S.stepVal,
                      color: weeklyHours[day.key]===0 ? 'var(--sm-text-muted, #475569)'
                           : weeklyHours[day.key]>=3  ? '#86efac' : 'var(--sm-text, #f1f5f9)',
                    }}>
                      {weeklyHours[day.key]===0 ? 'OFF' : `${weeklyHours[day.key]}h`}
                    </span>

                    <button style={S.stepBtn}
                      onClick={() => {
                        const h = [...weeklyHours];
                        h[day.key] = Math.min(12, h[day.key] + 0.5);
                        setWeeklyHours(h);
                      }}>+</button>
                  </div>

                  {/* Visual bar */}
                  <div style={S.dayBarTrack}>
                    <div style={{
                      ...S.dayBarFill,
                      width: `${(weeklyHours[day.key]/12)*100}%`,
                      background: day.weekend
                        ? 'linear-gradient(90deg,#f59e0b,#d97706)'
                        : 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Total weekly hours */}
            <div style={S.weekTotal}>
              <span style={{ color:'var(--sm-text-sub)' }}>Total weekly study time:</span>
              <span style={{ color:'var(--sm-indigo-muted)', fontWeight:700, fontSize:16 }}>
                {weeklyHours.reduce((s,h)=>s+h,0).toFixed(1)}h / week
              </span>
            </div>
          </div>

          {/* ── Courses Selection Dropdown ───────────────────────────────────────────────── */}
          <div style={S.availCard}>
            <h3 style={S.cardHeading}>📚 Courses to Schedule</h3>
            <p style={S.cardSubheading}>Select which of your active courses to include.</p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {myCourses.map(course => {
                const isSelected = selectedCourseIds.includes(course._id);
                return (
                  <label key={course._id} style={{
                    ...S.prefChip,
                    ...(isSelected ? S.prefChipActive : {}),
                    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                  }}>
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => {
                        setSelectedCourseIds(prev => 
                          isSelected 
                            ? prev.filter(id => id !== course._id)
                            : [...prev, course._id]
                        );
                      }}
                      style={{ cursor: 'pointer', accentColor: '#6366f1' }}
                    />
                    {course.courseName}
                  </label>
                );
              })}
              {myCourses.length === 0 && (
                <span style={{ color: 'var(--sm-text-sub)', fontSize: '13px' }}>No active courses found. Go to 'My Courses' first.</span>
              )}
            </div>
          </div>

          {/* ── Preferences ───────────────────────────────────────────────── */}
          <div style={S.availCard}>
            <h3 style={S.cardHeading}>🎯 Study Preferences</h3>

            <div style={S.prefRow}>
              <div style={S.prefGroup}>
                <label style={S.prefLabel}>Session Duration</label>
                <p style={S.prefHint}>How long is one study block?</p>
                <div style={S.prefOptions}>
                  {[0.5, 1, 1.5, 2].map((v) => (
                    <button key={v}
                      style={{ ...S.prefChip, ...(sessionDur===v ? S.prefChipActive : {}) }}
                      onClick={() => setSessionDur(v)}>
                      {v===0.5?'30 min':v===1?'1 hour':v===1.5?'1.5 hrs':'2 hours'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={S.prefGroup}>
                <label style={S.prefLabel}>Scheduling Priority</label>
                <p style={S.prefHint}>How should topics be ordered?</p>
                <div style={S.prefOptions}>
                  <button
                    style={{ ...S.prefChip, ...(priority==='deadline' ? S.prefChipActive : {}) }}
                    onClick={() => setPriority('deadline')}>
                    ⚡ By Deadline
                  </button>
                  <button
                    style={{ ...S.prefChip, ...(priority==='balanced' ? S.prefChipActive : {}) }}
                    onClick={() => setPriority('balanced')}>
                    ⚖️ Balanced
                  </button>
                  <button
                    style={{ ...S.prefChip, ...(priority==='difficulty' ? S.prefChipActive : S.prefChipDifficulty) }}
                    onClick={() => setPriority('difficulty')}>
                    🧠 Easy → Hard
                  </button>
                </div>
              </div>
            </div>

            {/* Priority explanation */}
            <div style={S.priorityExplain}>
              {priority==='deadline'
                ? '⚡ By Deadline: Most urgent topics appear first. Best for exam prep.'
                : priority==='difficulty'
                ? '🧠 Easy → Hard: Topics build on each other. Arrays before Trees, Loops before DP. Best for beginners.'
                : '⚖️ Balanced: Topics from different subjects are interleaved. Avoids burnout.'}
            </div>
          </div>

          {/* ── Save button ───────────────────────────────────────────────── */}
          {availMsg && (
            <div style={{
              ...S.availMsg,
              color: availMsg.startsWith('✅') ? '#86efac' : 'var(--sm-red)',
              borderColor: availMsg.startsWith('✅') ? 'rgba(34,197,94,.25)' : 'rgba(239,68,68,.25)',
            }}>
              {availMsg}
            </div>
          )}

          <div style={{ display:'flex', gap:12, marginTop:8 }}>
            <button
              style={availSaving ? S.btnDisabled : S.btnSaveAvail}
              onClick={saveAvailability}
              disabled={availSaving}
            >
              {availSaving ? '💾 Saving...' : '💾 Save & Generate Schedule'}
            </button>
          </div>

        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: SCHEDULE VIEW
      ════════════════════════════════════════════════════════════════════ */}
      {tab === 'schedule' && (
        <div>
          {/* Error */}
          {schedError && (
            <div style={S.errorBanner}>
              ⚠️ {schedError}
              <button style={S.bannerClose} onClick={()=>setSchedError('')}>✕</button>
            </div>
          )}

          {/* Loading */}
          {schedLoading && (
            <div style={S.center}>
              <div style={S.spinner} />
              <p style={{color:'var(--sm-text-sub, #94a3b8)',marginTop:14,fontSize:14}}>Loading your schedule...</p>
            </div>
          )}

          {/* Schedule content */}
          {!schedLoading && schedule && (
            <>
              {/* ── Stats bar ──────────────────────────────────────────────── */}
              <div style={S.statsRow}>
                <StatCard icon="📆" value={activeDays.length}         label="Days Left"  />
                <StatCard icon="⏱"  value={`${totalHrs.toFixed(1)}h`} label="Hours Left" />
                <StatCard icon="⏳" value={totalPending}              label="Pending"    />
                <StatCard icon="✅" value={totalDone}                 label="Completed"  color="#86efac" />
                {totalMissed>0 && (
                  <StatCard icon="❌" value={totalMissed} label="Missed" color="var(--sm-red-muted)" danger />
                )}
              </div>

              {/* ── Generated timestamp ────────────────────────────────────── */}
              {schedule.generatedAt && (
                <p style={S.genTime}>
                  🕒 Generated: {new Date(schedule.generatedAt).toLocaleString('en-IN')}
                  {' · '}
                  <button style={S.inlineBtn} onClick={generateSchedule}>Regenerate</button>
                </p>
              )}

              {/* ── Empty state ─────────────────────────────────────────────── */}
              {days.length===0 || totalPending===0 ? (
                <div style={S.emptyState}>
                  <div style={{fontSize:56,marginBottom:16}}>🎉</div>
                  <h2 style={{color:'var(--sm-text, #f1f5f9)',marginBottom:8,fontSize:22}}>All caught up!</h2>
                  <p style={{color:'var(--sm-text-sub)',fontSize:15,marginBottom:24,maxWidth:400}}>
                    No pending topics. Either you've completed everything or no
                    courses have topics yet.
                  </p>
                  <div style={S.emptyHints}>
                    <p style={S.emptyHint}>👉 Mark topics as pending in the Courses page</p>
                    <p style={S.emptyHint}>👉 Adjust your availability then click Regenerate</p>
                  </div>
                </div>
              ) : (
                /* ── Day cards ─────────────────────────────────────────────── */
                <div style={S.dayList}>
                  {days.map((day, di) => {
                    const today    = isToday(day.date);
                    const tomorrow = isTomorrow(day.date);
                    const pending  = day.tasks?.filter(t=>t.status==='pending') || [];
                    const done     = day.tasks?.filter(t=>t.status==='completed') || [];
                    const missed   = day.tasks?.filter(t=>t.status==='missed') || [];

                    // Skip days with no pending tasks
                    if (pending.length===0 && done.length===0 && missed.length===0) return null;

                    return (
                      <div key={di} style={{
                        ...S.dayCard,
                        ...(today ? S.dayCardToday : {}),
                      }}>
                        {/* Day header */}
                        <div style={S.dayHeader}>
                          <div style={S.dayHeaderLeft}>
                            <span style={{
                              ...S.dayBadge,
                              ...(today    ? S.dayBadgeToday    :
                                  tomorrow ? S.dayBadgeTomorrow  : S.dayBadgeNormal),
                            }}>
                              {today?'📌 Today':tomorrow?'⏩ Tomorrow':`Day ${di+1}`}
                            </span>
                            <span style={S.dayDate}>{fmtDay(day.date)}</span>
                          </div>

                          {/* Hours progress */}
                          <div style={S.dayHoursWrap}>
                            <span style={S.dayHoursLabel}>
                              {day.totalHours}h / {day.availableHours}h available
                            </span>
                            <div style={S.hoursTrack}>
                              <div style={{
                                ...S.hoursFill,
                                width:`${Math.min((day.totalHours/Math.max(day.availableHours,1))*100,100)}%`,
                                background: today
                                  ? 'linear-gradient(90deg,#6366f1,#8b5cf6)'
                                  : 'linear-gradient(90deg,#1d9e75,#0f6e56)',
                              }} />
                            </div>
                          </div>
                        </div>

                        {/* ── Task 4: Day difficulty summary ──────────────── */}
                        {(() => {
                          const diffs = (day.tasks || [])
                            .filter(t => t.status === 'pending' && t.difficulty)
                            .map(t => t.difficulty);
                          const counts = { Easy: 0, Medium: 0, Hard: 0 };
                          diffs.forEach(d => { if (counts[d] !== undefined) counts[d]++; });
                          const hasAny = counts.Easy + counts.Medium + counts.Hard > 0;
                          if (!hasAny) return null;
                          return (
                            <div style={S.dayDiffRow}>
                              {counts.Easy   > 0 && <span style={{...S.dayDiffChip,...S.diffEasy  }}>🟢 {counts.Easy} Easy</span>}
                              {counts.Medium > 0 && <span style={{...S.dayDiffChip,...S.diffMedium}}>🟡 {counts.Medium} Medium</span>}
                              {counts.Hard   > 0 && <span style={{...S.dayDiffChip,...S.diffHard  }}>🔴 {counts.Hard} Hard</span>}
                            </div>
                          );
                        })()}

                        {/* Task list */}
                        <div style={S.taskList}>
                          {day.tasks?.map((task, ti) => {
                            const colorIdx = colorMap[String(task.courseId)] ?? 0;
                            const color    = COLORS[colorIdx];
                            const isSplit  = task.allocatedHours < task.originalHours;
                            const deadPast = isOverdue(task.deadline);
                            const tLoading = taskLoading[String(task._id)];
                            const isRescheduled = !!task.rescheduledFrom;

                            return (
                              <div key={ti} style={{
                                ...S.taskCard,
                                background: task.status==='completed'
                                  ? 'rgba(34,197,94,.07)'
                                  : task.status==='missed'
                                  ? 'rgba(239,68,68,.07)'
                                  : color.bg,
                                border: `1px solid ${
                                  task.status==='completed' ? 'rgba(34,197,94,.25)'
                                  : task.status==='missed'  ? 'rgba(239,68,68,.2)'
                                  : color.border
                                }`,
                                opacity: task.status!=='pending' ? 0.75 : 1,
                              }}>
                                {/* Left accent */}
                                <div style={{
                                  ...S.taskAccent,
                                  background: task.status==='completed'?'#22c55e'
                                             : task.status==='missed'   ?'#ef4444'
                                             : color.border,
                                }} />

                                {/* Task body */}
                                <div style={S.taskBody}>

                                  {/* Rescheduled badge */}
                                  {isRescheduled && (
                                    <span style={S.rescheduleBadge}>
                                      🔄 Rescheduled from {fmtDeadline(task.rescheduledFrom)}
                                    </span>
                                  )}

                                  {/* Course name */}
                                  <span style={{ ...S.courseName, color: color.text }}>
                                    📚 {task.courseName}
                                  </span>

                                  {/* Topic title */}
                                  <p style={{
                                    ...S.topicTitle,
                                    textDecoration: task.status==='completed'?'line-through':'none',
                                    color: task.status==='completed'?'var(--sm-text-muted, #475569)':'var(--sm-text, #f1f5f9)',
                                  }}>
                                    {task.title}
                                  </p>

                                  {/* Meta */}
                                  <div style={S.taskMeta}>
                                    <span style={S.metaChip}>
                                      ⏱ {task.allocatedHours}h
                                      {isSplit && (
                                        <span style={S.splitBadge}>
                                          split • {task.originalHours}h total
                                        </span>
                                      )}
                                    </span>
                                    <span style={{
                                      ...S.metaChip,
                                      color: deadPast?'var(--sm-red-muted)':'var(--sm-text-sub, #94a3b8)',
                                    }}>
                                      📅 {fmtDeadline(task.deadline)}
                                      {deadPast && task.status==='pending' && ' ⚠️'}
                                    </span>
                                    {/* ── Task 4: Difficulty badge ── */}
                                    {task.difficulty && (
                                      <span style={{
                                        ...S.diffBadge,
                                        ...(task.difficulty === 'Easy'   ? S.diffEasy   :
                                            task.difficulty === 'Hard'   ? S.diffHard   :
                                                                           S.diffMedium),
                                      }}>
                                        {task.difficulty === 'Easy'   ? '🟢' :
                                         task.difficulty === 'Hard'   ? '🔴' : '🟡'}{' '}
                                        {task.difficulty}
                                      </span>
                                    )}
                                    {task.youtubeUrl && (
                                      <a href={task.youtubeUrl} target="_blank" rel="noreferrer"
                                        style={S.watchLink}>▶ Watch</a>
                                    )}
                                  </div>
                                </div>

                                {/* Action buttons — only for pending tasks */}
                                {task.status==='pending' && (
                                  <div style={S.taskActions}>
                                    <button
                                      style={{
                                        ...S.btnDone,
                                        opacity: tLoading ? 0.6 : 1,
                                        cursor:  tLoading ? 'not-allowed' : 'pointer',
                                      }}
                                      disabled={!!tLoading}
                                      onClick={() => updateTask(String(task._id), 'completed')}
                                      title="Mark as completed"
                                    >
                                      {tLoading==='completed' ? '...' : '✅ Done'}
                                    </button>
                                    <button
                                      style={{
                                        ...S.btnMissed,
                                        opacity: tLoading ? 0.6 : 1,
                                        cursor:  tLoading ? 'not-allowed' : 'pointer',
                                      }}
                                      disabled={!!tLoading}
                                      onClick={() => updateTask(String(task._id), 'missed')}
                                      title="Couldn't do it — reschedule"
                                    >
                                      {tLoading==='missed' ? '...' : '❌ Missed'}
                                    </button>
                                  </div>
                                )}

                                {/* Status badge for done/missed */}
                                {task.status!=='pending' && (
                                  <div style={{
                                    ...S.statusBadge,
                                    background: task.status==='completed'
                                      ? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.15)',
                                    color: task.status==='completed'?'#86efac':'var(--sm-red)',
                                  }}>
                                    {task.status==='completed'?'✅ Done':'❌ Missed'}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* No schedule yet */}
          {!schedLoading && !schedule && !schedError && (
            <div style={S.emptyState}>
              <div style={{fontSize:52,marginBottom:16}}>📋</div>
              <h2 style={{color:'var(--sm-text, #f1f5f9)',marginBottom:8,fontSize:20}}>
                No schedule yet
              </h2>
              <p style={{color:'var(--sm-text-sub)',fontSize:14,marginBottom:24}}>
                Set your availability first, then generate your personalised schedule.
              </p>
              <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
                <button style={S.btnSaveAvail} onClick={()=>setTab('availability')}>
                  ⚙️ Set Availability
                </button>
                <button style={S.btnGenerate} onClick={generateSchedule}>
                  🔄 Generate Now
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── StatCard sub-component ────────────────────────────────────────────────────
function StatCard({ icon, value, label, color, danger }) {
  return (
    <div style={{ ...S.statCard, ...(danger?S.statCardDanger:{}) }}>
      <span style={S.statIcon}>{icon}</span>
      <span style={{ ...S.statValue, ...(color?{color}:{}) }}>{value}</span>
      <span style={S.statLabel}>{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const A='#6366f1', A2='#8b5cf6';
const S = {
  page:        { fontFamily:"'Segoe UI',system-ui,sans-serif", color:'var(--sm-text, #e2e8f0)', paddingBottom:40 },
  pageHeader:  { display:'flex', alignItems:'flex-start', justifyContent:'space-between',
                 marginBottom:20, flexWrap:'wrap', gap:12 },
  pageTitle:   { fontSize:26, fontWeight:700, color:'var(--sm-text, #f1f5f9)', margin:'0 0 4px' },
  pageSubtitle:{ fontSize:14, color:'var(--sm-text-sub)', margin:0 },

  // Tabs
  tabBar: { display:'flex', gap:4, marginBottom:24,
            background:'var(--sm-surface-4)', padding:4, borderRadius:12,
            border:'1px solid var(--sm-surface-7)', width:'fit-content' },
  tab: { padding:'9px 20px', borderRadius:9, border:'none', background:'transparent',
         color:'var(--sm-surface-50)', fontSize:14, fontWeight:500, cursor:'pointer' },
  tabActive: { background:`rgba(99,102,241,.25)`, color:'var(--sm-indigo-muted)' },

  // Section
  section:     { display:'flex', flexDirection:'column', gap:16 },
  sectionDesc: { color:'var(--sm-text-sub)', fontSize:14, margin:'0 0 4px' },

  // Availability card
  availCard:   { background:'var(--sm-surface-4)', border:'1px solid var(--sm-surface-8)',
                 borderRadius:16, padding:22 },
  cardHeading: { color:'var(--sm-text, #f1f5f9)', fontSize:16, fontWeight:700, margin:'0 0 4px' },
  cardSubheading:{ color:'var(--sm-text-sub)', fontSize:13, margin:'0 0 18px' },

  // Days grid
  daysGrid:    { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:10 },
  daySlot:     { background:'var(--sm-surface-4)', borderRadius:12, padding:12,
                 border:'1px solid var(--sm-surface-8)',
                 display:'flex', flexDirection:'column', alignItems:'center', gap:4 },
  daySlotOff:  { background:'var(--sm-surface-2)', borderColor:'var(--sm-surface-4)', opacity:.6 },
  daySlotWeekend:{ borderColor:'rgba(245,158,11,.2)' },
  dayShort:    { fontSize:18, fontWeight:700, color:'var(--sm-text, #f1f5f9)' },
  dayFull:     { fontSize:11, fontWeight:500 },

  // Stepper
  stepper:     { display:'flex', alignItems:'center', gap:6, margin:'4px 0' },
  stepBtn:     { width:26, height:26, borderRadius:6, border:'1px solid var(--sm-surface-15)',
                 background:'var(--sm-surface-7)', color:'var(--sm-text, #e2e8f0)',
                 fontSize:16, fontWeight:700, cursor:'pointer', lineHeight:'24px' },
  stepVal:     { fontSize:15, fontWeight:700, minWidth:36, textAlign:'center' },

  // Day bar
  dayBarTrack: { width:'100%', height:4, background:'var(--sm-surface-7)', borderRadius:2 },
  dayBarFill:  { height:'100%', borderRadius:2, transition:'width .3s ease' },
  weekTotal:   { display:'flex', justifyContent:'space-between', alignItems:'center',
                 marginTop:16, paddingTop:14, borderTop:'1px solid var(--sm-surface-7)',
                 color:'var(--sm-text-sub)', fontSize:14 },

  // Preferences
  prefRow:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 },
  prefGroup:   { display:'flex', flexDirection:'column', gap:6 },
  prefLabel:   { color:'var(--sm-text, #e2e8f0)', fontSize:14, fontWeight:600 },
  prefHint:    { color:'var(--sm-text-sub)', fontSize:12, margin:0 },
  prefOptions: { display:'flex', flexWrap:'wrap', gap:8, marginTop:4 },
  prefChip:    { padding:'7px 14px', borderRadius:9, border:'1px solid var(--sm-surface-12)',
                 background:'var(--sm-surface-5)', color:'var(--sm-text-sub, #94a3b8)',
                 fontSize:13, cursor:'pointer' },
  prefChipActive:{ background:`rgba(99,102,241,.25)`, borderColor:`rgba(99,102,241,.4)`,
                   color:'var(--sm-indigo-muted)' },

  priorityExplain:{ background:'rgba(99,102,241,.08)', border:'1px solid rgba(99,102,241,.2)',
                    borderRadius:8, padding:'10px 14px', color:'var(--sm-indigo-muted)',
                    fontSize:13, marginTop:14 },

  availMsg:    { background:'rgba(34,197,94,.08)', border:'1px solid',
                 borderRadius:9, padding:'10px 14px', fontSize:13 },

  // Buttons
  btnSaveAvail:{ background:`linear-gradient(135deg,${A},${A2})`, border:'none',
                 borderRadius:10, padding:'11px 24px', color:'#fff',
                 fontSize:14, fontWeight:600, cursor:'pointer' },
  btnGenerate: { background:'rgba(99,102,241,.2)', border:'1px solid rgba(99,102,241,.35)',
                 borderRadius:10, padding:'10px 20px', color:'var(--sm-indigo-muted)',
                 fontSize:14, fontWeight:600, cursor:'pointer' },
  btnDisabled: { background:'var(--sm-surface-7)', border:'none',
                 borderRadius:10, padding:'10px 20px', color:'var(--sm-surface-30)',
                 fontSize:14, cursor:'not-allowed' },

  // Error / loading
  errorBanner: { background:'rgba(239,68,68,.12)', border:'1px solid rgba(239,68,68,.3)',
                 borderRadius:10, padding:'12px 16px', color:'var(--sm-red)', fontSize:14,
                 marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' },
  bannerClose: { background:'none', border:'none', color:'var(--sm-red)', cursor:'pointer', fontSize:16 },
  center:      { display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 0' },
  spinner:     { width:40, height:40, border:'3px solid rgba(99,102,241,.2)',
                 borderTop:`3px solid ${A}`, borderRadius:'50%', animation:'spin .8s linear infinite' },

  // Stats
  statsRow:    { display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' },
  statCard:    { background:'var(--sm-surface-4)', border:'1px solid var(--sm-surface-8)',
                 borderRadius:12, padding:'12px 18px',
                 display:'flex', flexDirection:'column', alignItems:'center', minWidth:80, gap:2 },
  statCardDanger:{ background:'rgba(239,68,68,.07)', borderColor:'rgba(239,68,68,.2)' },
  statIcon:    { fontSize:18, marginBottom:2 },
  statValue:   { fontSize:20, fontWeight:700, color:'var(--sm-text, #f1f5f9)' },
  statLabel:   { fontSize:11, color:'var(--sm-text-sub)', textTransform:'uppercase', letterSpacing:'.06em' },

  genTime:     { color:'var(--sm-text-muted, #475569)', fontSize:12, margin:'0 0 16px' },
  inlineBtn:   { background:'none', border:'none', color:'var(--sm-indigo)', fontSize:12,
                 cursor:'pointer', textDecoration:'underline', padding:0 },

  // Empty state
  emptyState:  { textAlign:'center', padding:'60px 20px', background:'var(--sm-surface-2)',
                 borderRadius:20, border:'1px dashed var(--sm-surface-10)' },
  emptyHints:  { display:'flex', flexDirection:'column', gap:8, alignItems:'center' },
  emptyHint:   { color:'var(--sm-text-muted, #475569)', fontSize:13, margin:0 },

  // Day cards
  dayList:     { display:'flex', flexDirection:'column', gap:16 },
  dayCard:     { background:'var(--sm-surface-3)', border:'1px solid var(--sm-surface-7)',
                 borderRadius:16, padding:20 },
  dayCardToday:{ background:'rgba(99,102,241,.07)', border:'1px solid rgba(99,102,241,.3)',
                 boxShadow:'0 0 0 1px rgba(99,102,241,.12)' },
  dayHeader:   { display:'flex', alignItems:'center', justifyContent:'space-between',
                 marginBottom:14, flexWrap:'wrap', gap:10 },
  dayHeaderLeft:{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' },
  dayBadge:    { fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20,
                 textTransform:'uppercase', letterSpacing:'.06em' },
  dayBadgeToday:   { background:'rgba(99,102,241,.3)',  color:'#c7d2fe' },
  dayBadgeTomorrow:{ background:'rgba(245,158,11,.2)',  color:'var(--sm-yellow)' },
  dayBadgeNormal:  { background:'var(--sm-surface-7)',color:'var(--sm-text-sub, #94a3b8)' },
  dayDate:     { color:'var(--sm-text, #cbd5e1)', fontSize:15, fontWeight:600 },
  dayHoursWrap:{ display:'flex', alignItems:'center', gap:8 },
  dayHoursLabel:{ color:'var(--sm-text-sub)', fontSize:12, whiteSpace:'nowrap' },
  hoursTrack:  { width:90, height:5, background:'var(--sm-surface-7)',
                 borderRadius:3, overflow:'hidden' },
  hoursFill:   { height:'100%', borderRadius:3, transition:'width .4s ease' },

  // Task cards
  taskList:    { display:'flex', flexDirection:'column', gap:10 },
  taskCard:    { borderRadius:12, padding:'12px 14px',
                 display:'flex', alignItems:'center', gap:12, overflow:'hidden' },
  taskAccent:  { width:3, borderRadius:2, flexShrink:0, alignSelf:'stretch', minHeight:40 },
  taskBody:    { flex:1, minWidth:0 },
  rescheduleBadge:{ background:'rgba(245,158,11,.15)', border:'1px solid rgba(245,158,11,.25)',
                    borderRadius:8, padding:'1px 8px', color:'var(--sm-yellow)',
                    fontSize:11, fontWeight:600, display:'inline-block', marginBottom:4 },
  courseName:  { fontSize:11, fontWeight:700, textTransform:'uppercase',
                 letterSpacing:'.07em', display:'block', marginBottom:4 },
  topicTitle:  { fontSize:15, fontWeight:600, margin:'0 0 6px', lineHeight:1.4 },
  taskMeta:    { display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' },
  metaChip:    { fontSize:12, color:'var(--sm-text-sub, #94a3b8)', display:'flex', alignItems:'center', gap:4 },
  splitBadge:  { background:'rgba(245,158,11,.2)', border:'1px solid rgba(245,158,11,.3)',
                 borderRadius:10, padding:'1px 6px', color:'var(--sm-yellow)',
                 fontSize:11, fontWeight:600, marginLeft:4 },
  watchLink:   { color:'var(--sm-indigo)', textDecoration:'none', fontSize:12, fontWeight:600,
                 padding:'2px 8px', background:'rgba(99,102,241,.15)', borderRadius:8 },

  // ── Task 4: Difficulty badge styles ────────────────────────────────────────
  diffBadge:   { fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:10,
                 border:'1px solid', display:'inline-flex', alignItems:'center', gap:3 },
  diffEasy:    { background:'rgba(34,197,94,.12)',  borderColor:'rgba(34,197,94,.3)',  color:'#86efac' },
  diffMedium:  { background:'rgba(245,158,11,.12)', borderColor:'rgba(245,158,11,.3)', color:'var(--sm-yellow)' },
  diffHard:    { background:'rgba(239,68,68,.12)',  borderColor:'rgba(239,68,68,.3)',  color:'var(--sm-red)' },

  // Day difficulty summary row (shown below day header)
  dayDiffRow:  { display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 },
  dayDiffChip: { fontSize:11, fontWeight:600, padding:'2px 10px', borderRadius:20, border:'1px solid' },

  // Extra chip style for the new Easy→Hard priority option
  prefChipDifficulty: { borderColor:'rgba(168,85,247,.3)', color:'#c4b5fd' },

  // Task action buttons
  taskActions: { display:'flex', flexDirection:'column', gap:6, flexShrink:0 },
  btnDone:     { background:'rgba(34,197,94,.15)', border:'1px solid rgba(34,197,94,.3)',
                 borderRadius:8, padding:'5px 10px', color:'#86efac',
                 fontSize:12, fontWeight:600, whiteSpace:'nowrap' },
  btnMissed:   { background:'rgba(239,68,68,.12)', border:'1px solid rgba(239,68,68,.25)',
                 borderRadius:8, padding:'5px 10px', color:'var(--sm-red)',
                 fontSize:12, fontWeight:600, whiteSpace:'nowrap' },
  statusBadge: { borderRadius:10, padding:'5px 12px', fontSize:12, fontWeight:700,
                 flexShrink:0, whiteSpace:'nowrap' },
};

const _s=document.createElement('style');
_s.textContent='@keyframes spin{to{transform:rotate(360deg)}}';
if(!document.querySelector('[data-ss]')){_s.setAttribute('data-ss','1');document.head.appendChild(_s);}
