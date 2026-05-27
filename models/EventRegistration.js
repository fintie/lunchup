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
  phoneNumber: {
    type: String,
    default: '',
    index: true
  },
  attendeeName: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  channel: {
    type: String,
    default: 'whatsapp'
  },
  source: {
    type: String,
    default: 'web_button'
  },
  sourceRef: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'draft'
  },
  shareUrl: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WhatsAppConversation',
    default: null
  }
}, { timestamps: true });

eventRegistrationSchema.index({ eventId: 1, phoneNumber: 1, channel: 1 }, { unique: true, sparse: true });
eventRegistrationSchema.index({ phoneNumber: 1, status: 1 });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
