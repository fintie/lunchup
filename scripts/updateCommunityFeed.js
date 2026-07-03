const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DATA_PATH = path.join(__dirname, '..', 'data', 'communityFeed.json');
const META_PATH = path.join(__dirname, '..', 'data', 'communityFeed-meta.json');
const MAX_ITEMS = 80;
const FRESH_ITEMS_PER_RUN = 24;
const MIN_REFRESH_INTERVAL_MS = Number(process.env.COMMUNITY_MIN_REFRESH_INTERVAL_MS || 60 * 60 * 1000);
const FETCH_TIMEOUT = 12000;

const RSS_SOURCES = [
  {
    name: 'Startup Daily',
    platform: 'News',
    url: 'https://www.startupdaily.net/feed/',
    region: 'Australia',
    topic: 'Startup'
  },
  {
    name: 'InnovationAus',
    platform: 'News',
    url: 'https://www.innovationaus.com/feed/',
    region: 'Australia',
    topic: 'Innovation'
  },
  {
    name: 'SmartCompany',
    platform: 'News',
    url: 'https://www.smartcompany.com.au/feed/',
    region: 'Australia',
    topic: 'Startup'
  },
  {
    name: 'Artificial Intelligence News',
    platform: 'News',
    url: 'https://www.artificialintelligence-news.com/feed/',
    region: 'Global',
    topic: 'AI'
  }
];

const REDDIT_SOURCES = [
  {
    name: 'r/AusStartups',
    platform: 'Reddit',
    url: 'https://www.reddit.com/r/AusStartups/new.json?limit=15',
    region: 'Australia',
    topic: 'Startup'
  },
  {
    name: 'r/sydney',
    platform: 'Reddit',
    url: 'https://www.reddit.com/r/sydney/search.json?q=AI%20OR%20startup%20OR%20founder%20OR%20tech&restrict_sr=1&sort=new&t=week&limit=15',
    region: 'Sydney',
    topic: 'Community'
  },
  {
    name: 'r/australia',
    platform: 'Reddit',
    url: 'https://www.reddit.com/r/australia/search.json?q=AI%20OR%20startup%20OR%20technology&restrict_sr=1&sort=new&t=week&limit=15',
    region: 'Australia',
    topic: 'Community'
  },
  {
    name: 'r/LocalLLaMA',
    platform: 'Reddit',
    url: 'https://www.reddit.com/r/LocalLLaMA/search.json?q=Australia%20OR%20startup%20OR%20agent&restrict_sr=1&sort=new&t=week&limit=15',
    region: 'Global',
    topic: 'AI'
  }
];

const BLUESKY_QUERIES = [
  {
    name: 'Bluesky AI Australia',
    platform: 'Bluesky',
    query: '(AI OR "artificial intelligence" OR agents) Australia',
    region: 'Australia',
    topic: 'AI'
  },
  {
    name: 'Bluesky Startup Australia',
    platform: 'Bluesky',
    query: '(startup OR founder OR VC) Australia',
    region: 'Australia',
    topic: 'Startup'
  },
  {
    name: 'Bluesky Sydney Tech',
    platform: 'Bluesky',
    query: '(AI OR startup OR tech) Sydney',
    region: 'Sydney',
    topic: 'Community'
  }
];

const HACKER_NEWS_QUERIES = [
  {
    name: 'Hacker News AI',
    platform: 'Hacker News',
    query: 'AI agent startup',
    region: 'Global',
    topic: 'AI'
  },
  {
    name: 'Hacker News Australia',
    platform: 'Hacker News',
    query: 'Australia startup AI',
    region: 'Australia / Global',
    topic: 'Startup'
  }
];

const CONFIGURED_SOCIAL_SOURCES = [
  ...(process.env.COMMUNITY_LINKEDIN_FEEDS || '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url, index) => ({
      name: `LinkedIn Source ${index + 1}`,
      platform: 'LinkedIn',
      url,
      region: 'Australia',
      topic: 'Community'
    })),
  ...(process.env.COMMUNITY_X_FEEDS || process.env.COMMUNITY_TWITTER_FEEDS || '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url, index) => ({
      name: `X Source ${index + 1}`,
      platform: 'X',
      url,
      region: 'Australia',
      topic: 'Community'
    })),
  ...(process.env.COMMUNITY_YOUTUBE_FEEDS || '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url, index) => ({
      name: `YouTube Source ${index + 1}`,
      platform: 'YouTube',
      url,
      region: 'Australia / Global',
      topic: 'Community'
    })),
  ...(process.env.COMMUNITY_PRODUCT_HUNT_FEEDS || '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url, index) => ({
      name: `Product Hunt Source ${index + 1}`,
      platform: 'Product Hunt',
      url,
      region: 'Global',
      topic: 'Startup'
    }))
];

const fallbackPool = [
  {
    id: 'fallback-aus-ai-builders',
    title: 'Australian AI builders are focusing on practical agent workflows',
    source: 'Lunchup Community Brief',
    platform: 'Community',
    summary: 'The strongest local AI conversations are moving from general model hype into workflow automation, support tooling, knowledge search, and founder/operator execution.',
    url: 'https://www.startupdaily.net/',
    region: 'Australia',
    topic: 'AI',
    signal: 'Watch for teams showing concrete workflow demos, not only model announcements.'
  },
  {
    id: 'fallback-founder-community',
    title: 'Founder communities are gathering around distribution, fundraising, and AI adoption',
    source: 'Lunchup Community Brief',
    platform: 'Community',
    summary: 'Across local startup communities, the recurring questions are how to find customers faster, use AI without bloating operations, and stay connected to capital and talent.',
    url: 'https://www.smartcompany.com.au/',
    region: 'Australia',
    topic: 'Startup',
    signal: 'Good lunch conversations are likely around GTM, hiring, and realistic AI use cases.'
  },
  {
    id: 'fallback-reddit-ai',
    title: 'Reddit AI discussions are a useful early signal for developer adoption',
    source: 'Lunchup Community Brief',
    platform: 'Reddit',
    summary: 'Developer-heavy communities often surface friction and adoption signals before they show up in polished launch posts.',
    url: 'https://www.reddit.com/search/?q=Australia%20AI%20startup',
    region: 'Australia / Global',
    topic: 'AI',
    signal: 'Look for repeated pain points, tools people actually try, and local meetups forming around them.'
  }
];

const includeKeywords = [
  'ai', 'artificial intelligence', 'agent', 'agents', 'llm', 'model', 'startup',
  'founder', 'funding', 'raise', 'raised', 'venture', 'vc', 'accelerator',
  'community', 'meetup', 'sydney', 'melbourne', 'brisbane', 'australia',
  'developer', 'product', 'launch', 'automation', 'open source', 'robotics'
];

const excludeKeywords = [
  'job', 'jobs', 'hiring thread', 'rental', 'politics', 'sport', 'meme', 'giveaway'
];

function readJson(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed || fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function lastRefreshAt(existingItems, meta) {
  if (meta.lastSuccessfulRefreshAt) {
    const parsed = new Date(meta.lastSuccessfulRefreshAt);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return existingItems
    .map((item) => new Date(item.publishedAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b - a)[0] || null;
}

function shouldSkipRefresh(existingItems, meta, force = false) {
  if (force) return false;
  const lastRefresh = lastRefreshAt(existingItems, meta);
  if (!lastRefresh) return false;
  return Date.now() - lastRefresh.getTime() < MIN_REFRESH_INTERVAL_MS;
}

function decodeXml(text = '') {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1]) : '';
}

function parseRssItems(xml) {
  const matches = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  return matches.map((itemXml) => ({
    title: extractTag(itemXml, 'title'),
    url: extractTag(itemXml, 'link'),
    summary: extractTag(itemXml, 'description') || extractTag(itemXml, 'content:encoded'),
    publishedAt: extractTag(itemXml, 'pubDate') || new Date().toISOString()
  }));
}

function isRelevant(item) {
  const haystack = `${item.title || ''} ${item.summary || ''}`.toLowerCase();
  const hasInclude = includeKeywords.some((keyword) => haystack.includes(keyword));
  const hasExclude = excludeKeywords.some((keyword) => haystack.includes(keyword));
  return hasInclude && !hasExclude;
}

function inferSignal(item, source) {
  const text = `${item.title || ''} ${item.summary || ''}`.toLowerCase();

  if (source.platform === 'Reddit') {
    return 'Community discussion signal: useful for spotting questions, pain points, and grassroots meetups before they become formal news.';
  }

  if (source.platform === 'Bluesky') {
    return 'Open social signal: useful for tracking fast-moving builder commentary without depending on closed social scraping.';
  }

  if (source.platform === 'Hacker News') {
    return 'Builder signal: Hacker News discussions are useful for early technical and founder sentiment around AI products.';
  }

  if (source.platform === 'LinkedIn' || source.platform === 'X') {
    return 'Social signal: useful for tracking operator commentary and fast-moving ecosystem updates.';
  }

  if (text.includes('funding') || text.includes('raised') || text.includes('raise')) {
    return 'Funding signal: shows where Australian founders and investors are placing conviction.';
  }

  if (text.includes('ai') || text.includes('agent') || text.includes('model')) {
    return 'AI signal: worth watching for practical product adoption and new founder workflows.';
  }

  return 'Community signal: a useful prompt for founder, operator, and builder conversations.';
}

function normalizeItem(item, source, index) {
  const summary = item.summary || item.title;
  const publishedAt = new Date(item.publishedAt || Date.now());

  return {
    id: `${source.platform}-${source.name}-${item.url || item.title}-${index}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 120),
    title: item.title,
    source: source.name,
    platform: source.platform,
    summary: summary.length > 260 ? `${summary.slice(0, 257)}...` : summary,
    url: item.url,
    region: source.region,
    topic: source.topic,
    signal: inferSignal(item, source),
    publishedAt: Number.isNaN(publishedAt.getTime()) ? new Date().toISOString() : publishedAt.toISOString()
  };
}

async function fetchRssSource(source) {
  const response = await axios.get(source.url, {
    timeout: FETCH_TIMEOUT,
    responseType: 'text',
    headers: { 'User-Agent': 'LunchupCommunityBot/1.0' }
  });

  return parseRssItems(response.data)
    .filter((item) => item.title && item.url)
    .filter(isRelevant)
    .slice(0, 8)
    .map((item, index) => normalizeItem(item, source, index));
}

async function fetchRedditSource(source) {
  const token = process.env.COMMUNITY_REDDIT_BEARER_TOKEN || '';
  const headers = {
    'User-Agent': 'LunchupCommunityBot/1.0 by fintie'
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await axios.get(source.url, {
    timeout: FETCH_TIMEOUT,
    headers
  });

  const children = response.data?.data?.children || [];
  return children
    .map((child) => child.data)
    .filter(Boolean)
    .map((post) => ({
      title: post.title,
      summary: post.selftext || post.link_flair_text || post.subreddit_name_prefixed || '',
      url: post.permalink ? `https://www.reddit.com${post.permalink}` : post.url,
      publishedAt: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : new Date().toISOString()
    }))
    .filter((item) => item.title && item.url)
    .filter(isRelevant)
    .slice(0, 8)
    .map((item, index) => normalizeItem(item, source, index));
}

async function fetchBlueskySource(source) {
  const url = 'https://api.bsky.app/xrpc/app.bsky.feed.searchPosts';
  const response = await axios.get(url, {
    timeout: FETCH_TIMEOUT,
    headers: { 'User-Agent': 'LunchupCommunityBot/1.0' },
    params: {
      q: source.query,
      limit: 20,
      sort: 'latest'
    }
  });

  const posts = response.data?.posts || [];
  return posts
    .map((post) => ({
      title: post.record?.text?.split('\n')[0] || 'Bluesky post',
      summary: post.record?.text || '',
      url: post.author?.handle && post.uri
        ? `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split('/').pop()}`
        : 'https://bsky.app/',
      publishedAt: post.record?.createdAt || post.indexedAt || new Date().toISOString()
    }))
    .filter((item) => item.summary || item.title)
    .filter(isRelevant)
    .slice(0, 8)
    .map((item, index) => normalizeItem(item, source, index));
}

async function fetchHackerNewsSource(source) {
  const response = await axios.get('https://hn.algolia.com/api/v1/search_by_date', {
    timeout: FETCH_TIMEOUT,
    headers: { 'User-Agent': 'LunchupCommunityBot/1.0' },
    params: {
      query: source.query,
      tags: 'story',
      hitsPerPage: 20
    }
  });

  const hits = response.data?.hits || [];
  return hits
    .map((hit) => ({
      title: hit.title || hit.story_title,
      summary: hit.title || hit.story_text || '',
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      publishedAt: hit.created_at || new Date().toISOString()
    }))
    .filter((item) => item.title && item.url)
    .filter(isRelevant)
    .slice(0, 8)
    .map((item, index) => normalizeItem(item, source, index));
}

function dedupeItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = (item.url || item.title || '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fallbackItems(existing) {
  const existingTitles = new Set(existing.map((item) => item.title));
  const available = fallbackPool.filter((item) => !existingTitles.has(item.title));
  const pool = available.length ? available : fallbackPool;
  const selected = pool[Math.floor(Math.random() * pool.length)];

  return [{
    ...selected,
    id: `${selected.id}-${Date.now()}`,
    publishedAt: new Date().toISOString()
  }];
}

async function main() {
  const force = process.argv.includes('--force');
  const existing = readJson(DATA_PATH, []);
  const meta = readJson(META_PATH, {});

  if (shouldSkipRefresh(existing, meta, force)) {
    const nextRefreshAt = new Date(lastRefreshAt(existing, meta).getTime() + MIN_REFRESH_INTERVAL_MS).toISOString();
    console.log(`Skipping community refresh. Next refresh allowed after ${nextRefreshAt}`);
    return;
  }

  const collected = [];

  for (const source of RSS_SOURCES) {
    try {
      collected.push(...await fetchRssSource(source));
    } catch (error) {
      console.error(`Failed to fetch ${source.name}:`, error.message);
    }
  }

  for (const source of REDDIT_SOURCES) {
    try {
      collected.push(...await fetchRedditSource(source));
    } catch (error) {
      console.error(`Failed to fetch ${source.name}:`, error.message);
    }
  }

  for (const source of BLUESKY_QUERIES) {
    try {
      collected.push(...await fetchBlueskySource(source));
    } catch (error) {
      console.error(`Failed to fetch ${source.name}:`, error.message);
    }
  }

  for (const source of HACKER_NEWS_QUERIES) {
    try {
      collected.push(...await fetchHackerNewsSource(source));
    } catch (error) {
      console.error(`Failed to fetch ${source.name}:`, error.message);
    }
  }

  for (const source of CONFIGURED_SOCIAL_SOURCES) {
    try {
      collected.push(...await fetchRssSource(source));
    } catch (error) {
      console.error(`Failed to fetch ${source.name}:`, error.message);
    }
  }

  const freshItems = dedupeItems(collected)
    .filter((item) => !existing.some((existingItem) => {
      const existingKey = (existingItem.url || existingItem.title || '').trim().toLowerCase();
      const incomingKey = (item.url || item.title || '').trim().toLowerCase();
      return existingKey && existingKey === incomingKey;
    }))
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, FRESH_ITEMS_PER_RUN);

  const nextItems = freshItems.length ? freshItems : fallbackItems(existing);
  const merged = dedupeItems([...nextItems, ...existing])
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, MAX_ITEMS);

  writeJson(DATA_PATH, merged);
  writeJson(META_PATH, {
    lastSuccessfulRefreshAt: new Date().toISOString(),
    configuredSocialSources: CONFIGURED_SOCIAL_SOURCES.map((source) => ({
      name: source.name,
      platform: source.platform,
      region: source.region,
      topic: source.topic
    }))
  });

  console.log(`Updated community feed with ${nextItems.length} new item(s), total stored: ${merged.length}`);
}

main().catch((error) => {
  console.error('Community feed update failed:', error.message);
  process.exit(1);
});
