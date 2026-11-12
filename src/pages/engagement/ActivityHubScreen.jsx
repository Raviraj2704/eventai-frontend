// ============================================================================
// Activity Hub (Pure Social Feed - EXACT ADOBE XD MATCH)
// File: src/pages/engagement/ActivityHubScreen.jsx
// ============================================================================

import { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, MoreVertical, Share2, Trash2, MessageSquare, ThumbsUp, Send, X } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

const initialsOf = (name) =>
  (name || 'A').split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'A';

const formatPostDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const n = d.getDate();
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear();
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${n}${suffix} ${month} ${year} | ${time}`;
};

const formatCommentTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
};

// ----------------------------------------------------------------------------
// Comments Sheet Modal (Matches Adobe XD Image 3)
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
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-[18px] font-bold text-slate-900">Total {post.comment_count || 0} Comments</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Comment List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 bg-white">
          {loading ? (
            <div className="py-12"><LoadingSpinner /></div>
          ) : comments.length === 0 ? (
            <p className="text-center text-[14px] text-slate-400 mt-10">No comments yet. Start the conversation!</p>
          ) : (
            comments.map((c, i) => (
              <div key={c.id || i} className="flex flex-col items-start max-w-[85%]">
                <div className="bg-slate-50 rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-100">
                  <p className="text-[11px] font-medium text-slate-400 mb-0.5">{c.author?.name || c.user?.first_name || 'Attendee'}</p>
                  <p className="text-[14px] text-slate-800 leading-snug">{c.content}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1.5 ml-1">{formatCommentTime(c.created_at || new Date())}</span>
              </div>
            ))
          )}
        </div>

        {/* Sticky Input Footer */}
        <form onSubmit={submitComment} className="border-t border-slate-100 bg-white p-4 shrink-0 flex items-center gap-3 pb-safe">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write A Public Comment..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3.5 text-[14px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
          <button 
            type="submit" 
            disabled={!draft.trim() || posting}
            className="w-12 h-12 bg-[#0000c8] rounded-xl flex items-center justify-center text-white shadow-md disabled:opacity-50 hover:bg-blue-800 transition-colors shrink-0"
          >
            <Send size={18} className="ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Single Social Post Card (Matches Adobe XD Image 1 & 2)
// ----------------------------------------------------------------------------
function SocialPostCard({ post, me, isAdmin, onReact, onDelete, onOpenComments }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const menuRef = useRef();
  const reactTimer = useRef();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
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

  const handleSetReaction = (kind) => {
    setShowReactions(false);
    onReact(post.id, kind);
  };

  const handleLikeClick = () => {
    // If already liked, remove it. If not, default to 'like'
    if (post.my_reaction) {
      onReact(post.id, null); // remove
    } else {
      onReact(post.id, 'like');
    }
  };

  const stats = post.reactions || {};
  const hasReactions = stats.total > 0;
  
  // UI mapping for backend strictly supported emojis
  const EMOJI_MAP = {
    like: { emoji: '👍', label: 'Like', color: 'text-blue-600' },
    love: { emoji: '❤️', label: 'Love', color: 'text-rose-600' },
    haha: { emoji: '😂', label: 'Haha', color: 'text-amber-500' }
  };

  const myReactUI = post.my_reaction ? EMOJI_MAP[post.my_reaction] : null;

  return (
    <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_15px_rgb(0,0,0,0.05)] border border-slate-100 mb-5 relative">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-[46px] h-[46px] rounded-full bg-[#0c1b78] text-white flex items-center justify-center font-bold overflow-hidden shadow-sm border border-slate-100">
            {post.author?.avatar_url ? (
              <img src={post.author.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              initialsOf(post.author?.name)
            )}
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-900 leading-tight">{post.author?.name || 'Attendee'}</p>
            <p className="text-[12px] text-slate-400 mt-0.5">{formatPostDate(post.created_at)}</p>
          </div>
        </div>

        {/* 3-Dot Menu */}
        <div className="relative" ref={menuRef}>
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 -mr-2 text-slate-400 hover:text-slate-700 transition-colors rounded-full hover:bg-slate-50">
            <MoreVertical size={20} />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-1 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-10 animate-in fade-in zoom-in-95 duration-100">
              <button onClick={handleShare} className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                <Share2 size={16} className="text-slate-400" /> Share Post
              </button>
              {(post.is_mine || isAdmin) && (
                <button onClick={handleDelete} className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 size={16} className="text-red-400" /> Delete Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      {post.content && (
        <p className="text-[14px] text-slate-800 leading-relaxed mb-4 whitespace-pre-wrap px-0.5">
          {post.content}
        </p>
      )}

      {/* Image */}
      {post.image_url && (
        <div className="w-full rounded-2xl overflow-hidden mb-4 bg-slate-50 border border-slate-100">
          <img src={post.image_url} alt="Post content" className="w-full h-auto object-cover max-h-[400px]" />
        </div>
      )}

      {/* Stats Row */}
      <div className="flex justify-between items-center px-1 mb-4 mt-2">
        <div className="flex items-center gap-1.5 h-6">
          {hasReactions ? (
            <div className="flex items-center">
              {stats.like > 0 && <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] shadow-sm ring-2 ring-white z-30">👍</div>}
              {stats.love > 0 && <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] shadow-sm ring-2 ring-white -ml-1 z-20">❤️</div>}
              {stats.haha > 0 && <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] shadow-sm ring-2 ring-white -ml-1 z-10">😂</div>}
              <span className="text-[12px] font-medium text-slate-500 ml-2">{stats.total}</span>
            </div>
          ) : (
            <span className="text-[12px] font-medium text-slate-400">Be the first to react</span>
          )}
        </div>
        <div className="text-[12px] font-medium text-slate-400">
          {post.comment_count || 0} Comments
        </div>
      </div>

      {/* Action Divider */}
      <div className="h-px w-full bg-slate-100 mb-1" />

      {/* Action Buttons */}
      <div className="flex items-center relative">
        
        {/* Hover Reactions Popover */}
        {showReactions && (
          <div 
            className="absolute -top-12 left-0 bg-white rounded-full shadow-[0_4px_20px_rgb(0,0,0,0.12)] border border-slate-50 px-3 py-2 flex gap-3 animate-in slide-in-from-bottom-2 duration-200 z-20"
            onMouseEnter={() => clearTimeout(reactTimer.current)}
            onMouseLeave={() => setShowReactions(false)}
          >
            <button onClick={() => handleSetReaction('like')} className="hover:scale-125 hover:-translate-y-1 transition-transform text-[22px] origin-bottom">👍</button>
            <button onClick={() => handleSetReaction('love')} className="hover:scale-125 hover:-translate-y-1 transition-transform text-[22px] origin-bottom">❤️</button>
            <button onClick={() => handleSetReaction('haha')} className="hover:scale-125 hover:-translate-y-1 transition-transform text-[22px] origin-bottom">😂</button>
          </div>
        )}

        <button 
          onClick={handleLikeClick}
          onMouseEnter={() => {
            clearTimeout(reactTimer.current);
            setShowReactions(true);
          }}
          onMouseLeave={() => {
            reactTimer.current = setTimeout(() => setShowReactions(false), 300);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-colors hover:bg-slate-50 ${myReactUI ? myReactUI.color + ' font-bold' : 'text-slate-600 font-medium'}`}
        >
          {myReactUI ? (
            <>
              <span className="text-[18px]">{myReactUI.emoji}</span>
              <span className="text-[14px]">{myReactUI.label}</span>
            </>
          ) : (
            <>
              <ThumbsUp size={18} className="text-slate-400" />
              <span className="text-[14px]">Like</span>
            </>
          )}
        </button>
        
        <div className="w-px h-6 bg-slate-100" />
        
        <button 
          onClick={() => onOpenComments(post)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-colors hover:bg-slate-50 text-slate-600 font-medium"
        >
          <MessageSquare size={18} className="text-slate-400" />
          <span className="text-[14px]">Comment</span>
        </button>
      </div>

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
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentPost, setCommentPost] = useState(null);

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

  const publish = async () => {
    const content = draft.trim();
    if (!content || posting) return;
    setPosting(true);
    try {
      await apiClient.post('/social/posts', { content });
      setDraft('');
      toast.success('Posted successfully!');
      await loadPosts();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not post. Please try again.'));
    } finally {
      setPosting(false);
    }
  };

  const handleReact = async (postId, kind) => {
    try {
      // Optimistic update
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
      loadPosts(); // revert on failure
    }
  };

  const handleDelete = async (post) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
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

  const myName = me?.first_name || me?.username || 'Attendee';

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28 font-sans">
      
      {/* Header - EXACT ADOBE XD MATCH */}
      <div className="bg-white text-slate-900 px-5 pt-5 pb-4 flex items-center gap-3 border-b border-slate-100 sticky top-0 z-40">
        <button type="button" onClick={() => navigate('/hub')} aria-label="Back" className="text-slate-800 hover:text-black transition-colors">
          <ChevronLeft size={28} strokeWidth={2.5} />
        </button>
        <h1 className="text-[22px] font-bold tracking-tight">Activity Hub</h1>
      </div>

      {/* Composer Area - EXACT ADOBE XD MATCH */}
      <div className="px-5 pt-6 pb-6 border-b border-slate-50 flex gap-4">
        <div className="w-[48px] h-[48px] shrink-0 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-lg overflow-hidden relative z-10 border-2 border-white shadow-sm">
          {me?.avatar_url ? (
            <img src={me.avatar_url} alt={myName} className="w-full h-full object-cover" />
          ) : (
            initialsOf(myName)
          )}
        </div>
        
        {/* Subtle vertical connecting line */}
        <div className="absolute left-[43px] top-[110px] w-px h-[60px] bg-slate-200 z-0"></div>

        <div className="flex-1 relative z-10">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Join the conversation. Share your thoughts on X with #SHRMIAC26."
            className="w-full resize-none text-[15px] font-medium text-slate-600 placeholder:text-slate-400 focus:outline-none bg-transparent pt-1 leading-relaxed"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={publish}
              disabled={posting || !draft.trim()}
              className="rounded-full bg-[#0000c8] text-white px-5 py-2 text-[13px] font-bold disabled:opacity-40 hover:bg-blue-800 transition-colors shadow-sm"
            >
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>

      {/* Feed List */}
      <div className="bg-slate-50 px-5 pt-6 min-h-screen">
        {loading ? (
          <div className="py-20 flex justify-center"><LoadingSpinner /></div>
        ) : posts.length === 0 ? (
          <p className="text-center text-[14px] text-slate-400 py-16">No activity yet. Be the first to post!</p>
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