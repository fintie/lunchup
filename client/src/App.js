import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Import Components
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import Matches from './components/Matches';
import Meetings from './components/Meetings';
import Navbar from './components/Navbar';

// Determine API URL based on environment
const getApiUrl = () => {
  // Production: use environment variable or derive from window location
  if (process.env.NODE_ENV === 'production') {
    // If REACT_APP_API_URL is set, use it
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
    // If running on Render web service, use the API service URL
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.includes('onrender.com')) {
        // Replace -web with -api in the hostname
        return `https://${hostname.replace('lunchup-web', 'lunchup-api')}`;
      }
    }
  }
  // Development: use localhost
  return 'http://localhost:3001';
};

const API_URL = getApiUrl();
axios.defaults.baseURL = `${API_URL}/api`;
axios.defaults.timeout = 15000; // 15 second timeout

console.log('🌐 API Configuration:');
console.log('  API_URL:', API_URL);
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

// Helper to get user from localStorage
const getUserFromStorage = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: tokenPayload.userId,
      name: localStorage.getItem('userName') || 'User',
      email: localStorage.getItem('userEmail') || ''
    };
  } catch (e) {
    return null;
  }
};

function AppContent() {
  const [user, setUser] = useState(getUserFromStorage());
  const location = useLocation();

  // Check auth state on route change
  useEffect(() => {
    const currentUser = getUserFromStorage();
    setUser(currentUser);
    
    // Set axios header if token exists
    if (currentUser) {
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [location.pathname]);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userName', userData.name);
    localStorage.setItem('userEmail', userData.email);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <div className="App">
      <Navbar user={user} logout={logout} />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={!user ? <Login onAuth={login} /> : <Navigate to="/matches" />}
          />
          <Route
            path="/register"
            element={!user ? <Register onAuth={login} /> : <Navigate to="/matches" />}
          />
          <Route
            path="/profile"
            element={user ? <Profile user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/matches"
            element={user ? <Matches user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/meetings"
            element={user ? <Meetings user={user} /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
