const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    enum: ['Motivation', 'Funny', 'Savage', 'Discipline'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Quote', quoteSchema);
