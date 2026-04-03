const StudentCourse = require('../models/StudentCourse');
const Course        = require('../models/Course');
const UserChapter   = require('../models/UserChapter');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/courses/:courseId/chapters
// Returns the topics (videos) embedded in the admin-created Course document.
// Only accessible if the user has enrolled in the course.
// ─────────────────────────────────────────────────────────────────────────────
exports.getChaptersForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const enrollment = await StudentCourse.findOne({ userId, courseId });
    if (!enrollment) {
      return res.status(403).json({
        message: 'You have not enrolled in this course.',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    // Return the embedded topics as "chapters"
    res.json({ chapters: course.topics || [] });
  } catch (err) {
    console.error('getChaptersForCourse error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/user/chapters  — all chapters the student has selected
// ─────────────────────────────────────────────────────────────────────────────
exports.getUserChapters = async (req, res) => {
  try {
    const userChapters = await UserChapter.find({ userId: req.user.id })
      .populate('courseId',  'courseName')
      .sort({ deadline: 1 });

    res.json({ chapters: userChapters });
  } catch (err) {
    console.error('getUserChapters error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/user/chapters  — save chapter selections with deadlines
// Body: [{ courseId, chapterId, deadline }]
// ─────────────────────────────────────────────────────────────────────────────
exports.saveUserChapters = async (req, res) => {
  try {
    const userId     = req.user.id;
    const selections = req.body;

    if (!Array.isArray(selections) || selections.length === 0) {
      return res.status(400).json({ message: 'Send at least one chapter selection.' });
    }

    for (const s of selections) {
      if (!s.courseId)  return res.status(400).json({ message: 'courseId is required.' });
      if (!s.chapterId) return res.status(400).json({ message: 'chapterId is required.' });
      if (!s.deadline)  return res.status(400).json({ message: 'deadline is required.' });
    }

    const ops = selections.map((s) => ({
      updateOne: {
        filter: { userId, chapterId: s.chapterId },
        update: { $set: { userId, courseId: s.courseId, chapterId: s.chapterId, deadline: new Date(s.deadline) } },
        upsert: true,
      },
    }));

    await UserChapter.bulkWrite(ops);

    const updated = await UserChapter.find({ userId })
      .populate('courseId', 'courseName')
      .sort({ deadline: 1 });

    res.json({ message: `${selections.length} chapter(s) saved.`, chapters: updated });
  } catch (err) {
    console.error('saveUserChapters error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/user/chapters/:chapterId
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteUserChapter = async (req, res) => {
  try {
    const deleted = await UserChapter.findOneAndDelete({
      userId:    req.user.id,
      chapterId: req.params.chapterId,
    });
    if (!deleted) return res.status(404).json({ message: 'Chapter not found.' });
    res.json({ message: 'Chapter removed.', chapterId: req.params.chapterId });
  } catch (err) {
    console.error('deleteUserChapter error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};
