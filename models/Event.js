const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  source: { type: String, required: true },
  sourceEventId: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, default: null },
  timezone: { type: String, default: 'Australia/Sydney' },
  venueName: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, required: true, trim: true },
  state: { type: String, default: '' },
  country: { type: String, default: 'Australia' },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  categoryJson: {
    categories: [{ type: String }]
  },
  audienceJson: {
    audience: [{ type: String }],
    personas: [{ type: String }]
  },
  priceMin: { type: Number, default: null },
  priceMax: { type: Number, default: null },
  url: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  organizer: { type: String, default: '' },
  rawPayload: { type: mongoose.Schema.Types.Mixed, default: {} },
  contentHash: { type: String, required: true, unique: true },
  qualityScore: { type: Number, default: 0 }
}, { timestamps: true });

eventSchema.index({ city: 1, startTime: 1 });
eventSchema.index({ source: 1, sourceEventId: 1 }, { unique: true });

module.exports = mongoose.model('Event', eventSchema);
