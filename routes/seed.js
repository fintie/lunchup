const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Seed endpoint - creates 70 Australian users
router.post('/seed', async (req, res) => {
  try {
    console.log('🌱 Starting database seed...');
    
    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');
    
    // Australian user data
    const firstNames = ['James', 'Oliver', 'William', 'Jack', 'Thomas', 'Lachlan', 'Angus', 'Hamish', 'Charlotte', 'Olivia', 'Amelia', 'Isla', 'Ava', 'Mia', 'Grace', 'Ruby'];
    const lastNames = ['Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Johnson', 'White', 'Martin', 'Anderson', 'Thompson', 'Murphy', 'Kelly'];
    
    const backgrounds = [
      'Software Engineer at Atlassian',
      'Product Manager at Canva',
      'Marketing Director at REA Group',
      'Data Scientist at Commonwealth Bank',
      'UX Designer at Seek',
      'Financial Analyst at Macquarie Group',
      'Business Development Manager at Xero',
      'Operations Manager at Woolworths'
    ];
    
    const allSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'Product Strategy', 'Agile', 'Data Analysis', 'UX Design', 'Digital Marketing', 'Leadership'];
    const allTopics = ['Career Growth', 'Startup Life', 'Tech Trends', 'Leadership', 'Innovation', 'Coffee Culture', 'Surfing', 'Travel'];
    
    const sydneyLocations = [
      { location: 'Sydney - Bondi Beach', meetingPoint: 'Bondi Pavilion' },
      { location: 'Sydney - CBD', meetingPoint: 'Circular Quay' },
      { location: 'Sydney - Surry Hills', meetingPoint: 'Crown Street' },
      { location: 'Sydney - Manly', meetingPoint: 'Manly Wharf' }
    ];
    
    const melbourneLocations = [
      { location: 'Melbourne - CBD', meetingPoint: 'Flinders Street Station' },
      { location: 'Melbourne - Fitzroy', meetingPoint: 'Brunswick Street' },
      { location: 'Melbourne - St Kilda', meetingPoint: 'Acland Street' },
      { location: 'Melbourne - South Yarra', meetingPoint: 'Chapel Street' }
    ];
    
    const brisbaneLocations = [
      { location: 'Brisbane - CBD', meetingPoint: 'Queen Street Mall' },
      { location: 'Brisbane - South Bank', meetingPoint: 'South Bank Parklands' },
      { location: 'Brisbane - Fortitude Valley', meetingPoint: 'James Street' },
      { location: 'Brisbane - New Farm', meetingPoint: 'Brunswick Street' }
    ];
    
    const allLocations = [...sydneyLocations, ...melbourneLocations, ...brisbaneLocations];
    
    const users = [];
    
    for (let i = 0; i < 70; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const locationData = allLocations[Math.floor(Math.random() * allLocations.length)];
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      users.push({
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
        password: hashedPassword,
        professionalBackground: backgrounds[Math.floor(Math.random() * backgrounds.length)],
        skills: allSkills.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 3),
        preferredTopics: allTopics.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 2) + 2),
        preferredLocation: locationData.location,
        preferredMeetingPoint: locationData.meetingPoint,
        profilePicture: `https://i.pravatar.cc/300?img=${(i % 70) + 1}`,
        bio: 'Passionate about connecting with professionals over lunch!',
        isOnline: Math.random() > 0.5
      });
    }
    
    await User.insertMany(users);
    
    console.log(`✅ Seeded ${users.length} users`);
    
    res.json({
      success: true,
      message: `Successfully seeded ${users.length} Australian users`,
      count: users.length
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

module.exports = router;
