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
    preferredMeetingPoint: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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
            preferredMeetingPoint: data.preferredMeetingPoint || ''
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, [user?.id]);

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
        preferredTopics: profile.preferredTopics.split(',').map(t => t.trim()).filter(t => t)
      };

      await axios.put(`/users/${user.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
        </div>
      </div>
    </div>
  );
}

export default Profile;
