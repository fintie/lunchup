const express = require('express');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const router = express.Router();
const DATA_PATH = path.join(__dirname, '..', 'data', 'opportunities.json');
const UPDATE_SCRIPT = path.join(__dirname, '..', 'scripts', 'updateOpportunities.js');

function readOpportunities() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

router.get('/', async (req, res) => {
  const items = readOpportunities();
  res.json({
    success: true,
    updatedAt: items[0]?.publishedAt || new Date().toISOString(),
    itemCount: items.length,
    region: 'Sydney / Melbourne',
    categories: ['AI', 'Data', 'IT', 'Marketing'],
    items
  });
});

router.post('/refresh', async (req, res) => {
  execFile('node', [UPDATE_SCRIPT], (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to refresh opportunities feed',
        error: stderr || error.message
      });
    }

    const items = readOpportunities();
    return res.json({
      success: true,
      message: stdout.trim() || 'Opportunities refreshed',
      items
    });
  });
});

module.exports = router;
