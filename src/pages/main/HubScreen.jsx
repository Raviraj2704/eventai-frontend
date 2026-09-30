import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../services/api';
import '../../styles/hub.css';

export default function HubPage() {
  const navigate = useNavigate();
  const [hubData, setHubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const featureCards = [
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
      id: 12,
      title: 'AI Matches',
      icon: '🎯',
      description: 'Perfect networking matches',
      path: '/ai-matches',
      apiEndpoint: '/ai/networking/matches',
      color: '#5ab1ff'
    }
  ];

  useEffect(function () {
    loadHubData();
  }, []);

  const loadHubData = async function () {
    try {
      setLoading(true);
      setError(null);
      setHubData({
        name: 'NextGen AI Expo 2026',
        description: 'Innovation Hub',
        location: 'Online'
      });
    } catch (err) {
      console.error('Failed to load hub data:', err);
      setHubData({
        name: 'NextGen AI Expo 2026',
        description: 'Innovation Hub',
        location: 'Online'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureClick = async function (feature) {
    if (!feature.apiEndpoint || feature.path === '/admin') {
      navigate(feature.path);
      return;
    }
    try {
      await apiGet(feature.apiEndpoint);
      navigate(feature.path);
    } catch (err) {
      console.warn('API endpoint warning:', err);
      navigate(feature.path);
    }
  };

  if (loading) {
    return React.createElement(
      'div',
      { className: 'hub-container' },
      React.createElement(
        'div',
        { className: 'loading-spinner' },
        React.createElement('p', null, 'Loading hub features...')
      )
    );
  }

  return React.createElement(
    'div',
    { className: 'hub-container' },
    React.createElement(
      'div',
      { className: 'hub-hero' },
      React.createElement('h1', null, (hubData && hubData.name) || 'NextGen AI Expo 2026'),
      React.createElement('p', null, (hubData && hubData.description) || 'Innovation Hub')
    ),
    error &&
      React.createElement(
        'div',
        { className: 'error-banner' },
        React.createElement('p', null, '⚠️ ' + error),
        React.createElement(
          'button',
          { onClick: loadHubData, className: 'btn-retry' },
          'Retry'
        )
      ),
    React.createElement(
      'section',
      { className: 'hub-features-section' },
      React.createElement('h2', null, 'Hub Features'),
      React.createElement(
        'div',
        { className: 'hub-features-grid' },
        featureCards.map(function (feature) {
          return React.createElement(
            'div',
            {
              key: feature.id,
              className: 'hub-feature-card',
              onClick: function () {
                handleFeatureClick(feature);
              },
              style: { backgroundColor: feature.color }
            },
            React.createElement(
              'div',
              { className: 'feature-card-content' },
              React.createElement('div', { className: 'feature-icon' }, feature.icon),
              React.createElement('h3', null, feature.title),
              React.createElement('p', null, feature.description)
            ),
            React.createElement('div', { className: 'feature-arrow' }, '→')
          );
        })
      )
    ),
    React.createElement(
      'section',
      { className: 'hub-stats' },
      React.createElement('h2', null, 'Event Overview'),
      React.createElement(
        'div',
        { className: 'stats-grid' },
        React.createElement(
          'div',
          { className: 'stat-card' },
          React.createElement('span', { className: 'stat-icon' }, '📋'),
          React.createElement('h4', null, 'Total Features'),
          React.createElement('p', { className: 'stat-value' }, String(featureCards.length))
        ),
        React.createElement(
          'div',
          { className: 'stat-card' },
          React.createElement('span', { className: 'stat-icon' }, '📅'),
          React.createElement('h4', null, 'Event'),
          React.createElement('p', { className: 'stat-value' }, (hubData && hubData.name) || 'AI Expo')
        ),
        React.createElement(
          'div',
          { className: 'stat-card' },
          React.createElement('span', { className: 'stat-icon' }, '📍'),
          React.createElement('h4', null, 'Location'),
          React.createElement('p', { className: 'stat-value' }, (hubData && hubData.location) || 'Online')
        ),
        React.createElement(
          'div',
          { className: 'stat-card' },
          React.createElement('span', { className: 'stat-icon' }, '📞'),
          React.createElement('h4', null, 'Support'),
          React.createElement('p', { className: 'stat-value' }, '24/7')
        )
      )
    )
  );
}