const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const ctrl    = require('../controllers/userChapterController');

// GET  /api/courses/:courseId/chapters  — chapters for one of user's enrolled courses
router.get('/courses/:courseId/chapters', auth, ctrl.getChaptersForCourse);

// GET  /api/user/chapters               — all chapters user has selected
router.get('/user/chapters', auth, ctrl.getUserChapters);

// POST /api/user/chapters               — save/upsert chapter selections with deadlines
router.post('/user/chapters', auth, ctrl.saveUserChapters);

// DELETE /api/user/chapters/:chapterId  — remove a single chapter from selection
router.delete('/user/chapters/:chapterId', auth, ctrl.deleteUserChapter);

module.exports = router;
