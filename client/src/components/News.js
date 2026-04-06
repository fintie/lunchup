import React, { useEffect, useState } from 'react';
import axios from 'axios';
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
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/news');
        setNews(data.items || []);
        setUpdatedAt(data.updatedAt || '');
        setError('');
      } catch (err) {
        console.error('Failed to load news:', err);
        setError('Unable to load today\'s news right now. Please try again shortly.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="news-page">
      <section className="news-hero">
        <div className="news-hero-content">
          <span className="news-eyebrow">Lunchup News</span>
          <h1>Australia tech and startup news, updated for today</h1>
          <p>
            A daily snapshot of stories across Sydney and the broader Australian tech ecosystem,
            with a lightweight Lunchup angle on why stronger conversations and connections matter.
          </p>
          {updatedAt && (
            <div className="news-updated">Last updated: {formatDate(updatedAt)}</div>
          )}
        </div>
      </section>

      <section className="news-content">
        {loading ? (
          <div className="news-state-card">Loading today&apos;s stories…</div>
        ) : error ? (
          <div className="news-state-card error">{error}</div>
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
  );
};

export default News;
