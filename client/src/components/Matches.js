import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Matches.css';

function Matches({ user }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [findingMatches, setFindingMatches] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Try to fetch from API (works for both authenticated and guest)
      try {
        const allUsersRes = await axios.get('/users', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        
        let allUsers = allUsersRes.data || [];
        
        // If no users in database, show sample Australian matches
        if (allUsers.length === 0) {
          allUsers = getSampleMatches();
        }
        
        setMatches(allUsers.slice(0, 12));
      } catch (apiError) {
        // If API fails, show sample matches
        setMatches(getSampleMatches());
      }
    } catch (error) {
      // Always show sample matches as fallback
      setMatches(getSampleMatches());
    } finally {
      setLoading(false);
    }
  };

  // Sample matches for guests
  const getSampleMatches = () => [
    {
      _id: 'sample1',
      name: 'Emma Wilson',
      professionalBackground: 'Product Designer at Canva',
      skills: ['Figma', 'UX Design', 'Prototyping'],
      preferredTopics: ['Design Thinking', 'Startup Life'],
      preferredLocation: 'Melbourne - CBD',
      preferredMeetingPoint: 'Flinders Street Station',
      profilePicture: 'https://i.pravatar.cc/300?img=5',
      matchScore: 95
    },
    {
      _id: 'sample2',
      name: 'Liam Chen',
      professionalBackground: 'Software Engineer at Atlassian',
      skills: ['Java', 'React', 'Agile'],
      preferredTopics: ['Tech Trends', 'Career Growth'],
      preferredLocation: 'Sydney - CBD',
      preferredMeetingPoint: 'Circular Quay',
      profilePicture: 'https://i.pravatar.cc/300?img=11',
      matchScore: 88
    },
    {
      _id: 'sample3',
      name: 'Olivia Martinez',
      professionalBackground: 'Marketing Manager at REA Group',
      skills: ['Digital Marketing', 'Brand Strategy', 'SEO'],
      preferredTopics: ['Marketing Innovation', 'Networking'],
      preferredLocation: 'Melbourne - Fitzroy',
      preferredMeetingPoint: 'Brunswick Street',
      profilePicture: 'https://i.pravatar.cc/300?img=9',
      matchScore: 82
    },
    {
      _id: 'sample4',
      name: 'Noah Thompson',
      professionalBackground: 'Data Scientist at Commonwealth Bank',
      skills: ['Python', 'Machine Learning', 'SQL'],
      preferredTopics: ['AI & Machine Learning', 'Innovation'],
      preferredLocation: 'Sydney - Bondi Beach',
      preferredMeetingPoint: 'Bondi Pavilion',
      profilePicture: 'https://i.pravatar.cc/300?img=13',
      matchScore: 78
    },
    {
      _id: 'sample5',
      name: 'Ava Anderson',
      professionalBackground: 'UX Designer at Seek',
      skills: ['User Research', 'Sketch', 'Wireframing'],
      preferredTopics: ['User Experience', 'Design Thinking'],
      preferredLocation: 'Brisbane - South Bank',
      preferredMeetingPoint: 'South Bank Parklands',
      profilePicture: 'https://i.pravatar.cc/300?img=20',
      matchScore: 75
    },
    {
      _id: 'sample6',
      name: 'Jack Roberts',
      professionalBackground: 'Business Development at Xero',
      skills: ['Sales', 'Negotiation', 'Communication'],
      preferredTopics: ['Business Growth', 'Startup Life'],
      preferredLocation: 'Melbourne - St Kilda',
      preferredMeetingPoint: 'Acland Street',
      profilePicture: 'https://i.pravatar.cc/300?img=3',
      matchScore: 72
    }
  ];

  const handleFindMatches = async () => {
    setFindingMatches(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      
      // If user is authenticated, calculate personalized match scores
      if (token) {
        const currentUserRes = await axios.get('/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const allUsersRes = await axios.get('/users', {
          headers: { Authorization: `Bearer ${token}` }
        });

        let allUsers = allUsersRes.data || [];
        
        if (allUsers.length === 0) {
          allUsers = getSampleMatches();
        }
        
        // Filter out current user and calculate scores
        const otherUsers = allUsers.filter(u => u._id !== currentUserRes.data._id);
        const scoredMatches = calculateMatchScores(otherUsers, currentUserRes.data);
        
        setMatches(scoredMatches.slice(0, 12));
      } else {
        // Guest user - just show matches without personalization
        const allUsersRes = await axios.get('/users', {}).catch(() => null);
        let allUsers = allUsersRes?.data || getSampleMatches();
        setMatches(allUsers.slice(0, 12));
      }
      
      setFindingMatches(false);
    } catch (error) {
      console.error('Error finding matches:', error);
      // Show sample matches on error
      setMatches(getSampleMatches());
      setFindingMatches(false);
    }
  };

  // Calculate match scores for authenticated users
  const calculateMatchScores = (users, currentUser) => {
    return users.map(otherUser => {
      let score = 40; // Base score

      // Compare professional backgrounds
      if (currentUser.professionalBackground && otherUser.professionalBackground) {
        const currentBg = currentUser.professionalBackground.toLowerCase();
        const otherBg = otherUser.professionalBackground.toLowerCase();
        if (currentBg === otherBg) score += 30;
        else if (currentBg.includes('engineer') && otherBg.includes('engineer')) score += 15;
      }

      // Compare skills
      const currentSkills = (currentUser.skills || []).map(s => s.toLowerCase());
      const otherSkills = (otherUser.skills || []).map(s => s.toLowerCase());
      const commonSkills = currentSkills.filter(s => otherSkills.includes(s));
      score += commonSkills.length * 10;

      // Compare topics
      const currentTopics = (currentUser.preferredTopics || []).map(t => t.toLowerCase());
      const otherTopics = (otherUser.preferredTopics || []).map(t => t.toLowerCase());
      const commonTopics = currentTopics.filter(t => otherTopics.includes(t));
      score += commonTopics.length * 15;

      // Compare locations
      if (currentUser.preferredLocation && otherUser.preferredLocation) {
        const currentLoc = currentUser.preferredLocation.toLowerCase();
        const otherLoc = otherUser.preferredLocation.toLowerCase();
        if ((currentLoc.includes('sydney') && otherLoc.includes('sydney')) ||
            (currentLoc.includes('melbourne') && otherLoc.includes('melbourne')) ||
            (currentLoc.includes('brisbane') && otherLoc.includes('brisbane'))) {
          score += 25;
        }
      }

      return { ...otherUser, matchScore: Math.min(score, 99) };
    }).sort((a, b) => b.matchScore - a.matchScore);
  };

  const handleConnect = (matchId, matchName) => {
    if (!user) {
      // User is not authenticated - show auth modal
      setSelectedMatch({ id: matchId, name: matchName });
      setShowAuthModal(true);
    } else {
      // User is authenticated - proceed with connection
      setMessage({ type: 'success', text: `Connection request sent to ${matchName}!` });
      setMatches(matches.filter(m => m._id !== matchId));
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
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
            <p>
              {user 
                ? 'Discover professionals who share your interests' 
                : 'Browse professionals in your area. Sign up to connect!'}
            </p>
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
                {user ? 'Find Matches' : 'Browse Matches'}
              </>
            )}
          </button>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.type === 'success' ? '✅' : '⚠️'} {message.text}
          </div>
        )}

        {/* Auth Modal */}
        {showAuthModal && (
          <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowAuthModal(false)}>×</button>
              <div className="modal-icon">🔒</div>
              <h2>Connect with {selectedMatch?.name}</h2>
              <p>Create an account to send connection requests and start networking with professionals like {selectedMatch?.name}.</p>
              <div className="modal-benefits">
                <div className="benefit">✅ Connect with professionals</div>
                <div className="benefit">✅ Schedule lunch meetings</div>
                <div className="benefit">✅ Grow your network</div>
              </div>
              <div className="modal-actions">
                <Link to="/register" className="btn btn-primary btn-block btn-lg">
                  Create Account
                </Link>
                <Link to="/login" className="btn btn-secondary btn-block">
                  Sign In
                </Link>
              </div>
            </div>
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
                    {user ? 'Connect' : 'Sign in to Connect'}
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
