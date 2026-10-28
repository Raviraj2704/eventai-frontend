import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Bookmark, MapPin, ChevronLeft, Plus } from 'lucide-react';
import apiClient from '../../config/apiClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const initialsOf = (name) =>
  (name || 'A').split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'A';

export default function PartnersScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState([]);
  const [me, setMe] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track which partner cards are bookmarked (Toggled)
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [meRes, partnersRes] = await Promise.all([
          apiClient.get('/users/me'),
          apiClient.get('/partners', { params: { limit: 100 } }),
        ]);
        if (cancelled) return;
        setMe(meRes?.data?.data ?? meRes?.data ?? null);
        const data = partnersRes?.data?.data ?? partnersRes?.data ?? [];
        setPartners(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load partners", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const toggleBookmark = (e, id) => {
    e.stopPropagation(); // Prevent card click
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isOrganizer = Boolean(me?.is_admin) || me?.role === 'admin' || me?.email === 'ravirajapanthulu@gmail.com';

  const filteredPartners = useMemo(() => {
    if (!searchQuery) return partners;
    const lowerQ = searchQuery.toLowerCase();
    return partners.filter(p => 
      (p.name || p.company_name || '').toLowerCase().includes(lowerQ) ||
      (p.tier || '').toLowerCase().includes(lowerQ)
    );
  }, [partners, searchQuery]);

  const featured = filteredPartners.filter(p => p.is_featured || p.tier === 'Gold');
  const regular = filteredPartners.filter(p => !p.is_featured && p.tier !== 'Gold');

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><LoadingSpinner /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 max-w-md mx-auto relative">
      {/* Top Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-700">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Partners</h1>
        </div>
        {isOrganizer && (
          <button onClick={() => navigate('/partners/new')} className="bg-[#1d1fb8] text-white px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1">
            <Plus size={16} /> Add Partner
          </button>
        )}
      </div>

      {/* Featured Partners Carousel */}
      {featured.length > 0 && (
        <div className="mt-4">
          <h2 className="px-4 text-sm font-bold text-slate-900 mb-3">Featured Partners</h2>
          <div className="flex overflow-x-auto gap-4 px-4 pb-4 no-scrollbar">
            {featured.map(p => (
              <div 
                key={p.id} 
                onClick={() => navigate(`/partners/${p.id}`)}
                className="min-w-[240px] bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col relative"
              >
                <button 
                  onClick={(e) => toggleBookmark(e, p.id)} 
                  className="absolute top-3 right-3 text-slate-300 hover:text-[#1d1fb8] transition-colors"
                >
                  <Bookmark size={20} className={bookmarkedIds.has(p.id) ? "fill-[#1d1fb8] text-[#1d1fb8]" : ""} />
                </button>
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[#1d1fb8] mb-3 overflow-hidden">
                  {p.logo_url ? <img src={p.logo_url} alt="" className="w-full h-full object-cover" /> : initialsOf(p.name || p.company_name)}
                </div>
                <h3 className="font-bold text-slate-900 text-[15px] leading-tight mb-1">{p.name || p.company_name}</h3>
                {(p.booth_info || p.booth_no) && (
                  <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12} /> {p.booth_info || `Booth ${p.booth_no}`}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="px-4 mt-2 mb-6">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search here" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#1d1fb8]"
            />
          </div>
          <button className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 shadow-sm">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* List Header: Total Count & AI Matches */}
      <div className="px-4 flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 text-sm">Total Count ({filteredPartners.length})</h3>
        <button onClick={() => navigate('/ai-matches')} className="bg-[#E9E4FF] text-[#5B34EA] px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
          ✨ AI Matches
        </button>
      </div>

      {/* 2-Column Grid Layout */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {regular.map(p => (
          <div 
            key={p.id} 
            onClick={() => navigate(`/partners/${p.id}`)}
            className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col relative active:scale-[0.98] transition-transform"
          >
            <button 
              onClick={(e) => toggleBookmark(e, p.id)} 
              className="absolute top-3 right-3 text-slate-300 hover:text-[#1d1fb8] transition-colors"
            >
              <Bookmark size={18} className={bookmarkedIds.has(p.id) ? "fill-[#1d1fb8] text-[#1d1fb8]" : ""} />
            </button>
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-[#1d1fb8] mb-3 overflow-hidden">
              {p.logo_url ? <img src={p.logo_url} alt="" className="w-full h-full object-cover" /> : initialsOf(p.name || p.company_name)}
            </div>
            <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1">{p.name || p.company_name}</h3>
            {(p.booth_info || p.booth_no) && (
              <p className="text-[11px] text-slate-500 flex items-center gap-1 line-clamp-1"><MapPin size={10} /> {p.booth_info || `Booth ${p.booth_no}`}</p>
            )}
          </div>
        ))}
      </div>

      {filteredPartners.length === 0 && (
        <div className="px-4 text-center mt-10">
          <p className="text-slate-500">No partners found.</p>
        </div>
      )}
    </div>
  );
}