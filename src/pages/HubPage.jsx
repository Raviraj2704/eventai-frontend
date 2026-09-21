import { useState, useEffect } from 'react';
import { apiGet } from '../services/api';
import '../styles/hub.css';

export default function HubPage() {
  const [hubData, setHubData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHubData();
  }, []);

  const loadHubData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch hub event info
      const eventData = await apiGet('/api/v1/events');
      if (Array.isArray(eventData) && eventData.length > 0) {
        setHubData(eventData[0]);
      }

      // Fetch featured sessions
      const sessionsData = await apiGet('/api/v1/sessions');
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);

      // Fetch speakers
      const speakersData = await apiGet('/api/v1/speakers');
      setSpeakers(Array.isArray(speakersData) ? speakersData.slice(0, 8) : []);
    } catch (err) {
      console.error('Failed to load hub data:', err);
      setError('Unable to load hub content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="hub-container"><p>Loading hub...</p></div>;
  }

  return (
    <div className="hub-container">
      {/* Hero Section */}
      <div className="hub-hero">
        <h1>{hubData?.name || 'NextGen AI Expo 2026'}</h1>
        <p>{hubData?.description || 'The ultimate event management hub'}</p>
      </div>

      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
          <button onClick={loadHubData} className="btn-retry">Retry</button>
        </div>
      )}

      {/* Hub Features Grid */}
      <section className="hub-features">
        <h2>Hub Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>Schedule</h3>
            <p>View all sessions and events</p>
            <a href="/sessions" className="feature-link">Explore →</a>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎤</div>
            <h3>Speakers</h3>
            <p>Meet the experts</p>
            <a href="/speakers" className="feature-link">View Speakers →</a>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🤝</div>
            <h3>Networking</h3>
            <p>Connect with professionals</p>
            <a href="/networking" className="feature-link">Network →</a>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📢</div>
            <h3>Announcements</h3>
            <p>Stay updated</p>
            <a href="/announcements" className="feature-link">Read News →</a>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Briefcase</h3>
            <p>Save your favorites</p>
            <a href="/briefcase" className="feature-link">My Items →</a>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Analytics</h3>
            <p>Your progress</p>
            <a href="/analytics" className="feature-link">View Stats →</a>
          </div>
        </div>
      </section>

      {/* Featured Speakers */}
      <section className="featured-speakers">
        <div className="section-header">
          <h2>Featured Speakers</h2>
          <a href="/speakers" className="view-all">View All →</a>
        </div>

        {speakers.length === 0 ? (
          <p>No speakers available yet</p>
        ) : (
          <div className="speakers-grid">
            {speakers.map(speaker => (
              <div key={speaker.id} className="speaker-card-hub">
                {speaker.avatar && (
                  <img src={speaker.avatar} alt={speaker.name} className="speaker-avatar" />
                )}
                <h3>{speaker.name}</h3>
                <p className="speaker-title">{speaker.title}</p>
                <p className="speaker-company">{speaker.company}</p>
                <div className="speaker-rating">
                  {'⭐'.repeat(Math.round(speaker.rating || 0))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Event Info */}
      {hubData && (
        <section className="event-info">
          <h2>About {hubData.name}</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Location:</span>
              <span className="info-value">{hubData.location || 'Online'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Dates:</span>
              <span className="info-value">
                {hubData.start_date ? new Date(hubData.start_date).toLocaleDateString() : 'TBA'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Total Sessions:</span>
              <span className="info-value">{sessions.length}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Speakers:</span>
              <span className="info-value">{speakers.length}</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}