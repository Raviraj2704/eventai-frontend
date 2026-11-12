// ============================================================================
// Activity Hub (Instagram-Style Social Feed - EXACT ADOBE XD MATCH)
// File: src/pages/engagement/ActivityHubScreen.jsx
// ============================================================================

import { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, MoreVertical, Share2, Trash2, MessageSquare, ThumbsUp, Send, X, Image as ImageIcon } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

const initialsOf = (name) =>
  (name || 'A').split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'A';

const formatPostDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const month = d.toLocaleString('en-US', { month: 'short' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${d.getDate()}th ${month} ${d.getFullYear()} | ${time}`;
};

const formatCommentTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const month = d.toLocaleString('en-US', { month: 'short' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${d.getDate()} ${month}, ${time}`;
};

// ----------------------------------------------------------------------------
// Create Post Modal
// ----------------------------------------------------------------------------
function CreatePostModal({ onClose, onPost, me }) {
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    const content = draft.trim();
    if ((!content && !selectedImage) || posting) return;
    setPosting(true);
    try {
      await onPost(content, selectedImage);
      onClose();
    } catch (error) {
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-bottom-full duration-300">
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
        <button onClick={onClose} className="text-slate-800 hover:text-black">
          <X size={26} strokeWidth={2.5} />
        </button>
        <h2 className="text-[18px] font-bold text-slate-900">Create Post</h2>
        <button 
          onClick={handleSubmit} 
          disabled={(!draft.trim() && !selectedImage) || posting}
          className="text-[15px] font-bold text-[#0000c8] disabled:opacity-40"
        >
          {posting ? 'Posting...' : 'Share'}
        </button>
      </div>

      <div className="flex-1 p-5 overflow-y-auto">
        <div className="flex gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#0c1b78] text-white flex items-center justify-center font-bold overflow-hidden shrink-0">
            {me?.avatar_url ? <img src={me.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : initialsOf(me?.first_name)}
          </div>
          <p className="text-[15px] font-bold text-slate-900 pt-2">{me?.first_name || me?.username || 'Attendee'}</p>
        </div>
        
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Share your thoughts on X with #SHRMIAC26..."
          className="w-full h-32 resize-none text-[16px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
          autoFocus
        />

        {previewUrl && (
          <div className="relative mt-2 w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <img src={previewUrl} alt="Preview" className="w-full h-auto object-cover" />
            <button
              onClick={() => { setSelectedImage(null); setPreviewUrl(null); }}
              className="absolute top-3 right-3 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 p-4 pb-safe flex items-center gap-4 bg-slate-50">
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 text-[14px] font-bold text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm"
        >
          <ImageIcon size={18} className="text-[#0000c8]" /> Add Photo
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Comments Sheet Modal (ADOBE XD MATCH)
// ----------------------------------------------------------------------------
function CommentsModal({ post, onClose, onCountChange }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient.get(`/posts/${post.id}/comments`)
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
      const res = await apiClient.post(`/posts/${post.id}/comments`, { content: draft.trim() });
      const newComment = res?.data?.data || res?.data;
      setComments(prev => [newComment, ...prev]);
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
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 bg-white">
          {loading ? (
            <div className="py-12 flex justify-center"><LoadingSpinner /></div>
          ) : comments.length === 0 ? (
            <p className="text-center text-[14px] text-slate-400 mt-10">No comments yet. Start the conversation!</p>
          ) : (
            comments.map((c, i) => (
              <div key={c.id || i} className="flex flex-col items-start">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 inline-block max-w-[85%]">
                  <p className="text-[11px] font-bold text-slate-400 mb-1">{c.author?.name || c.user?.first_name || 'Attendee'}</p>
                  <p className="text-[14px] text-slate-800 leading-snug">{c.content}</p>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 ml-2 font-medium">{formatCommentTime(c.created_at || new Date())}</p>
              </div>
            ))
          )}
        </div>

        {/* Input Footer */}
        <form onSubmit={submitComment} className="border-t border-slate-100 bg-white p-4 shrink-0 flex items-center gap-3 pb-safe shadow-[0_-4px_20px_rgb(0,0,0,0.02)]">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write A Public Comment..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3.5 text-[14px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0000c8] transition-all"
          />
          <button 
            type="submit" 
            disabled={!draft.trim() || posting}
            className="bg-[#0000c8] text-white p-3.5 rounded-xl disabled:opacity-40 transition shrink-0 shadow-md"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Single Social Post Card
// ----------------------------------------------------------------------------
function SocialPostCard({ post, isAdmin, onReact, onDelete, onOpenComments }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const menuRef = useRef();
  const reactRef = useRef();

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
    const shareText = `Check out this post on EventAI!`;
    if (navigator.share) {
      try { await navigator.share({ title: 'EventAI Post', text: shareText, url: window.location.href }); } catch (err) {}
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Link copied to clipboard!');
    }
  };

  const setReaction = (kind) => {
    setShowReactions(false);
    onReact(post.id, kind);
  };

  const REACT_ICONS = {
    like: { emoji: '👍', color: 'text-blue-600', label: 'Like' },
    love: { emoji: '❤️', color: 'text-rose-600', label: 'Love' },
    smile: { emoji: '😊', color: 'text-amber-500', label: 'Smile' },
    laugh: { emoji: '😆', color: 'text-amber-500', label: 'Laugh' },
    wow: { emoji: '😲', color: 'text-amber-500', label: 'Wow' }
  };

  const activeReaction = post.my_reaction ? REACT_ICONS[post.my_reaction] : null;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_15px_rgb(0,0,0,0.04)] mb-5 overflow-hidden">
      
      {/* HEADER */}
      <div className="flex justify-between items-center p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-[42px] h-[42px] rounded-full bg-[#0c1b78] text-white flex items-center justify-center font-bold text-[14px] overflow-hidden shadow-sm">
            {post.author?.avatar_url ? (
              <img src={post.author.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              initialsOf(post.author?.name)
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold text-slate-900 leading-tight">{post.author?.name || 'Attendee'}</span>
            <span className="text-[11px] font-medium text-slate-400 mt-0.5">{formatPostDate(post.created_at)}</span>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-slate-500 bg-slate-50 rounded-full hover:bg-slate-100 transition">
            <MoreVertical size={18} />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-10 animate-in fade-in zoom-in-95 duration-100">
              <button onClick={handleShare} className="w-full flex items-center gap-3 px-5 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-50">
                <Share2 size={16} className="text-slate-400" /> Share Post
              </button>
              {(post.is_mine || isAdmin) && (
                <button onClick={() => { setShowMenu(false); onDelete(post); }} className="w-full flex items-center gap-3 px-5 py-2.5 text-[13px] font-bold text-red-600 hover:bg-red-50">
                  <Trash2 size={16} className="text-red-400" /> Delete Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* TEXT CONTENT */}
      {post.content && (
        <div className="px-4 py-2 text-[14px] text-slate-800 leading-relaxed font-medium">
          {post.content}
        </div>
      )}

      {/* IMAGE CONTENT */}
      {post.image_url && (
        <div className="w-full px-4 mb-2">
          <div className="rounded-2xl overflow-hidden border border-slate-100">
            <img src={post.image_url} alt="Post content" className="w-full h-auto object-cover max-h-[350px]" />
          </div>
        </div>
      )}

      {/* STATS */}
      <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1.5">
            <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[11px] border border-white z-20">👍</span>
            <span className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center text-[11px] border border-white z-10">❤️</span>
            <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-[11px] border border-white z-0">😂</span>
          </div>
          <span className="text-[12px] font-bold text-slate-500 ml-1">{post.like_count || 0}</span>
        </div>
        <div className="text-[12px] font-medium text-slate-400">
          {post.view_count || 0} Views <span className="mx-1">|</span> {post.comment_count || 0} Comments
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="flex items-center justify-between px-2 py-1">
        <div className="flex-1 relative flex justify-center" ref={reactRef}>
          <button 
            onClick={() => {
              if (activeReaction) setReaction(null); // unlike
              else setShowReactions(!showReactions);
            }} 
            className={`flex items-center justify-center gap-2 py-3 w-full text-[14px] font-bold transition-colors ${activeReaction ? activeReaction.color : 'text-slate-600 hover:bg-slate-50 rounded-xl'}`}
          >
            {activeReaction ? (
              <span className="text-[18px]">{activeReaction.emoji}</span>
            ) : (
              <ThumbsUp size={18} className="text-slate-500" /> 
            )}
            {activeReaction ? activeReaction.label : 'Like'}
          </button>

          {/* EMOJI TRAY POPUP */}
          {showReactions && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-[0_10px_30px_rgb(0,0,0,0.15)] border border-slate-100 px-4 py-2.5 flex gap-4 animate-in slide-in-from-bottom-2 duration-200 z-20">
              {Object.entries(REACT_ICONS).map(([key, data]) => (
                <button key={key} onClick={() => setReaction(key)} className="text-[28px] hover:scale-125 transition-transform origin-bottom">
                  {data.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-slate-200"></div>

        <div className="flex-1 flex justify-center">
          <button onClick={() => onOpenComments(post)} className="flex items-center justify-center gap-2 py-3 w-full text-[14px] font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
            <MessageSquare size={18} className="text-slate-500" /> Comment
          </button>
        </div>
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
  const [commentPost, setCommentPost] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const res = await apiClient.get('/posts', { params: { page: 1, limit: 30 } });
      setPosts(res?.data?.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load the feed'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
    apiClient.get('/auth/me').then((res) => setMe(res?.data?.data ?? res?.data ?? null)).catch(() => setMe(null));
    apiClient.get('/auth/me').then((res) => setIsAdmin(Boolean(res?.data?.data?.is_admin))).catch(() => setIsAdmin(false));
  }, [loadPosts]);

  const handlePostSubmit = async (content, imageFile) => {
    try {
      let payload = { content };
      
      // FIXED 500 ERROR: Backend expects JSON SocialPostCreateRequest. 
      // Instead of crashing with FormData, we convert the image to Base64 data URL.
      if (imageFile) {
        const base64Url = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(imageFile);
        });
        payload.image_url = base64Url;
      }

      await apiClient.post('/posts', payload);
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
        let newCount = p.like_count || 0;
        if (p.my_reaction && !kind) newCount = Math.max(0, newCount - 1);
        if (!p.my_reaction && kind) newCount += 1;
        return { ...p, my_reaction: kind, like_count: newCount };
      }));

      if (kind) {
        await apiClient.post(`/posts/${postId}/like`); // Using standard like route for now
      } else {
        await apiClient.post(`/posts/${postId}/unlike`);
      }
    } catch (error) {
      toast.error('Failed to update reaction');
      loadPosts(); 
    }
  };

  const handleDelete = async (post) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await apiClient.delete(`/posts/${post.id}`);
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
    <div className="min-h-screen bg-slate-50 max-w-[430px] mx-auto pb-28 font-sans">
      
      {/* Header - EXACT ADOBE XD MATCH (White background, Black text) */}
      <div className="bg-white text-slate-900 px-5 pt-5 pb-4 flex items-center justify-between border-b border-slate-100 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/hub')} aria-label="Back" className="text-slate-800 hover:text-black transition-colors">
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>
          <h1 className="text-[22px] font-bold tracking-tight">Activity Hub</h1>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Join Conversation Prompt - EXACT ADOBE XD MATCH */}
        <div className="flex gap-4 items-center mb-6 cursor-pointer" onClick={() => setShowCreatePost(true)}>
          <div className="w-[46px] h-[46px] rounded-full bg-[#0c1b78] text-white flex items-center justify-center font-bold overflow-hidden shrink-0 shadow-sm">
            {me?.avatar_url ? <img src={me.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : initialsOf(me?.first_name)}
          </div>
          <div className="w-[2px] h-[46px] bg-slate-200 shrink-0"></div>
          <p className="text-[14px] text-slate-500 font-medium leading-snug">
            Join the conversation. Share your thoughts on X with <span className="font-bold text-slate-700">#SHRMIAC26</span>.
          </p>
        </div>

        {/* Feed List */}
        {loading ? (
          <div className="py-20 flex justify-center"><LoadingSpinner /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <ImageIcon size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-[15px] font-bold text-slate-900">No Posts Yet</p>
            <p className="text-[13px] text-slate-500 mt-1">Be the first to share a moment.</p>
          </div>
        ) : (
          posts.map((post) => (
            <SocialPostCard
              key={post.id}
              post={post}
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