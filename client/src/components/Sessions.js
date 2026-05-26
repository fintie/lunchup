import React, { useState, useEffect } from 'react';
import axios from 'axios';
import HarnessFlow from './HarnessFlow';
import './Sessions.css';

function Sessions({ user }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHarness, setShowHarness] = useState(false);
  const [regenerating, setRegenerating] = useState(null);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubError, setGithubError] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `/projects/user/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessions(res.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    const fetchGithubStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/users/me?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } });
        setGithubConnected(!!res.data.githubToken);
      } catch (e) {
        // ignore
      }
    };
    fetchGithubStatus();
  }, []);

  const handleCompleteTask = async (sessionId, taskText) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `/projects/${sessionId}/tasks/complete`,
        { taskText, userId: user?.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessions(prev => prev.map(s => s._id === sessionId ? res.data : s));
    } catch (err) {
      console.error('Complete task failed:', err);
    }
  };

  const handleRegenerate = async (sessionId) => {
    setRegenerating(sessionId);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `/projects/${sessionId}/regenerate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessions(prev => prev.map(s => s._id === sessionId ? res.data : s));
    } catch (err) {
      console.error('Regenerate failed:', err);
    } finally {
      setRegenerating(null);
    }
  };

  const formatTimelineAction = (action) => {
    const map = {
      project_created: '🚀 Project created',
      task_completed: '✅ Task completed',
      github_linked: '🔗 GitHub connected',
      plan_generated: '🤖 AI plan generated',
      status_changed: '🔄 Status updated',
    };
    return map[action] || action;
  };

  const getStatusBadge = (status) => {
    const map = {
      draft:     { label: 'Draft',     color: '#888' },
      active:    { label: 'Active',    color: '#22c55e' },
      completed: { label: 'Completed', color: '#3b82f6' }
    };
    return map[status] || map.draft;
  };

  const getHarnessBadge = (status) => {
    const map = {
      pending:   { label: 'Pending',   bg: '#f3f4f6', color: '#666' },
      generated: { label: 'AI Plan',   bg: '#fef3c7', color: '#d97706' },
      confirmed: { label: 'Confirmed', bg: '#dcfce7', color: '#16a34a' }
    };
    return map[status] || map.pending;
  };

  return (
    <div className="sessions-page">
      <div className="container">
        <div className="sessions-header">
          <div>
            <h1>Projects</h1>
            <p>Your AI-powered collaboration projects</p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => setShowHarness(true)}>
            + New Project
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your projects...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="empty-state animate-scaleIn">
            <div className="empty-icon">🚀</div>
            <h2>No projects yet</h2>
            <p>After a LunchUp meeting, start a guided project with AI — it takes 30 seconds.</p>
            <button className="btn btn-primary btn-lg" onClick={() => setShowHarness(true)}>
              Start Your First Project
            </button>
          </div>
        ) : (
          <div className="sessions-list">
            {sessions.map((session, index) => {
              const statusBadge = getStatusBadge(session.status);
              const harnessBadge = getHarnessBadge(session.harnessStatus);
              const plan = session.aiPlan;

              return (
                <div key={session._id} className="session-card animate-scaleIn" style={{ animationDelay: `${index * 0.08}s` }}>
                  <div className="session-card-header">
                    <div className="session-title-row">
                      <h3>{session.title}</h3>
                      <div className="session-badges">
                        <span className="status-badge" style={{ color: statusBadge.color, borderColor: statusBadge.color }}>
                          {statusBadge.label}
                        </span>
                        <span className="harness-badge" style={{ background: harnessBadge.bg, color: harnessBadge.color }}>
                          {harnessBadge.label}
                        </span>
                      </div>
                    </div>
                    {session.description && (
                      <p className="session-description">{session.description}</p>
                    )}
                  </div>

                  {plan && (
                    <div className="session-plan">
                      {plan.projectIdea && (
                        <div className="plan-block">
                          <h4>💡 Project Idea</h4>
                          <p>{plan.projectIdea}</p>
                        </div>
                      )}

                      {plan.roles && plan.roles.length > 0 && (
                        <div className="plan-block">
                          <h4>👤 Roles</h4>
                          <div className="roles-row">
                            {plan.roles.map((role, i) => (
                              <span key={i} className="role-badge">{role}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {plan.taskBreakdown && plan.taskBreakdown.length > 0 && (
                        <div className="plan-block">
                          <div className="task-header-row">
                            <h4>✅ Tasks</h4>
                            <span className="task-progress-label">
                              {(session.completedTasks || []).length}/{plan.taskBreakdown.length} done
                            </span>
                          </div>
                          <div className="task-progress-bar">
                            <div
                              className="task-progress-fill"
                              style={{ width: `${Math.round(((session.completedTasks || []).length / plan.taskBreakdown.length) * 100)}%` }}
                            />
                          </div>
                          <ul className="task-list">
                            {plan.taskBreakdown.map((task, i) => {
                              const done = (session.completedTasks || []).includes(task);
                              return (
                                <li key={i} className={done ? 'task-done' : ''}>
                                  <input
                                    type="checkbox"
                                    id={`task-${session._id}-${i}`}
                                    checked={done}
                                    disabled={done}
                                    onChange={() => !done && handleCompleteTask(session._id, task)}
                                  />
                                  <label htmlFor={`task-${session._id}-${i}`}>{task}</label>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {plan.nextSteps && plan.nextSteps.length > 0 && (
                        <div className="plan-block">
                          <h4>🚀 Next Steps</h4>
                          <ul className="next-steps-list">
                            {plan.nextSteps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {session.github?.repoUrl ? (
                    <div className="plan-block">
                      <h4>GitHub</h4>
                      <a href={session.github.repoUrl} target="_blank" rel="noreferrer">
                        {session.github.repoName}
                      </a>
                      <p>{session.github.issuesCreated?.length || 0} issues created</p>
                      {!session.github?.prUrl && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={async () => {
                            const token = localStorage.getItem('token');
                            await axios.post('/github/create-pr-draft',
                              { sessionId: session._id, repoName: session.github.repoName },
                              { headers: { Authorization: `Bearer ${token}` } }
                            );
                            fetchProjects();
                          }}
                        >
                          Create Draft PR
                        </button>
                      )}
                      {session.github?.prUrl && (
                        <a href={session.github.prUrl} target="_blank" rel="noreferrer">
                          View Draft PR
                        </a>
                      )}
                    </div>
                  ) : githubConnected ? (
                    <div className="plan-block">
                      {githubError && session._id === githubError.sessionId && (
                        <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '8px' }}>{githubError.msg}</p>
                      )}
                      <button
                        onClick={async () => {
                          setGithubError('');
                          const token = localStorage.getItem('token');
                          const repoName = session.title.replace(/\s+/g, '-');
                          try {
                            await axios.post('/github/create-repo',
                              { sessionId: session._id, repoName },
                              { headers: { Authorization: `Bearer ${token}` } }
                            );
                            await axios.post('/github/create-issues',
                              { sessionId: session._id, repoName, tasks: session.aiPlan?.taskBreakdown },
                              { headers: { Authorization: `Bearer ${token}` } }
                            );
                            fetchProjects();
                          } catch (err) {
                            setGithubError({ sessionId: session._id, msg: err.response?.data?.message || 'GitHub action failed' });
                          }
                        }}
                      >
                        Create Repo + Issues
                      </button>
                    </div>
                  ) : (
                    <div className="plan-block">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          const token = localStorage.getItem('token');
                          window.location.href = `${axios.defaults.baseURL}/github/auth?token=${token}`;
                        }}
                      >
                        Connect GitHub
                      </button>
                    </div>
                  )}

                  {session.timeline && session.timeline.length > 0 && (
                    <div className="plan-block timeline-block">
                      <h4>📋 Timeline</h4>
                      <ul className="timeline-list">
                        {[...session.timeline].reverse().slice(0, 5).map((event, i) => (
                          <li key={i} className="timeline-item">
                            <span className="timeline-action">{formatTimelineAction(event.action)}</span>
                            {event.detail && <span className="timeline-detail"> — {event.detail}</span>}
                            <span className="timeline-date">
                              {new Date(event.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="session-card-footer">
                    <span className="session-date">
                      Created {new Date(session.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {session.status !== 'completed' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={async () => {
                            const token = localStorage.getItem('token');
                            await axios.put(`/projects/${session._id}/status`, { status: 'completed' }, { headers: { Authorization: `Bearer ${token}` } });
                            fetchProjects();
                          }}
                        >
                          Mark Complete
                        </button>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleRegenerate(session._id)}
                        disabled={regenerating === session._id}
                      >
                        {regenerating === session._id ? 'Regenerating...' : '✨ Regenerate Plan'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showHarness && (
        <HarnessFlow
          meeting={null}
          user={user}
          onClose={() => setShowHarness(false)}
          onCreated={() => { setShowHarness(false); fetchProjects(); }}
        />
      )}
    </div>
  );
}

export default Sessions;
