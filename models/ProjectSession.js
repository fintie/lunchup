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
    aiPlan: {
        projectIdea: String,
        taskBreakdown: [String],
        roles: [String],
        nextSteps: [String]
    },
    harnessStatus: {
        type: String,
        enum: ['pending', 'generated', 'confirmed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdFromMeeting: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meeting'
    },
    github: {
        repoUrl: { type: String, default: null },
        repoName: { type: String, default: null },
        issuesCreated: [{ type: String }],
        prUrl: { type: String, default: null },
        linkedAt: { type: Date, default: null }
    },
    timeline: [{
        action: String,
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        detail: String,
        createdAt: { type: Date, default: Date.now } 
    }],
    completedTasks: [{ type: String }]
});

module.exports = mongoose.model('ProjectSession', projectSchema);