const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'news.json');
const MAX_ITEMS = 20;

const curatedPool = [
  {
    id: 'au-ai-1',
    title: 'Australian teams keep accelerating AI adoption through practical business use cases',
    source: 'Lunchup AI Brief',
    summary: 'Across Australia, AI momentum is being driven less by hype and more by practical deployment in operations, product, and workflow automation.',
    whyItMatters: 'The companies learning fastest are usually the ones with the strongest internal knowledge-sharing and team connections.',
    url: 'https://www.startupdaily.net/',
    region: 'Australia',
    category: 'AI'
  },
  {
    id: 'global-ai-1',
    title: 'Global AI competition keeps intensifying as product releases and model launches accelerate',
    source: 'Lunchup AI Brief',
    summary: 'The global AI cycle remains extremely fast, with new launches continuing to shape how startups and operators rethink execution speed.',
    whyItMatters: 'When markets move quickly, people need stronger alignment and faster context-sharing to keep up.',
    url: 'https://www.theinformation.com/',
    region: 'Global',
    category: 'AI'
  },
  {
    id: 'au-web3-1',
    title: 'Australian Web3 builders continue focusing on infrastructure, utility, and real-world applications',
    source: 'Lunchup Web3 Brief',
    summary: 'The local Web3 scene continues to evolve around builders looking beyond speculation toward infrastructure, community, and product utility.',
    whyItMatters: 'Strong ecosystems are not only built on technology — they are built on trust, repeated interaction, and strong communities.',
    url: 'https://www.afr.com/',
    region: 'Australia',
    category: 'Web3'
  },
  {
    id: 'global-web3-1',
    title: 'Web3 remains globally active where communities, incentives, and product utility actually meet',
    source: 'Lunchup Web3 Brief',
    summary: 'Global Web3 momentum is still strongest in areas where communities are engaged and products solve real participation or ownership problems.',
    whyItMatters: 'Connection-driven products tend to perform best when communities stay active, trusted, and well aligned.',
    url: 'https://www.coindesk.com/',
    region: 'Global',
    category: 'Web3'
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
  fs.writeFileSync(DATA_PATH, JSON.stringify(items, null, 2) + '\n');
}

function pickNextItem(existing) {
  const existingTitles = new Set(existing.map(item => item.title));
  const available = curatedPool.filter(item => !existingTitles.has(item.title));
  const pool = available.length ? available : curatedPool;
  const selected = pool[Math.floor(Math.random() * pool.length)];

  return {
    ...selected,
    id: `${selected.id}-${Date.now()}`,
    publishedAt: new Date().toISOString()
  };
}

function main() {
  const existing = readExisting();
  const nextItem = pickNextItem(existing);
  const merged = [nextItem, ...existing].slice(0, MAX_ITEMS);
  writeItems(merged);
  console.log(`Updated news feed with: ${nextItem.title}`);
}

main();
