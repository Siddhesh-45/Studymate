import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';

// ─────────────────────────────────────────────────────────────────────────────
// Premium Quiz Page — 15 MCQs, 30s timer, navigation panel, animations
// Route: /quiz/:courseId/:lessonId
// ─────────────────────────────────────────────────────────────────────────────

export default function Quiz() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [phase, setPhase] = useState('loading'); // loading | quiz | result | marking | done
  const [error, setError] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [markError, setMarkError] = useState('');
  const [timer, setTimer] = useState(30);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const timerRef = useRef(null);

  // ── Timer Logic ────────────────────────────────────────────────────────────
  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = useCallback(() => {
    clearTimer();
    setTimer(30);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Auto-move to next when timer expires
  useEffect(() => {
    if (timer === 0 && phase === 'quiz') {
      handleAutoNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer, phase]);

  // Start timer when question changes
  useEffect(() => {
    if (phase === 'quiz' && questions.length > 0) {
      startTimer();
    }
    return () => clearTimer();
  }, [current, phase, questions.length, startTimer]);

  // ── Auto-next when timer expires ───────────────────────────────────────────
  const handleAutoNext = () => {
    const q = questions[current];
    const chosenAnswer = selected || null;
    const isRight = chosenAnswer ? chosenAnswer === q.correctAnswer : false;

    const newAnswers = [
      ...answers,
      {
        question: q.question,
        chosen: chosenAnswer || '(Time expired)',
        correct: q.correctAnswer,
        isRight,
      },
    ];
    setAnswers(newAnswers);

    if (current + 1 < questions.length) {
      setDirection(1);
      setCurrent(c => c + 1);
      setSelected(null);
    } else {
      clearTimer();
      setPhase('result');
    }
  };

  // ── Fetch Quiz ─────────────────────────────────────────────────────────────
  const fetchQuiz = useCallback(async () => {
    setPhase('loading');
    setError('');
    setAnswers([]);
    setCurrent(0);
    setSelected(null);
    clearTimer();

    try {
      const res = await API.get(`/quiz/generate/${courseId}/${lessonId}`);
      const quizData = Array.isArray(res.data) ? res.data : res.data.questions;

      if (!quizData || quizData.length === 0) {
        throw new Error('No quiz generated');
      }

      setQuestions(quizData);
      setLessonTitle(res.data.lessonTitle || 'Lesson');
      setPhase('quiz');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to load quiz');
      setPhase('error');
    }
  }, [courseId, lessonId]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  // ── Confirm Answer ─────────────────────────────────────────────────────────
  const confirmAnswer = () => {
    if (selected === null) return;
    clearTimer();

    const q = questions[current];
    const isRight = selected === q.correctAnswer;

    const newAnswers = [
      ...answers,
      {
        question: q.question,
        chosen: selected,
        correct: q.correctAnswer,
        isRight,
      },
    ];
    setAnswers(newAnswers);

    if (current + 1 < questions.length) {
      setDirection(1);
      setCurrent(c => c + 1);
      setSelected(null);
    } else {
      setPhase('result');
    }
  };

  // ── Mark Complete ──────────────────────────────────────────────────────────
  const markComplete = async () => {
    setPhase('marking');
    setMarkError('');
    try {
      const sc = await API.get('/student-courses');
      const entry = (sc.data.courses || []).find(
        (c) => String(c.courseId?._id || c.courseId) === String(courseId)
      );
      if (!entry) throw new Error('Course not found');

      await API.patch(`/student-courses/${entry._id}/complete-lesson`, {
        videoId: lessonId,
      });
      setPhase('done');
    } catch (err) {
      console.error(err);
      setMarkError(err.response?.data?.message || err.message);
      setPhase('result');
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const total = questions.length;
  const q = questions?.[current];
  const score = answers.filter(a => a.isRight).length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = pct >= 60;
  const timerPct = (timer / 30) * 100;

  // ── Animation Variants ─────────────────────────────────────────────────────
  const questionVariants = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 80 : -80, scale: 0.96 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -80 : 80, scale: 0.96 }),
  };

  const fadeUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: 'easeOut' },
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER — LOADING
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'loading') {
    return (
      <div style={S.fullPage}>
        <motion.div style={S.loadingContainer} {...fadeUp}>
          <div style={S.loaderRing}>
            <div style={S.loaderInner} />
          </div>
          <h2 style={S.loadingTitle}>Generating Your Quiz</h2>
          <p style={S.loadingHint}>Our AI is crafting 15 unique questions…</p>
          <div style={S.loadingDots}>
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                style={S.loadingDot}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER — ERROR
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'error') {
    return (
      <div style={S.fullPage}>
        <motion.div style={S.errorCard} {...fadeUp}>
          <div style={S.errorIcon}>⚠️</div>
          <h2 style={{ ...S.heading, color: '#fca5a5' }}>Something went wrong</h2>
          <p style={S.errorMsg}>{error}</p>
          <div style={S.errorActions}>
            <button style={S.primaryBtn} onClick={fetchQuiz}>🔄 Try Again</button>
            <button style={S.ghostBtn} onClick={() => navigate(-1)}>← Go Back</button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER — DONE (Lesson marked complete)
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'done') {
    return (
      <div style={S.fullPage}>
        <motion.div style={S.doneCard} {...fadeUp}>
          <motion.div
            style={S.doneEmoji}
            animate={{ scale: [0, 1.3, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.8 }}
          >
            🎉
          </motion.div>
          <h2 style={S.heading}>Lesson Completed!</h2>
          <p style={S.doneHint}>Your progress has been saved. Keep the momentum going! 🚀</p>
          <div style={S.doneActions}>
            <button style={S.primaryBtn} onClick={() => navigate(`/course/${courseId}`)}>
              ← Back to Course
            </button>
            <button style={S.ghostBtn} onClick={() => navigate('/my-courses')}>
              My Courses
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER — RESULT SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'result' || phase === 'marking') {
    return (
      <div style={S.fullPage}>
        <motion.div style={S.resultContainer} {...fadeUp}>
          {/* Result Header */}
          <div style={S.resultHeader}>
            <motion.div
              style={S.resultEmoji}
              animate={{ scale: [0, 1.4, 1] }}
              transition={{ duration: 0.6, type: 'spring' }}
            >
              {passed ? '🏆' : '😔'}
            </motion.div>
            <h2 style={{ ...S.heading, fontSize: '32px' }}>
              {passed ? 'Quiz Passed!' : 'Quiz Failed'}
            </h2>
          </div>

          {/* Score Circle */}
          <motion.div
            style={{
              ...S.scoreCircle,
              background: passed
                ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.08))'
                : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.08))',
              borderColor: passed ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            <span style={{
              fontSize: '42px', fontWeight: '900',
              color: passed ? '#4ade80' : '#f87171',
              fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}>
              {pct}%
            </span>
            <span style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>
              {score} of {total} correct
            </span>
          </motion.div>

          {/* Stats Row */}
          <div style={S.statsRow}>
            <div style={{ ...S.statBox, borderColor: 'rgba(34,197,94,0.2)' }}>
              <span style={{ fontSize: '24px', fontWeight: '800', color: '#4ade80' }}>{score}</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Correct</span>
            </div>
            <div style={{ ...S.statBox, borderColor: 'rgba(239,68,68,0.2)' }}>
              <span style={{ fontSize: '24px', fontWeight: '800', color: '#f87171' }}>{total - score}</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Wrong</span>
            </div>
            <div style={{ ...S.statBox, borderColor: 'rgba(99,102,241,0.2)' }}>
              <span style={{ fontSize: '24px', fontWeight: '800', color: '#818cf8' }}>{total}</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Total</span>
            </div>
          </div>

          {/* Answer Review */}
          <div style={S.reviewScroll}>
            {answers.map((a, i) => (
              <motion.div
                key={i}
                style={{
                  ...S.reviewItem,
                  borderLeftColor: a.isRight ? '#4ade80' : '#f87171',
                  background: a.isRight ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)',
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div style={S.reviewNum}>
                  <span style={{
                    ...S.reviewBadge,
                    background: a.isRight ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    color: a.isRight ? '#4ade80' : '#f87171',
                  }}>
                    {a.isRight ? '✓' : '✗'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Q{i + 1}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={S.reviewQuestion}>{a.question}</p>
                  <p style={{
                    fontSize: '13px', marginTop: '4px',
                    color: a.isRight ? '#86efac' : '#fca5a5',
                  }}>
                    Your answer: {a.chosen}
                  </p>
                  {!a.isRight && (
                    <p style={{ fontSize: '13px', marginTop: '2px', color: '#86efac' }}>
                      Correct: {a.correct}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {markError && <p style={{ color: '#fca5a5', fontSize: '14px', marginTop: '12px' }}>{markError}</p>}

          {/* Action Buttons */}
          <div style={S.resultActions}>
            {passed ? (
              <button
                style={{ ...S.primaryBtn, ...S.btnLg }}
                disabled={phase === 'marking'}
                onClick={markComplete}
              >
                {phase === 'marking' ? '⏳ Saving...' : '✅ Mark Lesson Complete'}
              </button>
            ) : (
              <button style={{ ...S.primaryBtn, ...S.btnLg }} onClick={fetchQuiz}>
                🔄 Restart Quiz
              </button>
            )}
            <button style={S.ghostBtn} onClick={() => navigate(`/course/${courseId}`)}>
              ← Back to Course
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER — NO QUESTIONS FALLBACK
  // ═══════════════════════════════════════════════════════════════════════════
  if (!q) {
    return (
      <div style={S.fullPage}>
        <motion.div style={S.errorCard} {...fadeUp}>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>No questions available</p>
          <button style={S.primaryBtn} onClick={fetchQuiz}>🔄 Retry</button>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER — MAIN QUIZ UI
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={S.fullPage}>
      <div style={S.quizLayout}>

        {/* ── Left: Question Navigation Panel ─────────────────────────────── */}
        <motion.div
          style={S.navPanel}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 style={S.navTitle}>Questions</h3>
          <div style={S.navGrid}>
            {Array.from({ length: total }, (_, i) => {
              const isAnswered = i < answers.length;
              const isCurrent = i === current;
              return (
                <div
                  key={i}
                  style={{
                    ...S.navDot,
                    ...(isCurrent ? S.navDotCurrent : {}),
                    ...(isAnswered ? S.navDotAnswered : {}),
                  }}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
          <div style={S.navLegend}>
            <div style={S.legendItem}>
              <span style={{ ...S.legendDot, background: 'rgba(99,102,241,0.25)', border: '2px solid #818cf8' }} />
              <span style={{ fontSize: '11px', color: '#64748b' }}>Current</span>
            </div>
            <div style={S.legendItem}>
              <span style={{ ...S.legendDot, background: 'rgba(34,197,94,0.2)', border: '2px solid #4ade80' }} />
              <span style={{ fontSize: '11px', color: '#64748b' }}>Answered</span>
            </div>
            <div style={S.legendItem}>
              <span style={{ ...S.legendDot, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <span style={{ fontSize: '11px', color: '#64748b' }}>Pending</span>
            </div>
          </div>
        </motion.div>

        {/* ── Right: Main Quiz Area ───────────────────────────────────────── */}
        <div style={S.quizMain}>

          {/* Header Bar */}
          <div style={S.quizHeader}>
            <button style={S.backLink} onClick={() => navigate(`/course/${courseId}`)}>
              ← Course
            </button>
            <div style={S.lessonChip}>
              <span style={{ marginRight: '6px' }}>🧠</span>
              {lessonTitle}
            </div>
            <div style={S.progressPill}>
              {current + 1} / {total}
            </div>
          </div>

          {/* Progress Bar */}
          <div style={S.progressTrack}>
            <motion.div
              style={S.progressFill}
              animate={{ width: `${((current) / total) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>

          {/* Timer */}
          <div style={S.timerContainer}>
            <div style={S.timerBarTrack}>
              <motion.div
                style={{
                  ...S.timerBarFill,
                  background: timer > 10
                    ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                    : timer > 5
                    ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                    : 'linear-gradient(90deg, #ef4444, #dc2626)',
                }}
                animate={{ width: `${timerPct}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <motion.span
              style={{
                ...S.timerText,
                color: timer > 10 ? '#a5b4fc' : timer > 5 ? '#fbbf24' : '#f87171',
              }}
              animate={timer <= 5 ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.5, repeat: timer <= 5 ? Infinity : 0 }}
            >
              ⏱ {timer}s
            </motion.span>
          </div>

          {/* Question Card with Animation */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={questionVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              style={S.questionCard}
            >
              <div style={S.questionTag}>Question {current + 1}</div>
              <h2 style={S.questionText}>{q?.question}</h2>

              <div style={S.optionsList}>
                {q?.options?.map((opt, i) => {
                  const isChosen = selected === opt;
                  const letter = String.fromCharCode(65 + i);
                  return (
                    <motion.button
                      key={i}
                      onClick={() => setSelected(opt)}
                      style={{
                        ...S.optionBtn,
                        ...(isChosen ? S.optionChosen : {}),
                      }}
                      whileHover={{ scale: 1.01, backgroundColor: isChosen ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.07)' }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                    >
                      <span style={{
                        ...S.optionLetter,
                        ...(isChosen ? S.optionLetterChosen : {}),
                      }}>
                        {letter}
                      </span>
                      <span style={S.optionText}>{opt}</span>
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                style={{
                  ...S.primaryBtn,
                  width: '100%',
                  marginTop: '28px',
                  padding: '16px',
                  fontSize: '16px',
                  opacity: selected ? 1 : 0.4,
                  cursor: selected ? 'pointer' : 'not-allowed',
                }}
                disabled={!selected}
                onClick={confirmAnswer}
                whileHover={selected ? { scale: 1.02 } : {}}
                whileTap={selected ? { scale: 0.98 } : {}}
              >
                {current + 1 === total ? '🏁 Submit Quiz' : 'Next Question →'}
              </motion.button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES — Premium dark glassmorphism theme
// ─────────────────────────────────────────────────────────────────────────────
const S = {
  fullPage: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 35%, #16213e 65%, #0f0f1a 100%)',
    padding: '24px 16px 60px',
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    display: 'flex',
    justifyContent: 'center',
  },

  // ── Loading ──────────────────────────────────────────────────────────────
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '70vh',
    gap: '20px',
    textAlign: 'center',
  },
  loaderRing: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    border: '3px solid rgba(99,102,241,0.15)',
    borderTop: '3px solid #6366f1',
    animation: 'spin 1s linear infinite',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderInner: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '3px solid rgba(139,92,246,0.1)',
    borderBottom: '3px solid #8b5cf6',
    animation: 'spin 0.7s linear infinite reverse',
  },
  loadingTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#f1f5f9',
    margin: 0,
  },
  loadingHint: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  loadingDots: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  loadingDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#6366f1',
    display: 'inline-block',
  },

  // ── Error ────────────────────────────────────────────────────────────────
  errorCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    gap: '16px',
    textAlign: 'center',
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '24px',
    padding: '48px 40px',
    maxWidth: '520px',
    width: '100%',
  },
  errorIcon: { fontSize: '56px' },
  errorMsg: { color: '#94a3b8', fontSize: '15px', maxWidth: '380px', lineHeight: '1.6' },
  errorActions: { display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' },

  // ── Done ─────────────────────────────────────────────────────────────────
  doneCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    gap: '16px',
    textAlign: 'center',
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(34,197,94,0.15)',
    borderRadius: '24px',
    padding: '48px 40px',
    maxWidth: '520px',
    width: '100%',
  },
  doneEmoji: { fontSize: '72px' },
  doneHint: { color: '#94a3b8', fontSize: '15px' },
  doneActions: { display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center' },

  // ── Heading ──────────────────────────────────────────────────────────────
  heading: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#f1f5f9',
    margin: 0,
    letterSpacing: '-0.02em',
  },

  // ── Quiz Layout ──────────────────────────────────────────────────────────
  quizLayout: {
    display: 'flex',
    gap: '24px',
    maxWidth: '1000px',
    width: '100%',
    alignItems: 'flex-start',
  },

  // ── Navigation Panel ─────────────────────────────────────────────────────
  navPanel: {
    width: '200px',
    flexShrink: 0,
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '20px',
    padding: '24px 20px',
    position: 'sticky',
    top: '24px',
  },
  navTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#94a3b8',
    margin: '0 0 16px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  navGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '6px',
  },
  navDot: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748b',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'default',
    transition: 'all 0.2s',
  },
  navDotCurrent: {
    background: 'rgba(99,102,241,0.25)',
    border: '2px solid #818cf8',
    color: '#c7d2fe',
    boxShadow: '0 0 12px rgba(99,102,241,0.3)',
  },
  navDotAnswered: {
    background: 'rgba(34,197,94,0.2)',
    border: '2px solid #4ade80',
    color: '#86efac',
  },
  navLegend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '4px',
    flexShrink: 0,
  },

  // ── Main Quiz ────────────────────────────────────────────────────────────
  quizMain: {
    flex: 1,
    minWidth: 0,
  },

  // ── Header ───────────────────────────────────────────────────────────────
  quizHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  backLink: {
    background: 'none',
    border: 'none',
    color: '#818cf8',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    padding: 0,
    fontFamily: 'inherit',
    transition: 'color 0.2s',
  },
  lessonChip: {
    flex: 1,
    textAlign: 'center',
    fontSize: '13px',
    fontWeight: '600',
    color: '#94a3b8',
    padding: '0 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPill: {
    background: 'rgba(99,102,241,0.12)',
    border: '1px solid rgba(99,102,241,0.25)',
    borderRadius: '20px',
    padding: '6px 16px',
    color: '#a5b4fc',
    fontSize: '13px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },

  // ── Progress Bar ─────────────────────────────────────────────────────────
  progressTrack: {
    height: '4px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '2px',
    marginBottom: '16px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)',
    borderRadius: '2px',
  },

  // ── Timer ────────────────────────────────────────────────────────────────
  timerContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  timerBarTrack: {
    flex: 1,
    height: '6px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  timerBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'background 0.3s',
  },
  timerText: {
    fontSize: '14px',
    fontWeight: '700',
    minWidth: '50px',
    textAlign: 'right',
    fontFamily: "'Segoe UI', monospace",
  },

  // ── Question Card ────────────────────────────────────────────────────────
  questionCard: {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '24px',
    padding: '40px 36px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05) inset',
  },
  questionTag: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '800',
    color: '#818cf8',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    background: 'rgba(99,102,241,0.1)',
    padding: '4px 12px',
    borderRadius: '6px',
    marginBottom: '16px',
  },
  questionText: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#f1f5f9',
    margin: '0 0 28px',
    lineHeight: '1.5',
    letterSpacing: '-0.01em',
  },

  // ── Options ──────────────────────────────────────────────────────────────
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  optionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    padding: '16px 20px',
    color: '#e2e8f0',
    fontSize: '15px',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'all 0.2s ease',
    width: '100%',
  },
  optionChosen: {
    background: 'rgba(99,102,241,0.14)',
    borderColor: '#6366f1',
    color: '#f1f5f9',
    boxShadow: '0 0 16px rgba(99,102,241,0.15)',
  },
  optionLetter: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '800',
    color: '#64748b',
    flexShrink: 0,
    transition: 'all 0.2s',
  },
  optionLetterChosen: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
  },
  optionText: {
    lineHeight: '1.4',
  },

  // ── Buttons ──────────────────────────────────────────────────────────────
  primaryBtn: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none',
    borderRadius: '14px',
    padding: '14px 28px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
  },
  ghostBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '14px',
    padding: '14px 24px',
    color: '#e2e8f0',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  btnLg: {
    padding: '16px 36px',
    fontSize: '16px',
  },

  // ── Result Screen ────────────────────────────────────────────────────────
  resultContainer: {
    maxWidth: '720px',
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '28px',
    padding: '48px 40px',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  resultHeader: {
    marginBottom: '24px',
  },
  resultEmoji: {
    fontSize: '64px',
    marginBottom: '12px',
    display: 'inline-block',
  },
  scoreCircle: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    border: '2px solid',
    borderRadius: '20px',
    padding: '24px 48px',
    margin: '8px 0 24px',
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '28px',
    flexWrap: 'wrap',
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '16px 24px',
    borderRadius: '14px',
    border: '1px solid',
    background: 'rgba(255,255,255,0.03)',
    minWidth: '80px',
  },
  reviewScroll: {
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '350px',
    overflowY: 'auto',
    paddingRight: '4px',
    marginBottom: '8px',
  },
  reviewItem: {
    display: 'flex',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '12px',
    borderLeft: '3px solid',
    background: 'rgba(255,255,255,0.02)',
  },
  reviewNum: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0,
  },
  reviewBadge: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
  },
  reviewQuestion: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#e2e8f0',
    margin: 0,
    lineHeight: '1.4',
  },
  resultActions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: '24px',
  },
};

// ─── Global keyframe injection (spinner) ─────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('quiz-keyframes')) {
  const style = document.createElement('style');
  style.id = 'quiz-keyframes';
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    /* Custom scrollbar for review list */
    .quiz-review-scroll::-webkit-scrollbar {
      width: 6px;
    }
    .quiz-review-scroll::-webkit-scrollbar-track {
      background: transparent;
    }
    .quiz-review-scroll::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.1);
      border-radius: 3px;
    }
    /* Responsive overrides */
    @media (max-width: 768px) {
      .quiz-nav-panel { display: none !important; }
    }
  `;
  document.head.appendChild(style);
}