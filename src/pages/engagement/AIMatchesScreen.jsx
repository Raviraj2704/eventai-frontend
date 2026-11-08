// ============================================================================
// AI Matches (matches the reference video)
// File: src/pages/engagement/AIMatchesScreen.jsx
// Route: /ai-matches
// Tabs: Attendees, Exhibitors, Sessions, with search and cards
// Real API only:
//   GET  /ai/networking/matches                 attendee matches
//   GET  /partners?limit=50                     exhibitors
//   GET  /ai/recommendations/sessions           recommended sessions
//   GET  /session-hub/me/schedule               scheduled sessions check
//   POST /session-hub/sessions/{id}/schedule    add a session to My Schedule
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Search, MapPin, Calendar, CheckCircle2, Clock } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const TABS = [
  { key: 'attendees', label: 'Attendees' },
  { key: 'exhibitors', label: 'Exhibitors' },
  { key: 'sessions', label: 'Sessions' },
];

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

// Accepts a plain list, or a list inside "data" or "matches"
const unwrapList = (body) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.data)) return body.data.data;
  if (Array.isArray(body?.matches)) return body.matches;
  return [];
};

const initialsOf = (name) =>
  (name || 'A')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'A';

const normalizeAttendee = (raw, index) => {
  const u = raw.user || raw;
  const name =
    u.name ||
    `${u.first_name || ''} ${u.last_name || ''}`.trim() ||
    u.username ||
    'Attendee';
  return {
    key: `a-${u.id ?? u.user_id ?? index}`,
    name,
    designation: u.job_title || u.designation || '',
    company: u.company || '',
    avatarUrl: u.avatar_url || null,
    score: raw.match_score ?? raw.score ?? null,
  };
};

const normalizeExhibitor = (p, index) => {
  const booth =
    p.booth_info ||
    [p.booth_no ? `Booth No. ${p.booth_no}` : null, p.hall_no ? `Hall No. ${p.hall_no}` : null]
      .filter(Boolean)
      .join(' | ');
  return {
    key: `e-${p.id ?? index}`,
    id: p.id,
    name: p.name || p.company_name || p.partner_name || 'Exhibitor',
    booth,
    category: p.category || '',
    logoUrl: p.logo_url || null,
  };
};

const normalizeSession = (s, index) => ({
  key: `s-${s.id ?? index}`,
  id: s.id,
  title: s.title || s.name || 'Session',
  track: s.track || s.category || 'Recommended',
  time:
    s.time_label ||
    (s.start_time
      ? new Date(s.start_time).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : ''),
  location: s.location || '',
  isScheduled: Boolean(s.is_scheduled),
});

const TRACK_COLORS = ['bg-pink-600', 'bg-orange-600', 'bg-sky-600', 'bg-slate-800', 'bg-indigo-600', 'bg-emerald-600'];
const trackColor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return TRACK_COLORS[hash % TRACK_COLORS.length];
};

export default function AIMatchesScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('attendees');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [attendees, setAttendees] = useState([]);
  const [exhibitors, setExhibitors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [errors, setErrors] = useState({});
  const [busyKey, setBusyKey] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const [att, exh, ses, sched] = await Promise.allSettled([
        apiClient.get('/ai/networking/matches'),
        apiClient.get('/partners', { params: { limit: 50 } }),
        apiClient.get('/ai/recommendations/sessions'),
        apiClient.get('/session-hub/me/schedule'),
      ]);
      if (cancelled) return;

      const nextErrors = {};

      if (att.status === 'fulfilled') {
        setAttendees(unwrapList(att.value?.data).map(normalizeAttendee));
      } else {
        nextErrors.attendees = getErrorMessage(att.reason, 'Could not load attendee matches');
      }

      if (exh.status === 'fulfilled') {
        setExhibitors(unwrapList(exh.value?.data).map(normalizeExhibitor));
      } else {
        nextErrors.exhibitors = getErrorMessage(exh.reason, 'Could not load exhibitors');
      }

      // Collect IDs of sessions already in user schedule
      const scheduledIds = new Set();
      if (sched.status === 'fulfilled') {
        const scheduleList = unwrapList(sched.value?.data);
        scheduleList.forEach((item) => {
          const sid = item.session_id ?? item.id;
          if (sid != null) scheduledIds.add(sid);
        });
      }

      if (ses.status === 'fulfilled') {
        const normalized = unwrapList(ses.value?.data).map(normalizeSession);
        setSessions(
          normalized.map((s) => ({
            ...s,
            isScheduled: s.isScheduled || scheduledIds.has(s.id),
          }))
        );
      } else {
        nextErrors.sessions = getErrorMessage(ses.reason, 'Could not load sessions');
      }

      setErrors(nextErrors);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const q = query.trim().toLowerCase();
  const match = (...fields) => !q || fields.some((f) => String(f || '').toLowerCase().includes(q));

  const visibleAttendees = useMemo(
    () => attendees.filter((a) => match(a.name, a.designation, a.company)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attendees, q]
  );

  const visibleExhibitors = useMemo(
    () => exhibitors.filter((e) => match(e.name, e.booth, e.category)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exhibitors, q]
  );

  const visibleSessions = useMemo(
    () => sessions.filter((s) => match(s.title, s.track, s.location)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessions, q]
  );

  const addSession = async (session) => {
    if (!session.id || busyKey) return;
    setBusyKey(session.key);
    try {
      await apiClient.post(`/session-hub/sessions/${session.id}/schedule`);
      setSessions((prev) => prev.map((s) => (s.key === session.key ? { ...s, isScheduled: true } : s)));
      toast.success('Added to your schedule');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not add this session'));
    } finally {
      setBusyKey(null);
    }
  };

  const currentList =
    tab === 'attendees' ? visibleAttendees : tab === 'exhibitors' ? visibleExhibitors : visibleSessions;
  const currentError = errors[tab];

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28">
      {/* Header */}
      <div className="bg-[#0c1b78] text-white px-4 pt-5 pb-4 flex items-center gap-3">
        <button type="button" onClick={() => navigate('/hub')} aria-label="Back" className="text-white">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">AI Matches</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-5 px-4 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => {
          const active = tab === t.key;
          const isSessions = t.key === 'sessions';
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`pb-3 pt-4 text-sm font-semibold whitespace-nowrap border-b-2 ${
                active
                  ? isSessions
                    ? 'text-purple-700 border-purple-700'
                    : 'text-[#0000c8] border-[#0000c8]'
                  : 'text-slate-500 border-transparent'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search here"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="px-4 pt-4 space-y-4">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner />
          </div>
        ) : currentError && currentList.length === 0 ? (
          <p className="text-center text-sm text-red-600 py-12">{currentError}</p>
        ) : currentList.length === 0 ? (
          <p className="text-center text-sm text-slate-500 py-12">
            {q ? 'Nothing matches your search.' : 'No matches yet.'}
          </p>
        ) : tab === 'attendees' ? (
          visibleAttendees.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => navigate('/networking')}
              className="w-full flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"
            >
              {a.avatarUrl ? (
                <img src={a.avatarUrl} alt={a.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-600 shrink-0">
                  {initialsOf(a.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-slate-900 truncate">{a.name}</p>
                {a.designation && <p className="text-sm text-slate-500 truncate">{a.designation}</p>}
                {a.company && <p className="text-xs font-semibold text-slate-400 truncate">{a.company}</p>}
              </div>
              {a.score !== null && (
                <span className="shrink-0 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700">
                  {Math.round(Number(a.score) <= 1 ? Number(a.score) * 100 : Number(a.score))}%
                </span>
              )}
            </button>
          ))
        ) : tab === 'exhibitors' ? (
          visibleExhibitors.map((e) => (
            <button
              key={e.key}
              type="button"
              onClick={() => e.id && navigate(`/partners/${e.id}`)}
              className="w-full flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"
            >
              {e.logoUrl ? (
                <img src={e.logoUrl} alt={e.name} className="w-14 h-14 rounded-xl object-contain border border-slate-200 shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-bold text-[#4c1d95] shrink-0">
                  {initialsOf(e.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-slate-900 truncate">{e.name}</p>
                {e.booth && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                    <MapPin size={12} /> {e.booth}
                  </p>
                )}
              </div>
            </button>
          ))
        ) : (
          visibleSessions.map((s) => (
            <div key={s.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex justify-between items-start gap-2">
                <span className={`text-xs font-semibold text-white px-3 py-1 rounded-full ${trackColor(s.track)}`}>
                  {s.track}
                </span>
              </div>

              <p className="text-base font-semibold text-slate-900 mt-3 line-clamp-2">{s.title}</p>

              <div className="mt-2 space-y-1">
                {s.time && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={12} /> {s.time}
                  </p>
                )}
                {s.location && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin size={12} /> {s.location}
                  </p>
                )}
              </div>

              <div className="flex justify-end mt-3">
                {s.isScheduled ? (
                  <span className="flex items-center gap-1 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 size={14} /> Added
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => addSession(s)}
                    disabled={busyKey === s.key || !s.id}
                    className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-800 disabled:opacity-50"
                  >
                    <Calendar size={14} /> Add
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}