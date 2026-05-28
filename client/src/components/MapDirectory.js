import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapDirectory.css';

const CATEGORY_STYLES = {
  startup: { label: 'AI Startup', color: '#f97316', icon: '🤖' },
  investor: { label: 'Investor', color: '#2563eb', icon: '💼' },
  university: { label: 'University', color: '#10b981', icon: '🎓' },
  coworking: { label: 'Coworking', color: '#8b5cf6', icon: '🏢' },
  accelerator: { label: 'Accelerator', color: '#ec4899', icon: '🚀' },
  community: { label: 'Community', color: '#0284c7', icon: '🌐' },
  event: { label: 'Event', color: '#fbbf24', icon: '📍' }
};

const LOCATIONS = [
  {
    id: 'atalassian',
    name: 'Atlassian',
    category: 'startup',
    description: 'Global software leader with Sydney innovation teams building collaboration and AI products.',
    website: 'https://www.atlassian.com',
    contact: 'info@atlassian.com',
    address: '341 George St, Sydney NSW 2000',
    upcomingEvents: 'AI product leadership meetup',
    relatedUsers: 16,
    tags: ['AI', 'collaboration', 'Sydney CBD'],
    position: [-33.884, 151.208]
  },
  {
    id: 'canva',
    name: 'Canva',
    category: 'startup',
    description: 'Design platform with strong AI, startup growth, and Sydney headquarters presence.',
    website: 'https://www.canva.com',
    contact: 'hello@canva.com',
    address: '1 Denison St, North Sydney NSW 2060',
    upcomingEvents: 'Design + AI networking brunch',
    relatedUsers: 24,
    tags: ['AI', 'design', 'growth'],
    position: [-33.8329, 151.2060]
  },
  {
    id: 'harrison-ai',
    name: 'Harrison.ai',
    category: 'startup',
    description: 'Healthcare AI startup building machine learning solutions for medical imaging.',
    website: 'https://www.harrison.ai',
    contact: 'contact@harrison.ai',
    address: '303 George St, Sydney NSW 2000',
    upcomingEvents: 'Healthtech founder roundtable',
    relatedUsers: 8,
    tags: ['healthtech', 'AI', 'startup'],
    position: [-33.8692, 151.207]
  },
  {
    id: 'leonardo-ai',
    name: 'Leonardo AI (example)',
    category: 'startup',
    description: 'AI research and product startup with a focus on generative intelligence and innovation.',
    website: 'https://www.leonardo.ai',
    contact: 'hello@leonardo.ai',
    address: '201 Sussex St, Sydney NSW 2000',
    upcomingEvents: 'AI research lab open night',
    relatedUsers: 7,
    tags: ['AI', 'research', 'machine learning'],
    position: [-33.8762, 151.2001]
  },
  {
    id: 'relevance-ai',
    name: 'Relevance AI',
    category: 'startup',
    description: 'Data and AI startup helping companies build better machine learning workflows.',
    website: 'https://www.relevance.ai',
    contact: 'team@relevance.ai',
    address: '501 George St, Sydney NSW 2000',
    upcomingEvents: 'AI data practitioners meetup',
    relatedUsers: 10,
    tags: ['AI', 'data', 'analytics'],
    position: [-33.8766, 151.2044]
  },
  {
    id: 'eucalyptus',
    name: 'Eucalyptus',
    category: 'startup',
    description: 'AI startup working on computer vision and generative intelligence solutions.',
    website: 'https://www.eucalyptus.ai',
    contact: 'contact@eucalyptus.ai',
    address: '90 George St, Sydney NSW 2000',
    upcomingEvents: 'Computer vision founders session',
    relatedUsers: 5,
    tags: ['AI', 'computer vision'],
    position: [-33.8688, 151.2093]
  },
  {
    id: 'immutable',
    name: 'Immutable',
    category: 'startup',
    description: 'Blockchain and gaming startup with strong Australian roots and engineering talent.',
    website: 'https://www.immutable.com',
    contact: 'info@immutable.com',
    address: '1 Barangaroo Ave, Barangaroo NSW 2000',
    upcomingEvents: 'Web3 builder breakfast',
    relatedUsers: 12,
    tags: ['blockchain', 'AI', 'startup'],
    position: [-33.8675, 151.205]
  },
  {
    id: 'airtree',
    name: 'Airtree',
    category: 'investor',
    description: 'Sydney venture capital fund investing in Australian founders across AI, software, and consumer.',
    website: 'https://airtree.vc',
    contact: 'hello@airtree.vc',
    address: '83 Clarence St, Sydney NSW 2000',
    upcomingEvents: 'Seed investor office hours',
    relatedUsers: 3,
    tags: ['VC', 'seed', 'AI'],
    position: [-33.8730, 151.2066]
  },
  {
    id: 'blackbird',
    name: 'Blackbird Ventures',
    category: 'investor',
    description: 'Early-stage Australian VC backing technology founders across SaaS, fintech and AI.',
    website: 'https://blackbird.vc',
    contact: 'team@blackbird.vc',
    address: '75 Castlereagh St, Sydney NSW 2000',
    upcomingEvents: 'Founder pitch prep session',
    relatedUsers: 4,
    tags: ['VC', 'growth', 'AI'],
    position: [-33.8703, 151.2065]
  },
  {
    id: 'square-peg',
    name: 'Square Peg Capital',
    category: 'investor',
    description: 'Global investor with a strong presence in Australian startups and AI-enabled businesses.',
    website: 'https://www.squarepegcap.com',
    contact: 'info@squarepegcap.com',
    address: '100 William St, Sydney NSW 2010',
    upcomingEvents: 'Investor networking dinner',
    relatedUsers: 2,
    tags: ['VC', 'growth', 'AI'],
    position: [-33.8735, 151.2057]
  },
  {
    id: 'main-sequence',
    name: 'Main Sequence',
    category: 'investor',
    description: 'Australian deep tech VC partnering with science, health, robotics and AI founders.',
    website: 'https://mains.sequence.com',
    contact: 'info@mains.sequence.com',
    address: '1 Farrer Pl, Sydney NSW 2000',
    upcomingEvents: 'Deep tech founder lunch',
    relatedUsers: 3,
    tags: ['VC', 'deep tech', 'AI'],
    position: [-33.8695, 151.2040]
  },
  {
    id: 'unsw',
    name: 'UNSW',
    category: 'university',
    description: 'Leading Sydney university with strong AI research labs and innovation programs.',
    website: 'https://www.unsw.edu.au',
    contact: 'info@unsw.edu.au',
    address: 'Gate 9, High St, Kensington NSW 2052',
    upcomingEvents: 'AI research student open day',
    relatedUsers: 18,
    tags: ['education', 'AI', 'research'],
    position: [-33.9173, 151.2313]
  },
  {
    id: 'uts',
    name: 'UTS',
    category: 'university',
    description: 'University of Technology Sydney with applied AI research and industry collaboration.',
    website: 'https://www.uts.edu.au',
    contact: 'info@uts.edu.au',
    address: '15 Broadway, Ultimo NSW 2007',
    upcomingEvents: 'AI internships showcase',
    relatedUsers: 14,
    tags: ['education', 'AI', 'industry'],
    position: [-33.883, 151.2005]
  },
  {
    id: 'usyd',
    name: 'University of Sydney',
    category: 'university',
    description: 'Research university with AI labs, biomedical engineering and startup support programs.',
    website: 'https://www.sydney.edu.au',
    contact: 'info@sydney.edu.au',
    address: 'Camperdown NSW 2006',
    upcomingEvents: 'AI and society symposium',
    relatedUsers: 21,
    tags: ['education', 'research', 'AI'],
    position: [-33.8898, 151.1872]
  },
  {
    id: 'macquarie',
    name: 'Macquarie University',
    category: 'university',
    description: 'University with strong data science, engineering and AI research labs in Sydney.',
    website: 'https://www.mq.edu.au',
    contact: 'info@mq.edu.au',
    address: 'Balaclava Rd, Macquarie Park NSW 2113',
    upcomingEvents: 'Graduate AI internship fair',
    relatedUsers: 10,
    tags: ['education', 'AI', 'internships'],
    position: [-33.7754, 151.1128]
  },
  {
    id: 'fishburners',
    name: 'Fishburners',
    category: 'coworking',
    description: 'Startup coworking community supporting founders, operators and early-stage startups.',
    website: 'https://fishburners.org',
    contact: 'team@fishburners.org',
    address: '11 York St, Sydney NSW 2000',
    upcomingEvents: 'Founder coffee circle',
    relatedUsers: 6,
    tags: ['coworking', 'startup', 'community'],
    position: [-33.8714, 151.2083]
  },
  {
    id: 'stone-and-chalk',
    name: 'Stone & Chalk',
    category: 'coworking',
    description: 'Coworking hub for startups, investors and corporate innovation teams.',
    website: 'https://stoneandchalk.com.au',
    contact: 'hello@stoneandchalk.com.au',
    address: '11 York St, Sydney NSW 2000',
    upcomingEvents: 'Investor coffee meetup',
    relatedUsers: 11,
    tags: ['coworking', 'startup', 'investor'],
    position: [-33.8655, 151.2046]
  },
  {
    id: 'tank-stream-labs',
    name: 'Tank Stream Labs',
    category: 'coworking',
    description: 'Flexible co-working space for tech founders and lean startup teams in the CBD.',
    website: 'https://tankstreamlabs.com.au',
    contact: 'info@tankstreamlabs.com.au',
    address: '1 Kent St, Sydney NSW 2000',
    upcomingEvents: 'Startup pitch night',
    relatedUsers: 8,
    tags: ['coworking', 'startup', 'networking'],
    position: [-33.8673, 151.211]
  },
  {
    id: 'wework',
    name: 'WeWork Sydney',
    category: 'coworking',
    description: 'Global workspace with flexible office and community events for Sydney founders.',
    website: 'https://www.wework.com',
    contact: 'australia@wework.com',
    address: '60 Margaret St, Sydney NSW 2000',
    upcomingEvents: 'Startup networking breakfast',
    relatedUsers: 9,
    tags: ['coworking', 'professional', 'community'],
    position: [-33.8677, 151.2067]
  },
  {
    id: 'cicada-innovations',
    name: 'Cicada Innovations',
    category: 'accelerator',
    description: 'Deep tech accelerator supporting science, health and AI startups.',
    website: 'https://cicadainnovations.com.au',
    contact: 'grow@cicadainnovations.com.au',
    address: '1 Chifley Rd, Eveleigh NSW 2015',
    upcomingEvents: 'Deep tech accelerator showcase',
    relatedUsers: 5,
    tags: ['accelerator', 'deep tech', 'AI'],
    position: [-33.888, 151.198]
  },
  {
    id: 'startup-grind',
    name: 'Startup Grind Sydney',
    category: 'community',
    description: 'Founder community hosting monthly talks and networking for startup builders.',
    website: 'https://www.startupgrind.com/sydney',
    contact: 'sydney@startupgrind.com',
    address: '160 Pitt St, Sydney NSW 2000',
    upcomingEvents: 'Founder story night',
    relatedUsers: 14,
    tags: ['community', 'events', 'networking'],
    position: [-33.8732, 151.2064]
  },
  {
    id: 'nextgenius',
    name: 'NextGenius',
    category: 'community',
    description: 'Community for founders, investors and operators learning AI and startup best practices.',
    website: 'https://nextgenius.co',
    contact: 'community@nextgenius.co',
    address: '20 Hunter St, Sydney NSW 2000',
    upcomingEvents: 'AI founders workshop',
    relatedUsers: 7,
    tags: ['community', 'AI', 'founders'],
    position: [-33.8737, 151.2052]
  },
  {
    id: 'acs',
    name: 'ACS Sydney',
    category: 'community',
    description: 'Australian Computer Society community events for tech professionals and students.',
    website: 'https://www.acs.org.au',
    contact: 'info@acs.org.au',
    address: '18/181 William St, Sydney NSW 2000',
    upcomingEvents: 'Data science panel discussion',
    relatedUsers: 10,
    tags: ['community', 'professional', 'education'],
    position: [-33.8717, 151.2053]
  },
  {
    id: 'producttank-sydney',
    name: 'ProductTank Sydney',
    category: 'community',
    description: 'Product and UX community meetup for building better startup product teams.',
    website: 'https://www.meetup.com/ProductTank-Sydney',
    contact: 'sydney@producttank.com',
    address: '301 Kent St, Sydney NSW 2000',
    upcomingEvents: 'Product leadership panel',
    relatedUsers: 9,
    tags: ['community', 'product', 'meetup'],
    position: [-33.8695, 151.2085]
  },
  {
    id: 'sydney-ai-meetup',
    name: 'Sydney AI Meetup',
    category: 'community',
    description: 'Sydney meetup for artificial intelligence founders, engineers and operators.',
    website: 'https://www.meetup.com/sydney-ai',
    contact: 'organiser@sydneyai.com',
    address: '168 Sussex St, Sydney NSW 2000',
    upcomingEvents: 'AI networking drinks',
    relatedUsers: 18,
    tags: ['AI', 'meetup', 'events'],
    position: [-33.8716, 151.2068]
  },
  {
    id: 'ai-founders-lunch',
    name: 'Sydney AI Founders Lunch',
    category: 'event',
    description: 'Weekly founder meetup to discuss AI startups, fundraising and hiring.',
    website: 'https://lunchup.com.au/events',
    contact: 'events@lunchup.com.au',
    address: '55 Pitt St, Sydney NSW 2000',
    upcomingEvents: 'Next lunch on Friday at 12pm',
    relatedUsers: 20,
    tags: ['event', 'networking', 'AI'],
    position: [-33.8701, 151.2045]
  },
  {
    id: 'ml-hiring-night',
    name: 'Machine Learning Hiring Night',
    category: 'event',
    description: 'Hiring and internships event for machine learning engineers and data scientists.',
    website: 'https://lunchup.com.au/opportunities',
    contact: 'jobs@lunchup.com.au',
    address: '1 Chifley Pl, Sydney NSW 2000',
    upcomingEvents: 'Next session this Thursday',
    relatedUsers: 31,
    tags: ['hiring', 'internships', 'AI'],
    position: [-33.8791, 151.2002]
  }
];

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'startup', label: 'Startups' },
  { key: 'investor', label: 'Investors' },
  { key: 'university', label: 'Universities' },
  { key: 'coworking', label: 'Coworking' },
  { key: 'accelerator', label: 'Accelerators' },
  { key: 'community', label: 'Communities' },
  { key: 'event', label: 'Events' }
];

const MapDirectory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredLocations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return LOCATIONS.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      if (!query) return matchesCategory;

      const joinedFields = [
        item.name,
        item.description,
        item.address || '',
        item.tags.join(' '),
        item.category,
        item.upcomingEvents
      ]
        .join(' ')
        .toLowerCase();

      return matchesCategory && joinedFields.includes(query);
    });
  }, [searchTerm, selectedCategory]);

  return (
    <section className="map-directory">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Sydney Startup & AI Ecosystem Map</h2>
          <p className="section-subtitle">
            Explore Sydney’s AI startups, investors, universities, coworking spaces, accelerators and events on an interactive map.
          </p>
        </div>

        <div className="map-directory-actions">
          <div className="search-field">
            <label htmlFor="ecosystem-search">Search the ecosystem</label>
            <input
              id="ecosystem-search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="AI startups in Sydney CBD, seed investors, hiring roles, event meetups..."
            />
          </div>
          <div className="category-filters">
            {CATEGORIES.map((category) => (
              <button
                key={category.key}
                type="button"
                className={selectedCategory === category.key ? 'category-chip active' : 'category-chip'}
                onClick={() => setSelectedCategory(category.key)}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <div className="map-directory-grid">
          <div className="map-directory-map-shell">
            <MapContainer
              center={[-33.8688, 151.2093]}
              zoom={13}
              scrollWheelZoom={false}
              className="map-directory-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredLocations.map((item) => (
                <CircleMarker
                  key={item.id}
                  center={item.position}
                  radius={10}
                  pathOptions={{ color: CATEGORY_STYLES[item.category]?.color || '#000', fillColor: CATEGORY_STYLES[item.category]?.color || '#000', fillOpacity: 0.9 }}
                >
                  <Popup>
                    <div className="popup-content">
                      <strong>{item.name}</strong>
                      <p>{item.description}</p>
                      <p><strong>Category:</strong> {CATEGORY_STYLES[item.category]?.label}</p>
                      <p><strong>Address:</strong> {item.address}</p>
                      <p><strong>Website:</strong> <a href={item.website} target="_blank" rel="noreferrer">Visit</a></p>
                      <p><strong>Upcoming:</strong> {item.upcomingEvents}</p>
                      <p><strong>Nearby LunchUp users:</strong> {item.relatedUsers}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
            <div className="map-directory-legend">
              {Object.entries(CATEGORY_STYLES).map(([key, style]) => (
                <div key={key} className="legend-item">
                  <span className="legend-pill" style={{ background: style.color }}></span>
                  <span>{style.icon} {style.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="map-directory-list">
            <div className="list-summary">
              <p className="list-meta">Showing {filteredLocations.length} of {LOCATIONS.length} ecosystem profiles</p>
              <p className="list-description">
                Filter Sydney innovation resources by category, search for AI startups, investors, universities, coworking and events, and discover opportunities close to you.
              </p>
            </div>
            <div className="location-cards">
              {filteredLocations.map((item) => (
                <article key={item.id} className="location-card">
                  <div className="location-card-header">
                    <div className="location-badge" style={{ background: CATEGORY_STYLES[item.category]?.color || '#000' }}>
                      {CATEGORY_STYLES[item.category]?.icon}
                    </div>
                    <div>
                      <h3>{item.name}</h3>
                      <p>{CATEGORY_STYLES[item.category]?.label}</p>
                    </div>
                  </div>
                  <p className="location-description">{item.description}</p>
                  <div className="location-meta">
                    <span>{item.address}</span>
                    <span>{item.tags.join(' · ')}</span>
                    <span>{item.relatedUsers} nearby LunchUp users</span>
                  </div>
                  <div className="location-links">
                    <a href={item.website} target="_blank" rel="noreferrer">Website</a>
                    <a href={`mailto:${item.contact}`}>Contact</a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapDirectory;
