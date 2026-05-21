const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  userId: {
    type: String,
    default: null,
    index: true
  },
  channel: {
    type: String,
    default: 'whatsapp'
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'pending'
  },
  shareUrl: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

eventRegistrationSchema.index({ eventId: 1, userId: 1, channel: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
