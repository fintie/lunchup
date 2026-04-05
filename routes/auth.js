const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const User = require('../models/User');

// In-memory demo users (fallback when MongoDB is unavailable)
const demoUsers = new Map();

// Australian first names
const firstNames = [
  'James', 'Oliver', 'William', 'Jack', 'Thomas', 'Lachlan', 'Angus', 'Hamish',
  'Charlotte', 'Olivia', 'Amelia', 'Isla', 'Ava', 'Mia', 'Grace', 'Ruby',
  'Sophie', 'Chloe', 'Emily', 'Hannah', 'Jessica', 'Sarah', 'Emma', 'Kate',
  'Liam', 'Noah', 'Mason', 'Ethan', 'Lucas', 'Henry', 'Alexander', 'Sebastian',
  'Ivy', 'Willow', 'Harper', 'Evelyn', 'Scarlett', 'Violet', 'Hazel', 'Aurora'
];

// Australian surnames
const lastNames = [
  'Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Johnson', 'White',
  'Martin', 'Anderson', 'Thompson', 'Murphy', 'Kelly', 'Lee', 'Ryan', 'Clark',
  'Lewis', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott',
  'Green', 'Baker', 'Adams', 'Nelson', 'Hill', 'Ramirez', 'Campbell', 'Mitchell'
];

// Professional backgrounds
const backgrounds = [
  'Software Engineer at Atlassian',
  'Product Manager at Canva',
  'Marketing Director at REA Group',
  'Data Scientist at Commonwealth Bank',
  'UX Designer at Seek',
  'Financial Analyst at Macquarie Group',
  'Business Development Manager at Xero',
  'Operations Manager at Woolworths',
  'HR Business Partner at Telstra',
  'Sales Director at Salesforce',
  'Project Manager at Deloitte',
  'Strategy Consultant at McKinsey',
  'Brand Manager at Unilever',
  'Digital Marketing Specialist at Google',
  'Software Developer at Amazon',
  'Product Designer at Afterpay',
  'Data Analyst at NAB',
  'Account Manager at Microsoft',
  'Content Strategist at Netflix',
  'Growth Manager at Airwallex'
];

// Skills
const allSkills = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'Go',
  'Product Strategy', 'Agile', 'Scrum', 'Data Analysis', 'Machine Learning',
  'UX Design', 'UI Design', 'Figma', 'Sketch', 'User Research',
  'Digital Marketing', 'SEO', 'Content Strategy', 'Social Media', 'Brand Strategy',
  'Project Management', 'Leadership', 'Team Building', 'Communication',
  'Business Development', 'Sales', 'Negotiation', 'Account Management',
  'Financial Modeling', 'Investment Analysis', 'Risk Management',
  'Cloud Computing', 'AWS', 'Azure', 'DevOps', 'Kubernetes', 'Docker'
];

// Topics
const allTopics = [
  'Career Growth', 'Startup Life', 'Tech Trends', 'Leadership',
  'Work-Life Balance', 'Entrepreneurship', 'Innovation', 'Digital Transformation',
  'Team Management', 'Product Development', 'User Experience', 'Design Thinking',
  'Marketing Strategy', 'Brand Building', 'Customer Acquisition', 'Growth Hacking',
  'Investment', 'Financial Planning', 'Property Investment', 'Cryptocurrency',
  'Health & Wellness', 'Fitness', 'Mindfulness', 'Mental Health',
  'Travel', 'Food & Dining', 'Wine Tasting', 'Coffee Culture',
  'Sports', 'Surfing', 'Running', 'Yoga', 'Hiking',
  'Arts & Culture', 'Music', 'Photography', 'Film', 'Books'
];

// Locations
const locations = [
  { location: 'Sydney - CBD', meetingPoint: 'Circular Quay' },
  { location: 'Sydney - CBD', meetingPoint: 'Martin Place' },
  { location: 'Sydney - Surry Hills', meetingPoint: 'Crown Street' },
  { location: 'Sydney - Bondi Beach', meetingPoint: 'Bondi Pavilion' },
  { location: 'Sydney - Manly', meetingPoint: 'Manly Wharf' },
  { location: 'Sydney - North Sydney', meetingPoint: 'Miller Street' },
  { location: 'Sydney - Newtown', meetingPoint: 'King Street' },
  { location: 'Sydney - Pyrmont', meetingPoint: 'The Star Casino' },
  { location: 'Melbourne - CBD', meetingPoint: 'Flinders Street Station' },
  { location: 'Melbourne - CBD', meetingPoint: 'Collins Street' },
  { location: 'Melbourne - Fitzroy', meetingPoint: 'Brunswick Street' },
  { location: 'Melbourne - St Kilda', meetingPoint: 'Acland Street' },
  { location: 'Melbourne - South Yarra', meetingPoint: 'Chapel Street' },
  { location: 'Melbourne - Carlton', meetingPoint: 'Lygon Street' },
  { location: 'Melbourne - Richmond', meetingPoint: 'Bridge Road' },
  { location: 'Melbourne - Docklands', meetingPoint: 'Harbour Town' },
  { location: 'Brisbane - CBD', meetingPoint: 'Queen Street Mall' },
  { location: 'Brisbane - South Bank', meetingPoint: 'South Bank Parklands' },
  { location: 'Brisbane - Fortitude Valley', meetingPoint: 'James Street' },
  { location: 'Brisbane - New Farm', meetingPoint: 'Brunswick Street' },
  { location: 'Brisbane - West End', meetingPoint: 'Boundary Street' },
  { location: 'Brisbane - Kangaroo Point', meetingPoint: 'Kangaroo Point Cliffs' }
];

// Bios
const bios = [
  'Passionate about building great products and connecting with like-minded professionals.',
  'Love exploring new cafes and discussing the latest tech trends over lunch.',
  'Always keen to meet new people and share ideas about innovation and startups.',
  'Enjoy meaningful conversations about career growth and personal development.',
  'Foodie and tech enthusiast looking to expand my professional network.',
  'Believer in the power of face-to-face connections in a digital world.',
  'Love mentoring others and learning from experienced professionals.',
  'Passionate about sustainability and making a positive impact.',
  'Enjoy discussing books, travel, and everything in between.',
  'Looking to connect with professionals from diverse backgrounds.'
];

// Helper to get random items from array
const getRandomItems = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
};

// Generate 70 demo users synchronously (without hashing for speed)
const generateDemoUsers = () => {
  console.log('🌱 Generating 70 demo users...');
  
  for (let i = 0; i < 70; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@lunchup.com`;
    const password = 'password123'; // Same password for all demo users
    
    const locationData = locations[Math.floor(Math.random() * locations.length)];
    
    demoUsers.set(email, {
      _id: `demo_${i + 1}`,
      name,
      email,
      password: '$2a$10$demoHashedPasswordForAllDemoUsers123456789', // Pre-hashed for demo
      professionalBackground: backgrounds[Math.floor(Math.random() * backgrounds.length)],
      skills: getRandomItems(allSkills, Math.floor(Math.random() * 3) + 3),
      preferredTopics: getRandomItems(allTopics, Math.floor(Math.random() * 2) + 2),
      preferredLocation: locationData.location,
      preferredMeetingPoint: locationData.meetingPoint,
      profilePicture: `https://i.pravatar.cc/300?img=${(i % 70) + 1}`,
      bio: bios[Math.floor(Math.random() * bios.length)],
      isOnline: Math.random() > 0.5,
      lastActive: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 7))
    });
  }
  
  // Add main demo user
  demoUsers.set('demo@lunchup.com', {
    _id: 'demo_0',
    name: 'Demo User',
    email: 'demo@lunchup.com',
    password: '$2a$10$demoHashedPasswordForAllDemoUsers123456789',
    professionalBackground: 'Developer',
    skills: ['JavaScript', 'React', 'Node.js'],
    preferredTopics: ['Tech Trends', 'Startups'],
    preferredLocation: 'Sydney - CBD',
    preferredMeetingPoint: 'Circular Quay',
    profilePicture: 'https://i.pravatar.cc/300?img=1',
    bio: 'Demo user for testing',
    isOnline: true,
    lastActive: new Date()
  });
  
  console.log(`✅ ${demoUsers.size} demo users initialized`);
  console.log('📧 Demo login: demo@lunchup.com / password123');
};

// Initialize demo users immediately
generateDemoUsers();

// Helper to check MongoDB health
const checkMongoHealth = async () => {
  try {
    await mongoose.connection.db.admin().ping();
    return true;
  } catch (e) {
    return false;
  }
};


const createResetToken = () => crypto.randomBytes(32).toString('hex');

const getBaseUrl = (req) => {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '');
  }

  const host = req.get('host');
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
  return `${protocol}://${host}`;
};

const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const sendResetEmail = async ({ to, resetLink }) => {
  const transporter = createTransporter();

  if (!transporter) {
    return false;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'Reset your LunchUp password',
    text: `Reset your LunchUp password by visiting this link: ${resetLink}

This link expires in 1 hour.`,
    html: `<p>Reset your LunchUp password by clicking the link below:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link expires in 1 hour.</p>`
  });

  return true;
};

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const demoUser = demoUsers.get(normalizedEmail);

    if (demoUser) {
      const resetToken = createResetToken();
      demoUser.resetPasswordToken = resetToken;
      demoUser.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
      demoUsers.set(normalizedEmail, demoUser);

      return res.json({
        message: 'Reset instructions are ready for this demo account.',
        resetLink: `${getBaseUrl(req)}/#/reset-password/${resetToken}`
      });
    }

    let user = null;
    try {
      user = await User.findOne({ email: normalizedEmail });
    } catch (mongoError) {
      console.log('⚠️  MongoDB unavailable during forgot password');
    }

    if (!user) {
      return res.json({ message: 'If that email exists, we will send reset instructions.' });
    }

    const resetToken = createResetToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetLink = `${getBaseUrl(req)}/#/reset-password/${resetToken}`;
    const emailSent = await sendResetEmail({ to: user.email, resetLink }).catch((error) => {
      console.error('Reset email send error:', error);
      return false;
    });

    return res.json({
      message: emailSent
        ? 'If that email exists, we have sent reset instructions.'
        : 'Reset link generated. Email is not configured on the server yet, so use the link below.',
      ...(emailSent ? {} : { resetLink })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Reset password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const now = new Date();
    const demoUser = Array.from(demoUsers.values()).find(
      (candidate) => candidate.resetPasswordToken === token && candidate.resetPasswordExpires && candidate.resetPasswordExpires > now
    );

    if (demoUser) {
      const salt = await bcrypt.genSalt(10);
      demoUser.password = await bcrypt.hash(password, salt);
      delete demoUser.resetPasswordToken;
      delete demoUser.resetPasswordExpires;
      demoUsers.set(demoUser.email, demoUser);

      return res.json({ message: 'Password reset successful. You can now sign in.' });
    }

    let user = null;
    try {
      user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: now }
      });
    } catch (mongoError) {
      console.log('⚠️  MongoDB unavailable during reset password');
    }

    if (!user) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ message: 'Password reset successful. You can now sign in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Login route - tries demo mode FIRST for speed
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check demo users FIRST (faster, no MongoDB needed)
    let user = demoUsers.get(email);
    
    if (user) {
      // Demo user found
      let isMatch = false;

      if (user.password === '$2a$10$demoHashedPasswordForAllDemoUsers123456789') {
        isMatch = password === 'password123';
      } else {
        isMatch = await bcrypt.compare(password, user.password);
      }

      if (isMatch) {
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
        return;
      }

      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Not a demo user, try MongoDB
    try {
      user = await User.findOne({ email });
    } catch (mongoError) {
      console.log('⚠️  MongoDB unavailable');
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials. Try demo@lunchup.com / password123' });
    }

    // Check password for MongoDB user
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
