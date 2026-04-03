const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  // optional YouTube video link associated with the topic
  youtubeUrl: {
    type: String,
    trim: true,
    default: ''
  },
  // optional article link
  article: {
    type: String,
    trim: true,
    default: ''
  },
  deadline: {
    type: Date,
    required: true
  },
  estimatedHours: {
    type: Number,
    required: true,
    min: 0.1
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  }
});

const courseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Populated when course is imported from a YouTube playlist
  youtubePlaylistId: {
    type: String,
    default: '',
    index: true,
  },
  thumbnail: {
    type: String,
    default: '',
  },
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'blocked'],
    default: 'approved'
  },
  topics: [topicSchema]
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
