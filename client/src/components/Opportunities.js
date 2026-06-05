import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Seo from './Seo';
import './Opportunities.css';

const opportunitiesSchema = [
  {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'LunchUp Opportunities',
    url: 'https://lunchup.com.au/#/opportunities',
    description: 'Curated AI, data, IT, and marketing opportunities for Sydney, Melbourne, and remote-friendly roles in Australia.',
    isPartOf: {
      '@type': 'WebSite',
      name: 'LunchUp',
      url: 'https://lunchup.com.au/#/'
    },
    about: [
      'Startup jobs Australia',
      'Sydney jobs',
      'Melbourne jobs',
      'Remote-friendly opportunities'
    ]
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What kinds of opportunities are listed on LunchUp?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'LunchUp highlights AI, data, IT, and marketing opportunities with a focus on Sydney, Melbourne, and remote-friendly roles relevant to Australian professionals.'
        }
      },
      {
        '@type': 'Question',
        name: 'Who is the Opportunities page for?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'It is designed for founders, operators, marketers, engineers, analysts, and other professionals who want a cleaner view of relevant roles in the Australian startup and tech ecosystem.'
        }
      }
    ]
  }
];

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
        title="Startup and tech opportunities in Sydney, Melbourne, and remote | LunchUp"
        description="Browse curated AI, data, IT, and marketing opportunities for Sydney, Melbourne, and remote-friendly roles in Australia, with cleaner discovery inside LunchUp."
        path="/opportunities"
        type="website"
        keywords={[
          'sydney startup jobs',
          'melbourne tech jobs',
          'remote jobs australia',
          'ai jobs sydney',
          'data jobs melbourne',
          'marketing opportunities australia',
          'it opportunities australia'
        ]}
        schema={opportunitiesSchema}
      />
      <div className="opportunities-page">
        <section className="opportunities-hero">
          <div className="opportunities-hero-inner">
            <div className="opportunities-hero-copy">
              <span className="opportunities-eyebrow">Lunchup Opportunities</span>
              <h1>Find fresh AI, data, IT, and marketing roles</h1>
              <p>
                A cleaner jobs board for Sydney, Melbourne, and remote-friendly roles, with a streamlined browsing experience
                and direct links back to the original listing.
              </p>
              <p>
                This page is written to be easy for both people and AI search systems to understand: it clearly signals role categories,
                location focus, and how LunchUp helps professionals discover relevant opportunities in Australia.
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
                  <p>That makes this page more useful for GEO too, because the topic, city intent, and job intent are all explicit.</p>
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

        <section className="opportunities-content">
          <div className="opportunities-layout">
            <aside className="opportunities-sidebar">
              <div className="opportunities-sidebar-card">
                <h2>LunchUp Opportunities FAQ</h2>
                <p><strong>What is this page for?</strong><br />It helps Australian professionals quickly find relevant startup and tech roles without digging through noisy job feeds.</p>
                <p><strong>Which locations does it focus on?</strong><br />Sydney, Melbourne, and remote-friendly opportunities across Australia.</p>
                <p><strong>Which role categories are covered?</strong><br />AI, data, IT, and marketing roles that fit the broader LunchUp community.</p>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </>
  );
};

export default Opportunities;
