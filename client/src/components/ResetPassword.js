import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`/auth/reset-password/${token}`, {
        password: formData.password
      });

      setSuccess(res.data?.message || 'Password updated successfully. Redirecting to sign in...');
      setTimeout(() => navigate('/login', { replace: true }), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password.');
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
        <div className="auth-card animate-scaleIn">
          <div className="auth-header">
            <h1>Reset password</h1>
            <p>Choose a new password for your LunchUp account.</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <span className="alert-icon">✅</span>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="password" className="form-label">New password</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter a new password"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-input"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your new password"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner-small"></span>
                  Updating password...
                </span>
              ) : (
                'Reset password'
              )}
            </button>
          </form>

          <p className="auth-footer">
            <Link to="/login">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
