const express = require('express');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const router = express.Router();
const DATA_PATH = path.join(__dirname, '..', 'data', 'communityFeed.json');
const META_PATH = path.join(__dirname, '..', 'data', 'communityFeed-meta.json');
const UPDATE_SCRIPT = path.join(__dirname, '..', 'scripts', 'updateCommunityFeed.js');

function readJson(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed || fallback;
  } catch (error) {
    return fallback;
  }
}

function readFeedItems() {
  const items = readJson(DATA_PATH, []);
  return Array.isArray(items) ? items : [];
}

router.get('/', async (req, res) => {
  const items = readFeedItems();
  const meta = readJson(META_PATH, {});

  res.json({
    success: true,
    updatedAt: meta.lastSuccessfulRefreshAt || items[0]?.publishedAt || new Date().toISOString(),
    itemCount: items.length,
    refreshCadence: 'daily',
    region: 'Australia',
    sources: ['Reddit', 'Australian startup news', 'Configured LinkedIn/X feeds'],
    items
  });
});

router.post('/refresh', async (req, res) => {
  execFile('node', [UPDATE_SCRIPT, '--force'], (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to refresh community feed',
        error: stderr || error.message
      });
    }

    const items = readFeedItems();
    return res.json({
      success: true,
      message: stdout.trim() || 'Community feed refreshed',
      items
    });
  });
});

module.exports = router;
