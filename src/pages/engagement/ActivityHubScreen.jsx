// ============================================================================
// Activity Hub (Instagram-Style Social Feed)
// File: src/pages/engagement/ActivityHubScreen.jsx
// ============================================================================

import { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, MoreHorizontal, Share2, Trash2, MessageCircle, Heart, Send, X, PlusSquare, Image as ImageIcon } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

const initialsOf = (name) =>
  (name || 'A').split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'A';

const formatPostDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  const month = d.toLocaleString('en-US', { month: 'short' });
  return `${d.getDate()} ${month}`;
};

const formatCommentTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`;
};

// ----------------------------------------------------------------------------
// Create Post Modal (Triggered from Top Right)
// ----------------------------------------------------------------------------
function CreatePostModal({ onClose, onPost, me }) {
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  const handleSubmit = async () => {
    const content = draft.trim();
    if (!content || posting) return;
    setPosting(true);
    try {
      await onPost(content);
      onClose();
    } catch (error) {
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-bottom-full duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
        <button onClick={onClose} className="text-slate-800 hover:text-black">
          <X size={26} strokeWidth={2.5} />
        </button>
        <h2 className="text-[18px] font-bold text-slate-900">New Post</h2>
        <button 
          onClick={handleSubmit} 
          disabled={!draft.trim() || posting}
          className="text-[15px] font-bold text-[#0000c8] disabled:opacity-40"
        >
          {posting ? 'Posting...' : 'Share'}
        </button>
      </div>

      <div className="flex-1 p-5">
        <div className="flex gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold overflow-hidden shrink-0">
            {me?.avatar_url ? <img src={me.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : initialsOf(me?.first_name || 'A')}
          </div>
          <p className="text-[15px] font-bold text-slate-900 pt-2">{me?.first_name || me?.username || 'Attendee'}</p>
        </div>
        
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What's on your mind? Share with #SHRMIAC26..."
          className="w-full h-40 resize-none text-[16px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
          autoFocus
        />
      </div>

      {/* Sticky Bottom Actions (Mocking image upload for visual) */}
      <div className="border-t border-slate-100 p-4 pb-safe flex items-center gap-4 bg-slate-50">
        <button className="flex items-center gap-2 text-[14px] font-bold text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm">
          <ImageIcon size={18} className="text-blue-500" /> Photo
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Comments Sheet Modal
// ----------------------------------------------------------------------------
function CommentsModal({ post, onClose, onCountChange }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient.get(`/social/posts/${post.id}/comments`)
      .then(res => {
        if (!cancelled) {
          const data = res?.data?.data || res?.data || [];
          setComments(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (!cancelled) toast.error('Could not load comments');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [post.id]);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!draft.trim() || posting) return;
    setPosting(true);
    try {
      const res = await apiClient.post(`/social/posts/${post.id}/comments`, { content: draft.trim() });
      const newComment = res?.data?.data || res?.data;
      setComments(prev => [...prev, newComment]);
      setDraft('');
      onCountChange(post.id, 1);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to post comment'));
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex flex-col justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[430px] mx-auto h-[85vh] rounded-t-3xl flex flex-col shadow-2xl animate-in slide-in-from-bottom-full duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-[16px] font-bold text-slate-900">Comments ({post.comment_count || 0})</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 bg-white">
          {loading ? (
            <div className="py-12"><LoadingSpinner /></div>
          ) : comments.length === 0 ? (
            <p className="text-center text-[14px] text-slate-400 mt-10">No comments yet. Start the conversation!</p>
          ) : (
            comments.map((c, i) => (
              <div key={c.id || i} className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px] overflow-hidden shrink-0 mt-0.5">
                  {c.author?.avatar_url ? <img src={c.author.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : initialsOf(c.author?.name || c.user?.first_name)}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] text-slate-800 leading-snug">
                    <span className="font-bold mr-2 text-slate-900">{c.author?.name || c.user?.first_name || 'Attendee'}</span>
                    {c.content}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">{formatCommentTime(c.created_at || new Date())}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={submitComment} className="border-t border-slate-100 bg-white p-4 shrink-0 flex items-center gap-3 pb-safe">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3 text-[14px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0000c8] transition-all"
          />
          <button 
            type="submit" 
            disabled={!draft.trim() || posting}
            className="text-[14px] font-bold text-[#0000c8] disabled:opacity-40 px-2 shrink-0"
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Single Social Post Card (INSTAGRAM STYLE)
// ----------------------------------------------------------------------------
function SocialPostCard({ post, me, isAdmin, onReact, onDelete, onOpenComments }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const menuRef = useRef();
  const reactRef = useRef();

  // Close menus when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
      if (reactRef.current && !reactRef.current.contains(e.target)) setShowReactions(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleShare = async () => {
    setShowMenu(false);
    const shareText = `Check out this post by ${post.author?.name || 'an attendee'} on EventAI!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'EventAI Post', text: shareText, url: window.location.href });
      } catch (err) { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleDelete = () => {
    setShowMenu(false);
    onDelete(post);
  };

  const setReaction = (kind) => {
    setShowReactions(false);
    onReact(post.id, kind);
  };

  const EMOJI_MAP = {
    like: { emoji: '👍', color: 'text-blue-600' },
    love: { emoji: '❤️', color: 'text-rose-600' },
    haha: { emoji: '😂', color: 'text-amber-500' }
  };

  const activeReaction = post.my_reaction ? EMOJI_MAP[post.my_reaction] : null;

  return (
    <div className="bg-white border-b border-slate-100 pb-5 pt-3 mb-2">
      
      {/* 1. HEADER */}
      <div className="flex justify-between items-center px-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-[36px] h-[36px] rounded-full bg-[#0c1b78] text-white flex items-center justify-center font-bold text-[12px] overflow-hidden">
            {post.author?.avatar_url ? (
              <img src={post.author.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              initialsOf(post.author?.name)
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-bold text-slate-900 leading-tight">{post.author?.name || 'Attendee'}</span>
            {post.author?.job_title && <span className="text-[11px] text-slate-500">{post.author.job_title}</span>}
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button onClick={() => setShowMenu(!showMenu)} className="p-1 text-slate-900">
            <MoreHorizontal size={20} />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-10 animate-in fade-in zoom-in-95 duration-100">
              <button onClick={handleShare} className="w-full flex items-center gap-3 px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50">
                <Share2 size={16} /> Share
              </button>
              {(post.is_mine || isAdmin) && (
                <button onClick={handleDelete} className="w-full flex items-center gap-3 px-4 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50">
                  <Trash2 size={16} /> Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. IMAGE (If exists) */}
      {post.image_url && (
        <div className="w-full bg-slate-50 mb-3">
          <img src={post.image_url} alt="Post content" className="w-full h-auto object-cover max-h-[450px]" />
        </div>
      )}

      {/* 3. ACTION BAR */}
      <div className="flex items-center justify-between px-4 mb-2">
        <div className="flex items-center gap-5 relative" ref={reactRef}>
          
          {/* Reaction Toggle */}
          <button 
            onClick={() => setShowReactions(!showReactions)} 
            className="hover:opacity-70 transition-opacity"
          >
            {activeReaction ? (
              <span className="text-[24px]">{activeReaction.emoji}</span>
            ) : (
              <Heart size={24} className="text-slate-900" />
            )}
          </button>

          {/* Emoji Popup Tray (CLICK TO OPEN ON MOBILE) */}
          {showReactions && (
            <div className="absolute -top-12 left-[-10px] bg-white rounded-full shadow-[0_4px_25px_rgb(0,0,0,0.15)] border border-slate-100 px-3 py-2 flex gap-4 animate-in slide-in-from-bottom-2 duration-200 z-20">
              <button onClick={() => setReaction('like')} className="text-[26px] hover:scale-110 transition-transform origin-bottom">👍</button>
              <button onClick={() => setReaction('love')} className="text-[26px] hover:scale-110 transition-transform origin-bottom">❤️</button>
              <button onClick={() => setReaction('haha')} className="text-[26px] hover:scale-110 transition-transform origin-bottom">😂</button>
            </div>
          )}

          <button onClick={() => onOpenComments(post)} className="text-slate-900 hover:opacity-70 transition-opacity">
            <MessageCircle size={24} className="-scale-x-100" />
          </button>
          
          <button onClick={handleShare} className="text-slate-900 hover:opacity-70 transition-opacity">
            <Send size={24} />
          </button>
        </div>
      </div>

      {/* 4. LIKES COUNT */}
      {(post.reactions?.total > 0) && (
        <div className="px-4 mb-1">
          <p className="text-[13px] font-bold text-slate-900">{post.reactions.total} {post.reactions.total === 1 ? 'reaction' : 'reactions'}</p>
        </div>
      )}

      {/* 5. CAPTION */}
      {post.content && (
        <div className="px-4 mb-1 text-[13px] text-slate-800 leading-normal">
          <span className="font-bold text-slate-900 mr-2">{post.author?.name || 'Attendee'}</span>
          {post.content}
        </div>
      )}

      {/* 6. VIEW COMMENTS */}
      {post.comment_count > 0 && (
        <button className="px-4 text-[13px] text-slate-500 mt-1" onClick={() => onOpenComments(post)}>
          View all {post.comment_count} comments
        </button>
      )}

      {/* 7. DATE */}
      <p className="px-4 text-[10px] text-slate-400 mt-1.5 uppercase tracking-wide">
        {formatPostDate(post.created_at)}
      </p>

    </div>
  );
}

// ----------------------------------------------------------------------------
// Screen
// ----------------------------------------------------------------------------
export default function ActivityHubScreen() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [me, setMe] = useState(null);
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentPost, setCommentPost] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const res = await apiClient.get('/social/wall', { params: { page: 1, limit: 30 } });
      setPosts(res?.data?.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load the feed'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
    apiClient.get('/users/me').then((res) => setMe(res?.data?.data ?? res?.data ?? null)).catch(() => setMe(null));
    apiClient.get('/session-admin/me/roles').then((res) => setIsAdmin(Boolean(res?.data?.data?.is_admin))).catch(() => setIsAdmin(false));
  }, [loadPosts]);

  const handlePostSubmit = async (content) => {
    try {
      await apiClient.post('/social/posts', { content });
      toast.success('Posted successfully!');
      await loadPosts();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not post'));
      throw error;
    }
  };

  const handleReact = async (postId, kind) => {
    try {
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        const newReactions = { ...p.reactions };
        if (p.my_reaction) {
          newReactions[p.my_reaction] = Math.max(0, newReactions[p.my_reaction] - 1);
          newReactions.total = Math.max(0, newReactions.total - 1);
        }
        if (kind) {
          newReactions[kind] = (newReactions[kind] || 0) + 1;
          newReactions.total += 1;
        }
        return { ...p, my_reaction: kind, reactions: newReactions };
      }));

      if (kind) {
        await apiClient.post(`/social/posts/${postId}/react`, { kind });
      } else {
        await apiClient.delete(`/social/posts/${postId}/react`);
      }
    } catch (error) {
      toast.error('Failed to update reaction');
      loadPosts(); 
    }
  };

  const handleDelete = async (post) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await apiClient.delete(`/social/posts/${post.id}`);
      setPosts(prev => prev.filter(p => p.id !== post.id));
      toast.success('Post deleted');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete post'));
    }
  };

  const bumpComments = (postId, delta) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comment_count: Math.max(0, (p.comment_count || 0) + delta) } : p));
  };

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28 font-sans">
      
      {/* Header - EXACT ADOBE XD MATCH with Plus Upload Button */}
      <div className="bg-white text-slate-900 px-5 pt-5 pb-4 flex items-center justify-between border-b border-slate-100 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/hub')} aria-label="Back" className="text-slate-900 hover:text-black transition-colors">
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>
          <h1 className="text-[22px] font-bold tracking-tight">Activity Hub</h1>
        </div>
        
        {/* Upload Post Option at Top Right */}
        <button 
          onClick={() => setShowCreatePost(true)}
          className="text-slate-900 hover:text-blue-600 transition-colors"
        >
          <PlusSquare size={26} strokeWidth={2} />
        </button>
      </div>

      {/* Feed List */}
      <div className="bg-white min-h-screen pt-2">
        {loading ? (
          <div className="py-20 flex justify-center"><LoadingSpinner /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon size={28} className="text-slate-300" />
            </div>
            <p className="text-[15px] font-bold text-slate-900">No Posts Yet</p>
            <p className="text-[13px] text-slate-500 mt-1">Be the first to share a moment.</p>
          </div>
        ) : (
          posts.map((post) => (
            <SocialPostCard
              key={post.id}
              post={post}
              me={me}
              isAdmin={isAdmin}
              onReact={handleReact}
              onDelete={handleDelete}
              onOpenComments={setCommentPost}
            />
          ))
        )}
      </div>

      {/* Full-Screen Create Post Modal */}
      {showCreatePost && (
        <CreatePostModal 
          onClose={() => setShowCreatePost(false)} 
          onPost={handlePostSubmit} 
          me={me} 
        />
      )}

      {/* Comments Modal */}
      {commentPost && (
        <CommentsModal 
          post={commentPost} 
          onClose={() => setCommentPost(null)} 
          onCountChange={bumpComments} 
        />
      )}
      
    </div>
  );
}