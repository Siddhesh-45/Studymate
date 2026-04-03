const Course           = require('../models/Course');
const StudentCourse    = require('../models/StudentCourse');  // ← TASK 6: scheduling uses only selected courses
const UserAvailability = require('../models/UserAvailability');
const DynamicSchedule  = require('../models/DynamicSchedule');

// Task 4: difficulty classification
const {
  getDifficulty,
  DIFFICULTY_CONFIG,
  DIFFICULTY_ORDER,
} = require('../utils/difficultyMap');

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: day-of-week name for display
// ─────────────────────────────────────────────────────────────────────────────
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: midnight of a date
// ─────────────────────────────────────────────────────────────────────────────
function midnight(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: add N days to a date
// ─────────────────────────────────────────────────────────────────────────────
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE SCHEDULING ALGORITHM  (Task 4 enhanced: difficulty-aware)
//
// Inputs:
//   pendingTasks   — array of topic objects, each has a `difficulty` field
//   weeklyHours    — array of 7 numbers (0=Sun … 6=Sat), each = available hrs
//   sessionDuration — max hours per session block
//   startDate      — Date object for day 0
//
// Output:
//   array of day objects { date, totalHours, availableHours, tasks[] }
//
// Rules:
//   1. Each day gets at most weeklyHours[dayOfWeek] hours
//   2. Topics are allocated in order provided (sort happens before calling this)
//   3. A topic that doesn't fully fit is SPLIT across days
//   4. Days with 0 available hours are SKIPPED
//   5. Buffer: 90% of available time used (avoid overloading)
//
//   ── NEW in Task 4 ──────────────────────────────────────────────────────────
//   6. Per-day topic COUNT limit based on difficulty of topics in that day:
//      Hard   → max 1 distinct topic per day  (cognitively heavy)
//      Medium → max 2 distinct topics per day
//      Easy   → max 3 distinct topics per day
//      Limit is set by the HARDEST topic in that day's tasks.
// ─────────────────────────────────────────────────────────────────────────────
function buildSchedule(pendingTasks, weeklyHours, sessionDuration, startDate) {
  const days      = [];
  const tasks     = pendingTasks.map((t) => ({ ...t })); // mutable copy
  let   dayOffset = 0;
  const MAX_DAYS  = 90; // safety cap

  while (tasks.length > 0 && dayOffset < MAX_DAYS) {
    const date      = midnight(addDays(startDate, dayOffset));
    const dow       = date.getDay();
    const available = weeklyHours[dow] || 0;

    dayOffset++;

    // Skip busy / college days
    if (available <= 0) continue;

    // Apply 10% buffer — never fully pack a day
    const usable = parseFloat((available * 0.9).toFixed(2));

    let hoursLeft        = usable;
    const dayTasks       = [];
    const uniqueTopicIds = new Set(); // track distinct topic IDs scheduled today

    while (tasks.length > 0 && hoursLeft > 0.1) {
      const task   = tasks[0];
      const needed = task.allocatedHours ?? task.estimatedHours;

      // ── Task 4: Difficulty-based topic count limit ─────────────────────────
      // Find the hardest difficulty among tasks ALREADY in today + this candidate
      const allDiffs = [
        ...dayTasks.map((t) => t.difficulty || 'Medium'),
        task.difficulty || 'Medium',
      ];
      const hardestOrder = Math.max(...allDiffs.map((d) => DIFFICULTY_ORDER[d] || 2));
      const hardestLabel = Object.keys(DIFFICULTY_ORDER).find(
        (k) => DIFFICULTY_ORDER[k] === hardestOrder
      ) || 'Medium';
      const maxTopics = DIFFICULTY_CONFIG[hardestLabel]?.maxTopicsPerDay ?? 2;

      // If this is a new (unseen) topic and we've already hit the limit → stop this day
      const isNewTopic = !uniqueTopicIds.has(String(task.topicId));
      if (isNewTopic && uniqueTopicIds.size >= maxTopics) {
        break; // day is full on topic count — move to next day
      }

      // ── Hour-based allocation ──────────────────────────────────────────────
      if (needed <= hoursLeft) {
        // Entire task fits
        dayTasks.push({
          ...task,
          allocatedHours: parseFloat(needed.toFixed(2)),
          status:         'pending',
        });
        if (isNewTopic) uniqueTopicIds.add(String(task.topicId));
        hoursLeft = parseFloat((hoursLeft - needed).toFixed(2));
        tasks.shift();
      } else {
        // Split: allocate what fits today, rest carries to next day
        dayTasks.push({
          ...task,
          allocatedHours: parseFloat(hoursLeft.toFixed(2)),
          status:         'pending',
        });
        if (isNewTopic) uniqueTopicIds.add(String(task.topicId));
        tasks[0] = {
          ...task,
          allocatedHours: parseFloat((needed - hoursLeft).toFixed(2)),
          estimatedHours: parseFloat((needed - hoursLeft).toFixed(2)),
        };
        hoursLeft = 0;
      }
    }

    if (dayTasks.length > 0) {
      days.push({
        date,
        availableHours: available,
        totalHours:     parseFloat((usable - hoursLeft).toFixed(2)),
        tasks:          dayTasks,
      });
    }
  }

  return days;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/schedule/availability
// Returns the student's saved availability profile
// If none saved yet, returns sensible defaults
// ─────────────────────────────────────────────────────────────────────────────
exports.getAvailability = async (req, res) => {
  try {
    let avail = await UserAvailability.findOne({ userId: req.user.id });

    // Return defaults if first time
    if (!avail) {
      avail = {
        weeklyHours:     [2, 2, 2, 2, 2, 4, 4],
        sessionDuration: 1,
        priority:        'deadline',
      };
    }

    res.json(avail);
  } catch (err) {
    console.error('getAvailability error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/schedule/availability
// Save or update the student's availability profile
// Body: { weeklyHours: [2,2,2,2,2,4,4], sessionDuration: 1, priority: 'deadline' }
// ─────────────────────────────────────────────────────────────────────────────
exports.saveAvailability = async (req, res) => {
  try {
    const { weeklyHours, sessionDuration, priority } = req.body;

    // Validate weeklyHours
    if (!Array.isArray(weeklyHours) || weeklyHours.length !== 7) {
      return res.status(400).json({ message: 'weeklyHours must be an array of 7 numbers' });
    }
    if (weeklyHours.some((h) => typeof h !== 'number' || h < 0 || h > 12)) {
      return res.status(400).json({ message: 'Each hour value must be between 0 and 12' });
    }

    const avail = await UserAvailability.findOneAndUpdate(
      { userId: req.user.id },
      { weeklyHours, sessionDuration: sessionDuration || 1, priority: priority || 'deadline' },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ message: 'Availability saved successfully', availability: avail });
  } catch (err) {
    console.error('saveAvailability error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/schedule/generate-smart
// Generates a personalised schedule using the student's availability
// Saves result to DynamicSchedule collection
// Returns the full schedule
// ─────────────────────────────────────────────────────────────────────────────
exports.generateSmartSchedule = async (req, res) => {
  try {
    const userId = req.user.id;

    // ── 1. Load availability (fallback to defaults) ───────────────────────
    const avail = await UserAvailability.findOne({ userId }) || {
      weeklyHours:     [2, 2, 2, 2, 2, 4, 4],
      sessionDuration: 1,
      priority:        'deadline',
    };

    // ── 2. Fetch ONLY student's selected courses from StudentCourse ──────────
    // ⚠️  RULE: scheduling ONLY uses "My Courses" — never all courses
    const { selectedCourseIds } = req.body; 
    
    const query = { studentId: userId };
    if (selectedCourseIds && Array.isArray(selectedCourseIds) && selectedCourseIds.length > 0) {
      // Specifically filter the StudentCourse results to only include the dropdown selection
      query.courseId = { $in: selectedCourseIds };
    }

    const myStudentCourses = await StudentCourse.find(query)
      .populate('courseId');
    const courses = myStudentCourses
      .map((sc) => sc.courseId)
      .filter(Boolean); // skip any whose course was deleted

    // ── 3. Collect pending topics (Task 4: auto-detect difficulty) ───────────
    const pending = [];
    myStudentCourses.forEach((studentCourse) => {
      const course = studentCourse.courseId;
      if (!course) return;

      const completedTopics = studentCourse.completedLessons || [];

      course.topics.forEach((topic) => {
        // A topic is "pending" if it has NOT been marked completed yet
        if (!completedTopics.includes(topic._id.toString())) {
          // getDifficulty() inspects the topic title against keyword map
          const difficulty = getDifficulty(topic.title);

          pending.push({
            courseId:       course._id,
            courseName:     course.courseName,
            topicId:        topic._id,
            title:          topic.title,
            youtubeUrl:     topic.youtubeUrl || '',
            deadline:       topic.deadline,
            estimatedHours: topic.estimatedHours,
            originalHours:  topic.estimatedHours,
            allocatedHours: topic.estimatedHours,
            difficulty,   // ← NEW: stored in DynamicSchedule task, shown in UI
          });
        }
      });
    });

    // ── 4. Sort by priority ───────────────────────────────────────────────
    if (avail.priority === 'deadline') {
      // Most urgent first
      pending.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    } else if (avail.priority === 'difficulty') {
      // ── Task 4: Easy → Medium → Hard progression ────────────────────────
      // Primary: difficulty order (Easy=1, Medium=2, Hard=3)
      // Secondary: deadline (so topics of same difficulty are deadline-sorted)
      pending.sort((a, b) => {
        const da = DIFFICULTY_ORDER[a.difficulty] || 2;
        const db = DIFFICULTY_ORDER[b.difficulty] || 2;
        if (da !== db) return da - db; // Easy before Medium before Hard
        return new Date(a.deadline) - new Date(b.deadline);
      });
      console.log(`[generateSmart] Difficulty sort: ${
        pending.slice(0, 5).map(t => `${t.title}(${t.difficulty})`).join(', ')
      }...`);

    } else {
      // Balanced: interleave topics from different courses
      const byCourse = {};
      pending.forEach((t) => {
        const key = String(t.courseId);
        if (!byCourse[key]) byCourse[key] = [];
        byCourse[key].push(t);
      });
      const groups   = Object.values(byCourse);
      const balanced = [];
      const maxLen   = Math.max(...groups.map((g) => g.length));
      for (let i = 0; i < maxLen; i++) {
        groups.forEach((g) => { if (g[i]) balanced.push(g[i]); });
      }
      pending.splice(0, pending.length, ...balanced);
    }

    // ── 5. Run the scheduling algorithm ──────────────────────────────────
    const days = buildSchedule(
      pending,
      avail.weeklyHours,
      avail.sessionDuration,
      new Date()
    );

    // ── 6. Upsert the DynamicSchedule document ────────────────────────────
    const saved = await DynamicSchedule.findOneAndUpdate(
      { userId },
      {
        generatedAt:       new Date(),
        totalPendingTasks: pending.length,
        days,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.log(`[generateSmart] User:${userId} → ${days.length} days, ${pending.length} tasks`);

    res.json({
      message:   `Schedule generated: ${days.length} study days across ${pending.length} topics`,
      schedule:  saved,
    });
  } catch (err) {
    console.error('generateSmartSchedule error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/schedule/smart
// Returns the student's current saved DynamicSchedule
// If none exists, auto-generates one first
// ─────────────────────────────────────────────────────────────────────────────
exports.getSmartSchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    let schedule = await DynamicSchedule.findOne({ userId });

    // First time — auto-generate
    if (!schedule) {
      // Delegate to generate function but return result directly
      req.autoGenerated = true;
      return exports.generateSmartSchedule(req, res);
    }

    res.json({ schedule, autoGenerated: false });
  } catch (err) {
    console.error('getSmartSchedule error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/schedule/task/:taskId
// Mark a scheduled task as 'completed' or 'missed'
//
// Body: { status: 'completed' | 'missed' }
//
// Logic:
//   completed → mark it done, task disappears from future view
//   missed    → mark it missed, then find the task and reschedule it:
//               copy the task to the next available day in the schedule
// ─────────────────────────────────────────────────────────────────────────────
exports.updateTaskStatus = async (req, res) => {
  try {
    const userId   = req.user.id;
    const taskId   = req.params.taskId;
    const { status } = req.body;

    if (!['completed', 'missed'].includes(status)) {
      return res.status(400).json({ message: 'status must be "completed" or "missed"' });
    }

    // Find the student's schedule
    const schedule = await DynamicSchedule.findOne({ userId });
    if (!schedule) {
      return res.status(404).json({ message: 'No schedule found. Please generate one first.' });
    }

    // Find the task inside any day
    let foundTask   = null;
    let foundDayIdx = -1;

    for (let d = 0; d < schedule.days.length; d++) {
      const task = schedule.days[d].tasks.find((t) => String(t._id) === taskId);
      if (task) {
        foundTask   = task;
        foundDayIdx = d;
        break;
      }
    }

    if (!foundTask) {
      return res.status(404).json({ message: 'Task not found in schedule.' });
    }

    // Update the task status
    foundTask.status = status;

    // ── Reschedule missed tasks ────────────────────────────────────────────
    if (status === 'missed') {
      const missedDate = schedule.days[foundDayIdx].date;

      // Find the next available day AFTER the missed day
      let rescheduled = false;
      for (let d = foundDayIdx + 1; d < schedule.days.length; d++) {
        const targetDay  = schedule.days[d];
        const avail      = await UserAvailability.findOne({ userId });
        const weeklyHours = avail?.weeklyHours || [2, 2, 2, 2, 2, 4, 4];
        const dow         = new Date(targetDay.date).getDay();
        const dayCapacity = weeklyHours[dow] * 0.9;
        const dayUsed     = targetDay.tasks
          .filter((t) => t.status !== 'missed')
          .reduce((sum, t) => sum + (t.allocatedHours || 0), 0);
        const remaining   = parseFloat((dayCapacity - dayUsed).toFixed(2));

        if (remaining >= 0.5) {
          // There's room — add the missed task here
          const rescheduledTask = {
            ...foundTask.toObject(),
            _id:             undefined,   // new ID
            status:          'pending',
            rescheduledFrom: missedDate,
            allocatedHours:  Math.min(foundTask.allocatedHours, remaining),
          };
          targetDay.tasks.push(rescheduledTask);
          targetDay.totalHours = parseFloat((dayUsed + rescheduledTask.allocatedHours).toFixed(2));
          rescheduled = true;
          console.log(`[reschedule] Task "${foundTask.title}" moved from ${missedDate} to ${targetDay.date}`);
          break;
        }
      }

      // If no existing day had room, create a new day at the end
      if (!rescheduled && schedule.days.length > 0) {
        const lastDay    = schedule.days[schedule.days.length - 1];
        const nextDate   = addDays(lastDay.date, 1);
        schedule.days.push({
          date:           midnight(nextDate),
          availableHours: 4,
          totalHours:     foundTask.allocatedHours,
          tasks: [{
            ...foundTask.toObject(),
            _id:             undefined,
            status:          'pending',
            rescheduledFrom: missedDate,
          }],
        });
        console.log(`[reschedule] Task "${foundTask.title}" added to new day ${nextDate}`);
      }
    }

    // Save the updated schedule
    schedule.markModified('days');
    await schedule.save();

    res.json({
      message:  `Task marked as ${status}${status === 'missed' ? ' and rescheduled' : ''}`,
      taskId,
      status,
    });
  } catch (err) {
    console.error('updateTaskStatus error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};
