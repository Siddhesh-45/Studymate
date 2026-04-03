const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const ctrl    = require('../controllers/studentCoursesController');

// GET  /api/courses          → list logged-in user's added courses
router.get('/',      auth, ctrl.getCourses);

// POST /api/user/courses/select → Bulk strict selection
router.post('/select',     auth, ctrl.selectCourses);

module.exports = router;
