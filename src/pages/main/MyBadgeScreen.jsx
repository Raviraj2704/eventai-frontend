// ============================================================================
// My Badge (Earned and All badges)
// File: src/pages/main/MyBadgeScreen.jsx
// Route: /my-badges
// Real API only:
//   GET /badges?limit=100        all badges (with is_earned_by_user)
//   GET /badges/earned           badges you have earned
// ============================================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Award, Lock } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

const RARITY_STYLE = {
  common: 'bg-slate-100 text-slate-700',
  rare: 'bg-sky-100 text-sky-800',
  epic: 'bg-purple-100 text-purple-800',
  legendary: 'bg-amber-100 text-amber-800',
};

const listFrom = (body, key) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.[key])) return body.data[key];
  if (Array.isArray(body?.[key])) return body[key];
  return [];
};

function BadgeCard({ badge, earned }) {
  const style = RARITY_STYLE[(badge.rarity || '').toLowerCase()] || RARITY_STYLE.common;
  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col items-center text-center gap-2 ${
        earned ? 'border-slate-200 bg-white shadow-sm' : 'border-dashed border-slate-300 bg-slate-50 opacity-70'
      }`}
    >
      {badge.icon_url ? (
        <img src={badge.icon_url} alt={badge.name} className="w-16 h-16 object-contain" />
      ) : (
        <div className="w-16 h-16 rounded-full bg-[#0c1b78] text-white flex items-center justify-center">
          <Award size={28} />
        </div>
      )}
      <p className="text-sm font-semibold text-slate-900">{badge.name}</p>
      {badge.rarity && (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${style}`}>
          {badge.rarity}
        </span>
      )}
      {earned ? (
        <p className="text-xs text-emerald-700 font-semibold">Earned</p>
      ) : (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <Lock size={12} /> Locked
        </p>
      )}
    </div>
  );
}

export default function MyBadgeScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('earned');
  const [earned, setEarned] = useState([]);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [earnedRes, allRes] = await Promise.all([
          apiClient.get('/badges/earned'),
          apiClient.get('/badges', { params: { limit: 100 } }),
        ]);
        if (cancelled) return;
        setEarned(listFrom(earnedRes?.data, 'badges'));
        setAll(listFrom(allRes?.data, 'badges'));
      } catch (error) {
        if (!cancelled) toast.error(getErrorMessage(error, 'Could not load your badges'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const tabClass = (active) =>
    `flex-1 rounded-xl py-2.5 text-sm font-semibold border ${
      active ? 'bg-[#0000c8] text-white border-[#0000c8]' : 'border-slate-300 text-slate-800'
    }`;

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28">
      <div className="bg-[#0c1b78] text-white px-4 pt-5 pb-4 flex items-center gap-3">
        <button type="button" onClick={() => navigate('/profile')} aria-label="Back" className="text-white">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">My Badge</h1>
      </div>

      <div className="flex gap-2 px-4 pt-4">
        <button type="button" onClick={() => setTab('earned')} className={tabClass(tab === 'earned')}>
          Earned ({earned.length})
        </button>
        <button type="button" onClick={() => setTab('all')} className={tabClass(tab === 'all')}>
          All badges ({all.length})
        </button>
      </div>

      <div className="px-4 pt-4">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner />
          </div>
        ) : tab === 'earned' ? (
          earned.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-12">
              No badges yet. Complete challenges and activities to earn them.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {earned.map((b) => (
                <BadgeCard key={`e-${b.id}`} badge={b} earned />
              ))}
            </div>
          )
        ) : all.length === 0 ? (
          <p className="text-center text-sm text-slate-500 py-12">No badges have been added yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {all.map((b) => (
              <BadgeCard key={`a-${b.id}`} badge={b} earned={Boolean(b.is_earned_by_user)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}