// ============================================================================
// BottomNavigation.jsx - Responsive Navigation Component
// ============================================================================
// Purpose: Bottom nav on mobile, top nav on desktop
// 5 Tabs: Home, Hub, Networking, Engage, Profile
// Status: Production-Ready ✅
// Last Updated: Sep 24, 2026

import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // ============================================================================
  // Navigation Tabs Configuration
  // ============================================================================
  const navTabs = [
    {
      id: 1,
      label: 'Home',
      icon: '🏠',
      path: '/home',
      description: 'Home'
    },
    {
      id: 2,
      label: 'Hub',
      icon: '⚡',
      path: '/hub',
      description: 'Features'
    },
    {
      id: 3,
      label: 'Network',
      icon: '👥',
      path: '/networking',
      description: 'Networking'
    },
    {
      id: 4,
      label: 'Engage',
      icon: '🎯',
      path: '/activity-hub',
      description: 'Engagement'
    },
    {
      id: 5,
      label: 'Profile',
      icon: '👤',
      path: '/profile',
      description: 'Profile'
    }
  ];

  // ============================================================================
  // Handle Window Resize for Responsive Design
  // ============================================================================
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ============================================================================
  // Check Active Tab
  // ============================================================================
  const getActiveTab = (path) => {
    // Exact match
    if (location.pathname === path) return true;
    
    // For pages under hub
    if (path === '/hub' && location.pathname.startsWith('/hub')) return true;
    
    // For networking-related pages
    if (path === '/networking' && location.pathname.includes('networking')) return true;
    
    // For engagement/activity pages
    if (path === '/activity-hub' && 
        (location.pathname.includes('activity') || 
         location.pathname.includes('engagement') ||
         location.pathname.includes('social') ||
         location.pathname.includes('ai-matches'))) {
      return true;
    }

    return false;
  };

  // ============================================================================
  // Handle Tab Click
  // ============================================================================
  const handleTabClick = (path) => {
    navigate(path);
  };

  // ============================================================================
  // Render - Mobile Bottom Navigation
  // ============================================================================
  if (isMobile) {
    return (
      <nav className="bottom-navigation mobile">
        <div className="nav-container">
          {navTabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${getActiveTab(tab.path) ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.path)}
              title={tab.description}
              aria-label={tab.description}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    );
  }

  // ============================================================================
  // Render - Desktop Top Navigation
  // ============================================================================
  return (
    <nav className="top-navigation desktop">
      <div className="nav-container">
        <div className="nav-brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-name">EventAI</span>
        </div>

        <div className="nav-tabs">
          {navTabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${getActiveTab(tab.path) ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.path)}
              title={tab.description}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="nav-actions">
          <button className="nav-search" title="Search">
            🔍
          </button>
          <button className="nav-notifications" title="Notifications">
            🔔
          </button>
          <button className="nav-profile" title="Profile">
            👤
          </button>
        </div>
      </div>
    </nav>
  );
}