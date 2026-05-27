const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const WhatsAppConversation = require('../models/WhatsAppConversation');
const WhatsAppMessage = require('../models/WhatsAppMessage');
const { normalizePhoneNumber, sendTextMessage } = require('./whatsapp');

const EVT_ID_REGEX = /EVT[_-]?([a-fA-F0-9]{24})/i;
const EMAIL_REGEX = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const YES_REGEX = /^(yes|y(es)?|sure|yeah|ok|okay|confirm|confirmed|👍|✅)$/i;
const DECLINE_REGEX = /^(no|not now|nope|nah)$/i;

function extractMessageEntries(payload = {}) {
  if (payload.From) {
    return [payload];
  }
  return (payload.entry || []).flatMap((entry) =>
    (entry.changes || []).flatMap((change) => change.value?.messages || [])
  );
}

function extractContacts(payload = {}) {
  const map = new Map();
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      for (const contact of change.value?.contacts || []) {
        const phone = normalizePhoneNumber(contact.wa_id || contact.phone_number || '');
        if (phone) {
          map.set(phone, contact);
        }
      }
    }
  }
  return map;
}

function getMessageText(message = {}) {
  if (typeof message.Body === 'string') {
    return message.Body.trim();
  }
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
  const eventDate = new Date(event.startTime).toLocaleString('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  return `Nice — you’re joining Lunchup: ${event.title} on ${eventDate}. What’s your full name?`;
}

function buildAskEmailReply(attendeeName) {
  return attendeeName
    ? `Thanks ${attendeeName}. What’s your email?`
    : 'Great, what’s your email?';
}

function buildConfirmationPrompt(event, attendeeName) {
  return `Perfect. Reply YES to confirm your registration for ${event.title}.`;
}

function buildRegistrationSuccess(event) {
  return `You’re in ✅ I’ve registered you for ${event.title}. I’ll message you if details change.`;
}

function buildFallbackReply() {
  return 'Send me the event code, like EVT_12345, and I’ll register you.';
}

async function resolveEventFromText(text = '') {
  const refMatch = text.match(EVT_ID_REGEX);
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

async function upsertConversation({ phoneNumber, profileName, userId, eventId, lastInboundMessage, state, lastOutboundMessage, metadata = {} }) {
  return WhatsAppConversation.findOneAndUpdate(
    { phoneNumber },
    {
      $set: {
        twilioProfileName: profileName || '',
        profileName: profileName || '',
        userId: userId || null,
        eventId: eventId || null,
        currentEventId: eventId || null,
        lastInboundMessage: lastInboundMessage || '',
        lastOutboundMessage: lastOutboundMessage || '',
        lastMessageAt: new Date(),
        state: state || 'idle',
        metadata: metadata || {}
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function createOrUpdateRegistration({ eventId, phoneNumber, attendeeName, email, conversationId, sourceRef = '', userId = null, status = 'awaiting_name' }) {
  return EventRegistration.findOneAndUpdate(
    { eventId, phoneNumber, channel: 'whatsapp' },
    {
      $set: {
        userId,
        attendeeName: attendeeName || '',
        email: email || '',
        source: 'whatsapp',
        sourceRef,
        status,
        conversationId
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function recordMessage({ conversationId, phoneNumber, direction, twilioMessageSid, body, status, rawPayload = {} }) {
  return WhatsAppMessage.create({
    conversationId,
    phoneNumber,
    direction,
    twilioMessageSid: twilioMessageSid || '',
    body: body || '',
    status: status || (direction === 'inbound' ? 'received' : 'queued'),
    rawPayload
  });
}

async function processInboundMessage({ message, contact }) {
  const phoneNumber = normalizePhoneNumber(message.From || message.from || contact?.wa_id || '');
  const profileName = String(message.ProfileName || contact?.profile?.name || '').trim();
  const text = getMessageText(message);

  if (!phoneNumber || !text) {
    return { ok: true, skipped: true, reason: 'missing-phone-or-text' };
  }

  const normalizedText = text.trim();
  const conversation = await WhatsAppConversation.findOne({ phoneNumber });

  const inboundMessage = await recordMessage({
    conversationId: conversation?._id || null,
    phoneNumber,
    direction: 'inbound',
    twilioMessageSid: message.MessageSid || message.SmsMessageSid || '',
    body: normalizedText,
    status: 'received',
    rawPayload: message
  });

  if (/^stop$/i.test(normalizedText)) {
    const outboundText = 'You’re opted out of WhatsApp follow-ups. Message again anytime to restart.';
    const updatedConversation = await upsertConversation({
      phoneNumber,
      profileName,
      userId: conversation?.userId || null,
      lastInboundMessage: normalizedText,
      lastOutboundMessage: outboundText,
      state: 'stopped'
    });

    const outbound = await sendTextMessage({ to: phoneNumber, body: outboundText });
    await recordMessage({
      conversationId: updatedConversation._id,
      phoneNumber,
      direction: 'outbound',
      twilioMessageSid: outbound.messageId || '',
      body: outboundText,
      status: outbound.ok ? 'queued' : 'failed',
      rawPayload: outbound
    });

    return { ok: true, conversation: updatedConversation, outbound, inboundMessage };
  }

  const eventRef = normalizedText.match(EVT_ID_REGEX);
  const hasEventRef = Boolean(eventRef);
  const matchedEvent = hasEventRef ? await Event.findById(eventRef[1]) : null;

  if (conversation?.state === 'awaiting_name' && conversation.currentEventId && conversation.currentRegistrationId) {
    const attendeeName = normalizedText;
    const registration = await EventRegistration.findByIdAndUpdate(
      conversation.currentRegistrationId,
      {
        $set: {
          attendeeName,
          status: 'awaiting_email'
        }
      },
      { new: true }
    );

    const outboundText = buildAskEmailReply(attendeeName);
    const updatedConversation = await upsertConversation({
      phoneNumber,
      profileName,
      userId: conversation.userId,
      eventId: conversation.currentEventId,
      lastInboundMessage: normalizedText,
      lastOutboundMessage: outboundText,
      state: 'awaiting_email'
    });

    const outbound = await sendTextMessage({ to: phoneNumber, body: outboundText });
    await recordMessage({
      conversationId: updatedConversation._id,
      phoneNumber,
      direction: 'outbound',
      twilioMessageSid: outbound.messageId || '',
      body: outboundText,
      status: outbound.ok ? 'queued' : 'failed',
      rawPayload: outbound
    });

    return { ok: true, conversation: updatedConversation, registration, outbound, inboundMessage };
  }

  if (conversation?.state === 'awaiting_email' && conversation.currentEventId && conversation.currentRegistrationId) {
    const emailMatch = normalizedText.match(EMAIL_REGEX);
    if (!emailMatch) {
      const outboundText = 'I didn’t catch an email address. What is your email?';
      const updatedConversation = await upsertConversation({
        phoneNumber,
        profileName,
        userId: conversation.userId,
        eventId: conversation.currentEventId,
        lastInboundMessage: normalizedText,
        lastOutboundMessage: outboundText,
        state: 'awaiting_email'
      });

      const outbound = await sendTextMessage({ to: phoneNumber, body: outboundText });
      await recordMessage({
        conversationId: updatedConversation._id,
        phoneNumber,
        direction: 'outbound',
        twilioMessageSid: outbound.messageId || '',
        body: outboundText,
        status: outbound.ok ? 'queued' : 'failed',
        rawPayload: outbound
      });
      return { ok: true, conversation: updatedConversation, outbound, inboundMessage };
    }

    const email = emailMatch[0];
    const registration = await EventRegistration.findByIdAndUpdate(
      conversation.currentRegistrationId,
      {
        $set: {
          email,
          status: 'awaiting_confirmation'
        }
      },
      { new: true }
    );

    const event = await Event.findById(conversation.currentEventId);
    const outboundText = buildConfirmationPrompt(event, registration.attendeeName || profileName || 'there');
    const updatedConversation = await upsertConversation({
      phoneNumber,
      profileName,
      userId: conversation.userId,
      eventId: conversation.currentEventId,
      lastInboundMessage: normalizedText,
      lastOutboundMessage: outboundText,
      state: 'awaiting_confirmation'
    });

    const outbound = await sendTextMessage({ to: phoneNumber, body: outboundText });
    await recordMessage({
      conversationId: updatedConversation._id,
      phoneNumber,
      direction: 'outbound',
      twilioMessageSid: outbound.messageId || '',
      body: outboundText,
      status: outbound.ok ? 'queued' : 'failed',
      rawPayload: outbound
    });

    return { ok: true, conversation: updatedConversation, registration, event, outbound, inboundMessage };
  }

  if (conversation?.state === 'awaiting_confirmation' && conversation.currentEventId && conversation.currentRegistrationId) {
    if (YES_REGEX.test(normalizedText)) {
      const registration = await EventRegistration.findByIdAndUpdate(
        conversation.currentRegistrationId,
        {
          $set: {
            status: 'confirmed'
          }
        },
        { new: true }
      );

      const event = await Event.findById(conversation.currentEventId);
      const outboundText = buildRegistrationSuccess(event);
      const updatedConversation = await upsertConversation({
        phoneNumber,
        profileName,
        userId: conversation.userId,
        eventId: conversation.currentEventId,
        lastInboundMessage: normalizedText,
        lastOutboundMessage: outboundText,
        state: 'registered'
      });

      const outbound = await sendTextMessage({ to: phoneNumber, body: outboundText });
      await recordMessage({
        conversationId: updatedConversation._id,
        phoneNumber,
        direction: 'outbound',
        twilioMessageSid: outbound.messageId || '',
        body: outboundText,
        status: outbound.ok ? 'queued' : 'failed',
        rawPayload: outbound
      });

      return { ok: true, conversation: updatedConversation, registration, event, outbound, inboundMessage };
    }

    if (DECLINE_REGEX.test(normalizedText)) {
      const outboundText = 'No problem. Reply YES when you’re ready to confirm your registration.';
      const updatedConversation = await upsertConversation({
        phoneNumber,
        profileName,
        userId: conversation.userId,
        eventId: conversation.currentEventId,
        lastInboundMessage: normalizedText,
        lastOutboundMessage: outboundText,
        state: 'awaiting_confirmation'
      });

      const outbound = await sendTextMessage({ to: phoneNumber, body: outboundText });
      await recordMessage({
        conversationId: updatedConversation._id,
        phoneNumber,
        direction: 'outbound',
        twilioMessageSid: outbound.messageId || '',
        body: outboundText,
        status: outbound.ok ? 'queued' : 'failed',
        rawPayload: outbound
      });
      return { ok: true, conversation: updatedConversation, outbound, inboundMessage };
    }
  }

  if (matchedEvent) {
    const event = matchedEvent;
    const attendeeName = profileName || '';
    const registrationStatus = attendeeName ? 'awaiting_email' : 'awaiting_name';

    const registration = await createOrUpdateRegistration({
      eventId: event._id,
      phoneNumber,
      attendeeName,
      email: '',
      conversationId: conversation?._id || null,
      sourceRef: message.MessageSid || message.SmsMessageSid || '',
      userId: conversation?.userId || null,
      status: registrationStatus
    });

    const outboundText = attendeeName
      ? buildAskEmailReply(attendeeName)
      : buildEventPrompt(event);
    const nextState = attendeeName ? 'awaiting_email' : 'awaiting_name';

    const updatedConversation = await upsertConversation({
      phoneNumber,
      profileName,
      userId: conversation?.userId || null,
      eventId: event._id,
      lastInboundMessage: normalizedText,
      lastOutboundMessage: outboundText,
      state: nextState
    });

    await WhatsAppConversation.findByIdAndUpdate(updatedConversation._id, {
      $set: { currentRegistrationId: registration._id }
    });

    const outbound = await sendTextMessage({ to: phoneNumber, body: outboundText });
    await recordMessage({
      conversationId: updatedConversation._id,
      phoneNumber,
      direction: 'outbound',
      twilioMessageSid: outbound.messageId || '',
      body: outboundText,
      status: outbound.ok ? 'queued' : 'failed',
      rawPayload: outbound
    });

    return { ok: true, event, registration, conversation: updatedConversation, outbound, inboundMessage };
  }

  const fallbackText = buildFallbackReply();
  const updatedConversation = await upsertConversation({
    phoneNumber,
    profileName,
    userId: conversation?.userId || null,
    lastInboundMessage: normalizedText,
    lastOutboundMessage: fallbackText,
    state: 'awaiting_event_ref'
  });

  const outbound = await sendTextMessage({ to: phoneNumber, body: fallbackText });
  await recordMessage({
    conversationId: updatedConversation._id,
    phoneNumber,
    direction: 'outbound',
    twilioMessageSid: outbound.messageId || '',
    body: fallbackText,
    status: outbound.ok ? 'queued' : 'failed',
    rawPayload: outbound
  });

  return { ok: true, conversation: updatedConversation, outbound, inboundMessage };
}

async function handleIncomingWebhook(payload = {}) {
  const contacts = extractContacts(payload);
  const messages = extractMessageEntries(payload);
  const results = [];

  for (const message of messages) {
    const phoneNumber = normalizePhoneNumber(message.From || message.from || '');
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
