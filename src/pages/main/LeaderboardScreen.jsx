// ============================================================================
// Leaderboard (Leaderboard, Criteria, My Points tabs)
// File: src/pages/main/LeaderboardScreen.jsx
// Route: /leaderboard
// Backend: GET /points/leaderboard, GET /points/criteria, GET /points/me
// ============================================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Crown } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const BLUE = '#0000c8';

const TABS = [
  { key: 'leaderboard', label: 'Leaderboard' },
  { key: 'criteria', label: 'Criteria' },
  { key: 'points', label: 'My Points' },
];

const errorText = (e, fallback) => e?.response?.data?.detail || e?.message || fallback;

function Avatar({ url, name, size = 'w-[120px] h-[120px]' }) {
  return (
    <div className={`${size} rounded-full overflow-hidden bg-slate-200 flex items-center justify-center text-slate-700 font-bold`}>
      {url ? (
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        (name || 'U').charAt(0).toUpperCase()
      )}
    </div>
  );
}

function Podium({ entry, place, onOpen }) {
  if (!entry) return <div className="flex-1" />;
  const isFirst = place === 1;
  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      className={`flex-1 rounded-2xl overflow-hidden text-center transition ${
        isFirst ? 'bg-[#0000c8] text-white shadow-lg -mt-6 pb-5' : 'bg-slate-100 text-slate-900 border border-slate-200'
      }`}
    >
      <div className={`py-2 text-[15px] font-bold ${isFirst ? '' : 'bg-white'}`}>
        {isFirst ? (
          <div className="flex justify-center pt-2">
            <Crown size={30} className="text-amber-400" />
          </div>
        ) : (
          `#${place}`
        )}
      </div>
      <div className="flex flex-col items-center px-2 pb-4 pt-2 gap-2">
        <Avatar url={entry.avatar_url} name={entry.name} size="w-[80px] h-[80px]" />
        <p className={`text-[13px] font-semibold ${isFirst ? 'text-white' : 'text-slate-800'}`}>{entry.name}</p>
        <p className={`text-[20px] font-bold ${isFirst ? 'text-white' : 'text-[#0000c8]'}`}>{entry.points}</p>
      </div>
    </button>
  );
}

function Row({ entry, mine, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      className={`w-full flex items-center gap-4 px-4 py-4 text-left ${
        mine ? 'bg-slate-100 rounded-2xl' : 'border-b border-slate-200'
      }`}
    >
      <span className={`w-12 text-[17px] font-bold ${mine ? 'text-[#0000c8]' : 'text-slate-800'}`}>#{entry.rank}</span>
      <Avatar url={entry.avatar_url} name={entry.name} size="w-[56px] h-[56px]" />
      <span className={`flex-1 text-[15px] font-medium ${mine ? 'text-[#0000c8]' : 'text-slate-800'}`}>
        {mine ? 'You' : entry.name}
      </span>
      <span className={`text-[17px] font-bold ${mine ? 'text-[#0000c8]' : 'text-slate-900'}`}>{entry.points}</span>
    </button>
  );
}

export default function LeaderboardScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('leaderboard');
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState({ top: [], me: null });
  const [criteria, setCriteria] = useState([]);
  const [myPoints, setMyPoints] = useState({ total: 0, earned: [] });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const load = async () => {
      try {
        const [lb, cr, mp] = await Promise.all([
          apiClient.get('/points/leaderboard', { params: { limit: 50 } }),
          apiClient.get('/points/criteria'),
          apiClient.get('/points/me'),
        ]);
        if (cancelled) return;
        setBoard(lb.data?.data ?? { top: [], me: null });
        setCriteria(cr.data?.data ?? []);
        setMyPoints(mp.data?.data ?? { total: 0, earned: [] });
      } catch (e) {
        if (!cancelled) toast.error(errorText(e, 'Could not load the leaderboard'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const openPerson = (entry) => {
    if (entry?.user_id) navigate(`/speakers/${entry.user_id}`);
  };

  const top = board.top || [];
  const first = top[0];
  const second = top[1];
  const third = top[2];
  const rest = top.slice(3);
  const me = board.me;
  const showMeRow = me && me.rank > top.length;

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-5 pb-4 flex items-center gap-4 border-b border-slate-200">
        <button type="button" onClick={() => navigate(-1)} aria-label="Back" className="text-slate-900">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[24px] font-bold text-slate-900">Leaderboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex px-5 pt-5 gap-2">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 text-[16px] font-bold pb-2 ${active ? 'text-[#0000c8]' : 'text-slate-400'}`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : tab === 'leaderboard' ? (
        <div className="px-5 pt-6">
          {/* Podium: #2, #1, #3 */}
          <div className="flex items-end gap-3 mb-6">
            <Podium entry={second} place={2} onOpen={openPerson} />
            <Podium entry={first} place={1} onOpen={openPerson} />
            <Podium entry={third} place={3} onOpen={openPerson} />
          </div>

          {/* Rows */}
          <div className="space-y-0">
            {rest.map((e) => (
              <Row key={e.user_id} entry={e} mine={me && e.user_id === me.user_id} onOpen={openPerson} />
            ))}
          </div>

          {showMeRow && (
            <div className="mt-4">
              <Row entry={me} mine onOpen={openPerson} />
            </div>
          )}

          {top.length === 0 && (
            <p className="text-center text-[14px] text-slate-500 py-12">No points awarded yet.</p>
          )}
        </div>
      ) : tab === 'criteria' ? (
        <div className="px-5 pt-4">
          {criteria.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-5 border-b border-slate-200">
              <p className="text-[16px] text-slate-900 pr-4">{c.title}</p>
              <div className="min-w-[84px] text-center rounded-xl bg-slate-100 px-4 py-2">
                <p className="text-[20px] font-bold text-[#0000c8] leading-tight">{c.points}</p>
                <p className="text-[12px] text-slate-500">Points</p>
              </div>
            </div>
          ))}
          {criteria.length === 0 && (
            <p className="text-center text-[14px] text-slate-500 py-12">No criteria yet.</p>
          )}
        </div>
      ) : (
        <div className="px-5 pt-4">
          {myPoints.earned.map((e) => (
            <div key={e.criteria_id} className="flex items-center justify-between py-5 border-b border-slate-200">
              <p className="text-[16px] text-slate-900 pr-4">{e.title}</p>
              <div className="min-w-[84px] text-center rounded-xl bg-slate-100 px-4 py-2">
                <p className="text-[20px] font-bold text-[#0000c8] leading-tight">{e.points}</p>
                <p className="text-[12px] text-slate-500">Points</p>
              </div>
            </div>
          ))}
          {myPoints.earned.length === 0 && (
            <p className="text-center text-[14px] text-slate-500 py-12">You have not earned any points yet.</p>
          )}
        </div>
      )}
    </div>
  );
}