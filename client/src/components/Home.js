import React from 'react';
import { Link } from 'react-router-dom';
import Seo from './Seo';
import './Home.css';

const Home = () => {
  return (
    <>
      <Seo
        title="Lunchup, startup networking and founder connections in Australia"
        description="Meet founders, operators, investors, and startup professionals in Australia through Lunchup, plus follow startup news and networking opportunities."
        path="/"
        keywords={[
          'startup networking australia',
          'founder networking sydney',
          'lunch networking app',
          'australia startup community'
        ]}
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
            <span>Professional networking, reimagined</span>
          </div>
          <h1 className="hero-title animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            Connect with Professionals<br />
            <span className="text-gradient">Over Lunch</span>
          </h1>
          <p className="hero-subtitle animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            LunchUp helps you build meaningful professional relationships through 
            face-to-face meetings at the best spots in town.
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
              The best way to build your professional network
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <span>🎯</span>
              </div>
              <h3>AI-Powered Matching</h3>
              <p>Our intelligent algorithm connects you with professionals who share your interests and goals.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <span>📅</span>
              </div>
              <h3>Easy Booking</h3>
              <p>Schedule lunch meetings at your preferred venues - restaurants, cafes, coworking spaces and more.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <span>💼</span>
              </div>
              <h3>Real Connections</h3>
              <p>Build meaningful relationships over face-to-face conversations instead of online interactions.</p>
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
