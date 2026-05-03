const express = require('express');
const router = express.Router();
const { generateProjectPlan } = require('../utils/aiClient');

router.post('/generate', async (req, res) => {
    const {
        title,
        description,
        participants
    } = req.body;
    try {
        const plan = await generateProjectPlan(title, description, participants);
        res.json({ success: true, plan });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
