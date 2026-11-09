// ============================================================================
// Activity Hub (matches the reference design)
// File: src/pages/engagement/ActivityHubScreen.jsx
// Route: /activity-hub
// Real API only:
//   GET  /users/me             your avatar for the composer
//   GET  /social/wall          posts with reactions
//   POST /social/posts         create a post
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SocialPostCard, { CommentsSheet } from '../../components/social/SocialPostCard';
import apiClient from '../../config/apiClient';

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

const initialsOf = (name) =>
  (name || 'M').split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'M';

export default function ActivityHubScreen() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentPost, setCommentPost] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get('/social/wall', { params: { page: 1, limit: 20 } });
      setPosts(res?.data?.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load the activity feed'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    apiClient
      .get('/users/me')
      .then((res) => setMe(res?.data?.data ?? res?.data ?? null))
      .catch(() => setMe(null));
  }, [load]);

  const publish = async () => {
    const content = draft.trim();
    if (!content || posting) return;
    setPosting(true);
    try {
      await apiClient.post('/social/posts', { content });
      setDraft('');
      toast.success('Posted');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not post. Please try again.'));
    } finally {
      setPosting(false);
    }
  };

  const bumpComments = (postId, delta) =>
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comment_count: Math.max(0, (p.comment_count || 0) + delta) } : p))
    );

  const myName = me?.first_name || me?.username || 'Me';

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-200">
        <button type="button" onClick={() => navigate('/hub')} aria-label="Back" className="text-slate-800">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Activity Hub</h1>
      </div>

      {/* Composer */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100">
        {me?.avatar_url ? (
          <img src={me.avatar_url} alt={myName} className="w-12 h-12 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold shrink-0">
            {initialsOf(myName)}
          </div>
        )}
        <div className="flex-1 min-w-0 border-l-2 border-slate-200 pl-3">
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
              className="rounded-lg bg-[#0000c8] text-white px-4 py-1.5 text-sm font-semibold disabled:opacity-50"
            >
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center text-sm text-slate-500 py-12">No activity yet. Be the first to post.</p>
        ) : (
          posts.map((post) => (
            <SocialPostCard
              key={post.id}
              post={post}
              variant="hub"
              onChanged={load}
              onComment={setCommentPost}
              onDeleted={() => {}}
            />
          ))
        )}
      </div>

      {commentPost && (
        <CommentsSheet
          post={commentPost}
          onClose={() => setCommentPost(null)}
          onCountChange={bumpComments}
        />
      )}
    </div>
  );
}