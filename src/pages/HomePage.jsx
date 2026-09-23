import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../services/api';

export const HomePage = async () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState('home');
  
  // Real API data
  const [user, setUser] = useState(null);
  const [speakers, setSpeakers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carousel slides from announcements or fallback
  const [eventData, setEventData] = useState(null);
  const carouselSlides = announcements.length > 0 
    ? announcements.map((ann, idx) => ({
        id: idx,
        title: ann.title || "Transformation. Scale. Impact.",
        subtitle: ann.content?.substring(0, 50) || "Opening keynote at 10 AM.",
        bg: idx % 2 === 0 ? "from-blue-600 to-purple-600" : "from-blue-900 to-slate-900"
      }))
    : [
        { id: 1, title: "Transformation. Scale. Impact.", subtitle: "Opening keynote at 10 AM.", bg: "from-blue-600 to-purple-600" },
        { id: 2, title: "Visit the Innovation Hub", subtitle: "Discover 50+ startup booths.", bg: "from-blue-900 to-slate-900" }
      ];

  // Load real data from API
  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current user
      const userData = await apiGet('/api/v1/users/me');
      setUser(userData);

      // Fetch speakers
      const speakersData = await apiGet('/api/v1/speakers');
      setSpeakers(Array.isArray(speakersData) ? speakersData.slice(0, 4) : []);

      // Fetch announcements for carousel
      const announcementsData = await apiGet('/api/v1/announcements');
      setAnnouncements(Array.isArray(announcementsData) ? announcementsData : []);

      // Fetch event data
      const eventData = await apiGet('/api/v1/events/1');
      setEventData(eventData);
    } catch (err) {
      console.error('Failed to load home data:', err);
      setError('Unable to load page data');
      // Don't throw - let app continue with fallback data
    } finally {
      setLoading(false);
    }
  };

  // Carousel timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === carouselSlides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselSlides.length]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'sessions') navigate('/sessions');
    if (tab === 'hub') navigate('/hub');
    if (tab === 'networking') navigate('/networking');
    if (tab === 'profile') navigate('/profile');
  };

  const handleQuickAction = (action) => {
    console.log('Quick action:', action);
    switch (action) {
      case 'profile':
        navigate('/profile');
        break;
      case 'badge':
        navigate('/hub'); 
        break;
      case 'meetings':
        navigate('/hub'); 
        break;
      case 'favorites':
        navigate('/hub'); 
        break;
      default:
        break;
      case  'sessions':
        navigate('/sessions');
        break;
    }
  };

  const handlePicbotClick = () => {
    navigate('/picbot');
  };

  return (
    <div className="bg-[#0f172a] h-screen overflow-y-auto text-white font-sans pb-32 relative">
      
      {/* TOP BAR */}
      <div className="sticky top-0 z-40 bg-[#0f172a]/90 backdrop-blur-md px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="font-bold text-xl tracking-wide flex items-center gap-2">
          <span className="text-blue-400">❖</span> EventAI
        </div>
        <div className="flex gap-4">
          <button onClick={handlePicbotClick} className="text-xl relative hover:scale-110 transition-transform">
            🤖 <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full"></span>
          </button>
          <button className="text-xl relative hover:scale-110 transition-transform">
            🔔 <span className="absolute -top-1 -right-1 bg-orange-400 w-2 h-2 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Custom Expo Header */}
      <div className="px-5 pt-4 pb-2">
        <h1 className="text-2xl font-bold text-orange-400 mb-1">NextGen AI Expo 2026</h1>
        <p className="text-sm font-semibold text-white">Innovation Hub</p>
        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
          📍 HITECH City, Hyderabad
        </p>
      </div>

      {error && (
        <div className="mx-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="p-4 space-y-6">
        
        {/* HERO CAROUSEL */}
        {!loading && carouselSlides.length > 0 && (
          <div className={`w-full h-40 rounded-2xl bg-gradient-to-r ${carouselSlides[currentSlide].bg} p-6 flex flex-col justify-end shadow-lg transition-all duration-500 relative overflow-hidden`}>
            <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Featured</div>
            <h2 className="text-2xl font-bold mb-1 z-10">{carouselSlides[currentSlide].title}</h2>
            <p className="text-sm text-white/80 z-10">{carouselSlides[currentSlide].subtitle}</p>
            
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-10">
              {carouselSlides.map((_, index) => (
                <div key={index} className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === index ? 'w-6 bg-white' : 'w-2 bg-white/40'}`} />
              ))}
            </div>
          </div>
        )}

        {/* QUICK ACTIONS GRID */}
        <div>
          <h3 className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleTabChange('sessions')} className="bg-[#1e293b] border border-blue-900/30 p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[#334155] transition-colors shadow-sm">
              <span className="text-2xl">📅</span>
              <span className="text-sm font-medium">Schedule</span>
            </button>
            <button onClick={() => handleTabChange('networking')} className="bg-[#1e293b] border border-blue-900/30 p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[#334155] transition-colors shadow-sm">
              <span className="text-2xl">🤝</span>
              <span className="text-sm font-medium">Connect</span>
            </button>
            <button onClick={() => navigate('/map')} className="bg-[#1e293b] border border-blue-900/30 p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[#334155] transition-colors shadow-sm">
              <span className="text-2xl">🗺️</span>
              <span className="text-sm font-medium">Map</span>
            </button>
            <button onClick={() => handleTabChange('hub')} className="bg-[#1e293b] border border-blue-900/30 p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[#334155] transition-colors shadow-sm">
              <span className="text-2xl">📸</span>
              <span className="text-sm font-medium">Gallery</span>
            </button>
          </div>
        </div>

        {/* FEATURED SPEAKERS */}
        <div>
          <div className="flex justify-between items-end mb-3">
            <h3 className="text-xs font-bold text-blue-200 uppercase tracking-wider">Featured Speakers</h3>
            <span onClick={() => navigate('/speakers')} className="text-xs text-blue-400 font-semibold cursor-pointer hover:text-blue-300">View All</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
            {loading ? (
              <p className="text-sm text-gray-400">Loading speakers...</p>
            ) : speakers.length === 0 ? (
              <p className="text-sm text-gray-400">No speakers available yet</p>
            ) : (
              speakers.map((speaker) => (
                <div key={speaker.id} className="snap-start shrink-0 w-24 flex flex-col items-center text-center">
                  {speaker.avatar ? (
                    <img src={speaker.avatar} alt={speaker.name} className="w-16 h-16 bg-[#1e293b] rounded-full mb-2 border-2 border-blue-900/50 object-cover shadow-md" />
                  ) : (
                    <div className="w-16 h-16 bg-[#1e293b] rounded-full mb-2 border-2 border-blue-900/50 flex items-center justify-center text-xl shadow-md">👤</div>
                  )}
                  <h4 className="font-bold text-sm">{speaker.name || 'Speaker'}</h4>
                  <p className="text-[10px] text-gray-400">{speaker.title || 'Professional'}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM NAVIGATION */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-lg border-t border-[#1e293b] px-6 py-4 flex justify-between items-center z-50">
        <button onClick={() => handleTabChange('home')} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-blue-500' : 'text-slate-400 hover:text-white'} hover:scale-110 transition-all`}>
          <span className="text-xl mb-1">🏠</span><span className="text-[10px] font-bold">Home</span>
        </button>
        <button onClick={() => handleTabChange('sessions')} className={`flex flex-col items-center ${activeTab === 'sessions' ? 'text-blue-500' : 'text-slate-400 hover:text-white'} hover:scale-110 transition-all`}>
          <span className="text-xl mb-1">📅</span><span className="text-[10px] font-bold">Agenda</span>
        </button>
        <button onClick={() => handleTabChange('hub')} className={`flex flex-col items-center ${activeTab === 'hub' ? 'text-blue-500' : 'text-slate-400 hover:text-white'} transition-all relative group`}>
          <div className="absolute -top-8 bg-teal-500 w-12 h-12 rounded-full flex items-center justify-center border-4 border-[#0f172a] shadow-lg text-xl text-white group-hover:scale-110 transition-transform">📸</div>
          <span className="text-[10px] font-bold mt-5">Hub</span>
        </button>
        <button onClick={() => handleTabChange('networking')} className={`flex flex-col items-center ${activeTab === 'networking' ? 'text-blue-500' : 'text-slate-400 hover:text-white'} hover:scale-110 transition-all`}>
          <span className="text-xl mb-1">🤝</span><span className="text-[10px] font-bold">Network</span>
        </button>
        <button onClick={() => handleTabChange('profile')} className={`flex flex-col items-center ${activeTab === 'profile' ? 'text-blue-500' : 'text-slate-400 hover:text-white'} hover:scale-110 transition-all`}>
          <span className="text-xl mb-1">👤</span><span className="text-[10px] font-bold">Profile</span>
        </button>
      </div>

    </div>
  );
};

export default HomePage;