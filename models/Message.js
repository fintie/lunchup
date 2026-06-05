const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId:          { type: mongoose.Schema.Types.Mixed, required: true },
  receiverId:        { type: mongoose.Schema.Types.Mixed, required: true },
  senderName:        { type: String, required: true },
  receiverName:      { type: String, required: true },
  senderAvatar:      String,
  content:           { type: String, required: true },
  type:              { type: String, enum: ['message', 'connection_request'], default: 'message' },
  connectionStatus:  { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  read:              { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
