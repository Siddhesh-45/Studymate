import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';

export default function PracticeHub() {
  const [enrolments, setEnrolments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCourses, setExpandedCourses] = useState({}); // courseId -> boolean
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const studentId = user._id || user.id;

  useEffect(() => {
    if (studentId) fetchMyCourses();
  }, [studentId]);

  async function fetchMyCourses() {
    try {
      setLoading(true);
      setError('');
      const res = await API.get('/student-courses');
      const coursesData = res.data.courses || [];
      setEnrolments(coursesData);
      
      // Expand all courses by default
      const initialExpanded = {};
      coursesData.forEach((entry) => {
        if (entry.courseId?._id) {
          initialExpanded[entry.courseId._id] = true;
        }
      });
      setExpandedCourses(initialExpanded);

    } catch (err) {
      console.error('PracticeHub fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load your practice courses.');
    } finally {
      setLoading(false);
    }
  }

  const toggleCourse = (courseId) => {
    setExpandedCourses((prev) => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  // Filter topics based on search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return enrolments;

    const lowerQuery = searchQuery.toLowerCase();
    
    return enrolments.map(entry => {
      if (!entry.courseId) return entry;
      
      // If course name matches, show all topics
      if (entry.courseId.courseName?.toLowerCase().includes(lowerQuery)) {
        return entry;
      }
      
      // Filter topics
      const matchingTopics = (entry.courseId.topics || []).filter(topic => 
        topic.title?.toLowerCase().includes(lowerQuery)
      );
      
      return {
        ...entry,
        courseId: {
          ...entry.courseId,
          topics: matchingTopics
        }
      };
    }).filter(entry => entry.courseId && entry.courseId.topics?.length > 0);
  }, [enrolments, searchQuery]);

  // Derived stats
  const totalEnrolled = enrolments.length;
  const totalTopics = enrolments.reduce((sum, entry) => sum + (entry.totalLessons || entry.courseId?.topics?.length || 0), 0);
  const totalCompleted = enrolments.reduce((sum, entry) => sum + (entry.completedCount || 0), 0);
  
  if (loading) return (
    <div style={S.centered}>
      <div style={S.spinner} />
      <p style={S.loadingText}>Loading your Practice Hub…</p>
    </div>
  );

  if (error) return (
    <div style={S.centered}>
      <span style={{ fontSize: '40px' }}>⚠️</span>
      <p style={{ color: 'var(--sm-red)', marginTop: '12px' }}>{error}</p>
    </div>
  );

  return (
    <div style={S.page}>
      {/* Header section */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>🧠 Practice Hub</h1>
          <p style={S.subtitle}>
            Revise and reinforce any topic from your enrolled courses, any time.
          </p>
        </div>
        
        {/* Search Bar */}
        <div style={S.searchWrapper}>
          <span style={S.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search for a topic or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={S.searchInput}
          />
        </div>
      </div>

      {/* Global Stats Bar */}
      {totalEnrolled > 0 && (
         <div style={S.statsBar}>
          <div style={S.statItem}>
            <span style={S.statNum}>{totalEnrolled}</span>
            <span style={S.statLabel}>Courses</span>
          </div>
          <div style={S.statDivider} />
          <div style={S.statItem}>
            <span style={{...S.statNum, color: 'var(--sm-indigo)'}}>{totalTopics}</span>
            <span style={S.statLabel}>Total Topics</span>
          </div>
          <div style={S.statDivider} />
          <div style={S.statItem}>
            <span style={{...S.statNum, color: '#86efac'}}>{totalCompleted}</span>
            <span style={S.statLabel}>Topics Mastered</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredData.length === 0 && (
         <div style={S.emptyBox}>
          <span style={S.emptyIcon}>{searchQuery ? '📭' : '📋'}</span>
          <p style={S.emptyTitle}>
            {searchQuery ? 'No topics matched your search' : 'No courses selected yet'}
          </p>
          <p style={S.emptySubtitle}>
            {searchQuery 
              ? 'Try modifying your keywords or clear the search.' 
              : 'Go to All Courses and click "Add to My Courses" to build your practice hub.'}
          </p>
          {!searchQuery && (
            <button style={S.browseBtn} onClick={() => navigate('/all-courses')}>
              Browse All Courses →
            </button>
          )}
        </div>
      )}

      {/* Course List Wrapper */}
      <div style={S.courseList}>
        {filteredData.map((entry) => {
          const course = entry.courseId;
          const completedLessons = entry.completedLessons || [];
          if (!course) return null;

          const topics = course.topics || [];
          const isExpanded = !!expandedCourses[course._id];
          const courseProgress = topics.length > 0 ? Math.round((completedLessons.length / entry.totalLessons || topics.length) * 100) : 0;
          const isDone = courseProgress >= 100;

          return (
            <motion.div 
              key={entry._id} 
              style={S.courseCard}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Course Card Header */}
              <div 
                style={{ ...S.courseHeader, ...(isDone ? S.courseHeaderDone : {}) }}
                onClick={() => toggleCourse(course._id)}
              >
                <div style={S.courseHeaderLeft}>
                  <div style={S.courseIconBox}>
                    {isDone ? '🏆' : '📘'}
                  </div>
                  <div>
                    <h2 style={S.courseTitle}>{course.courseName}</h2>
                    <div style={S.courseMetaInfo}>
                      <span style={{ color: 'var(--sm-indigo-muted)', fontWeight: 'bold' }}>{topics.length} topics</span>
                      <span style={{ margin: '0 6px', color: 'var(--sm-text-sub)' }}>•</span>
                      <span style={{ color: isDone ? '#86efac' : 'var(--sm-text-sub)' }}>
                        {completedLessons.length} completed
                      </span>
                    </div>
                  </div>
                </div>
                
                <div style={S.courseHeaderRight}>
                  {/* Progress Ring / Info */}
                  <div style={S.miniProgressTrack}>
                    <div style={{
                      ...S.miniProgressFill, 
                      width: `${courseProgress}%`,
                      background: isDone ? 'linear-gradient(90deg, #22c55e, #16a34a)' : 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                    }} />
                  </div>
                  
                  {/* Expand / Collapse Icon */}
                  <span style={S.expandIcon}>
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {/* Topics Container (Accordion) */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={S.topicsContainer}>
                      {topics.length === 0 ? (
                        <p style={{ color: 'var(--sm-text-sub)', fontSize: '14px', margin: 0 }}>No topics available.</p>
                      ) : (
                        topics.map((topic, i) => {
                          const topicDone = completedLessons.includes(topic._id);
                          return (
                            <div key={topic._id} style={{
                              ...S.topicRow, 
                              ...(topicDone ? S.topicRowDone : {}),
                              borderBottom: i === topics.length - 1 ? 'none' : '1px solid var(--sm-surface-4)'
                            }}>
                              <div style={S.topicInfo}>
                                <div style={{
                                  ...S.topicStatusIndicator,
                                  background: topicDone ? 'rgba(34,197,94,0.15)' : 'var(--sm-surface-6)',
                                  color: topicDone ? '#4ade80' : 'var(--sm-text-sub)',
                                  border: topicDone ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--sm-surface-10)',
                                }}>
                                  {topicDone ? '✓' : i + 1}
                                </div>
                                <span style={{
                                  ...S.topicName,
                                  color: topicDone ? 'var(--sm-text-muted)' : 'var(--sm-text)'
                                }}>
                                  {topic.title}
                                </span>
                              </div>
                              <button 
                                style={{
                                  ...S.startQuizBtn,
                                  ...(topicDone ? S.startQuizBtnDone : {})
                                }}
                                onClick={() => navigate(`/quiz/${course._id}/${topic._id}`)}
                              >
                                {topicDone ? '↺ Retake Quiz' : '▶ Start Quiz'}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page:     { padding: '8px 0', position: 'relative' },
  centered: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' },
  spinner:  { width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.3)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText: { color: 'var(--sm-surface-40)', fontSize: '14px' },

  header:     { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' },
  title:      { fontSize: '28px', fontWeight: '700', color: 'var(--sm-text, #e2e8f0)', margin: 0, marginBottom: '6px', letterSpacing: '-0.5px' },
  subtitle:   { color: 'var(--sm-surface-45)', fontSize: '14px', margin: 0, lineHeight: '1.5', maxWidth: '500px' },
  
  searchWrapper: { position: 'relative', minWidth: '280px', flexShrink: 0 },
  searchIcon: { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: 'var(--sm-text-sub)' },
  searchInput: { width: '100%', padding: '12px 16px 12px 40px', borderRadius: '12px', background: 'var(--sm-surface-4)', border: '1px solid var(--sm-surface-10)', color: 'var(--sm-text)', fontSize: '14px', outline: 'none', transition: 'all 0.2s', },

  statsBar:    { display: 'flex', alignItems: 'center', background: 'var(--sm-surface-3)', border: '1px solid var(--sm-surface-7)', borderRadius: '14px', padding: '16px 24px', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' },
  statItem:    { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', minWidth: '60px' },
  statNum:     { fontSize: '22px', fontWeight: '700', color: 'var(--sm-text)', lineHeight: 1 },
  statLabel:   { fontSize: '12px', color: 'var(--sm-text-sub)', fontWeight: '500' },
  statDivider: { width: '1px', height: '32px', background: 'var(--sm-surface-8)' },

  emptyBox:    { textAlign: 'center', padding: '80px 24px', background: 'var(--sm-surface-2)', border: '1px dashed var(--sm-surface-10)', borderRadius: '20px' },
  emptyIcon:   { fontSize: '48px', display: 'block', marginBottom: '16px' },
  emptyTitle:  { color: 'var(--sm-text, #e2e8f0)', fontSize: '20px', fontWeight: '600', margin: '0 0 8px' },
  emptySubtitle:{ color: 'var(--sm-surface-40)', fontSize: '14px', margin: '0 0 20px', lineHeight: '1.6' },
  browseBtn:   { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '10px', padding: '12px 24px', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' },

  courseList: { display: 'flex', flexDirection: 'column', gap: '20px' },
  
  courseCard: { background: 'var(--sm-surface-3)', border: '1px solid var(--sm-surface-8)', borderRadius: '16px', overflow: 'hidden'},
  
  courseHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', cursor: 'pointer', background: 'linear-gradient(180deg, var(--sm-surface-2) 0%, rgba(255,255,255,0) 100%)', transition: 'background 0.2sease', borderBottom: '1px solid var(--sm-surface-3)' },
  courseHeaderDone: { background: 'linear-gradient(180deg, rgba(34,197,94,0.05) 0%, rgba(34,197,94,0) 100%)', borderBottom: '1px solid rgba(34,197,94,0.05)' },
  
  courseHeaderLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  courseIconBox: { width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' },
  courseTitle: { fontSize: '18px', fontWeight: '700', color: 'var(--sm-text, #f1f5f9)', margin: '0 0 4px', lineHeight: '1.2' },
  courseMetaInfo: { fontSize: '13px' },
  
  courseHeaderRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  miniProgressTrack: { width: '80px', height: '6px', background: 'var(--sm-surface-8)', borderRadius: '3px', overflow: 'hidden', display: 'flex' },
  miniProgressFill: { height: '100%', borderRadius: '3px', transition: 'width 0.4s ease' },
  expandIcon: { fontSize: '12px', color: 'var(--sm-text-sub)', transition: 'transform 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--sm-surface-5)' },

  topicsContainer: { padding: '8px 20px 20px', display: 'flex', flexDirection: 'column' },
  
  topicRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', gap: '16px', transition: 'all 0.2s ease' },
  topicRowDone: { opacity: 0.8 },
  
  topicInfo: { display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 },
  topicStatusIndicator: { width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 },
  topicName: { fontSize: '15px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  
  startQuizBtn: { flexShrink: 0, padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: 'none', background: 'rgba(99,102,241,0.1)', color: 'var(--sm-indigo)', transition: 'all 0.2s', border: '1px solid rgba(99,102,241,0.2)' },
  startQuizBtnDone: { background: 'var(--sm-surface-3)', color: 'var(--sm-text-sub)', border: '1px solid var(--sm-surface-10)' }
};
