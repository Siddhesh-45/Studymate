const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');
const adminContentController = require('../controllers/adminContentController');
const adminCatalogController = require('../controllers/adminCatalogController');
const analyticsController = require('../controllers/analyticsController');

// All routes here require a valid admin token
router.use((req, res, next) => {
  console.log('[admin] request', req.method, req.path);
  next();
});
router.use(authMiddleware);
router.use(adminMiddleware);

// User management
router.get('/users', adminController.getUsers);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Content management (courses)
router.get('/courses', adminContentController.getAllCourses);
router.get('/content/courses', adminContentController.getAllCourses);
router.post('/courses', adminContentController.createCourse);
router.post('/content/courses', adminContentController.createCourse);
router.patch('/courses/:id', adminContentController.updateCourse);
router.patch('/content/courses/:id', adminContentController.updateCourse);
router.delete('/courses/:id', adminContentController.deleteCourse);
router.delete('/content/courses/:id', adminContentController.deleteCourse);

// Import YouTube playlist (admin content)
router.post('/courses/import-playlist', adminContentController.importPlaylist);
router.post('/content/courses/import-playlist', adminContentController.importPlaylist);

// ── Master Course Catalog & Chapters ──────────────────────────────────────────
router.get('/master-courses',           adminCatalogController.getMasterCourses);
router.post('/master-courses',          adminCatalogController.createMasterCourse);
router.delete('/master-courses/:id',    adminCatalogController.deleteMasterCourse);

router.get('/chapters',                 adminCatalogController.getChapters);
router.post('/chapters',                adminCatalogController.createChapter);
router.delete('/chapters/:id',          adminCatalogController.deleteChapter);

// ── Analytics & Monitoring ──────────────────────────────────────────────────
router.get('/overview',           analyticsController.getOverview);
router.get('/total-users',        analyticsController.getTotalUsers);
router.get('/active-students',    analyticsController.getActiveStudents);
router.get('/quiz-attempts',      analyticsController.getQuizAttempts);
router.get('/course-completion',  analyticsController.getCourseCompletion);
router.get('/popular-courses',    analyticsController.getPopularCourses);
router.get('/user-growth',        analyticsController.getUserGrowth);
router.get('/learning-patterns',  analyticsController.getLearningPatterns);

module.exports = router;
