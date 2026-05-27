const mongoose = require('mongoose');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Event = require('../models/Event');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lunchup';

const EVENTBRITE_API_KEY = process.env.EVENTBRITE_API_KEY || '';
const MEETUP_API_KEY = process.env.MEETUP_API_KEY || '';
const LUMA_API_KEY = process.env.LUMA_API_KEY || '';
const HUMANITIX_API_KEY = process.env.HUMANITIX_API_KEY || '';

const AUSTRALIAN_CITIES = ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Hobart', 'Gold Coast'];

function buildContentHash(event) {
  const key = `${event.title}|${event.startTime}|${event.venueName}|${event.city}`;
  return crypto.createHash('sha256').update(key).digest('hex');
}

function calculateQualityScore(event) {
  let score = 5;
  if (event.title && event.title.length > 10) score += 1;
  if (event.description && event.description.length > 50) score += 1;
  if (event.imageUrl) score += 0.5;
  if (event.venueName) score += 0.5;
  if (event.priceMax !== null) score += 0.5;
  return Math.min(10, score);
}

async function fetchLumaEvents() {
  try {
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const events = [];

    for (const city of AUSTRALIAN_CITIES) {
      try {
        const response = await axios.get('https://api.lu.ma/public/events', {
          params: {
            city: city,
            country: 'AU',
            after: now.toISOString(),
            before: nextMonth.toISOString(),
            limit: 20
          },
          timeout: 8000
        });

        if (response.data?.events) {
          const mapped = response.data.events.map(e => ({
            source: 'luma',
            sourceEventId: e.id,
            title: e.name || '',
            description: e.description || '',
            startTime: new Date(e.start_at),
            endTime: e.end_at ? new Date(e.end_at) : null,
            timezone: 'Australia/Sydney',
            venueName: e.venue_name || '',
            address: e.venue_address || '',
            city: city,
            state: '',
            country: 'Australia',
            latitude: e.venue_lat || null,
            longitude: e.venue_lon || null,
            categoryJson: { categories: e.categories || [] },
            audienceJson: { audience: e.topics || [], personas: [] },
            priceMin: e.ticket_price_min || 0,
            priceMax: e.ticket_price_max || null,
            url: e.url || '',
            imageUrl: e.cover_url || '',
            organizer: e.organizer_name || '',
            rawPayload: e,
            contentHash: ''
          }));
          events.push(...mapped);
        }
      } catch (err) {
        console.warn(`Luma fetch for ${city} failed:`, err.message);
      }
    }

    return events;
  } catch (error) {
    console.error('Luma fetch error:', error.message);
    return [];
  }
}

async function fetchEventbriteEvents() {
  if (!EVENTBRITE_API_KEY) {
    return [];
  }

  try {
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const events = [];

    for (const city of AUSTRALIAN_CITIES) {
      try {
        const response = await axios.get('https://www.eventbriteapi.com/v3/events/search/', {
          params: {
            'location.address': city + ', Australia',
            'start_date.range_start': now.toISOString(),
            'start_date.range_end': nextMonth.toISOString(),
            sort_by: 'date',
            page_size: 20
          },
          headers: { Authorization: `Bearer ${EVENTBRITE_API_KEY}` },
          timeout: 8000
        });

        if (response.data?.events) {
          const mapped = response.data.events.map(e => ({
            source: 'eventbrite',
            sourceEventId: e.id,
            title: e.name?.text || '',
            description: e.description?.text || '',
            startTime: new Date(e.start.utc),
            endTime: e.end ? new Date(e.end.utc) : null,
            timezone: e.start.timezone || 'Australia/Sydney',
            venueName: e.venue?.name || '',
            address: e.venue?.address?.address_1 || '',
            city: city,
            state: '',
            country: 'Australia',
            latitude: e.venue?.latitude || null,
            longitude: e.venue?.longitude || null,
            categoryJson: { categories: [e.category?.name || 'Event'] },
            audienceJson: { audience: [], personas: [] },
            priceMin: e.ticket_classes?.[0]?.free ? 0 : (e.ticket_classes?.[0]?.cost?.minor_value ? e.ticket_classes[0].cost.minor_value / 100 : 0),
            priceMax: e.ticket_classes?.[e.ticket_classes.length - 1]?.cost?.minor_value ? e.ticket_classes[e.ticket_classes.length - 1].cost.minor_value / 100 : null,
            url: e.url || '',
            imageUrl: e.logo?.original?.url || '',
            organizer: e.organizer?.name || '',
            rawPayload: e,
            contentHash: ''
          }));
          events.push(...mapped);
        }
      } catch (err) {
        console.warn(`Eventbrite fetch for ${city} failed:`, err.message);
      }
    }

    return events;
  } catch (error) {
    console.error('Eventbrite fetch error:', error.message);
    return [];
  }
}

async function fetchMeetupEvents() {
  if (!MEETUP_API_KEY) {
    return [];
  }

  try {
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const events = [];

    for (const city of AUSTRALIAN_CITIES) {
      try {
        const response = await axios.post('https://api.meetup.com/gql', {
          query: `
            query {
              events(first: 20, input: {
                byCity: "${city}, AU"
                startsAfter: "${now.toISOString()}"
                startsBefore: "${nextMonth.toISOString()}"
              }) {
                edges {
                  node {
                    id
                    title
                    description
                    startTime
                    endTime
                    venue { name address }
                    images { baseUrl }
                    eventUrl
                    group { name }
                    isFree
                    fee { amount }
                  }
                }
              }
            }
          `
        }, {
          headers: { Authorization: `Bearer ${MEETUP_API_KEY}` },
          timeout: 8000
        });

        if (response.data?.data?.events?.edges) {
          const mapped = response.data.data.events.edges.map(edge => {
            const e = edge.node;
            return {
              source: 'meetup',
              sourceEventId: e.id,
              title: e.title || '',
              description: e.description || '',
              startTime: new Date(e.startTime),
              endTime: e.endTime ? new Date(e.endTime) : null,
              timezone: 'Australia/Sydney',
              venueName: e.venue?.name || '',
              address: e.venue?.address || '',
              city: city,
              state: '',
              country: 'Australia',
              latitude: null,
              longitude: null,
              categoryJson: { categories: ['Meetup'] },
              audienceJson: { audience: [], personas: [] },
              priceMin: e.isFree ? 0 : (e.fee?.amount || 0),
              priceMax: e.fee?.amount || null,
              url: e.eventUrl || '',
              imageUrl: e.images?.[0]?.baseUrl || '',
              organizer: e.group?.name || '',
              rawPayload: e,
              contentHash: ''
            };
          });
          events.push(...mapped);
        }
      } catch (err) {
        console.warn(`Meetup fetch for ${city} failed:`, err.message);
      }
    }

    return events;
  } catch (error) {
    console.error('Meetup fetch error:', error.message);
    return [];
  }
}

async function fetchHumanTixEvents() {
  try {
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const events = [];

    for (const city of AUSTRALIAN_CITIES) {
      try {
        const config = {
          params: {
            city: city,
            country: 'AU',
            after: now.toISOString(),
            before: nextMonth.toISOString(),
            limit: 20
          },
          timeout: 8000,
          headers: HUMANITIX_API_KEY ? { Authorization: `Bearer ${HUMANITIX_API_KEY}` } : {}
        };

        const response = await axios.get('https://api.humanitix.com/v1/events', config);

        if (response.data?.events) {
          const mapped = response.data.events.map(e => {
            return {
              source: 'humanitix',
              sourceEventId: e.id,
              title: e.title || '',
              description: e.description || '',
              startTime: new Date(e.start_date),
              endTime: e.end_date ? new Date(e.end_date) : null,
              timezone: 'Australia/Sydney',
              venueName: e.venue?.name || '',
              address: e.venue?.address || '',
              city: city,
              state: '',
              country: 'Australia',
              latitude: e.venue?.latitude || null,
              longitude: e.venue?.longitude || null,
              categoryJson: { categories: e.categories || [] },
              audienceJson: { audience: [], personas: [] },
              priceMin: e.min_price || 0,
              priceMax: e.max_price || null,
              url: e.url || '',
              imageUrl: e.image_url || '',
              organizer: e.organizer?.name || '',
              rawPayload: e,
              contentHash: ''
            };
          });
          events.push(...mapped);
        }
      } catch (err) {
        console.warn(`HumanTix fetch for ${city} failed:`, err.message);
      }
    }

    return events;
  } catch (error) {
    console.error('HumanTix fetch error:', error.message);
    return [];
  }
}

async function mergeAndSaveEvents() {
  try {
    const sources = await Promise.all([
      fetchLumaEvents(),
      fetchEventbriteEvents(),
      fetchMeetupEvents(),
      fetchHumanTixEvents()
    ]);

    const allEvents = sources.flat();

    if (allEvents.length === 0) {
      console.log('📅 No events found from any source');
      process.exit(0);
    }

    const deduped = new Map();
    for (const event of allEvents) {
      event.contentHash = buildContentHash(event);
      event.qualityScore = calculateQualityScore(event);

      if (!deduped.has(event.contentHash) || deduped.get(event.contentHash).qualityScore < event.qualityScore) {
        deduped.set(event.contentHash, event);
      }
    }

    const eventsToSave = Array.from(deduped.values());
    let created = 0;
    let updated = 0;

    for (const event of eventsToSave) {
      try {
        const existing = await Event.findOne({ contentHash: event.contentHash });
        if (existing) {
          updated++;
          await Event.updateOne({ _id: existing._id }, event);
        } else {
          created++;
          await Event.create(event);
        }
      } catch (err) {
        console.warn(`Failed to save event ${event.title}:`, err.message);
      }
    }

    console.log(`📅 Events updated: created=${created}, updated=${updated}, total=${eventsToSave.length}`);
    process.exit(0);
  } catch (error) {
    console.error('Error merging and saving events:', error);
    process.exit(1);
  }
}

async function run() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true
    });

    await mergeAndSaveEvents();
  } catch (error) {
    console.error('Connection or execution error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

run();
