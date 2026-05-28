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
  if (!LUMA_API_KEY) {
    return [];
  }

  try {
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const response = await axios.get('https://public-api.luma.com/v1/calendar/list-events', {
      params: {
        after: now.toISOString(),
        before: nextMonth.toISOString(),
        pagination_limit: 100,
        platforms: 'luma,external',
        sort_column: 'start_at',
        sort_direction: 'asc'
      },
      headers: { 'x-luma-api-key': LUMA_API_KEY },
      timeout: 8000
    });

    const entries = response.data?.entries || [];
    return entries
      .filter(e => {
        const city = (e.geo_address_json?.city || e.geo_address_info?.city || '').trim();
        const country = (e.geo_address_json?.country || e.geo_address_info?.country || '').toLowerCase();
        return AUSTRALIAN_CITIES.includes(city) || country === 'au' || country.includes('australia');
      })
      .map(e => ({
        source: 'luma',
        sourceEventId: e.api_id || e.id,
        title: e.name || '',
        description: e.description || e.description_md || '',
        startTime: new Date(e.start_at),
        endTime: e.end_at ? new Date(e.end_at) : null,
        timezone: e.timezone || 'Australia/Sydney',
        venueName: e.geo_address_json?.name || e.location_name || '',
        address: e.geo_address_json?.address || '',
        city: e.geo_address_json?.city || '',
        state: e.geo_address_json?.region || '',
        country: e.geo_address_json?.country || 'Australia',
        latitude: e.geo_latitude || null,
        longitude: e.geo_longitude || null,
        categoryJson: { categories: e.tags || [] },
        audienceJson: { audience: e.topics || [], personas: [] },
        priceMin: 0,
        priceMax: null,
        url: e.url || '',
        imageUrl: e.cover_url || e.avatar_url || '',
        organizer: e.calendar?.name || e.user?.name || '',
        rawPayload: e,
        contentHash: ''
      }));
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
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const events = [];

    for (const city of AUSTRALIAN_CITIES) {
      try {
        console.log(`Fetching Eventbrite events for ${city}`);
        const response = await axios.get('https://www.eventbriteapi.com/v3/destination/events/', {
          params: {
            'location.address': `${city}, Australia`,
            'start_date.range_start': now.toISOString(),
            'start_date.range_end': nextMonth.toISOString(),
            expand: 'event_sales_status,image,primary_venue,ticket_availability,primary_organizer',
            page_size: 20
          },
          headers: { Authorization: `Bearer ${EVENTBRITE_API_KEY}` },
          timeout: 8000
        });

        const mapped = (response.data?.events || []).map(e => ({
          source: 'eventbrite',
          sourceEventId: e.event?.id || e.id,
          title: e.event?.name || e.name?.text || '',
          description: e.event?.summary || e.description?.text || '',
          startTime: new Date(e.event?.start_date?.utc || e.start?.utc),
          endTime: e.event?.end_date?.utc || e.end?.utc ? new Date(e.event?.end_date?.utc || e.end?.utc) : null,
          timezone: e.event?.timezone || e.start?.timezone || 'Australia/Sydney',
          venueName: e.primary_venue?.name || '',
          address: e.primary_venue?.address?.localized_address_display || '',
          city: e.primary_venue?.address?.city || city,
          state: e.primary_venue?.address?.region || '',
          country: e.primary_venue?.address?.country || 'Australia',
          latitude: e.primary_venue?.latitude || null,
          longitude: e.primary_venue?.longitude || null,
          categoryJson: { categories: ['Event'] },
          audienceJson: { audience: [], personas: [] },
          priceMin: e.ticket_availability?.minimum_ticket_price?.major_value || 0,
          priceMax: e.ticket_availability?.maximum_ticket_price?.major_value || null,
          url: e.event?.url || e.url || '',
          imageUrl: e.image?.url || '',
          organizer: e.primary_organizer?.name || '',
          rawPayload: e,
          contentHash: ''
        }));
        events.push(...mapped);
      } catch (err) {
        console.warn(`Eventbrite fetch for ${city} failed:`, err.response?.data || err.message);
      }
    }

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
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const events = [];
    let page = 1;

    while (page <= 5) {
      console.log(`Fetching Humanitix events page ${page}`);
      const response = await axios.get('https://api.humanitix.com/v1/events', {
        params: { page },
        timeout: 8000,
        headers: { 'x-api-key': HUMANITIX_API_KEY }
      });

      const batch = (response.data?.events || []).filter(e => {
        const start = new Date(e.startDate || e.start_date || e.startTime || 0);
        return start >= now && start <= nextMonth;
      });
      if (!batch.length) {
        break;
      }

      const mapped = batch
        .filter(e => {
          const city = (e.eventLocation?.city || e.locationCity || e.venue?.city || e.location?.city || '').trim();
          const country = (e.eventLocation?.country || e.locationCountry || e.venue?.country || e.location?.country || e.location || '').toString().toLowerCase();
          return AUSTRALIAN_CITIES.includes(city) || country === 'au' || country.includes('australia');
        })
        .map(e => ({
          source: 'humanitix',
          sourceEventId: e._id || e.id,
          title: e.title || e.name || '',
          description: e.description || e.sharingDescription || '',
          startTime: new Date(e.startDate || e.start_date || e.startTime),
          endTime: e.endDate || e.end_date || e.endTime ? new Date(e.endDate || e.end_date || e.endTime) : null,
          timezone: e.timezone || 'Australia/Sydney',
          venueName: e.eventLocation?.venueName || e.locationName || e.venue?.name || e.location?.name || '',
          address: e.eventLocation?.address || e.locationAddress || e.venue?.address || e.location?.address || '',
          city: e.eventLocation?.city || e.locationCity || e.venue?.city || e.location?.city || '',
          state: e.eventLocation?.region || e.locationState || e.venue?.state || e.location?.state || '',
          country: e.eventLocation?.country || e.locationCountry || e.venue?.country || e.location?.country || 'Australia',
          latitude: e.eventLocation?.latLng?.[0] || e.locationLatitude || e.venue?.latitude || null,
          longitude: e.eventLocation?.latLng?.[1] || e.locationLongitude || e.venue?.longitude || null,
          categoryJson: { categories: [e.classification?.category || e.classification?.type].filter(Boolean) },
          audienceJson: { audience: [], personas: [] },
          priceMin: e.pricing?.minimumPrice || e.min_price || e.price_min || e.ticketPriceMin || 0,
          priceMax: e.pricing?.maximumPrice || e.max_price || e.price_max || e.ticketPriceMax || null,
          url: e.url || `https://events.humanitix.com/${e.slug || ''}`,
          imageUrl: e.bannerImage?.url || e.image_url || e.image?.url || e.imageUrl || '',
          organizer: e.organizer?.name || '',
          rawPayload: e,
          contentHash: ''
        }));

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

async function mergeAndSaveEvents() {
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
