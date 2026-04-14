import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Seo from './Seo';
import './Opportunities.css';

const FILTERS = {
  cities: ['All', 'Sydney', 'Melbourne', 'Remote'],
  categories: ['All', 'AI', 'Data', 'IT', 'Marketing']
};

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

const Opportunities = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/opportunities');
        setJobs(Array.isArray(data.items) ? data.items : []);
        setUpdatedAt(data.updatedAt || '');
        setError('');
      } catch (err) {
        console.error('Failed to load opportunities:', err?.response?.status, err?.response?.data || err.message || err);
        setError('Unable to load opportunities right now. Please try again shortly.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const haystack = [job.title, job.company, job.location, job.category, job.summary, job.source]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const cityMatch = selectedCity === 'All'
        ? true
        : selectedCity === 'Remote'
          ? /remote/i.test(job.location || '')
          : (job.location || '').toLowerCase().includes(selectedCity.toLowerCase());

      const categoryMatch = selectedCategory === 'All'
        ? true
        : (job.category || '').toLowerCase() === selectedCategory.toLowerCase();

      const searchMatch = !query || haystack.includes(query);

      return cityMatch && categoryMatch && searchMatch;
    });
  }, [jobs, search, selectedCity, selectedCategory]);

  return (
    <>
      <Seo
        title="Opportunities in Sydney and Melbourne | Lunchup"
        description="Browse curated AI, data, IT, and marketing opportunities for Sydney and Melbourne in a cleaner, faster job discovery experience inside Lunchup."
        path="/opportunities"
        type="website"
        keywords={[
          'sydney jobs ai',
          'melbourne jobs data',
          'marketing jobs lunchup',
          'it opportunities australia'
        ]}
      />
      <div className="opportunities-page">
        <section className="opportunities-hero">
          <div className="opportunities-hero-inner">
            <div className="opportunities-hero-copy">
              <span className="opportunities-eyebrow">Lunchup Opportunities</span>
              <h1>Find fresh AI, data, IT, and marketing roles</h1>
              <p>
                A cleaner jobs board for Sydney and Melbourne roles, with a streamlined browsing experience
                and direct links back to the original listing.
              </p>
              {updatedAt && <div className="opportunities-updated">Last updated: {formatDate(updatedAt)}</div>}
            </div>
            <div className="opportunities-search-card">
              <label className="opportunities-field">
                <span>Search roles</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="AI engineer, growth marketer, data analyst..."
                />
              </label>
              <div className="opportunities-filter-row">
                <label className="opportunities-field">
                  <span>City</span>
                  <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                    {FILTERS.cities.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="opportunities-field">
                  <span>Category</span>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                    {FILTERS.categories.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="opportunities-search-meta">
                <strong>{filteredJobs.length}</strong> role{filteredJobs.length === 1 ? '' : 's'} available
              </div>
            </div>
          </div>
        </section>

        <section className="opportunities-content">
          {loading ? (
            <div className="opportunities-state-card">Loading opportunities…</div>
          ) : error ? (
            <div className="opportunities-state-card error">{error}</div>
          ) : filteredJobs.length === 0 ? (
            <div className="opportunities-state-card">No roles match those filters yet. Try another search.</div>
          ) : (
            <div className="opportunities-layout">
              <aside className="opportunities-sidebar">
                <div className="opportunities-sidebar-card">
                  <h2>Filters</h2>
                  <p>Focused on Sydney, Melbourne, and remote-friendly roles across the four categories you asked for.</p>
                  <ul>
                    <li>AI</li>
                    <li>Data</li>
                    <li>IT</li>
                    <li>Marketing</li>
                  </ul>
                  <p className="opportunities-sidebar-note">Sources currently prioritise more stable feeds over brittle job-site scraping.</p>
                </div>
              </aside>

              <div className="opportunities-results">
                {filteredJobs.map((job) => (
                  <article className="opportunities-card" key={job.id}>
                    <div className="opportunities-card-top">
                      <div>
                        <div className="opportunities-card-meta">
                          <span className="opportunities-badge">{job.category}</span>
                          <span>{job.source}</span>
                          <span>•</span>
                          <span>{formatDate(job.publishedAt)}</span>
                        </div>
                        <h2>{job.title}</h2>
                        <div className="opportunities-company">{job.company}</div>
                      </div>
                      <a
                        href={job.applyUrl || job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="opportunities-apply"
                      >
                        Apply now
                      </a>
                    </div>

                    <div className="opportunities-location-row">
                      <span>{job.location}</span>
                      {job.isRemote && <span className="opportunities-remote-pill">Remote friendly</span>}
                    </div>

                    <p className="opportunities-summary">{job.summary}</p>

                    {Array.isArray(job.tags) && job.tags.length > 0 && (
                      <div className="opportunities-tags">
                        {job.tags.map((tag) => (
                          <span key={`${job.id}-${tag}`} className="opportunities-tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default Opportunities;
