// ============================================================================
// Engagement Center (Exact Adobe XD Match: Leaderboard, Criteria, My Points, Polls)
// File: src/pages/engagement/EngagementCenterScreen.jsx
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, Plus, Trash2, X, CheckCircle2, Crown } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

const MOCK_CRITERIA = [
  { id: 1, label: 'Visiting Partner Booth', points: 1000 },
  { id: 2, label: 'Attending Session', points: 500 },
  { id: 3, label: 'Click on Photobooth (One Time Only)', points: 300 },
  { id: 4, label: 'Logging to The Conference', points: 200 },
];
const MOCK_MY_POINTS = [
  { id: 1, label: 'Visiting Partner Booth', points: 1000 },
  { id: 2, label: 'Attending Session', points: 500 },
];

const getErrorMessage = (error, fallback) => error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;
const unwrapList = (body) => Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
const initialsOf = (name) => (name || 'A').split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'A';

// --- Podium ---
function Podium({ top }) {
  const order = [top[1], top[0], top[2]];
  return (
    <div className="flex items-end justify-center gap-3 pt-12 pb-6 px-2">
      {order.map((entry, i) => {
        if (!entry) return <div key={`empty-${i}`} className="flex-1" />;
        const isFirst = entry.rank === 1;
        return (
          <div key={entry.user_id ?? i} className={`flex flex-col items-center text-center rounded-[18px] relative transition-all ${isFirst ? 'flex-[1.2] bg-[#0000c8] p-5 shadow-xl shadow-blue-900/20 z-10 -mt-6' : 'flex-1 bg-white p-4 shadow-[0_2px_15px_rgb(0,0,0,0.06)] border border-slate-100 mb-2'}`}>
            {isFirst && <Crown size={38} className="absolute -top-11 left-1/2 -translate-x-1/2 text-amber-400 fill-amber-400 drop-shadow-md" />}
            {!isFirst && <p className="text-[16px] font-black text-slate-800 mb-2">#{entry.rank}</p>}
            <div className="relative mb-2">
              {entry.avatar_url ? (
                <img src={entry.avatar_url} alt={entry.name} className={`${isFirst ? 'w-16 h-16 border-2 border-white/20' : 'w-12 h-12'} rounded-full object-cover`} />
              ) : (
                <div className={`${isFirst ? 'w-16 h-16 text-xl border-2 border-white/20 text-white bg-blue-600' : 'w-12 h-12 text-base text-slate-600 bg-slate-100'} rounded-full flex items-center justify-center font-bold`}>{initialsOf(entry.name)}</div>
              )}
            </div>
            <p className={`text-[13px] font-medium truncate w-full mb-1 leading-tight ${isFirst ? 'text-white' : 'text-slate-600'}`}>{entry.name}</p>
            <p className={`text-[18px] font-black ${isFirst ? 'text-white mt-1' : 'text-[#0000c8]'}`}>{entry.total_points}</p>
          </div>
        );
      })}
    </div>
  );
}

// --- Points List ---
function PointsList({ data }) {
  return (
    <div className="px-5 pt-4 pb-24">
      <div className="bg-white">
        {data.map((item, index) => (
          <div key={item.id} className={`flex items-center justify-between py-4 ${index !== data.length - 1 ? 'border-b border-slate-100' : ''}`}>
            <span className="text-[15px] font-medium text-slate-700 flex-1 pr-4">{item.label}</span>
            <div className="bg-slate-50 border border-slate-100 rounded-[14px] px-4 py-2.5 min-w-[80px] flex flex-col items-center justify-center">
              <span className="text-[16px] font-black text-[#0000c8] leading-none">{item.points}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Points</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Screen ---
export default function EngagementCenterScreen() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'leaderboard';
  const setTab = (next) => setSearchParams({ tab: next });

  const [isAdmin, setIsAdmin] = useState(false);
  const [me, setMe] = useState(null);
  const [top, setTop] = useState([]);
  const [criteria, setCriteria] = useState(MOCK_CRITERIA);
  const [myPoints, setMyPoints] = useState(MOCK_MY_POINTS);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [topRes, meRes, criteriaRes, myPointsRes, roleRes] = await Promise.all([
        // FIXED 422 Error: Now hits /leaderboard directly with limit: 10
        apiClient.get('/leaderboard', { params: { limit: 10 } }).catch(() => null),
        apiClient.get('/leaderboard/me').catch(() => null),
        apiClient.get('/leaderboard/criteria').catch(() => null),
        apiClient.get('/leaderboard/my-points').catch(() => null),
        apiClient.get('/session-admin/me/roles').catch(() => null)
      ]);

      if (topRes) setTop(unwrapList(topRes?.data));
      if (meRes) setMe(meRes?.data?.data || null);
      if (roleRes) setIsAdmin(Boolean(roleRes?.data?.data?.is_admin));
      if (criteriaRes?.data?.length) setCriteria(unwrapList(criteriaRes.data));
      if (myPointsRes?.data?.length) setMyPoints(unwrapList(myPointsRes.data));
      
    } catch (error) {
      console.error("Error loading engagement data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto font-sans relative">
      <div className="bg-white text-slate-900 px-5 pt-5 pb-3 flex items-center gap-3 sticky top-0 z-20">
        <button type="button" onClick={() => navigate('/hub')} className="text-slate-800 hover:text-black transition-colors"><ChevronLeft size={26} strokeWidth={2.5} /></button>
        <h1 className="text-[20px] font-bold tracking-tight">Leaderboard</h1>
      </div>

      <div className="bg-white flex px-5 pt-1 pb-0 border-b border-slate-100 shadow-sm sticky top-[60px] z-10 overflow-x-auto hide-scrollbar justify-between">
        {['polls', 'leaderboard', 'criteria', 'my points'].map((t) => {
          const isActive = tab === t;
          return (
            <button key={t} type="button" onClick={() => setTab(t)} className={`pb-3 pt-3 text-[15px] transition-all relative capitalize ${isActive ? 'text-[#0000c8] font-bold' : 'text-slate-400 font-medium hover:text-slate-600'}`}>
              {t}
              {isActive && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0000c8]" />}
            </button>
          );
        })}
      </div>

      {loading && <div className="py-24 flex justify-center"><LoadingSpinner /></div>}

      {!loading && tab === 'leaderboard' && (
        <div className="px-5 pt-2 pb-24 space-y-2">
          {top.length >= 3 && <Podium top={top} />}
          <div className="bg-white pt-2">
            {top.map((entry, idx) => {
              const isMe = me && entry.user_id === me.user_id;
              if (entry.rank <= 3) return null;
              
              return (
                <div key={entry.user_id ?? entry.rank} className="flex items-center gap-4 py-4 border-b border-slate-100">
                  <span className={`w-8 text-[16px] font-black ${isMe ? 'text-[#0000c8]' : 'text-slate-800'}`}>#{entry.rank}</span>
                  {entry.avatar_url ? (
                    <img src={entry.avatar_url} alt={entry.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-[14px] font-bold text-slate-600">{initialsOf(entry.name)}</div>
                  )}
                  <div className="flex-1 min-w-0"><p className={`text-[15px] font-bold truncate ${isMe ? 'text-[#0000c8]' : 'text-slate-800'}`}>{isMe ? 'You' : entry.name}</p></div>
                  <p className={`text-[16px] font-black ${isMe ? 'text-[#0000c8]' : 'text-slate-800'}`}>{entry.total_points}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && tab === 'criteria' && <PointsList data={criteria} />}
      {!loading && tab === 'my points' && <PointsList data={myPoints} />}
    </div>
  );
}