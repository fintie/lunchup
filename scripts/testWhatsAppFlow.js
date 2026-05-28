const assert = require('assert');

process.env.WHATSAPP_PHONE_NUMBER_ID = '';
process.env.WHATSAPP_ACCESS_TOKEN = '';

const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const WhatsAppConversation = require('../models/WhatsAppConversation');
const flow = require('../services/whatsappFlow');
const WhatsAppMessage = require('../models/WhatsAppMessage');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createQuery(result) {
  return {
    sort() { return this; },
    limit() { return Promise.resolve(result); }
  };
}

async function run() {
  const eventId = '507f1f77bcf86cd799439011';
  const registrationId = '507f1f77bcf86cd799439012';
  const conversationId = '507f1f77bcf86cd799439013';

  const event = {
    _id: eventId,
    title: 'AI Founder Breakfast',
    startTime: new Date('2026-05-30T09:00:00+10:00').toISOString(),
    venueName: 'UTS',
    city: 'Sydney',
    url: 'https://lunchup.com.au/events/ai-founder-breakfast'
  };

  const conversationStore = new Map();
  const registrationStore = new Map();
  const messageStore = [];

  Event.findById = async (id) => (id === eventId ? clone(event) : null);
  Event.find = () => createQuery([clone(event)]);

  WhatsAppConversation.findOne = async ({ phoneNumber }) => clone(conversationStore.get(phoneNumber) || null);
  WhatsAppConversation.findOneAndUpdate = async ({ phoneNumber }, update = {}, options = {}) => {
    const existing = conversationStore.get(phoneNumber) || {
      _id: conversationId,
      phoneNumber,
      userId: null,
      currentEventId: null,
      currentRegistrationId: null,
      state: 'idle',
      profileName: '',
      lastInboundMessage: '',
      lastOutboundMessage: '',
      lastMessageAt: null
    };

    const next = {
      ...existing,
      ...(update.$set || {}),
      phoneNumber
    };

    if (!existing._id) next._id = conversationId;
    if (options.upsert && !next._id) next._id = conversationId;

    conversationStore.set(phoneNumber, next);
    return clone(next);
  };
  WhatsAppConversation.findByIdAndUpdate = async (id, update = {}) => {
    for (const [phoneNumber, record] of conversationStore.entries()) {
      if (String(record._id) === String(id)) {
        const next = { ...record, ...(update.$set || {}) };
        conversationStore.set(phoneNumber, next);
        return clone(next);
      }
    }
    return null;
  };

  EventRegistration.findOneAndUpdate = async ({ eventId: eid, phoneNumber, channel }, update = {}, options = {}) => {
    const key = `${eid}:${phoneNumber}:${channel}`;
    const existing = registrationStore.get(key) || {
      _id: registrationId,
      eventId: eid,
      phoneNumber,
      channel
    };
    const next = {
      ...existing,
      ...(update.$set || {})
    };
    if (options.upsert && !next._id) next._id = registrationId;
    registrationStore.set(key, next);
    return clone(next);
  };
  WhatsAppMessage.create = async (payload = {}) => {
    const record = { _id: `msg_${messageStore.length + 1}`, ...payload };
    messageStore.push(record);
    return clone(record);
  };

  EventRegistration.findByIdAndUpdate = async (id, update = {}, options = {}) => {
    for (const [key, record] of registrationStore.entries()) {
      if (String(record._id) === String(id)) {
        const next = { ...record, ...(update.$set || {}) };
        registrationStore.set(key, next);
        return clone(next);
      }
    }
    return null;
  };

  const payloadWithRef = {
    entry: [
      {
        changes: [
          {
            value: {
              contacts: [
                {
                  wa_id: '61400000000',
                  profile: { name: '' }
                }
              ],
              messages: [
                {
                  from: '61400000000',
                  type: 'text',
                  text: { body: 'Hey, register me please. REF: EVT_507f1f77bcf86cd799439011' }
                }
              ]
            }
          }
        ]
      }
    ]
  };

  const firstResult = await flow.handleIncomingWebhook(payloadWithRef);
  assert.equal(firstResult.ok, true);
  assert.equal(firstResult.processed, 1);
  assert.equal(firstResult.results[0].event.title, 'AI Founder Breakfast');
  assert.equal(firstResult.results[0].registration.status, 'awaiting_name');
  assert.equal(firstResult.results[0].conversation.state, 'awaiting_name');
  assert.match(firstResult.results[0].conversation.lastOutboundMessage, /What’s your full name\?/);
  assert.equal(firstResult.results[0].outbound.skipped, true);
  assert.equal(firstResult.results[0].outbound.reason, 'missing-provider-config');

  const nameReplyPayload = {
    entry: [
      {
        changes: [
          {
            value: {
              contacts: [
                {
                  wa_id: '61400000000',
                  profile: { name: '' }
                }
              ],
              messages: [
                {
                  from: '61400000000',
                  type: 'text',
                  text: { body: 'Sam' }
                }
              ]
            }
          }
        ]
      }
    ]
  };

  const secondResult = await flow.handleIncomingWebhook(nameReplyPayload);
  assert.equal(secondResult.ok, true);
  assert.equal(secondResult.results[0].registration.attendeeName, 'Sam');
  assert.equal(secondResult.results[0].registration.status, 'awaiting_email');
  assert.equal(secondResult.results[0].conversation.state, 'awaiting_email');
  assert.match(secondResult.results[0].conversation.lastOutboundMessage, /What’s your email\?/);


  const emailReplyPayload = {
    entry: [
      {
        changes: [
          {
            value: {
              contacts: [
                {
                  wa_id: '61400000000',
                  profile: { name: '' }
                }
              ],
              messages: [
                {
                  from: '61400000000',
                  type: 'text',
                  text: { body: 'sam@example.com' }
                }
              ]
            }
          }
        ]
      }
    ]
  };

  const thirdResult = await flow.handleIncomingWebhook(emailReplyPayload);
  assert.equal(thirdResult.ok, true);
  assert.equal(thirdResult.results[0].registration.email, 'sam@example.com');
  assert.equal(thirdResult.results[0].registration.status, 'awaiting_confirmation');
  assert.equal(thirdResult.results[0].conversation.state, 'awaiting_confirmation');
  assert.match(thirdResult.results[0].conversation.lastOutboundMessage, /Reply YES to confirm your registration/);

  const stopPayload = {
    entry: [
      {
        changes: [
          {
            value: {
              contacts: [
                {
                  wa_id: '61400000000',
                  profile: { name: '' }
                }
              ],
              messages: [
                {
                  from: '61400000000',
                  type: 'text',
                  text: { body: 'STOP' }
                }
              ]
            }
          }
        ]
      }
    ]
  };

  const fourthResult = await flow.handleIncomingWebhook(stopPayload);
  assert.equal(fourthResult.ok, true);
  assert.equal(fourthResult.results[0].conversation.state, 'stopped');
  assert.match(fourthResult.results[0].conversation.lastOutboundMessage, /opted out/i);

  const extracted = flow.extractMessageEntries(payloadWithRef);
  assert.equal(extracted.length, 1);

  console.log('WhatsApp flow sanity test passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
