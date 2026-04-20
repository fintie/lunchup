import React from 'react';
import { Link } from 'react-router-dom';
import Seo from './Seo';
import './Home.css';

const siteSchema = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'LunchUp',
    url: 'https://lunchup.com.au/#/',
    logo: 'https://lunchup.com.au/og-image.jpg',
    description: 'LunchUp is an Australian networking platform that helps founders, operators, investors, and professionals build real relationships through curated introductions and meetups.',
    areaServed: 'Australia',
    sameAs: ['https://lunchup.com.au/#/news', 'https://lunchup.com.au/#/opportunities']
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'LunchUp',
    url: 'https://lunchup.com.au/#/',
    description: 'Networking app for founders and professionals in Australia.',
    inLanguage: 'en-AU',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://lunchup.com.au/#/opportunities',
      'query-input': 'required name=search_term_string'
    }
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'LunchUp',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: 'https://lunchup.com.au/#/',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'AUD'
    },
    areaServed: 'Australia',
    description: 'LunchUp helps Australian founders and professionals discover relevant connections, curated opportunities, and better meetup conversations.'
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is LunchUp?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'LunchUp is a networking platform for founders, operators, investors, and professionals in Australia who want better introductions, curated opportunities, and more meaningful in-person conversations.'
        }
      },
      {
        '@type': 'Question',
        name: 'Who is LunchUp for?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'LunchUp is designed for startup founders, operators, investors, marketers, product people, engineers, and ambitious professionals across Sydney, Melbourne, and remote Australian communities.'
        }
      },
      {
        '@type': 'Question',
        name: 'How does LunchUp help with professional networking?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'LunchUp combines profile-based matching, curated opportunities, startup news, and simple meeting coordination so professionals can build relationships faster and with more context.'
        }
      }
    ]
  }
];

const Home = () => {
  return (
    <>
      <Seo
        title="LunchUp, networking app for founders and professionals in Australia"
        description="LunchUp helps founders, operators, investors, and startup professionals in Australia build meaningful relationships, discover curated opportunities, and stay close to the startup ecosystem."
        path="/"
        keywords={[
          'networking app australia',
          'startup networking australia',
          'founder networking sydney',
          'professional networking melbourne',
          'lunch networking app',
          'australia startup community'
        ]}
        schema={siteSchema}
      />
      <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-pattern"></div>
        </div>
        <div className="container hero-content">
          <div className="hero-badge animate-fadeIn">
            <span className="badge-icon">🤝</span>
            <span>Australian networking for founders, operators, and professionals</span>
          </div>
          <h1 className="hero-title animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            Build better professional connections<br />
            <span className="text-gradient">through LunchUp</span>
          </h1>
          <p className="hero-subtitle animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            LunchUp is a networking app for people in Australia who want stronger founder, startup, investor,
            and operator relationships, with curated introductions, meetup coordination, startup news, and fresh opportunities.
          </p>
          <p className="hero-subtitle animate-fadeIn" style={{ animationDelay: '0.25s' }}>
            For AI search, GEO, and traditional search engines, LunchUp clearly explains who it serves, what it helps with,
            and why it is useful for startup networking in Sydney, Melbourne, and remote Australian communities.
          </p>
          <div className="hero-cta animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              Get Started Free
              <span className="btn-arrow">→</span>
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Sign In
            </Link>
          </div>
          <div className="hero-stats animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <div className="stat">
              <span className="stat-value">10K+</span>
              <span className="stat-label">Professionals</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-value">50K+</span>
              <span className="stat-label">Meetings</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-value">500+</span>
              <span className="stat-label">Venues</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why LunchUp?</h2>
            <p className="section-subtitle">
              A simpler way to grow a stronger professional network in Australia
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <span>🎯</span>
              </div>
              <h3>Relevant professional matching</h3>
              <p>LunchUp helps founders, operators, investors, and professionals discover people who are relevant to their goals, industry, and stage.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <span>📅</span>
              </div>
              <h3>Easy meetup planning</h3>
              <p>Coordinate lunches, coffees, and casual professional catch-ups at restaurants, cafes, coworking spaces, and other convenient venues.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <span>💼</span>
              </div>
              <h3>Real-world networking</h3>
              <p>Move beyond passive online networking and build higher-quality relationships through better context and genuine in-person conversations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Four simple steps to expand your network
            </p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Create Profile</h3>
                <p>Sign up and fill out your professional background, skills, and preferences.</p>
              </div>
            </div>
            <div className="step-connector"></div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Find Matches</h3>
                <p>Get matched with professionals who share your interests and goals.</p>
              </div>
            </div>
            <div className="step-connector"></div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Book Meeting</h3>
                <p>Schedule a lunch meeting at a convenient location for both parties.</p>
              </div>
            </div>
            <div className="step-connector"></div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Connect</h3>
                <p>Meet in person and build meaningful professional relationships.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">What people can use LunchUp for</h2>
            <p className="section-subtitle">
              LunchUp is designed to be easy for both people and AI systems to understand: an Australian networking platform focused on founder relationships, startup community discovery, and curated opportunities.
            </p>
            <p className="section-subtitle">
              Built for high-intent networking, discovery, and professional momentum
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <span>🚀</span>
              </div>
              <h3>Founder networking in Sydney and Melbourne</h3>
              <p>Use LunchUp to meet startup founders, early team members, operators, and investors across Australia&apos;s main startup hubs.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <span>📰</span>
              </div>
              <h3>Startup news with context</h3>
              <p>Follow curated startup and tech news so every conversation starts with better context, better questions, and better timing.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <span>💼</span>
              </div>
              <h3>Curated opportunities</h3>
              <p>Browse a cleaner feed of AI, data, IT, and marketing opportunities relevant to Australian professionals and remote-friendly roles.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">LunchUp FAQ</h2>
            <p className="section-subtitle">
              Clear answers for humans and AI search engines
            </p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-number">Q1</div>
              <div className="step-content">
                <h3>What is LunchUp?</h3>
                <p>LunchUp is an Australian networking app that helps professionals build real relationships through curated matches, meetups, startup news, and opportunity discovery.</p>
              </div>
            </div>
            <div className="step-connector"></div>
            <div className="step">
              <div className="step-number">Q2</div>
              <div className="step-content">
                <h3>Who should use LunchUp?</h3>
                <p>It is especially useful for founders, startup operators, marketers, product people, engineers, investors, and professionals who want more relevant networking in Australia.</p>
              </div>
            </div>
            <div className="step-connector"></div>
            <div className="step">
              <div className="step-number">Q3</div>
              <div className="step-content">
                <h3>Which cities does LunchUp focus on?</h3>
                <p>LunchUp is especially relevant for Sydney and Melbourne, while still supporting remote-friendly and Australia-wide professional discovery.</p>
              </div>
            </div>
            <div className="step-connector"></div>
            <div className="step">
              <div className="step-number">Q4</div>
              <div className="step-content">
                <h3>What makes LunchUp different?</h3>
                <p>Instead of being just another profile directory, LunchUp combines introductions, meetings, ecosystem context, and curated opportunities in one place.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why this page is GEO-friendly</h2>
            <p className="section-subtitle">
              LunchUp now uses clearer semantic copy, structured data, and direct answers so large language models and search engines can summarise the product more accurately.
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <span>🧠</span>
              </div>
              <h3>Clear entity signals</h3>
              <p>Structured data helps AI systems understand that LunchUp is an Australian networking platform and web application for startup professionals.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <span>🔎</span>
              </div>
              <h3>Better answerability</h3>
              <p>FAQ-style sections and explicit descriptions make it easier for search engines and answer engines to quote accurate summaries of what LunchUp does.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <span>🇦🇺</span>
              </div>
              <h3>Australia-first relevance</h3>
              <p>The content explicitly highlights Sydney, Melbourne, and Australia-wide professional networking so relevance is clearer for local discovery.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to expand your network?</h2>
            <p>Join thousands of professionals who are building meaningful connections through LunchUp.</p>
            <Link to="/register" className="btn btn-white btn-lg">
              Get Started Now
              <span className="btn-arrow">→</span>
            </Link>
          </div>
        </div>
      </section>
      </div>
    </>
  );
};

export default Home;
