const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

// Australian first names
const firstNames = [
  // Male
  'James', 'Oliver', 'William', 'Jack', 'Thomas', 'Lachlan', 'Angus', 'Hamish',
  'Campbell', 'Fraser', 'Rory', 'Callum', 'Duncan', 'Ewan', 'Stuart', 'Malcolm',
  'Charlotte', 'Olivia', 'Amelia', 'Isla', 'Ava', 'Mia', 'Grace', 'Ruby',
  'Sophie', 'Chloe', 'Emily', 'Hannah', 'Jessica', 'Sarah', 'Emma', 'Kate',
  'Liam', 'Noah', 'Mason', 'Ethan', 'Lucas', 'Henry', 'Alexander', 'Sebastian',
  'Jackson', 'Aiden', 'Owen', 'Dylan', 'Ryan', 'Nathan', 'Isaac', 'Gabriel',
  'Ivy', 'Willow', 'Harper', 'Evelyn', 'Scarlett', 'Violet', 'Hazel', 'Aurora',
  'Luna', 'Stella', 'Nova', 'Emilia', 'Penelope', 'Clara', 'Alice', 'Matilda'
];

// Australian surnames
const lastNames = [
  'Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Johnson', 'White',
  'Martin', 'Anderson', 'Thompson', 'Nguyen', 'Thomas', 'Roberts', 'Walker',
  'Harris', 'Lee', 'Ryan', 'Lewis', 'Graham', 'Murphy', 'King', 'Clark', 'Wright',
  'Mitchell', 'Young', 'Phillips', 'Patterson', 'Turner', 'Campbell', 'Scott',
  'Edwards', 'Stewart', 'Morris', 'Rogers', 'Reed', 'Cook', 'Morgan', 'Bell',
  'Bailey', 'Howard', 'Ward', 'Cooper', 'Richardson', 'Cox', 'Hughes', 'Wood',
  'Watson', 'Brooks', 'Kelly', 'Sanders', 'Price', 'Bennett', 'Gray', 'James',
  'Reynolds', 'Powell', 'Sullivan', 'Russell', 'Ford', 'Hamilton', 'Graham'
];

// Professional backgrounds
const professionalBackgrounds = [
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
  'Growth Manager at Airwallex',
  'Engineering Manager at Atlassian',
  'Marketing Manager at Qantas',
  'Business Analyst at Accenture',
  'Customer Success Manager at Zendesk',
  'Technical Lead at Atlassian',
  'Product Owner at Domain',
  'Scrum Master at ING',
  'DevOps Engineer at AWS',
  'Frontend Developer at Culture Amp',
  'Backend Engineer at SafetyCulture'
];

// Skills
const skillsList = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'Go',
  'Product Strategy', 'Agile', 'Scrum', 'Data Analysis', 'Machine Learning',
  'UX Design', 'UI Design', 'Figma', 'Sketch', 'User Research',
  'Digital Marketing', 'SEO', 'Content Strategy', 'Social Media', 'Brand Strategy',
  'Project Management', 'Leadership', 'Team Building', 'Communication',
  'Business Development', 'Sales', 'Negotiation', 'Account Management',
  'Financial Modeling', 'Investment Analysis', 'Risk Management',
  'Cloud Computing', 'AWS', 'Azure', 'DevOps', 'Kubernetes', 'Docker',
  'Mobile Development', 'iOS', 'Android', 'React Native', 'Flutter',
  'Data Science', 'SQL', 'Tableau', 'Power BI', 'Statistics'
];

// Preferred topics
const preferredTopicsList = [
  'Career Growth', 'Startup Life', 'Tech Trends', 'Leadership',
  'Work-Life Balance', 'Entrepreneurship', 'Innovation', 'Digital Transformation',
  'Team Management', 'Product Development', 'User Experience', 'Design Thinking',
  'Marketing Strategy', 'Brand Building', 'Customer Acquisition', 'Growth Hacking',
  'Investment', 'Financial Planning', 'Property Investment', 'Cryptocurrency',
  'Health & Wellness', 'Fitness', 'Mindfulness', 'Mental Health',
  'Travel', 'Food & Dining', 'Wine Tasting', 'Coffee Culture',
  'Sports', 'Surfing', 'Running', 'Yoga', 'Hiking',
  'Arts & Culture', 'Music', 'Photography', 'Film', 'Books',
  'Sustainability', 'Climate Change', 'Social Impact', 'Diversity & Inclusion',
  'AI & Machine Learning', 'Blockchain', 'Web3', 'Metaverse',
  'Networking', 'Mentorship', 'Skill Development', 'Public Speaking'
];

// Sydney locations and meeting points
const sydneyLocations = [
  { location: 'Sydney - Surry Hills', meetingPoint: 'Crown Street' },
  { location: 'Sydney - CBD', meetingPoint: 'Circular Quay' },
  { location: 'Sydney - CBD', meetingPoint: 'Martin Place' },
  { location: 'Sydney - CBD', meetingPoint: 'Wynyard Station' },
  { location: 'Sydney - Surry Hills', meetingPoint: 'Bourke Street' },
  { location: 'Sydney - Darlinghurst', meetingPoint: 'Oxford Street' },
  { location: 'Sydney - Paddington', meetingPoint: 'Oxford Street Shops' },
  { location: 'Sydney - Bondi Junction', meetingPoint: 'Westfield Bondi' },
  { location: 'Sydney - Bondi Beach', meetingPoint: 'Bondi Pavilion' },
  { location: 'Sydney - Manly', meetingPoint: 'Manly Wharf' },
  { location: 'Sydney - North Sydney', meetingPoint: 'Miller Street' },
  { location: 'Sydney - Chatswood', meetingPoint: 'Chatswood Chase' },
  { location: 'Sydney - Parramatta', meetingPoint: 'Westfield Parramatta' },
  { location: 'Sydney - Newtown', meetingPoint: 'King Street' },
  { location: 'Sydney - Pyrmont', meetingPoint: 'The Star Casino' },
  { location: 'Sydney - Barangaroo', meetingPoint: 'Barangaroo Reserve' },
  { location: 'Sydney - Double Bay', meetingPoint: 'Bay Street' },
  { location: 'Sydney - Mosman', meetingPoint: 'Spit Junction' },
  { location: 'Sydney - Neutral Bay', meetingPoint: 'Military Road' },
  { location: 'Sydney - Randwick', meetingPoint: 'Randwick Junction' },
  { location: 'Sydney - Coogee', meetingPoint: 'Coogee Beach' },
  { location: 'Sydney - Maroubra', meetingPoint: 'Maroubra Junction' },
  { location: 'Sydney - Cronulla', meetingPoint: 'Cronulla Beach' }
];

// Melbourne locations and meeting points
const melbourneLocations = [
  { location: 'Melbourne - CBD', meetingPoint: 'Flinders Street Station' },
  { location: 'Melbourne - CBD', meetingPoint: 'Southern Cross Station' },
  { location: 'Melbourne - CBD', meetingPoint: 'Collins Street' },
  { location: 'Melbourne - CBD', meetingPoint: 'Bourke Street Mall' },
  { location: 'Melbourne - South Yarra', meetingPoint: 'Chapel Street' },
  { location: 'Melbourne - Toorak', meetingPoint: 'Toorak Road' },
  { location: 'Melbourne - Richmond', meetingPoint: 'Bridge Road' },
  { location: 'Melbourne - Fitzroy', meetingPoint: 'Brunswick Street' },
  { location: 'Melbourne - Collingwood', meetingPoint: 'Smith Street' },
  { location: 'Melbourne - Carlton', meetingPoint: 'Lygon Street' },
  { location: 'Melbourne - St Kilda', meetingPoint: 'Acland Street' },
  { location: 'Melbourne - Brighton', meetingPoint: 'Bay Street' },
  { location: 'Melbourne - Prahran', meetingPoint: 'Chapel Street' },
  { location: 'Melbourne - Windsor', meetingPoint: 'High Street' },
  { location: 'Melbourne - South Melbourne', meetingPoint: 'Clarendon Street' },
  { location: 'Melbourne - Port Melbourne', meetingPoint: 'Bay Street' },
  { location: 'Melbourne - Docklands', meetingPoint: 'Harbour Town' },
  { location: 'Melbourne - Southbank', meetingPoint: 'Crown Casino' },
  { location: 'Melbourne - East Melbourne', meetingPoint: 'Wellington Parade' },
  { location: 'Melbourne - North Melbourne', meetingPoint: 'Errol Street' },
  { location: 'Melbourne - Parkville', meetingPoint: 'Sydney Road' },
  { location: 'Melbourne - Brunswick', meetingPoint: 'Sydney Road' },
  { location: 'Melbourne - Hawthorn', meetingPoint: 'Glenferrie Road' }
];

// Brisbane locations and meeting points
const brisbaneLocations = [
  { location: 'Brisbane - CBD', meetingPoint: 'Queen Street Mall' },
  { location: 'Brisbane - CBD', meetingPoint: 'King George Square' },
  { location: 'Brisbane - CBD', meetingPoint: 'Central Station' },
  { location: 'Brisbane - South Bank', meetingPoint: 'South Bank Parklands' },
  { location: 'Brisbane - South Bank', meetingPoint: 'Cultural Centre' },
  { location: 'Brisbane - Fortitude Valley', meetingPoint: 'James Street' },
  { location: 'Brisbane - New Farm', meetingPoint: 'Brunswick Street' },
  { location: 'Brisbane - Teneriffe', meetingPoint: 'Vernon Terrace' },
  { location: 'Brisbane - Kangaroo Point', meetingPoint: 'Kangaroo Point Cliffs' },
  { location: 'Brisbane - West End', meetingPoint: 'Boundary Street' },
  { location: 'Brisbane - Highgate Hill', meetingPoint: 'Montague Road' },
  { location: 'Brisbane - Paddington', meetingPoint: 'Latrobe Terrace' },
  { location: 'Brisbane - Milton', meetingPoint: 'Park Road' },
  { location: 'Brisbane - Toowong', meetingPoint: 'Toowong Village' },
  { location: 'Brisbane - Indooroopilly', meetingPoint: 'Indooroopilly Shopping Centre' },
  { location: 'Brisbane - St Lucia', meetingPoint: 'Hawken Drive' },
  { location: 'Brisbane - Newstead', meetingPoint: 'Breakfast Creek' },
  { location: 'Brisbane - Ascot', meetingPoint: 'Racecourse Road' },
  { location: 'Brisbane - Hamilton', meetingPoint: 'Portside Wharf' },
  { location: 'Brisbane - Bulimba', meetingPoint: 'Oxford Street' },
  { location: 'Brisbane - Hawthorne', meetingPoint: 'Hawthorne Road' },
  { location: 'Brisbane - Morningside', meetingPoint: 'Union Street' },
  { location: 'Brisbane - Coorparoo', meetingPoint: 'Holden Street' }
];

// Generate random photo URL using Unsplash source
function generatePhotoUrl(gender) {
  const randomId = Math.floor(Math.random() * 1000);
  // Using picsum.photos for reliable placeholder images
  // In production, you'd use real user photos
  return `https://i.pravatar.cc/300?img=${Math.floor(Math.random() * 70) + 1}`;
}

// Generate random skills (3-6 skills)
function generateSkills() {
  const numSkills = Math.floor(Math.random() * 4) + 3;
  const shuffled = skillsList.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numSkills);
}

// Generate random preferred topics (2-4 topics)
function generatePreferredTopics() {
  const numTopics = Math.floor(Math.random() * 3) + 2;
  const shuffled = preferredTopicsList.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numTopics);
}

// Generate 70 users
async function generateUsers() {
  const users = [];
  const emails = new Set();
  
  for (let i = 0; i < 70; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    
    // Generate unique email
    let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    while (emails.has(email)) {
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}${Math.floor(Math.random() * 100)}@example.com`;
    }
    emails.add(email);
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Select random city and location
    const cityIndex = Math.floor(Math.random() * 3);
    let locationData;
    if (cityIndex === 0) {
      locationData = sydneyLocations[Math.floor(Math.random() * sydneyLocations.length)];
    } else if (cityIndex === 1) {
      locationData = melbourneLocations[Math.floor(Math.random() * melbourneLocations.length)];
    } else {
      locationData = brisbaneLocations[Math.floor(Math.random() * brisbaneLocations.length)];
    }
    
    const user = {
      name: name,
      email: email,
      password: hashedPassword,
      professionalBackground: professionalBackgrounds[Math.floor(Math.random() * professionalBackgrounds.length)],
      skills: generateSkills(),
      preferredTopics: generatePreferredTopics(),
      preferredLocation: locationData.location,
      preferredMeetingPoint: locationData.meetingPoint,
      profilePicture: generatePhotoUrl(),
      bio: generateBio(),
      isOnline: Math.random() > 0.5,
      lastActive: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 7)) // Random time in last 7 days
    };
    
    users.push(user);
  }
  
  return users;
}

// Generate random bio
function generateBio() {
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
    'Looking to connect with professionals from diverse backgrounds.',
    'Coffee lover and startup enthusiast. Always up for a good chat!',
    'Interested in AI, machine learning, and the future of work.',
    'Love exploring Sydney\'s best lunch spots while networking.',
    'Passionate about design thinking and user experience.',
    'Enjoy meeting people from different industries and learning from them.',
    'Food, fitness, and professional growth - my three passions!',
    'Looking for meaningful connections beyond LinkedIn.',
    'Love discussing innovation, leadership, and team culture.',
    'Always curious about new perspectives and ideas.',
    'Enjoy sharing experiences and learning from others\' journeys.'
  ];
  
  return bios[Math.floor(Math.random() * bios.length)];
}

// Main seed function
async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lunchup');
    console.log('✅ Connected to MongoDB');
    
    // Clear existing users (optional - comment out to keep existing users)
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');
    
    // Generate users
    const users = await generateUsers();
    console.log(`📝 Generated ${users.length} users`);
    
    // Insert users
    const createdUsers = await User.insertMany(users);
    console.log(`✅ Successfully seeded ${createdUsers.length} users to the database`);
    
    // Print summary by city
    const sydneyCount = createdUsers.filter(u => u.preferredLocation.includes('Sydney')).length;
    const melbourneCount = createdUsers.filter(u => u.preferredLocation.includes('Melbourne')).length;
    const brisbaneCount = createdUsers.filter(u => u.preferredLocation.includes('Brisbane')).length;
    
    console.log('\n📊 Distribution by city:');
    console.log(`   Sydney: ${sydneyCount} users`);
    console.log(`   Melbourne: ${melbourneCount} users`);
    console.log(`   Brisbane: ${brisbaneCount} users`);
    
    // Print sample users
    console.log('\n👥 Sample users:');
    createdUsers.slice(0, 5).forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.preferredLocation}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed
seedDatabase();
