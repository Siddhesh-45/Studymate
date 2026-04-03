const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const { generateQuiz } = require('../controllers/quizController');

// GET /api/quiz/generate/:courseId/:lessonId
// Authenticated students only — generates 15 MCQs via Gemini
router.get('/generate/:courseId/:lessonId', auth, generateQuiz);

module.exports = router;
