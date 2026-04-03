const Course = require('../models/Course');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/schedule/generate
//
// Generates a day-by-day study plan for the logged-in student.
//
// Algorithm:
//   1. Fetch all APPROVED courses (not just student-owned ones)
//      → so admin-imported playlist courses appear in the schedule
//   2. Collect every PENDING topic across all approved courses
//   3. Sort topics by deadline ascending (most urgent first)
//   4. Allocate topics into days with MAX 4 hours/day
//   5. If a topic doesn't fit in the remaining hours of a day, SPLIT it:
//      → part goes today, the rest carries forward to the next day
//   6. Return an array of day objects, each with a date + tasks list
//
// BUG FIX vs original:
//   Original: Course.find({ userId: req.user.id })
//     → students only saw courses THEY created (missed admin-imported ones)
//   Fixed:    Course.find({ status: 'approved' })
//     → students see ALL approved courses including admin-imported playlists
// ─────────────────────────────────────────────────────────────────────────────
exports.generateSchedule = async (req, res) => {
  try {
    // ── Step 1: Get all approved courses ─────────────────────────────────────
    // Include courses from ALL users (admin-imported playlists included)
    const courses = await Course.find({ status: 'approved' });

    // ── Step 2: Collect every pending topic ──────────────────────────────────
    const pendingTasks = [];

    courses.forEach((course) => {
      course.topics.forEach((topic) => {
        if (topic.status === 'pending') {
          pendingTasks.push({
            courseId:       course._id,
            courseName:     course.courseName,
            topicId:        topic._id,
            title:          topic.title,
            youtubeUrl:     topic.youtubeUrl || '',
            deadline:       topic.deadline,
            estimatedHours: topic.estimatedHours,
            originalHours:  topic.estimatedHours,   // keep original for split display
          });
        }
      });
    });

    // ── Step 3: Sort by deadline ascending (urgent first) ────────────────────
    pendingTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    // ── Step 4: Allocate tasks into days ─────────────────────────────────────
    const MAX_HOURS_PER_DAY = 4;
    const schedule          = [];
    let currentDayTasks     = [];
    let currentDayHours     = 0;

    // Start from the beginning of today
    const currentDayDate = new Date();
    currentDayDate.setHours(0, 0, 0, 0);

    // Work on a copy so we can mutate estimatedHours for splits
    const tasksToProcess = pendingTasks.map((t) => ({ ...t }));

    while (tasksToProcess.length > 0) {
      const task = tasksToProcess[0];

      if (currentDayHours + task.estimatedHours <= MAX_HOURS_PER_DAY) {
        // Whole task fits in today
        currentDayTasks.push({ ...task, allocatedHours: task.estimatedHours });
        currentDayHours += task.estimatedHours;
        tasksToProcess.shift();
      } else if (currentDayHours < MAX_HOURS_PER_DAY) {
        // Partial fit: fill remaining hours today, carry the rest forward
        const hoursAvailable = MAX_HOURS_PER_DAY - currentDayHours;
        currentDayTasks.push({ ...task, allocatedHours: hoursAvailable });
        // Reduce remaining hours on this task for next day
        tasksToProcess[0].estimatedHours = parseFloat(
          (task.estimatedHours - hoursAvailable).toFixed(2)
        );
        currentDayHours = MAX_HOURS_PER_DAY;
      } else {
        // Day is already full — move to next day
        if (currentDayTasks.length > 0) {
          schedule.push({
            date:       new Date(currentDayDate),
            totalHours: currentDayHours,
            tasks:      currentDayTasks,
          });
        }
        currentDayTasks = [];
        currentDayHours = 0;
        currentDayDate.setDate(currentDayDate.getDate() + 1);
        // Don't shift — reprocess same task on new day
        continue;
      }

      // Flush day when full or no tasks left
      if (currentDayHours >= MAX_HOURS_PER_DAY || tasksToProcess.length === 0) {
        if (currentDayTasks.length > 0) {
          schedule.push({
            date:       new Date(currentDayDate),
            totalHours: currentDayHours,
            tasks:      currentDayTasks,
          });
        }
        currentDayTasks = [];
        currentDayHours = 0;
        currentDayDate.setDate(currentDayDate.getDate() + 1);
      }
    }

    // ── Step 5: Return schedule ───────────────────────────────────────────────
    res.json(schedule);
  } catch (error) {
    console.error('generateSchedule error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
