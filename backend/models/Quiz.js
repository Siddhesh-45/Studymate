const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// Quiz Model (Task 12)
// Defines dynamically assigned quizzes bound to a specific course & lesson.
// ─────────────────────────────────────────────────────────────────────────────
const quizSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    lessonId: {
      // NOTE: Maps to the individual topic/lesson's _id inside the Course.topics array
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    questions: [
      {
        question: {
          type: String,
          required: true,
        },
        options: {
          type: [String],
          // Ensure there are multiple choice options
          validate: [
            (val) => val.length >= 2,
            'A quiz question must have at least 2 options'
          ],
        },
        correctAnswer: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

// Ensure a single lesson only mounts exactly one Quiz
quizSchema.index({ courseId: 1, lessonId: 1 }, { unique: true });

module.exports = mongoose.model('Quiz', quizSchema);
