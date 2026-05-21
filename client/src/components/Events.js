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
  const [cityFilter, setCityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

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

  const availableCities = useMemo(() => {
    return ['ALL', ...new Set(events.map((event) => event.city).filter(Boolean))];
  }, [events]);

  const availableCategories = useMemo(() => {
    const categories = new Set();
    events.forEach((event) => {
      (event.categoryJson?.categories || []).forEach((category) => categories.add(category));
    });
    return ['ALL', ...Array.from(categories)];
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const cityMatch = cityFilter === 'ALL' || event.city === cityFilter;
      const categoryMatch = categoryFilter === 'ALL' || (event.categoryJson?.categories || []).includes(categoryFilter);
      return cityMatch && categoryMatch;
    });
  }, [events, cityFilter, categoryFilter]);

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
          <h1>All events in one place</h1>
          <p>
            Browse the full Lunchup events feed on one page, then optionally generate tailored picks based on your profile and event interests.
          </p>
          <div className="events-actions">
            <button className="btn btn-primary" onClick={runRecommendations} disabled={!userId || running}>
              {running ? 'Finding events…' : 'Generate My Event Picks'}
            </button>
          </div>
          {!userId && <div className="events-note">You can browse all events now. Sign in only if you want personalized picks.</div>}
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

            <div className="events-summary-row">
              <div className="events-state-card small">
                <strong>{events.length}</strong>
                <span>Total events</span>
              </div>
              <div className="events-state-card small">
                <strong>{filteredEvents.length}</strong>
                <span>Showing now</span>
              </div>
              <div className="events-state-card small">
                <strong>{recommendations.length}</strong>
                <span>Your picks</span>
              </div>
            </div>

            <div className="events-toolbar">
              <div className="toolbar-group">
                <label>City</label>
                <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="form-input">
                  {availableCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div className="toolbar-group">
                <label>Category</label>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="form-input">
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            {recommendations.length > 0 && (
              <section className="recommendations-strip">
                <div className="section-header-row">
                  <h2>Your recommended events</h2>
                  <span>{recommendations.length}</span>
                </div>
                <div className="recommendation-list compact">
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
              </section>
            )}

            <section>
              <div className="section-header-row">
                <h2>Upcoming events</h2>
                <span>{filteredEvents.length} loaded</span>
              </div>
              <div className="events-grid full-width">
                {filteredEvents.map((event) => (
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
              {filteredEvents.length === 0 && (
                <div className="events-state-card small">No events match the current filters.</div>
              )}
            </section>

            <div className="category-card standalone">
              <h3>Top categories in the feed</h3>
              <div className="event-tags">
                {topCategories.map(([category, count]) => (
                  <span className="event-tag" key={category}>{category} ({count})</span>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Events;
