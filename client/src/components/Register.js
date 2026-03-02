import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const Register = ({ onAuth }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    professionalBackground: '',
    skills: '',
    preferredTopics: '',
    preferredLocation: '',
    preferredMeetingPoint: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formattedData = {
        ...formData,
        skills: formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill),
        preferredTopics: formData.preferredTopics.split(',').map(topic => topic.trim()).filter(topic => topic)
      };

      const res = await axios.post('/users/register', formattedData);
      const { token, user } = res.data;

      // Store auth data directly
      localStorage.setItem('token', token);
      localStorage.setItem('userName', user.name);
      localStorage.setItem('userEmail', user.email);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Navigate to matches - the App will pick up the token from localStorage
      navigate('/matches', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-gradient"></div>
      </div>
      <div className="auth-container">
        <div className="auth-card auth-card-large animate-scaleIn">
          <div className="auth-header">
            <h1>Create your account</h1>
            <p>Join thousands of professionals building meaningful connections</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name" className="form-label">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="professionalBackground" className="form-label">Professional Background</label>
              <input
                type="text"
                id="professionalBackground"
                name="professionalBackground"
                className="form-input"
                value={formData.professionalBackground}
                onChange={handleChange}
                placeholder="e.g., Software Engineer, Marketing Manager"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="skills" className="form-label">Skills</label>
              <input
                type="text"
                id="skills"
                name="skills"
                className="form-input"
                value={formData.skills}
                onChange={handleChange}
                placeholder="e.g., marketing, development, design"
                required
              />
              <span className="form-hint">Separate multiple skills with commas</span>
            </div>

            <div className="form-group">
              <label htmlFor="preferredTopics" className="form-label">Preferred Topics</label>
              <input
                type="text"
                id="preferredTopics"
                name="preferredTopics"
                className="form-input"
                value={formData.preferredTopics}
                onChange={handleChange}
                placeholder="e.g., career coaching, project collaboration"
                required
              />
              <span className="form-hint">What would you like to discuss over lunch?</span>
            </div>

            <div className="form-row form-row-2">
              <div className="form-group">
                <label htmlFor="preferredLocation" className="form-label">Preferred Location</label>
                <input
                  type="text"
                  id="preferredLocation"
                  name="preferredLocation"
                  className="form-input"
                  value={formData.preferredLocation}
                  onChange={handleChange}
                  placeholder="e.g., Downtown, Midtown"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="preferredMeetingPoint" className="form-label">Meeting Point</label>
                <input
                  type="text"
                  id="preferredMeetingPoint"
                  name="preferredMeetingPoint"
                  className="form-input"
                  value={formData.preferredMeetingPoint}
                  onChange={handleChange}
                  placeholder="e.g., Central Park, Union Square"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner-small"></span>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
