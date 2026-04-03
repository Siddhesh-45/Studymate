const User = require('../models/User');
const Course = require('../models/Course');
const QuizAttempt = require('../models/QuizAttempt');
const CourseProgress = require('../models/CourseProgress');

// ─────────────────────────────────────────────
// GET /api/admin/total-users
// ─────────────────────────────────────────────
exports.getTotalUsers = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    res.json({ totalUsers });
  } catch (error) {
    console.error('getTotalUsers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/active-students
// Active = logged in within last 7 days
// ─────────────────────────────────────────────
exports.getActiveStudents = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeStudents = await User.countDocuments({
      role: { $in: ['student', 'user'] },
      lastLogin: { $gte: sevenDaysAgo }
    });

    res.json({ activeStudents });
  } catch (error) {
    console.error('getActiveStudents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/quiz-attempts
// ─────────────────────────────────────────────
exports.getQuizAttempts = async (req, res) => {
  try {
    const quizAttempts = await QuizAttempt.countDocuments();

    // Quiz attempts per day (last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const attemptsPerDay = await QuizAttempt.aggregate([
      { $match: { attemptedAt: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$attemptedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } }
    ]);

    // Average score
    const scoreStats = await QuizAttempt.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$score' } } }
    ]);
    const avgScore = scoreStats.length > 0 ? Math.round(scoreStats[0].avgScore) : 0;

    res.json({ quizAttempts, attemptsPerDay, avgScore });
  } catch (error) {
    console.error('getQuizAttempts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/course-completion
// ─────────────────────────────────────────────
exports.getCourseCompletion = async (req, res) => {
  try {
    const totalCourses = await CourseProgress.countDocuments();
    const completedCourses = await CourseProgress.countDocuments({
      completionPercentage: 100
    });

    const completionRate =
      totalCourses > 0
        ? parseFloat(((completedCourses / totalCourses) * 100).toFixed(2))
        : 0;

    res.json({ completedCourses, totalCourses, completionRate });
  } catch (error) {
    console.error('getCourseCompletion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/popular-courses
// Returns top 5 most enrolled/topic-rich courses
// ─────────────────────────────────────────────
exports.getPopularCourses = async (req, res) => {
  try {
    // Use CourseProgress to count enrollments per course
    const popularFromProgress = await CourseProgress.aggregate([
      {
        $group: {
          _id: '$courseId',
          students: { $sum: 1 },
          avgCompletion: { $avg: '$completionPercentage' }
        }
      },
      { $sort: { students: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      { $unwind: { path: '$courseInfo', preserveNullAndEmpty: false } },
      {
        $project: {
          _id: 0,
          courseName: '$courseInfo.courseName',
          students: 1,
          avgCompletion: { $round: ['$avgCompletion', 1] }
        }
      }
    ]);

    // Fallback: if no CourseProgress data, use courses sorted by topics count
    if (popularFromProgress.length === 0) {
      const courses = await Course.find({ status: 'approved' })
        .select('courseName topics')
        .lean();

      const sorted = courses
        .map(c => ({
          courseName: c.courseName,
          students: c.topics ? c.topics.length : 0,
          avgCompletion: 0
        }))
        .sort((a, b) => b.students - a.students)
        .slice(0, 5);

      return res.json(sorted);
    }

    res.json(popularFromProgress);
  } catch (error) {
    console.error('getPopularCourses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/user-growth
// Monthly new user registrations (last 6 months)
// ─────────────────────────────────────────────
exports.getUserGrowth = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const growth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: {
                  if: { $lt: ['$_id.month', 10] },
                  then: { $concat: ['0', { $toString: '$_id.month' }] },
                  else: { $toString: '$_id.month' }
                }
              }
            ]
          },
          count: 1
        }
      }
    ]);

    res.json({ growth });
  } catch (error) {
    console.error('getUserGrowth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/learning-patterns
// ─────────────────────────────────────────────
exports.getLearningPatterns = async (req, res) => {
  try {
    // Most attempted quiz
    const topQuiz = await QuizAttempt.aggregate([
      { $group: { _id: '$quizTitle', count: { $sum: 1 }, avgScore: { $avg: '$score' } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    // Hardest quiz (lowest average score, min 2 attempts)
    const hardestQuiz = await QuizAttempt.aggregate([
      { $group: { _id: '$quizTitle', avgScore: { $avg: '$score' }, count: { $sum: 1 } } },
      { $match: { count: { $gte: 2 } } },
      { $sort: { avgScore: 1 } },
      { $limit: 1 }
    ]);

    // Most active hour of day
    const activeHours = await User.aggregate([
      { $match: { lastLogin: { $ne: null } } },
      { $group: { _id: { $hour: '$lastLogin' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    // Most watched course (most topic progress)
    const topCourse = await CourseProgress.aggregate([
      { $group: { _id: '$courseId', totalCompleted: { $sum: '$completedLessons' } } },
      { $sort: { totalCompleted: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      { $unwind: { path: '$courseInfo', preserveNullAndEmpty: false } }
    ]);

    // Quiz score distribution (buckets)
    const scoreDistribution = await QuizAttempt.aggregate([
      {
        $bucket: {
          groupBy: '$score',
          boundaries: [0, 20, 40, 60, 80, 101],
          default: 'Other',
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    const formatHour = (h) => {
      if (h === null || h === undefined) return 'N/A';
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const nextH = (h + 2) % 24;
      const nextPeriod = nextH >= 12 ? 'PM' : 'AM';
      const displayNext = nextH % 12 === 0 ? 12 : nextH % 12;
      return `${displayH} ${period} – ${displayNext} ${nextPeriod}`;
    };

    res.json({
      mostAttemptedQuiz: topQuiz[0]?._id || 'N/A',
      hardestQuiz: hardestQuiz[0]?._id || 'N/A',
      hardestQuizAvgScore: hardestQuiz[0]?.avgScore ? Math.round(hardestQuiz[0].avgScore) : null,
      mostActiveTime: formatHour(activeHours[0]?._id),
      mostWatchedCourse: topCourse[0]?.courseInfo?.courseName || 'N/A',
      scoreDistribution: scoreDistribution.map(b => ({
        range: b._id === 0 ? '0-19' : b._id === 20 ? '20-39' : b._id === 40 ? '40-59' : b._id === 60 ? '60-79' : '80-100',
        count: b.count
      }))
    });
  } catch (error) {
    console.error('getLearningPatterns error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/overview
// All stats in one call for the dashboard
// ─────────────────────────────────────────────
exports.getOverview = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalUsers, activeStudents, quizAttempts, courseStats] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({
        role: { $in: ['student', 'user'] },
        lastLogin: { $gte: sevenDaysAgo }
      }),
      QuizAttempt.countDocuments(),
      CourseProgress.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$completionPercentage', 100] }, 1, 0] } }
          }
        }
      ])
    ]);

    const total = courseStats[0]?.total || 0;
    const completed = courseStats[0]?.completed || 0;
    const completionRate = total > 0 ? parseFloat(((completed / total) * 100).toFixed(1)) : 0;

    res.json({
      totalUsers,
      activeStudents,
      quizAttempts,
      completedCourses: completed,
      totalCourseEnrollments: total,
      completionRate
    });
  } catch (error) {
    console.error('getOverview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/leaderboard?courseId=:id
// Top 10 students for a given course,
// ranked by completionPercentage descending.
// ─────────────────────────────────────────────
exports.getLeaderboard = async (req, res) => {
  try {
    const { courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({ message: 'courseId query param is required.' });
    }

    const leaderboard = await CourseProgress.find({ courseId })
      .sort({ completionPercentage: -1, completedLessons: -1 })
      .limit(10)
      .populate('userId', 'name email')
      .lean();

    const ranked = leaderboard.map((entry, index) => ({
      rank:                index + 1,
      name:                entry.userId?.name  || 'Unknown',
      email:               entry.userId?.email || '',
      completedLessons:    entry.completedLessons,
      totalLessons:        entry.totalLessons,
      completionPercentage: entry.completionPercentage
    }));

    res.json({ courseId, leaderboard: ranked });
  } catch (error) {
    console.error('getLeaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
