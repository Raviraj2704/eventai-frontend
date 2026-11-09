// ============================================================================
// Social Wall (matches the reference design)
// File: src/pages/engagement/SocialWallScreen.jsx
// Route: /social-wall
// Real API only:
//   GET /social/wall        posts with reactions and authors
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

export default function SocialWallScreen() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentPost, setCommentPost] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get('/social/wall', { params: { page: 1, limit: 20 } });
      setPosts(res?.data?.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load the social wall'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const bumpComments = (postId, delta) =>
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comment_count: Math.max(0, (p.comment_count || 0) + delta) } : p))
    );

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-200">
        <button type="button" onClick={() => navigate('/hub')} aria-label="Back" className="text-slate-800">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Social Wall</h1>
      </div>

      <div className="bg-slate-50 px-4 py-4 space-y-5 min-h-[70vh]">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-center text-[#0000c8] font-semibold leading-relaxed">
            Use #DreamcastAnnual24 on your Social Media to get featured!
          </p>
        </div>

        {loading ? (
          <div className="py-16">
            <LoadingSpinner />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center text-sm text-slate-500 py-12">No posts yet. Share the first one from Activity Hub.</p>
        ) : (
          posts.map((post) => (
            <SocialPostCard
              key={post.id}
              post={post}
              variant="wall"
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