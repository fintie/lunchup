const express = require('express');
const router = express.Router();

const sampleNews = [
  {
    id: 'au-tech-1',
    title: 'Australia tech and startup activity continues building momentum across AI, SaaS, and founder communities',
    source: 'Lunchup Daily Brief',
    publishedAt: '2026-04-06T08:00:00.000Z',
    summary: 'A snapshot of the Australian startup ecosystem shows continued momentum in AI, SaaS, and community-led founder activity, especially around Sydney and broader east-coast tech hubs.',
    whyItMatters: 'Strong startup ecosystems are built through repeated conversations, trusted relationships, and fast-moving communities — the same forces that help teams inside companies work better together.',
    url: 'https://www.startmate.com/',
    region: 'Australia'
  },
  {
    id: 'au-tech-2',
    title: 'Sydney founder and operator networks remain a key advantage for early-stage teams',
    source: 'Lunchup Daily Brief',
    publishedAt: '2026-04-06T08:30:00.000Z',
    summary: 'Local founder circles, operator groups, and community events continue to play an outsized role in helping startups share knowledge, unlock introductions, and move faster.',
    whyItMatters: 'Innovation is social. Great companies do not only rely on products and capital — they also rely on the quality of internal and external connections.',
    url: 'https://www.techboard.com.au/',
    region: 'Sydney'
  },
  {
    id: 'au-tech-3',
    title: 'Australian startups are increasingly blending product execution with community-building',
    source: 'Lunchup Daily Brief',
    publishedAt: '2026-04-06T09:00:00.000Z',
    summary: 'More startup teams are building in public, engaging communities earlier, and treating relationship-building as part of execution rather than an afterthought.',
    whyItMatters: 'This is close to the thinking behind Lunchup: stronger connections often lead to stronger collaboration, alignment, and momentum.',
    url: 'https://www.startupdaily.net/',
    region: 'Australia'
  }
];

router.get('/', async (req, res) => {
  res.json({
    success: true,
    updatedAt: new Date().toISOString(),
    region: 'Australia / Sydney',
    items: sampleNews
  });
});

module.exports = router;
