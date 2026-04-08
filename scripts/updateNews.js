const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DATA_PATH = path.join(__dirname, '..', 'data', 'news.json');
const MAX_ITEMS = 100;
const FRESH_ITEMS_PER_RUN = 12;
const MIN_REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000;
const META_PATH = path.join(__dirname, '..', 'data', 'news-meta.json');
const FETCH_TIMEOUT = 12000;

const FEEDS = [
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    region: 'Global',
    category: 'Startup'
  },
  {
    name: 'VentureBeat AI',
    url: 'https://venturebeat.com/category/ai/feed/',
    region: 'Global',
    category: 'AI'
  },
  {
    name: 'Startup Daily',
    url: 'https://www.startupdaily.net/feed/',
    region: 'Australia',
    category: 'Startup'
  },
  {
    name: 'CoinDesk',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    region: 'Global',
    category: 'Web3'
  },
  {
    name: 'MIT News AI',
    url: 'https://news.mit.edu/rss/topic/artificial-intelligence2',
    region: 'Global',
    category: 'Research'
  }
];

const fallbackPool = [
  {
    id: 'fallback-open-model',
    title: 'New open-weight AI models keep pushing coding, reasoning, and deployment flexibility',
    source: 'Lunchup AI Brief',
    summary: 'Recent model releases are increasingly being compared on coding quality, latency, cost efficiency, context handling, and how easily teams can deploy them into real workflows.',
    whyItMatters: 'For founders and operators, the advantage is no longer just access to AI — it is knowing which model fits the product, budget, and execution pace best.',
    url: 'https://venturebeat.com/category/ai/',
    region: 'Global',
    category: 'AI'
  },
  {
    id: 'fallback-australia-ai',
    title: 'Australian startups are using new AI products to move faster on support, operations, and sales workflows',
    source: 'Lunchup AI Brief',
    summary: 'Local teams are increasingly trialling concrete AI tools for customer support, internal knowledge search, meeting workflows, and lightweight automation rather than talking only about broad transformation.',
    whyItMatters: 'The best leverage often comes from specific use cases and stronger team coordination, not abstract AI ambition alone.',
    url: 'https://www.startupdaily.net/',
    region: 'Australia',
    category: 'AI'
  },
  {
    id: 'fallback-web3-partnerships',
    title: 'Web3 partnerships are concentrating around infrastructure, distribution, and real user utility',
    source: 'Lunchup Web3 Brief',
    summary: 'The most durable Web3 activity continues to cluster around products that combine infrastructure with distribution, community participation, and a visible user reason to stay engaged.',
    whyItMatters: 'Founders still win on execution and trust: launches matter, but sustained ecosystems are built through repeated collaboration and community retention.',
    url: 'https://www.coindesk.com/',
    region: 'Global',
    category: 'Web3'
  },
  {
    id: 'fallback-research',
    title: 'Frontier AI research is increasingly judged by practical multimodal capability, tool use, and deployment readiness',
    source: 'Lunchup Research Brief',
    summary: 'New research updates are being discussed less as isolated breakthroughs and more in terms of benchmark performance, cost-to-quality ratio, tool usage, and whether teams can operationalise them quickly.',
    whyItMatters: 'For startup teams, the commercial edge comes from turning technical progress into product velocity faster than competitors do.',
    url: 'https://news.mit.edu/topic/artificial-intelligence2',
    region: 'Global',
    category: 'Research'
  }
];

const includeKeywords = [
  'launch', 'launched', 'release', 'released', 'rollout', 'introduces', 'introducing',
  'model', 'models', 'ai', 'agent', 'agents', 'benchmark', 'reasoning', 'coding',
  'startup', 'funding', 'raises', 'raised', 'partnership', 'partner', 'collaboration',
  'research', 'paper', 'open source', 'open-source', 'web3', 'crypto', 'inference',
  'multimodal', 'api', 'developer', 'platform', 'chip', 'robot', 'voice'
];

const excludeKeywords = [
  'opinion', 'podcast', 'event', 'events', 'newsletter', 'sponsored', 'jobs', 'job'
];

function readExisting() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeItems(items) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(items, null, 2) + '\n');
}

function readMeta() {
  try {
    const raw = fs.readFileSync(META_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

function writeMeta(meta) {
  fs.mkdirSync(path.dirname(META_PATH), { recursive: true });
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2) + '\n');
}

function getLastSuccessfulRefreshAt(existingItems, meta) {
  if (meta.lastSuccessfulRefreshAt) {
    const parsed = new Date(meta.lastSuccessfulRefreshAt);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const timestamps = existingItems
    .map(item => new Date(item.publishedAt))
    .filter(date => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  return timestamps[0] || null;
}

function shouldSkipRefresh(existingItems, meta, force = false) {
  if (force) return false;

  const lastRefreshAt = getLastSuccessfulRefreshAt(existingItems, meta);
  if (!lastRefreshAt) return false;

  return (Date.now() - lastRefreshAt.getTime()) < MIN_REFRESH_INTERVAL_MS;
}

function decodeXml(text = '') {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
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
  return matches.map(itemXml => ({
    title: extractTag(itemXml, 'title'),
    url: extractTag(itemXml, 'link'),
    summary: extractTag(itemXml, 'description') || extractTag(itemXml, 'content:encoded'),
    publishedAt: extractTag(itemXml, 'pubDate') || new Date().toISOString()
  }));
}

function isRelevant(item) {
  const haystack = `${item.title} ${item.summary}`.toLowerCase();
  const hasInclude = includeKeywords.some(keyword => haystack.includes(keyword));
  const hasExclude = excludeKeywords.some(keyword => haystack.includes(keyword));
  return hasInclude && !hasExclude;
}

function inferWhyItMatters(item, feed) {
  const text = `${item.title} ${item.summary}`.toLowerCase();

  if (text.includes('benchmark') || text.includes('reasoning') || text.includes('coding') || text.includes('model')) {
    return 'This is useful signal for founders comparing model quality, speed, and where the next product edge may come from.';
  }

  if (text.includes('partnership') || text.includes('partner') || text.includes('collaboration')) {
    return 'Partnership news is often where technical progress starts turning into distribution, customers, and real execution leverage.';
  }

  if (text.includes('funding') || text.includes('raises') || text.includes('raised')) {
    return 'Funding updates help show which product categories and teams are attracting conviction, talent, and room to move faster.';
  }

  if (feed.category === 'Research') {
    return 'Research matters most when it points to concrete capability gains teams can eventually turn into product advantages.';
  }

  if (feed.category === 'Web3') {
    return 'In Web3, the stronger signals usually come from concrete launches, ecosystem integrations, and real user utility rather than narrative alone.';
  }

  return 'For startup teams, the key question is whether this turns into better products, faster execution, or stronger collaboration.';
}

function normaliseItem(item, feed, index) {
  const summary = item.summary || item.title;
  return {
    id: `${feed.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}-${index}`,
    title: item.title,
    source: feed.name,
    summary: summary.length > 240 ? `${summary.slice(0, 237)}...` : summary,
    whyItMatters: inferWhyItMatters(item, feed),
    url: item.url,
    region: feed.region,
    category: feed.category,
    publishedAt: new Date(item.publishedAt || Date.now()).toISOString()
  };
}

async function fetchFeed(feed) {
  const response = await axios.get(feed.url, {
    timeout: FETCH_TIMEOUT,
    responseType: 'text',
    headers: {
      'User-Agent': 'LunchupNewsBot/1.0'
    }
  });

  return parseRssItems(response.data)
    .filter(item => item.title && item.url)
    .filter(isRelevant)
    .slice(0, 5)
    .map((item, index) => normaliseItem(item, feed, index));
}

function dedupeNewsItems(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = (item.url || item.title || '').trim().toLowerCase();
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fallbackItems(existing) {
  const existingTitles = new Set(existing.map(item => item.title));
  const available = fallbackPool.filter(item => !existingTitles.has(item.title));
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
  const existing = readExisting();
  const meta = readMeta();

  if (shouldSkipRefresh(existing, meta, force)) {
    const nextRefreshAt = new Date(getLastSuccessfulRefreshAt(existing, meta).getTime() + MIN_REFRESH_INTERVAL_MS).toISOString();
    console.log(`Skipping refresh. Next refresh allowed after ${nextRefreshAt}`);
    return;
  }

  const collected = [];

  for (const feed of FEEDS) {
    try {
      const items = await fetchFeed(feed);
      collected.push(...items);
    } catch (error) {
      console.error(`Failed to fetch ${feed.name}:`, error.message);
    }
  }

  const freshItems = dedupeNewsItems(collected)
    .filter(item => !existing.some(existingItem => {
      const existingKey = (existingItem.url || existingItem.title || '').trim().toLowerCase();
      const incomingKey = (item.url || item.title || '').trim().toLowerCase();
      return existingKey && existingKey === incomingKey;
    }))
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, FRESH_ITEMS_PER_RUN);

  const nextItems = freshItems.length ? freshItems : fallbackItems(existing);
  const merged = dedupeNewsItems([...nextItems, ...existing])
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, MAX_ITEMS);
  writeItems(merged);
  console.log(`Updated news feed with ${nextItems.length} new item(s), total stored: ${merged.length}`);
}

main().catch(error => {
  console.error('News update failed:', error.message);
  process.exit(1);
});
