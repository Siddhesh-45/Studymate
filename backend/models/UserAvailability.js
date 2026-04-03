const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// UserAvailability — stores a student's weekly study schedule preferences
//
// weeklyHours: array of 7 numbers, one per day
//   index 0 = Sunday, 1 = Monday, ..., 6 = Saturday
//   value = how many hours the student is free to study that day
//   0 = not available (college day / busy)
//
// sessionDuration: preferred study session length in hours (0.5, 1, 1.5, 2)
//   Tasks are broken into chunks of this size per session
//
// priority: 'deadline' | 'balanced'
//   deadline = most urgent topics first (default)
//   balanced = spread topics evenly across subjects
//
// One record per user — upserted on save
// ─────────────────────────────────────────────────────────────────────────────
const userAvailabilitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,        // one availability profile per student
  },

  // Hours available each day — 7 values, index = day of week (0=Sun)
  weeklyHours: {
    type: [Number],
    default: [2, 2, 2, 2, 2, 4, 4],   // default: 2h weekdays, 4h weekends
    validate: {
      validator: (arr) => arr.length === 7 && arr.every((h) => h >= 0 && h <= 12),
      message:   'weeklyHours must have exactly 7 values between 0 and 12',
    },
  },

  // Preferred session block length
  sessionDuration: {
    type:    Number,
    default: 1,
    enum:    [0.5, 1, 1.5, 2],
  },

  // Scheduling priority strategy
  //   deadline   → most urgent topics first (default)
  //   balanced   → spread topics evenly across subjects
  //   difficulty → Easy → Medium → Hard progression (Task 4)
  priority: {
    type:    String,
    default: 'deadline',
    enum:    ['deadline', 'balanced', 'difficulty'],
  },

}, { timestamps: true });

module.exports = mongoose.model('UserAvailability', userAvailabilitySchema);
