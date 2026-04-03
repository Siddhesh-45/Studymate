const mongoose = require("mongoose");

const ProgressSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  courseId: mongoose.Schema.Types.ObjectId,
  completedVideos: [String],
  progress: Number,
  isCompleted: Boolean
});

module.exports = mongoose.model("Progress", ProgressSchema);
