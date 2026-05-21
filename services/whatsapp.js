const axios = require('axios');

const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v20.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';

function formatPhoneNumber(phoneNumber = '') {
  return String(phoneNumber).replace(/[^\d]/g, '');
}

async function sendTextMessage({ to, body } = {}) {
  const normalizedTo = formatPhoneNumber(to);
  const text = String(body || '').trim();

  if (!normalizedTo) {
    return { ok: false, skipped: true, reason: 'missing-recipient' };
  }

  if (!text) {
    return { ok: false, skipped: true, reason: 'missing-body' };
  }

  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    console.log('WhatsApp outbound skipped because provider credentials are missing');
    return { ok: false, skipped: true, reason: 'missing-provider-config' };
  }

  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to: normalizedTo,
    type: 'text',
    text: { body: text }
  };

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    timeout: 15000
  });

  return {
    ok: true,
    provider: 'meta-cloud-api',
    response: response.data,
    messageId: response.data?.messages?.[0]?.id || null
  };
}

module.exports = {
  formatPhoneNumber,
  sendTextMessage
};
