import React, { useState, useEffect } from 'react';
import axios from 'axios';
import HarnessFlow from './HarnessFlow';
import './Sessions.css';

function Sessions({ user }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHarness, setShowHarness] = useState(false);
  const [regenerating, setRegenerating] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `/projects/user/${user._id}`,
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
  }, []);

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
                          <h4>✅ Tasks</h4>
                          <ul className="task-list">
                            {plan.taskBreakdown.map((task, i) => (
                              <li key={i}>
                                <input type="checkbox" id={`task-${session._id}-${i}`} />
                                <label htmlFor={`task-${session._id}-${i}`}>{task}</label>
                              </li>
                            ))}
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

                  <div className="session-card-footer">
                    <span className="session-date">
                      Created {new Date(session.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRegenerate(session._id)}
                      disabled={regenerating === session._id}
                    >
                      {regenerating === session._id ? 'Regenerating...' : '✨ Regenerate Plan'}
                    </button>
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
