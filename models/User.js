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
  role: {
    type: String,
    enum: ['Builder', 'Designer', 'AI Engineer', 'Product Thinker'],
    default: 'Builder'
  },
  buildPreferences: [{
    type: String
  }],
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
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
  },
  githubToken: {
    type: String,
    default: null
  },
  githubUserName: {
    type: String,
    default: null
  },
  reputationScore: {
    type: Number,
    default: 0
  },
  collaborators: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectSession' }
  }]
});

module.exports = mongoose.model('User', userSchema);
