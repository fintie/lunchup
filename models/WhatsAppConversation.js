const mongoose = require('mongoose');

const whatsappConversationSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    default: null,
    index: true
  },
  currentEventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
  currentRegistrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EventRegistration',
    default: null
  },
  state: {
    type: String,
    default: 'idle',
    enum: ['idle', 'awaiting_event', 'awaiting_name', 'awaiting_confirmation', 'confirmed', 'subscribed', 'stopped']
  },
  lastInboundText: {
    type: String,
    default: ''
  },
  lastOutboundText: {
    type: String,
    default: ''
  },
  profileName: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('WhatsAppConversation', whatsappConversationSchema);
