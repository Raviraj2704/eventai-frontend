// ============================================================================
// Sessions Screen (matches the reference video & Adobe XD Filter Design)
// File: src/pages/main/SessionsScreen.jsx
// ============================================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search, Filter, Bookmark, Clock, MapPin, Play, Calendar, CheckCircle2,
  MessageSquare, Bell, X, ChevronLeft, RotateCcw
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SessionAdminToolbar from '../../components/sessions/SessionAdminToolbar';
import apiClient from '../../config/apiClient';

const TABS = [
  { key: 'all', label: 'All Sessions' },
  { key: 'mine', label: 'My Sessions' },
  { key: 'ai', label: 'AI Recommended' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All sessions' },
  { value: 'live', label: 'Live now' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ended', label: 'Ended' },
];

const TRACK_COLORS = [
  'bg-pink-600', 'bg-orange-600', 'bg-sky-600', 'bg-slate-800', 'bg-indigo-600', 'bg-emerald-600',
];

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

const unwrapList = (body) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  return [];
};

const trackColor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return TRACK_COLORS[hash % TRACK_COLORS.length];
};

const formatVideoDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const n = d.getDate();
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
  const month = d.toLocaleString('en-US', { month: 'short' });
  return `${n}${suffix} ${month}, ${d.getFullYear()}`;
};

const normalizeAi = (r) => ({
  id: r.id,
  title: r.title || r.name || 'Recommended session',
  location: r.location || '',
  start_time: r.start_time || null,
  time_label: r.time_label || '',
  track: 'Recommended',
  tags: [],
  status: 'upcoming',
  is_live: false,
  is_scheduled: false,
  is_bookmarked: false,
  attendee_count: 0,
  attendee_avatars: [],
});

function StatusLabel({ item }) {
  if (item.publish_status === 'draft' || item.is_published === false) {
    return (
      <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-semibold">
        Draft
      </span>
    );
  }
  if (item.status === 'ended') {
    return <span className="text-xs font-semibold text-slate-500">Ended</span>;
  }
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-amber-500">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Upcoming
    </span>
  );
}

function SessionCard({ item, busy, onOpen, onToggleSchedule, onToggleBookmark, onWatch }) {
  const avatars = (item.attendee_avatars || []).slice(0, 3);
  const extra = Math.max((item.attendee_count || 0) - avatars.length, 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
      <div className="flex justify-between items-start gap-2">
        <span className={`text-xs font-semibold text-white px-3 py-1 rounded-full ${trackColor(item.track)}`}>
          {item.track || 'General'}
        </span>
        <div className="flex items-center gap-3">
          <StatusLabel item={item} />
          <button
            type="button"
            onClick={() => onToggleBookmark(item)}
            disabled={busy}
            aria-label={item.is_bookmarked ? 'Remove from saved' : 'Save session'}
            className={item.is_bookmarked ? 'text-amber-500' : 'text-slate-400'}
          >
            <Bookmark size={18} fill={item.is_bookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <button type="button" onClick={() => onOpen(item)} className="w-full text-left mt-3">
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <Clock size={12} />
          {item.start_time
            ? `${formatVideoDate(item.start_time)} | ${item.time_label}`
            : item.time_label}
        </p>
        <p className="text-base font-semibold text-slate-900 mt-1 line-clamp-2">{item.title}</p>
        {item.location && (
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-2">
            <MapPin size={12} />
            {item.location}
          </p>
        )}
      </button>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center">
          {avatars.map((src, index) => (
            <img
              key={`${src}-${index}`}
              src={src}
              alt=""
              className="w-8 h-8 rounded-full object-cover border-2 border-white -ml-2 first:ml-0"
            />
          ))}
          {extra > 0 && <span className="ml-2 text-xs text-slate-500">+{extra}</span>}
        </div>

        <div className="flex gap-2">
          {item.is_live && (
            <button
              type="button"
              onClick={() => onWatch(item)}
              className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-800"
            >
              <Play size={14} />
              Watch
            </button>
          )}
          <button
            type="button"
            onClick={() => onToggleSchedule(item)}
            disabled={busy}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-50 ${
              item.is_scheduled
                ? 'bg-[#0000c8] text-white'
                : 'border border-slate-300 text-slate-800'
            }`}
          >
            {item.is_scheduled ? <CheckCircle2 size={14} /> : <Calendar size={14} />}
            {item.is_scheduled ? 'Added' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SessionsScreen() {
  const navigate = useNavigate();

  const [tab, setTab] = useState('all');
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [track, setTrack] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [liveOnly, setLiveOnly] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [metaLoaded, setMetaLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Temporary State for Filter Sheet (Matching Adobe XD Design)
  const [tempHalls, setTempHalls] = useState([]);
  const [tempKeywords, setTempKeywords] = useState([]);
  const [tempNotes, setTempNotes] = useState(false);
  const [hallInput, setHallInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  // Sync temp filters when opening sheet
  const openFilterSheet = () => {
    setTempHalls(selectedDay ? [selectedDay] : []);
    setTempKeywords(track ? [track] : []);
    setFilterOpen(true);
  };

  const applyFilters = () => {
    // Map back to API format (API currently supports single selection)
    setSelectedDay(tempHalls.length > 0 ? tempHalls[0] : null);
    setTrack(tempKeywords.length > 0 ? tempKeywords[0] : '');
    setFilterOpen(false);
  };

  const resetFilters = () => {
    setTempHalls([]);
    setTempKeywords([]);
    setTempNotes(false);
  };

  const removeTempHall = (h) => setTempHalls(tempHalls.filter(x => x !== h));
  const removeTempKeyword = (k) => setTempKeywords(tempKeywords.filter(x => x !== k));

  useEffect(() => {
    let cancelled = false;
    const loadMeta = async () => {
      try {
        const [daysRes, tracksRes] = await Promise.all([
          apiClient.get('/session-hub/days'),
          apiClient.get('/session-hub/tracks'),
        ]);
        if (cancelled) return;
        const dayList = unwrapList(daysRes?.data);
        setDays(dayList);
        setSelectedDay(dayList.length > 0 ? dayList[0].date : null);
        setTracks(unwrapList(tracksRes?.data));
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Could not load sessions'));
      } finally {
        if (!cancelled) setMetaLoaded(true);
      }
    };
    loadMeta();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!metaLoaded) return undefined;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        let list = [];
        if (tab === 'all') {
          const res = await apiClient.get('/session-hub/sessions', {
            params: {
              limit: 50,
              status: statusFilter,
              live_only: liveOnly ? true : undefined,
              q: debouncedQuery || undefined,
              track: track || undefined,
              day: selectedDay || undefined,
            },
          });
          list = unwrapList(res?.data);
        } else if (tab === 'mine') {
          const res = await apiClient.get('/session-hub/me/schedule', { params: { limit: 100 } });
          list = unwrapList(res?.data);
        } else {
          const res = await apiClient.get('/ai/recommendations/sessions');
          list = unwrapList(res?.data).map(normalizeAi);
        }
        if (!cancelled) setItems(list);
      } catch (err) {
        if (!cancelled) {
          setItems([]);
          setError(getErrorMessage(err, 'Could not load sessions. Please try again.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [tab, metaLoaded, selectedDay, track, statusFilter, liveOnly, debouncedQuery, refreshKey]);

  const patchItem = (id, patch) =>
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const toggleSchedule = async (item) => {
    if (busyId !== null) return;
    const adding = !item.is_scheduled;
    setBusyId(item.id);
    patchItem(item.id, { is_scheduled: adding });
    try {
      if (adding) {
        await apiClient.post(`/session-hub/sessions/${item.id}/schedule`);
        toast.success('Added to your schedule');
      } else {
        await apiClient.delete(`/session-hub/sessions/${item.id}/schedule`);
        toast.success('Removed from your schedule');
        if (tab === 'mine') {
          setItems((prev) => prev.filter((x) => x.id !== item.id));
        }
      }
    } catch (err) {
      patchItem(item.id, { is_scheduled: !adding });
      toast.error(getErrorMessage(err, 'Could not update your schedule'));
    } finally {
      setBusyId(null);
    }
  };

  const toggleBookmark = async (item) => {
    if (busyId !== null) return;
    const saving = !item.is_bookmarked;
    setBusyId(item.id);
    patchItem(item.id, { is_bookmarked: saving });
    try {
      if (saving) {
        await apiClient.post(`/session-hub/sessions/${item.id}/bookmark`);
        toast.success('Saved');
      } else {
        await apiClient.delete(`/session-hub/sessions/${item.id}/bookmark`);
        toast.success('Removed from saved');
      }
    } catch (err) {
      patchItem(item.id, { is_bookmarked: !saving });
      toast.error(getErrorMessage(err, 'Could not update saved sessions'));
    } finally {
      setBusyId(null);
    }
  };

  const watch = async (item) => {
    try {
      const res = await apiClient.get(`/session-hub/sessions/${item.id}/stream`);
      const url = res?.data?.data?.stream_url;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('Stream link is not available');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'This session is not live right now'));
    }
  };

  const activeFilters = (track ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28">
      {/* Header */}
      <div className="flex justify-between items-center px-4 pt-5 pb-3">
        <h1 className="text-2xl font-bold text-slate-900">Sessions</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/networking')}
            aria-label="Messages"
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700"
          >
            <MessageSquare size={18} />
          </button>
          <button
            type="button"
            onClick={() => navigate('/announcements')}
            aria-label="Notifications"
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700"
          >
            <Bell size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-5 px-4 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`pb-3 text-sm font-semibold whitespace-nowrap ${
              tab === t.key
                ? t.key === 'ai'
                  ? 'text-purple-700 border-b-2 border-purple-700'
                  : 'text-[#0000c8] border-b-2 border-[#0000c8]'
                : 'text-slate-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      
      <SessionAdminToolbar onChanged={() => setRefreshKey((k) => k + 1)} />

      {/* Day chips (All Sessions only) */}
      {tab === 'all' && days.length > 0 && (
        <div className="flex gap-3 px-4 pt-4 overflow-x-auto">
          {days.map((d) => {
            const active = selectedDay === d.date;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => setSelectedDay(d.date)}
                className={`shrink-0 rounded-xl px-4 py-2 text-left border ${
                  active ? 'bg-[#0000c8] border-[#0000c8] text-white' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <p className="text-sm font-semibold">{d.label}</p>
                <p className={`text-xs ${active ? 'text-white/85' : 'text-slate-500'}`}>Day {d.day_number}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Toolbar: Live toggle, search, filter */}
      <div className="flex items-center justify-between px-4 pt-4">
        {tab === 'all' ? (
          <button
            type="button"
            role="switch"
            aria-checked={liveOnly}
            onClick={() => setLiveOnly((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-800"
          >
            <span
              className={`w-4 h-4 rounded-full border ${
                liveOnly ? 'bg-red-500 border-red-500' : 'border-slate-400'
              }`}
            />
            Live Sessions
          </button>
        ) : (
          <span />
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search"
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700"
          >
            {searchOpen ? <X size={18} /> : <Search size={18} />}
          </button>
          <button
            type="button"
            onClick={openFilterSheet}
            aria-label="Filter"
            className="relative w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700"
          >
            <Filter size={18} />
            {activeFilters > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500" />
            )}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="px-4 pt-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sessions, speakers, rooms"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* List */}
      <div className="px-4 pt-4 space-y-4">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <p className="text-center text-sm text-red-600 py-12">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-slate-500 py-12">
            {tab === 'mine' ? 'You have not added any sessions yet.' : 'No sessions found.'}
          </p>
        ) : (
          items.map((item) => (
            <SessionCard
              key={item.id}
              item={item}
              busy={busyId === item.id}
              onOpen={(s) => navigate(`/sessions/${s.id}`)}
              onToggleSchedule={toggleSchedule}
              onToggleBookmark={toggleBookmark}
              onWatch={watch}
            />
          ))
        )}
      </div>

      {/* MATCHING ADOBE XD FILTER SHEET */}
      {filterOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[60] flex items-end justify-center backdrop-blur-sm transition-opacity"
          onClick={() => setFilterOpen(false)}
        >
          <div
            className="bg-white w-full max-w-[430px] rounded-t-3xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-full duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: < Filters */}
            <div className="flex items-center px-5 py-4 border-b border-slate-100">
              <button onClick={() => setFilterOpen(false)} className="flex items-center text-slate-900 gap-2 hover:text-black">
                <ChevronLeft size={22} strokeWidth={2.5} />
                <span className="text-xl font-bold">Filters</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
              {/* Choose Filters & Reset */}
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-bold text-slate-900">Choose Filters</h3>
                <button 
                  onClick={resetFilters} 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-300 bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Reset <RotateCcw size={12} />
                </button>
              </div>

              {/* Halls Section */}
              <div>
                <h4 className="text-[14px] font-bold text-slate-900 mb-3">Halls</h4>
                {/* Removable Chips */}
                {tempHalls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tempHalls.map((hall) => (
                      <span key={hall} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 shadow-sm rounded-lg text-[12px] font-medium text-slate-700">
                        {hall}
                        <X size={12} className="cursor-pointer text-slate-400 hover:text-red-500" onClick={() => removeTempHall(hall)} />
                      </span>
                    ))}
                  </div>
                )}
                {/* Search Bar for Halls */}
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={hallInput}
                    onChange={(e) => setHallInput(e.target.value)}
                    placeholder="Search here"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-200"
                  />
                </div>
              </div>

              {/* Keywords Section */}
              <div>
                <h4 className="text-[14px] font-bold text-slate-900 mb-3">Keywords</h4>
                {/* Removable Chips */}
                {tempKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tempKeywords.map((kw) => (
                      <span key={kw} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 shadow-sm rounded-lg text-[12px] font-medium text-slate-700">
                        {kw}
                        <X size={12} className="cursor-pointer text-slate-400 hover:text-red-500" onClick={() => removeTempKeyword(kw)} />
                      </span>
                    ))}
                  </div>
                )}
                {/* Search Bar for Keywords */}
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="Search here"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-200"
                  />
                </div>
              </div>

              {/* With notes Toggle */}
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[14px] font-bold text-slate-900">With notes</span>
                <button
                  role="switch"
                  aria-checked={tempNotes}
                  onClick={() => setTempNotes(!tempNotes)}
                  className={`w-10 h-6 rounded-full relative transition-colors duration-200 ${
                    tempNotes ? 'bg-slate-400' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-sm ${
                      tempNotes ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Bottom Apply Button */}
            <div className="p-5 bg-white border-t border-slate-100">
              <button
                type="button"
                onClick={applyFilters}
                className="w-full rounded-xl bg-[#0000c8] text-white py-4 text-[14px] font-bold shadow-md hover:bg-blue-800 transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}