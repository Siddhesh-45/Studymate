const StudentCourse = require('../models/StudentCourse');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/schedule/generate
//
// Generates a day-by-day study plan for the logged-in student.
// ⚠️  ONLY uses courses from the student's "My Courses" list (StudentCourse).
//     Never uses all courses — only selected ones.
//
// Algorithm:
//   1. Fetch student's selected courses via StudentCourse (populated)
//   2. Collect every PENDING topic from those courses only
//   3. Sort topics by deadline ascending (most urgent first)
//   4. Allocate topics into days with MAX 4 hours/day
//   5. If a topic doesn't fit, SPLIT it across days
//   6. Return array of day objects { date, tasks }
// ─────────────────────────────────────────────────────────────────────────────
exports.generateSchedule = async (req, res) => {
  try {
    const userId = req.user.id;

    // ── Step 1: Fetch ONLY student's selected courses ─────────────────────────
    // This enforces the rule: scheduling uses ONLY "My Courses"
    const myStudentCourses = await StudentCourse.find({ studentId: userId })
      .populate('courseId');

    // Extract the actual Course documents (courseId is populated)
    const courses = myStudentCourses
      .map((sc) => sc.courseId)
      .filter(Boolean); // remove any nulls (deleted courses)

    // ── Step 2: Collect every pending topic from selected courses only ─────────
    const pendingTasks = [];

    myStudentCourses.forEach((studentCourse) => {
      const course = studentCourse.courseId;
      if (!course) return;
      
      const completedTopics = studentCourse.completedLessons || [];

      course.topics.forEach((topic) => {
        if (!completedTopics.includes(topic._id.toString())) {
          pendingTasks.push({
            courseId:       course._id,
            courseName:     course.courseName,
            topicId:        topic._id,
            title:          topic.title,
            youtubeUrl:     topic.youtubeUrl || '',
            deadline:       topic.deadline,
            estimatedHours: topic.estimatedHours,
            originalHours:  topic.estimatedHours,
          });
        }
      });
    });

    // ── Step 3: Sort by deadline ascending (urgent first) ─────────────────────
    pendingTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    // ── Step 4: Allocate tasks into days ──────────────────────────────────────
    const MAX_HOURS_PER_DAY = 4;
    const schedule          = [];
    let currentDayTasks     = [];
    let currentDayHours     = 0;

    const currentDayDate = new Date();
    currentDayDate.setHours(0, 0, 0, 0);

    const tasksToProcess = pendingTasks.map((t) => ({ ...t }));

    while (tasksToProcess.length > 0) {
      const task = tasksToProcess[0];

      if (currentDayHours + task.estimatedHours <= MAX_HOURS_PER_DAY) {
        currentDayTasks.push({ ...task, allocatedHours: task.estimatedHours });
        currentDayHours += task.estimatedHours;
        tasksToProcess.shift();
      } else if (currentDayHours < MAX_HOURS_PER_DAY) {
        const hoursAvailable = MAX_HOURS_PER_DAY - currentDayHours;
        currentDayTasks.push({ ...task, allocatedHours: hoursAvailable });
        tasksToProcess[0].estimatedHours = parseFloat(
          (task.estimatedHours - hoursAvailable).toFixed(2)
        );
        currentDayHours = MAX_HOURS_PER_DAY;
      } else {
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
        continue;
      }

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
