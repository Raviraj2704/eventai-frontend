// ============================================================================
// HubPage.jsx - Feature Discovery Hub
// ============================================================================
// Purpose: Central hub showing all 12 features in 2-column grid layout
// Status: Production-Ready ✅
// Last Updated: Sep 24, 2026

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../services/api';
import '../../styles/hub.css';

export default function HubPage() {
  const navigate = useNavigate();
  const [hubData, setHubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================================================
  // 12 Feature Cards Configuration - EXACTLY like your 7 pictures
  // ============================================================================
  const featureCards = [
    {
      id: 1,
      title: 'Announcements',
      icon: '📢',
      description: 'Stay updated with latest news',
      path: '/announcements',
      apiEndpoint: '/api/v1/announcements',
      color: '#4a9eff'
    },
    {
      id: 2,
      title: 'Speakers',
      icon: '🎤',
      description: 'Meet the experts',
      path: '/speakers',
      apiEndpoint: '/api/v1/speakers',
      color: '#4a9eff'
    },
    {
      id: 3,
      title: 'Schedule',
      icon: '📅',
      description: 'View all sessions and events',
      path: '/sessions',
      apiEndpoint: '/api/v1/sessions',
      color: '#5ab1ff'
    },
    {
      id: 4,
      title: 'Learning',
      icon: '📚',
      description: 'Boost your skills',
      path: '/learning-paths',
      apiEndpoint: '/api/v1/learning_paths',
      color: '#9575ff'
    },
    {
      id: 5,
      title: 'Engagement',
      icon: '👥',
      description: 'Participate in polls and quizzes',
      path: '/engagement-center',
      apiEndpoint: '/api/v1/engagement/polls',
      color: '#5ab1ff'
    },
    {
      id: 6,
      title: 'Partners',
      icon: '🤝',
      description: 'Discover our partners',
      path: '/partners',
      apiEndpoint: '/api/v1/partners',
      color: '#4a9eff'
    },
    {
      id: 7,
      title: 'Briefcase',
      icon: '💼',
      description: 'Your saved resources',
      path: '/briefcase',
      apiEndpoint: '/api/v1/resources',
      color: '#5ab1ff'
    },
    {
      id: 8,
      title: 'Ratings',
      icon: '⭐',
      description: 'View session ratings',
      path: '/ratings',
      apiEndpoint: '/api/v1/ratings',
      color: '#4a9eff'
    },
    {
      id: 9,
      title: 'Analytics',
      icon: '📊',
      description: 'Your performance stats',
      path: '/analytics',
      apiEndpoint: '/api/v1/analytics/dashboard',
      color: '#5ab1ff'
    },
    {
      id: 10,
      title: 'Admin',
      icon: '⚙️',
      description: 'Admin controls',
      path: '/admin',
      apiEndpoint: '/api/v1/admin/users',
      color: '#4a9eff'
    },
    {
      id: 11,
      title: 'Picbot',
      icon: '🤖',
      description: 'AI assistant',
      path: '/picbot',
      apiEndpoint: '/api/v1/ai/chat',
      color: '#9575ff'
    },
    {
      id: 12,
      title: 'AI Matches',
      icon: '🎯',
      description: 'Perfect networking matches',
      path: '/ai-matches',
      apiEndpoint: '/api/v1/ai/networking/matches',
      color: '#5ab1ff'
    }
  ];

  // ============================================================================
  // Load Hub Data on Mount
  // ============================================================================
  useEffect(() => {
    loadHubData();
  }, []);

  const loadHubData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch event/hub info
      const eventData = await apiGet('/api/v1/events');
      if (Array.isArray(eventData) && eventData.length > 0) {
        setHubData(eventData[0]);
      } else {
        setHubData({
          name: 'NextGen AI Expo 2026',
          description: 'Innovation Hub'
        });
      }
    } catch (err) {
      console.error('Failed to load hub data:', err);
      // Set default data on error (don't block UI)
      setHubData({
        name: 'NextGen AI Expo 2026',
        description: 'Innovation Hub'
      });
      setError('Some features may not be available');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // Handle Feature Card Click
  // ============================================================================
  const handleFeatureClick = async (feature) => {
    try {
      // Validate API endpoint exists before navigating
      const response = await apiGet(feature.apiEndpoint);
      
      // If we got data (success), navigate to the feature
      if (response) {
        navigate(feature.path);
      }
    } catch (err) {
      console.warn(`API endpoint ${feature.apiEndpoint} not available:`, err);
      // Still navigate, component will handle no data gracefully
      navigate(feature.path);
    }
  };

  // ============================================================================
  // Render
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

  return (
    <div className="hub-container">
      {/* ========== Hero Section ========== */}
      <div className="hub-hero">
        <h1>{hubData?.name || 'NextGen AI Expo 2026'}</h1>
        <p>{hubData?.description || 'Innovation Hub'}</p>
      </div>

      {/* ========== Error Banner ========== */}
      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
          <button onClick={loadHubData} className="btn-retry">Retry</button>
        </div>
      )}

      {/* ========== Hub Features Grid - 12 Cards in 2 Columns ========== */}
      <section className="hub-features-section">
        <h2>Hub Features</h2>
        <div className="hub-features-grid">
          {featureCards.map(feature => (
            <div
              key={feature.id}
              className="hub-feature-card"
              onClick={() => handleFeatureClick(feature)}
              style={{ backgroundColor: feature.color }}
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

      {/* ========== Quick Stats Section ========== */}
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
