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

module.exports = { generateProjectPlan };

