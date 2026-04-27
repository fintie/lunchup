const express = require('express');
const router = express.Router();
const ProjectSession = require('../models/ProjectSession');
const User = require('../models/User');

// Create new project
router.post('/', async (req, res) => {
    try {
        // get data
        const {
            title,
            description,
            participants,
            createdFromMeeting
        } = req.body;

        // create new project
        const project = new ProjectSession({
            title,
            description,
            participants,
            createdFromMeeting
        });

        const savedProject = await project.save();
        res.status(201).json(savedProject);

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get project of user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // find project of user
        const userProject = await ProjectSession.find({ participants: userId });

        res.json(userProject);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get project data
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const project = await ProjectSession.findById(id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = ['draft', 'active', 'completed'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const project = await ProjectSession.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;