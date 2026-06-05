const mongoose = require('mongoose');

const whatsappMessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WhatsAppConversation',
    default: null,
    index: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    required: true
  },
  twilioMessageSid: {
    type: String,
    default: ''
  },
  body: {
    type: String,
    default: ''
  },
  mediaUrls: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    default: 'received'
  },
  rawPayload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

whatsappMessageSchema.index({ twilioMessageSid: 1 });
whatsappMessageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('WhatsAppMessage', whatsappMessageSchema);
