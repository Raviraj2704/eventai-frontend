// ============================================================================
// Engagement Center (matches the reference video)
// File: src/pages/engagement-center/engagementCenterScreen.jsx
// Routes: /engagement-center            (Polls)
//         /engagement-center?tab=leaderboard
// Real API only:
//   GET    /session-admin/me/roles         is this account an organizer
//   GET    /engagement/polls               poll list
//   POST   /engagement/polls               create poll (organizer)
//   DELETE /engagement/polls/{id}          delete poll (organizer)
//   POST   /engagement/polls/{id}/vote     vote once per poll
//   GET    /activity/leaderboard/top       top 10 with photos
//   GET    /leaderboard/me                 your own rank and points
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Plus, Trash2, X, CheckCircle2, BarChart3, Trophy, Crown, Bell, MessageSquare,
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

const unwrapList = (body) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
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

// Reads options in whichever shape the backend returns them
const readOptions = (poll) =>
  (Array.isArray(poll.options) ? poll.options : []).map((o) => ({
    id: o.id ?? o.option_id,
    text: o.option_text ?? o.text ?? o.label ?? '',
    votes: Number(o.vote_count ?? o.votes ?? o.votes_count ?? 0),
  }));

const readMyVote = (poll) =>
  poll.my_vote_option_id ?? poll.user_vote_option_id ?? poll.voted_option_id ?? null;

// ----------------------------------------------------------------------------
// Leaderboard podium (same layout as the Home screen)
// ----------------------------------------------------------------------------
function Podium({ top }) {
  const order = [top[1], top[0], top[2]];
  return (
    <div className="flex items-end justify-center gap-2 pt-6">
      {order.map((entry, i) => {
        if (!entry) return <div key={`empty-${i}`} className="flex-1" />;
        const isFirst = entry.rank === 1;
        return (
          <div
            key={entry.user_id ?? i}
            className={`flex-1 flex flex-col items-center text-center rounded-2xl px-2 py-4 ${
              isFirst ? 'bg-[#0000c8] text-white shadow-lg -mt-4' : 'bg-white border border-slate-200 text-slate-900'
            }`}
          >
            <div className="relative">
              {isFirst && (
                <Crown size={22} className="absolute -top-5 left-1/2 -translate-x-1/2 text-amber-400 fill-amber-300" />
              )}
              {entry.avatar_url ? (
                <img
                  src={entry.avatar_url}
                  alt={entry.name}
                  className={`${isFirst ? 'w-20 h-20' : 'w-16 h-16'} rounded-full object-cover ring-4 ring-white`}
                />
              ) : (
                <div
                  className={`${isFirst ? 'w-20 h-20 text-xl' : 'w-16 h-16 text-base'} rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-semibold ring-4 ring-white`}
                >
                  {initialsOf(entry.name)}
                </div>
              )}
            </div>
            <p className={`mt-2 text-xs font-medium ${isFirst ? 'text-white/85' : 'text-slate-500'}`}>
              #{entry.rank}
            </p>
            <p className="text-sm font-semibold truncate w-full">{entry.name}</p>
            <p className={`text-sm font-bold ${isFirst ? 'text-white' : 'text-[#0000c8]'}`}>
              {entry.total_points}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Polls tab
// ----------------------------------------------------------------------------
function PollsTab({ isAdmin, polls, loading, onVote, onDelete, busyId }) {
  if (loading) {
    return (
      <div className="py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (polls.length === 0) {
    return <p className="text-center text-sm text-slate-500 py-12">No active polls right now.</p>;
  }

  return (
    <div className="px-4 pt-4 space-y-4">
      {polls.map((poll) => {
        const options = readOptions(poll);
        const total = Number(poll.total_votes ?? options.reduce((sum, o) => sum + o.votes, 0));
        const myVote = readMyVote(poll);
        const hasVoted = myVote !== null && myVote !== undefined;

        return (
          <div key={poll.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <p className="text-base font-semibold text-slate-900">{poll.question}</p>
                {poll.description && <p className="text-sm text-slate-600 mt-1">{poll.description}</p>}
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onDelete(poll)}
                  disabled={busyId === poll.id}
                  aria-label="Delete poll"
                  className="text-red-600 disabled:opacity-50"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className="mt-4 space-y-2">
              {options.map((opt) => {
                const percent = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                const selected = hasVoted && Number(myVote) === Number(opt.id);

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={hasVoted || busyId === poll.id}
                    onClick={() => onVote(poll, opt.id)}
                    className={`relative w-full overflow-hidden rounded-xl border px-4 py-3 text-left text-sm font-medium disabled:cursor-default ${
                      selected ? 'border-[#0000c8] text-[#0000c8]' : 'border-slate-300 text-slate-800'
                    }`}
                  >
                    {hasVoted && (
                      <span className="absolute inset-y-0 left-0 bg-blue-100" style={{ width: `${percent}%` }} aria-hidden="true" />
                    )}
                    <span className="relative flex justify-between items-center gap-2">
                      <span className="flex items-center gap-2">
                        {selected && <CheckCircle2 size={16} />}
                        {opt.text}
                      </span>
                      {hasVoted && <span>{percent}%</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-slate-500 mt-3">
              {total} {total === 1 ? 'vote' : 'votes'}
              {hasVoted ? ' | You voted' : ''}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Leaderboard tab
// ----------------------------------------------------------------------------
function LeaderboardTab() {
  const [top, setTop] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [topRes, meRes] = await Promise.all([
          apiClient.get('/activity/leaderboard/top', { params: { limit: 10 } }),
          apiClient.get('/leaderboard/me').catch(() => null),
        ]);
        if (cancelled) return;
        setTop(unwrapList(topRes?.data));
        setMe(meRes?.data?.data || null);
      } catch (error) {
        if (!cancelled) toast.error(getErrorMessage(error, 'Could not load the leaderboard'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="py-16">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 space-y-4">
      {me && (
        <div className="rounded-2xl bg-[#0000c8] text-white p-4 flex justify-between items-center">
          <div>
            <p className="text-xs text-white/80">Your rank</p>
            <p className="text-2xl font-bold">#{me.rank ?? '-'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/80">Points</p>
            <p className="text-2xl font-bold">{me.total_points ?? 0}</p>
          </div>
        </div>
      )}

      {top.length >= 3 && <Podium top={top} />}

      {top.length === 0 && <p className="text-center text-sm text-slate-500 py-12">No points earned yet.</p>}

      {top.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-200">
          {top.map((entry) => (
            <div key={entry.user_id ?? entry.rank} className="flex items-center gap-3 p-4">
              <span className="w-7 text-center text-sm font-bold text-slate-500">#{entry.rank}</span>
              {entry.avatar_url ? (
                <img src={entry.avatar_url} alt={entry.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">
                  {initialsOf(entry.name)}
                </div>
              )}
              <p className="flex-1 min-w-0 text-sm font-semibold text-slate-900 truncate">{entry.name}</p>
              <p className="text-sm font-bold text-[#0000c8]">{entry.total_points}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Create poll sheet (organizer)
// ----------------------------------------------------------------------------
function CreatePollSheet({ onClose, onCreated }) {
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [saving, setSaving] = useState(false);

  const setOption = (index, value) =>
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));

  const addOption = () => {
    if (options.length < MAX_OPTIONS) setOptions((prev) => [...prev, '']);
  };

  const removeOption = (index) => {
    if (options.length > MIN_OPTIONS) setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const cleanQuestion = question.trim();
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);

    if (cleanQuestion.length < 3) {
      toast.error('Write the poll question');
      return;
    }
    if (cleanOptions.length < MIN_OPTIONS) {
      toast.error(`Add at least ${MIN_OPTIONS} options`);
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/engagement/polls', {
        question: cleanQuestion,
        description: description.trim() || null,
        options: cleanOptions.map((text) => ({ option_text: text })),
      });
      toast.success('Poll created');
      onCreated();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not create the poll'));
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-[430px] max-h-[90vh] rounded-t-2xl flex flex-col mb-16"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <p className="font-semibold text-slate-900">Create poll</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-800">Question</label>
            <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} className={`${inputClass} mt-1`} />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputClass} mt-1`} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800">Options</label>
            {options.map((opt, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => setOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className={inputClass}
                />
                {options.length > MIN_OPTIONS && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    aria-label={`Remove option ${index + 1}`}
                    className="shrink-0 w-11 h-11 rounded-lg border border-slate-300 text-slate-600 flex items-center justify-center"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            {options.length < MAX_OPTIONS && (
              <button type="button" onClick={addOption} className="text-sm font-semibold text-[#0000c8]">
                + Add option
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-[#0000c8] text-white py-3 font-semibold disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create poll'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Screen
// ----------------------------------------------------------------------------
export default function EngagementCenterScreen() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'leaderboard' ? 'leaderboard' : 'polls';

  const [isAdmin, setIsAdmin] = useState(false);
  const [polls, setPolls] = useState([]);
  const [loadingPolls, setLoadingPolls] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const setTab = (next) => setSearchParams(next === 'leaderboard' ? { tab: 'leaderboard' } : {});

  const loadPolls = useCallback(async () => {
    setLoadingPolls(true);
    try {
      const res = await apiClient.get('/engagement/polls', { params: { limit: 50 } });
      setPolls(unwrapList(res?.data));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load polls'));
      setPolls([]);
    } finally {
      setLoadingPolls(false);
    }
  }, []);

  useEffect(() => {
    apiClient
      .get('/session-admin/me/roles')
      .then((res) => setIsAdmin(Boolean(res?.data?.data?.is_admin)))
      .catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    if (tab === 'polls') loadPolls();
  }, [tab, loadPolls]);

  const vote = async (poll, optionId) => {
    if (busyId !== null) return;
    setBusyId(poll.id);
    try {
      await apiClient.post(`/engagement/polls/${poll.id}/vote`, { option_id: optionId });
      toast.success('Thanks for voting');
      await loadPolls();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not record your vote'));
    } finally {
      setBusyId(null);
    }
  };

  const removePoll = async (poll) => {
    if (!window.confirm('Delete this poll and its votes?')) return;
    setBusyId(poll.id);
    try {
      await apiClient.delete(`/engagement/polls/${poll.id}`);
      toast.success('Poll deleted');
      await loadPolls();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete the poll'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28">
      {/* Header, same style as Hub and Sessions */}
      <div className="bg-[#0c1b78] text-white px-4 pt-5 pb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/hub')} aria-label="Back" className="text-white">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold">Engagement Center</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/networking')}
            aria-label="Messages"
            className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center"
          >
            <MessageSquare size={18} />
          </button>
          <button
            type="button"
            onClick={() => navigate('/announcements')}
            aria-label="Notifications"
            className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center"
          >
            <Bell size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 pt-4">
        <button
          type="button"
          onClick={() => setTab('polls')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold border ${
            tab === 'polls' ? 'bg-[#0000c8] text-white border-[#0000c8]' : 'border-slate-300 text-slate-800'
          }`}
        >
          <BarChart3 size={16} />
          Polls
        </button>
        <button
          type="button"
          onClick={() => setTab('leaderboard')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold border ${
            tab === 'leaderboard' ? 'bg-[#0000c8] text-white border-[#0000c8]' : 'border-slate-300 text-slate-800'
          }`}
        >
          <Trophy size={16} />
          Leaderboard
        </button>
      </div>

      {/* Organizer-only Create button, shown on the Polls tab */}
      {tab === 'polls' && isAdmin && (
        <div className="px-4 pt-4">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0000c8] text-white py-3 font-semibold"
          >
            <Plus size={18} />
            Create poll
          </button>
        </div>
      )}

      {tab === 'polls' ? (
        <PollsTab
          isAdmin={isAdmin}
          polls={polls}
          loading={loadingPolls}
          busyId={busyId}
          onVote={vote}
          onDelete={removePoll}
        />
      ) : (
        <LeaderboardTab />
      )}

      {createOpen && (
        <CreatePollSheet
          onClose={() => setCreateOpen(false)}
          onCreated={async () => {
            setCreateOpen(false);
            await loadPolls();
          }}
        />
      )}
    </div>
  );
}