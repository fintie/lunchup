import React, { useState, useEffect } from 'react';
import './Live.css';

function Live({ user }) {
  const [scenes, setScenes] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Sample Australian users for live visualization
  const users = [
    { id: 1, name: 'Emma W.', role: 'Product Designer at Canva', avatar: 'https://i.pravatar.cc/300?img=5' },
    { id: 2, name: 'Liam C.', role: 'Software Engineer at Atlassian', avatar: 'https://i.pravatar.cc/300?img=11' },
    { id: 3, name: 'Olivia M.', role: 'Marketing Manager at REA Group', avatar: 'https://i.pravatar.cc/300?img=9' },
    { id: 4, name: 'Noah T.', role: 'Data Scientist at CBA', avatar: 'https://i.pravatar.cc/300?img=13' },
    { id: 5, name: 'Ava A.', role: 'UX Designer at Seek', avatar: 'https://i.pravatar.cc/300?img=20' },
    { id: 6, name: 'Jack R.', role: 'Business Dev at Xero', avatar: 'https://i.pravatar.cc/300?img=3' },
    { id: 7, name: 'Charlotte P.', role: 'HR Partner at Telstra', avatar: 'https://i.pravatar.cc/300?img=12' },
    { id: 8, name: 'Oliver K.', role: 'DevOps Engineer at AWS', avatar: 'https://i.pravatar.cc/300?img=56' },
  ];

  // Scene types
  const sceneTypes = {
    RESTAURANT: 'restaurant',
    CAFE: 'cafe',
    WALKING: 'walking',
    WAITING: 'waiting',
    MEETING: 'meeting'
  };

  // Generate initial scenes
  useEffect(() => {
    generateScenes();
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Refresh scenes every 10 seconds for "live" feel
    const sceneRefresh = setInterval(() => {
      generateScenes();
    }, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(sceneRefresh);
    };
  }, []);

  const generateScenes = () => {
    const newScenes = [
      // Restaurant scene - 2 users meeting
      {
        id: 'scene1',
        type: sceneTypes.RESTAURANT,
        location: 'The Grounds, Alexandria',
        users: [users[0], users[1]],
        status: 'meeting',
        topic: 'Product & Engineering Sync',
        animation: 'seated'
      },
      // Cafe scene - 2 users having coffee
      {
        id: 'scene2',
        type: sceneTypes.CAFE,
        location: 'Patricia Coffee, CBD',
        users: [users[2], users[3]],
        status: 'meeting',
        topic: 'Marketing Strategy Discussion',
        animation: 'seated'
      },
      // Walking scene - user walking to meeting
      {
        id: 'scene3',
        type: sceneTypes.WALKING,
        location: 'George Street',
        users: [users[4]],
        status: 'walking',
        destination: 'Meeting at Circular Quay',
        animation: 'walking-right'
      },
      // Waiting scene - user waiting for match
      {
        id: 'scene4',
        type: sceneTypes.WAITING,
        location: 'Barangaroo Reserve',
        users: [users[5]],
        status: 'waiting',
        waitingFor: 'Emma W.',
        animation: 'waiting'
      },
      // Another restaurant scene
      {
        id: 'scene5',
        type: sceneTypes.RESTAURANT,
        location: 'Quay Restaurant',
        users: [users[6], users[7]],
        status: 'meeting',
        topic: 'HR & Tech Collaboration',
        animation: 'seated'
      },
      // Walking scene 2
      {
        id: 'scene6',
        type: sceneTypes.WALKING,
        location: 'Collins Street, Melbourne',
        users: [users[1]],
        status: 'walking',
        destination: 'Lunch at Chin Chin',
        animation: 'walking-left'
      }
    ];

    setScenes(newScenes);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-AU', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'meeting': return '💬';
      case 'walking': return '🚶';
      case 'waiting': return '⏳';
      default: return '📍';
    }
  };

  return (
    <div className="live-page">
      <div className="live-header">
        <div className="live-title">
          <h1>🔴 Live Matching</h1>
          <span className="live-indicator">
            <span className="live-dot"></span>
            LIVE
          </span>
        </div>
        <div className="live-time">
          <span className="clock">{formatTime(currentTime)}</span>
          <span className="timezone">AEDT</span>
        </div>
        <p className="live-subtitle">
          Real-time professional meetups happening across Australia
        </p>
      </div>

      {/* Stats Bar */}
      <div className="live-stats">
        <div className="stat-item">
          <span className="stat-value">{users.length}</span>
          <span className="stat-label">Active Users</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">{scenes.filter(s => s.status === 'meeting').length}</span>
          <span className="stat-label">Meetings Now</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">{scenes.filter(s => s.status === 'walking').length}</span>
          <span className="stat-label">En Route</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">{scenes.filter(s => s.status === 'waiting').length}</span>
          <span className="stat-label">Waiting</span>
        </div>
      </div>

      {/* Live Scenes Grid */}
      <div className="scenes-grid">
        {scenes.map((scene, index) => (
          <div 
            key={scene.id} 
            className={`scene-card scene-${scene.type} animate-scaleIn`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Scene Header */}
            <div className="scene-header">
              <span className="scene-type-badge">{scene.type}</span>
              <span className="scene-status">
                {getStatusIcon(scene.status)}
                {scene.status === 'meeting' ? ' In Meeting' : 
                 scene.status === 'walking' ? ' Walking' : 
                 scene.status === 'waiting' ? ' Waiting' : 'Active'}
              </span>
            </div>

            {/* Scene Location */}
            <div className="scene-location">
              <span className="location-icon">📍</span>
              {scene.location}
            </div>

            {/* Scene Visualization */}
            <div className="scene-visualization">
              {/* Background based on scene type */}
              <div className={`scene-bg scene-bg-${scene.type}`}></div>
              
              {/* Users in scene */}
              <div className={`scene-users scene-users-${scene.animation}`}>
                {scene.users.map((user, idx) => (
                  <div 
                    key={user.id} 
                    className="scene-user"
                    style={{ 
                      animationDelay: `${idx * 0.2}s`,
                      left: scene.users.length === 2 ? `${idx * 50 + 10}%` : '40%'
                    }}
                  >
                    <div className="user-avatar-container">
                      <img src={user.avatar} alt={user.name} className="user-avatar" />
                      {scene.status === 'meeting' && (
                        <span className="user-status-indicator meeting"></span>
                      )}
                      {scene.status === 'walking' && (
                        <span className="user-status-indicator walking"></span>
                      )}
                      {scene.status === 'waiting' && (
                        <span className="user-status-indicator waiting"></span>
                      )}
                    </div>
                    <div className="user-info-bubble">
                      <span className="user-name">{user.name}</span>
                      <span className="user-role">{user.role}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Connection line for meetings */}
              {scene.status === 'meeting' && scene.users.length === 2 && (
                <div className="connection-line"></div>
              )}

              {/* Walking path animation */}
              {scene.status === 'walking' && (
                <div className="walking-path">
                  <div className="path-dots"></div>
                </div>
              )}

              {/* Waiting indicator */}
              {scene.status === 'waiting' && (
                <div className="waiting-bubble">
                  <span className="waiting-text">Waiting for {scene.waitingFor}...</span>
                </div>
              )}
            </div>

            {/* Scene Footer */}
            <div className="scene-footer">
              {scene.topic && (
                <div className="scene-topic">
                  <span className="topic-icon">💼</span>
                  {scene.topic}
                </div>
              )}
              {scene.destination && (
                <div className="scene-destination">
                  <span className="destination-icon">🎯</span>
                  {scene.destination}
                </div>
              )}
              <div className="scene-time-ago">
                <span className="time-dot"></span>
                Just now
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Feed */}
      <div className="activity-feed">
        <h3 className="feed-title">Recent Activity</h3>
        <div className="feed-list">
          <div className="feed-item">
            <span className="feed-icon meeting">💬</span>
            <div className="feed-content">
              <span className="feed-text">
                <strong>Emma W.</strong> and <strong>Liam C.</strong> started a meeting
              </span>
              <span className="feed-time">2 min ago</span>
            </div>
          </div>
          <div className="feed-item">
            <span className="feed-icon walking">🚶</span>
            <div className="feed-content">
              <span className="feed-text">
                <strong>Ava A.</strong> is heading to Circular Quay
              </span>
              <span className="feed-time">5 min ago</span>
            </div>
          </div>
          <div className="feed-item">
            <span className="feed-icon waiting">⏳</span>
            <div className="feed-content">
              <span className="feed-text">
                <strong>Jack R.</strong> is waiting for a match
              </span>
              <span className="feed-time">8 min ago</span>
            </div>
          </div>
          <div className="feed-item">
            <span className="feed-icon success">✅</span>
            <div className="feed-content">
              <span className="feed-text">
                <strong>Olivia M.</strong> connected with <strong>Noah T.</strong>
              </span>
              <span className="feed-time">12 min ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Live;
