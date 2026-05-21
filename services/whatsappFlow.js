const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const WhatsAppConversation = require('../models/WhatsAppConversation');
const { formatPhoneNumber, sendTextMessage } = require('./whatsapp');

const REF_REGEX = /REF\s*:\s*EVT_([a-fA-F0-9]{24})/i;

function extractMessageEntries(payload = {}) {
  return (payload.entry || []).flatMap((entry) =>
    (entry.changes || []).flatMap((change) => change.value?.messages || [])
  );
}

function extractContacts(payload = {}) {
  const map = new Map();
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      for (const contact of change.value?.contacts || []) {
        const phone = formatPhoneNumber(contact.wa_id || contact.phone_number || '');
        if (phone) {
          map.set(phone, contact);
        }
      }
    }
  }
  return map;
}

function getMessageText(message = {}) {
  if (message.type === 'text') {
    return String(message.text?.body || '').trim();
  }
  if (message.button?.text) {
    return String(message.button.text).trim();
  }
  if (message.interactive?.button_reply?.title) {
    return String(message.interactive.button_reply.title).trim();
  }
  return '';
}

function buildEventPrompt(event) {
  return `Great, I can help with that. You’re registering for ${event.title} on ${new Date(event.startTime).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })} at ${event.venueName || event.city}. What name should I register you under?`;
}

function buildConfirmedReply({ event, attendeeName }) {
  return `Done, ${attendeeName}. You’re registered for ${event.title}. Event link: ${event.url}`;
}

function buildFallbackReply() {
  return 'I can help you register for Lunchup events on WhatsApp. Try sending: “Register me for AI Founder Breakfast at UTS”.';
}

async function resolveEventFromText(text = '') {
  const refMatch = text.match(REF_REGEX);
  if (refMatch) {
    const event = await Event.findById(refMatch[1]);
    if (event) {
      return event;
    }
  }

  const normalized = text.toLowerCase();
  const events = await Event.find({}).sort({ startTime: 1 }).limit(50);
  return events.find((event) => normalized.includes(String(event.title || '').toLowerCase())) || null;
}

async function upsertConversation({ phoneNumber, profileName, userId, eventId, lastInboundText }) {
  return WhatsAppConversation.findOneAndUpdate(
    { phoneNumber },
    {
      $set: {
        profileName: profileName || '',
        userId: userId || null,
        currentEventId: eventId || null,
        lastInboundText: lastInboundText || '',
        lastMessageAt: new Date()
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function upsertRegistration({ eventId, phoneNumber, attendeeName, conversationId, source = 'whatsapp_inbound', shareUrl = '', notes = '', userId = null }) {
  const nextStatus = attendeeName ? 'confirmed' : 'awaiting_name';
  return EventRegistration.findOneAndUpdate(
    { eventId, phoneNumber, channel: 'whatsapp' },
    {
      $set: {
        userId,
        attendeeName: attendeeName || '',
        source,
        status: nextStatus,
        shareUrl,
        notes,
        conversationId
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function processInboundMessage({ message, contact }) {
  const phoneNumber = formatPhoneNumber(message.from || contact?.wa_id || '');
  const profileName = contact?.profile?.name || '';
  const text = getMessageText(message);

  if (!phoneNumber || !text) {
    return { ok: true, skipped: true, reason: 'missing-phone-or-text' };
  }

  const normalizedText = text.trim();
  const existingConversation = await WhatsAppConversation.findOne({ phoneNumber });

  if (/^stop$/i.test(normalizedText)) {
    const stoppedConversation = await WhatsAppConversation.findOneAndUpdate(
      { phoneNumber },
      {
        $set: {
          profileName,
          lastInboundText: normalizedText,
          lastOutboundText: 'You’re opted out of WhatsApp follow-ups. Message again anytime to restart.',
          lastMessageAt: new Date(),
          state: 'stopped'
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const outboundText = 'You’re opted out of WhatsApp follow-ups. Message again anytime to restart.';
    const outbound = await sendTextMessage({ to: phoneNumber, body: outboundText });
    return { ok: true, conversation: stoppedConversation, outbound };
  }

  if (existingConversation?.state === 'awaiting_name' && existingConversation.currentEventId && existingConversation.currentRegistrationId) {
    const attendeeName = normalizedText;
    const registration = await EventRegistration.findByIdAndUpdate(
      existingConversation.currentRegistrationId,
      {
        $set: {
          attendeeName,
          status: 'confirmed'
        }
      },
      { new: true }
    );

    const event = registration ? await Event.findById(registration.eventId) : null;
    const outboundText = event ? buildConfirmedReply({ event, attendeeName }) : 'Done, you’re registered.';
    const conversation = await WhatsAppConversation.findOneAndUpdate(
      { phoneNumber },
      {
        $set: {
          profileName,
          lastInboundText: normalizedText,
          lastOutboundText: outboundText,
          lastMessageAt: new Date(),
          state: 'confirmed'
        }
      },
      { new: true }
    );

    const outbound = await sendTextMessage({ to: phoneNumber, body: outboundText });
    return { ok: true, event, registration, conversation, outbound };
  }

  const event = await resolveEventFromText(normalizedText);
  if (!event) {
    const fallbackText = buildFallbackReply();
    const conversation = await WhatsAppConversation.findOneAndUpdate(
      { phoneNumber },
      {
        $set: {
          profileName,
          lastInboundText: normalizedText,
          lastOutboundText: fallbackText,
          lastMessageAt: new Date(),
          state: 'awaiting_event'
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const outbound = await sendTextMessage({ to: phoneNumber, body: fallbackText });
    return { ok: true, conversation, outbound, event: null };
  }

  const conversation = await upsertConversation({
    phoneNumber,
    profileName,
    userId: existingConversation?.userId || null,
    eventId: event._id,
    lastInboundText: normalizedText
  });

  const attendeeName = profileName || '';
  const registration = await upsertRegistration({
    eventId: event._id,
    phoneNumber,
    attendeeName,
    conversationId: conversation._id,
    notes: normalizedText,
    userId: conversation.userId || null
  });

  const outboundText = attendeeName
    ? buildConfirmedReply({ event, attendeeName })
    : buildEventPrompt(event);

  const nextState = attendeeName ? 'confirmed' : 'awaiting_name';
  const updatedConversation = await WhatsAppConversation.findByIdAndUpdate(
    conversation._id,
    {
      $set: {
        currentRegistrationId: registration._id,
        state: nextState,
        lastOutboundText: outboundText,
        lastMessageAt: new Date()
      }
    },
    { new: true }
  );

  if (!attendeeName) {
    await EventRegistration.findByIdAndUpdate(registration._id, {
      $set: {
        status: 'awaiting_name'
      }
    });
  }

  const outbound = await sendTextMessage({ to: phoneNumber, body: outboundText });
  return { ok: true, event, registration, conversation: updatedConversation, outbound };
}

async function handleIncomingWebhook(payload = {}) {
  const contacts = extractContacts(payload);
  const messages = extractMessageEntries(payload);
  const results = [];

  for (const message of messages) {
    const phoneNumber = formatPhoneNumber(message.from || '');
    const contact = contacts.get(phoneNumber);
    results.push(await processInboundMessage({ message, contact }));
  }

  return {
    ok: true,
    processed: results.length,
    results
  };
}

module.exports = {
  handleIncomingWebhook,
  resolveEventFromText,
  processInboundMessage,
  extractMessageEntries
};
