const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

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

// Seed endpoint - creates 70 Australian users in MongoDB
router.post('/seed', async (req, res) => {
  try {
    console.log('🌱 Starting database seed...');
    
    // Check if users already exist
    const existingCount = await User.countDocuments({ email: { $regex: /@lunchup\.com$/ } });
    
    if (existingCount >= 70) {
      return res.json({
        success: true,
        message: `Database already has ${existingCount} demo users`,
        count: existingCount,
        seeded: false
      });
    }
    
    // Clear existing demo users (optional - comment out to keep existing)
    // await User.deleteMany({ email: { $regex: /@lunchup\.com$/ } });
    // console.log('🗑️  Cleared existing demo users');
    
    const usersToCreate = [];
    const password = 'password123';
    
    for (let i = 0; i < 70; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@lunchup.com`;
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const locationData = locations[Math.floor(Math.random() * locations.length)];
      
      usersToCreate.push({
        name,
        email,
        password: hashedPassword,
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
    
    // Bulk insert all users
    const result = await User.insertMany(usersToCreate);
    
    console.log(`✅ Seeded ${result.length} users to MongoDB`);
    
    res.json({
      success: true,
      message: `Successfully seeded ${result.length} Australian users to MongoDB`,
      count: result.length,
      seeded: true,
      sample: result.slice(0, 3).map(u => ({
        name: u.name,
        email: u.email,
        location: u.preferredLocation
      }))
    });
  } catch (error) {
    console.error('❌ Seed error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to seed database', 
      error: error.message 
    });
  }
});

// Get seed status
router.get('/seed-status', async (req, res) => {
  try {
    const demoUserCount = await User.countDocuments({ email: { $regex: /@lunchup\.com$/ } });
    const totalCount = await User.countDocuments({});
    
    res.json({
      demoUsers: demoUserCount,
      totalUsers: totalCount,
      needsSeeding: demoUserCount < 70
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
