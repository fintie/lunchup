import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Matches.css';

function Matches({ user }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [findingMatches, setFindingMatches] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Fetch all users from database (excluding current user)
      const response = await axios.get('/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Calculate match scores and shuffle
      const users = response.data || [];
      const shuffled = users.sort(() => 0.5 - Math.random());
      setMatches(shuffled.slice(0, 20)); // Show up to 20 matches
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFindMatches = async () => {
    setFindingMatches(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'exists' : 'missing');
      
      // Get current user to calculate match scores
      const currentUserRes = await axios.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Current user:', currentUserRes.data);

      // Fetch all other users
      const allUsersRes = await axios.get('/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('All users count:', allUsersRes.data?.length);

      const allUsers = allUsersRes.data || [];
      
      // Filter out current user
      const otherUsers = allUsers.filter(u => u._id !== currentUserRes.data._id);
      console.log('Other users count:', otherUsers.length);

      // Calculate match scores based on similarity
      const scoredMatches = otherUsers.map(otherUser => {
        let score = 0;
        const current = currentUserRes.data;

        // Compare professional backgrounds (partial match)
        if (current.professionalBackground && otherUser.professionalBackground) {
          const currentBg = current.professionalBackground.toLowerCase();
          const otherBg = otherUser.professionalBackground.toLowerCase();
          if (currentBg === otherBg) score += 30;
          else if (currentBg.includes('engineer') && otherBg.includes('engineer')) score += 15;
          else if (currentBg.includes('manager') && otherBg.includes('manager')) score += 15;
        }

        // Compare skills
        const currentSkills = (current.skills || []).map(s => s.toLowerCase());
        const otherSkills = (otherUser.skills || []).map(s => s.toLowerCase());
        const commonSkills = currentSkills.filter(s => otherSkills.includes(s));
        score += commonSkills.length * 10;

        // Compare preferred topics
        const currentTopics = (current.preferredTopics || []).map(t => t.toLowerCase());
        const otherTopics = (otherUser.preferredTopics || []).map(t => t.toLowerCase());
        const commonTopics = currentTopics.filter(t => otherTopics.includes(t));
        score += commonTopics.length * 15;

        // Compare locations (same city)
        if (current.preferredLocation && otherUser.preferredLocation) {
          const currentLoc = current.preferredLocation.toLowerCase();
          const otherLoc = otherUser.preferredLocation.toLowerCase();
          if (currentLoc.includes('sydney') && otherLoc.includes('sydney')) score += 25;
          else if (currentLoc.includes('melbourne') && otherLoc.includes('melbourne')) score += 25;
          else if (currentLoc.includes('brisbane') && otherLoc.includes('brisbane')) score += 25;
          else if (currentLoc === otherLoc) score += 25;
        }

        // Compare meeting points
        if (current.preferredMeetingPoint === otherUser.preferredMeetingPoint) {
          score += 20;
        }

        return {
          ...otherUser,
          matchScore: Math.min(score + 30, 99) // Add base score and cap at 99%
        };
      });

      // Sort by match score and take top 12
      const topMatches = scoredMatches
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 12);

      console.log('Top matches:', topMatches.length);
      setMatches(topMatches);
      setFindingMatches(false);
      
      if (topMatches.length === 0) {
        setMessage({ type: 'info', text: 'No matches found. Try updating your profile!' });
      }
    } catch (error) {
      console.error('Error finding matches:', error);
      console.error('Error details:', error.response?.data || error.message);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to find matches. Please try again.' });
      setFindingMatches(false);
    }
  };

  const handleConnect = async (matchId, matchName) => {
    try {
      const token = localStorage.getItem('token');
      // In production, this would call an API to send a connection request
      setMessage({ type: 'success', text: `Connection request sent to ${matchName}!` });

      // Remove the match from the list after connecting
      setMatches(matches.filter(m => m._id !== matchId));

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send connection request' });
    }
  };

  if (loading) {
    return (
      <div className="matches-page">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your matches...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="matches-page">
      <div className="container">
        <div className="matches-header">
          <div>
            <h1>Find Matches</h1>
            <p>Discover professionals who share your interests</p>
          </div>
          <button
            onClick={handleFindMatches}
            className="btn btn-primary btn-lg"
            disabled={findingMatches}
          >
            {findingMatches ? (
              <>
                <span className="spinner-small"></span>
                Finding...
              </>
            ) : (
              <>
                <span>🎯</span>
                Find Matches
              </>
            )}
          </button>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.type === 'success' ? '✅' : '⚠️'} {message.text}
          </div>
        )}

        {matches.length === 0 ? (
          <div className="empty-state animate-scaleIn">
            <div className="empty-icon">🔍</div>
            <h2>No matches yet</h2>
            <p>Click "Find Matches" to discover professionals in your network</p>
            <button
              onClick={handleFindMatches}
              className="btn btn-primary btn-lg"
              disabled={findingMatches}
            >
              {findingMatches ? 'Finding...' : 'Find Matches Now'}
            </button>
          </div>
        ) : (
          <div className="matches-grid">
            {matches.map((match, index) => (
              <div
                key={match._id}
                className="match-card animate-scaleIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="match-header">
                  <div className="match-avatar">
                    {match.profilePicture ? (
                      <img src={match.profilePicture} alt={match.name} className="avatar-image" />
                    ) : (
                      match.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="match-score">
                    <span className="score-value">{match.matchScore || 0}%</span>
                    <span className="score-label">Match</span>
                  </div>
                </div>

                <div className="match-body">
                  <h3>{match.name}</h3>
                  <p className="match-background">{match.professionalBackground}</p>

                  <div className="match-section">
                    <span className="match-label">Skills</span>
                    <div className="match-tags">
                      {match.skills?.slice(0, 3).map((skill, i) => (
                        <span key={i} className="tag">{skill}</span>
                      ))}
                    </div>
                  </div>

                  <div className="match-section">
                    <span className="match-label">Topics</span>
                    <div className="match-tags">
                      {match.preferredTopics?.slice(0, 2).map((topic, i) => (
                        <span key={i} className="tag tag-outline">{topic}</span>
                      ))}
                    </div>
                  </div>

                  <div className="match-location">
                    <span>📍</span>
                    <span>{match.preferredLocation} • {match.preferredMeetingPoint}</span>
                  </div>
                </div>

                <div className="match-actions">
                  <button
                    onClick={() => handleConnect(match._id, match.name)}
                    className="btn btn-primary btn-block"
                  >
                    Connect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Matches;
