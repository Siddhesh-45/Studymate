const express    = require('express');
const router     = express.Router();
const courseCtrl = require('../controllers/courseController');
const auth       = require('../middleware/authMiddleware');
const adminOnly  = require('../middleware/adminMiddleware');

// ─────────────────────────────────────────────────────────────────────────────
// COURSE ROUTES
// auth      → any logged-in user (student or admin)
// adminOnly → admin only (must come AFTER auth)
// ─────────────────────────────────────────────────────────────────────────────

// ── BOTH ROLES: read ─────────────────────────────────────────────────────────
// Admin  → all courses
// Student → approved courses only
router.get('/', auth, courseCtrl.getCourses);

// Admin-only course list (with user info populated)
router.get('/admin',      auth, adminOnly, courseCtrl.getAllCoursesAdmin);
router.get('/admin-test', auth, adminOnly, courseCtrl.getAllCoursesAdmin);

// ── STUDENT ONLY: mark topic complete ────────────────────────────────────────
// PATCH /api/course/:id/topic/:topicId/toggle
// Flips topic status + writes to CourseProgress
// Admin is explicitly blocked inside this route
router.patch(
  '/:id/topic/:topicId/toggle',
  auth,
  (req, res, next) => {
    if (req.user.role === 'admin') {
      return res.status(403).json({
        message: 'Admins cannot mark topics as completed.',
      });
    }
    next();
  },
  courseCtrl.toggleTopicStatus
);

// ── ADMIN ONLY: create course ─────────────────────────────────────────────────
router.post('/', auth, adminOnly, courseCtrl.createCourse);

// ── ADMIN ONLY: import playlist → NEW course (legacy, kept for compatibility)─
router.post('/import-playlist', auth, adminOnly, courseCtrl.importPlaylist);

// ── ADMIN ONLY: import playlist → EXISTING course ────────────────────────────
// IMPORTANT: This MUST be declared BEFORE router.put('/:id')
// otherwise Express would try to match PUT when it sees /:id
router.post('/:id/import-playlist', auth, adminOnly, courseCtrl.importPlaylistToCourse);

// ── ADMIN ONLY: update course name / topics ───────────────────────────────────
router.put('/:id', auth, adminOnly, courseCtrl.updateCourse);

// ── ADMIN ONLY: delete course ─────────────────────────────────────────────────
router.delete('/:id', auth, adminOnly, courseCtrl.deleteCourse);

module.exports = router;
