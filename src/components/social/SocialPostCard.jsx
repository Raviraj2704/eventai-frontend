// ============================================================================
// Social post card and comments sheet (shared by Social Wall and Activity Hub)
// File: src/components/social/SocialPostCard.jsx
// Real API only:
//   POST   /social/posts/{id}/react        set reaction
//   DELETE /social/posts/{id}/react        remove reaction
//   DELETE /social/posts/{id}              delete own post
//   GET    /social/posts/{id}/comments     comments
//   POST   /social/posts/{id}/comments     add comment
//   DELETE /social/comments/{id}           delete own comment
// ============================================================================

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ThumbsUp, Heart, Smile, MessageSquare, Share2, Trash2, X, Send } from 'lucide-react';
import apiClient from '../../config/apiClient';

export const REACTIONS = {
  like: { label: 'Like', Icon: ThumbsUp, color: 'text-[#1877f2]', bg: 'bg-[#1877f2]' },
  love: { label: 'Love', Icon: Heart, color: 'text-[#f02849]', bg: 'bg-[#f02849]' },
  haha: { label: 'Haha', Icon: Smile, color: 'text-[#f7b125]', bg: 'bg-[#f7b125]' },
};

const getErrorMessage = (error, fallback) => {
  const detail = error?.data?.detail ?? error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => `${(d.loc || []).slice(1).join('.')}: ${d.msg}`).join(', ') || fallback;
  }
  return error?.message || fallback;
};

const unwrap = (body) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  return [];
};

export const timeAgo = (iso) => {
  if (!iso) return '';
  // Backend stores UTC without a timezone marker, so mark it as UTC
  const normalized = /Z|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`;
  const diff = (Date.now() - new Date(normalized).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return new Date(normalized).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const initialsOf = (name) =>
  (name || 'A').split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'A';

function Avatar({ src, name, size = 'w-11 h-11' }) {
  return src ? (
    <img src={src} alt={name} className={`${size} rounded-full object-cover shrink-0`} />
  ) : (
    <div className={`${size} rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold shrink-0`}>
      {initialsOf(name)}
    </div>
  );
}

function ReactionSummary({ reactions }) {
  const kinds = Object.keys(REACTIONS).filter((k) => (reactions?.[k] || 0) > 0);
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-1">
        {kinds.map((k) => {
          const { Icon, bg } = REACTIONS[k];
          return (
            <span key={k} className={`w-5 h-5 rounded-full ${bg} text-white flex items-center justify-center ring-2 ring-white`}>
              <Icon size={11} fill="currentColor" />
            </span>
          );
        })}
      </div>
      <span className="text-sm text-slate-600">{reactions?.total || 0}</span>
    </div>
  );
}

export default function SocialPostCard({ post, variant = 'hub', onChanged, onComment, onDeleted }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const mine = post.my_reaction || null;
  const mineMeta = mine ? REACTIONS[mine] : null;
  const CurrentIcon = mineMeta ? mineMeta.Icon : ThumbsUp;
  const authorName = post.author?.name || 'Attendee';
  const isWall = variant === 'wall';

  const react = async (kind) => {
    setPickerOpen(false);
    setBusy(true);
    try {
      if (kind === null) {
        await apiClient.delete(`/social/posts/${post.id}/react`);
      } else {
        await apiClient.post(`/social/posts/${post.id}/react`, { kind });
      }
      onChanged?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save your reaction'));
    } finally {
      setBusy(false);
    }
  };

  // Tap once to open the picker. Tap again on a chosen reaction to remove it.
  const mainTap = () => {
    if (mine) react(null);
    else setPickerOpen((open) => !open);
  };

  const remove = async () => {
    if (!window.confirm('Delete this post?')) return;
    setBusy(true);
    try {
      await apiClient.delete(`/social/posts/${post.id}`);
      toast.success('Post deleted');
      onDeleted?.(post.id);
      onChanged?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete this post'));
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    const text = post.content || '';
    try {
      if (navigator.share) {
        await navigator.share({ title: authorName, text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
      }
    } catch {
      // User closed the share sheet
    }
  };

  const actions = (
    <div className="relative flex border-t border-slate-200 pt-1">
      {pickerOpen && (
        <div className="absolute bottom-12 left-2 z-20 flex gap-2 rounded-full bg-white shadow-lg border border-slate-200 px-3 py-2">
          {Object.entries(REACTIONS).map(([k, { Icon, color, label }]) => (
            <button
              key={k}
              type="button"
              onClick={() => react(k)}
              aria-label={label}
              className={`w-9 h-9 rounded-full flex items-center justify-center ${color} hover:scale-110 transition-transform`}
            >
              <Icon size={22} fill="currentColor" />
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={mainTap}
        disabled={busy}
        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold disabled:opacity-50 ${
          mineMeta ? mineMeta.color : 'text-slate-700'
        }`}
      >
        <CurrentIcon size={20} fill={mineMeta ? 'currentColor' : 'none'} />
        {mineMeta ? mineMeta.label : 'Like'}
      </button>

      <div className="w-px bg-slate-200 my-2" />

      <button
        type="button"
        onClick={() => onComment?.(post)}
        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-slate-700"
      >
        <MessageSquare size={20} />
        Comment
      </button>
    </div>
  );

  if (isWall) {
    return (
      <div className="rounded-2xl border-2 border-[#0c1b78]/80 bg-white overflow-hidden shadow-sm">
        {post.image_url && (
          <div className="relative">
            <img src={post.image_url} alt="" className="w-full max-h-96 object-cover" />
            <button
              type="button"
              onClick={share}
              aria-label="Share"
              className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center text-slate-800"
            >
              <Share2 size={18} />
            </button>
          </div>
        )}

        <div className="p-4 space-y-3">
          <p className="text-sm text-slate-800 whitespace-pre-wrap">{post.content}</p>
          <div className="flex items-center gap-3">
            <Avatar src={post.author?.avatar_url} name={authorName} size="w-10 h-10" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{authorName}</p>
              <p className="text-xs text-slate-500">{timeAgo(post.created_at)}</p>
            </div>
            {!post.image_url && (
              <button type="button" onClick={share} aria-label="Share" className="text-slate-500">
                <Share2 size={18} />
              </button>
            )}
            {post.is_mine && (
              <button type="button" onClick={remove} disabled={busy} aria-label="Delete post" className="text-red-600 disabled:opacity-50">
                <Trash2 size={18} />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <ReactionSummary reactions={post.reactions} />
            <span className="text-xs text-slate-500">{post.comment_count} Comments</span>
          </div>
        </div>
        {actions}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-100 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={post.author?.avatar_url} name={authorName} />
          <div className="min-w-0">
            <p className="text-base font-semibold text-slate-900 truncate">{authorName}</p>
            <p className="text-xs text-slate-500">{timeAgo(post.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={share} aria-label="Share" className="text-slate-500">
            <Share2 size={18} />
          </button>
          {post.is_mine && (
            <button type="button" onClick={remove} disabled={busy} aria-label="Delete post" className="text-red-600 disabled:opacity-50">
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-800 whitespace-pre-wrap">{post.content}</p>

      {post.image_url && (
        <img src={post.image_url} alt="" className="mt-3 w-full rounded-xl object-cover max-h-80" />
      )}

      <div className="mt-3 flex items-center justify-between">
        <ReactionSummary reactions={post.reactions} />
        <span className="text-xs text-slate-500">{post.comment_count} Comments</span>
      </div>

      <div className="mt-2">{actions}</div>
    </div>
  );
}

export function CommentsSheet({ post, onClose, onCountChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get(`/social/posts/${post.id}/comments`)
      .then((res) => {
        if (!cancelled) setItems(listOf(res?.data));
      })
      .catch((error) => {
        if (!cancelled) toast.error(getErrorMessage(error, 'Could not load comments'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [post.id]);

  const send = async (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const res = await apiClient.post(`/social/posts/${post.id}/comments`, { content });
      const saved = res?.data?.data ?? res?.data ?? { content };
      setItems((prev) => [...prev, saved]);
      setText('');
      onCountChange?.(post.id, 1);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not post your comment'));
    } finally {
      setSending(false);
    }
  };

  const removeComment = async (c) => {
    try {
      await apiClient.delete(`/social/comments/${c.id}`);
      setItems((prev) => prev.filter((x) => x.id !== c.id));
      onCountChange?.(post.id, -1);
    } catch (error) {
      toast.error(getErrorMessage(error, 'You can only delete your own comments'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-[430px] h-[70vh] rounded-t-2xl flex flex-col mb-16"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <p className="font-semibold text-slate-900">Comments ({items.length})</p>
          <button type="button" onClick={onClose} aria-label="Close comments" className="text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && <p className="text-center text-sm text-slate-500 py-8">Loading...</p>}
          {!loading && items.length === 0 && (
            <p className="text-center text-sm text-slate-500 py-8">No comments yet. Start the conversation.</p>
          )}
          {items.map((c, i) => (
            <div key={c.id ?? i} className="flex gap-3">
              <Avatar src={c.author_avatar_url} name={c.author_name || c.user_name || 'Attendee'} size="w-9 h-9" />
              <div className="flex-1 min-w-0 rounded-xl bg-slate-100 px-3 py-2">
                <div className="flex justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">{c.author_name || c.user_name || 'Attendee'}</p>
                  {c.id && (
                    <button type="button" onClick={() => removeComment(c)} aria-label="Delete comment" className="text-slate-400 hover:text-red-600">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-800">{c.content}</p>
                <p className="text-[11px] text-slate-500 mt-1">{timeAgo(c.created_at)}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={send} className="flex gap-2 p-3 border-t border-slate-200">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            aria-label="Send comment"
            className="w-11 h-11 rounded-lg bg-[#0000c8] text-white flex items-center justify-center disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}