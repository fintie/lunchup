const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// In-memory demo users storage (same as auth.js)
const demoUsers = new Map();
let demoUserId = 1;

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, professionalBackground, skills, preferredTopics, preferredLocation, preferredMeetingPoint, bio } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    let user;
    let isNewUser = false;

    // Try MongoDB first
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user in MongoDB
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        professionalBackground,
        skills,
        preferredTopics,
        preferredLocation,
        preferredMeetingPoint,
        bio
      });

      await newUser.save();
      user = newUser;
      isNewUser = true;
      
      console.log(`✅ User registered in MongoDB: ${email}`);
    } catch (mongoError) {
      console.log('MongoDB unavailable, using demo mode for registration');
      
      // Fall back to demo mode
      if (demoUsers.has(email)) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = {
        _id: `demo_${demoUserId++}`,
        name,
        email,
        password: hashedPassword,
        professionalBackground,
        skills,
        preferredTopics,
        preferredLocation,
        preferredMeetingPoint,
        bio
      };

      demoUsers.set(email, user);
      isNewUser = true;
      
      console.log(`✅ User registered in demo mode: ${email}`);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('❌ Register error:', error.message);
    console.error('Error details:', error);
    
    // More specific error messages
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    if (error.name === 'MongoServerError') {
      return res.status(503).json({ message: 'Database unavailable. Please try again later.' });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users (for matching)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let users = [];
    
    // Check if current user is a demo user
    const isDemoUser = req.userId && req.userId.startsWith('demo_');
    
    if (isDemoUser) {
      // Return demo users directly without MongoDB query
      const demoUsersArray = Array.from(demoUsers.values())
        .filter(u => u._id !== req.userId)
        .map(u => ({
          _id: u._id,
          name: u.name,
          email: u.email,
          professionalBackground: u.professionalBackground,
          skills: u.skills,
          preferredTopics: u.preferredTopics,
          preferredLocation: u.preferredLocation,
          preferredMeetingPoint: u.preferredMeetingPoint,
          profilePicture: u.profilePicture,
          bio: u.bio,
          isOnline: u.isOnline,
          lastActive: u.lastActive
        }));
      
      users = demoUsersArray.slice(0, 70); // Return all 70
    } else {
      // Try MongoDB for real users
      try {
        users = await User.find({ _id: { $ne: req.userId } })
          .select('-password')
          .limit(50);
      } catch (mongoError) {
        console.log('MongoDB unavailable, returning demo users');
        
        const demoUsersArray = Array.from(demoUsers.values())
          .filter(u => u._id !== req.userId)
          .map(u => ({
            _id: u._id,
            name: u.name,
            email: u.email,
            professionalBackground: u.professionalBackground,
            skills: u.skills,
            preferredTopics: u.preferredTopics,
            preferredLocation: u.preferredLocation,
            preferredMeetingPoint: u.preferredMeetingPoint,
            profilePicture: u.profilePicture,
            bio: u.bio,
            isOnline: u.isOnline,
            lastActive: u.lastActive
          }));
        
        users = demoUsersArray.slice(0, 70);
      }
    }
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user profile by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    // Verify user can only update their own profile
    if (req.params.id !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
