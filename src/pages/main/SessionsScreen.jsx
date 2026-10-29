import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Bookmark, MapPin, Play, CalendarPlus,
  MessageSquare, Bell
} from 'lucide-react';
import apiClient from '../../config/apiClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DATES = [
  { id: 'd1', label: '15th Oct', sub: 'Day 1' },
  { id: 'd2', label: '16th Oct', sub: 'Day 2' },
  { id: 'd3', label: '17th Oct', sub: 'Day 3' },
];

export default function SessionsScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'my' | 'ai'
  const [activeDate, setActiveDate] = useState('d1');
  const [isLiveOnly, setIsLiveOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  useEffect(() => {
    let cancelled = false;
    const fetchSessions = async () => {
      try {
        const res = await apiClient.get('/sessions', { params: { limit: 100 } });
        if (cancelled) return;
        const data = res?.data?.data ?? res?.data ?? [];
        setSessions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load sessions", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSessions();
    return () => { cancelled = true; };
  }, []);

  const toggleBookmark = (e, id) => {
    e.stopPropagation();
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Mock filtering based on UI state
  const displayedSessions = useMemo(() => {
    let filtered = sessions;
    if (activeTab === 'my') filtered = filtered.filter(s => bookmarkedIds.has(s.id));
    if (isLiveOnly) filtered = filtered.filter(s => s.status === 'live');
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s => (s.title || '').toLowerCase().includes(q));
    }
    return filtered;
  }, [sessions, activeTab, isLiveOnly, searchQuery, bookmarkedIds]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><LoadingSpinner /></div>;
  }

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto pb-24 font-sans select-none">
      
      {/* Top Header Navigation */}
      <div className="px-5 py-4 flex items-center justify-between bg-white sticky top-0 z-40">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sessions</h1>
        <div className="flex items-center gap-4 text-slate-700">
          <button><MessageSquare size={22} /></button>
          <button><Bell size={22} /></button>
        </div>
      </div>

      {/* Top Tabs */}
      <div className="flex px-5 gap-6 border-b border-slate-100">
        <button 
          onClick={() => setActiveTab('all')}
          className={`pb-3 text-[15px] font-bold transition-colors relative ${activeTab === 'all' ? 'text-[#1d1fb8]' : 'text-slate-400'}`}
        >
          All Sessions
          {activeTab === 'all' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#1d1fb8] rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('my')}
          className={`pb-3 text-[15px] font-bold transition-colors relative ${activeTab === 'my' ? 'text-slate-800' : 'text-slate-400'}`}
        >
          My Sessions
          {activeTab === 'my' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-slate-800 rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          className={`pb-3 text-[15px] font-bold transition-colors relative ${activeTab === 'ai' ? 'text-purple-600' : 'text-purple-400'}`}
        >
          AI Recom...
          {activeTab === 'ai' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-purple-600 rounded-t-full" />}
        </button>
      </div>

      {/* Date Carousel */}
      <div className="flex gap-3 px-5 py-5 overflow-x-auto no-scrollbar">
        {DATES.map(date => (
          <button
            key={date.id}
            onClick={() => setActiveDate(date.id)}
            className={`flex flex-col items-start min-w-[100px] p-3 rounded-2xl border transition-all ${
              activeDate === date.id 
                ? 'bg-[#0005B2] border-[#0005B2] text-white shadow-md' 
                : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <span className={`text-[13px] font-bold ${activeDate === date.id ? 'text-white' : 'text-slate-900'}`}>
              {date.label}
            </span>
            <span className={`text-[11px] ${activeDate === date.id ? 'text-white/80' : 'text-slate-500'}`}>
              {date.sub}
            </span>
          </button>
        ))}
      </div>

      {/* Live Toggle & Filter Controls */}
      <div className="px-5 flex items-center justify-between mb-6">
        <button 
          onClick={() => setIsLiveOnly(!isLiveOnly)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white shadow-sm"
        >
          <div className={`w-2 h-2 rounded-full ${isLiveOnly ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
          <span className="text-xs font-semibold text-slate-600">Live Sessions</span>
        </button>
        
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100">
            <Search size={16} />
          </button>
          <button className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 relative">
            <Filter size={16} />
            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
          </button>
        </div>
      </div>

      {/* Session Cards Grid */}
      <div className="px-5 space-y-4">
        
        {/* Card 1: Foundational Track (Pink theme) */}
        <div 
          onClick={() => navigate('/sessions/1')}
          className="bg-white rounded-2xl p-4 border-[1.5px] border-pink-500 shadow-sm relative active:scale-[0.99] transition-transform"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-1.5">
              <span className="bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                Foundational Track
              </span>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">+2</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> Live and Streaming
              </span>
              <Bookmark size={18} className="text-slate-400" />
            </div>
          </div>
          
          <p className="text-[11px] text-slate-500 mb-1 font-medium">15th Oct, 2024 | 10:00 AM - 05:00 PM</p>
          <h3 className="text-[16px] font-bold text-slate-900 leading-tight mb-2 pr-4 line-clamp-2">
            How to book meetings fully automated with the help of cold...
          </h3>
          <p className="text-[11px] text-slate-500 flex items-center gap-1 mb-4">
            <MapPin size={12} /> Primary Hall (Meeting room 1)
          </p>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
            <div className="flex items-center -space-x-2">
              <img src="https://i.pravatar.cc/100?img=11" className="w-7 h-7 rounded-full border-2 border-white object-cover" alt="" />
              <img src="https://i.pravatar.cc/100?img=5" className="w-7 h-7 rounded-full border-2 border-white object-cover" alt="" />
              <img src="https://i.pravatar.cc/100?img=3" className="w-7 h-7 rounded-full border-2 border-white object-cover" alt="" />
              <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600 z-10">+3</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                <Play size={12} className="fill-slate-700" /> Watch
              </button>
              <button className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                <CalendarPlus size={14} /> Add
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: General (Blue theme) */}
        <div 
          onClick={() => navigate('/sessions/2')}
          className="bg-white rounded-2xl p-4 border-[1.5px] border-blue-600 shadow-sm relative active:scale-[0.99] transition-transform"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
              General
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Upcoming
              </span>
              <Bookmark size={18} className="fill-amber-400 text-amber-400" />
            </div>
          </div>
          
          <p className="text-[11px] text-slate-500 mb-1 font-medium">15th Oct, 2024 | 10:00 AM - 05:00 PM</p>
          <h3 className="text-[16px] font-bold text-slate-900 leading-tight mb-2 pr-4 line-clamp-2">
            How to book meetings fully automated with the help of cold...
          </h3>
          <p className="text-[11px] text-slate-500 flex items-center gap-1 mb-4">
            <MapPin size={12} /> Primary Hall (Meeting room 1)
          </p>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
              <User size={12} />
            </div>
            <button className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
              <CalendarPlus size={14} /> Add
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}