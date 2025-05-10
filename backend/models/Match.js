const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  status: {
    type: String,
    enum: ['pending', 'matched', 'rejected'],
    default: 'pending'
  },
  compatibilityScore: {
    type: Number,
    min: 0,
    max: 100
  },
  matchFactors: {
    interests: Number,
    location: Number,
    age: Number,
    preferences: Number
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  },
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Match', matchSchema); 