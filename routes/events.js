const express = require('express');
const router = express.Router();
const { execFile } = require('child_process');
const path = require('path');
const {
  seedSampleEvents,
  listEvents,
  runRecommendations,
  getRecommendationsForUser,
  buildWhatsAppRegistration
} = require('../services/nixieEvents');

router.get('/', async (req, res) => {
  try {
    const events = await listEvents(req.query.city);
    return res.json({ items: events, count: events.length });
  } catch (error) {
    console.error('List events error:', error);
    return res.status(500).json({ message: 'Failed to list events', error: error.message });
  }
});

router.post('/seed', async (req, res) => {
  try {
    const result = await seedSampleEvents();
    return res.json({ ok: true, ...result });
  } catch (error) {
    console.error('Seed events error:', error);
    return res.status(500).json({ message: 'Failed to seed events', error: error.message });
  }
});

router.post('/update', async (req, res) => {
  try {
    const updateScript = path.join(__dirname, '..', 'scripts', 'updateEvents.js');
    execFile('node', [updateScript], { timeout: 10 * 60 * 1000 }, (error, stdout, stderr) => {
      if (error) {
        console.error('Update events error:', stderr || error.message);
        return res.status(500).json({ ok: false, message: 'Failed to update events', error: (stderr || error.message || '').trim() });
      }
      return res.json({ ok: true, message: stdout.trim() });
    });
  } catch (error) {
    console.error('Update events error:', error);
    return res.status(500).json({ ok: false, message: 'Failed to trigger event update', error: error.message });
  }
});

router.post('/:eventId/register-whatsapp', async (req, res) => {
  try {
    const result = await buildWhatsAppRegistration({
      eventId: req.params.eventId,
      userId: req.body.userId,
      userName: req.body.userName,
      phoneNumber: req.body.phoneNumber
    });
    return res.json({ ok: true, ...result });
  } catch (error) {
    console.error('WhatsApp event registration error:', error);
    return res.status(500).json({ message: 'Failed to build WhatsApp event registration', error: error.message });
  }
});

router.post('/recommendations/run', async (req, res) => {
  try {
    const result = await runRecommendations({ userId: req.body.userId });
    return res.json(result);
  } catch (error) {
    console.error('Run event recommendations error:', error);
    return res.status(500).json({ message: 'Failed to run event recommendations', error: error.message });
  }
});

router.get('/recommendations/:userId', async (req, res) => {
  try {
    const items = await getRecommendationsForUser(req.params.userId);
    return res.json(items);
  } catch (error) {
    console.error('Get event recommendations error:', error);
    return res.status(500).json({ message: 'Failed to load event recommendations', error: error.message });
  }
});

module.exports = router;
