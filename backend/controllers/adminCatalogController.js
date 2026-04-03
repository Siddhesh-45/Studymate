const MasterCourse  = require('../models/MasterCourse');
const CourseChapter = require('../models/CourseChapter');

// ─────────────────────────────────────────────────────────────────────────────
// Admin: Manage MasterCourses (predefined course catalog)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/master-courses
exports.getMasterCourses = async (req, res) => {
  try {
    const courses = await MasterCourse.find({}).sort({ title: 1 });
    res.json({ courses });
  } catch (err) {
    console.error('admin getMasterCourses error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/admin/master-courses
// Body: { title, difficulty }
exports.createMasterCourse = async (req, res) => {
  try {
    const { title, difficulty } = req.body;
    if (!title || !difficulty) {
      return res.status(400).json({ message: 'Title and difficulty are required.' });
    }
    const valid = ['easy', 'medium', 'hard'];
    if (!valid.includes(difficulty)) {
      return res.status(400).json({ message: 'Difficulty must be easy, medium, or hard.' });
    }

    const existing = await MasterCourse.findOne({ title: title.trim() });
    if (existing) {
      return res.status(409).json({ message: `Course "${title}" already exists.` });
    }

    const course = await new MasterCourse({ title: title.trim(), difficulty }).save();
    res.status(201).json({ message: 'Course created.', course });
  } catch (err) {
    console.error('admin createMasterCourse error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/admin/master-courses/:id
exports.deleteMasterCourse = async (req, res) => {
  try {
    const course = await MasterCourse.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    // Also remove all chapters for this course
    await CourseChapter.deleteMany({ courseId: req.params.id });
    res.json({ message: `"${course.title}" and its chapters deleted.` });
  } catch (err) {
    console.error('admin deleteMasterCourse error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Admin: Manage CourseChapters
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/chapters?courseId=xxx
exports.getChapters = async (req, res) => {
  try {
    const filter = req.query.courseId ? { courseId: req.query.courseId } : {};
    const chapters = await CourseChapter.find(filter)
      .populate('courseId', 'title difficulty')
      .sort({ courseId: 1, order: 1 });
    res.json({ chapters });
  } catch (err) {
    console.error('admin getChapters error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/admin/chapters
// Body: { courseId, title, order }
exports.createChapter = async (req, res) => {
  try {
    const { courseId, title, order } = req.body;
    if (!courseId || !title) {
      return res.status(400).json({ message: 'courseId and title are required.' });
    }

    const course = await MasterCourse.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    // Auto-set order if not provided
    let ord = order;
    if (!ord) {
      const last = await CourseChapter.findOne({ courseId }).sort({ order: -1 });
      ord = last ? last.order + 1 : 1;
    }

    const chapter = await new CourseChapter({ courseId, title: title.trim(), order: ord }).save();
    res.status(201).json({ message: 'Chapter added.', chapter });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A chapter with this title already exists in this course.' });
    }
    console.error('admin createChapter error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/admin/chapters/:id
exports.deleteChapter = async (req, res) => {
  try {
    const chapter = await CourseChapter.findByIdAndDelete(req.params.id);
    if (!chapter) return res.status(404).json({ message: 'Chapter not found.' });
    res.json({ message: `"${chapter.title}" deleted.` });
  } catch (err) {
    console.error('admin deleteChapter error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};
