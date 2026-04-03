const express = require('express');
const router  = express.Router();
const authMiddleware  = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const adminController        = require('../controllers/adminController');
const adminContentController = require('../controllers/adminContentController');
const analyticsController    = require('../controllers/analyticsController');

// All routes here require a valid admin token
router.use((req, res, next) => {
  console.log('[admin] request', req.method, req.path);
  next();
});
router.use(authMiddleware);
router.use(adminMiddleware);

// ── User management ───────────────────────────────────────────────────────────
router.get('/users',         adminController.getUsers);
router.patch('/users/:id',   adminController.updateUser);
router.delete('/users/:id',  adminController.deleteUser);

// ── Course management (admin-created YouTube playlist courses) ────────────────
router.get('/courses',                    adminContentController.getAllCourses);
router.post('/courses',                   adminContentController.createCourse);
router.patch('/courses/:id',              adminContentController.updateCourse);
router.delete('/courses/:id',             adminContentController.deleteCourse);
router.post('/courses/import-playlist',   adminContentController.importPlaylist);

// Aliases (for backward-compat with any frontend calls using /content/ prefix)
router.get('/content/courses',                   adminContentController.getAllCourses);
router.post('/content/courses',                  adminContentController.createCourse);
router.patch('/content/courses/:id',             adminContentController.updateCourse);
router.delete('/content/courses/:id',            adminContentController.deleteCourse);
router.post('/content/courses/import-playlist',  adminContentController.importPlaylist);

// ── Analytics & Monitoring ────────────────────────────────────────────────────
router.get('/overview',           analyticsController.getOverview);
router.get('/total-users',        analyticsController.getTotalUsers);
router.get('/active-students',    analyticsController.getActiveStudents);
router.get('/quiz-attempts',      analyticsController.getQuizAttempts);
router.get('/course-completion',  analyticsController.getCourseCompletion);
router.get('/popular-courses',    analyticsController.getPopularCourses);
router.get('/user-growth',        analyticsController.getUserGrowth);
router.get('/learning-patterns',  analyticsController.getLearningPatterns);
router.get('/leaderboard',        analyticsController.getLeaderboard);

module.exports = router;
