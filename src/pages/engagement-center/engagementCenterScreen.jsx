// ============================================================================
// Engagement Center (Polls, Leaderboard, Criteria, My Points)
// File: src/pages/engagement-center/engagementCenterScreen.jsx
// Backend: GET /points/leaderboard, GET /points/criteria, GET /points/me
// Polls tab renders the existing PollsScreen, unchanged.
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, Crown } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';
import PollsScreen from '../main/PollsScreen';

const TABS = [
  { key: 'polls', label: 'Polls' },
  { key: 'leaderboard', label: 'Leaderboard' },
  { key: 'criteria', label: 'Criteria' },
  { key: 'points', label: 'My Points' },
];

const errorText = (e, fallback) => e?.response?.data?.detail || e?.message || fallback;

const initialsOf = (name) =>
  (name || 'A')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'A';

// Top three: #2 on the left, #1 in the middle (blue, crown), #3 on the right
function Podium({ top }) {
  const order = [top[1], top[0], top[2]];
  return (
    <div className="flex items-end justify-center gap-3 pt-12 pb-6 px-2">
      {order.map((entry, i) => {
        if (!entry) return <div key={`empty-${i}`} className="flex-1" />;
        const isFirst = i === 1;
        return (
          <div
            key={entry.user_id}
            className={`flex flex-col items-center text-center rounded-[18px] relative transition-all ${
              isFirst
                ? 'flex-[1.2] bg-[#0000c8] p-5 shadow-xl shadow-blue-900/20 z-10 -mt-6'
                : 'flex-1 bg-white p-4 shadow-[0_2px_15px_rgb(0,0,0,0.06)] border border-slate-100 mb-2'
            }`}
          >
            {isFirst && (
              <Crown size={38} className="absolute -top-11 left-1/2 -translate-x-1/2 text-amber-400 fill-amber-400" />
            )}
            {!isFirst && <p className="text-[16px] font-black text-slate-800 mb-2">#{entry.rank}</p>}
            <div className="relative mb-2">
              {entry.avatar_url ? (
                <img
                  src={entry.avatar_url}
                  alt={entry.name}
                  className={`${isFirst ? 'w-16 h-16 border-2 border-white/20' : 'w-12 h-12'} rounded-full object-cover`}
                />
              ) : (
                <div
                  className={`${
                    isFirst ? 'w-16 h-16 text-xl border-2 border-white/20 text-white bg-blue-600' : 'w-12 h-12 text-base text-slate-600 bg-slate-100'
                  } rounded-full flex items-center justify-center font-bold`}
                >
                  {initialsOf(entry.name)}
                </div>
              )}
            </div>
            <p className={`text-[13px] font-medium truncate w-full mb-1 leading-tight ${isFirst ? 'text-white' : 'text-slate-600'}`}>
              {entry.name}
            </p>
            <p className={`text-[18px] font-black ${isFirst ? 'text-white mt-1' : 'text-[#0000c8]'}`}>{entry.points}</p>
          </div>
        );
      })}
    </div>
  );
}

// One ranked row (used for 4th place onward and for "You" when outside the top list)
function Row({ entry, mine }) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-slate-100">
      <span className={`w-8 text-[16px] font-black ${mine ? 'text-[#0000c8]' : 'text-slate-800'}`}>#{entry.rank}</span>
      {entry.avatar_url ? (
        <img src={entry.avatar_url} alt={entry.name} className="w-12 h-12 rounded-full object-cover" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-[14px] font-bold text-slate-600">
          {initialsOf(entry.name)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-[15px] font-bold truncate ${mine ? 'text-[#0000c8]' : 'text-slate-800'}`}>
          {mine ? 'You' : entry.name}
        </p>
      </div>
      <p className={`text-[16px] font-black ${mine ? 'text-[#0000c8]' : 'text-slate-800'}`}>{entry.points}</p>
    </div>
  );
}

// Criteria and My Points rows
function PointsList({ items, emptyText }) {
  if (items.length === 0) {
    return <p className="text-center text-[14px] text-slate-500 py-12">{emptyText}</p>;
  }
  return (
    <div className="px-5 pt-4 pb-24">
      {items.map((item, index) => (
        <div
          key={item.key}
          className={`flex items-center justify-between py-4 ${index !== items.length - 1 ? 'border-b border-slate-100' : ''}`}
        >
          <span className="text-[15px] font-medium text-slate-700 flex-1 pr-4">{item.label}</span>
          <div className="bg-slate-50 border border-slate-100 rounded-[14px] px-4 py-2.5 min-w-[80px] flex flex-col items-center justify-center">
            <span className="text-[16px] font-black text-[#0000c8] leading-none">{item.points}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Points</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EngagementCenterScreen() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('tab');
  const tab = TABS.some((t) => t.key === requested) ? requested : 'leaderboard';
  const setTab = (key) => setSearchParams({ tab: key });

  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState({ top: [], me: null });
  const [criteria, setCriteria] = useState([]);
  const [earned, setEarned] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lb, cr, mp] = await Promise.all([
        apiClient.get('/points/leaderboard', { params: { limit: 50 } }),
        apiClient.get('/points/criteria'),
        apiClient.get('/points/me'),
      ]);
      setBoard(lb.data?.data ?? { top: [], me: null });
      setCriteria(
        (cr.data?.data ?? []).map((c) => ({ key: c.id, label: c.title, points: c.points }))
      );
      setEarned(
        (mp.data?.data?.earned ?? []).map((e) => ({ key: e.criteria_id, label: e.title, points: e.points }))
      );
    } catch (e) {
      toast.error(errorText(e, 'Could not load the leaderboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const top = board.top || [];
  const me = board.me;
  const meOutsideTop = me && !top.some((t) => t.user_id === me.user_id);

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto font-sans relative">
      {/* Header */}
      <div className="bg-white text-slate-900 px-5 pt-5 pb-3 flex items-center gap-3 sticky top-0 z-20">
        <button type="button" onClick={() => navigate('/hub')} aria-label="Back" className="text-slate-800 hover:text-black">
          <ChevronLeft size={26} strokeWidth={2.5} />
        </button>
        <h1 className="text-[20px] font-bold tracking-tight">Leaderboard</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white flex px-5 border-b border-slate-100 shadow-sm sticky top-[60px] z-10 justify-between">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`pb-3 pt-3 text-[15px] relative ${active ? 'text-[#0000c8] font-bold' : 'text-slate-400 font-medium'}`}
            >
              {t.label}
              {active && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0000c8]" />}
            </button>
          );
        })}
      </div>

      {tab === 'polls' && <PollsScreen />}

      {tab !== 'polls' && loading && (
        <div className="py-24 flex justify-center">
          <LoadingSpinner />
        </div>
      )}

      {tab !== 'polls' && !loading && tab === 'leaderboard' && (
        <div className="px-5 pt-2 pb-24">
          {top.length >= 3 && <Podium top={top} />}
          <div className="pt-2">
            {top.slice(3).map((entry) => (
              <Row key={entry.user_id} entry={entry} mine={me && entry.user_id === me.user_id} />
            ))}
          </div>
          {meOutsideTop && (
            <div className="mt-4 bg-slate-50 rounded-2xl px-2">
              <Row entry={me} mine />
            </div>
          )}
          {top.length === 0 && <p className="text-center text-[14px] text-slate-500 py-12">No points awarded yet.</p>}
        </div>
      )}

      {tab !== 'polls' && !loading && tab === 'criteria' && (
        <PointsList items={criteria} emptyText="No criteria yet." />
      )}

      {tab !== 'polls' && !loading && tab === 'points' && (
        <PointsList items={earned} emptyText="You have not earned any points yet." />
      )}
    </div>
  );
}