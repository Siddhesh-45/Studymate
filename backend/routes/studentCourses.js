const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const ctrl    = require('../controllers/studentCoursesController');

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT-COURSES ROUTES  (all require valid token)
// ─────────────────────────────────────────────────────────────────────────────

// GET  /api/student-courses            → student's selected courses (from token)
router.get('/',  auth, ctrl.getMyCourses);

// POST /api/student-courses            → add course to list  Body: { courseId }
router.post('/', auth, ctrl.addToMyCourses);

// PATCH /api/student-courses/:id/progress  → update progress  Body: { progress }
// PATCH /api/student-courses/:id/complete-lesson → mark lesson done  Body: { videoId }
// ⚠ Must be declared BEFORE /:id  and  /:studentId  to avoid route conflicts
router.patch('/:id/progress', auth, ctrl.updateProgress);
router.patch('/:id/complete-lesson', auth, ctrl.completeLesson);

// DELETE /api/student-courses/:id      → remove course from list
// ":id" = StudentCourse document _id
router.delete('/:id', auth, ctrl.removeCourse);

// GET  /api/student-courses/:studentId → selected courses for a student by ID
router.get('/:studentId', auth, ctrl.getMyCoursesById);

module.exports = router;
