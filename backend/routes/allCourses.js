const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const ctrl    = require('../controllers/studentCoursesController');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/courses
// Returns ALL courses imported by admin (for "All Courses" page).
// Students browse this list and click "Add to My Courses".
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', auth, ctrl.getAllCourses);
router.get('/:id', auth, ctrl.getCourseById);

module.exports = router;
