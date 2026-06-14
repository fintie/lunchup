const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  location: {
    type: String,
    default: '',
    trim: true
  },
  meetingPoint: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled'],
    default: 'scheduled'
  }
}, { timestamps: true });

meetingSchema.index({ host: 1, date: 1 });
meetingSchema.index({ attendees: 1, date: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);
