const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  videoId: {
    type: String,
    required: true,
    trim: true
  }
});

const AdminCourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    playlistId: {
      type: String,
      required: true,
      trim: true
    },
    videos: [videoSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminCourse", AdminCourseSchema);
