const express          = require('express');
const router           = express.Router();
const scheduleCtrl     = require('../controllers/scheduleController');
const dynamicCtrl      = require('../controllers/dynamicScheduleController');
const auth             = require('../middleware/authMiddleware');

// All schedule routes require login
router.use(auth);

// ── Original static schedule (kept for backward compat) ──────────────────────
// GET /api/schedule/generate
router.get('/generate', scheduleCtrl.generateSchedule);

// ── Availability (student's weekly time profile) ──────────────────────────────
// GET  /api/schedule/availability   → load saved availability
// POST /api/schedule/availability   → save / update availability
router.get('/availability',  dynamicCtrl.getAvailability);
router.post('/availability', dynamicCtrl.saveAvailability);

// ── Dynamic smart schedule ────────────────────────────────────────────────────
// GET  /api/schedule/smart          → get saved schedule (auto-generates if none)
// POST /api/schedule/generate-smart → regenerate schedule from scratch
router.get('/smart',           dynamicCtrl.getSmartSchedule);
router.post('/generate-smart', dynamicCtrl.generateSmartSchedule);

// ── Task status update (completed / missed + auto-reschedule) ─────────────────
// PATCH /api/schedule/task/:taskId
router.patch('/task/:taskId', dynamicCtrl.updateTaskStatus);

// ── Task 7: Topic-level completion (marks ALL slots of a topic as done) ────────
// POST /api/schedule/complete-topic
router.post('/complete-topic', dynamicCtrl.markTopicComplete);

module.exports = router;
