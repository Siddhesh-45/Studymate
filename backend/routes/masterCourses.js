const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const ctrl    = require('../controllers/studentCoursesController');

// GET /api/master-courses → returns full predefined course list
router.get('/', auth, ctrl.getMasterCourses);

module.exports = router;
