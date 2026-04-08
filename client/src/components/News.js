import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Seo from './Seo';
import './News.css';

const formatDate = (value) => {
  try {
    return new Date(value).toLocaleString('en-AU', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  } catch (e) {
    return value;
  }
};

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setDebugInfo(`Requesting: ${axios.defaults.baseURL}/news`);
        const { data } = await axios.get('/news');
        setNews(data.items || []);
        setUpdatedAt(data.updatedAt || '');
        setError('');
        setDebugInfo((prev) => `${prev}\nLoaded ${Array.isArray(data.items) ? data.items.length : 0} items`);
      } catch (err) {
        const details = `Requesting: ${axios.defaults.baseURL}/news | Status: ${err?.response?.status || 'no-status'} | Message: ${typeof err?.response?.data === 'string' ? err.response.data : (err?.message || 'unknown error')}`;
        console.error('Failed to load news:', err?.response?.status, err?.response?.data || err.message || err);
        setDebugInfo(details);
        setError('Unable to load today\'s news right now. Please try again shortly.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <>
      <Seo
        title="Australian startup news today | Lunchup"
        description="Read the latest Australian startup and tech news, curated daily with context for founders, operators, and professional networking through Lunchup."
        path="/news"
        type="article"
        keywords={[
          'australian startup news',
          'startup news sydney',
          'tech news australia',
          'founder news lunchup'
        ]}
      />
      <div className="news-page">
      <section className="news-hero">
        <div className="news-hero-content">
          <span className="news-eyebrow">Lunchup News</span>
          <h1>Australia tech and startup news, updated for today</h1>
          <p>
            A daily snapshot of stories across Sydney and the broader Australian tech ecosystem,
            with a lightweight Lunchup angle on why stronger conversations and connections matter.
          </p>
          {debugInfo && !error && (
            <div className="news-updated" style={{ marginTop: '8px', fontSize: '12px', opacity: 0.75 }}>
              {debugInfo}
            </div>
          )}
          {updatedAt && (
            <div className="news-updated">Last updated: {formatDate(updatedAt)}</div>
          )}
        </div>
      </section>

      <section className="news-content">
        {loading ? (
          <div className="news-state-card">Loading today&apos;s stories…</div>
        ) : error ? (
          <div className="news-state-card error">
            <div>{error}</div>
            {debugInfo && <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.85, wordBreak: 'break-word' }}>{debugInfo}</div>}
          </div>
        ) : (
          <div className="news-grid">
            {news.map((item) => (
              <article className="news-card" key={item.id}>
                <div className="news-card-meta">
                  <span className="news-badge">{item.region}</span>
                  <span>{item.source}</span>
                  <span>•</span>
                  <span>{formatDate(item.publishedAt)}</span>
                </div>
                <h2>{item.title}</h2>
                <p className="news-summary">{item.summary}</p>
                <div className="news-why">
                  <strong>Why it matters</strong>
                  <p>{item.whyItMatters}</p>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="news-link"
                >
                  Read more →
                </a>
              </article>
            ))}
          </div>
        )}
      </section>
      </div>
    </>
  );
};

export default News;
