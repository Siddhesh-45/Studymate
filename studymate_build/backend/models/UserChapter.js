const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// UserChapter — chapters a specific student has selected with deadlines.
// Used as input for the scheduler.
// ─────────────────────────────────────────────────────────────────────────────
const userChapterSchema = new mongoose.Schema(
  {
    userId: {
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
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
    },
  },
  { timestamps: true }
);

// A user can only select a chapter once
userChapterSchema.index({ userId: 1, chapterId: 1 }, { unique: true });

module.exports = mongoose.model('UserChapter', userChapterSchema);
