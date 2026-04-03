const StudentCourse = require('../models/StudentCourse');
const Course        = require('../models/Course');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/courses  — logged-in user's enrolled courses
// Returns StudentCourse docs populated with the admin-created Course document.
// ─────────────────────────────────────────────────────────────────────────────
exports.getCourses = async (req, res) => {
  try {
    const courses = await StudentCourse.find({ userId: req.user.id })
      .populate('courseId')   // populates the Course document
      .sort({ createdAt: -1 });
    res.json({ courses });
  } catch (err) {
    console.error('getCourses error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/user/courses/select
// Bulk enroll a user in admin-created courses.
// Body: { courseIds: ["id1", "id2"] }
// ─────────────────────────────────────────────────────────────────────────────
exports.selectCourses = async (req, res) => {
  try {
    const { courseIds } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(courseIds)) {
      return res.status(400).json({ message: 'courseIds must be an array.' });
    }

    if (courseIds.length === 0) {
      await StudentCourse.deleteMany({ userId });
      return res.json({ message: 'Course list cleared.', courses: [] });
    }

    // Validate all IDs point to approved admin-created courses
    const validCourses = await Course.find({
      _id:    { $in: courseIds },
      status: 'approved',
    });
    if (validCourses.length !== courseIds.length) {
      return res.status(400).json({ message: 'One or more course IDs are invalid.' });
    }

    // Replace user's selection
    await StudentCourse.deleteMany({ userId });
    await StudentCourse.insertMany(courseIds.map((cId) => ({ userId, courseId: cId })));

    const saved = await StudentCourse.find({ userId }).populate('courseId');
    res.status(200).json({ message: 'Course selection saved successfully!', courses: saved });

  } catch (err) {
    console.error('selectCourses error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};
