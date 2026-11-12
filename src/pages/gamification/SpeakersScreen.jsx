// ============================================================================
// Speakers Screen - ADOBE XD EXACT MATCH
// File: src/pages/gamification/SpeakersScreen.jsx
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search, Bookmark, MessageSquare, Sparkles, Plus, ChevronLeft, 
  Share2, AlertCircle, Facebook, Twitter, Linkedin, Play, CalendarPlus, X, Send, Filter
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const FILTERS = [
  { value: 'all', label: 'All speakers' },
  { value: 'following', label: 'Following' },
  { value: 'bookmarked', label: 'Bookmarked' },
];

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.detail || error?.data?.detail || error?.message || fallback;

const getFullName = (s) =>
  s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Speaker';

const getInitials = (s) =>
  getFullName(s).split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'S';

const Avatar = ({ speaker, size = 'w-12 h-12', textSize = 'text-sm' }) =>
  speaker.avatar_url ? (
    <img src={speaker.avatar_url} alt={getFullName(speaker)} className={`${size} rounded-full object-cover shrink-0 shadow-sm`} />
  ) : (
    <div className={`${size} rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 font-bold text-slate-500 ${textSize} shadow-sm`}>
      {getInitials(speaker)}
    </div>
  );

const SpeakersScreen = () => {
  const navigate = useNavigate();

  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState(null);
  const [followingIds, setFollowingIds] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  
  // View Toggle (null = List View, ID = Profile View)
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [activeProfileDetails, setActiveProfileDetails] = useState(null);
  const [speakerNote, setSpeakerNote] = useState('');

  // Inbox & Chat State
  const [inboxOpen, setInboxOpen] = useState(false);
  const [inboxItems, setInboxItems] = useState([]);
  const [chatPartner, setChatPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState('');

  useEffect(() => {
    loadCurrentUser();
    loadFollowing();
    loadBookmarks();
    loadSpeakers();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      setMyUserId(response?.data?.data?.id || response?.data?.id || null);
    } catch (error) {
      console.error('Could not load current user:', error);
    }
  };

  const loadFollowing = async () => {
    try {
      const response = await apiClient.get('/speakers/me/following');
      setFollowingIds(response?.data?.data?.speaker_ids || []);
    } catch (error) {}
  };

  const loadBookmarks = async () => {
    try {
      const response = await apiClient.get('/speakers/me/bookmarks');
      setBookmarkedIds(response?.data?.data?.speaker_ids || []);
    } catch (error) {}
  };

  const loadSpeakers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/speakers', { params: { limit: 100 } });
      const raw = response?.data;
      setSpeakers(Array.isArray(raw) ? raw : raw?.data || raw?.speakers || []);
    } catch (error) {
      toast.error('Failed to load speakers');
    } finally {
      setLoading(false);
    }
  };

  const openProfile = async (speaker) => {
    setActiveProfileId(speaker.id);
    setActiveProfileDetails(speaker); // Set basic instantly
    window.scrollTo(0, 0);
    try {
      const response = await apiClient.get(`/speakers/${speaker.id}`);
      setActiveProfileDetails(response.data);
      // If you implemented the notes endpoint:
      // const noteRes = await apiClient.get(`/speakers/${speaker.id}/notes`);
      // setSpeakerNote(noteRes.data.note_text);
    } catch (error) {
      console.error("Failed to load full details");
    }
  };

  const closeProfile = () => {
    setActiveProfileId(null);
    setActiveProfileDetails(null);
    setSpeakerNote('');
  };

  const isBookmarked = (id) => bookmarkedIds.includes(id);
  const handleBookmarkToggle = async (e, speakerId) => {
    e.stopPropagation();
    const wasSaved = isBookmarked(speakerId);
    setBookmarkedIds((prev) => wasSaved ? prev.filter((id) => id !== speakerId) : [...prev, speakerId]);
    try {
      if (wasSaved) {
        await apiClient.delete(`/speakers/${speakerId}/bookmark`);
        toast.success('Removed from saved');
      } else {
        await apiClient.post(`/speakers/${speakerId}/bookmark`);
        toast.success('Saved!');
      }
    } catch (error) {
      setBookmarkedIds((prev) => wasSaved ? [...prev, speakerId] : prev.filter((id) => id !== speakerId));
      toast.error('Could not save speaker');
    }
  };

  const visibleSpeakers = useMemo(() => {
    let list = speakers;
    if (filter === 'following') list = list.filter((s) => followingIds.includes(s.id));
    else if (filter === 'bookmarked') list = list.filter((s) => bookmarkedIds.includes(s.id));

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter((s) => 
        getFullName(s).toLowerCase().includes(query) || 
        (s.designation || '').toLowerCase().includes(query) || 
        (s.company || '').toLowerCase().includes(query)
      );
    }
    return list;
  }, [speakers, searchQuery, filter, bookmarkedIds, followingIds]);

  const featuredSpeakers = useMemo(() => {
    // Uses the is_featured flag if available, else fallback to top rated
    const featured = speakers.filter(s => s.is_featured);
    return featured.length > 0 ? featured : [...speakers].sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0)).slice(0, 4);
  }, [speakers]);

  // ============================================================================
  // RENDER PROFILE VIEW (Image 3)
  // ============================================================================
  if (activeProfileId && activeProfileDetails) {
    const s = activeProfileDetails;
    return (
      <div className="min-h-screen bg-[#f8fafc] max-w-[430px] mx-auto font-sans pb-10 animate-in slide-in-from-right-8 duration-300">
        
        {/* Header */}
        <div className="bg-white px-5 pt-5 pb-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={closeProfile} className="text-slate-800 hover:text-black">
              <ChevronLeft size={26} strokeWidth={2.5} />
            </button>
            <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">Speaker Profile</h1>
          </div>
          <div className="flex items-center gap-4 text-slate-700">
            <button aria-label="Report"><AlertCircle size={20} strokeWidth={2} /></button>
            <button aria-label="Share"><Share2 size={20} strokeWidth={2} /></button>
            <button onClick={(e) => handleBookmarkToggle(e, s.id)} aria-label="Bookmark">
              <Bookmark size={22} strokeWidth={2} className={isBookmarked(s.id) ? "text-amber-500 fill-amber-500" : ""} />
            </button>
          </div>
        </div>

        {/* Identity Block */}
        <div className="bg-white px-5 pt-6 pb-8 flex flex-col items-center text-center shadow-sm">
          <Avatar speaker={s} size="w-24 h-24" textSize="text-2xl" />
          <h2 className="text-[22px] font-bold text-slate-900 mt-4">{getFullName(s)}</h2>
          <p className="text-[15px] font-medium text-slate-500 mt-1">{s.designation || 'Speaker'}</p>
          <p className="text-[15px] font-medium text-slate-500">{s.company || 'Company Name'}</p>
        </div>

        <div className="px-5 mt-2 space-y-2">
          {/* Bio */}
          <div className="bg-white p-5 shadow-sm">
            <h3 className="text-[15px] font-bold text-slate-900 mb-3">Bio</h3>
            <p className="text-[14px] text-slate-600 leading-relaxed">
              {s.bio || `${getFullName(s)} is a leading professional in their field with extensive experience across product, technology and analyst roles.`}
            </p>
            <button className="text-[#1d1fb8] font-bold text-[14px] mt-2">Read more</button>
          </div>

          {/* Social Media */}
          <div className="bg-white p-5 shadow-sm">
            <h3 className="text-[15px] font-bold text-slate-900 mb-4">Social Media</h3>
            <div className="flex gap-4">
              <a href={s.social_facebook || "#"} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition"><Facebook size={18} /></a>
              <a href={s.social_twitter || "#"} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition"><Twitter size={18} /></a>
              <a href={s.social_linkedin || "#"} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition"><Linkedin size={18} /></a>
            </div>
          </div>

          {/* Associated Session Card */}
          {s.upcoming_sessions?.length > 0 ? (
            s.upcoming_sessions.map(session => (
              <div key={session.id} className="bg-white p-5 shadow-sm rounded-2xl border border-[#FF007A]/20 mt-4 relative overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <span className="bg-[#FF007A] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                    Foundational Track +2
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div> Live
                    </span>
                    <Bookmark size={16} className="text-slate-400" />
                  </div>
                </div>
                <p className="text-[12px] font-medium text-slate-500 mb-2">15th Oct, 2024 | 10:00 AM - 05:00 PM</p>
                <h4 className="text-[16px] font-bold text-slate-900 leading-snug mb-3 pr-6">
                  {session.title || "How to book meetings fully automated..."}
                </h4>
                <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-500 mb-5">
                  <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[8px]">📍</div>
                  Primary Hall (Meeting room 1)
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                  <div className="flex -space-x-2">
                    <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white"></div>
                    <div className="w-7 h-7 rounded-full bg-slate-300 border-2 border-white"></div>
                    <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">+3</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-700 hover:bg-slate-50 shadow-sm">
                      <Play size={14} /> Watch
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-700 hover:bg-slate-50 shadow-sm">
                      <CalendarPlus size={14} /> Add
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-5 shadow-sm mt-4">
              <p className="text-sm text-slate-500 italic">No upcoming sessions</p>
            </div>
          )}

          {/* Add Notes Section */}
          <div className="bg-transparent pt-6 pb-2 shadow-none">
            <h3 className="text-[15px] font-bold text-slate-900 mb-3 px-1">Add Notes</h3>
            <div className="relative">
              <span className="absolute left-4 top-3 text-[11px] font-bold text-slate-400">Notes</span>
              <textarea
                value={speakerNote}
                onChange={(e) => setSpeakerNote(e.target.value)}
                placeholder="Type here"
                rows={4}
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 pt-8 pb-3 text-[14px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0000c8]/20 focus:border-[#0000c8] resize-none shadow-sm transition"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER LIST VIEW (Image 2)
  // ============================================================================
  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto font-sans pb-24">
      
      {/* Header */}
      <div className="bg-white text-slate-900 px-5 pt-5 pb-2 flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate('/hub')} className="text-slate-800 hover:text-black">
          <ChevronLeft size={26} strokeWidth={2.5} />
        </button>
        <h1 className="text-[20px] font-bold tracking-tight">Speakers</h1>
      </div>

      {loading ? (
        <div className="py-24"><LoadingSpinner /></div>
      ) : (
        <>
          {/* Featured Speakers Carousel */}
          {featuredSpeakers.length > 0 && (
            <div className="pt-2 border-b border-slate-100 pb-6">
              <h2 className="px-5 text-[15px] font-bold text-slate-500 mb-4">Featured Speakers</h2>
              <div className="flex gap-4 overflow-x-auto px-5 pb-2 hide-scrollbar">
                {featuredSpeakers.map((speaker) => (
                  <div 
                    key={speaker.id} 
                    onClick={() => openProfile(speaker)}
                    className="relative shrink-0 w-[140px] rounded-2xl bg-[#f8fafc] border border-slate-100 p-4 text-center shadow-sm cursor-pointer hover:bg-slate-50 transition"
                  >
                    <button 
                      onClick={(e) => handleBookmarkToggle(e, speaker.id)}
                      className="absolute top-3 right-3 text-slate-400 z-10"
                    >
                      <Bookmark size={16} className={isBookmarked(speaker.id) ? "text-amber-500 fill-amber-500" : ""} />
                    </button>
                    <div className="flex justify-center pt-2 mb-3">
                      <Avatar speaker={speaker} size="w-16 h-16" textSize="text-xl" />
                    </div>
                    <p className="text-[13px] font-bold text-slate-900 leading-tight mb-1 truncate">{getFullName(speaker)}</p>
                    <p className="text-[11px] font-medium text-slate-500 truncate">{speaker.designation || 'Speaker Designation'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search & Filter Pill */}
          <div className="px-5 pt-5 pb-2 flex gap-3 relative">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search here"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-full text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#0000c8]/20 focus:bg-white transition"
              />
            </div>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 shadow-sm hover:bg-slate-50"
            >
              <Filter size={20} strokeWidth={1.5} />
            </button>
            {filterOpen && (
              <div className="absolute top-full right-5 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                {FILTERS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setFilter(opt.value); setFilterOpen(false); }}
                    className={`block w-full text-left px-5 py-3.5 text-[14px] hover:bg-slate-50 ${filter === opt.value ? 'font-bold text-[#1d1fb8]' : 'font-medium text-slate-700'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* List Header */}
          <div className="px-5 pt-4 pb-2 flex justify-between items-center">
            <p className="text-[15px] font-bold text-slate-500">
              Total Count ({visibleSpeakers.length})
            </p>
            <Sparkles size={16} className="text-amber-400" />
          </div>

          {/* Standard List */}
          {visibleSpeakers.length > 0 ? (
            <div className="px-5">
              {visibleSpeakers.map((speaker) => (
                <div 
                  key={speaker.id} 
                  onClick={() => openProfile(speaker)}
                  className="flex items-center gap-4 py-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition px-2 -mx-2 rounded-xl"
                >
                  <Avatar speaker={speaker} size="w-14 h-14" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-slate-900 truncate mb-0.5">{getFullName(speaker)}</p>
                    <p className="text-[12px] font-medium text-slate-500 truncate mb-0.5">{speaker.designation || 'Speaker designation'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{speaker.company || 'Company name'}</p>
                  </div>
                  <button 
                    onClick={(e) => handleBookmarkToggle(e, speaker.id)}
                    className="p-2 -mr-2"
                  >
                    <Bookmark size={20} className={isBookmarked(speaker.id) ? "text-amber-500 fill-amber-500" : "text-slate-400"} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <p className="text-[14px] text-slate-500 font-medium">No speakers found matching your criteria</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SpeakersScreen;