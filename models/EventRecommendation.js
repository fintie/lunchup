const mongoose = require('mongoose');

const eventRecommendationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  score: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, default: 'recommended' }
}, { timestamps: true });

eventRecommendationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('EventRecommendation', eventRecommendationSchema);
