import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Matches.css';

function Matches({ user }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [findingMatches, setFindingMatches] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [roleFilter, setRoleFilter] = useState('All');
  const [sortBy, setSortBy] = useState('matchScore');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMatches(); // Auto-load matches on page visit
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Try to fetch all users from API
      try {
        const allUsersRes = await axios.get('/users', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        
        let allUsers = allUsersRes.data || [];
        
        // If no users in database, show sample Australian matches
        if (allUsers.length === 0) {
          allUsers = getSampleMatches();
        }
        
        // Show ALL users (not just 12)
        setMatches(allUsers);
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

  // Sample matches for guests (expanded list)
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
      role: 'Designer', reputationScore: 95, matchScore: 95,
      projects: [
        { _id: 'sp1-1', title: 'LunchUp Redesign', description: 'Complete visual overhaul of the LunchUp mobile app', status: 'completed', completedTasks: ['User research', 'Wireframes', 'Hi-fi mockups', 'Handoff'], aiPlan: { taskBreakdown: ['User research', 'Wireframes', 'Hi-fi mockups', 'Handoff'] }, github: null }
      ]
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
      role: 'Builder', reputationScore: 112, matchScore: 88,
      projects: [
        { _id: 'sp2-1', title: 'DevOps Dashboard', description: 'Internal CI/CD monitoring tool for engineering teams', status: 'completed', completedTasks: ['Setup pipeline', 'Build UI', 'Deploy to AWS'], aiPlan: { taskBreakdown: ['Setup pipeline', 'Build UI', 'Deploy to AWS'] }, github: { repoUrl: 'https://github.com' } },
        { _id: 'sp2-2', title: 'AI Code Reviewer', description: 'LLM-powered pull request review bot', status: 'active', completedTasks: ['Prompt engineering'], aiPlan: { taskBreakdown: ['Prompt engineering', 'GitHub integration', 'Frontend dashboard'] } }
      ]
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
      role: 'Product Thinker', reputationScore: 45, matchScore: 82,
      projects: [
        { _id: 'sp3-1', title: 'PropTech Growth Playbook', description: 'Go-to-market strategy and content funnel for a proptech startup', status: 'completed', completedTasks: ['Market research', 'ICP definition', 'Content calendar', 'Launch campaign'], aiPlan: { taskBreakdown: ['Market research', 'ICP definition', 'Content calendar', 'Launch campaign'] }, github: null },
        { _id: 'sp3-2', title: 'SEO Automation Tool', description: 'Script to auto-generate SEO briefs from keyword clusters', status: 'active', completedTasks: ['Keyword scraper'], aiPlan: { taskBreakdown: ['Keyword scraper', 'Brief generator', 'CMS integration'] }, github: { repoUrl: 'https://github.com' } }
      ]
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
      role: 'AI Engineer', reputationScore: 78, matchScore: 78,
      projects: [
        { _id: 'sp4-1', title: 'Fraud Detection Model', description: 'Real-time transaction anomaly detection using ML', status: 'active', completedTasks: ['Data pipeline', 'Model training'], aiPlan: { taskBreakdown: ['Data pipeline', 'Model training', 'API endpoint', 'Monitoring dashboard'] } }
      ]
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
      role: 'Designer', reputationScore: 30, matchScore: 75,
      projects: [
        { _id: 'sp5-1', title: 'Job Board UX Overhaul', description: 'End-to-end research and redesign of Seek\'s job alert experience', status: 'completed', completedTasks: ['User interviews', 'Journey mapping', 'Prototype'], aiPlan: { taskBreakdown: ['User interviews', 'Journey mapping', 'Prototype', 'Usability testing'] }, github: null }
      ]
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
      role: 'Product Thinker', reputationScore: 60, matchScore: 72,
      projects: [
        { _id: 'sp6-1', title: 'SaaS Partner Portal', description: 'Self-serve onboarding portal for Xero accounting partners', status: 'completed', completedTasks: ['Requirements doc', 'Partner interviews', 'MVP scope', 'Launch'], aiPlan: { taskBreakdown: ['Requirements doc', 'Partner interviews', 'MVP scope', 'Launch'] }, github: null },
        { _id: 'sp6-2', title: 'B2B Cold Outreach AI', description: 'GPT-powered personalised outreach email generator', status: 'active', completedTasks: ['Prompt design', 'CRM integration'], aiPlan: { taskBreakdown: ['Prompt design', 'CRM integration', 'A/B testing framework', 'Analytics dashboard'] }, github: { repoUrl: 'https://github.com' } }
      ]
    },
    {
      _id: 'sample7',
      name: 'Charlotte Kim',
      professionalBackground: 'HR Partner at Telstra',
      skills: ['Leadership', 'Team Building', 'Coaching'],
      preferredTopics: ['Career Growth', 'Leadership'],
      preferredLocation: 'Sydney - Parramatta',
      preferredMeetingPoint: 'Westfield Parramatta',
      profilePicture: 'https://i.pravatar.cc/300?img=24',
      role: 'Product Thinker', reputationScore: 0, matchScore: 70,
      projects: [
        { _id: 'sp7-1', title: 'Internal Mentorship Platform', description: 'Matching tool pairing junior and senior employees at Telstra', status: 'planning', completedTasks: [], aiPlan: { taskBreakdown: ['Survey design', 'Matching algorithm spec', 'Pilot program', 'Feedback loop'] }, github: null }
      ]
    },
    {
      _id: 'sample8',
      name: 'Oliver Brown',
      professionalBackground: 'DevOps Engineer at AWS',
      skills: ['AWS', 'Kubernetes', 'Docker'],
      preferredTopics: ['Cloud Computing', 'DevOps'],
      preferredLocation: 'Brisbane - CBD',
      preferredMeetingPoint: 'Queen Street Mall',
      profilePicture: 'https://i.pravatar.cc/300?img=56',
      role: 'Builder', reputationScore: 85, matchScore: 68,
      projects: [
        { _id: 'sp8-1', title: 'K8s Cost Optimizer', description: 'Tool to analyse and right-size Kubernetes cluster resource requests', status: 'completed', completedTasks: ['Metrics collection', 'Recommendation engine', 'Slack alerts', 'CLI tool'], aiPlan: { taskBreakdown: ['Metrics collection', 'Recommendation engine', 'Slack alerts', 'CLI tool'] }, github: { repoUrl: 'https://github.com' } },
        { _id: 'sp8-2', title: 'Serverless Log Aggregator', description: 'Lambda-based log pipeline feeding into OpenSearch', status: 'active', completedTasks: ['Lambda setup', 'Log parser'], aiPlan: { taskBreakdown: ['Lambda setup', 'Log parser', 'OpenSearch index', 'Kibana dashboard'] }, github: { repoUrl: 'https://github.com' } }
      ]
    },
    {
      _id: 'sample9',
      name: 'Sophie Taylor',
      professionalBackground: 'Financial Analyst at Macquarie',
      skills: ['Financial Modeling', 'Excel', 'Analysis'],
      preferredTopics: ['Finance', 'Investment'],
      preferredLocation: 'Sydney - CBD',
      preferredMeetingPoint: 'Martin Place',
      profilePicture: 'https://i.pravatar.cc/300?img=28',
      role: 'Product Thinker', reputationScore: 20, matchScore: 65,
      projects: [
        { _id: 'sp9-1', title: 'VC Portfolio Tracker', description: 'Dashboard for tracking startup valuations and fund performance', status: 'active', completedTasks: ['Data model', 'Excel import pipeline'], aiPlan: { taskBreakdown: ['Data model', 'Excel import pipeline', 'Valuation charts', 'PDF report export'] }, github: null }
      ]
    },
    {
      _id: 'sample10',
      name: 'William Davis',
      professionalBackground: 'Product Manager at Atlassian',
      skills: ['Product Strategy', 'Agile', 'Roadmapping'],
      preferredTopics: ['Product Development', 'Agile'],
      preferredLocation: 'Melbourne - CBD',
      preferredMeetingPoint: 'Southern Cross Station',
      profilePicture: 'https://i.pravatar.cc/300?img=52',
      role: 'Product Thinker', reputationScore: 55, matchScore: 63,
      projects: [
        { _id: 'sp10-1', title: 'Jira Plugin: Sprint Forecaster', description: 'Atlassian marketplace plugin predicting sprint completion using velocity data', status: 'completed', completedTasks: ['Plugin scaffold', 'Velocity model', 'UI widget', 'Marketplace submission'], aiPlan: { taskBreakdown: ['Plugin scaffold', 'Velocity model', 'UI widget', 'Marketplace submission'] }, github: { repoUrl: 'https://github.com' } },
        { _id: 'sp10-2', title: 'OKR Alignment Tool', description: 'Visual tool mapping team OKRs to company strategy', status: 'planning', completedTasks: [], aiPlan: { taskBreakdown: ['Stakeholder interviews', 'OKR data model', 'Tree visualisation', 'Export to PDF'] }, github: null }
      ]
    },
    {
      _id: 'sample11',
      name: 'Mia Johnson',
      professionalBackground: 'Growth Manager at Airwallex',
      skills: ['Growth Hacking', 'Analytics', 'Marketing'],
      preferredTopics: ['Growth', 'Startups'],
      preferredLocation: 'Melbourne - CBD',
      preferredMeetingPoint: 'Collins Street',
      profilePicture: 'https://i.pravatar.cc/300?img=35',
      role: 'AI Engineer', reputationScore: 100, matchScore: 60,
      projects: [
        { _id: 'sp11-1', title: 'Churn Prediction Pipeline', description: 'ML model identifying at-risk fintech customers before they churn', status: 'completed', completedTasks: ['Feature engineering', 'Model training', 'Scoring API', 'CRM integration'], aiPlan: { taskBreakdown: ['Feature engineering', 'Model training', 'Scoring API', 'CRM integration'] }, github: { repoUrl: 'https://github.com' } },
        { _id: 'sp11-2', title: 'AI Growth Experiment Engine', description: 'Automated A/B test generator using LLMs to suggest hypotheses', status: 'active', completedTasks: ['Hypothesis generator', 'Experiment tracker'], aiPlan: { taskBreakdown: ['Hypothesis generator', 'Experiment tracker', 'Stats significance calculator', 'Dashboard'] }, github: { repoUrl: 'https://github.com' } }
      ]
    },
    {
      _id: 'sample12',
      name: 'James Wilson',
      professionalBackground: 'Solutions Architect at Google',
      skills: ['Cloud Architecture', 'Python', 'Leadership'],
      preferredTopics: ['Cloud', 'Architecture'],
      preferredLocation: 'Sydney - Pyrmont',
      preferredMeetingPoint: 'The Star Casino',
      profilePicture: 'https://i.pravatar.cc/300?img=15',
      role: 'Builder', reputationScore: 40, matchScore: 58,
      projects: [
        { _id: 'sp12-1', title: 'Multi-Cloud Abstraction Layer', description: 'SDK abstracting AWS, GCP and Azure into a unified API for startups', status: 'active', completedTasks: ['Core SDK design', 'AWS adapter', 'GCP adapter'], aiPlan: { taskBreakdown: ['Core SDK design', 'AWS adapter', 'GCP adapter', 'Azure adapter', 'Docs site'] }, github: { repoUrl: 'https://github.com' } }
      ]
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

      // Role complementarity
      if (currentUser.role && otherUser.role) {
        if (currentUser.role !== otherUser.role) score += 20;
        else score -= 5;
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
      // User is authenticated - save the connection
      const connection = {
        id: matchId,
        name: matchName,
        connectedAt: new Date().toISOString(),
        status: 'pending'
      };
      
      // Get existing connections from localStorage
      const existingConnections = JSON.parse(localStorage.getItem('connections') || '[]');
      
      // Add new connection
      const updatedConnections = [...existingConnections, connection];
      localStorage.setItem('connections', JSON.stringify(updatedConnections));
      
      // Also save to axios for Meetings component to access
      localStorage.setItem('connectionsUpdated', Date.now().toString());
      
      setMessage({ type: 'success', text: `Connection request sent to ${matchName}! They'll appear in your meetings once accepted.` });
      
      // Remove from matches list
      setMatches(matches.filter(m => m._id !== matchId));
      
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
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
                ? `${matches.length} professionals available to connect` 
                : `${matches.length} professionals in your area. Sign up to connect!`}
            </p>
          </div>
          {user && (
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
                  Refresh Matches
                </>
              )}
            </button>
          )}
        </div>

        <div className="role-filter">
          {['All', 'Builder', 'Designer', 'AI Engineer', 'Product Thinker'].map(role=> (
            <button
              key={role}
              className={`filter-btn ${roleFilter === role ? 'active' : ''}`}
              onClick={() => setRoleFilter(role)}
              >
                {role}
              </button>
          ))}
        </div>

        <div className="sort-control">
          <span className="sort-label">Sort by:</span>
          <button
            className={`sort-btn ${sortBy === 'matchScore' ? 'active' : ''}`}
            onClick={() => setSortBy('matchScore')}
          >
            🎯 Match Score
          </button>
          <button
            className={`sort-btn ${sortBy === 'reputationScore' ? 'active' : ''}`}
            onClick={() => setSortBy('reputationScore')}
          >
            ⭐ Reputation
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
        ) : (() => {
          const filtered = matches
            .filter(m => roleFilter === 'All' || m.role === roleFilter)
            .slice()
            .sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
          if (filtered.length === 0) return (
            <div className="empty-state animate-scaleIn">
              <div className="empty-icon">🔍</div>
              <h2>No {roleFilter}s in your matches</h2>
              <p>Try a different role filter or refresh to find more professionals</p>
              <button onClick={() => setRoleFilter('All')} className="btn btn-primary btn-lg">
                Show All
              </button>
            </div>
          );
          return (
          <div className="matches-grid">
            {filtered
              .map((match, index) => (
              <div
                key={match._id}
                className="match-card animate-scaleIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="match-header">
                  <div
                    className="match-avatar clickable-avatar"
                    onClick={() => navigate(`/profile/${match._id}`, { state: { userData: match } })}
                    title={`View ${match.name}'s profile`}
                  >
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
                  <h3
                    className="match-name-link"
                    onClick={() => navigate(`/profile/${match._id}`, { state: { userData: match } })}
                  >{match.name}</h3>
                  <p className="match-background">{match.professionalBackground}</p>
                  <div className="match-badges-row">
                    {match.role && <span className="role-badge">{match.role}</span>}
                    {match.reputationScore > 0 && (
                      <span className="reputation-mini-badge">⭐ {match.reputationScore}</span>
                    )}
                  </div>


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
                  {user && (
                    <a href="#/projects" className="btn btn-secondary btn-block btn-sm">
                      Start Project →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          );
        })()}
      </div>
    </div>
  );
}

export default Matches;
