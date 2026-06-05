const Anthropic = require('@anthropic-ai/sdk');

async function generateProjectPlan(title, description, participants) {
    if (!process.env.ANTHROPIC_API_KEY) {
        return getMockPlan(title);
    }
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const participantText = participants.map(p => `- ${p.name} (Role: ${p.role || 'Unknown'}): ${(p.skills || []).join(', ')}`).join('\n');
    const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
        role: 'user',
        content: `You are a startup advisor. Given people meeting for the first time, generate a startup MVP plan with role assignments based on their actual skills.
            Title: ${title}
            Description: ${description}
            Participants and their skills:
            ${participantText}
            Assign specific tasks to each person based on their skills. Return ONLY valid JSON with keys: projectIdea (string), taskBreakdown (array of strings with assignee), roles (array of "name: role" strings), nextSteps (array of strings).`
        }]
    });

    const text = message.content[0].text;
    const cleaned = text.replace(/```(?:json)?\n?/g, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.warn('AI response parse failed, using mock plan');
        return getMockPlan(title);
    }
}

function getMockPlan(title) {
    return {
        projectIdea: `A startup MVP based on: ${title}`,
        taskBreakdown: ['Define target users', 'Build landing page', 'Launch beta'],
        roles: ['Product Thinker', 'Builder', 'Designer'],
        nextSteps: ['Meet again this week', 'Split tasks', 'Set a 2-week deadline']
    };
}

async function generateChatAssist(chatHistory, query, partnerName) {
    const fallback = getMockChatAssist(query, partnerName, chatHistory);
    if (!process.env.ANTHROPIC_API_KEY) return fallback;

    try {
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const message = await client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 512,
            messages: [{
                role: 'user',
                content: `You are a helpful assistant embedded in LunchUp, a professional networking app. Two people have been chatting and one of them is asking you for help.

Chat history between the users:
${chatHistory}

User's question to you: ${query}

Give a concise, helpful response (2-4 sentences max). Be friendly and relevant to their conversation context.`
            }]
        });
        return message.content[0].text;
    } catch {
        return fallback;
    }
}

function getMockChatAssist(query, partnerName, chatHistory) {
    const q = query.toLowerCase();
    if (q.includes('project') || q.includes('idea') || q.includes('build')) {
        return `Based on your conversation with ${partnerName}, you two seem to have complementary skills. A great project idea would be to build an AI-powered tool that combines your backgrounds — try using the "Start Project →" button to generate a full plan instantly!`;
    }
    if (q.includes('meet') || q.includes('lunch') || q.includes('coffee') || q.includes('when')) {
        return `For scheduling with ${partnerName}, I'd suggest proposing 2-3 time slots across the next week. Midday Tuesday through Thursday tends to work well for lunch meetings in most Australian CBD areas.`;
    }
    if (q.includes('skill') || q.includes('role') || q.includes('who')) {
        return `Looking at your chat, you and ${partnerName} seem to have different strengths — that's great for collaboration! Consider using the Harness flow to let AI assign roles based on your actual skills.`;
    }
    return `Happy to help! Based on your conversation with ${partnerName}, it looks like you have a solid connection. What specific aspect would you like advice on — project ideas, scheduling, or collaboration approach?`;
}

module.exports = { generateProjectPlan, generateChatAssist };

