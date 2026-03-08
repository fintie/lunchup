const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

// In-memory demo users (fallback when MongoDB is unavailable)
const demoUsers = new Map();
let demoUserId = 1;

// Initialize with demo users
const initializeDemoUsers = async () => {
  const demoData = [
    { name: 'Demo User', email: 'demo@lunchup.com', password: 'password123', professionalBackground: 'Developer' }
  ];
  
  for (const data of demoData) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    demoUsers.set(data.email, {
      _id: `demo_${demoUserId++}`,
      ...data,
      password: hashedPassword,
      professionalBackground: data.professionalBackground,
      skills: ['JavaScript', 'React'],
      preferredTopics: ['Tech Trends'],
      preferredLocation: 'Sydney - CBD',
      preferredMeetingPoint: 'Circular Quay'
    });
  }
  console.log('✅ Demo users initialized');
};

initializeDemoUsers();

// Helper to check MongoDB health
const checkMongoHealth = async () => {
  try {
    await mongoose.connection.db.admin().ping();
    return true;
  } catch (e) {
    return false;
  }
};

// Login route - tries demo mode FIRST for speed
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check demo users FIRST (faster)
    let user = demoUsers.get(email);
    
    if (!user) {
      // Not in demo users, try MongoDB
      try {
        user = await User.findOne({ email });
      } catch (mongoError) {
        console.log('⚠️  MongoDB unavailable');
      }
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials. Try demo@lunchup.com / password123' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last active if MongoDB user
    if (user.save && typeof user.save === 'function') {
      try {
        user.lastActive = Date.now();
        user.isOnline = true;
        await user.save();
      } catch (e) {
        // Ignore save errors
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Logout route
router.post('/logout', async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
