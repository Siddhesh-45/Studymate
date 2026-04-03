const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const { getAvailability, saveAvailability } = require('../controllers/availabilityController');

// GET  /api/availability   → fetch student's weekly study hours
router.get('/', auth, getAvailability);

// POST /api/availability   → save / update student's weekly study hours
router.post('/', auth, saveAvailability);

module.exports = router;
