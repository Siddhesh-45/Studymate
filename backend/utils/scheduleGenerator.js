// ─────────────────────────────────────────────────────────────────────────────
// scheduleGenerator.js
//
// Generates a 7-day weekly study schedule from a lesson pool and the
// student's daily availability (UserAvailability.weeklyHours).
//
// Exported function:
//   generateWeeklySchedule(lessonPool, weeklyHours) → Array
//
// ─────────────────────────────────────────────────────────────────────────────

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Fisher-Yates shuffle (in-place, returns array)
// Ensures lessons aren't always scheduled in the same order.
// ─────────────────────────────────────────────────────────────────────────────
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: pick the next eligible lesson from the pool for a given dayIndex
//
// Rules checked here:
//   1. ⛔ 2-day gap  — lesson wasn't assigned in the last 2 days
//   2. 🔁 Course mix — prefer a different course than the last task of the day
//
// Returns the index inside `pool` of the chosen lesson, or -1 if none fits.
// ─────────────────────────────────────────────────────────────────────────────
function pickLesson(pool, dayIndex, lastAssignedDay, lastCourseOnDay) {
  // First pass: respect BOTH the 2-day gap AND course-mix preference
  for (let i = 0; i < pool.length; i++) {
    const lesson = pool[i];
    const lastDay = lastAssignedDay[lesson.lessonId];

    // ⛔ Rule 1: skip if assigned within the last 2 days
    if (lastDay !== undefined && dayIndex - lastDay < 2) continue;

    // 🔁 Rule 2: prefer a different course (soft rule — first pass only)
    if (lesson.courseId === lastCourseOnDay) continue;

    return i; // fits both rules
  }

  // Second pass: relax course-mix rule but keep the 2-day gap hard rule
  for (let i = 0; i < pool.length; i++) {
    const lesson = pool[i];
    const lastDay = lastAssignedDay[lesson.lessonId];

    if (lastDay !== undefined && dayIndex - lastDay < 2) continue;

    return i; // fits the hard rule at least
  }

  return -1; // no eligible lesson found for this day
}

// ─────────────────────────────────────────────────────────────────────────────
// generateWeeklySchedule
//
// @param  {Array}  lessonPool   — output of buildLessonPool()
//                                 [{ courseId, lessonId, title, duration }]
// @param  {Array}  weeklyHours  — 7 numbers from UserAvailability.weeklyHours
//                                 index 0 = Sunday … 6 = Saturday
//                                 value = hours available that day
//
// @returns {Array}  schedule in the output format:
//   [
//     { day: "Monday",  tasks: [{ courseId, lessonId, title, duration }] },
//     { day: "Tuesday", tasks: [...] },
//     ...
//   ]
//   Only days with at least one lesson assigned are included.
//
// ─────────────────────────────────────────────────────────────────────────────
function generateWeeklySchedule(lessonPool, weeklyHours) {
  // ── Guard: nothing to schedule ────────────────────────────────────────────
  if (!lessonPool || lessonPool.length === 0) return [];
  if (!weeklyHours || weeklyHours.length !== 7) {
    // Default: 2h each day if availability is missing
    weeklyHours = [2, 2, 2, 2, 2, 2, 2];
  }

  // ── Step 1: Shuffle the pool so the order is randomised each generation ───
  const pool = shuffle([...lessonPool]); // shallow clone so original is untouched

  // ── Step 2: Initialise tracking structures ────────────────────────────────

  // schedule map: day-name → tasks[]
  const scheduleMap = {};
  DAYS.forEach((d) => (scheduleMap[d] = []));

  // lastAssignedDay[lessonId] = dayIndex when the lesson was last scheduled
  const lastAssignedDay = {};

  // ── Step 3: Loop over each day ────────────────────────────────────────────
  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const day = DAYS[dayIndex];

    // Convert hours → minutes (Rule: ⛔ DO NOT exceed daily limit)
    let availableMinutes = Math.round((weeklyHours[dayIndex] || 0) * 60);

    if (availableMinutes <= 0) continue; // student not available today

    // Track the last course assigned TODAY to enable course mixing
    let lastCourseOnDay = null;

    // ── WHILE there is time left AND lessons remain ────────────────────────
    while (availableMinutes > 0 && pool.length > 0) {
      const idx = pickLesson(pool, dayIndex, lastAssignedDay, lastCourseOnDay);

      // No eligible lesson at all → break out of this day
      if (idx === -1) break;

      const lesson = pool[idx];

      // ⛔ Rule: DO NOT exceed daily limit
      //    If the lesson is longer than remaining time, skip it and
      //    try the next candidate (push-back handled by NOT removing it)
      if (lesson.duration > availableMinutes) {
        // Try to find a shorter lesson that fits
        let fitted = false;
        for (let j = 0; j < pool.length; j++) {
          if (j === idx) continue;
          const candidate = pool[j];
          const cLastDay = lastAssignedDay[candidate.lessonId];
          if (cLastDay !== undefined && dayIndex - cLastDay < 2) continue;
          if (candidate.duration <= availableMinutes) {
            // Use this shorter lesson instead
            pool.splice(j, 1);
            scheduleMap[day].push({ ...candidate });
            availableMinutes -= candidate.duration;
            lastAssignedDay[candidate.lessonId] = dayIndex;
            lastCourseOnDay = candidate.courseId;
            fitted = true;
            break;
          }
        }
        if (!fitted) break; // nothing fits remaining time → move to next day
        continue;
      }

      // ── Assign the lesson ────────────────────────────────────────────────
      pool.splice(idx, 1);                        // remove from pool
      scheduleMap[day].push({ ...lesson });       // add to day's tasks
      availableMinutes -= lesson.duration;        // deduct time
      lastAssignedDay[lesson.lessonId] = dayIndex; // record which day
      lastCourseOnDay = lesson.courseId;           // track last course
    }
  }

  // ── Step 4: Build the output array (skip empty days) ─────────────────────
  const schedule = DAYS
    .filter((day) => scheduleMap[day].length > 0)
    .map((day) => ({
      day,
      tasks: scheduleMap[day],
    }));

  return schedule;
}

module.exports = { generateWeeklySchedule };
