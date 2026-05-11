const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { assignRole } = require('../utils/roleAssigner');

// Shared demo users map
const { demoUsers } = require('../utils/demoStore');
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
    let mongoUsers = [];
    let demoUsersArray = [];
    
    // Check if current user is a demo user
    const isDemoUser = req.userId && req.userId.startsWith('demo_');
    
    // Try to get MongoDB users
    try {
      mongoUsers = await User.find({ _id: { $ne: req.userId } })
        .select('-password')
        .limit(50);
      console.log(`📊 Loaded ${mongoUsers.length} users from MongoDB`);
    } catch (mongoError) {
      console.log('MongoDB unavailable');
    }
    
    // Always load demo users
    demoUsersArray = Array.from(demoUsers.values())
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
        role: u.role,
        buildPreferences: u.buildPreferences,
        isOnline: u.isOnline,
        lastActive: u.lastActive
      }));
    
    console.log(`📊 Loaded ${demoUsersArray.length} demo users`);
    
    // Combine MongoDB users + demo users
    if (isDemoUser) {
      // Demo user sees all demo users + MongoDB users
      users = [...demoUsersArray, ...mongoUsers];
    } else {
      // MongoDB user sees all MongoDB users + demo users
      users = [...mongoUsers, ...demoUsersArray];
    }
    
    // Remove duplicates (by email) and limit
    const uniqueUsers = users.filter((user, index, self) =>
      index === self.findIndex(u => u.email === user.email)
    ).slice(0, 100); // Limit to 100 total
    
    console.log(`📊 Returning ${uniqueUsers.length} total users`);
    res.json(uniqueUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (req.userId.startsWith('demo_')) {
      const user = Array.from(demoUsers.values()).find(u => u._id === req.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      const { password, ...safeUser } = user;
      return res.json(safeUser);
    }
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
    if (req.params.id.startsWith('demo_')) {
      const user = Array.from(demoUsers.values()).find(u => u._id === req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      const { password, ...safeUser } = user;
      return res.json(safeUser);
    }
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

    const updateData = { ...req.body };
    if (updateData.skills) {
      updateData.role = assignRole(updateData.skills);
    }

    // Demo user fallback
    if (req.params.id.startsWith('demo_')) {
      const existingUser = Array.from(demoUsers.values()).find(u => u._id === req.params.id);
      if (!existingUser) return res.status(404).json({ message: 'User not found' });
      const updatedUser = { ...existingUser, ...updateData };
      demoUsers.set(existingUser.email, updatedUser);
      const { password, ...safeUser } = updatedUser;
      return res.json(safeUser);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
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
