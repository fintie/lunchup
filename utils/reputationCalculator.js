function calculateReputation(user, projects) {
    let score = 0;

    for (const project of projects) {
        if (project.status === 'completed') {
            score += 30;
        }
        if (project.github?.repoUrl) {
            score += 20;
        }
        score += project.completedTasks.length * 5;
    }
    const uniqueCount = new Set(user.collaborators.map(c => c.userId.toString())).size;
    score += uniqueCount * 10;

    const roles = new Set();
    for (const project of projects) {
        const me = project.participants.find(p => p.userId.toString() === user._id.toString());
        if (me) roles.add(me.role);
    }
    if (roles.size > 1) score += 15;
    return score;
}

module.exports = { calculateReputation };