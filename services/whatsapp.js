const axios = require('axios');
const crypto = require('crypto');
const { URLSearchParams } = require('url');

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || '';
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v20.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';

function normalizePhoneNumber(phoneNumber = '') {
  return String(phoneNumber || '').replace(/[^\d]/g, '');
}

function buildWhatsAppAddress(phoneNumber = '') {
  const normalized = normalizePhoneNumber(phoneNumber);
  return normalized ? `whatsapp:+${normalized}` : '';
}

function buildTwilioMessageUrl() {
  return `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
}

function buildMetaMessageUrl() {
  return `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
}

function normalizeParams(params = {}) {
  const result = {};
  for (const key of Object.keys(params)) {
    const value = params[key];
    if (Array.isArray(value)) {
      result[key] = value.join('');
    } else if (value && typeof value === 'object') {
      result[key] = JSON.stringify(value);
    } else {
      result[key] = String(value || '');
    }
  }
  return result;
}

function validateTwilioSignature(signature, url, params = {}, authToken) {
  if (!signature || !authToken) {
    return false;
  }

  const normalizedParams = normalizeParams(params);
  const keys = Object.keys(normalizedParams).sort();
  let payload = url;
  for (const key of keys) {
    payload += key + normalizedParams[key];
  }

  const expected = crypto.createHmac('sha1', authToken).update(payload, 'utf8').digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expected, 'utf8'));
  } catch (error) {
    return false;
  }
}

function parseRequestParams(rawBody) {
  if (Buffer.isBuffer(rawBody)) {
    return Object.fromEntries(new URLSearchParams(rawBody.toString('utf8')));
  }

  if (typeof rawBody === 'string') {
    return Object.fromEntries(new URLSearchParams(rawBody));
  }

  if (typeof rawBody === 'object' && rawBody !== null) {
    return rawBody;
  }

  return {};
}

function buildTemplateBody(templateName, variables = {}) {
  const templates = {
    registration_confirmation: 'Hi {name}, you’re confirmed for {eventName} on {eventDate}.',
    event_reminder: 'Reminder: {eventName} is coming up on {eventDate}. See you there!'
  };

  const template = templates[templateName];
  if (!template) {
    return null;
  }

  return template.replace(/\{([^}]+)\}/g, (_, key) => {
    return String(variables[key] ?? '').trim();
  });
}

async function sendTextMessage({ to, body } = {}) {
  const text = String(body || '').trim();
  const toAddress = buildWhatsAppAddress(to);

  if (!toAddress) {
    return { ok: false, skipped: true, reason: 'missing-recipient' };
  }

  if (!text) {
    return { ok: false, skipped: true, reason: 'missing-body' };
  }

  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_FROM) {
    const payload = new URLSearchParams({
      To: toAddress,
      From: TWILIO_WHATSAPP_FROM,
      Body: text
    });

    const response = await axios.post(buildTwilioMessageUrl(), payload.toString(), {
      auth: {
        username: TWILIO_ACCOUNT_SID,
        password: TWILIO_AUTH_TOKEN
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 15000
    });

    return {
      ok: true,
      provider: 'twilio',
      response: response.data,
      messageId: response.data?.sid || null
    };
  }

  if (WHATSAPP_PHONE_NUMBER_ID && WHATSAPP_ACCESS_TOKEN) {
    const url = buildMetaMessageUrl();
    const payload = {
      messaging_product: 'whatsapp',
      to: normalizePhoneNumber(to),
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

  return { ok: false, skipped: true, reason: 'missing-provider-config' };
}

async function sendTemplate({ to, templateName, variables } = {}) {
  const body = buildTemplateBody(templateName, variables);
  if (!body) {
    return { ok: false, skipped: true, reason: 'unknown-template' };
  }
  return sendTextMessage({ to, body });
}

module.exports = {
  normalizePhoneNumber,
  buildWhatsAppAddress,
  validateTwilioSignature,
  parseRequestParams,
  sendTextMessage,
  sendTemplate
};
