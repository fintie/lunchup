const crypto = require('crypto');
const Event = require('../models/Event');
const EventRecommendation = require('../models/EventRecommendation');
const EventRegistration = require('../models/EventRegistration');
const User = require('../models/User');

const organizersWithBoost = new Set(['Fishburners', 'Stone & Chalk', 'UTS']);
const WHATSAPP_EVENT_NUMBER = process.env.WHATSAPP_EVENT_NUMBER || process.env.WHATSAPP_PHONE_NUMBER || '';

const sampleEvents = () => {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return [
    {
      source: 'luma',
      sourceEventId: 'luma-uts-ai-founders',
      title: 'AI Founder Breakfast at UTS',
      description: 'Sydney AI founders, researchers and operators swap notes on applied AI products.',
      startTime: new Date(now + day),
      endTime: new Date(now + day + 2 * 60 * 60 * 1000),
      timezone: 'Australia/Sydney',
      venueName: 'UTS Building 11',
      address: '81 Broadway, Ultimo NSW',
      city: 'Sydney',
      state: 'NSW',
      country: 'Australia',
      latitude: -33.883,
      longitude: 151.2,
      categoryJson: { categories: ['AI', 'Startup', 'Education'] },
      audienceJson: { audience: ['Founders', 'Builders'], personas: ['startup-operators'] },
      priceMin: 0,
      priceMax: 0,
      url: 'https://lu.ma/uts-ai-founder-breakfast',
      imageUrl: 'https://images.example.com/uts-ai.jpg',
      organizer: 'UTS',
      rawPayload: { connector: 'luma' },
      qualityScore: 8.8
    },
    {
      source: 'meetup',
      sourceEventId: 'meetup-web3-fishburners',
      title: 'Web3 Security Meetup',
      description: 'A deep dive into smart contract risk, wallet safety and security reviews for founders.',
      startTime: new Date(now + 2 * day),
      endTime: new Date(now + 2 * day + 2 * 60 * 60 * 1000),
      timezone: 'Australia/Sydney',
      venueName: 'Fishburners',
      address: '11 York St, Sydney NSW',
      city: 'Sydney',
      state: 'NSW',
      country: 'Australia',
      latitude: -33.869,
      longitude: 151.206,
      categoryJson: { categories: ['Web3', 'Cybersecurity'] },
      audienceJson: { audience: ['Developers', 'Founders'], personas: ['security-builders'] },
      priceMin: 0,
      priceMax: 25,
      url: 'https://meetup.com/web3-security-sydney',
      imageUrl: 'https://images.example.com/web3-security.jpg',
      organizer: 'Fishburners',
      rawPayload: { connector: 'meetup' },
      qualityScore: 8.5
    },
    {
      source: 'humanitix',
      sourceEventId: 'humanitix-investor-night',
      title: 'Startup Investor Night',
      description: 'Investor intros, founder pitches and operator networking at Stone & Chalk.',
      startTime: new Date(now + 3 * day),
      endTime: new Date(now + 3 * day + 3 * 60 * 60 * 1000),
      timezone: 'Australia/Sydney',
      venueName: 'Stone & Chalk',
      address: '477 Pitt St, Haymarket NSW',
      city: 'Sydney',
      state: 'NSW',
      country: 'Australia',
      latitude: -33.879,
      longitude: 151.206,
      categoryJson: { categories: ['Startup', 'Investor'] },
      audienceJson: { audience: ['Founders', 'Investors'], personas: ['fundraising-founders'] },
      priceMin: 20,
      priceMax: 45,
      url: 'https://events.humanitix.com/startup-investor-night',
      imageUrl: 'https://images.example.com/investor-night.jpg',
      organizer: 'Stone & Chalk',
      rawPayload: { connector: 'humanitix' },
      qualityScore: 9
    },
    {
      source: 'timeout',
      sourceEventId: 'timeout-food-culture',
      title: 'Sydney Night Noodle Market Preview',
      description: 'Food, culture and live performances around the harbour.',
      startTime: new Date(now + 4 * day),
      endTime: new Date(now + 4 * day + 5 * 60 * 60 * 1000),
      timezone: 'Australia/Sydney',
      venueName: 'Tumbalong Park',
      address: '11 Harbour St, Sydney NSW',
      city: 'Sydney',
      state: 'NSW',
      country: 'Australia',
      latitude: -33.874,
      longitude: 151.202,
      categoryJson: { categories: ['Food', 'Art', 'Culture'] },
      audienceJson: { audience: ['Locals', 'Visitors'], personas: ['culture-seekers'] },
      priceMin: 0,
      priceMax: 25,
      url: 'https://www.timeout.com/sydney/things-to-do/night-noodle-market-preview',
      imageUrl: 'https://images.example.com/noodle-market.jpg',
      organizer: 'Time Out Sydney',
      rawPayload: { connector: 'timeout' },
      qualityScore: 7.8
    }
  ].map((event) => ({
    ...event,
    contentHash: crypto.createHash('sha256').update(`${event.title}|${event.startTime.toISOString()}|${event.venueName}|${event.url}`).digest('hex')
  }));
};

const tokenize = (text = '') => String(text)
  .toLowerCase()
  .split(/[^a-z0-9+#]+/i)
  .map((item) => item.trim())
  .filter(Boolean);

const cosineSimilarity = (a, b) => {
  const vocab = [...new Set([...a, ...b])];
  if (!vocab.length) return 0;
  const counts = (tokens) => vocab.map((word) => tokens.filter((token) => token === word).length);
  const av = counts(a);
  const bv = counts(b);
  const dot = av.reduce((sum, value, index) => sum + value * bv[index], 0);
  const normA = Math.sqrt(av.reduce((sum, value) => sum + value * value, 0));
  const normB = Math.sqrt(bv.reduce((sum, value) => sum + value * value, 0));
  if (!normA || !normB) return 0;
  return dot / (normA * normB);
};

const normalizeTopics = (rawInterestText = '', preferredTopics = [], eventInterests = []) => {
  const fromText = rawInterestText.split(',').map((item) => item.trim()).filter(Boolean);
  const merged = [...preferredTopics, ...eventInterests, ...fromText];
  return [...new Set(merged.map((item) => item.trim()).filter(Boolean))];
};

const buildDigest = (recommendations) => {
  const lines = [`🦊 Nixie found ${recommendations.length} events for you this week:`];
  recommendations.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.title}\n📍 ${item.venueName || 'Venue TBC'}, ${item.city}\n🗓 ${new Date(item.startTime).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}\n🎯 Why: ${item.reason}\n🔗 ${item.url}`);
  });
  lines.push('Reply 1 to save, MORE AI to refine, STOP to unsubscribe.');
  return lines.join('\n\n');
};

const scoreEventForUser = (user, event) => {
  const userTopics = normalizeTopics(user.rawInterestText, user.preferredTopics || [], user.eventInterests || []);
  const userTokens = tokenize(`${user.professionalBackground || ''} ${user.bio || ''} ${userTopics.join(' ')}`);
  const eventTokens = tokenize(`${event.title} ${event.description} ${(event.categoryJson?.categories || []).join(' ')} ${event.organizer || ''}`);
  const similarity = cosineSimilarity(userTokens, eventTokens);
  const overlap = (event.categoryJson?.categories || []).filter((category) =>
    userTopics.map((topic) => topic.toLowerCase()).includes(String(category).toLowerCase())
  ).length;
  const reputationBoost = organizersWithBoost.has(event.organizer) ? 0.15 : 0;
  const qualityBoost = Number(event.qualityScore || 0) / 10;
  const score = Number((similarity + overlap * 0.2 + reputationBoost + qualityBoost).toFixed(4));
  const reasonTopics = userTopics.slice(0, 3).join(', ') || user.preferredLocation || 'local events';
  return {
    score,
    reason: `Recommended because this matches your interests in ${reasonTopics} and fits ${event.city} event discovery.`
  };
};

const buildWhatsAppText = ({ event, userName }) => {
  return [
    `Hi, I'd like to register for ${event.title}.`,
    userName ? `My name: ${userName}` : null,
    `When: ${new Date(event.startTime).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}`,
    `Where: ${event.venueName || 'Venue TBC'}, ${event.city}`,
    `Event link: ${event.url}`
  ].filter(Boolean).join('\n');
};

async function seedSampleEvents() {
  const events = sampleEvents();
  let created = 0;
  for (const payload of events) {
    const existing = await Event.findOne({ contentHash: payload.contentHash });
    if (existing) {
      continue;
    }
    await Event.create(payload);
    created += 1;
  }
  return { created, total: await Event.countDocuments() };
}

async function listEvents(city) {
  const query = city ? { city: new RegExp(`^${city}$`, 'i') } : {};
  return Event.find(query).sort({ startTime: 1 }).lean();
}

async function buildWhatsAppRegistration({ eventId, userId, userName, phoneNumber } = {}) {
  const event = await Event.findById(eventId).lean();
  if (!event) {
    throw new Error('Event not found');
  }

  const message = buildWhatsAppText({ event, userName });
  const target = String(WHATSAPP_EVENT_NUMBER || '').replace(/\D/g, '');
  const shareUrl = target
    ? `https://wa.me/${target}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  const registrationPayload = {
    userId: userId || null,
    phoneNumber: phoneNumber || '',
    status: target ? 'ready' : 'pending-number',
    shareUrl,
    notes: message
  };

  const registration = userId
    ? await EventRegistration.findOneAndUpdate(
      { eventId: event._id, userId: String(userId), channel: 'whatsapp' },
      registrationPayload,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    : await EventRegistration.create({ eventId: event._id, ...registrationPayload, channel: 'whatsapp' });

  return {
    registrationId: registration._id,
    shareUrl,
    message,
    targetConfigured: Boolean(target)
  };
}

async function runRecommendations({ userId } = {}) {
  await seedSampleEvents();
  const users = userId
    ? await User.find({ _id: userId }).lean()
    : await User.find({}).lean();

  let recommendationsCreated = 0;
  const digests = [];

  for (const user of users) {
    const preferredCity = (user.preferredLocation?.split('-')[0] || user.preferredLocation || 'Sydney').trim();
    const events = await Event.find({ city: new RegExp(`^${preferredCity}$`, 'i') }).lean();
    const scored = events.map((event) => ({ event, ...scoreEventForUser(user, event) }));
    const topMatches = scored.sort((a, b) => b.score - a.score).slice(0, 5);

    const digestItems = [];
    for (const match of topMatches) {
      const existing = await EventRecommendation.findOne({ userId: String(user._id), eventId: match.event._id });
      if (!existing) {
        await EventRecommendation.create({
          userId: String(user._id),
          eventId: match.event._id,
          score: match.score,
          reason: match.reason,
          status: 'recommended'
        });
        recommendationsCreated += 1;
      }

      digestItems.push({
        ...match.event,
        score: match.score,
        reason: match.reason
      });
    }

    if (digestItems.length) {
      digests.push({
        userId: String(user._id),
        message: buildDigest(digestItems),
        items: digestItems
      });
    }
  }

  return { ok: true, recommendationsCreated, digests };
}

async function getRecommendationsForUser(userId) {
  const rows = await EventRecommendation.find({ userId })
    .sort({ score: -1, createdAt: -1 })
    .populate('eventId')
    .lean();

  return rows
    .filter((row) => row.eventId)
    .map((row) => ({
      id: row._id,
      eventId: row.eventId._id,
      title: row.eventId.title,
      score: row.score,
      reason: row.reason,
      startTime: row.eventId.startTime,
      url: row.eventId.url,
      venueName: row.eventId.venueName,
      city: row.eventId.city,
      categoryJson: row.eventId.categoryJson,
      organizer: row.eventId.organizer
    }));
}

module.exports = {
  seedSampleEvents,
  listEvents,
  buildWhatsAppRegistration,
  runRecommendations,
  getRecommendationsForUser
};
