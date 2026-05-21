const express = require('express');
const router = express.Router();
const { handleIncomingWebhook } = require('../services/whatsappFlow');

router.get('/webhook', (req, res) => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || '';
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token && token === verifyToken) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

router.post('/webhook', async (req, res) => {
  try {
    const result = await handleIncomingWebhook(req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return res.status(500).json({ message: 'Failed to process WhatsApp webhook', error: error.message });
  }
});

module.exports = router;
