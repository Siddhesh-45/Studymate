const User = require('../models/User');
const Course = require('../models/Course');
const StudentCourse = require('../models/StudentCourse');
const CourseProgress = require('../models/CourseProgress');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/dashboard/stats
// Returns total users, total courses, total enrollments, avg completion
// ─────────────────────────────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalUsers, totalCourses, enrollmentStats, avgCompletion] = await Promise.all([
      // Total users (all roles)
      User.countDocuments(),

      // Total courses in system
      Course.countDocuments(),

      // Total enrollments + active courses (courses with >= 1 enrolled student)
      StudentCourse.aggregate([
        {
          $group: {
            _id: '$courseId',
            enrolledCount: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            totalEnrollments: { $sum: '$enrolledCount' },
            activeCourses: { $sum: 1 }, // courses with at least 1 student
          },
        },
      ]),

      // Average completion percentage across all enrollments
      StudentCourse.aggregate([
        {
          $group: {
            _id: null,
            avgProgress: { $avg: '$progress' },
          },
        },
      ]),
    ]);

    const stats = enrollmentStats[0] || { totalEnrollments: 0, activeCourses: 0 };

    res.json({
      totalUsers,
      totalCourses,
      totalEnrollments: stats.totalEnrollments,
      activeCourses: stats.activeCourses,
      avgCompletionPct: avgCompletion[0]
        ? parseFloat(avgCompletion[0].avgProgress.toFixed(1))
        : 0,
    });
  } catch (err) {
    console.error('[adminDashboard] getDashboardStats error:', err);
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/dashboard/recent-users
// Users who joined in last 7 days, with enrolled course count & avg progress
// ─────────────────────────────────────────────────────────────────────────────
exports.getRecentUsers = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Aggregate: recent users joined in last 7 days
    const recentUsers = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'studentcourses',
          localField: '_id',
          foreignField: 'studentId',
          as: 'enrollments',
        },
      },
      // Join real progress from CourseProgress collection
      {
        $lookup: {
          from: 'courseprogresss',
          localField: '_id',
          foreignField: 'userId',
          as: 'progressRecords',
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          role: 1,
          status: 1,
          createdAt: 1,
          enrolledCourses: { $size: '$enrollments' },
          avgProgress: {
            $cond: {
              if: { $gt: [{ $size: '$progressRecords' }, 0] },
              then: { $round: [{ $avg: '$progressRecords.completionPercentage' }, 1] },
              else: 0,
            },
          },
        },
      },
    ]);

    res.json({ recentUsers });
  } catch (err) {
    console.error('[adminDashboard] getRecentUsers error:', err);
    res.status(500).json({ message: 'Server error fetching recent users' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/dashboard/all-users
// All users with their enrolled course count and avg progress percentage
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllUsersWithStats = async (req, res) => {
  try {
    const users = await User.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'studentcourses',
          localField: '_id',
          foreignField: 'studentId',
          as: 'enrollments',
        },
      },
      // Join real progress from CourseProgress collection
      {
        $lookup: {
          from: 'courseprogresss',
          localField: '_id',
          foreignField: 'userId',
          as: 'progressRecords',
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          role: 1,
          status: 1,
          createdAt: 1,
          lastLogin: 1,
          enrolledCourses: { $size: '$enrollments' },
          avgProgress: {
            $cond: {
              if: { $gt: [{ $size: '$progressRecords' }, 0] },
              then: { $round: [{ $avg: '$progressRecords.completionPercentage' }, 1] },
              else: 0,
            },
          },
        },
      },
    ]);

    res.json({ users });
  } catch (err) {
    console.error('[adminDashboard] getAllUsersWithStats error:', err);
    res.status(500).json({ message: 'Server error fetching users with stats' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/dashboard/popular-courses
// Most popular courses ranked by number of enrollments (real data from StudentCourse)
// ─────────────────────────────────────────────────────────────────────────────
exports.getPopularCourses = async (req, res) => {
  try {
    const popularCourses = await StudentCourse.aggregate([
      // Group by course and count enrollments + avg progress
      {
        $group: {
          _id: '$courseId',
          enrolledCount: { $sum: 1 },
          avgCompletion: { $avg: '$progress' },
        },
      },
      { $sort: { enrolledCount: -1 } },
      { $limit: 8 },
      // Join with courses collection to get course name & topic count
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseInfo',
        },
      },
      { $unwind: '$courseInfo' },
      {
        $project: {
          _id: 0,
          courseId: '$_id',
          courseName: '$courseInfo.courseName',
          description: '$courseInfo.description',
          totalTopics: { $size: { $ifNull: ['$courseInfo.topics', []] } },
          enrolledCount: 1,
          avgCompletion: { $round: ['$avgCompletion', 1] },
          isActive: '$courseInfo.isActive',
          status: '$courseInfo.status',
        },
      },
    ]);

    res.json({ popularCourses });
  } catch (err) {
    console.error('[adminDashboard] getPopularCourses error:', err);
    res.status(500).json({ message: 'Server error fetching popular courses' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/dashboard/user-growth
// Monthly new user registrations for last 6 months
// ─────────────────────────────────────────────────────────────────────────────
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
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
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
                  else: { $toString: '$_id.month' },
                },
              },
            ],
          },
          count: 1,
        },
      },
    ]);

    res.json({ growth });
  } catch (err) {
    console.error('[adminDashboard] getUserGrowth error:', err);
    res.status(500).json({ message: 'Server error fetching user growth' });
  }
};
