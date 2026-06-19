import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './Live.css';

const platformOrder = ['ALL', 'Bluesky', 'Hacker News', 'Reddit', 'LinkedIn', 'X', 'YouTube', 'Product Hunt', 'News', 'Community'];

const formatTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

const getPlatformLabel = (platform) => {
  if (platform === 'X') return 'X / Twitter';
  return platform || 'Community';
};

function Live() {
  const [items, setItems] = useState([]);
  const [updatedAt, setUpdatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [topicFilter, setTopicFilter] = useState('ALL');

  useEffect(() => {
    let active = true;

    const loadCommunityFeed = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/community-feed');
        if (!active) return;

        setItems(Array.isArray(data.items) ? data.items : []);
        setUpdatedAt(data.updatedAt || '');
        setError('');
      } catch (err) {
        console.error('Failed to load community feed:', err);
        if (active) {
          setError('Unable to load community signals right now.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadCommunityFeed();
    const refreshTimer = setInterval(loadCommunityFeed, 30 * 60 * 1000);

    return () => {
      active = false;
      clearInterval(refreshTimer);
    };
  }, []);

  const availablePlatforms = useMemo(() => {
    const platforms = new Set(items.map((item) => item.platform).filter(Boolean));
    return platformOrder.filter((platform) => platform === 'ALL' || platforms.has(platform));
  }, [items]);

  const availableTopics = useMemo(() => {
    return ['ALL', ...new Set(items.map((item) => item.topic).filter(Boolean))];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const platformMatch = platformFilter === 'ALL' || item.platform === platformFilter;
      const topicMatch = topicFilter === 'ALL' || item.topic === topicFilter;
      return platformMatch && topicMatch;
    });
  }, [items, platformFilter, topicFilter]);

  const stats = useMemo(() => {
    const platforms = new Set(items.map((item) => item.platform).filter(Boolean));
    const redditCount = items.filter((item) => item.platform === 'Reddit').length;
    const socialCount = items.filter((item) => ['Reddit', 'LinkedIn', 'X'].includes(item.platform)).length;

    return {
      total: items.length,
      platforms: platforms.size,
      redditCount,
      socialCount
    };
  }, [items]);

  return (
    <div className="live-page">
      <section className="live-header">
        <div className="live-title">
          <h1>Australia AI Community Pulse</h1>
          <span className="live-indicator">
            <span className="live-dot"></span>
            Daily
          </span>
        </div>
        <p className="live-subtitle">
          Bluesky, Hacker News, Reddit, startup media, and configured LinkedIn/X sources for AI, founders, and local tech communities.
        </p>
        {updatedAt && (
          <div className="live-time">
            <span className="clock">Updated {formatTime(updatedAt)}</span>
            <span className="timezone">AEST/AEDT</span>
          </div>
        )}
        <p className="live-source-note">
          Reddit, LinkedIn, and X/Twitter are best with approved API/feed access; Bluesky, Hacker News, and RSS sources refresh automatically.
        </p>
      </section>

      <section className="live-stats">
        <div className="stat-item">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Signals</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">{stats.platforms}</span>
          <span className="stat-label">Sources</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">{stats.redditCount}</span>
          <span className="stat-label">Reddit</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">{stats.socialCount}</span>
          <span className="stat-label">Social</span>
        </div>
      </section>

      <section className="community-toolbar">
        <div className="toolbar-group">
          <label>Platform</label>
          <select value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)}>
            {availablePlatforms.map((platform) => (
              <option key={platform} value={platform}>{getPlatformLabel(platform)}</option>
            ))}
          </select>
        </div>
        <div className="toolbar-group">
          <label>Topic</label>
          <select value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)}>
            {availableTopics.map((topic) => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
        </div>
      </section>

      <main className="community-feed">
        {loading ? (
          <div className="community-state-card">Loading community pulse...</div>
        ) : error ? (
          <div className="community-state-card error">{error}</div>
        ) : filteredItems.length === 0 ? (
          <div className="community-state-card">No signals match the current filters.</div>
        ) : (
          filteredItems.map((item) => (
            <article className="community-card" key={item.id}>
              <div className="community-card-meta">
                <span className={`platform-badge platform-${String(item.platform || 'community').toLowerCase()}`}>
                  {getPlatformLabel(item.platform)}
                </span>
                <span>{item.source}</span>
                <span>{item.region}</span>
                <span>{formatTime(item.publishedAt)}</span>
              </div>
              <h2>{item.title}</h2>
              <p className="community-summary">{item.summary}</p>
              <div className="community-signal">
                <strong>Signal</strong>
                <p>{item.signal}</p>
              </div>
              <div className="community-card-footer">
                <span className="topic-pill">{item.topic}</span>
                <a href={item.url} target="_blank" rel="noreferrer" className="community-link">
                  Open source
                </a>
              </div>
            </article>
          ))
        )}
      </main>
    </div>
  );
}

export default Live;
