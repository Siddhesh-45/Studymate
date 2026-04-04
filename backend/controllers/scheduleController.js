const StudentCourse = require('../models/StudentCourse');
const Course = require('../models/Course');
const DynamicSchedule = require('../models/DynamicSchedule');
const { getDifficulty, DIFFICULTY_ORDER } = require('../utils/difficultyMap');

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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/schedule/regenerate
// Task 8: Smart Regeneration + Anti-Overwrite Logic
// ─────────────────────────────────────────────────────────────────────────────
exports.regenerateSchedule = async (req, res) => {
  try {
    const userId = req.user.id;

    // Step 2: Fetch Existing Schedule
    const existingSchedule = await DynamicSchedule.findOne({ userId });
    if (!existingSchedule) {
      return res.status(404).json({ message: 'No existing schedule found' });
    }

    // Step 3: Extract Already Used Topics
    const usedTopics = new Set();
    existingSchedule.days.forEach(day => {
      day.tasks.forEach(task => {
        if (task.title) {
          usedTopics.add(task.title.toLowerCase());
        }
      });
    });

    // Step 4: Fetch Selected Courses
    const studentCourses = await StudentCourse.find({ studentId: userId }).populate('courseId');
    if (!studentCourses || studentCourses.length === 0) {
        return res.json({ message: 'No courses selected', schedule: existingSchedule });
    }

    const courses = studentCourses.map(sc => sc.courseId).filter(Boolean);

    // Get completed topics
    const completedTopics = new Set();
    studentCourses.forEach(sc => {
      if (sc.completedLessons) {
        sc.completedLessons.forEach(id => completedTopics.add(String(id)));
      }
    });

    // Step 5: Filter Topics
    let filteredTopics = [];
    courses.forEach(course => {
      course.topics.forEach(topic => {
        const isCompleted = completedTopics.has(String(topic._id)) || topic.status === 'completed';
        const isAlreadyUsed = usedTopics.has(topic.title.toLowerCase());

        if (!isCompleted && !isAlreadyUsed) {
          filteredTopics.push({
            topic: topic,
            courseId: course._id,
            courseName: course.courseName
          });
        }
      });
    });

    if (filteredTopics.length === 0) {
      return res.json({ message: 'All topics are completed or already scheduled.', schedule: existingSchedule });
    }

    // Step 6: Apply Difficulty Sorting
    filteredTopics.sort((a, b) => {
      const diffA = getDifficulty(a.topic.title);
      const diffB = getDifficulty(b.topic.title);
      const orderA = DIFFICULTY_ORDER[diffA] || 2;
      const orderB = DIFFICULTY_ORDER[diffB] || 2;

      if (orderA !== orderB) return orderA - orderB;
      return new Date(a.topic.deadline) - new Date(b.topic.deadline);
    });

    // Step 7: Smart Regeneration Logic & Step 8: Assign New Topics
    let topicIndex = 0;

    existingSchedule.days.forEach(day => {
      // 1. Fill empty slots if any exist in the array
      day.tasks.forEach((slot, index) => {
        if (!slot.title && topicIndex < filteredTopics.length) {
          const newTopic = filteredTopics[topicIndex];
          day.tasks[index] = {
            ...slot,
            courseId: newTopic.courseId,
            courseName: newTopic.courseName,
            topicId: newTopic.topic._id,
            title: newTopic.topic.title,
            youtubeUrl: newTopic.topic.youtubeUrl || '',
            deadline: newTopic.topic.deadline,
            allocatedHours: newTopic.topic.estimatedHours || 1,
            originalHours: newTopic.topic.estimatedHours || 1,
            difficulty: getDifficulty(newTopic.topic.title),
            status: 'pending'
          };
          topicIndex++;
        }
      });
      
      // 2. Add as new tasks if there is remaining capacity
      const dailyMax = day.availableHours || 4;
      while (day.totalHours < dailyMax && topicIndex < filteredTopics.length) {
        const newTopic = filteredTopics[topicIndex];
        const remainingHours = dailyMax - day.totalHours;
        const assignedHours = Math.min(newTopic.topic.estimatedHours || 1, remainingHours);
        
        day.tasks.push({
            courseId: newTopic.courseId,
            courseName: newTopic.courseName,
            topicId: newTopic.topic._id,
            title: newTopic.topic.title,
            youtubeUrl: newTopic.topic.youtubeUrl || '',
            deadline: newTopic.topic.deadline,
            allocatedHours: assignedHours,
            originalHours: newTopic.topic.estimatedHours || 1,
            difficulty: getDifficulty(newTopic.topic.title),
            status: 'pending'
        });
        
        day.totalHours += assignedHours;
        topicIndex++;
      }
    });

    // If still topics left, append new days
    if (topicIndex < filteredTopics.length) {
        let lastDate = existingSchedule.days.length > 0 
           ? new Date(existingSchedule.days[existingSchedule.days.length - 1].date) 
           : new Date();

        while (topicIndex < filteredTopics.length) {
            lastDate.setDate(lastDate.getDate() + 1);
            const newTopic = filteredTopics[topicIndex];
            const maxDaily = 4;
            const assignedHours = Math.min(newTopic.topic.estimatedHours || 1, maxDaily);

            existingSchedule.days.push({
                date: new Date(lastDate),
                totalHours: assignedHours,
                availableHours: maxDaily,
                tasks: [{
                    courseId: newTopic.courseId,
                    courseName: newTopic.courseName,
                    topicId: newTopic.topic._id,
                    title: newTopic.topic.title,
                    youtubeUrl: newTopic.topic.youtubeUrl || '',
                    deadline: newTopic.topic.deadline,
                    allocatedHours: assignedHours,
                    originalHours: newTopic.topic.estimatedHours || 1,
                    difficulty: getDifficulty(newTopic.topic.title),
                    status: 'pending'
                }]
            });
            topicIndex++;
        }
    }

    // Step 9: Save Updated Schedule
    existingSchedule.markModified('days');
    await existingSchedule.save();

    // Step 10: Return Response
    return res.status(200).json({ 
        message: 'Schedule successfully regenerated!', 
        schedule: existingSchedule 
    });

  } catch (error) {
    console.error('regenerateSchedule error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};
