const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// StudentCourse — a user's personal "enrolled" course list.
// Strictly references admin-created Course documents. No duplicated fields.
// ─────────────────────────────────────────────────────────────────────────────
const studentCourseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Reference to admin-created Course
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
  },
  { timestamps: true }
);

// Unique constraint: one student cannot add the same master course twice
studentCourseSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('StudentCourse', studentCourseSchema);
