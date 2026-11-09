// ============================================================================
// Activity Hub (one screen: stats, feed, challenges, activities, leaderboard)
// File: src/pages/engagement/ActivityHubScreen.jsx
// Route: /activity-hub
// Real API only:
//   GET    /leaderboard/me                  your points, rank, badges
//   GET    /social/wall                     feed
//   POST   /social/posts                    create a post
//   GET    /challenges                      challenges
//   POST   /challenges/{id}/join            join a challenge
//   POST   /challenges                      organizer: create challenge
//   DELETE /challenges/{id}                 organizer: delete challenge
//   GET    /engagement/activities           activities
//   POST   /engagement/activities           organizer: create activity
//   DELETE /engagement/activities/{id}      organizer: delete activity
//   GET    /leaderboard                     top attendees
//   GET    /session-admin/me/roles          is this account an organizer
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, X, Trophy, Zap, Medal, Target, Send } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SocialPostCard, { CommentsSheet } from '../../components/social/SocialPostCard';
import apiClient from '../../config/apiClient';

const TABS = [
  { key: 'feed', label: 'Feed' },
  { key: 'challenges', label: 'Challenges' },
  { key: 'activities', label: 'Activities' },
  { key: 'leaderboard', label: 'Leaderboard' },
];

const getErrorMessage = (error, fallback) => {
  const detail = error?.data?.detail ?? error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => `${(d.loc || []).slice(1).join('.')}: ${d.msg}`).join(', ') || fallback;
  }
  return error?.message || fallback;
};

const initialsOf = (name) =>
  (name || 'A').split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'A';

const DIFFICULTY_STYLE = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
};

const PRIORITY_STYLE = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
};

// ----------------------------------------------------------------------------
// Stats strip
// ----------------------------------------------------------------------------
function StatsStrip({ stats }) {
  const items = [
    { label: 'Your Points', value: stats?.total_points ?? 0, Icon: Zap, color: 'text-[#0000c8]' },
    { label: 'Your Rank', value: stats?.rank ? `#${stats.rank}` : '-', Icon: Medal, color: 'text-amber-600' },
    { label: 'Badges Earned', value: stats?.badges_earned ?? 0, Icon: Trophy, color: 'text-sky-600' },
    { label: 'Challenges Done', value: stats?.challenges_completed ?? 0, Icon: Target, color: 'text-purple-700' },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 px-4 pt-4">
      {items.map(({ label, value, Icon, color }) => (
        <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <Icon size={20} className={color} />
            <span className="text-xl font-bold text-slate-900">{value}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Create sheet (organizers only): challenge or activity
// ----------------------------------------------------------------------------
function CreateSheet({ kind, onClose, onCreated }) {
  const isChallenge = kind === 'challenge';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState(isChallenge ? 'Medium' : 'medium');
  const [points, setPoints] = useState(isChallenge ? 50 : 25);
  const [days, setDays] = useState(7);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (title.trim().length < 3) {
      toast.error('Enter a title');
      return;
    }

    setSaving(true);
    try {
      if (isChallenge) {
        await apiClient.post('/challenges', {
          title: title.trim(),
          description: description.trim(),
          difficulty: level,
          points_reward: Number(points) || 50,
          duration_days: Number(days) || 7,
        });
      } else {
        await apiClient.post('/engagement/activities', {
          title: title.trim(),
          description: description.trim(),
          priority: level,
          points_reward: Number(points) || 25,
        });
      }
      toast.success(isChallenge ? 'Challenge created' : 'Activity created');
      onCreated();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save. Please try again.'));
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
          <p className="font-semibold text-slate-900">{isChallenge ? 'New challenge' : 'New activity'}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-800">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={`${inputClass} mt-1`} />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inputClass} mt-1`} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-slate-800">{isChallenge ? 'Difficulty' : 'Priority'}</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className={`${inputClass} mt-1`}>
                {isChallenge ? (
                  <>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </>
                ) : (
                  <>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-800">Points</label>
              <input type="number" value={points} onChange={(e) => setPoints(e.target.value)} className={`${inputClass} mt-1`} />
            </div>
          </div>

          {isChallenge && (
            <div>
              <label className="text-sm font-semibold text-slate-800">Duration (days)</label>
              <input type="number" value={days} onChange={(e) => setDays(e.target.value)} className={`${inputClass} mt-1`} />
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-[#0000c8] text-white py-3 font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Challenges tab
// ----------------------------------------------------------------------------
function ChallengesTab({ items, loading, isAdmin, onJoin, onDelete, joiningId }) {
  if (loading) return <div className="py-16"><LoadingSpinner /></div>;
  if (items.length === 0) return <p className="text-center text-sm text-slate-500 py-12">No challenges yet.</p>;

  return items.map((c) => {
    const difficulty = (c.difficulty || 'Medium').toLowerCase();
    const joined = Boolean(c.user_joined);
    return (
      <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-base font-semibold text-slate-900">{c.title}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${DIFFICULTY_STYLE[difficulty] || 'bg-slate-100 text-slate-700'}`}>
              {c.difficulty || 'Medium'}
            </span>
          </div>
          {isAdmin && (
            <button type="button" onClick={() => onDelete(c, 'challenge')} aria-label="Delete challenge" className="text-red-600">
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {c.description && <p className="text-sm text-slate-600">{c.description}</p>}

        <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
          <div><p className="font-semibold text-slate-900">{c.participant_count || 0}</p>Participants</div>
          <div><p className="font-semibold text-[#0000c8]">+{c.points_reward || 50} pts</p>Reward</div>
          <div><p className="font-semibold text-slate-900">{c.duration_days || 7} days</p>Duration</div>
        </div>

        <button
          type="button"
          onClick={() => onJoin(c)}
          disabled={joined || joiningId === c.id}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60 ${
            joined ? 'border border-emerald-600 text-emerald-700' : 'bg-[#0000c8] text-white'
          }`}
        >
          <Trophy size={16} />
          {joined ? 'Joined' : joiningId === c.id ? 'Joining...' : 'Join challenge'}
        </button>
      </div>
    );
  });
}

// ----------------------------------------------------------------------------
// Activities tab
// ----------------------------------------------------------------------------
function ActivitiesTab({ items, loading, isAdmin, onDelete }) {
  if (loading) return <div className="py-16"><LoadingSpinner /></div>;
  if (items.length === 0) return <p className="text-center text-sm text-slate-500 py-12">No activities yet.</p>;

  return items.map((a) => (
    <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-base font-semibold text-slate-900">{a.title}</p>
          {a.description && <p className="text-sm text-slate-600 mt-1">{a.description}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_STYLE[(a.priority || '').toLowerCase()] || 'bg-slate-100 text-slate-700'}`}>
            {a.priority || 'normal'}
          </span>
          {isAdmin && (
            <button type="button" onClick={() => onDelete(a, 'activity')} aria-label="Delete activity" className="text-red-600">
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600">
        Reward: <span className="font-semibold text-[#0000c8]">+{a.points_reward || 25} pts</span>
      </p>
    </div>
  ));
}

// ----------------------------------------------------------------------------
// Leaderboard tab
// ----------------------------------------------------------------------------
function LeaderboardTab({ items, loading }) {
  if (loading) return <div className="py-16"><LoadingSpinner /></div>;
  if (items.length === 0) return <p className="text-center text-sm text-slate-500 py-12">No points earned yet.</p>;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-200 overflow-hidden">
      {items.map((entry, index) => {
        const name = entry.user?.first_name
          ? `${entry.user.first_name} ${entry.user.last_name || ''}`.trim()
          : entry.username || 'Attendee';
        return (
          <div key={entry.user_id ?? index} className="flex items-center gap-3 p-4">
            <span className="w-8 text-center text-sm font-bold text-slate-500">
              {index < 3 ? <Medal size={18} className={index === 0 ? 'text-amber-500 mx-auto' : index === 1 ? 'text-slate-400 mx-auto' : 'text-orange-400 mx-auto'} /> : `#${index + 1}`}
            </span>
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600 shrink-0">
              {initialsOf(name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
              <p className="text-xs text-slate-500 truncate">{entry.user?.job_title || entry.tier || 'bronze'}</p>
            </div>
            <p className="text-sm font-bold text-[#0000c8]">{entry.total_points || 0}</p>
          </div>
        );
      })}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Screen
// ----------------------------------------------------------------------------
export default function ActivityHubScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('feed');
  const [isAdmin, setIsAdmin] = useState(false);
  const [me, setMe] = useState(null);
  const [stats, setStats] = useState(null);

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentPost, setCommentPost] = useState(null);

  const [challenges, setChallenges] = useState([]);
  const [challengesLoading, setChallengesLoading] = useState(false);
  const [joiningId, setJoiningId] = useState(null);

  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const [createKind, setCreateKind] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await apiClient.get('/leaderboard/me');
      setStats(res?.data?.data ?? res?.data ?? null);
    } catch {
      setStats(null);
    }
  }, []);

  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const res = await apiClient.get('/social/wall', { params: { page: 1, limit: 20 } });
      setPosts(res?.data?.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load the feed'));
    } finally {
      setPostsLoading(false);
    }
  }, []);

  const loadChallenges = useCallback(async () => {
    setChallengesLoading(true);
    try {
      const res = await apiClient.get('/challenges', { params: { limit: 12 } });
      setChallenges(unwrap(res?.data));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load challenges'));
    } finally {
      setChallengesLoading(false);
    }
  }, []);

  const loadActivities = useCallback(async () => {
    setActivitiesLoading(true);
    try {
      const res = await apiClient.get('/engagement/activities', { params: { limit: 20 } });
      setActivities(unwrap(res?.data));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load activities'));
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const res = await apiClient.get('/leaderboard', { params: { limit: 10 } });
      setLeaderboard(unwrap(res?.data));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load the leaderboard'));
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  // One-time setup
  useEffect(() => {
    loadStats();
    loadPosts();
    apiClient
      .get('/users/me')
      .then((res) => setMe(res?.data?.data ?? res?.data ?? null))
      .catch(() => setMe(null));
    apiClient
      .get('/session-admin/me/roles')
      .then((res) => setIsAdmin(Boolean(res?.data?.data?.is_admin)))
      .catch(() => setIsAdmin(false));
  }, [loadStats, loadPosts]);

  // Load each tab when it opens
  useEffect(() => {
    if (tab === 'feed') loadPosts();
    if (tab === 'challenges') loadChallenges();
    if (tab === 'activities') loadActivities();
    if (tab === 'leaderboard') loadLeaderboard();
  }, [tab, loadPosts, loadChallenges, loadActivities, loadLeaderboard]);

  const publish = async () => {
    const content = draft.trim();
    if (!content || posting) return;
    setPosting(true);
    try {
      await apiClient.post('/social/posts', { content });
      setDraft('');
      toast.success('Posted');
      await loadPosts();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not post. Please try again.'));
    } finally {
      setPosting(false);
    }
  };

    const joinChallenge = async (challenge) => {
    setJoiningId(challenge.id);
    try {
      await apiClient.post(`/challenges/${challenge.id}/join`);
      toast.success('Joined challenge');
    } catch (error) {
      if (error?.status === 409) {
        toast('You already joined this challenge');
      } else {
        toast.error(getErrorMessage(error, 'Could not join this challenge'));
        setJoiningId(null);
        return;
      }
    }
    setChallenges((prev) =>
      prev.map((c) => (c.id === challenge.id ? { ...c, user_joined: true } : c))
    );
    setJoiningId(null);
    loadStats();
  };

  const removeItem = async (item, kind) => {
    if (!window.confirm(`Delete this ${kind}?`)) return;
    try {
      const path = kind === 'challenge' ? `/challenges/${item.id}` : `/engagement/activities/${item.id}`;
      await apiClient.delete(path);
      toast.success('Deleted');
      if (kind === 'challenge') loadChallenges();
      else loadActivities();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete this item'));
    }
  };

  const bumpComments = (postId, delta) =>
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comment_count: Math.max(0, (p.comment_count || 0) + delta) } : p))
    );

  const myName = me?.first_name || me?.username || 'Me';

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-[#0c1b78] to-[#5b2bd6] text-white px-4 pt-5 pb-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/hub')} aria-label="Back" className="text-white">
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-2xl font-bold">Activity Hub</h1>
          </div>
          {isAdmin && (tab === 'challenges' || tab === 'activities') && (
            <button
              type="button"
              onClick={() => setCreateKind(tab === 'challenges' ? 'challenge' : 'activity')}
              className="flex items-center gap-1 rounded-lg bg-white text-[#0c1b78] px-3 py-1.5 text-sm font-semibold"
            >
              <Plus size={16} /> New
            </button>
          )}
        </div>
        <p className="mt-2 text-sm text-white/80">
          Join challenges, take part in activities, and climb the leaderboard.
        </p>
      </div>

      <StatsStrip stats={stats} />

      {/* Tabs */}
      <div className="flex gap-2 px-4 pt-5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold border ${
              tab === t.key ? 'bg-[#0000c8] text-white border-[#0000c8]' : 'border-slate-300 text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4 pb-4 space-y-4">
        {tab === 'feed' && (
          <>
            {/* Composer */}
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
              {me?.avatar_url ? (
                <img src={me.avatar_url} alt={myName} className="w-11 h-11 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold shrink-0">
                  {initialsOf(myName)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={2}
                  placeholder="Join the conversation. Share your thoughts with #SHRMIAC26."
                  className="w-full resize-none text-sm text-slate-700 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={publish}
                    disabled={posting || !draft.trim()}
                    className="flex items-center gap-1 rounded-lg bg-[#0000c8] text-white px-4 py-1.5 text-sm font-semibold disabled:opacity-50"
                  >
                    <Send size={14} /> {posting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </div>

            {postsLoading ? (
              <div className="py-16"><LoadingSpinner /></div>
            ) : posts.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-12">No activity yet. Be the first to post.</p>
            ) : (
              posts.map((post) => (
                <SocialPostCard
                  key={post.id}
                  post={post}
                  variant="hub"
                  onChanged={loadPosts}
                  onComment={setCommentPost}
                  onDeleted={() => {}}
                />
              ))
            )}
          </>
        )}

        {tab === 'challenges' && (
          <ChallengesTab
            items={challenges}
            loading={challengesLoading}
            isAdmin={isAdmin}
            onJoin={joinChallenge}
            onDelete={removeItem}
            joiningId={joiningId}
          />
        )}

        {tab === 'activities' && (
          <ActivitiesTab items={activities} loading={activitiesLoading} isAdmin={isAdmin} onDelete={removeItem} />
        )}

        {tab === 'leaderboard' && <LeaderboardTab items={leaderboard} loading={leaderboardLoading} />}
      </div>

      {commentPost && (
        <CommentsSheet post={commentPost} onClose={() => setCommentPost(null)} onCountChange={bumpComments} />
      )}

      {createKind && (
        <CreateSheet
          kind={createKind}
          onClose={() => setCreateKind(null)}
          onCreated={() => {
            setCreateKind(null);
            if (createKind === 'challenge') loadChallenges();
            else loadActivities();
          }}
        />
      )}
    </div>
  );
}