const express = require('express');
const router = express.Router();
const WhatsAppConversation = require('../models/WhatsAppConversation');
const WhatsAppMessage = require('../models/WhatsAppMessage');
const { handleIncomingWebhook } = require('../services/whatsappFlow');
const {
  normalizePhoneNumber,
  validateTwilioSignature,
  parseRequestParams,
  sendTextMessage,
  sendTemplate
} = require('../services/whatsapp');

function getRequestUrl(req) {
  const protocol = req.get('x-forwarded-proto') || req.protocol;
  return `${protocol}://${req.get('host')}${req.originalUrl}`;
}

function verifyTwilioRequest(req) {
  const signature = req.get('x-twilio-signature') || '';
  const authToken = process.env.TWILIO_AUTH_TOKEN || '';
  if (!authToken) {
    return false;
  }
  return validateTwilioSignature(signature, getRequestUrl(req), parseRequestParams(req.body), authToken);
}

function requireInternalApiKey(req, res, next) {
  const apiKey = process.env.WHATSAPP_INTERNAL_API_KEY;
  if (!apiKey) {
    return next();
  }
  if (req.get('x-whatsapp-api-key') !== apiKey) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  return next();
}

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
    if (!verifyTwilioRequest(req)) {
      return res.status(403).json({ message: 'Invalid Twilio signature' });
    }

    const result = await handleIncomingWebhook(req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return res.status(500).json({ message: 'Failed to process WhatsApp webhook', error: error.message });
  }
});

router.post('/status', async (req, res) => {
  try {
    if (!verifyTwilioRequest(req)) {
      return res.status(403).json({ message: 'Invalid Twilio signature' });
    }

    const payload = parseRequestParams(req.body);
    const messageSid = payload.MessageSid || payload.SmsMessageSid || '';
    const status = payload.MessageStatus || payload.SmsStatus || 'unknown';
    const to = normalizePhoneNumber(payload.To || payload.to || '');
    const from = normalizePhoneNumber(payload.From || payload.from || '');
    const phoneNumber = to || from;

    const conversation = phoneNumber
      ? await WhatsAppConversation.findOne({ phoneNumber })
      : null;

    const message = await WhatsAppMessage.findOneAndUpdate(
      { twilioMessageSid: messageSid },
      {
        $set: {
          status,
          rawPayload: payload,
          phoneNumber: phoneNumber || '',
          conversationId: conversation?._id || null,
          direction: 'outbound'
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ ok: true, message, conversation });
  } catch (error) {
    console.error('WhatsApp status callback error:', error);
    return res.status(500).json({ message: 'Failed to process WhatsApp status callback', error: error.message });
  }
});

router.post('/send', requireInternalApiKey, async (req, res) => {
  try {
    const { to, body, conversationId, templateName, variables = {} } = req.body || {};
    let targetPhone = to;
    let conversation = null;

    if (!targetPhone && conversationId) {
      conversation = await WhatsAppConversation.findById(conversationId);
      targetPhone = conversation?.phoneNumber;
    }

    if (!targetPhone) {
      return res.status(400).json({ message: 'Recipient phone number is required' });
    }

    const action = templateName ? sendTemplate({ to: targetPhone, templateName, variables }) : sendTextMessage({ to: targetPhone, body });
    const outbound = await action;

    const message = await WhatsAppMessage.create({
      conversationId: conversation?._id || null,
      phoneNumber: targetPhone,
      direction: 'outbound',
      twilioMessageSid: outbound.messageId || '',
      body: body || '',
      status: outbound.ok ? 'queued' : 'failed',
      rawPayload: outbound
    });

    return res.status(200).json({ ok: outbound.ok, outbound, message });
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return res.status(500).json({ message: 'Failed to send WhatsApp message', error: error.message });
  }
});

router.post('/templates/send', requireInternalApiKey, async (req, res) => {
  try {
    const { to, templateName, variables = {} } = req.body || {};
    if (!to || !templateName) {
      return res.status(400).json({ message: 'Template name and recipient are required' });
    }

    const outbound = await sendTemplate({ to, templateName, variables });
    return res.status(200).json({ ok: outbound.ok, outbound });
  } catch (error) {
    console.error('WhatsApp template send error:', error);
    return res.status(500).json({ message: 'Failed to send WhatsApp template', error: error.message });
  }
});

router.get('/conversations/:phone', requireInternalApiKey, async (req, res) => {
  try {
    const phoneNumber = normalizePhoneNumber(req.params.phone || '');
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Valid phone number required' });
    }

    const conversation = await WhatsAppConversation.findOne({ phoneNumber }).lean();
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = await WhatsAppMessage.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).lean();
    return res.status(200).json({ conversation, messages });
  } catch (error) {
    console.error('WhatsApp conversation lookup error:', error);
    return res.status(500).json({ message: 'Failed to load WhatsApp conversation', error: error.message });
  }
});

module.exports = router;
