// ============================================================================
// BottomNavigation.jsx - FIXED VERSION
// ============================================================================
import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const navTabs = useMemo(() => [
    { id: 1, label: 'Home', icon: '🏠', path: '/home', description: 'Home' },
    { id: 2, label: 'Hub', icon: '⚡', path: '/hub', description: 'Features' },
    { id: 3, label: 'Network', icon: '👥', path: '/networking', description: 'Networking' },
    { id: 4, label: 'Engage', icon: '🎯', path: '/activity-hub', description: 'Engagement' },
    { id: 5, label: 'Profile', icon: '👤', path: '/profile', description: 'Profile' }
  ], []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getActiveTab = useMemo(() => {
    return (path) => {
      if (location.pathname === path) return true;
      if (path === '/hub' && location.pathname.startsWith('/hub')) return true;
      if (path === '/networking' && location.pathname.includes('networking')) return true;
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

  const handleTabClick = (path) => {
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  // ============================================================================
  // Render - Mobile Bottom Navigation (LARGE & TOUCH-FRIENDLY)
  // ============================================================================
  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] pb-safe">
        <div className="flex justify-around items-center h-[72px] px-2">
          {navTabs.map(tab => {
            const isActive = getActiveTab(tab.path);
            return (
              <button
                key={tab.id}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                }`}
                onClick={() => handleTabClick(tab.path)}
                title={tab.description}
              >
                <span className={`text-2xl transition-transform ${isActive ? 'scale-110 drop-shadow-sm' : ''}`}>
                  {tab.icon}
                </span>
                <span className={`text-[11px] tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  // ============================================================================
  // Render - Desktop Top Navigation (Fallback)
  // ============================================================================
  return (
    <nav className="hidden md:block sticky top-0 bg-white border-b border-gray-200 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="font-bold text-xl tracking-tight text-gray-900">EventAI</span>
        </div>
        <div className="flex gap-2">
          {navTabs.map(tab => {
            const isActive = getActiveTab(tab.path);
            return (
              <button
                key={tab.id}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-100 font-medium'
                }`}
                onClick={() => handleTabClick(tab.path)}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}