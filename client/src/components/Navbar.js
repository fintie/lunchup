import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ user, logout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        <nav className="navbar">
          <Link to="/" className="navbar-logo">
            <span className="logo-icon">🍽️</span>
            <span className="logo-text">LunchUp</span>
          </Link>

          <div className={`navbar-links ${mobileMenuOpen ? 'active' : ''}`}>
            <Link 
              to="/" 
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            {user ? (
              <>
                <Link 
                  to="/matches" 
                  className={`nav-link ${isActive('/matches') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Find Matches
                </Link>
                <Link 
                  to="/meetings" 
                  className={`nav-link ${isActive('/meetings') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Meetings
                </Link>
                <Link 
                  to="/profile" 
                  className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className={`nav-link ${isActive('/login') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          <div className="navbar-actions">
            {user ? (
              <>
                <span className="user-greeting">
                  <span className="user-avatar">
                    {user.photo ? (
                      <img src={user.photo} alt={user.name} className="nav-avatar-image" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="user-name">{user.name}</span>
                </span>
                <button onClick={logout} className="btn btn-outline btn-sm">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/register" className="btn btn-primary btn-sm">
                Join Now
              </Link>
            )}
          </div>

          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="hamburger"></span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
