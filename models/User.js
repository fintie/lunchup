const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  professionalBackground: {
    type: String,
    required: true
  },
  skills: [{
    type: String,
    required: true
  }],
  preferredTopics: [{
    type: String,
    required: true
  }],
  preferredLocation: {
    type: String,
    required: true
  },
  preferredMeetingPoint: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('User', userSchema);
