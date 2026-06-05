import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';
import InboxBell from './InboxBell';

const Navbar = ({ user, logout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const exploreRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;
  const close = () => setMobileMenuOpen(false);

  useEffect(() => {
    const handler = (e) => {
      if (exploreRef.current && !exploreRef.current.contains(e.target)) setExploreOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const exploreLinks = [
    { to: '/news', label: '📰 News' },
    { to: '/opportunities', label: '💼 Opportunities' },
    { to: '/leaderboard', label: '🏆 Leaderboard' },
  ];

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        <nav className="navbar">
          {/* Logo → Home */}
          <Link to="/" className="navbar-logo" onClick={close}>
            <span className="logo-icon">🍽️</span>
            <span className="logo-text">LunchUp</span>
          </Link>

          {/* Primary links */}
          <div className={`navbar-links ${mobileMenuOpen ? 'active' : ''}`}>
            <Link to="/matches" className={`nav-link ${isActive('/matches') ? 'active' : ''}`} onClick={close}>
              Find Matches
            </Link>
            <Link to="/live" className={`nav-link ${isActive('/live') ? 'active' : ''}`} onClick={close}>
              🔴 Live
            </Link>
            {user && (
              <>
                <Link to="/meetings" className={`nav-link ${isActive('/meetings') ? 'active' : ''}`} onClick={close}>
                  Meetings
                </Link>
                <Link to="/projects" className={`nav-link ${isActive('/projects') ? 'active' : ''}`} onClick={close}>
                  Projects
                </Link>
              </>
            )}

            {/* Explore dropdown */}
            <div className="nav-explore" ref={exploreRef}>
              <button
                className={`nav-link nav-explore-btn ${exploreLinks.some(l => isActive(l.to)) ? 'active' : ''}`}
                onClick={() => setExploreOpen(o => !o)}
              >
                Explore <span className="explore-arrow">{exploreOpen ? '▴' : '▾'}</span>
              </button>
              {exploreOpen && (
                <div className="explore-dropdown">
                  {exploreLinks.map(l => (
                    <Link
                      key={l.to}
                      to={l.to}
                      className={`explore-item ${isActive(l.to) ? 'active' : ''}`}
                      onClick={() => { setExploreOpen(false); close(); }}
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {!user && (
              <Link to="/login" className={`nav-link ${isActive('/login') ? 'active' : ''}`} onClick={close}>
                Sign In
              </Link>
            )}
          </div>

          {/* Right actions */}
          <div className="navbar-actions">
            {user ? (
              <>
                <InboxBell user={user} />
                <button
                  className="user-avatar-btn"
                  onClick={() => navigate('/profile')}
                  title="My Profile"
                >
                  {user.photo
                    ? <img src={user.photo} alt={user.name} className="nav-avatar-image" />
                    : user.name.charAt(0).toUpperCase()}
                </button>
                <button onClick={logout} className="btn btn-outline btn-sm">Logout</button>
              </>
            ) : (
              <Link to="/register" className="btn btn-primary btn-sm">Join Now</Link>
            )}
          </div>

          <button
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="hamburger"></span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
