const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DATA_PATH = path.join(__dirname, '..', 'data', 'opportunities.json');
const META_PATH = path.join(__dirname, '..', 'data', 'opportunities-meta.json');
const MAX_ITEMS = 120;
const FRESH_ITEMS_PER_RUN = 24;
const MIN_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;
const FETCH_TIMEOUT = 15000;
const TARGET_CITIES = ['sydney', 'melbourne', 'australia'];
const TARGET_CATEGORIES = ['ai', 'data', 'it', 'marketing', 'software', 'engineering', 'developer', 'analytics', 'growth'];

const SOURCES = [
  {
    name: 'Remotive',
    type: 'json',
    url: 'https://remotive.com/api/remote-jobs',
    mapper: mapRemotiveJobs
  },
  {
    name: 'Remotive Marketing',
    type: 'json',
    url: 'https://remotive.com/api/remote-jobs?search=marketing',
    mapper: mapRemotiveJobs
  },
  {
    name: 'Jobicy',
    type: 'json',
    url: 'https://jobicy.com/api/v2/remote-jobs?count=60',
    mapper: mapJobicyJobs
  },
  {
    name: 'Jobicy Marketing',
    type: 'json',
    url: 'https://jobicy.com/api/v2/remote-jobs?count=60&tag=marketing',
    mapper: mapJobicyJobs
  },
  {
    name: 'Arbeitnow',
    type: 'json',
    url: 'https://www.arbeitnow.com/api/job-board-api?page=1',
    mapper: mapArbeitnowJobs
  },
  {
    name: 'Arbeitnow Page 2',
    type: 'json',
    url: 'https://www.arbeitnow.com/api/job-board-api?page=2',
    mapper: mapArbeitnowJobs
  },
  {
    name: 'Remote OK',
    type: 'json',
    url: 'https://remoteok.com/api',
    mapper: mapRemoteOkJobs
  }
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

function stripHtml(text = '') {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanText(text = '', maxLength = 220) {
  const cleaned = stripHtml(text);
  if (!cleaned) return '';
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength - 3)}...` : cleaned;
}

function matchesTargetFilters(job) {
  const haystack = [
    job.title,
    job.company,
    job.location,
    job.category,
    job.tags,
    job.summary
  ]
    .flat()
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const location = (job.location || '').toLowerCase();
  const isRemoteFriendly = /remote|worldwide|global|anywhere/.test(location);
  const matchesCity = TARGET_CITIES.some(city => haystack.includes(city));
  const matchesCategory = TARGET_CATEGORIES.some(category => haystack.includes(category));
  const inferredCategory = inferCategory(job).toLowerCase();
  const title = (job.title || '').toLowerCase();
  const hasRelevantRoleSignal = /(engineer|developer|marketer|marketing|analyst|analytics|data|ai|machine learning|growth|product|software|it)/.test(`${title} ${haystack}`);

  return (matchesCity || isRemoteFriendly) && (matchesCategory || TARGET_CATEGORIES.includes(inferredCategory) || hasRelevantRoleSignal);
}

function normaliseJob(job, source, index) {
  const title = cleanText(job.title, 140);
  const company = cleanText(job.company, 80) || 'Confidential';
  const location = cleanText(job.location, 80) || 'Remote';
  const summary = cleanText(job.summary || job.description || '', 260) || `${title} at ${company}`;
  const category = inferCategory(job);
  const publishedAt = new Date(job.publishedAt || job.date || Date.now()).toISOString();
  const applyUrl = job.applyUrl || job.url;

  return {
    id: `${source.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}-${index}`,
    title,
    company,
    location,
    source,
    category,
    summary,
    publishedAt,
    applyUrl,
    url: job.url || applyUrl,
    isRemote: /remote|worldwide|global|anywhere/i.test(location),
    tags: Array.isArray(job.tags) ? job.tags.slice(0, 6) : []
  };
}

function inferCategory(job) {
  const haystack = [job.title, job.category, job.tags].flat().filter(Boolean).join(' ').toLowerCase();
  if (haystack.includes('marketing') || haystack.includes('growth') || haystack.includes('seo') || haystack.includes('content')) return 'Marketing';
  if (haystack.includes('data') || haystack.includes('analytics') || haystack.includes('scientist') || haystack.includes('bi')) return 'Data';
  if (haystack.includes('ai') || haystack.includes('machine learning') || haystack.includes('ml') || haystack.includes('llm')) return 'AI';
  return 'IT';
}

function dedupe(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = (item.applyUrl || item.url || `${item.title}-${item.company}`).trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fallbackItems(existing) {
  const now = new Date().toISOString();
  const staticItems = [
    {
      id: `fallback-remotive-ai-${Date.now()}`,
      title: 'AI Product Specialist',
      company: 'Remote Growth Studio',
      location: 'Sydney or Remote',
      source: 'LunchUp Opportunities',
      category: 'AI',
      summary: 'Support AI product launches, customer onboarding, and workflow automation projects for modern service businesses.',
      publishedAt: now,
      applyUrl: 'https://remotive.com/',
      url: 'https://remotive.com/',
      isRemote: true,
      tags: ['AI', 'Product', 'Remote']
    },
    {
      id: `fallback-data-${Date.now()}`,
      title: 'Data Analyst, Growth',
      company: 'Melbourne Digital Team',
      location: 'Melbourne',
      source: 'LunchUp Opportunities',
      category: 'Data',
      summary: 'Own dashboards, campaign measurement, and reporting workflows across customer acquisition and retention.',
      publishedAt: now,
      applyUrl: 'https://www.workingnomads.com/jobs',
      url: 'https://www.workingnomads.com/jobs',
      isRemote: false,
      tags: ['Data', 'Analytics', 'Growth']
    }
  ];

  const existingTitles = new Set(existing.map(item => item.title));
  return staticItems.filter(item => !existingTitles.has(item.title)).slice(0, 2);
}

function mapRemotiveJobs(payload) {
  const jobs = Array.isArray(payload?.jobs) ? payload.jobs : [];
  return jobs.map(job => ({
    title: job.title,
    company: job.company_name,
    location: job.candidate_required_location || job.job_type || 'Remote',
    category: job.category,
    summary: job.description,
    description: job.description,
    publishedAt: job.publication_date,
    applyUrl: job.url,
    url: job.url,
    tags: job.tags || []
  }));
}

function mapJobicyJobs(payload) {
  const jobs = Array.isArray(payload?.jobs) ? payload.jobs : [];
  return jobs.map(job => ({
    title: job.jobTitle,
    company: job.companyName,
    location: job.jobGeo || job.jobType || 'Remote',
    category: job.jobIndustry,
    summary: job.jobExcerpt,
    description: job.jobDescription,
    publishedAt: job.pubDate,
    applyUrl: job.url,
    url: job.url,
    tags: [job.jobIndustry, job.jobType, job.jobLevel].filter(Boolean)
  }));
}

function mapArbeitnowJobs(payload) {
  const jobs = Array.isArray(payload?.data) ? payload.data : [];
  return jobs.map(job => ({
    title: job.title,
    company: job.company_name,
    location: job.location || (job.remote ? 'Remote' : ''),
    category: Array.isArray(job.tags) ? job.tags.join(' ') : '',
    summary: job.description,
    description: job.description,
    publishedAt: job.created_at,
    applyUrl: job.url,
    url: job.url,
    tags: [...(Array.isArray(job.tags) ? job.tags : []), ...(Array.isArray(job.job_types) ? job.job_types : [])]
  }));
}

function mapRemoteOkJobs(payload) {
  const jobs = Array.isArray(payload) ? payload.slice(1) : [];
  return jobs.map(job => ({
    title: job.position,
    company: job.company,
    location: job.location || 'Remote',
    category: Array.isArray(job.tags) ? job.tags.join(' ') : '',
    summary: job.description,
    description: job.description,
    publishedAt: job.date || (job.epoch ? new Date(job.epoch * 1000).toISOString() : undefined),
    applyUrl: job.apply_url || job.url,
    url: job.url,
    tags: Array.isArray(job.tags) ? job.tags : []
  }));
}

async function fetchSource(source) {
  const response = await axios.get(source.url, {
    timeout: FETCH_TIMEOUT,
    headers: {
      'User-Agent': 'LunchupOpportunitiesBot/1.0',
      Accept: 'application/json,text/plain,*/*'
    }
  });

  return source.mapper(response.data)
    .filter(job => job.title && (job.applyUrl || job.url))
    .filter(matchesTargetFilters)
    .slice(0, 18)
    .map((job, index) => normaliseJob(job, source.name, index));
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

  for (const source of SOURCES) {
    try {
      const jobs = await fetchSource(source);
      collected.push(...jobs);
    } catch (error) {
      console.error(`Failed to fetch ${source.name}:`, error.message);
    }
  }

  const freshItems = dedupe(collected)
    .filter(item => !existing.some(existingItem => {
      const existingKey = (existingItem.applyUrl || existingItem.url || `${existingItem.title}-${existingItem.company}`).trim().toLowerCase();
      const incomingKey = (item.applyUrl || item.url || `${item.title}-${item.company}`).trim().toLowerCase();
      return existingKey && existingKey === incomingKey;
    }))
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, FRESH_ITEMS_PER_RUN);

  const nextItems = freshItems.length ? freshItems : fallbackItems(existing);
  const merged = dedupe([...nextItems, ...existing])
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, MAX_ITEMS);

  writeItems(merged);
  writeMeta({
    lastSuccessfulRefreshAt: new Date().toISOString(),
    sourceCount: SOURCES.length,
    itemCount: merged.length
  });

  console.log(`Updated opportunities feed with ${nextItems.length} new item(s), total stored: ${merged.length}`);
}

main().catch(error => {
  console.error('Opportunities update failed:', error.message);
  process.exit(1);
});
