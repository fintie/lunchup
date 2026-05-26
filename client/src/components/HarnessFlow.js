import React, { useState } from 'react';
import axios from 'axios';
import './HarnessFlow.css';

function HarnessFlow({ meeting, user, onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');

  const participants = meeting
    ? [{ name: meeting.with?.name || 'Collaborator', skills: meeting.with?.skills || [], role: meeting.with?.role || '' }, { name: user?.name || 'You', skills: user?.skills || [], role: user?.role || '' }]
    : [{ name: user?.name || 'You', skills: user?.skills || [], role: user?.role || '' }];

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        '/harness/generate',
        { title: idea, description: idea, participants },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlan(res.data.plan);
      setStep(2);
    } catch (err) {
      setError('Failed to generate plan. Showing demo plan instead.');
      setPlan({
        projectIdea: `A startup MVP based on: ${idea}`,
        taskBreakdown: [
          `${participants[0].name}: Define target users and value proposition`,
          `${participants[1]?.name || 'You'}: Build landing page and MVP prototype`,
          'Both: Launch beta and gather feedback'
        ],
        roles: [
          `${participants[0].name}: Product Thinker`,
          `${participants[1]?.name || 'You'}: Builder`
        ],
        nextSteps: ['Meet again this week', 'Split tasks evenly', 'Set a 2-week deadline']
      });
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        '/projects',
        {
          title: idea,
          description: plan.projectIdea,
          participants: [],
          createdFromMeeting: meeting?._id || null,
          aiPlan: plan,
          harnessStatus: 'confirmed'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStep(3);
      if (onCreated) onCreated(res.data);
    } catch (err) {
      setError('Failed to save project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="harness-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="harness-modal">
        <button className="harness-close" onClick={onClose}>✕</button>

        <div className="harness-steps">
          {[1, 2, 3].map(n => (
            <div key={n} className={`harness-step-dot ${step >= n ? 'active' : ''}`}>{n}</div>
          ))}
        </div>

        {step === 1 && (
          <div className="harness-panel">
            <h2>What do you want to build together?</h2>
            <p className="harness-subtitle">
              {meeting
                ? `You met ${meeting.with?.name} — now turn that lunch into a project.`
                : 'Describe your idea and AI will generate a full MVP plan.'}
            </p>
            {meeting && (
              <div className="harness-participants">
                <span>👥 {participants.map(p => p.name).join(' + ')}</span>
              </div>
            )}
            <textarea
              className="harness-input"
              placeholder="e.g. An AI tool that matches freelancers with startup founders in Sydney..."
              value={idea}
              onChange={e => setIdea(e.target.value)}
              rows={4}
            />
            {error && <p className="harness-error">{error}</p>}
            <button
              className="btn btn-primary btn-lg harness-btn"
              onClick={handleGenerate}
              disabled={loading || !idea.trim()}
            >
              {loading ? (
                <span className="harness-loading">
                  <span className="spinner-sm" /> Generating plan...
                </span>
              ) : 'Generate AI Plan →'}
            </button>
          </div>
        )}

        {step === 2 && plan && (
          <div className="harness-panel">
            <h2>Your AI-Generated MVP Plan</h2>
            <p className="harness-subtitle">Review the plan below. Confirm to create your project.</p>

            <div className="plan-section">
              <h3>💡 Project Idea</h3>
              <p className="plan-idea">{plan.projectIdea}</p>
            </div>

            <div className="plan-section">
              <h3>👤 Roles</h3>
              <div className="plan-roles">
                {plan.roles.map((role, i) => (
                  <span key={i} className="role-badge">{role}</span>
                ))}
              </div>
            </div>

            <div className="plan-section">
              <h3>✅ Task Breakdown</h3>
              <ul className="plan-tasks">
                {plan.taskBreakdown.map((task, i) => (
                  <li key={i}>{task}</li>
                ))}
              </ul>
            </div>

            <div className="plan-section">
              <h3>🚀 Next Steps</h3>
              <ul className="plan-next">
                {plan.nextSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>

            {error && <p className="harness-error">{error}</p>}

            <div className="harness-actions">
              <button className="btn btn-secondary" onClick={() => { setStep(1); setPlan(null); setError(''); }}>
                ← Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Confirm & Create Project →'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="harness-panel harness-success">
            <div className="success-icon">🎉</div>
            <h2>Project Created!</h2>
            <p>Your AI-generated project plan is saved. Head to Projects to see it.</p>
            <div className="harness-actions">
              <button className="btn btn-secondary" onClick={onClose}>Close</button>
              <a href="#/projects" className="btn btn-primary" onClick={onClose}>
                View Projects →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HarnessFlow;
