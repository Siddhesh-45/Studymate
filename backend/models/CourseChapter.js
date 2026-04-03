const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// CourseChapter — chapters inside a MasterCourse.
// Created by admin only. Students can select from these.
// ─────────────────────────────────────────────────────────────────────────────
const courseChapterSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MasterCourse',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Chapter title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    order: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { timestamps: true }
);

// Unique title per course
courseChapterSchema.index({ courseId: 1, title: 1 }, { unique: true });

module.exports = mongoose.model('CourseChapter', courseChapterSchema);
