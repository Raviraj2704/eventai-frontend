// ============================================================================
// Leaderboard (Leaderboard, Criteria, My Points)
// File: src/pages/main/LeaderboardScreen.jsx
// Route: /leaderboard
// Backend: GET /points/leaderboard, GET /points/criteria, GET /points/me,
//          POST /points/award (admin only), GET /auth/me
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Crown, Plus, X } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const TABS = [
  { key: 'leaderboard', label: 'Leaderboard' },
  { key: 'criteria', label: 'Criteria' },
  { key: 'points', label: 'My Points' },
];

const errorText = (e, fallback) => e?.response?.data?.detail || e?.message || fallback;

function Avatar({ url, name, size = 'w-[56px] h-[56px]' }) {
  return (
    <div className={`${size} rounded-full overflow-hidden bg-slate-200 flex items-center justify-center text-slate-700 font-bold flex-shrink-0`}>
      {url ? (
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        (name || 'U').charAt(0).toUpperCase()
      )}
    </div>
  );
}

function Podium({ entry, place }) {
  if (!entry) return <div className="flex-1" />;
  const isFirst = place === 1;
  return (
    <div
      className={`flex-1 rounded-2xl overflow-hidden text-center ${
        isFirst ? 'bg-[#0000c8] text-white shadow-lg -mt-6' : 'bg-slate-100 text-slate-900 border border-slate-200'
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
    </div>
  );
}

function Row({ entry, mine }) {
  return (
    <div
      className={`w-full flex items-center gap-4 px-4 py-4 ${
        mine ? 'bg-slate-100 rounded-2xl' : 'border-b border-slate-200'
      }`}
    >
      <span className={`w-12 text-[17px] font-bold ${mine ? 'text-[#0000c8]' : 'text-slate-800'}`}>#{entry.rank}</span>
      <Avatar url={entry.avatar_url} name={entry.name} />
      <span className={`flex-1 text-[15px] font-medium ${mine ? 'text-[#0000c8]' : 'text-slate-800'}`}>
        {mine ? 'You' : entry.name}
      </span>
      <span className={`text-[17px] font-bold ${mine ? 'text-[#0000c8]' : 'text-slate-900'}`}>{entry.points}</span>
    </div>
  );
}

function PointsCard({ title, points }) {
  return (
    <div className="flex items-center justify-between py-5 border-b border-slate-200">
      <p className="text-[16px] text-slate-900 pr-4">{title}</p>
      <div className="min-w-[84px] text-center rounded-xl bg-slate-100 px-4 py-2">
        <p className="text-[20px] font-bold text-[#0000c8] leading-tight">{points}</p>
        <p className="text-[12px] text-slate-500">Points</p>
      </div>
    </div>
  );
}

// Admin only: award one criterion to one person
function AwardSheet({ people, criteria, onClose, onDone }) {
  const [userId, setUserId] = useState('');
  const [criteriaId, setCriteriaId] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!userId || !criteriaId) {
      toast.error('Choose a person and a criterion');
      return;
    }
    setSaving(true);
    try {
      const res = await apiClient.post('/points/award', {
        user_id: Number(userId),
        criteria_id: Number(criteriaId),
      });
      if (res.data?.data?.awarded) {
        toast.success(res.data.message || 'Points awarded');
      } else {
        toast('Already awarded to this person');
      }
      onDone();
    } catch (e) {
      toast.error(errorText(e, 'Could not award points'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
      <div className="w-full max-w-[430px] bg-white rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[17px] font-bold text-slate-900">Award points</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div>
          <p className="text-[13px] font-bold text-slate-900 mb-2">Person</p>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-[14px] bg-white"
          >
            <option value="">Select a person</option>
            {people.map((p) => (
              <option key={p.user_id} value={p.user_id}>
                {p.name} ({p.points} pts)
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-[13px] font-bold text-slate-900 mb-2">Criterion</p>
          <div className="space-y-2">
            {criteria.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCriteriaId(String(c.id))}
                className={`w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left text-[14px] ${
                  criteriaId === String(c.id) ? 'border-[#0000c8] text-[#0000c8]' : 'border-slate-200 text-slate-700'
                }`}
              >
                <span>{c.title}</span>
                <span className="font-bold">{c.points}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="w-full rounded-2xl bg-[#0000c8] text-white py-4 text-[15px] font-bold shadow-lg hover:bg-blue-800 transition disabled:opacity-70"
        >
          {saving ? 'Awarding...' : 'Award points'}
        </button>
      </div>
    </div>
  );
}

export default function LeaderboardScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('leaderboard');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [board, setBoard] = useState({ top: [], me: null });
  const [criteria, setCriteria] = useState([]);
  const [myPoints, setMyPoints] = useState({ total: 0, earned: [] });
  const [awardOpen, setAwardOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [lb, cr, mp] = await Promise.all([
        apiClient.get('/points/leaderboard', { params: { limit: 50 } }),
        apiClient.get('/points/criteria'),
        apiClient.get('/points/me'),
      ]);
      setBoard(lb.data?.data ?? { top: [], me: null });
      setCriteria(cr.data?.data ?? []);
      setMyPoints(mp.data?.data ?? { total: 0, earned: [] });
    } catch (e) {
      toast.error(errorText(e, 'Could not load the leaderboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    apiClient
      .get('/auth/me')
      .then((res) => setIsAdmin(Boolean(res?.data?.is_admin)))
      .catch(() => setIsAdmin(false));
  }, [load]);

  const top = board.top || [];
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
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 text-[16px] font-bold pb-2 ${tab === t.key ? 'text-[#0000c8]' : 'text-slate-400'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : tab === 'leaderboard' ? (
        <div className="px-5 pt-6">
          <div className="flex items-end gap-3 mb-6">
            <Podium entry={top[1]} place={2} />
            <Podium entry={top[0]} place={1} />
            <Podium entry={top[2]} place={3} />
          </div>

          {top.slice(3).map((e) => (
            <Row key={e.user_id} entry={e} mine={me && e.user_id === me.user_id} />
          ))}

          {showMeRow && (
            <div className="mt-4">
              <Row entry={me} mine />
            </div>
          )}

          {top.length === 0 && (
            <p className="text-center text-[14px] text-slate-500 py-12">No points awarded yet.</p>
          )}
        </div>
      ) : tab === 'criteria' ? (
        <div className="px-5 pt-4">
          {criteria.map((c) => (
            <PointsCard key={c.id} title={c.title} points={c.points} />
          ))}
          {criteria.length === 0 && (
            <p className="text-center text-[14px] text-slate-500 py-12">No criteria yet.</p>
          )}
        </div>
      ) : (
        <div className="px-5 pt-4">
          {myPoints.earned.map((e) => (
            <PointsCard key={e.criteria_id} title={e.title} points={e.points} />
          ))}
          {myPoints.earned.length === 0 && (
            <p className="text-center text-[14px] text-slate-500 py-12">You have not earned any points yet.</p>
          )}
        </div>
      )}

      {/* Admin only */}
      {isAdmin && !loading && (
        <button
          type="button"
          onClick={() => setAwardOpen(true)}
          className="fixed bottom-24 right-5 z-40 flex items-center gap-2 rounded-full bg-[#0000c8] text-white px-5 py-3 text-[14px] font-bold shadow-lg"
        >
          <Plus size={16} /> Award points
        </button>
      )}

      {awardOpen && (
        <AwardSheet
          people={top}
          criteria={criteria}
          onClose={() => setAwardOpen(false)}
          onDone={() => {
            setAwardOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}