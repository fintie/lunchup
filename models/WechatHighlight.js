const mongoose = require('mongoose');

const wechatHighlightSchema = new mongoose.Schema({
  sourceMessageId: { type: String, required: true, unique: true, trim: true },
  roomName: { type: String, required: true, trim: true, maxlength: 120 },
  authorName: { type: String, default: 'Anonymous', trim: true, maxlength: 80 },
  content: { type: String, required: true, trim: true, maxlength: 2000 },
  messageTimestamp: { type: Date, required: true },
  source: { type: String, default: 'wechat', enum: ['wechat'] }
}, { timestamps: true });

wechatHighlightSchema.index({ messageTimestamp: -1 });

module.exports = mongoose.model('WechatHighlight', wechatHighlightSchema);
