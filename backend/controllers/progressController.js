const Progress = require('../models/Progress');
const Course = require('../models/Course');
const StudentCourse = require('../models/StudentCourse');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/progress/complete
// Body: { courseId, topic }
// Marks a topic as complete in both Progress log and Course.topics[].status
// ─────────────────────────────────────────────────────────────────────────────
exports.markTopicComplete = async (req, res) => {
  try {
    const { courseId, topic } = req.body;
    const userId = req.user.id;

    if (!courseId || !topic) {
      return res.status(400).json({ message: 'courseId and topic are required' });
    }

    // ── Deduplication: skip if already logged ──────────────────────────────
    const existing = await Progress.findOne({ userId, courseId, topic });
    if (existing) {
      return res.status(200).json({ message: 'Topic already marked as complete', alreadyDone: true });
    }

    // ── Save progress entry ────────────────────────────────────────────────
    await Progress.create({ userId, courseId, topic });

    // ── Update Course.topics[].status ──────────────────────────────────────
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    let topicFound = false;
    course.topics.forEach(t => {
      if (t.title === topic) {
        t.status = 'completed';
        topicFound = true;
      }
    });

    if (topicFound) {
      await course.save();
    }

    // ── Update StudentCourse.completedLessons + progress % ─────────────────
    // StudentCourse stores completedLessons as an array of topic title strings
    await StudentCourse.findOneAndUpdate(
      { studentId: userId, courseId },
      { $addToSet: { completedLessons: topic } }
    );

    // Recalculate percentage
    const studentCourse = await StudentCourse.findOne({ studentId: userId, courseId });
    if (studentCourse && course.topics.length > 0) {
      const pct = Math.round((studentCourse.completedLessons.length / course.topics.length) * 100);
      studentCourse.progress = pct;
      await studentCourse.save();
    }

    res.json({ message: 'Topic marked as complete', alreadyDone: false });

  } catch (err) {
    console.error('markTopicComplete error:', err);
    res.status(500).json({ message: 'Error marking topic complete' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/progress/stats
// Returns: totalCompleted, dailyStats, streak, courseProgress[], dashboard summary
// ─────────────────────────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // ── Fetch all progress entries for this user ────────────────────────────
    const progress = await Progress.find({ userId }).lean();

    // ── Total completed topics ─────────────────────────────────────────────
    const totalCompleted = progress.length;

    // ── Group by date (IST-friendly: use UTC date string) ──────────────────
    const dailyStats = {};
    progress.forEach(p => {
      const date = new Date(p.completedAt).toISOString().split('T')[0];
      dailyStats[date] = (dailyStats[date] || 0) + 1;
    });

    // ── Streak calculation ─────────────────────────────────────────────────
    // Walk backwards from today; count consecutive days that have activity.
    let streak = 0;
    const checkDate = new Date();

    // Normalise to midnight UTC so date strings match
    checkDate.setUTCHours(0, 0, 0, 0);

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (dailyStats[dateStr]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // Allow today to be empty without breaking a streak that ran through yesterday
        if (streak === 0) {
          // Check yesterday as well — streak may have started yesterday
          const yesterday = new Date(checkDate);
          yesterday.setDate(yesterday.getDate() - 1);
          const yStr = yesterday.toISOString().split('T')[0];
          if (dailyStats[yStr]) {
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }

    // ── Course-wise progress ───────────────────────────────────────────────
    const studentCourses = await StudentCourse.find({ studentId: userId })
      .populate('courseId', 'courseName topics')
      .lean();

    const courseProgress = studentCourses.map(sc => {
      const course = sc.courseId;
      const totalTopics = course?.topics?.length || 0;
      const completedTopics = sc.completedLessons?.length || 0;
      const percentage = totalTopics > 0
        ? Math.round((completedTopics / totalTopics) * 100)
        : sc.progress || 0;

      return {
        courseId: sc.courseId?._id,
        courseName: course?.courseName || 'Unknown',
        completedTopics,
        totalTopics,
        percentage
      };
    });

    // ── Dashboard summary ──────────────────────────────────────────────────
    const totalCourses = courseProgress.length;
    const completedCourses = courseProgress.filter(c => c.percentage === 100).length;
    const avgProgress = totalCourses > 0
      ? Math.round(courseProgress.reduce((sum, c) => sum + c.percentage, 0) / totalCourses)
      : 0;

    // Last 7-day activity summary (for graph)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      last7Days.push({ date: dateStr, count: dailyStats[dateStr] || 0 });
    }

    res.json({
      totalCompleted,
      dailyStats,
      streak,
      courseProgress,
      dashboard: {
        totalCourses,
        completedCourses,
        avgProgress,
        last7Days
      }
    });

  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/progress/course/:courseId
// Returns topic-level completion for a specific course
// ─────────────────────────────────────────────────────────────────────────────
exports.getCourseProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;

    const course = await Course.findById(courseId).lean();
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Topics marked complete in Progress log
    const completedEntries = await Progress.find({ userId, courseId }).lean();
    const completedTopics = new Set(completedEntries.map(e => e.topic));

    const topics = course.topics.map(t => ({
      title: t.title,
      status: completedTopics.has(t.title) ? 'completed' : (t.status || 'pending'),
      deadline: t.deadline,
      estimatedHours: t.estimatedHours
    }));

    const totalTopics = topics.length;
    const doneCount = topics.filter(t => t.status === 'completed').length;
    const percentage = totalTopics > 0 ? Math.round((doneCount / totalTopics) * 100) : 0;

    res.json({
      courseId,
      courseName: course.courseName,
      totalTopics,
      completedTopics: doneCount,
      percentage,
      topics
    });

  } catch (err) {
    console.error('getCourseProgress error:', err);
    res.status(500).json({ message: 'Error fetching course progress' });
  }
};
