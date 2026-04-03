const StudentCourse  = require('../models/StudentCourse');
const CourseChapter  = require('../models/CourseChapter');
const UserChapter    = require('../models/UserChapter');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/courses/:courseId/chapters
// Returns chapters for a course — only if the user has selected that course.
// ─────────────────────────────────────────────────────────────────────────────
exports.getChaptersForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Verify user has selected this course
    const enrollment = await StudentCourse.findOne({ userId, masterId: courseId });
    if (!enrollment) {
      return res.status(403).json({
        message: 'You have not selected this course. Add it to your courses first.',
      });
    }

    const chapters = await CourseChapter.find({ courseId }).sort({ order: 1, title: 1 });
    res.json({ chapters });
  } catch (err) {
    console.error('getChaptersForCourse error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/user/chapters
// Returns all chapters the logged-in user has selected, with course + chapter info.
// ─────────────────────────────────────────────────────────────────────────────
exports.getUserChapters = async (req, res) => {
  try {
    const userChapters = await UserChapter.find({ userId: req.user.id })
      .populate('courseId',  'name difficulty')
      .populate('chapterId', 'title order')
      .sort({ 'courseId.name': 1, 'chapterId.order': 1 });

    res.json({ chapters: userChapters });
  } catch (err) {
    console.error('getUserChapters error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/user/chapters
// Save/replace the user's chapter selection.
// Body: [{ courseId, chapterId, deadline }]
// Uses upsert — safe to call repeatedly with full selection state.
// ─────────────────────────────────────────────────────────────────────────────
exports.saveUserChapters = async (req, res) => {
  try {
    const userId    = req.user.id;
    const selections = req.body; // array

    if (!Array.isArray(selections) || selections.length === 0) {
      return res.status(400).json({ message: 'Send at least one chapter selection.' });
    }

    // Validate each item
    for (const s of selections) {
      if (!s.courseId)  return res.status(400).json({ message: 'courseId is required for each entry.' });
      if (!s.chapterId) return res.status(400).json({ message: 'chapterId is required for each entry.' });
      if (!s.deadline)  return res.status(400).json({ message: 'deadline is required for each entry.' });
    }

    // Upsert each selection (deadline can change on re-save)
    const ops = selections.map((s) => ({
      updateOne: {
        filter: { userId, chapterId: s.chapterId },
        update: { $set: { userId, courseId: s.courseId, chapterId: s.chapterId, deadline: new Date(s.deadline) } },
        upsert: true,
      },
    }));

    await UserChapter.bulkWrite(ops);

    // Return updated full list
    const updated = await UserChapter.find({ userId })
      .populate('courseId',  'name difficulty')
      .populate('chapterId', 'title order')
      .sort({ deadline: 1 });

    res.json({ message: `${selections.length} chapter(s) saved.`, chapters: updated });
  } catch (err) {
    console.error('saveUserChapters error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/user/chapters/:chapterId
// Removes a single chapter from the user's selection.
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
