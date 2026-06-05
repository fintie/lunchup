const express = require('express');
const router = express.Router();
const { generateProjectPlan, generateChatAssist } = require('../utils/aiClient');
const templates = require('../data/projectTemplates.json');

router.post('/generate', async (req, res) => {
    const {
        title,
        description,
        participants,
        templateId,
        chatHistory
    } = req.body;
    const template = templates.find(t => t.id === templateId);
    let finalDescription = template
        ? `${description}\n\nTemplate: ${template.title}\nSuggested tasks: ${template.defaultTasks.join(', ')}`
        : description;
    if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
        const historyText = chatHistory.slice(-10).map(m => `${m.senderName}: ${m.content}`).join('\n');
        finalDescription += `\n\nContext from the users' chat:\n${historyText}`;
    }
    try {
        const plan = await generateProjectPlan(title, finalDescription, participants);
        res.json({ success: true, plan });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/chat-assist', async (req, res) => {
    const { messages = [], query, partnerName } = req.body;
    const chatHistory = messages.slice(-12).map(m => `${m.senderName}: ${m.content}`).join('\n');
    try {
        const response = await generateChatAssist(chatHistory, query, partnerName);
        res.json({ success: true, response });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
