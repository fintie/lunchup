import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Profile.css';

function Profile({ user }) {
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    professionalBackground: '',
    bio: '',
    skills: '',
    preferredTopics: '',
    preferredLocation: '',
    preferredMeetingPoint: '',
    role: '',
    buildPreferences: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [projects, setProjects] = useState([]);
  const [reputationData, setReputationData] = useState(null);

  useEffect(() => {
    // Fetch user profile data
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token && user?.id) {
          const res = await axios.get(`/users/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = res.data;
          setProfile({
            name: data.name || '',
            email: data.email || '',
            professionalBackground: data.professionalBackground || '',
            bio: data.bio || '',
            skills: Array.isArray(data.skills) ? data.skills.join(', ') : '',
            preferredTopics: Array.isArray(data.preferredTopics) ? data.preferredTopics.join(', ') : '',
            preferredLocation: data.preferredLocation || '',
            preferredMeetingPoint: data.preferredMeetingPoint || '',
            role: data.role || '',
            buildPreferences: Array.isArray(data.buildPreferences) ? data.buildPreferences.join(', ') : ''
          });
          // For demo users, use the score embedded in user data directly
          if (user?.id?.startsWith('demo_') && data.reputationScore != null) {
            setReputationData({ score: data.reputationScore, breakdown: null });
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, [user?.id]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token && user?.id) {
          const res = await axios.get(`/projects/user/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setProjects(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      }
    };
    fetchProjects();
  }, [user?.id]);

  useEffect(() => {
    const fetchReputation = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token && user?.id && !user.id.startsWith('demo_')) {
          const res = await axios.get(`/users/${user.id}/reputation`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setReputationData(res.data);
        }
      } catch (err) {
        // ignore — demo users or no DB
      }
    };
    fetchReputation();
  }, [user?.id]);

  const getReputationTier = (score) => {
    if (score >= 100) return 'Top Builder';
    if (score >= 50) return 'Active Builder';
    if (score >= 20) return 'Rising Star';
    return 'New Member';
  };

  const getRoleStats = () => {
    const roleCounts = {};
    projects.forEach(project => {
      const me = project.participants?.find(p => String(p.userId) === String(user?.id));
      if (me?.role) {
        roleCounts[me.role] = (roleCounts[me.role] || 0) + 1;
      }
    });
    return roleCounts;
  };

  const getCollaborators = () => {
    const seen = new Set();
    const result = [];
    projects.forEach(project => {
      project.participants?.forEach(p => {
        const uid = String(p.userId);
        if (uid !== String(user?.id) && !seen.has(uid)) {
          seen.add(uid);
          result.push({ userId: uid, role: p.role });
        }
      });
    });
    return result;
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const updateData = {
        ...profile,
        skills: profile.skills.split(',').map(s => s.trim()).filter(s => s),
        preferredTopics: profile.preferredTopics.split(',').map(t => t.trim()).filter(t => t),
        buildPreferences: profile.buildPreferences.split(',').map(b => b.trim()).filter(b => b)
      };

      const res = await axios.put(`/users/${user.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;
      setProfile(prev => ({
        ...prev,
        role: data.role || prev.role,
        skills: Array.isArray(data.skills) ? data.skills.join(', ') : prev.skills,
        buildPreferences: Array.isArray(data.buildPreferences) ? data.buildPreferences.join(', ') : prev.buildPreferences,
      }));
      if (!user.id.startsWith('demo_')) {
        try {
          const repRes = await axios.get(`/users/${user.id}/reputation`, { headers: { Authorization: `Bearer ${token}` } });
          setReputationData(repRes.data);
        } catch (_) {}
      }
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.photo ? (
              <img src={user.photo} alt={user.name} className="profile-avatar-image" />
            ) : (
              profile.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="profile-title">
            <h1>{profile.name}</h1>
            <p>{profile.professionalBackground || 'Professional'}</p>
            <div className="profile-badges-row">
              {profile.role && <span className="role-badge">{profile.role}</span>}
              {reputationData && (
                <span className="reputation-badge">
                  ⭐ {reputationData.score} pts · {getReputationTier(reputationData.score)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="profile-card animate-scaleIn">
          <h2>Edit Profile</h2>

          {message.text && (
            <div className={`alert alert-${message.type}`}>
              {message.type === 'success' ? '✅' : '⚠️'} {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Professional Background</label>
              <input
                type="text"
                name="professionalBackground"
                value={profile.professionalBackground}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Software Engineer at Tech Co"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                className="form-input form-textarea"
                rows="4"
                placeholder="Tell others about yourself..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Skills</label>
              <input
                type="text"
                name="skills"
                value={profile.skills}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., marketing, development, design"
              />
              <span className="form-hint">Separate multiple skills with commas</span>
            </div>

            <div className="form-group">
              <label className="form-label">Build Preferences</label>
              <input
                type="text"
                name="buildPreferences"
                value={profile.buildPreferences}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., SaaS, Mobile App, AI Tools"
              />
              <span className="form-hint">Separate multiple preferences with commas</span>
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Topics</label>
              <input
                type="text"
                name="preferredTopics"
                value={profile.preferredTopics}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., career coaching, startups, AI"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Preferred Location</label>
                <input
                  type="text"
                  name="preferredLocation"
                  value={profile.preferredLocation}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., Downtown, Midtown"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Meeting Point</label>
                <input
                  type="text"
                  name="preferredMeetingPoint"
                  value={profile.preferredMeetingPoint}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., Central Park"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
            {projects.length > 0 && (
              <div className="profile-section">
                <h3>Projects Built</h3>
                <div className="projects-list">
                  {projects.map((project, i) => {
                    const total = project.aiPlan?.taskBreakdown?.length || 0;
                    const done = project.completedTasks?.length || 0;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    return (
                      <div key={i} className="project-card">
                        <div className="project-card-header">
                          <h4>{project.title}</h4>
                          {project.github?.repoUrl && (
                            <a href={project.github.repoUrl} target="_blank" rel="noreferrer">
                              View on GitHub →
                            </a>
                          )}
                        </div>
                        <p>{project.description}</p>
                        {project.aiPlan?.roles && (
                          <div className="roles-row">
                            {project.aiPlan.roles.map((role, j) => (
                              <span key={j} className="role-badge">{role}</span>
                            ))}
                          </div>
                        )}
                        {total > 0 && (
                          <div className="project-task-progress">
                            <div className="task-progress-header">
                              <span>Tasks</span>
                              <span>{done}/{total} ({pct}%)</span>
                            </div>
                            <div className="task-progress-bar">
                              <div className="task-progress-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {reputationData && Object.keys(getRoleStats()).length > 0 && (
              <div className="profile-section">
                <h3>Roles Played</h3>
                <div className="roles-row">
                  {Object.entries(getRoleStats()).map(([role, count], i) => (
                    <span key={i} className="role-stat-badge">
                      {role} ×{count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {getCollaborators().length > 0 && (
              <div className="profile-section">
                <h3>Collaborators ({getCollaborators().length})</h3>
                <div className="collaborators-row">
                  {getCollaborators().map((c, i) => (
                    <div key={i} className="collaborator-chip">
                      <div className="collaborator-avatar">{String(c.userId).slice(-2).toUpperCase()}</div>
                      <span className="collaborator-role">{c.role || 'Collaborator'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
