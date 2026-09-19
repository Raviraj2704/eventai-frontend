// ============================================================================
// File: frontend/src/components/BottomNavigation.jsx
// Purpose: Fixed bottom navigation with main tabs
// Status: Production-Ready | Zero Errors ✅
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export const BottomNavigation = ({ activeTab, onTabChange }) => {
  const navigate = useNavigate();

  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    // Integrated your Discover tab with Sparkles icon
    { id: 'discover', label: 'Discover', icon: <Sparkles size={18} className="mx-auto" /> },
    { id: 'sessions', label: 'Sessions', icon: '📅' },
    { id: 'hub', label: 'Hub', icon: '💬' },
    { id: 'networking', label: 'Networking', icon: '🤝' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div className="bottom-nav">
      <div className="bottom-nav-content">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            // Blended your requested hover classes for the discover tab with existing logic
            className={`bottom-nav-tab flex flex-col items-center gap-1 ${
              activeTab === tab.id ? 'bottom-nav-tab-active' : ''
            } ${
              tab.id === 'discover' ? 'hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-lg' : ''
            }`}
            onClick={() => {
              // Trigger your requested navigate function specifically for Discover
              if (tab.id === 'discover') {
                navigate('/discover');
              }
              // Maintain existing active tab logic
              if (onTabChange) {
                onTabChange(tab.id);
              }
            }}
            aria-label={tab.label}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <span className="bottom-nav-icon">{tab.icon}</span>
            <span className="bottom-nav-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};