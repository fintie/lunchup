import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UserProfile.css';

function UserProfile({ user: currentUser }) {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(location.state?.userData || null);
  const [loading, setLoading] = useState(!location.state?.userData);
  const [projects, setProjects] = useState(location.state?.userData?.projects || []);

  useEffect(() => {
    if (location.state?.userData) return;
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/users/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setProfile(res.data);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId, location.state]);

  useEffect(() => {
    // Skip if we already have projects from state, or this is a frontend-only sample user
    if (location.state?.userData?.projects || userId.startsWith('sample')) return;
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/projects/user/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setProjects(res.data || []);
      } catch {
        // silently ignore — projects are optional
      }
    };
    fetchProjects();
  }, [userId, location.state]);

  const getReputationTier = (score) => {
    if (score >= 100) return 'Top Builder';
    if (score >= 50) return 'Active Builder';
    if (score >= 20) return 'Rising Star';
    return 'New Member';
  };

  const getRoleBadgeClass = (role) => {
    const map = {
      'Builder': 'role-builder',
      'Designer': 'role-designer',
      'AI Engineer': 'role-ai',
      'Product Thinker': 'role-product',
    };
    return map[role] || '';
  };

  if (loading) {
    return (
      <div className="userprofile-page">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="userprofile-page">
        <div className="container">
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <h2>Profile not found</h2>
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const topics = Array.isArray(profile.preferredTopics) ? profile.preferredTopics : [];
  const buildPrefs = Array.isArray(profile.buildPreferences) ? profile.buildPreferences : [];
  const rep = profile.reputationScore || 0;

  return (
    <div className="userprofile-page">
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>

        {/* Header */}
        <div className="up-header">
          <div className="up-avatar">
            {profile.profilePicture ? (
              <img src={profile.profilePicture} alt={profile.name} />
            ) : (
              profile.name?.charAt(0).toUpperCase()
            )}
          </div>
          <div className="up-header-info">
            <h1>{profile.name}</h1>
            <p className="up-background">{profile.professionalBackground || 'Professional'}</p>
            <div className="up-badges">
              {profile.role && (
                <span className={`role-badge ${getRoleBadgeClass(profile.role)}`}>
                  {profile.role}
                </span>
              )}
              {rep > 0 && (
                <span className="reputation-badge">
                  ⭐ {rep} pts · {getReputationTier(rep)}
                </span>
              )}
              {profile.matchScore != null && (
                <span className="match-score-badge">
                  {profile.matchScore}% Match
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="up-body">
          {/* About */}
          {profile.bio && (
            <div className="up-section">
              <h3>About</h3>
              <p className="up-bio">{profile.bio}</p>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div className="up-section">
              <h3>Skills</h3>
              <div className="up-tags">
                {skills.map((s, i) => <span key={i} className="tag">{s}</span>)}
              </div>
            </div>
          )}

          {/* Topics */}
          {topics.length > 0 && (
            <div className="up-section">
              <h3>Interested In</h3>
              <div className="up-tags">
                {topics.map((t, i) => <span key={i} className="tag tag-outline">{t}</span>)}
              </div>
            </div>
          )}

          {/* Build Preferences */}
          {buildPrefs.length > 0 && (
            <div className="up-section">
              <h3>Wants to Build</h3>
              <div className="up-tags">
                {buildPrefs.map((b, i) => <span key={i} className="tag tag-accent">{b}</span>)}
              </div>
            </div>
          )}

          {/* Location */}
          {(profile.preferredLocation || profile.preferredMeetingPoint) && (
            <div className="up-section">
              <h3>Location</h3>
              <div className="up-location">
                <span>📍</span>
                <span>
                  {[profile.preferredLocation, profile.preferredMeetingPoint].filter(Boolean).join(' · ')}
                </span>
              </div>
            </div>
          )}

          {/* Projects Built */}
          {projects.length > 0 && (
            <div className="up-section">
              <h3>Projects Built</h3>
              <div className="up-projects">
                {projects.map((project) => {
                  const total = project.aiPlan?.taskBreakdown?.length || 0;
                  const done = project.completedTasks?.length || 0;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  const myRole = project.participants?.find(
                    p => String(p.userId) === String(userId)
                  )?.role || profile.role;
                  return (
                    <div key={project._id} className="up-project-card">
                      <div className="up-project-top">
                        <div>
                          <div className="up-project-title">{project.title}</div>
                          {project.description && (
                            <div className="up-project-desc">{project.description}</div>
                          )}
                        </div>
                        <span className={`up-project-status status-${project.status}`}>
                          {project.status}
                        </span>
                      </div>

                      <div className="up-project-meta">
                        {myRole && <span className="role-badge role-sm">{myRole}</span>}
                        {project.github?.repoUrl && (
                          <a
                            href={project.github.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="up-github-link"
                          >
                            GitHub →
                          </a>
                        )}
                      </div>

                      {total > 0 && (
                        <div className="up-progress">
                          <div className="up-progress-bar">
                            <div className="up-progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="up-progress-label">{done}/{total} tasks</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Connect CTA */}
          <div className="up-cta">
            {currentUser ? (
              <button
                className="btn btn-primary btn-lg"
                onClick={() => navigate('/meetings')}
              >
                Connect with {profile.name?.split(' ')[0]}
              </button>
            ) : (
              <button
                className="btn btn-primary btn-lg"
                onClick={() => navigate('/register')}
              >
                Sign up to Connect
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
