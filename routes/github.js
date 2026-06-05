const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Octokit } = require('@octokit/rest');
const ProjectSession = require('../models/ProjectSession');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const { demoUsers } = require('../utils/demoStore');

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

router.get('/auth', (req, res) => {
    const token = req.query.token || req.headers.authorization?.split(' ')[1];
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo&state=${token}`;
    res.redirect(githubAuthUrl);
});

router.get('/callback', async (req, res) => {
    const { code, state } = req.query;
    let userId;
    try {
      const decoded = jwt.verify(state, process.env.JWT_SECRET || 'fallback_secret');
      userId = decoded.userId;
    } catch (err) {
      return res.redirect(`${FRONTEND_URL}/#/projects?error=auth_expired`);
    }
    try {
        const tokenResponse = await axios.post(
            'https://github.com/login/oauth/access_token',
            {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code
            },
            { headers: { Accept: 'application/json' } }
        );

        const accessToken = tokenResponse.data.access_token;
        const githubUserRes = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const githubUsername = githubUserRes.data.login;

        if (userId) {
            if (userId.startsWith('demo_')) {
                const demoUser = Array.from(demoUsers.values()).find(u => u._id === userId);
                if (demoUser) {
                    demoUser.githubToken = accessToken;
                    demoUser.githubUserName = githubUsername;
                    demoUsers.set(demoUser.email, demoUser);
                }
            } else {
                await User.findByIdAndUpdate(userId, {
                    githubToken: accessToken,
                    githubUserName: githubUsername
                });
            }
        }

        res.redirect(`${FRONTEND_URL}/#/projects`);
    } catch (err) {
        console.error('GitHub callback error:', err.message);
        res.redirect(`${FRONTEND_URL}/#/projects?error=github_failed`);
    }
});

async function getUser(userId) {
    if (userId.startsWith('demo_')) {
        return Array.from(demoUsers.values()).find(u => u._id === userId) || null;
    }
    return User.findById(userId);
}

router.post('/create-repo', authMiddleware, async (req, res) => {
    try {
        const { repoName, sessionId } = req.body;
        const user = await getUser(req.userId);
        if (!user?.githubToken) {
            return res.status(401).json({ message: 'GitHub not connected. Please reconnect GitHub.' });
        }
        const octokit = new Octokit({ auth: user.githubToken });

        let repoData;
        try {
            const { data } = await octokit.repos.createForAuthenticatedUser({
                name: repoName,
                description: 'Create with LunchUp ACP',
                private: false,
                auto_init: true
            });
            repoData = data;
        } catch (createErr) {
            if (createErr.status === 422) {
                // Repo already exists — fetch it instead
                const { data } = await octokit.repos.get({
                    owner: user.githubUserName,
                    repo: repoName
                });
                repoData = data;
            } else {
                throw createErr;
            }
        }
        const data = repoData;

        if (sessionId && sessionId.startsWith('demo_')) {
            const projectsRouter = require('./projects');
            const session = projectsRouter.demoProjects?.get(sessionId);
            if (session) {
                session.github = session.github || {};
                session.github.repoUrl = data.html_url;
                session.github.repoName = repoName;
            }
        } else {
            await ProjectSession.findByIdAndUpdate(sessionId, {
                'github.repoUrl': data.html_url,
                'github.repoName': repoName
            });
        }

        res.json({ repoUrl: data.html_url });
    } catch (err) {
        console.error('create-repo error:', err.message, err.status);
        res.status(500).json({ message: 'Failed to create repo' });
    }
})

router.post('/create-issues', authMiddleware, async (req, res) => {
    try {
        const { repoName, tasks, sessionId } = req.body;
        const user = await getUser(req.userId);
        const octokit = new Octokit({ auth: user.githubToken });

        const createdIssues = [];
        for (const task of tasks) {
            try {
                const { data } = await octokit.issues.create({
                    owner: user.githubUserName,
                    repo: repoName,
                    title: task
                });
                createdIssues.push(data.html_url);
            } catch (issueErr) {
                console.warn('Skipping issue (already exists or failed):', task, issueErr.message);
            }
        }

        if (sessionId && sessionId.startsWith('demo_')) {
            const projectsRouter = require('./projects');
            const session = projectsRouter.demoProjects?.get(sessionId);
            if (session) {
                session.github = session.github || {};
                session.github.issuesCreated = createdIssues;
            }
        } else {
            await ProjectSession.findByIdAndUpdate(sessionId, {
                'github.issuesCreated': createdIssues
            });
        }

        res.json({ issues: createdIssues });
    } catch (err) {
        console.error('create-issues', err.message);
        res.status(500).json({ message: 'Failed to create repo' });
    }
})

router.post('/create-pr-draft', authMiddleware, async (req, res) => {
    try {
        const { sessionId, repoName } = req.body;
        const projectsRouter = require('./projects');
        const session = sessionId.startsWith('demo_')
            ? projectsRouter.demoProjects?.get(sessionId)
            : await ProjectSession.findById(sessionId);
        const plan = session.aiPlan;
        const user = await getUser(req.userId);
        const octokit = new Octokit({ auth: user.githubToken });
        const readmeContent = `# ${session.title}
        
        ## Project Idea
        ${plan.projectIdea || 'TBD'}

        ## Roles
        ${plan.roles?.join('\n') || 'TBD'}

        ## Task Breakdown
        ${plan.taskBreakdown?.map(t => `- ${t}`).join('\n') || 'TBD'}

        ## Next Steps
        ${plan.nextSteps?.map(s => `- ${s}`).join('\n') || 'TBD'}
        `;
        const { data: refData } = await octokit.git.getRef({
            owner: user.githubUserName,
            repo: repoName,
            ref: 'heads/main'
        });
        const sha = refData.object.sha;

        // Create branch — skip if already exists
        try {
            await octokit.git.createRef({
                owner: user.githubUserName,
                repo: repoName,
                ref: 'refs/heads/draft/initial-plan',
                sha: sha
            });
        } catch (e) {
            if (e.status !== 422) throw e;
        }

        // Update PLAN.md — get existing sha if file already exists
        let fileSha;
        try {
            const { data: existing } = await octokit.repos.getContent({
                owner: user.githubUserName,
                repo: repoName,
                path: 'PLAN.md',
                ref: 'draft/initial-plan'
            });
            fileSha = existing.sha;
        } catch (e) { /* file doesn't exist yet, that's fine */ }

        await octokit.repos.createOrUpdateFileContents({
            owner: user.githubUserName,
            repo: repoName,
            path: 'PLAN.md',
            message: 'Initial project plan from LunchUp ACP',
            content: Buffer.from(readmeContent).toString('base64'),
            branch: 'draft/initial-plan',
            ...(fileSha ? { sha: fileSha } : {})
        });

        // Create PR or fetch existing one
        let prUrl;
        try {
            const { data: pr } = await octokit.pulls.create({
                owner: user.githubUserName,
                repo: repoName,
                title: `[Draft] ${session.title} - Initial Plan`,
                body: `This PR was automatically generated by LunchUp ACP.\n\nSee the README for the full project plan.`,
                head: 'draft/initial-plan',
                base: 'main',
                draft: true
            });
            prUrl = pr.html_url;
        } catch (e) {
            if (e.status === 422) {
                // PR already exists — find it
                const { data: prs } = await octokit.pulls.list({
                    owner: user.githubUserName,
                    repo: repoName,
                    head: `${user.githubUserName}:draft/initial-plan`,
                    state: 'open'
                });
                prUrl = prs[0]?.html_url;
                if (!prUrl) throw e;
            } else {
                throw e;
            }
        }

        if (sessionId.startsWith('demo_')) {
            const projectsRouter = require('./projects');
            const s = projectsRouter.demoProjects?.get(sessionId);
            if (s) { s.github = s.github || {}; s.github.prUrl = prUrl; }
        } else {
            await ProjectSession.findByIdAndUpdate(sessionId, { 'github.prUrl': prUrl });
        }

        res.json({ prUrl });

    } catch (err) {
        console.error('Create-pr-draft error:', err.message);
        res.status(500).json({ message: 'Failed to create draft PR' });
    }
})

module.exports = router;