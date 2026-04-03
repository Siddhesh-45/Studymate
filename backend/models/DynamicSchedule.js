const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// DynamicSchedule — stores a student's generated schedule
//
// One document per user. Regenerated every time POST /generate-smart is called.
// The `days` array holds every scheduled day with all its tasks.
//
// Task status values:
//   pending   → not yet attempted
//   completed → student marked it done
//   missed    → student marked it missed (auto-rescheduled to next free day)
// ─────────────────────────────────────────────────────────────────────────────

const scheduledTaskSchema = new mongoose.Schema({
  courseId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  courseName:     { type: String },
  topicId:        { type: mongoose.Schema.Types.ObjectId },
  title:          { type: String },
  youtubeUrl:     { type: String, default: '' },
  deadline:       { type: Date },
  allocatedHours: { type: Number },   // hours assigned for THIS day
  originalHours:  { type: Number },   // total estimated hours for this topic

  // ── Difficulty (added for Task 4: Smart AI Study Scheduler) ───────────────
  // Auto-detected from topic title using utils/difficultyMap.js
  // 'Easy' → up to 3 topics/day | 'Medium' → 2/day | 'Hard' → max 1/day
  difficulty: {
    type:    String,
    enum:    ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
  },

  status: {
    type:    String,
    enum:    ['pending', 'completed', 'missed'],
    default: 'pending',
  },
  rescheduledFrom: { type: Date, default: null },  // set when task was moved
}, { _id: true });

const scheduledDaySchema = new mongoose.Schema({
  date:         { type: Date, required: true },
  totalHours:   { type: Number, default: 0 },
  availableHours:{ type: Number, default: 0 },   // how much was available this day
  tasks:        [scheduledTaskSchema],
}, { _id: false });

const dynamicScheduleSchema = new mongoose.Schema({
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    unique:   true,   // one schedule per student
  },
  generatedAt:     { type: Date, default: Date.now },
  totalPendingTasks: { type: Number, default: 0 },
  days:            [scheduledDaySchema],

}, { timestamps: true });

module.exports = mongoose.model('DynamicSchedule', dynamicScheduleSchema);
