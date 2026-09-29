import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../services/api';
import '../../styles/hub.css';

export default function HubPage() {
  const navigate = useNavigate();
  const [hubData, setHubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================================================
  // Memoize feature cards - DO NOT recreate on every render
  // ============================================================================
  const featureCards = useMemo(() => [
    {
      id: 1,
      title: 'Announcements',
      icon: '📢',
      description: 'Stay updated with latest news',
      path: '/announcements',
      apiEndpoint: '/announcements',
      color: '#4a9eff'
    },
    {
      id: 2,
      title: 'Speakers',
      icon: '🎤',
      description: 'Meet the experts',
      path: '/speakers',
      apiEndpoint: '/speakers',
      color: '#4a9eff'
    },
    {
      id: 3,
      title: 'Schedule',
      icon: '📅',
      description: 'View all sessions and events',
      path: '/sessions',
      apiEndpoint: '/sessions',
      color: '#5ab1ff'
    },
    {
      id: 4,
      title: 'Learning',
      icon: '📚',
      description: 'Boost your skills',
      path: '/learning-paths',
      apiEndpoint: '/learning_paths',
      color: '#9575ff'
    },
    {
      id: 5,
      title: 'Engagement',
      icon: '👥',
      description: 'Participate in polls and quizzes',
      path: '/engagement-center',
      apiEndpoint: '/engagement/polls',
      color: '#5ab1ff'
    },
    {
      id: 6,
      title: 'Partners',
      icon: '🤝',
      description: 'Discover our partners',
      path: '/partners',
      apiEndpoint: '/partners',
      color: '#4a9eff'
    },
    {
      id: 7,
      title: 'Briefcase',
      icon: '💼',
      description: 'Your saved resources',
      path: '/briefcase',
      apiEndpoint: '/resources',
      color: '#5ab1ff'
    },
    {
      id: 8,
      title: 'Ratings',
      icon: '⭐',
      description: 'View session ratings',
      path: '/ratings',
      apiEndpoint: '/ratings',
      color: '#4a9eff'
    },
    {
      id: 9,
      title: 'Analytics',
      icon: '📊',
      description: 'Your performance stats',
      path: '/analytics',
      apiEndpoint: '/analytics/dashboard',
      color: '#5ab1ff'
    },
    {
      id: 10,
      title: 'Admin',
      icon: '⚙️',
      description: 'Admin controls',
      path: '/admin',
      apiEndpoint: '/admin/users',
      color: '#4a9eff'
    },
    {
      id: 11,
      title: 'Picbot',
      icon: '🤖',
      description: 'AI assistant',
      path: '/picbot',
      apiEndpoint: null,
      color: '#9575ff'
    },
    {
      id: 12,
      title: 'AI Matches',
      icon: '🎯',
      description: 'Perfect networking matches',
      path: '/ai-matches',
      apiEndpoint: '/ai/networking/matches',
      color: '#5ab1ff'
    }
  ], []);

  // ============================================================================
  // Load Hub Data - ONLY on component mount (empty dependency array)
  // ============================================================================
  useEffect(() => {
    loadHubData();
  }, []); // ✅ CRITICAL: Empty array means this runs ONCE on mount only

  const loadHubData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Static data - no need for API call in MVP
      setHubData({
        name: 'NextGen AI Expo 2026',
        description: 'Innovation Hub',
        location: 'HITECH City, Hyderabad'
      });
    } catch (err) {
      console.error('Failed to load hub data:', err);
      // Set fallback data on error
      setHubData({
        name: 'NextGen AI Expo 2026',
        description: 'Innovation Hub',
        location: 'HITECH City, Hyderabad'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // Handle Feature Click - DO NOT call API here, just navigate
  // ============================================================================
  const handleFeatureClick = useCallback((feature) => {
    // Don't make API calls on click - user will see data when page loads
    navigate(feature.path);
  }, [navigate]);

  // ============================================================================
  // Loading State
  // ============================================================================
  if (loading) {
    return (
      <div className="hub-container">
        <div className="loading-spinner">
          <p>Loading hub features...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================
  return (
    <div className="hub-container">
      {/* Hero Section */}
      <div className="hub-hero">
        <h1>{hubData?.name || 'NextGen AI Expo 2026'}</h1>
        <p>{hubData?.description || 'Innovation Hub'}</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
          <button onClick={loadHubData} className="btn-retry">
            Retry
          </button>
        </div>
      )}

      {/* Features Grid */}
      <section className="hub-features-section">
        <h2>Hub Features</h2>
        <div className="hub-features-grid">
          {featureCards.map((feature) => (
            <div
              key={feature.id}
              className="hub-feature-card"
              onClick={() => handleFeatureClick(feature)}
              style={{ backgroundColor: feature.color }}
              role="button"
              tabIndex={0}
            >
              <div className="feature-card-content">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
              <div className="feature-arrow">→</div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="hub-stats">
        <h2>Event Overview</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">📋</span>
            <h4>Total Features</h4>
            <p className="stat-value">12</p>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📅</span>
            <h4>Event</h4>
            <p className="stat-value">{hubData?.name || 'AI Expo'}</p>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📍</span>
            <h4>Location</h4>
            <p className="stat-value">{hubData?.location || 'Online'}</p>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📞</span>
            <h4>Support</h4>
            <p className="stat-value">24/7</p>
          </div>
        </div>
      </section>
    </div>
  );
}