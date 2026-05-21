import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './Events.css';

const formatDate = (value) => {
  try {
    return new Date(value).toLocaleString('en-AU', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  } catch (error) {
    return value;
  }
};

const Events = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [digest, setDigest] = useState('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const userId = user?.id;

  const loadEvents = async () => {
    const { data } = await axios.get('/events');
    setEvents(data.items || []);
  };

  const loadRecommendations = async () => {
    if (!userId) {
      setRecommendations([]);
      return;
    }

    const { data } = await axios.get(`/events/recommendations/${userId}`);
    setRecommendations(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await axios.post('/events/seed');
        await loadEvents();
        if (userId) {
          await loadRecommendations();
        }
        setError('');
      } catch (err) {
        console.error('Events init error:', err);
        setError('Could not load Lunchup Events right now.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [userId]);

  const runRecommendations = async () => {
    if (!userId) {
      setError('Sign in to generate event recommendations.');
      return;
    }

    try {
      setRunning(true);
      const { data } = await axios.post('/events/recommendations/run', { userId });
      setDigest(data.digests?.[0]?.message || 'Recommendations generated.');
      await loadRecommendations();
      setError('');
    } catch (err) {
      console.error('Run recommendations error:', err);
      setError('Failed to generate event recommendations.');
    } finally {
      setRunning(false);
    }
  };

  const topCategories = useMemo(() => {
    const counts = new Map();
    events.forEach((event) => {
      (event.categoryJson?.categories || []).forEach((category) => {
        counts.set(category, (counts.get(category) || 0) + 1);
      });
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [events]);

  return (
    <div className="events-page">
      <section className="events-hero">
        <div className="events-hero-content">
          <span className="events-eyebrow">Lunchup x Nixie</span>
          <h1>Discover events that fit your networking goals</h1>
          <p>
            This brings Nixie-style event discovery into Lunchup, aligned to your profile,
            interests, and the kinds of people you actually want to meet.
          </p>
          <div className="events-actions">
            <button className="btn btn-primary" onClick={runRecommendations} disabled={!userId || running}>
              {running ? 'Finding events…' : 'Generate My Event Picks'}
            </button>
          </div>
          {!userId && <div className="events-note">Sign in to get personalized event recommendations.</div>}
          {error && <div className="events-error">{error}</div>}
        </div>
      </section>

      <section className="events-content">
        {loading ? (
          <div className="events-state-card">Loading events…</div>
        ) : (
          <>
            {digest && (
              <div className="digest-card">
                <h2>Your generated digest</h2>
                <pre>{digest}</pre>
              </div>
            )}

            <div className="events-grid-layout">
              <div>
                <div className="section-header-row">
                  <h2>Upcoming events</h2>
                  <span>{events.length} loaded</span>
                </div>
                <div className="events-grid">
                  {events.map((event) => (
                    <article className="event-card" key={event._id || event.id}>
                      <div className="event-meta">
                        <span className="event-badge">{event.source}</span>
                        <span>{formatDate(event.startTime)}</span>
                      </div>
                      <h3>{event.title}</h3>
                      <p>{event.description}</p>
                      <div className="event-tags">
                        {(event.categoryJson?.categories || []).map((category) => (
                          <span className="event-tag" key={category}>{category}</span>
                        ))}
                      </div>
                      <div className="event-footer">
                        <div>
                          <strong>{event.venueName || 'Venue TBC'}</strong>
                          <div>{event.city}</div>
                        </div>
                        <a href={event.url} target="_blank" rel="noreferrer">Open ↗</a>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <aside className="recommendations-panel">
                <div className="section-header-row">
                  <h2>Your picks</h2>
                  <span>{recommendations.length}</span>
                </div>
                {recommendations.length ? (
                  <div className="recommendation-list">
                    {recommendations.map((item) => (
                      <div className="recommendation-card" key={item.id}>
                        <div className="recommendation-score">{item.score.toFixed(2)}</div>
                        <div>
                          <h3>{item.title}</h3>
                          <p>{item.reason}</p>
                          <div className="recommendation-meta">{formatDate(item.startTime)} • {item.city}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="events-state-card small">Run recommendations to see personalized event picks.</div>
                )}

                <div className="category-card">
                  <h3>Top categories in the feed</h3>
                  <div className="event-tags">
                    {topCategories.map(([category, count]) => (
                      <span className="event-tag" key={category}>{category} ({count})</span>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Events;
