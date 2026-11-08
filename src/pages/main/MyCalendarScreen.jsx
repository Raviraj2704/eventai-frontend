// ============================================================================
// My Calendar (matches the reference video)
// File: src/pages/main/MyCalendarScreen.jsx
// Route: /my-calendar
// Real API only:
//   GET /session-hub/days              day tabs (15, 16, 17 Oct)
//   GET /session-hub/me/schedule       sessions you added
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, MapPin } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const BLOCK_COLORS = [
  'bg-pink-100 border-pink-600 text-pink-900',
  'bg-orange-100 border-orange-600 text-orange-900',
  'bg-sky-100 border-sky-600 text-sky-900',
  'bg-indigo-100 border-indigo-600 text-indigo-900',
  'bg-emerald-100 border-emerald-600 text-emerald-900',
];

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

const unwrapList = (body) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  return [];
};

const formatClock = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const colorFor = (index) => BLOCK_COLORS[index % BLOCK_COLORS.length];

export default function MyCalendarScreen() {
  const navigate = useNavigate();
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [daysRes, scheduleRes] = await Promise.all([
          apiClient.get('/session-hub/days'),
          apiClient.get('/session-hub/me/schedule', { params: { limit: 100 } }),
        ]);
        if (cancelled) return;

        const dayList = unwrapList(daysRes?.data);
        setDays(dayList);
        setSelectedDay(dayList.length > 0 ? dayList[0].date : null);
        setSchedule(unwrapList(scheduleRes?.data));
      } catch (error) {
        if (!cancelled) toast.error(getErrorMessage(error, 'Could not load your calendar'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Only the sessions on the selected day, sorted by start time
  const dayItems = useMemo(
    () =>
      schedule
        .filter((s) => s.date === selectedDay)
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time)),
    [schedule, selectedDay]
  );

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28">
      {/* Header */}
      <div className="bg-[#0c1b78] text-white px-4 pt-5 pb-4 flex items-center gap-3">
        <button type="button" onClick={() => navigate('/hub')} aria-label="Back" className="text-white">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">My Calendar</h1>
      </div>

      {/* Day tabs */}
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

      {/* Timeline */}
      <div className="px-4 pt-6">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner />
          </div>
        ) : dayItems.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-sm text-slate-500">No sessions scheduled for this day.</p>
            <button
              type="button"
              onClick={() => navigate('/sessions')}
              className="rounded-lg bg-[#0000c8] text-white px-4 py-2 text-sm font-semibold"
            >
              Browse sessions
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {dayItems.map((item, index) => (
              <div key={item.id} className="flex gap-3">
                <div className="w-16 shrink-0 pt-3 text-right">
                  <p className="text-xs font-semibold text-slate-700">{formatClock(item.start_time)}</p>
                  <p className="text-[11px] text-slate-400">{formatClock(item.end_time)}</p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/sessions/${item.id}`)}
                  className={`flex-1 rounded-xl border-l-4 p-3 text-left ${colorFor(index)}`}
                >
                  <p className="text-sm font-semibold line-clamp-2">{item.title}</p>
                  {item.track && (
                    <p className="text-xs mt-1 opacity-80">{item.track}</p>
                  )}
                  <div className="mt-2 space-y-1">
                    {item.time_label && (
                      <p className="text-xs flex items-center gap-1 opacity-80">
                        <Clock size={12} /> {item.time_label}
                      </p>
                    )}
                    {item.location && (
                      <p className="text-xs flex items-center gap-1 opacity-80">
                        <MapPin size={12} /> {item.location}
                      </p>
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}