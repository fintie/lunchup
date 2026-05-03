const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ProjectSession = require('../models/ProjectSession');
const User = require('../models/User');
const { generateProjectPlan } = require('../utils/aiClient');

// In-memory demo store (used when MongoDB is not connected)
const demoProjects = new Map();
let demoIdCounter = 1;

function isMongoConnected() {
    return mongoose.connection.readyState === 1;
}

function makeDemoProject(data) {
    const id = String(demoIdCounter++);
    const project = {
        _id: id,
        title: data.title || 'Untitled Project',
        description: data.description || '',
        participants: data.participants || [],
        createdFromMeeting: data.createdFromMeeting || null,
        aiPlan: data.aiPlan || null,
        harnessStatus: data.harnessStatus || (data.aiPlan ? 'confirmed' : 'pending'),
        status: 'draft',
        createdAt: new Date().toISOString()
    };
    demoProjects.set(id, project);
    return project;
}

// Create new project
router.post('/', async (req, res) => {
    const { title, description, participants, createdFromMeeting, aiPlan, harnessStatus } = req.body;
    try {
        if (!isMongoConnected()) {
            return res.status(201).json(makeDemoProject({ title, description, participants, createdFromMeeting, aiPlan, harnessStatus }));
        }
        const project = new ProjectSession({
            title, description, participants, createdFromMeeting,
            aiPlan,
            harnessStatus: harnessStatus || (aiPlan ? 'confirmed' : 'pending')
        });
        const savedProject = await project.save();
        res.status(201).json(savedProject);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get projects of user
router.get('/user/:userId', async (req, res) => {
    try {
        if (!isMongoConnected()) {
            const all = Array.from(demoProjects.values());
            return res.json(all);
        }
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        const userProjects = await ProjectSession.find({ 'participants.userId': userId });
        res.json(userProjects);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get single project
router.get('/:id', async (req, res) => {
    try {
        if (!isMongoConnected()) {
            const project = demoProjects.get(req.params.id);
            if (!project) return res.status(404).json({ message: 'Project not found' });
            return res.json(project);
        }
        const project = await ProjectSession.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update status
router.put('/:id/status', async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['draft', 'active', 'completed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }
    try {
        if (!isMongoConnected()) {
            const project = demoProjects.get(req.params.id);
            if (!project) return res.status(404).json({ message: 'Project not found' });
            project.status = status;
            return res.json(project);
        }
        const project = await ProjectSession.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Regenerate AI plan
router.post('/:id/regenerate', async (req, res) => {
    try {
        if (!isMongoConnected()) {
            const project = demoProjects.get(req.params.id);
            if (!project) return res.status(404).json({ message: 'Project not found' });
            project.aiPlan = await generateProjectPlan(project.title, project.description, []);
            project.harnessStatus = 'generated';
            return res.json(project);
        }
        const project = await ProjectSession.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        project.aiPlan = await generateProjectPlan(project.title, project.description, []);
        project.harnessStatus = 'generated';
        await project.save();
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
