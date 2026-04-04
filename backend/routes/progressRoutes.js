const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  markTopicComplete,
  getStats,
  getCourseProgress
} = require('../controllers/progressController');

// POST /api/progress/complete   — mark a topic done
router.post('/complete', authMiddleware, markTopicComplete);

// GET  /api/progress/stats      — full dashboard analytics
router.get('/stats', authMiddleware, getStats);

// GET  /api/progress/course/:courseId  — per-course topic breakdown
router.get('/course/:courseId', authMiddleware, getCourseProgress);

module.exports = router;
