import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Play, CalendarPlus, CalendarCheck, MessageSquare } from 'lucide-react';
import apiClient from '../../config/apiClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const TABS = ['All Sessions', 'My Sessions', 'AI Recommended'];
const DATES = [
  { label: '15th Oct', sub: 'Day 1', date: '2024-10-15' },
  { label: '16th Oct', sub: 'Day 2', date: '2024-10-16' },
  { label: '17th Oct', sub: 'Day 5', date: '2024-10-17' }
];

export default function SessionsScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  
  const [activeTab, setActiveTab] = useState('All Sessions');
  const [selectedDate, setSelectedDate] = useState(DATES[0].date);
  const [isLiveOnly, setIsLiveOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track personal bookmarks locally for the UI (until backend bookmark sync is wired)
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      // Limit matches backend le=100 cap
      const response = await apiClient.get('/sessions?limit=100');
      const data = response?.data?.data || response?.data || [];
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = (e, id) => {
    e.stopPropagation();
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filter Logic
  const filteredSessions = useMemo(() => {
    let result = sessions;

    // Tab Filter
    if (activeTab === 'My Sessions') {
      result = result.filter(s => bookmarkedIds.has(s.id));
    } else if (activeTab === 'AI Recommended') {
      // Mock logic: Show sessions with 'AI' or 'Tech' in category/title
      result = result.filter(s => 
        (s.title || '').toLowerCase().includes('ai') || 
        (s.category || '').toLowerCase().includes('tech')
      );
    }

    // Live Filter
    if (isLiveOnly) {
      result = result.filter(s => s.status === 'live' || s.is_live);
    }

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        (s.title || '').toLowerCase().includes(q) || 
        (s.speaker_name || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [sessions, activeTab, isLiveOnly, searchQuery, bookmarkedIds]);

  const formatTimeRange = (start, end) => {
    if (!start) return '10:00 AM - 05:00 PM'; // Mock default from prototype
    const fmt = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${fmt(start)} - ${fmt(end || start)}`;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><LoadingSpinner /></div>;
  }

  return (
    <div className="min-h-screen bg-white pb-24 max-w-md mx-auto">
      
      {/* Header */}
      <div className="px-4 pt-6 pb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Sessions</h1>
        <div className="flex gap-4 text-slate-700">
          <MessageSquare size={22} className="cursor-pointer" />
          <div className="relative">
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="cursor-pointer">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 flex items-center justify-between border-b border-slate-200 mt-2">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold transition-colors relative ${
              activeTab === tab ? 'text-[#1d1fb8]' : 'text-slate-500'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1d1fb8] rounded-t-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Date Pills */}
      <div className="px-4 py-4 flex gap-3 overflow-x-auto no-scrollbar">
        {DATES.map(date => {
          const isActive = selectedDate === date.date;
          return (
            <button
              key={date.date}
              onClick={() => setSelectedDate(date.date)}
              className={`flex flex-col items-center justify-center min-w-[85px] py-2 rounded-2xl border transition-all ${
                isActive 
                  ? 'bg-[#0010A3] border-[#0010A3] text-white shadow-md' 
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-900'}`}>{date.label}</span>
              <span className={`text-xs ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>{date.sub}</span>
            </button>
          );
        })}
      </div>

      {/* Controls: Live Toggle & Search/Filter */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <button 
          onClick={() => setIsLiveOnly(!isLiveOnly)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-colors ${
            isLiveOnly ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-700'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${isLiveOnly ? 'bg-red-500' : 'bg-slate-400'}`}></div>
          Live Sessions
        </button>

        <div className="flex gap-2">
          <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 bg-white">
            <Search size={18} />
          </div>
          <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 bg-white relative">
            <Filter size={18} />
            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Session Cards */}
      <div className="px-4 space-y-4">
        {filteredSessions.map((session, i) => {
          const isBookmarked = bookmarkedIds.has(session.id);
          const isLive = session.status === 'live' || session.is_live;
          
          // Mimic the UI gradients based on category/index
          const track = session.category || 'General';
          const isMagenta = track.toLowerCase().includes('foundational') || i % 2 === 0;
          
          const cardClass = isMagenta 
            ? 'border-[#D91B6B] shadow-[0_4px_20px_rgba(217,27,107,0.08)]' 
            : 'border-[#1d1fb8] shadow-[0_4px_20px_rgba(29,31,184,0.08)]';
            
          const badgeClass = isMagenta 
            ? 'bg-[#D91B6B] text-white' 
            : 'bg-[#1d1fb8] text-white';

          return (
            <div 
              key={session.id}
              onClick={() => navigate(`/sessions/${session.id}`)}
              className={`bg-white rounded-3xl p-4 border-[1.5px] relative cursor-pointer active:scale-[0.98] transition-transform ${cardClass}`}
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgeClass}`}>
                    {track}
                  </span>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 rounded-full px-2 py-1">
                    +2
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  {isLive ? (
                    <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                      Live and Streaming
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                      Upcoming
                    </span>
                  )}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-800">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
              </div>

              {/* Date & Time */}
              <p className="text-xs font-medium text-slate-500 mb-2">
                15th Oct, 2024 | {formatTimeRange(session.start_time, session.end_time)}
              </p>

              {/* Title */}
              <h3 className="text-lg font-bold text-slate-900 leading-snug mb-3 pr-4">
                {session.title || 'How to book meetings fully automated with the help of cold...'}
              </h3>

              {/* Location */}
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-5">
                <MapPin size={14} />
                <span>{session.location || 'Primary Hall (Meeting room 1)'}</span>
              </div>

              {/* Footer: Avatars & Buttons */}
              <div className="flex items-center justify-between mt-auto">
                
                {/* Avatars Stack */}
                <div className="flex items-center -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden"><img src="https://i.pravatar.cc/100?img=11" alt="Speaker" /></div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-300 overflow-hidden"><img src="https://i.pravatar.cc/100?img=5" alt="Speaker" /></div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-400 overflow-hidden"><img src="https://i.pravatar.cc/100?img=8" alt="Speaker" /></div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-600 z-10">+3</div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {isLive && (
                    <button className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm font-bold text-slate-800 transition-colors">
                      <Play size={14} className="fill-slate-800" /> Watch
                    </button>
                  )}
                  <button 
                    onClick={(e) => toggleBookmark(e, session.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm font-bold text-slate-800 transition-colors"
                  >
                    {isBookmarked ? (
                      <><CalendarCheck size={16} className="text-[#1d1fb8]" /> Added</>
                    ) : (
                      <><CalendarPlus size={16} /> Add</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSessions.length === 0 && (
        <div className="px-4 text-center mt-12">
          <p className="text-slate-500 font-medium">No sessions found for this criteria.</p>
        </div>
      )}
    </div>
  );
}