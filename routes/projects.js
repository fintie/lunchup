const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ProjectSession = require('../models/ProjectSession');
const User = require('../models/User');
const { generateProjectPlan } = require('../utils/aiClient');
const { calculateReputation } = require('../utils/reputationCalculator');

// In-memory demo store (used when MongoDB is not connected)
const demoProjects = new Map();
let demoIdCounter = 1;

// Pre-seed demo projects
const seedDemoProjects = [
  {
    _id: 'demo_project_1',
    title: 'AI Meetup Platform',
    description: 'A platform for Sydney AI community to find and host meetups',
    participants: [{ userId: 'demo_0', role: 'Builder' }],
    aiPlan: {
      projectIdea: 'Build a web app that helps AI enthusiasts find local meetups and collaborate on projects.',
      roles: ['Builder', 'Designer'],
      taskBreakdown: ['Set up React frontend', 'Build event listing API', 'Add user authentication', 'Deploy to Render'],
      nextSteps: ['Meet again this week', 'Split tasks by role', 'Launch beta in 2 weeks']
    },
    harnessStatus: 'confirmed',
    status: 'active',
    completedTasks: ['Set up React frontend', 'Build event listing API'],
    timeline: [
      { action: 'project_created', userId: 'demo_0', detail: 'AI Meetup Platform created', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
      { action: 'task_completed', userId: 'demo_0', detail: 'Set up React frontend', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
      { action: 'task_completed', userId: 'demo_0', detail: 'Build event listing API', createdAt: new Date(Date.now() - 86400000).toISOString() }
    ],
    github: { repoUrl: 'https://github.com/demo/ai-meetup-platform', repoName: 'ai-meetup-platform', issuesCreated: [], prUrl: null },
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    _id: 'demo_project_2',
    title: 'LunchUp Mobile App',
    description: 'Native mobile app for LunchUp networking',
    participants: [{ userId: 'demo_0', role: 'Product Thinker' }],
    aiPlan: {
      projectIdea: 'A React Native app that brings the LunchUp experience to mobile.',
      roles: ['Builder', 'Product Thinker'],
      taskBreakdown: ['Design wireframes', 'Set up React Native project', 'Integrate LunchUp API'],
      nextSteps: ['Define MVP scope', 'Start with login screen', 'Test on both iOS and Android']
    },
    harnessStatus: 'confirmed',
    status: 'draft',
    completedTasks: [],
    timeline: [
      { action: 'project_created', userId: 'demo_0', detail: 'LunchUp Mobile App created', createdAt: new Date(Date.now() - 86400000).toISOString() }
    ],
    github: { repoUrl: null, repoName: null, issuesCreated: [], prUrl: null },
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];
seedDemoProjects.forEach(p => demoProjects.set(p._id, p));

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
        completedTasks: [],
        timeline: [{ action: 'project_created', userId: null, detail: data.title || 'Project created', createdAt: new Date().toISOString() }],
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
        if (status === 'completed') {
            for (const participant of project.participants) {
                const uid = participant.userId;
                const user = await User.findById(uid);
                if (!user) continue;
                const projects = await ProjectSession.find({ 'participants.userId': uid });
                const newScore = calculateReputation(user, projects);
                await User.findByIdAndUpdate(uid, { $set: { reputationScore: newScore } });
            }
        }
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Complete a task
router.put('/:id/tasks/complete', async (req, res) => {
    const { taskText, userId } = req.body;
    if (!taskText) return res.status(400).json({ message: 'taskText is required' });
    try {
        if (!isMongoConnected()) {
            const project = demoProjects.get(req.params.id);
            if (!project) return res.status(404).json({ message: 'Project not found' });
            project.completedTasks = project.completedTasks || [];
            project.completedTasks.push(taskText);
            return res.json(project);
        }
        const project = await ProjectSession.findByIdAndUpdate(
            req.params.id,
            { $push: {
                completedTasks: taskText,
                timeline: { action: 'task_completed', userId, detail: taskText }
            }},
            { new: true }
        );
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Recalculate reputation for all participants
        for (const participant of project.participants) {
            const uid = participant.userId;
            const user = await User.findById(uid);
            if (!user) continue;
            const projects = await ProjectSession.find({ 'participants.userId': uid });
            const newScore = calculateReputation(user, projects);
            await User.findByIdAndUpdate(uid, { $set: { reputationScore: newScore } });
        }
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Append a timeline event manually
router.post('/:id/timeline', async (req, res) => {
    const { action, userId, detail } = req.body;
    if (!action) return res.status(400).json({ message: 'action is required' });
    try {
        if (!isMongoConnected()) {
            const project = demoProjects.get(req.params.id);
            if (!project) return res.status(404).json({ message: 'Project not found' });
            project.timeline = project.timeline || [];
            project.timeline.push({ action, userId, detail, createdAt: new Date().toISOString() });
            return res.json(project);
        }
        const project = await ProjectSession.findByIdAndUpdate(
            req.params.id,
            { $push: { timeline: { action, userId, detail } } },
            { new: true }
        );
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

router.demoProjects = demoProjects;
module.exports = router;
