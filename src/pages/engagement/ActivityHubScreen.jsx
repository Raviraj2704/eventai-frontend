// ============================================================================
// Activity Hub (Instagram-Style Social Feed)
// File: src/pages/engagement/ActivityHubScreen.jsx
// ============================================================================

import { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  MoreVertical,
  Share2,
  Trash2,
  MessageSquare,
  ThumbsUp,
  Send,
  X,
  PlusSquare,
  Image as ImageIcon,
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

const fullNameOf = (u) => {
  if (!u) return '';
  if (u.name && u.name !== 'Attendee') return u.name;
  const full = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
  return full || u.username || u.email?.split('@')[0] || '';
};

// Fixed avatarOf to correctly extract the avatar_url
const avatarOf = (u) =>
  u?.avatar_url || u?.profile_picture_url || u?.profile_picture || u?.photo_url || u?.avatar || null;

const initialsOf = (name) =>
  (name || 'U')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

// Resolves author details from post.author, post.user, flat post fields, or logged-in `me`
const resolveAuthor = (item, me) => {
  const rawAuthor = item?.author || item?.user || {};
  const isMine =
    Boolean(item?.is_mine) ||
    (me?.id != null && (item?.user_id === me.id || rawAuthor?.id === me.id));

  const name =
    fullNameOf(rawAuthor) ||
    item?.user_name ||
    item?.author_name ||
    (isMine ? fullNameOf(me) : '') ||
    'Event Member';

  const avatar_url =
    avatarOf(rawAuthor) ||
    item?.user_avatar ||
    item?.author_avatar ||
    (isMine ? avatarOf(me) : null);

  const job_title =
    rawAuthor?.job_title ||
    item?.user_job_title ||
    (isMine ? me?.job_title : '') ||
    '';

  return { name, avatar_url, job_title, isMine };
};

// Compresses image to compact Base64 JPEG so FastAPI JSON endpoint & DB column never throw 500
const compressImageToBase64 = (file, maxWidth = 800, quality = 0.72) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const ordinal = (n) => {
  if (n % 100 >= 11 && n % 100 <= 13) return 'th';
  return ['th', 'st', 'nd', 'rd'][n % 10] || 'th';
};

const formatPostDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear();
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${day}${ordinal(day)} ${month} ${year} | ${time}`;
};

const formatCommentTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'short' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${day} ${month}, ${time}`;
};

const EMOJI_MAP = {
  like: { emoji: '👍', label: 'Like', color: 'text-blue-600' },
  love: { emoji: '❤️', label: 'Love', color: 'text-rose-600' },
  smile: { emoji: '😊', label: 'Smile', color: 'text-amber-500' },
  haha: { emoji: '😆', label: 'Haha', color: 'text-amber-500' },
  wow: { emoji: '😲', label: 'Wow', color: 'text-amber-500' },
};

// ----------------------------------------------------------------------------
// Create Post Modal (Triggered from Top Right or Join Conversation Prompt)
// ----------------------------------------------------------------------------
function CreatePostModal({ onClose, onPost, me }) {
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const myName = fullNameOf(me) || 'Me';
  const myAvatar = avatarOf(me);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
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
    } catch {
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-bottom-full duration-300 max-w-[430px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
        <button onClick={onClose} className="text-slate-800 hover:text-black">
          <X size={26} strokeWidth={2.5} />
        </button>
        <h2 className="text-[18px] font-bold text-slate-900">New Post</h2>
        <button
          onClick={handleSubmit}
          disabled={(!draft.trim() && !selectedImage) || posting}
          className="text-[15px] font-bold text-[#0000c8] disabled:opacity-40"
        >
          {posting ? 'Posting...' : 'Share'}
        </button>
      </div>

      <div className="flex-1 p-5 overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-[#0c1b78] text-white flex items-center justify-center font-bold overflow-hidden shrink-0 shadow-sm">
            {myAvatar ? (
              <img src={myAvatar} alt={myName} className="w-full h-full object-cover" />
            ) : (
              initialsOf(myName)
            )}
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-900">{myName}</p>
            {me?.job_title && <p className="text-[12px] text-slate-500">{me.job_title}</p>}
          </div>
        </div>

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Join the conversation. Share your thoughts on X with #EVENTAI26."
          className="w-full h-32 resize-none text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
          autoFocus
        />

        {previewUrl && (
          <div className="relative mt-2 w-full max-h-[300px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            <button
              onClick={() => {
                setSelectedImage(null);
                setPreviewUrl(null);
              }}
              className="absolute top-3 right-3 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions */}
      <div className="border-t border-slate-100 p-4 pb-safe flex items-center gap-4 bg-slate-50">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 text-[14px] font-bold text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm hover:bg-slate-50"
        >
          <ImageIcon size={18} className="text-blue-500" /> Photo
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Comments Sheet Modal (Matches Adobe XD Image 3)
// ----------------------------------------------------------------------------
function CommentsModal({ post, me, onClose, onCountChange }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get(`/social/posts/${post.id}/comments`)
      .then((res) => {
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
    return () => {
      cancelled = true;
    };
  }, [post.id]);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!draft.trim() || posting) return;
    setPosting(true);
    try {
      const res = await apiClient.post(`/social/posts/${post.id}/comments`, {
        content: draft.trim(),
      });
      const rawComment = res?.data?.data || res?.data;
      const enrichedComment = {
        ...rawComment,
        user_id: rawComment?.user_id ?? me?.id,
        author: rawComment?.author || {
          id: me?.id,
          name: fullNameOf(me),
          avatar_url: avatarOf(me),
        },
      };
      setComments((prev) => [...prev, enrichedComment]);
      setDraft('');
      onCountChange(post.id, 1);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to post comment'));
    } finally {
      setPosting(false);
    }
  };

  const totalComments = Math.max(post.comment_count || 0, comments.length);

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex flex-col justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[430px] mx-auto h-[85vh] rounded-t-3xl flex flex-col shadow-2xl animate-in slide-in-from-bottom-full duration-300">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <h2 className="text-[18px] font-bold text-slate-900">
            Total {totalComments} Comments
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 p-1 rounded-full transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-white">
          {loading ? (
            <div className="py-12">
              <LoadingSpinner />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-[14px] text-slate-400 mt-10">
              No comments yet. Start the conversation!
            </p>
          ) : (
            comments.map((c, i) => {
              const author = resolveAuthor(c, me);
              return (
                <div key={c.id || i} className="flex flex-col items-start">
                  <div className="bg-[#f3f4f6] rounded-2xl px-4 py-3 max-w-[90%]">
                    <p className="text-[12px] font-semibold text-slate-500 mb-0.5">
                      {author.name}
                    </p>
                    <p className="text-[14px] text-slate-900 leading-snug">{c.content}</p>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 pl-1">
                    {formatCommentTime(c.created_at || new Date())}
                  </p>
                </div>
              );
            })
          )}
        </div>

        <form
          onSubmit={submitComment}
          className="border-t border-slate-100 bg-white p-4 shrink-0 flex items-center gap-3 pb-safe"
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write A Public Comment..."
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0000c8] transition-all"
          />
          <button
            type="submit"
            disabled={!draft.trim() || posting}
            className="w-12 h-11 rounded-xl bg-[#0000c8] text-white flex items-center justify-center disabled:opacity-40 shrink-0 shadow-sm"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Single Social Post Card (Matches Adobe XD Images 1 & 2)
// ----------------------------------------------------------------------------
function SocialPostCard({ post, me, isAdmin, onReact, onDelete, onOpenComments }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const menuRef = useRef();
  const reactRef = useRef();

  const author = resolveAuthor(post, me);

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
    const shareText = `Check out this post by ${author.name} on EventAI!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'EventAI Post',
          text: shareText,
          url: window.location.href,
        });
      } catch {
        /* user cancelled */
      }
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

  const activeReaction = post.my_reaction ? EMOJI_MAP[post.my_reaction] : null;
  const totalReactions =
    post.reactions?.total ?? post.like_count ?? (activeReaction ? 1 : 0);
  const viewCount = post.view_count ?? post.views ?? Math.max(1, totalReactions * 2 + (post.comment_count || 0));

  return (
    <div className="bg-[#f8f9fa] rounded-2xl p-4 mb-4 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
      {/* 1. HEADER */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-[42px] h-[42px] rounded-full bg-[#0c1b78] text-white flex items-center justify-center font-bold text-[14px] overflow-hidden shrink-0 shadow-sm">
            {author.avatar_url ? (
              <img
                src={author.avatar_url}
                alt={author.name}
                className="w-full h-full object-cover"
              />
            ) : (
              initialsOf(author.name)
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold text-slate-900 leading-tight">
              {author.name}
            </span>
            <span className="text-[12px] text-slate-400 mt-0.5">
              {formatPostDate(post.created_at)}
            </span>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <MoreVertical size={18} />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={handleShare}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Share2 size={16} className="text-slate-500" /> Share Post
              </button>
              {(author.isMine || isAdmin) && (
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={16} className="text-slate-500" /> Delete Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. CAPTION TEXT */}
      {post.content && (
        <p className="text-[14px] text-slate-800 leading-relaxed mb-3">{post.content}</p>
      )}

      {/* 3. IMAGE (If exists) */}
      {post.image_url && (
        <div className="w-full rounded-xl overflow-hidden bg-slate-100 mb-3">
          <img
            src={post.image_url}
            alt="Post content"
            className="w-full h-auto object-cover max-h-[380px]"
          />
        </div>
      )}

      {/* 4. REACTIONS & VIEWS/COMMENTS STATS ROW */}
      <div className="flex items-center justify-between py-2 border-b border-slate-200/70 text-[12px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center -space-x-1">
            <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">
              👍
            </span>
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">
              ❤️
            </span>
            <span className="w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center text-[10px]">
              😂
            </span>
          </div>
          <span className="font-semibold text-slate-600 ml-1">{totalReactions}</span>
        </div>

        <div>
          <span>{viewCount} Views</span>
          <span className="mx-1.5">|</span>
          <button onClick={() => onOpenComments(post)} className="hover:underline">
            {post.comment_count || 0} Comments
          </button>
        </div>
      </div>

      {/* 5. SPLIT ACTION BAR (Like | Comment) WITH 5-EMOJI TRAY */}
      <div className="flex items-center pt-2 relative" ref={reactRef}>
        {/* 5-Emoji Popup Tray */}
        {showReactions && (
          <div className="absolute -top-14 left-2 bg-white rounded-full shadow-[0_6px_25px_rgba(0,0,0,0.15)] border border-slate-100 px-3 py-1.5 flex items-center gap-3 z-30 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setReaction('like')}
              className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center text-[20px] hover:scale-125 transition-transform"
              title="Like"
            >
              👍
            </button>
            <button
              onClick={() => setReaction('love')}
              className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center text-[20px] hover:scale-125 transition-transform"
              title="Love"
            >
              ❤️
            </button>
            <button
              onClick={() => setReaction('smile')}
              className="text-[28px] hover:scale-125 transition-transform"
              title="Smile"
            >
              😊
            </button>
            <button
              onClick={() => setReaction('haha')}
              className="text-[28px] hover:scale-125 transition-transform"
              title="Haha"
            >
              😆
            </button>
            <button
              onClick={() => setReaction('wow')}
              className="text-[28px] hover:scale-125 transition-transform"
              title="Wow"
            >
              😲
            </button>
          </div>
        )}

        <button
          onClick={() => setShowReactions(!showReactions)}
          className="flex-1 flex items-center justify-center gap-2 py-2 text-[14px] font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
        >
          {activeReaction ? (
            <>
              <span className="text-[18px]">{activeReaction.emoji}</span>
              <span className={activeReaction.color}>{activeReaction.label}</span>
            </>
          ) : (
            <>
              <ThumbsUp size={18} className="text-slate-700" />
              <span>Like</span>
            </>
          )}
        </button>

        <div className="w-px h-6 bg-slate-200" />

        <button
          onClick={() => onOpenComments(post)}
          className="flex-1 flex items-center justify-center gap-2 py-2 text-[14px] font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <MessageSquare size={18} className="text-slate-700" />
          <span>Comment</span>
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
  const [me, setMe] = useState(() => {
    try {
      const cached = localStorage.getItem('user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentPost, setCommentPost] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const res = await apiClient.get('/social/wall', { params: { page: 1, limit: 30 } });
      setPosts(res?.data?.data || []);
    } catch {
      try {
        const fallbackRes = await apiClient.get('/social/posts', {
          params: { page: 1, limit: 30 },
        });
        setPosts(fallbackRes?.data?.data || []);
      } catch (error) {
        toast.error(getErrorMessage(error, 'Could not load the feed'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();

    // Load current user profile from /auth/me (or fallback /users/me) so avatar & name are always accurate
    apiClient
      .get('/auth/me')
      .then((res) => {
        const userObj = res?.data?.data ?? res?.data?.user ?? res?.data ?? null;
        if (userObj) setMe(userObj);
      })
      .catch(() => {
        apiClient
          .get('/users/me')
          .then((res) => {
            const userObj = res?.data?.data ?? res?.data?.user ?? res?.data ?? null;
            if (userObj) setMe(userObj);
          })
          .catch(() => {});
      });

    apiClient
      .get('/session-admin/me/roles')
      .then((res) => setIsAdmin(Boolean(res?.data?.data?.is_admin)))
      .catch(() => setIsAdmin(false));
  }, [loadPosts]);

  // FIXED: Converts image to compressed Base64 URL string & sends pure JSON to match FastAPI SocialPostCreateRequest
  const handlePostSubmit = async (content, imageFile) => {
    try {
      let image_url = null;
      if (imageFile) {
        image_url = await compressImageToBase64(imageFile);
      }

      const payload = {
        content: content || ' ',
        image_url,
      };

      const res = await apiClient.post('/social/posts', payload);
      const created = res?.data?.data || res?.data;

      // Immediately prepend post with current user's profile & avatar so it never shows "A" or "Attendee"
      if (created && created.id) {
        const enrichedPost = {
          ...created,
          user_id: me?.id,
          is_mine: true,
          author: {
            id: me?.id,
            name: fullNameOf(me),
            avatar_url: avatarOf(me),
            job_title: me?.job_title,
          },
          reactions: created.reactions || { total: 0 },
          comment_count: created.comment_count || 0,
        };
        setPosts((prev) => [enrichedPost, ...prev]);
      } else {
        await loadPosts();
      }

      toast.success('Posted successfully!');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not post'));
      throw error;
    }
  };

  const handleReact = async (postId, kind) => {
    let toggledKind = kind;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const currentReaction = p.my_reaction;
        const nextReaction = currentReaction === kind ? null : kind;
        toggledKind = nextReaction;

        const prevTotal = p.reactions?.total ?? p.like_count ?? 0;
        let nextTotal = prevTotal;
        if (currentReaction && !nextReaction) nextTotal = Math.max(0, prevTotal - 1);
        else if (!currentReaction && nextReaction) nextTotal = prevTotal + 1;

        return {
          ...p,
          my_reaction: nextReaction,
          like_count: nextTotal,
          reactions: {
            ...(p.reactions || {}),
            total: nextTotal,
          },
        };
      })
    );

    try {
      if (toggledKind) {
        try {
          await apiClient.post(`/social/posts/${postId}/react`, { kind: toggledKind });
        } catch {
          await apiClient.post(`/social/posts/${postId}/like`);
        }
      } else {
        try {
          await apiClient.delete(`/social/posts/${postId}/react`);
        } catch {
          await apiClient.post(`/social/posts/${postId}/unlike`);
        }
      }
    } catch {
      toast.error('Failed to update reaction');
      loadPosts();
    }
  };

  const handleDelete = async (post) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await apiClient.delete(`/social/posts/${post.id}`);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      toast.success('Post deleted');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete post'));
    }
  };

  const bumpComments = (postId, delta) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comment_count: Math.max(0, (p.comment_count || 0) + delta) }
          : p
      )
    );
  };

  const myName = fullNameOf(me) || 'Me';
  const myAvatar = avatarOf(me);

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28 font-sans">
      {/* Header - EXACT ADOBE XD MATCH */}
      <div className="bg-white text-slate-900 px-4 pt-5 pb-4 flex items-center justify-between border-b border-slate-100 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/hub')}
            aria-label="Back"
            className="text-slate-900 hover:text-black transition-colors"
          >
            <ChevronLeft size={26} strokeWidth={2.5} />
          </button>
          <h1 className="text-[20px] font-bold tracking-tight">Activity Hub</h1>
        </div>

        <button
          onClick={() => setShowCreatePost(true)}
          className="text-slate-900 hover:text-[#0000c8] transition-colors"
          aria-label="Create Post"
        >
          <PlusSquare size={24} strokeWidth={2} />
        </button>
      </div>

      {/* Top "Join the conversation" Prompt - EXACT ADOBE XD MATCH */}
      <div
        onClick={() => setShowCreatePost(true)}
        className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
      >
        <div className="w-[42px] h-[42px] rounded-full bg-[#0c1b78] text-white flex items-center justify-center font-bold text-[14px] overflow-hidden shrink-0 shadow-sm">
          {myAvatar ? (
            <img src={myAvatar} alt={myName} className="w-full h-full object-cover" />
          ) : (
            initialsOf(myName)
          )}
        </div>
        <div className="h-8 w-px bg-slate-200 shrink-0" />
        <p className="text-[13px] text-slate-500 leading-snug">
          Join the conversation. Share your thoughts on X with{' '}
          <span className="text-slate-700 font-medium">#EVENTAI26</span>.
        </p>
      </div>

      {/* Feed List */}
      <div className="bg-white px-4 pt-4">
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner />
          </div>
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
          me={me}
          onClose={() => setCommentPost(null)}
          onCountChange={bumpComments}
        />
      )}
    </div>
  );
}