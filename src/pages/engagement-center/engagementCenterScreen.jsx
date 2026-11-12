// ============================================================================
// Engagement Center (Clean Adobe XD Design)
// File: src/pages/engagement-center/engagementCenterScreen.jsx
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ChevronLeft, Plus, Trash2, X, CheckCircle2, Crown, MessageSquare, Bell
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

const readOptions = (poll) =>
  (Array.isArray(poll.options) ? poll.options : []).map((o) => ({
    id: o.id ?? o.option_id,
    text: o.option_text ?? o.text ?? o.label ?? '',
    votes: Number(o.vote_count ?? o.votes ?? o.votes_count ?? 0),
  }));

const readMyVote = (poll) =>
  poll.my_vote_option_id ?? poll.user_vote_option_id ?? poll.voted_option_id ?? null;

// ----------------------------------------------------------------------------
// Leaderboard Podium (Exact XD Design)
// ----------------------------------------------------------------------------
function Podium({ top }) {
  const order = [top[1], top[0], top[2]];
  
  return (
    <div className="flex items-end justify-center gap-3 pt-8 pb-4">
      {order.map((entry, i) => {
        if (!entry) return <div key={`empty-${i}`} className="flex-1" />;
        const isFirst = entry.rank === 1;
        
        return (
          <div
            key={entry.user_id ?? i}
            className={`flex-1 flex flex-col items-center text-center rounded-3xl p-4 relative ${
              isFirst ? 'bg-[#0000c8] text-white shadow-xl shadow-blue-900/20 -mt-6 z-10' : 'bg-white border border-slate-100 shadow-sm text-slate-900'
            }`}
          >
            {isFirst && (
              <Crown size={28} className="absolute -top-7 left-1/2 -translate-x-1/2 text-amber-400 fill-amber-400 drop-shadow-md" />
            )}
            
            <p className={`text-[15px] font-black mb-3 ${isFirst ? 'text-white' : 'text-slate-800'}`}>
              #{entry.rank}
            </p>

            <div className="relative mb-3">
              {entry.avatar_url ? (
                <img
                  src={entry.avatar_url}
                  alt={entry.name}
                  className={`${isFirst ? 'w-20 h-20' : 'w-14 h-14'} rounded-full object-cover ring-4 ${isFirst ? 'ring-blue-700/50' : 'ring-slate-50'}`}
                />
              ) : (
                <div
                  className={`${isFirst ? 'w-20 h-20 text-xl' : 'w-14 h-14 text-base'} rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold ring-4 ${isFirst ? 'ring-blue-700/50' : 'ring-slate-50'}`}
                >
                  {initialsOf(entry.name)}
                </div>
              )}
            </div>
            
            <p className={`text-[12px] font-semibold truncate w-full mb-1 ${isFirst ? 'text-white' : 'text-slate-600'}`}>
              {entry.name}
            </p>
            <p className={`text-[18px] font-black ${isFirst ? 'text-white' : 'text-[#0000c8]'}`}>
              {entry.total_points}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Polls Tab
// ----------------------------------------------------------------------------
function PollsTab({ isAdmin, polls, loading, onVote, onDelete, busyId, setCreateOpen }) {
  if (loading) {
    return <div className="py-24 flex justify-center"><LoadingSpinner /></div>;
  }

  return (
    <div className="px-5 pt-6 space-y-5 pb-24">
      {/* Organizer Create Button */}
      {isAdmin && (
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#0000c8] text-white py-3.5 text-[14px] font-bold shadow-md hover:bg-blue-800 transition mb-2"
        >
          <Plus size={18} strokeWidth={2.5} /> Create poll
        </button>
      )}

      {polls.length === 0 && !isAdmin ? (
        <p className="text-center text-sm font-medium text-slate-500 py-12 bg-slate-50 rounded-2xl border border-slate-100">No active polls right now.</p>
      ) : (
        polls.map((poll) => {
          const options = readOptions(poll);
          const total = Number(poll.total_votes ?? options.reduce((sum, o) => sum + o.votes, 0));
          const myVote = readMyVote(poll);
          const hasVoted = myVote !== null && myVote !== undefined;

          return (
            <div key={poll.id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_2px_15px_rgb(0,0,0,0.04)]">
              <div className="flex justify-between items-start gap-3 mb-4">
                <div className="min-w-0">
                  <p className="text-[16px] font-bold text-slate-900 leading-tight">{poll.question}</p>
                  {poll.description && <p className="text-[13px] font-medium text-slate-500 mt-1.5">{poll.description}</p>}
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => onDelete(poll)}
                    disabled={busyId === poll.id}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-red-50 hover:text-red-500 text-slate-400 transition flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {options.map((opt) => {
                  const percent = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                  const selected = hasVoted && Number(myVote) === Number(opt.id);

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={hasVoted || busyId === poll.id}
                      onClick={() => onVote(poll, opt.id)}
                      className={`relative w-full overflow-hidden rounded-xl border-2 px-4 py-3.5 text-left text-[14px] font-bold transition-all disabled:cursor-default ${
                        selected ? 'border-[#0000c8] text-[#0000c8] bg-blue-50/40' : 'border-slate-100 text-slate-700 bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      {hasVoted && (
                        <span className={`absolute inset-y-0 left-0 transition-all duration-1000 ${selected ? 'bg-blue-100' : 'bg-slate-200/60'}`} style={{ width: `${percent}%` }} aria-hidden="true" />
                      )}
                      <span className="relative flex justify-between items-center gap-2">
                        <span className="flex items-center gap-2">
                          {selected && <CheckCircle2 size={18} className="text-[#0000c8]" />}
                          {opt.text}
                        </span>
                        {hasVoted && <span>{percent}%</span>}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="text-[12px] font-bold text-slate-400 mt-5 text-right">
                {total} {total === 1 ? 'vote' : 'votes'} {hasVoted ? ' • You voted' : ''}
              </p>
            </div>
          );
        })
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Leaderboard Tab
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
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="py-24 flex justify-center"><LoadingSpinner /></div>;
  }

  return (
    <div className="px-5 pt-4 pb-24 space-y-6">
      
      {top.length >= 3 && <Podium top={top} />}
      {top.length === 0 && <p className="text-center text-sm font-medium text-slate-500 py-12 bg-slate-50 rounded-2xl border border-slate-100 mt-6">No points earned yet.</p>}

      {top.length > 0 && (
        <div className="space-y-3">
          {top.map((entry) => (
            <div key={entry.user_id ?? entry.rank} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex items-center gap-4">
              <span className="w-8 text-[16px] font-black text-[#0000c8]">#{entry.rank}</span>
              
              {entry.avatar_url ? (
                <img src={entry.avatar_url} alt={entry.name} className="w-12 h-12 rounded-full object-cover shadow-sm" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-[14px] font-bold text-slate-600 shadow-sm">
                  {initialsOf(entry.name)}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-slate-900 truncate">{entry.name}</p>
                {/* Highlight logged-in user dynamically */}
                {me && entry.user_id === me.user_id && (
                  <p className="text-[12px] font-bold text-[#0000c8]">You</p>
                )}
              </div>
              
              <p className="text-[16px] font-black text-slate-900">{entry.total_points}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Create Poll Sheet (Organizer Modal)
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
      toast.success('Poll created successfully');
      onCreated();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not create the poll'));
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-[14px] font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0000c8]/20 focus:border-[#0000c8] transition';

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-end justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[430px] rounded-t-[28px] sm:rounded-[28px] flex flex-col shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[90vh]">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <h3 className="text-[18px] font-bold text-slate-900">Create poll</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-[13px] font-bold text-slate-900 mb-2">Question</label>
            <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What do you want to ask?" className={inputClass} />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-slate-900 mb-2">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Add context..." className={`${inputClass} resize-none`} />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-slate-900 mb-2">Options</label>
            <div className="space-y-3">
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
                      className="shrink-0 w-[50px] rounded-xl border border-slate-200 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 flex items-center justify-center transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {options.length < MAX_OPTIONS && (
              <button type="button" onClick={addOption} className="mt-4 text-[13px] font-bold text-[#0000c8] flex items-center gap-1 hover:text-blue-800 transition">
                <Plus size={16} strokeWidth={3} /> Add option
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-[#0000c8] text-white py-4 text-[15px] font-bold shadow-md hover:bg-blue-800 transition disabled:opacity-50 mt-4"
          >
            {saving ? 'Creating...' : 'Create poll'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Main Screen Export
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
      toast.success('Thanks for voting!');
      await loadPolls();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not record your vote'));
    } finally {
      setBusyId(null);
    }
  };

  const removePoll = async (poll) => {
    if (!window.confirm('Delete this poll and all its votes?')) return;
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
    <div className="min-h-screen bg-white max-w-[430px] mx-auto font-sans relative">
      
      {/* Clean White Header (Exact XD Match) */}
      <div className="bg-white text-slate-900 px-5 pt-5 pb-3 flex items-center gap-3 sticky top-0 z-20">
        <button type="button" onClick={() => navigate('/hub')} aria-label="Back" className="text-slate-800 hover:text-black transition-colors">
          <ChevronLeft size={26} strokeWidth={2.5} />
        </button>
        <h1 className="text-[20px] font-bold tracking-tight">Engagement Center</h1>
      </div>

      {/* Clean Text Tabs (Exact XD Match) */}
      <div className="bg-white flex px-6 pt-1 pb-0 border-b border-slate-100 shadow-sm sticky top-[60px] z-10">
        {['polls', 'leaderboard'].map((t) => {
          const isActive = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 text-center pb-3 pt-3 text-[15px] font-bold transition-all relative capitalize ${
                isActive ? 'text-[#0000c8]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t}
              {isActive && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0000c8]" />}
            </button>
          );
        })}
      </div>

      {tab === 'polls' ? (
        <PollsTab
          isAdmin={isAdmin}
          polls={polls}
          loading={loadingPolls}
          busyId={busyId}
          onVote={vote}
          onDelete={removePoll}
          setCreateOpen={setCreateOpen}
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