const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    // topic title string (used for older topic-based completions)
    topic: {
      type: String,
      default: ''
    },
    // optional lessonId (ObjectId of the lesson inside CourseChapter)
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Prevent double-recording the same topic for the same user+course
progressSchema.index({ userId: 1, courseId: 1, topic: 1 });

module.exports = mongoose.model('Progress', progressSchema);
