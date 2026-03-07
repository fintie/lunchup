import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Live.css';

function Live({ user }) {
  const [scenes, setScenes] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Sample Australian users for live visualization (names hidden from display)
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

  // Status types
  const statusTypes = {
    MEETING: 'meeting',
    WAITING: 'waiting',
    AVAILABLE: 'available'
  };

  // Generate initial scenes
  useEffect(() => {
    generateScenes();
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Randomly change user status every 15 minutes (900000ms)
    const statusRefresh = setInterval(() => {
      generateScenes();
      console.log('🔄 Auto-updating user statuses...');
    }, 900000); // 15 minutes

    return () => {
      clearInterval(timer);
      clearInterval(statusRefresh);
    };
  }, []);

  const generateScenes = () => {
    // Randomly assign statuses to users
    const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
    
    const newScenes = [
      // Restaurant scene - 2 users meeting
      {
        id: 'scene1',
        type: 'restaurant',
        location: 'The Grounds, Alexandria',
        users: [shuffledUsers[0], shuffledUsers[1]],
        status: statusTypes.MEETING,
        topic: 'Product & Engineering Sync',
        animation: 'seated'
      },
      // Cafe scene - 2 users meeting
      {
        id: 'scene2',
        type: 'cafe',
        location: 'Patricia Coffee, CBD',
        users: [shuffledUsers[2], shuffledUsers[3]],
        status: statusTypes.MEETING,
        topic: 'Marketing Strategy Discussion',
        animation: 'seated'
      },
      // Waiting scene - user waiting for connection
      {
        id: 'scene3',
        type: 'waiting',
        location: 'Circular Quay',
        users: [shuffledUsers[4]],
        status: statusTypes.WAITING,
        waitingFor: 'Someone to connect',
        animation: 'waiting'
      },
      // Another restaurant scene
      {
        id: 'scene4',
        type: 'restaurant',
        location: 'Quay Restaurant',
        users: [shuffledUsers[5], shuffledUsers[6]],
        status: statusTypes.MEETING,
        topic: 'HR & Tech Collaboration',
        animation: 'seated'
      },
      // Available user looking for connection
      {
        id: 'scene5',
        type: 'cafe',
        location: 'Single O, Surry Hills',
        users: [shuffledUsers[7]],
        status: statusTypes.AVAILABLE,
        waitingFor: 'Open to connect',
        animation: 'available'
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
      case statusTypes.MEETING: return '💬';
      case statusTypes.WAITING: return '⏳';
      case statusTypes.AVAILABLE: return '👋';
      default: return '📍';
    }
  };

  const handleUserClick = (user, scene) => {
    if (scene.status === statusTypes.MEETING) {
      // Users in meeting can't be connected
      return;
    }
    
    if (!user) {
      // Guest user - redirect to register
      window.location.href = '/#/register';
      return;
    }
    
    // Show connect modal
    setSelectedUser({ user, scene });
    setShowConnectModal(true);
  };

  const handleConnect = () => {
    if (selectedUser && user) {
      // Save connection
      const connection = {
        id: selectedUser.user.id,
        name: selectedUser.user.name,
        role: selectedUser.user.role,
        connectedAt: new Date().toISOString(),
        status: 'pending'
      };
      
      const existingConnections = JSON.parse(localStorage.getItem('connections') || '[]');
      const updatedConnections = [...existingConnections, connection];
      localStorage.setItem('connections', JSON.stringify(updatedConnections));
      localStorage.setItem('connectionsUpdated', Date.now().toString());
      
      setShowConnectModal(false);
      
      // Refresh scenes to update status
      setTimeout(() => {
        generateScenes();
      }, 2000);
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
          <span className="stat-value">{scenes.filter(s => s.status === statusTypes.MEETING).length}</span>
          <span className="stat-label">In Meetings</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">{scenes.filter(s => s.status === statusTypes.WAITING).length}</span>
          <span className="stat-label">Waiting</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">{scenes.filter(s => s.status === statusTypes.AVAILABLE).length}</span>
          <span className="stat-label">Available</span>
        </div>
      </div>

      {/* Connect Modal */}
      {showConnectModal && selectedUser && (
        <div className="connect-modal-overlay" onClick={() => setShowConnectModal(false)}>
          <div className="connect-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowConnectModal(false)}>×</button>
            
            {!user ? (
              // Guest modal
              <>
                <div className="modal-icon">🔒</div>
                <h2>Connect with {selectedUser.user.name}</h2>
                <p className="modal-role">{selectedUser.user.role}</p>
                <p>Create an account to start connecting with professionals like {selectedUser.user.name.split(' ')[0]}.</p>
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
              </>
            ) : (
              // Authenticated user modal
              <>
                <div className="modal-icon">🤝</div>
                <h2>Connect with {selectedUser.user.name}</h2>
                <p className="modal-role">{selectedUser.user.role}</p>
                <p className="modal-location">📍 {selectedUser.scene.location}</p>
                <p>Send a connection request to {selectedUser.user.name.split(' ')[0]} and start networking!</p>
                <div className="modal-actions">
                  <button onClick={handleConnect} className="btn btn-primary btn-block btn-lg">
                    Send Connection Request
                  </button>
                  <button onClick={() => setShowConnectModal(false)} className="btn btn-secondary btn-block">
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
                {scene.status === statusTypes.MEETING ? ' In Meeting' : 
                 scene.status === statusTypes.WAITING ? ' Waiting for Connect' : 
                 scene.status === statusTypes.AVAILABLE ? ' Available to Connect' : 'Active'}
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
                {scene.users.map((userData, idx) => (
                  <div 
                    key={userData.id} 
                    className={`scene-user ${scene.status !== statusTypes.MEETING ? 'clickable' : ''}`}
                    onClick={() => handleUserClick(userData, scene)}
                    style={{ 
                      animationDelay: `${idx * 0.2}s`,
                      left: scene.users.length === 2 ? `${idx * 50 + 10}%` : '40%',
                      cursor: scene.status !== statusTypes.MEETING ? 'pointer' : 'default'
                    }}
                    title={scene.status !== statusTypes.MEETING ? 'Click to connect' : 'In meeting'}
                  >
                    <div className="user-avatar-container">
                      <img src={userData.avatar} alt={userData.name} className="user-avatar" />
                      {scene.status === statusTypes.MEETING && (
                        <span className="user-status-indicator meeting"></span>
                      )}
                      {scene.status === statusTypes.WAITING && (
                        <span className="user-status-indicator waiting"></span>
                      )}
                      {scene.status === statusTypes.AVAILABLE && (
                        <span className="user-status-indicator available"></span>
                      )}
                    </div>
                    <div className="user-info-bubble">
                      {/* Only show role/company, NOT name */}
                      <span className="user-role">{userData.role}</span>
                      {scene.status !== statusTypes.MEETING && (
                        <span className="connect-hint">👆 Click to connect</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Connection line for meetings */}
              {scene.status === statusTypes.MEETING && scene.users.length === 2 && (
                <div className="connection-line"></div>
              )}

              {/* Waiting indicator */}
              {(scene.status === statusTypes.WAITING || scene.status === statusTypes.AVAILABLE) && (
                <div className="waiting-bubble">
                  <span className="waiting-text">{scene.waitingFor}</span>
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
              <div className="scene-time-ago">
                <span className="time-dot"></span>
                Status updates in {Math.floor(Math.random() * 10) + 5} min
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
                <strong>Product Designer</strong> and <strong>Software Engineer</strong> started a meeting
              </span>
              <span className="feed-time">2 min ago</span>
            </div>
          </div>
          <div className="feed-item">
            <span className="feed-icon waiting">⏳</span>
            <div className="feed-content">
              <span className="feed-text">
                <strong>UX Designer</strong> is waiting for a connection
              </span>
              <span className="feed-time">5 min ago</span>
            </div>
          </div>
          <div className="feed-item">
            <span className="feed-icon available">👋</span>
            <div className="feed-content">
              <span className="feed-text">
                <strong>DevOps Engineer</strong> is available to connect
              </span>
              <span className="feed-time">8 min ago</span>
            </div>
          </div>
          <div className="feed-item">
            <span className="feed-icon success">✅</span>
            <div className="feed-content">
              <span className="feed-text">
                <strong>Marketing Manager</strong> connected with <strong>Data Scientist</strong>
              </span>
              <span className="feed-time">12 min ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA for Guests */}
      {!user && (
        <div className="guest-cta">
          <h2>Want to join these professionals?</h2>
          <p>Sign up now to start connecting and meeting for lunch!</p>
          <div className="cta-buttons">
            <Link to="/register" className="btn btn-primary btn-lg">
              Create Account
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default Live;
