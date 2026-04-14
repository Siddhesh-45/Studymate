const StudentCourse = require('../models/StudentCourse');
const Course        = require('../models/Course');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/courses
// Returns ALL courses added by admin (for the "All Courses" page).
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({}).sort({ createdAt: -1 });
    res.json({ courses });
  } catch (err) {
    console.error('getAllCourses error:', err);
    res.status(500).json({ message: 'Server error fetching courses.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/student-courses
// Add a course to the logged-in student's personal list.
// Body: { courseId }
// Prevents duplicates — returns 409 if already added.
// ─────────────────────────────────────────────────────────────────────────────
exports.addToMyCourses = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { courseId } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({ message: 'studentId and courseId are required.' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    const exists = await StudentCourse.findOne({ studentId, courseId });
    if (exists) {
      return res.status(400).json({ message: 'Course already added' });
    }

    const newEntry = await StudentCourse.create({
      studentId,
      courseId,
      completedLessons: []
    });

    res.status(200).json({
      message: 'Course added to your list successfully!',
      studentCourse: newEntry,
    });
  } catch (err) {
    console.error('addToMyCourses error:', err);
    res.status(500).json({ message: err.message || 'Server error adding course.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/student-courses
// Returns ONLY courses the logged-in student has personally selected.
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyCourses = async (req, res) => {
  try {
    const studentId = req.user.id;
    const enrolments = await StudentCourse.find({ studentId })
      .populate('courseId')
      .sort({ createdAt: -1 });

    // FILTER NULL COURSES
    const validEnrolments = enrolments.filter(c => c.courseId !== null);

    // Enrich each enrolment with computed progress stats
    const courses = validEnrolments.map((entry) => {
      const totalLessons     = entry.courseId?.topics?.length ?? 0;
      const completedCount   = entry.completedLessons?.length ?? 0;
      const progress         = totalLessons > 0
        ? Math.round((completedCount / totalLessons) * 100)
        : 0;

      return {
        _id:              entry._id,
        courseId:         entry.courseId,
        completedLessons: entry.completedLessons,
        completedCount,
        totalLessons,
        progress,
        createdAt:        entry.createdAt,
      };
    });

    res.json({ courses });
  } catch (err) {
    console.error('getMyCourses error:', err);
    res.status(500).json({ message: 'Server error fetching your courses.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/student-courses/:studentId
// Returns selected courses for a specific studentId.
// Security: student can only query their own ID. Admin can query any.
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyCoursesById = async (req, res) => {
  try {
    const requestedId = req.params.studentId;
    const callerId    = req.user.id;
    const callerRole  = req.user.role;

    if (callerRole !== 'admin' && callerId !== requestedId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const myCourses = await StudentCourse.find({ studentId: requestedId })
      .populate('courseId')
      .sort({ createdAt: -1 });

    // FILTER NULL COURSES
    const validCourses = myCourses.filter(c => c.courseId !== null);

    res.json({ courses: validCourses });
  } catch (err) {
    console.error('getMyCoursesById error:', err);
    res.status(500).json({ message: 'Server error fetching courses.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/student-courses/:id
// Remove a course from the student's personal list.
// ":id" = StudentCourse document _id
//
// Rules:
//   - Student can only remove their OWN entries
//   - Returns 404 if entry not found
//   - Returns 403 if trying to remove another student's entry
// ─────────────────────────────────────────────────────────────────────────────
exports.removeCourse = async (req, res) => {
  try {
    const callerId        = req.user.id;
    const studentCourseId = req.params.id;

    const studentCourse = await StudentCourse.findById(studentCourseId);
    if (!studentCourse) {
      return res.status(404).json({ message: 'Course entry not found.' });
    }

    // Security: student can only remove their own courses
    if (studentCourse.studentId.toString() !== callerId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    await StudentCourse.findByIdAndDelete(studentCourseId);

    res.json({ message: 'Course removed from your list.', id: studentCourseId });
  } catch (err) {
    console.error('removeCourse error:', err);
    res.status(500).json({ message: 'Server error removing course.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/student-courses/:id/progress
// Update progress for a specific StudentCourse entry.
// Body: { progress: 0-100 }
// ─────────────────────────────────────────────────────────────────────────────
exports.updateProgress = async (req, res) => {
  try {
    const callerId        = req.user.id;
    const studentCourseId = req.params.id;
    const { progress }    = req.body;

    if (progress === undefined || progress === null) {
      return res.status(400).json({ message: 'progress field is required.' });
    }
    const progressNum = Number(progress);
    if (isNaN(progressNum) || progressNum < 0 || progressNum > 100) {
      return res.status(400).json({ message: 'progress must be a number between 0 and 100.' });
    }

    const studentCourse = await StudentCourse.findById(studentCourseId);
    if (!studentCourse) {
      return res.status(404).json({ message: 'Student course entry not found.' });
    }

    if (studentCourse.studentId.toString() !== callerId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    studentCourse.progress = progressNum;
    await studentCourse.save();

    res.json({
      message:  'Progress updated successfully.',
      id:       studentCourse._id,
      courseId: studentCourse.courseId,
      progress: studentCourse.progress,
    });
  } catch (err) {
    console.error('updateProgress error:', err);
    res.status(500).json({ message: 'Server error updating progress.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/student-courses/:id/complete-lesson
// Toggle a video lesson as completed/uncompleted in the student's enrolment.
// Body: { videoId }  — videoId is the topic._id (string)
// Also auto-recalculates progress (%) based on total topics in the course.
// ─────────────────────────────────────────────────────────────────────────────
exports.completeLesson = async (req, res) => {
  try {
    const callerId        = req.user.id;
    const studentCourseId = req.params.id;
    const { videoId }     = req.body;

    if (!videoId) {
      return res.status(400).json({ message: 'videoId is required.' });
    }

    const studentCourse = await StudentCourse.findById(studentCourseId);
    if (!studentCourse) {
      return res.status(404).json({ message: 'Student course entry not found.' });
    }
    if (studentCourse.studentId.toString() !== callerId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const alreadyDone = studentCourse.completedLessons.includes(videoId);
    if (alreadyDone) {
      // Toggle off — remove from list
      studentCourse.completedLessons = studentCourse.completedLessons.filter(id => id !== videoId);
    } else {
      // Toggle on — add to list
      studentCourse.completedLessons.push(videoId);
    }

    // Auto-recalculate progress based on the full course topic count
    const fullCourse = await Course.findById(studentCourse.courseId);
    if (fullCourse && fullCourse.topics.length > 0) {
      studentCourse.progress = Math.round(
        (studentCourse.completedLessons.length / fullCourse.topics.length) * 100
      );
    }

    await studentCourse.save();

    res.json({
      message:          alreadyDone ? 'Lesson unmarked.' : 'Lesson marked as completed!',
      completedLessons: studentCourse.completedLessons,
      progress:         studentCourse.progress,
    });
  } catch (err) {
    console.error('completeLesson error:', err);
    res.status(500).json({ message: 'Server error marking lesson.' });
  }
};
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/courses/:id
// Get a specific course. Only allow access if student is enrolled or user is admin.
// ─────────────────────────────────────────────────────────────────────────────
exports.getCourseById = async (req, res) => {
  try {
    const courseId  = req.params.id;
    const studentId = req.user.id;

    let enrolment = null;
    if (req.user.role !== 'admin') {
      enrolment = await StudentCourse.findOne({ studentId, courseId });
      if (!enrolment) {
        return res.status(403).json({ message: 'Access denied: You have not added this course to My Courses.' });
      }
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    res.json({
      course,
      studentCourseId:  enrolment?._id || null,
      completedLessons: enrolment?.completedLessons || [],
      progress:         enrolment?.progress || 0,
    });
  } catch (err) {
    console.error('getCourseById error:', err);
    res.status(500).json({ message: 'Server error fetching course details.' });
  }
};
