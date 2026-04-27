const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    participants: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            default: 'Member'
        }
    }],
    status: {
        type: String,
        enum: ['draft', 'active', 'completed'],
        default: 'draft'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdFromMeeting: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meeting'
    }
});

module.exports = mongoose.model('ProjectSession', projectSchema);