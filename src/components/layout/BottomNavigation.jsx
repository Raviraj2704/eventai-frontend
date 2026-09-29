// ============================================================================
// BottomNavigation.jsx - FIXED VERSION
// ============================================================================
// Purpose: Mobile bottom nav with app name, desktop top nav
// Status: No infinite loops, no duplicates ✅
// Last Updated: Sep 29, 2026

import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // ============================================================================
  // Navigation Tabs - MEMOIZED to prevent recreation on every render
  // ============================================================================
  const navTabs = useMemo(() => [
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
  ], []);

  // ============================================================================
  // Handle Window Resize - ONLY update on actual resize, not on every render
  // ============================================================================
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array - runs only once on mount

  // ============================================================================
  // Check Active Tab - MEMOIZED to prevent recalculation
  // ============================================================================
  const getActiveTab = useMemo(() => {
    return (path) => {
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
  }, [location.pathname]);

  // ============================================================================
  // Handle Tab Click - NO unnecessary re-renders
  // ============================================================================
  const handleTabClick = (path) => {
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  // ============================================================================
  // Render - Mobile Bottom Navigation WITH APP NAME
  // ============================================================================
  if (isMobile) {
    return (
      <>
        {/* Mobile Header with App Name */}
        <div className="mobile-header">
          <div className="mobile-header-content">
            <span className="mobile-header-icon">⚡</span>
            <span className="mobile-header-title">EventAI</span>
          </div>
          <div className="mobile-header-actions">
            <button className="mobile-header-btn" title="Search">🔍</button>
            <button className="mobile-header-btn" title="Notifications">🔔</button>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
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
      </>
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
          <button className="nav-search" title="Search">🔍</button>
          <button className="nav-notifications" title="Notifications">🔔</button>
          <button className="nav-profile" title="Profile">👤</button>
        </div>
      </div>
    </nav>
  );
}