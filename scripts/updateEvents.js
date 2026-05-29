const mongoose = require('mongoose');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Event = require('../models/Event');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lunchup';

function configuredSecret(value) {
  const normalized = String(value || '').trim();
  if (!normalized || /^<.*>$/.test(normalized)) return '';
  if (/^(your-|replace-|changeme|todo)/i.test(normalized)) return '';
  return normalized;
}

const EVENTBRITE_API_KEY = configuredSecret(process.env.EVENTBRITE_API_KEY);
const MEETUP_API_KEY = process.env.MEETUP_API_KEY || '';
const LUMA_API_KEY = configuredSecret(process.env.LUMA_API_KEY);
const HUMANITIX_API_KEY = configuredSecret(process.env.HUMANITIX_API_KEY);
const EVENTBRITE_ORGANIZATION_ID = process.env.EVENTBRITE_ORGANIZATION_ID || '';

const AUSTRALIAN_CITIES = ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Hobart', 'Gold Coast'];
const EVENT_SYNC_LOOKAHEAD_DAYS = Number(process.env.EVENT_SYNC_LOOKAHEAD_DAYS || 60);
const EVENTS_DRY_RUN = process.env.EVENTS_DRY_RUN === 'true' || process.argv.includes('--dry-run');

function getSyncWindow() {
  const now = new Date();
  const until = new Date(now.getTime() + EVENT_SYNC_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000);
  return { now, until };
}

function pick(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '') || '';
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

function isAustralianEvent(event) {
  const city = String(event.city || '').trim();
  const country = String(event.country || '').toLowerCase();
  return AUSTRALIAN_CITIES.includes(city) || country === 'au' || country.includes('australia');
}

function isUpcomingInWindow(startTime, now, until) {
  return startTime instanceof Date && !Number.isNaN(startTime.getTime()) && startTime >= now && startTime <= until;
}

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
  if (!LUMA_API_KEY) {
    console.warn('Luma API key missing; Luma fetch skipped.');
    return [];
  }

  try {
    const { now, until } = getSyncWindow();
    const events = [];
    let cursor = '';

    do {
      const params = new URLSearchParams({
        after: now.toISOString(),
        before: until.toISOString(),
        pagination_limit: '100',
        sort_column: 'start_at',
        sort_direction: 'asc'
      });
      params.append('platforms', 'luma');
      params.append('platforms', 'external');
      if (cursor) params.set('pagination_cursor', cursor);

      console.log(`Fetching Luma events${cursor ? ' page' : ''}`);
      const response = await axios.get('https://public-api.luma.com/v1/calendar/list-events', {
        params,
        headers: { 'x-luma-api-key': LUMA_API_KEY },
        timeout: 10000
      });

      const mapped = (response.data?.entries || []).map((entry) => {
        const e = entry.event || entry;
        const location = e.geo_address_json || e.geo_address_info || e.location || {};
        const startTime = toDate(e.start_at || e.startAt || e.start_time);
        return {
          source: 'luma',
          sourceEventId: pick(e.api_id, e.id, entry.api_id, entry.id),
          title: e.name || '',
          description: e.description || e.description_md || '',
          startTime,
          endTime: toDate(e.end_at || e.endAt || e.end_time),
          timezone: e.timezone || 'Australia/Sydney',
          venueName: pick(location.name, e.location_name),
          address: pick(location.address, location.address_1, e.location_address),
          city: pick(location.city, e.city),
          state: pick(location.region, location.state),
          country: pick(location.country, e.country, 'Australia'),
          latitude: toNumber(pick(e.geo_latitude, e.latitude, location.latitude)),
          longitude: toNumber(pick(e.geo_longitude, e.longitude, location.longitude)),
          categoryJson: { categories: e.tags || [] },
          audienceJson: { audience: e.topics || [], personas: [] },
          priceMin: 0,
          priceMax: null,
          url: pick(e.url, e.event_url, e.short_url),
          imageUrl: e.cover_url || e.avatar_url || '',
          organizer: e.calendar?.name || e.user?.name || '',
          rawPayload: e,
          contentHash: ''
        };
      }).filter(event => event.sourceEventId && event.title && event.url && isUpcomingInWindow(event.startTime, now, until) && isAustralianEvent(event));

      events.push(...mapped);
      cursor = response.data?.next_cursor || '';
    } while (cursor);

    return events;
  } catch (error) {
    console.error('Luma fetch error:', error.response?.data || error.message);
    return [];
  }
}

async function fetchEventbriteEvents() {
  if (!EVENTBRITE_API_KEY) {
    console.warn('Eventbrite API key missing; Eventbrite fetch skipped.');
    return [];
  }

  try {
    const { now, until } = getSyncWindow();
    const events = [];
    let continuation = '';
    const endpoint = EVENTBRITE_ORGANIZATION_ID
      ? `https://www.eventbriteapi.com/v3/organizations/${EVENTBRITE_ORGANIZATION_ID}/events/`
      : 'https://www.eventbriteapi.com/v3/users/me/events/';

    do {
      console.log(`Fetching Eventbrite events${continuation ? ' page' : ''}`);
      const response = await axios.get(endpoint, {
        params: {
          order_by: 'start_asc',
          status: 'live,started',
          expand: 'venue,organizer,ticket_availability,category,logo',
          page_size: 50,
          continuation: continuation || undefined,
          'start_date.range_start': now.toISOString(),
          'start_date.range_end': until.toISOString()
        },
        headers: { Authorization: `Bearer ${EVENTBRITE_API_KEY}` },
        timeout: 10000
      });

      const mapped = (response.data?.events || []).map(e => {
        const venue = e.venue || e.primary_venue || {};
        const address = venue.address || {};
        const startTime = toDate(e.start?.utc || e.start?.local || e.event?.start_date?.utc);
        return {
          source: 'eventbrite',
          sourceEventId: pick(e.id, e.event?.id),
          title: e.name?.text || e.event?.name || '',
          description: pick(e.summary, e.description?.text, e.event?.summary),
          startTime,
          endTime: toDate(e.end?.utc || e.end?.local || e.event?.end_date?.utc),
          timezone: e.start?.timezone || e.event?.timezone || 'Australia/Sydney',
          venueName: venue.name || '',
          address: address.localized_address_display || [address.address_1, address.address_2].filter(Boolean).join(', '),
          city: address.city || '',
          state: address.region || '',
          country: address.country || 'Australia',
          latitude: toNumber(venue.latitude),
          longitude: toNumber(venue.longitude),
          categoryJson: { categories: [e.category?.name || 'Event'].filter(Boolean) },
          audienceJson: { audience: [], personas: [] },
          priceMin: toNumber(e.ticket_availability?.minimum_ticket_price?.major_value) || 0,
          priceMax: toNumber(e.ticket_availability?.maximum_ticket_price?.major_value),
          url: e.url || e.event?.url || '',
          imageUrl: e.logo?.url || e.image?.url || '',
          organizer: e.organizer?.name || e.primary_organizer?.name || '',
          rawPayload: e,
          contentHash: ''
        };
      }).filter(event => event.sourceEventId && event.title && event.url && isUpcomingInWindow(event.startTime, now, until) && isAustralianEvent(event));

      events.push(...mapped);
      continuation = response.data?.pagination?.has_more_items ? response.data?.pagination?.continuation : '';
    } while (continuation);

    return events;
  } catch (error) {
    console.error('Eventbrite fetch error:', error.response?.data || error.message);
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
  if (!HUMANITIX_API_KEY) {
    console.warn('Humanitix API key missing; Humanitix fetch skipped.');
    return [];
  }

  try {
    const { now, until } = getSyncWindow();
    const events = [];
    let page = 1;

    while (page <= 5) {
      console.log(`Fetching Humanitix events page ${page}`);
      const response = await axios.get('https://api.humanitix.com/v1/events', {
        params: { page, pageSize: 100 },
        timeout: 10000,
        headers: { 'x-api-key': HUMANITIX_API_KEY }
      });

      const batch = (response.data?.events || []).filter(e => {
        const start = toDate(e.startDate || e.start_date || e.startTime);
        return isUpcomingInWindow(start, now, until);
      });
      if (!(response.data?.events || []).length) {
        break;
      }

      const mapped = batch
        .map(e => {
          const location = e.eventLocation || e.location || e.venue || {};
          return {
            source: 'humanitix',
            sourceEventId: pick(e._id, e.id),
            title: e.title || e.name || '',
            description: e.description || e.sharingDescription || '',
            startTime: toDate(e.startDate || e.start_date || e.startTime),
            endTime: toDate(e.endDate || e.end_date || e.endTime),
            timezone: e.timezone || 'Australia/Sydney',
            venueName: pick(location.venueName, e.locationName, location.name),
            address: pick(location.address, e.locationAddress),
            city: pick(location.city, e.locationCity),
            state: pick(location.region, e.locationState, location.state),
            country: pick(location.country, e.locationCountry, 'Australia'),
            latitude: toNumber(pick(location.latLng?.[0], e.locationLatitude, location.latitude)),
            longitude: toNumber(pick(location.latLng?.[1], e.locationLongitude, location.longitude)),
            categoryJson: { categories: [e.classification?.category || e.classification?.type].filter(Boolean) },
            audienceJson: { audience: [], personas: [] },
            priceMin: toNumber(pick(e.pricing?.minimumPrice, e.min_price, e.price_min, e.ticketPriceMin)) || 0,
            priceMax: toNumber(pick(e.pricing?.maximumPrice, e.max_price, e.price_max, e.ticketPriceMax)),
            url: e.url || `https://events.humanitix.com/${e.slug || ''}`,
            imageUrl: e.bannerImage?.url || e.image_url || e.image?.url || e.imageUrl || '',
            organizer: e.organizer?.name || '',
            rawPayload: e,
            contentHash: ''
          };
        })
        .filter(event => event.sourceEventId && event.title && event.url && isAustralianEvent(event));

      events.push(...mapped);

      if (!response.data?.total || page * (response.data?.pageSize || 100) >= response.data.total || batch.length === 0) {
        break;
      }
      page += 1;
    }

    return events;
  } catch (error) {
    console.error('HumanTix fetch error:', error.response?.data || error.message);
    return [];
  }
}

async function mergeAndSaveEvents({ dryRun = false } = {}) {
  try {
    const [lumaEvents, eventbriteEvents, meetupEvents, humanitixEvents] = await Promise.all([
      fetchLumaEvents(),
      fetchEventbriteEvents(),
      fetchMeetupEvents(),
      fetchHumanTixEvents()
    ]);

    console.log(`Fetch results: Luma=${lumaEvents.length}, Eventbrite=${eventbriteEvents.length}, Meetup=${meetupEvents.length}, Humanitix=${humanitixEvents.length}`);

    const allEvents = [...lumaEvents, ...eventbriteEvents, ...meetupEvents, ...humanitixEvents];

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
    if (dryRun) {
      console.log(`📅 Dry run complete: total=${allEvents.length}, deduped=${eventsToSave.length}`);
      process.exit(0);
    }

    let created = 0;
    let updated = 0;

    for (const event of eventsToSave) {
      try {
        const existing = await Event.findOne({
          $or: [
            { source: event.source, sourceEventId: event.sourceEventId },
            { contentHash: event.contentHash }
          ]
        });
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
    if (EVENTS_DRY_RUN) {
      await mergeAndSaveEvents({ dryRun: true });
      return;
    }

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
