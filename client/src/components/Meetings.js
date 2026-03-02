import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Meetings.css';

function Meetings({ user }) {
  const [meetings, setMeetings] = useState([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [newMeeting, setNewMeeting] = useState({
    date: '',
    time: '',
    location: '',
    meetingPoint: '',
    topic: '',
    description: ''
  });

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // For demo, we'll show sample meetings
      // In production, you'd fetch from the API
      setMeetings([
        {
          _id: '1',
          with: { name: 'Sarah Chen' },
          date: '2025-03-01',
          time: '12:30',
          location: 'The Modern Restaurant',
          meetingPoint: 'Union Square',
          topic: 'Product Strategy Discussion',
          status: 'confirmed'
        },
        {
          _id: '2',
          with: { name: 'Michael Rodriguez' },
          date: '2025-03-05',
          time: '13:00',
          location: 'Google Cafe',
          meetingPoint: 'Bryant Park',
          topic: 'Tech Trends & Open Source',
          status: 'scheduled'
        }
      ]);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      
      // In production, you'd send this to the API
      // await axios.post('/meetings', {
      //   ...newMeeting,
      //   hostId: user.id,
      //   attendees: [selectedPersonId]
      // }, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });

      // For demo, simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: 'Meeting scheduled successfully!' });
      setShowSchedule(false);
      setNewMeeting({
        date: '',
        time: '',
        location: '',
        meetingPoint: '',
        topic: '',
        description: ''
      });
      fetchMeetings();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to schedule meeting. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setNewMeeting({ ...newMeeting, [e.target.name]: e.target.value });
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: { label: 'Scheduled', class: 'badge-scheduled' },
      confirmed: { label: 'Confirmed', class: 'badge-confirmed' },
      completed: { label: 'Completed', class: 'badge-completed' },
      cancelled: { label: 'Cancelled', class: 'badge-cancelled' }
    };
    return badges[status] || badges.scheduled;
  };

  if (loading && meetings.length === 0) {
    return (
      <div className="meetings-page">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your meetings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="meetings-page">
      <div className="container">
        <div className="meetings-header">
          <div>
            <h1>My Meetings</h1>
            <p>Manage your upcoming lunch meetings</p>
          </div>
          <button 
            onClick={() => setShowSchedule(!showSchedule)}
            className="btn btn-primary btn-lg"
          >
            {showSchedule ? 'Cancel' : '+ Book Meeting'}
          </button>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.type === 'success' ? '✅' : '⚠️'} {message.text}
          </div>
        )}

        {showSchedule && (
          <div className="schedule-card animate-scaleIn">
            <div className="schedule-header">
              <h2>Schedule a Meeting</h2>
              <button 
                onClick={() => setShowSchedule(false)}
                className="btn-close"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="schedule-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={newMeeting.date}
                    onChange={handleChange}
                    className="form-input"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input
                    type="time"
                    name="time"
                    value={newMeeting.time}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Restaurant / Venue</label>
                <input
                  type="text"
                  name="location"
                  value={newMeeting.location}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., The Modern, Shake Shack"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Meeting Point</label>
                <input
                  type="text"
                  name="meetingPoint"
                  value={newMeeting.meetingPoint}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., Union Square, Lobby entrance"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Topic</label>
                <input
                  type="text"
                  name="topic"
                  value={newMeeting.topic}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., Career Discussion, Project Collaboration"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <textarea
                  name="description"
                  value={newMeeting.description}
                  onChange={handleChange}
                  className="form-input form-textarea"
                  rows="3"
                  placeholder="Any additional details..."
                />
              </div>

              <div className="schedule-actions">
                <button
                  type="button"
                  onClick={() => setShowSchedule(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Scheduling...' : 'Confirm Meeting'}
                </button>
              </div>
            </form>
          </div>
        )}

        {meetings.length === 0 ? (
          <div className="empty-state animate-scaleIn">
            <div className="empty-icon">📅</div>
            <h2>No meetings scheduled</h2>
            <p>Connect with someone to schedule your first lunch meeting!</p>
            <button 
              onClick={() => setShowSchedule(true)}
              className="btn btn-primary btn-lg"
            >
              Book Your First Meeting
            </button>
          </div>
        ) : (
          <div className="meetings-list">
            {meetings.map((meeting, index) => {
              const statusBadge = getStatusBadge(meeting.status);
              return (
                <div 
                  key={meeting._id} 
                  className="meeting-card animate-scaleIn"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="meeting-date-badge">
                    <span className="day">{new Date(meeting.date).getDate()}</span>
                    <span className="month">{new Date(meeting.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                  </div>
                  
                  <div className="meeting-body">
                    <div className="meeting-header-row">
                      <div className="meeting-person">
                        {meeting.with.photo ? (
                          <img src={meeting.with.photo} alt={meeting.with.name} className="meeting-avatar" />
                        ) : (
                          <div className="meeting-avatar">{meeting.with.name.charAt(0).toUpperCase()}</div>
                        )}
                        <div>
                          <h3>{meeting.with.name}</h3>
                          <span className={`meeting-status ${statusBadge.class}`}>
                            {statusBadge.label}
                          </span>
                        </div>
                      </div>
                      <span className="meeting-time">
                        🕐 {new Date(`2000-01-01T${meeting.time}`).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </span>
                    </div>
                    
                    <div className="meeting-details">
                      <div className="detail-item">
                        <span className="detail-icon">🍽️</span>
                        <span>{meeting.location}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">📍</span>
                        <span>Meet at: {meeting.meetingPoint}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">💬</span>
                        <span>{meeting.topic}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="meeting-actions">
                    <button className="btn btn-secondary btn-sm">Message</button>
                    <button className="btn btn-outline btn-sm">Reschedule</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Meetings;
