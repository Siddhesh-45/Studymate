const StudentCourse = require('../models/StudentCourse');

// ─────────────────────────────────────────────────────────────────────────────
// Service: getSelectedCourses
//
// Fetches ONLY the courses a student has explicitly selected (added to
// "My Courses"). Uses the StudentCourse join collection — never queries
// the global Course collection directly.
//
// @param  {string} userId   — The authenticated student's _id
// @returns {Array}          — Array of populated Course documents
//                             (null entries filtered out for safety)
//
// Query used:
//   StudentCourse.find({ studentId: userId }).populate('courseId')
//
// ─────────────────────────────────────────────────────────────────────────────
async function getSelectedCourses(userId) {
  // Step 1: Find all StudentCourse entries for this user
  //         Each entry has: { studentId, courseId (ref), progress, completedLessons }
  const studentCourses = await StudentCourse
    .find({ studentId: userId })   // ONLY this student's selections
    .populate('courseId')          // join → full Course document
    .lean();                       // plain JS objects (faster, no Mongoose overhead)

  // Step 2: Extract the populated Course documents from each entry
  //         Filter out any where the course was deleted from Course collection
  const courses = studentCourses
    .filter(sc => sc.courseId != null)   // skip orphaned entries
    .map(sc => ({
      ...sc.courseId,                    // spread all Course fields
      studentCourseId:  sc._id,         // the StudentCourse doc _id (useful for patch)
      progress:         sc.progress,    // student's progress %
      completedLessons: sc.completedLessons, // array of completed topic IDs
    }));

  return courses;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service: getSelectedCourseIds
//
// Returns ONLY the array of courseId strings — lightweight version
// when you just need IDs (e.g., for schedule filtering).
//
// Query used:
//   StudentCourse.find({ studentId: userId }, 'courseId')
//
// ─────────────────────────────────────────────────────────────────────────────
async function getSelectedCourseIds(userId) {
  const entries = await StudentCourse
    .find({ studentId: userId }, 'courseId')  // project only courseId field
    .lean();

  return entries.map(sc => String(sc.courseId));
}

// ─────────────────────────────────────────────────────────────────────────────
// Service: getSelectedCoursesWithEnrollment
//
// Returns both the StudentCourse enrollment record AND the populated Course —
// needed when logic requires both enrollment metadata and course content.
//
// Query used:
//   StudentCourse.find({ studentId: userId }).populate('courseId')
//
// ─────────────────────────────────────────────────────────────────────────────
async function getSelectedCoursesWithEnrollment(userId) {
  const studentCourses = await StudentCourse
    .find({ studentId: userId })
    .populate('courseId')
    .lean();

  return studentCourses.filter(sc => sc.courseId != null);
}

// ─────────────────────────────────────────────────────────────────────────────
// Service: getPendingLessons
//
// For each of the student's selected courses, fetches all topics then
// EXCLUDES any that appear in the student's completedLessons array.
//
// Returns a flat array of pending topic objects ready for scheduling:
// [
//   {
//     courseId, courseName,
//     topicId, title, youtubeUrl,
//     deadline, estimatedHours,
//     studentCourseId   ← for patching completion later
//   }, ...
// ]
//
// ── Filtering logic ──────────────────────────────────────────────────────────
//
//  BEFORE (all topics from a course):
//   topics = [
//     { _id: "t1", title: "Intro to JS" },          ← completed
//     { _id: "t2", title: "Variables & Scope" },    ← completed
//     { _id: "t3", title: "Async / Await" },        ← PENDING ✓
//     { _id: "t4", title: "Promises" },             ← PENDING ✓
//   ]
//  completedLessons = ["t1", "t2"]
//
//  AFTER (filtered — only pending):
//   [
//     { topicId: "t3", title: "Async / Await",  ... },
//     { topicId: "t4", title: "Promises",       ... },
//   ]
//
// ─────────────────────────────────────────────────────────────────────────────
async function getPendingLessons(userId) {
  // Fetch selected courses with enrollment metadata
  const enrollments = await getSelectedCoursesWithEnrollment(userId);

  const pending = [];

  enrollments.forEach((sc) => {
    const course           = sc.courseId;                      // populated Course doc
    const completedSet     = new Set(sc.completedLessons || []); // O(1) lookup
    const allTopics        = course.topics || [];

    // ── Core filter: keep only topics NOT in completedLessons ──────────────
    const pendingTopics = allTopics.filter(
      (topic) => !completedSet.has(String(topic._id))
    );

    // ── Map to flat scheduling shape ───────────────────────────────────────
    pendingTopics.forEach((topic) => {
      pending.push({
        courseId:        String(course._id),
        courseName:      course.courseName,
        studentCourseId: String(sc._id),   // needed to PATCH complete-lesson later
        topicId:         String(topic._id),
        title:           topic.title,
        youtubeUrl:      topic.youtubeUrl || '',
        deadline:        topic.deadline,
        estimatedHours:  topic.estimatedHours,
        allocatedHours:  topic.estimatedHours, // scheduling algo may split this
      });
    });
  });

  return pending;
}

module.exports = {
  getSelectedCourses,
  getSelectedCourseIds,
  getSelectedCoursesWithEnrollment,
  getPendingLessons,
};
