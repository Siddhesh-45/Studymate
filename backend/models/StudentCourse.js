const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// StudentCourse — maps which student selected which course.
// Created when a student clicks "Add to My Courses".
// References the Course model (admin-imported via YouTube playlist).
// ─────────────────────────────────────────────────────────────────────────────
const studentCourseSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedLessons: {
      type: [String],   // stores topic._id strings
      default: [],
    },
  },
  { timestamps: true }
);

// Unique constraint: one student cannot add the same course twice
studentCourseSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('StudentCourse', studentCourseSchema);
