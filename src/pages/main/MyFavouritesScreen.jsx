// ============================================================================
// My Favourites (Sessions and Speakers)
// File: src/pages/main/MyFavouritesScreen.jsx
// Route: /my-favourites
// Real API only:
//   GET    /favourites/                       sessions and speakers
//   DELETE /favourites/sessions/{session_id}  remove a session
//   DELETE /favourites/speakers/{speaker_id}  remove a speaker
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, MapPin, Trash2 } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

const initialsOf = (name) =>
  (name || 'S').split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'S';

const formatWhen = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

export default function MyFavouritesScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('sessions');
  const [sessions, setSessions] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/favourites/');
      const data = res?.data?.data || {};
      setSessions(data.sessions || []);
      setSpeakers(data.speakers || []);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load your favourites'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const removeSession = async (s) => {
    setBusyKey(`s-${s.id}`);
    try {
      await apiClient.delete(`/favourites/sessions/${s.id}`);
      toast.success('Removed from favourites');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not remove this session'));
    } finally {
      setBusyKey(null);
    }
  };

  const removeSpeaker = async (sp) => {
    setBusyKey(`p-${sp.id}`);
    try {
      await apiClient.delete(`/favourites/speakers/${sp.id}`);
      toast.success('Removed from favourites');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not remove this speaker'));
    } finally {
      setBusyKey(null);
    }
  };

  const tabClass = (active) =>
    `flex-1 rounded-xl py-2.5 text-sm font-semibold border ${
      active ? 'bg-[#0000c8] text-white border-[#0000c8]' : 'border-slate-300 text-slate-800'
    }`;

  const renderBody = () => {
    if (loading) {
      return (
        <div className="py-16">
          <LoadingSpinner />
        </div>
      );
    }

    if (tab === 'sessions') {
      if (sessions.length === 0) {
        return <p className="text-center text-sm text-slate-500 py-12">No favourite sessions yet.</p>;
      }
      return sessions.map((s) => (
        <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex justify-between items-start gap-2">
            <button
              type="button"
              onClick={() => navigate(`/sessions/${s.id}`)}
              className="flex-1 min-w-0 text-left"
            >
              <p className="text-base font-semibold text-slate-900 line-clamp-2">{s.title}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <Clock size={12} /> {formatWhen(s.start_time)}
              </p>
              {s.location && (
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin size={12} /> {s.location}
                </p>
              )}
            </button>
            <button
              type="button"
              onClick={() => removeSession(s)}
              disabled={busyKey === `s-${s.id}`}
              aria-label={`Remove ${s.title}`}
              className="w-9 h-9 rounded-full border border-red-200 text-red-600 flex items-center justify-center disabled:opacity-50 shrink-0"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ));
    }

    if (speakers.length === 0) {
      return <p className="text-center text-sm text-slate-500 py-12">No favourite speakers yet.</p>;
    }
    return speakers.map((sp) => (
      <div key={sp.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {sp.avatar_url ? (
          <img src={sp.avatar_url} alt={sp.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-600 shrink-0">
            {initialsOf(sp.name)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{sp.name}</p>
          {sp.job_title && <p className="text-xs text-slate-500 truncate">{sp.job_title}</p>}
          {sp.company && <p className="text-xs text-slate-400 truncate">{sp.company}</p>}
        </div>
        <button
          type="button"
          onClick={() => removeSpeaker(sp)}
          disabled={busyKey === `p-${sp.id}`}
          aria-label={`Remove ${sp.name}`}
          className="w-9 h-9 rounded-full border border-red-200 text-red-600 flex items-center justify-center disabled:opacity-50 shrink-0"
        >
          <Trash2 size={16} />
        </button>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28">
      <div className="bg-[#0c1b78] text-white px-4 pt-5 pb-4 flex items-center gap-3">
        <button type="button" onClick={() => navigate('/profile')} aria-label="Back" className="text-white">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">My Favourites</h1>
      </div>

      <div className="flex gap-2 px-4 pt-4">
        <button type="button" onClick={() => setTab('sessions')} className={tabClass(tab === 'sessions')}>
          Sessions ({sessions.length})
        </button>
        <button type="button" onClick={() => setTab('speakers')} className={tabClass(tab === 'speakers')}>
          Speakers ({speakers.length})
        </button>
      </div>

      <div className="px-4 pt-4 space-y-3">{renderBody()}</div>
    </div>
  );
}