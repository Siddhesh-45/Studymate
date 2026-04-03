const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// MasterCourse — the canonical predefined list of courses.
// Populated once via the seed script; students pick from this list.
// ─────────────────────────────────────────────────────────────────────────────
const masterCourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    youtubePlaylistId: {
      type: String,
      default: '',
    },
    thumbnail: {
      type: String,
      default: '',
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['easy', 'medium', 'hard'],
    },
    subject: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MasterCourse', masterCourseSchema);
