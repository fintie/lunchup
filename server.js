const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config();

console.log('🔧 Environment check:');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('  PORT:', process.env.PORT || 'undefined');
console.log('  MONGODB_URI:', process.env.MONGODB_URI ? '***' : 'undefined');
console.log('  CORS_ORIGIN:', process.env.CORS_ORIGIN || 'undefined');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = [
  'https://lunchup.com.au',
  'https://www.lunchup.com.au',
  'https://lunchup-web.onrender.com'
  , 'http://localhost:3000'
  , 'http://127.0.0.1:3000'
];

if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(...process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean));
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lunchup';

let mongoConnected = false;

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  retryWrites: true,
  retryReads: true
})
  .then(() => {
    mongoConnected = true;
    console.log('✅ MongoDB connected successfully');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Running without database - some features may not work');
  });

// MongoDB connection error handler
mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
  mongoConnected = false;
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
  }
  process.exit(0);
});

// API Routes
app.get('/', (req, res) => {
  res.json({ 
    message: '🍽️ LunchUp API is running!',
    endpoints: {
      auth: '/api/auth/login',
      users: '/api/users',
      match: '/api/match',
      meetings: '/api/meetings',
      events: '/api/events'
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/match', require('./routes/match'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/news', require('./routes/news'));
app.use('/api/community-feed', require('./routes/communityFeed'));
app.use('/api/opportunities', require('./routes/opportunities'));
app.use('/api/events', require('./routes/events'));
app.use('/api/seed', require('./routes/seed'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/wechat-highlights', require('./routes/wechatHighlights'));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
  });
}

const { execFile } = require('child_process');
const newsUpdateScript = path.join(__dirname, 'scripts', 'updateNews.js');
const opportunitiesUpdateScript = path.join(__dirname, 'scripts', 'updateOpportunities.js');
const eventsUpdateScript = path.join(__dirname, 'scripts', 'updateEvents.js');
const communityFeedUpdateScript = path.join(__dirname, 'scripts', 'updateCommunityFeed.js');

function envMs(name, fallbackMs) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallbackMs;
}

function scheduleRefresh(scriptPath, label, intervalMs, options = {}) {
  let running = false;
  let failureCount = 0;
  const timeoutMs = options.timeoutMs || 10 * 60 * 1000;
  const retryBaseMs = options.retryBaseMs || 5 * 60 * 1000;
  const initialDelayMs = options.initialDelayMs || 30 * 1000;

  const runUpdate = () => {
    if (running) {
      console.log(`${label} refresh skipped because previous run is still active`);
      return;
    }

    running = true;
    const startedAt = Date.now();

    execFile('node', [scriptPath], { timeout: timeoutMs }, (error, stdout, stderr) => {
      running = false;

      if (error) {
        failureCount += 1;
        const retryMs = Math.min(retryBaseMs * failureCount, intervalMs);
        console.error(`❌ ${label} refresh failed:`, stderr || error.message);
        console.log(`${label} retry scheduled in ${Math.round(retryMs / 1000)}s`);
        setTimeout(runUpdate, retryMs);
        return;
      }

      failureCount = 0;
      console.log(`${label} ${stdout.trim()} (${Date.now() - startedAt}ms)`);
    });
  };

  setTimeout(runUpdate, initialDelayMs);
  setInterval(runUpdate, intervalMs);
}

scheduleRefresh(newsUpdateScript, '📰', envMs('NEWS_REFRESH_INTERVAL_MS', 60 * 60 * 1000), {
  initialDelayMs: envMs('NEWS_REFRESH_INITIAL_DELAY_MS', 45 * 1000)
});
scheduleRefresh(opportunitiesUpdateScript, '💼', envMs('OPPORTUNITIES_REFRESH_INTERVAL_MS', 2 * 60 * 60 * 1000), {
  initialDelayMs: envMs('OPPORTUNITIES_REFRESH_INITIAL_DELAY_MS', 60 * 1000)
});
scheduleRefresh(eventsUpdateScript, '📅', envMs('EVENTS_REFRESH_INTERVAL_MS', 3 * 60 * 60 * 1000), {
  initialDelayMs: envMs('EVENTS_REFRESH_INITIAL_DELAY_MS', 90 * 1000),
  timeoutMs: envMs('EVENTS_REFRESH_TIMEOUT_MS', 10 * 60 * 1000)
});
scheduleRefresh(communityFeedUpdateScript, '🌐', envMs('COMMUNITY_REFRESH_INTERVAL_MS', 60 * 60 * 1000), {
  initialDelayMs: envMs('COMMUNITY_REFRESH_INITIAL_DELAY_MS', 75 * 1000)
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
