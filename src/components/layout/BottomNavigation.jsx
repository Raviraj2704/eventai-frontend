// ============================================================================
// BottomNavigation.jsx - MERGED VERSION (video style + existing logic)
// ============================================================================
import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, CalendarDays, LayoutGrid, Users, User } from 'lucide-react';

export default function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const navTabs = useMemo(() => [
    { id: 1, label: 'Home', icon: Home, path: '/home', description: 'Home' },
    { id: 2, label: 'Sessions', icon: CalendarDays, path: '/sessions', description: 'Sessions' },
    { id: 3, label: 'Hub', icon: LayoutGrid, path: '/hub', description: 'Features' },
    { id: 4, label: 'Networking', icon: Users, path: '/networking', description: 'Networking' },
    { id: 5, label: 'Profile', icon: User, path: '/profile', description: 'Profile' }
  ], []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getActiveTab = useMemo(() => {
    return (path) => {
      if (location.pathname === path) return true;
      if (path === '/sessions' && location.pathname.startsWith('/sessions')) return true;
      if (path === '/hub' && location.pathname.startsWith('/hub')) return true;
      if (path === '/networking' && location.pathname.includes('networking')) return true;
      return false;
    };
  }, [location.pathname]);

  const handleTabClick = (path) => {
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  // ============================================================================
  // Render - Mobile Bottom Navigation (video style)
  // ============================================================================
  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 bg-white border-t border-gray-200 pb-safe">
        <div className="grid grid-cols-5 h-16">
          {navTabs.map(tab => {
            const isActive = getActiveTab(tab.path);
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-[#1d1fb8]' : 'text-gray-400 hover:text-gray-700'
                }`}
                onClick={() => handleTabClick(tab.path)}
                title={tab.description}
              >
                {isActive && <span className="absolute top-0 h-0.5 w-10 bg-[#1d1fb8] rounded-b" />}
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{tab.label}</span>
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
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-100 font-medium'
                }`}
                onClick={() => handleTabClick(tab.path)}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}