// ============================================================================
// Session Detail Screen (matches the reference video)
// File: src/pages/main/SessionDetailScreen.jsx
// Route: /sessions/:id
// Real API only:
//   GET    /session-hub/sessions/{id}
//   POST/DELETE /session-hub/sessions/{id}/schedule
//   POST/DELETE /session-hub/sessions/{id}/bookmark
//   POST   /session-hub/sessions/{id}/check-in
//   POST   /session-hub/sessions/{id}/reactions
//   DELETE /session-hub/sessions/{id}/reactions/{kind}
//   GET    /session-hub/sessions/{id}/stream
//   POST   /session-hub/sessions/{id}/questions
//   POST   /session-hub/sessions/{id}/feedback
// Quiz opens the existing /sessions/:id/quiz screen.
// ============================================================================

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Bookmark, Share2, Clock, MapPin, Play, Calendar, CheckCircle2,
  ThumbsUp, Hand, Megaphone, HelpCircle, ClipboardList, User, Star, X,
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SessionAdminBar from '../../components/sessions/SessionAdminBar';
import apiClient from '../../config/apiClient';

const TRACK_COLORS = [
  'bg-pink-600', 'bg-orange-600', 'bg-sky-600', 'bg-slate-800', 'bg-indigo-600', 'bg-emerald-600',
];

const REACTIONS = [
  { key: 'like', label: 'Like', icon: ThumbsUp },
  { key: 'clap', label: 'Clap', icon: Hand },
  { key: 'announce', label: 'Announce', icon: Megaphone },
];

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

const trackColor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return TRACK_COLORS[hash % TRACK_COLORS.length];
};

const formatVideoDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const n = d.getDate();
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
  const month = d.toLocaleString('en-US', { month: 'short' });
  return `${n}${suffix} ${month}, ${d.getFullYear()}`;
};

export default function SessionDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(null);
  const [busy, setBusy] = useState('');
  const [sheet, setSheet] = useState(null); // 'question' | 'feedback' | null
  const [questionText, setQuestionText] = useState('');
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/session-hub/sessions/${id}`);
        if (!cancelled) setItem(res?.data?.data || null);
      } catch (err) {
        if (!cancelled) {
          setItem(null);
          toast.error(getErrorMessage(err, 'Could not load this session'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const patch = (changes) => setItem((prev) => (prev ? { ...prev, ...changes } : prev));

  const toggleSchedule = async () => {
    if (!item || busy) return;
    const adding = !item.is_scheduled;
    setBusy('schedule');
    patch({ is_scheduled: adding });
    try {
      if (adding) {
        await apiClient.post(`/session-hub/sessions/${id}/schedule`);
        toast.success('Added to your schedule');
      } else {
        await apiClient.delete(`/session-hub/sessions/${id}/schedule`);
        toast.success('Removed from your schedule');
      }
    } catch (err) {
      patch({ is_scheduled: !adding });
      toast.error(getErrorMessage(err, 'Could not update your schedule'));
    } finally {
      setBusy('');
    }
  };

  const toggleBookmark = async () => {
    if (!item || busy) return;
    const saving = !item.is_bookmarked;
    setBusy('bookmark');
    patch({ is_bookmarked: saving });
    try {
      if (saving) {
        await apiClient.post(`/session-hub/sessions/${id}/bookmark`);
        toast.success('Saved');
      } else {
        await apiClient.delete(`/session-hub/sessions/${id}/bookmark`);
        toast.success('Removed from saved');
      }
    } catch (err) {
      patch({ is_bookmarked: !saving });
      toast.error(getErrorMessage(err, 'Could not update saved sessions'));
    } finally {
      setBusy('');
    }
  };

  const toggleReaction = async (kind) => {
    if (!item || busy) return;
    const active = (item.my_reactions || []).includes(kind);
    setBusy(`reaction-${kind}`);
    try {
      const res = active
        ? await apiClient.delete(`/session-hub/sessions/${id}/reactions/${kind}`)
        : await apiClient.post(`/session-hub/sessions/${id}/reactions`, { kind });
      const data = res?.data?.data;
      if (data) {
        patch({ reactions: data.reactions, my_reactions: data.my_reactions });
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save your reaction'));
    } finally {
      setBusy('');
    }
  };

  const checkIn = async () => {
    if (!item || busy) return;
    setBusy('checkin');
    try {
      await apiClient.post(`/session-hub/sessions/${id}/check-in`);
      patch({ is_checked_in: true });
      toast.success('Checked in');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not check you in'));
    } finally {
      setBusy('');
    }
  };

  const watch = async () => {
    try {
      const res = await apiClient.get(`/session-hub/sessions/${id}/stream`);
      const url = res?.data?.data?.stream_url;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('Stream link is not available');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'This session is not live right now'));
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: item?.title || 'Session', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      }
    } catch (err) {
      console.warn('Share cancelled or unavailable:', err);
    }
  };

  const submitQuestion = async () => {
    const content = questionText.trim();
    if (content.length < 3) {
      toast.error('Write at least 3 characters');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post(`/session-hub/sessions/${id}/questions`, { content });
      setQuestionText('');
      setSheet(null);
      toast.success('Your question has been sent');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not send your question'));
    } finally {
      setSubmitting(false);
    }
  };

  const submitFeedback = async () => {
    if (rating < 1) {
      toast.error('Choose a star rating');
      return;
    }
    setSubmitting(true);
    try {
      const text = feedbackText.trim();
      await apiClient.post(`/session-hub/sessions/${id}/feedback`, {
        rating,
        content: text || undefined,
      });
      setRating(0);
      setFeedbackText('');
      setSheet(null);
      toast.success('Thanks for your feedback');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save your feedback'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white max-w-[430px] mx-auto">
        <div className="py-24">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-white max-w-[430px] mx-auto p-6 text-center">
        <p className="text-slate-600 mt-16 mb-6">This session could not be found.</p>
        <button
          type="button"
          onClick={() => navigate('/sessions')}
          className="px-4 py-2 rounded-lg bg-[#0000c8] text-white font-medium"
        >
          Back to sessions
        </button>
      </div>
    );
  }

  const reactionCounts = item.reactions || {};
  const myReactions = item.my_reactions || [];
  const longDescription = item.description || '';
  const shortDescription = longDescription.length > 160 && !expanded
    ? `${longDescription.slice(0, 160)}...`
    : longDescription;

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} aria-label="Back" className="text-slate-700">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-semibold text-slate-900">Session Details</h1>
        </div>
        <div className="flex items-center gap-4 text-slate-600">
          <button type="button" onClick={share} aria-label="Share session">
            <Share2 size={18} />
          </button>
          <button
            type="button"
            onClick={toggleBookmark}
            disabled={busy === 'bookmark'}
            aria-label={item.is_bookmarked ? 'Remove from saved' : 'Save session'}
            className={item.is_bookmarked ? 'text-amber-500' : ''}
          >
            <Bookmark size={18} fill={item.is_bookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

            <SessionAdminBar sessionId={id} onChanged={() => window.location.reload()} />

      {/* Banner */}
      <div className="relative h-44 bg-gradient-to-br from-slate-700 to-slate-900 overflow-hidden">
        {item.image_url && (
          <img src={item.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
      </div>

      {/* Track chips */}
      <div className="flex gap-2 px-4 pt-4 overflow-x-auto">
        <span className={`shrink-0 text-xs font-semibold text-white px-3 py-1 rounded-full ${trackColor(item.track)}`}>
          {item.track}
        </span>
        {(item.tags || []).map((tag) => (
          <span key={tag} className="shrink-0 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
            {tag}
          </span>
        ))}
      </div>

      {/* Reactions */}
      <div className="flex gap-6 px-4 pt-4">
        {REACTIONS.map(({ key, label, icon: Icon }) => {
          const active = myReactions.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleReaction(key)}
              disabled={busy === `reaction-${key}`}
              aria-label={label}
              className={`flex items-center gap-1.5 text-sm ${active ? 'text-[#0000c8]' : 'text-slate-500'}`}
            >
              <Icon size={18} />
              <span>{reactionCounts[key] || 0}</span>
            </button>
          );
        })}
      </div>

      {/* Status, date, room */}
      <div className="px-4 pt-4 space-y-2">
        {item.is_live ? (
          <p className="flex items-center gap-1.5 text-sm font-semibold text-red-500">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Live and Streaming
          </p>
        ) : item.status === 'ended' ? (
          <p className="text-sm font-semibold text-slate-500">Ended</p>
        ) : (
          <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-500">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Upcoming
          </p>
        )}
        <p className="text-sm text-slate-600 flex items-center gap-2">
          <Clock size={14} />
          {item.start_time ? `${formatVideoDate(item.start_time)} | ${item.time_label}` : item.time_label}
        </p>
        {item.location && (
          <p className="text-sm text-slate-600 flex items-center gap-2">
            <MapPin size={14} />
            {item.location}
          </p>
        )}
        <h2 className="text-xl font-bold text-slate-900 pt-2">{item.title}</h2>
      </div>

      {/* Schedule, watch, check in */}
      <div className="px-4 pt-4 space-y-3">
        <button
          type="button"
          onClick={toggleSchedule}
          disabled={busy === 'schedule'}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold disabled:opacity-50 ${
            item.is_scheduled ? 'bg-slate-100 text-slate-800' : 'bg-[#0000c8] text-white'
          }`}
        >
          {item.is_scheduled ? <CheckCircle2 size={18} /> : <Calendar size={18} />}
          {item.is_scheduled ? 'Added to My Schedule' : 'Add to My Schedule'}
        </button>

        {item.is_live && (
          <button
            type="button"
            onClick={watch}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 font-semibold text-slate-800"
          >
            <Play size={18} />
            Watch
          </button>
        )}

        {item.is_scheduled && item.is_live && !item.is_checked_in && (
          <button
            type="button"
            onClick={checkIn}
            disabled={busy === 'checkin'}
            className="w-full rounded-xl border border-emerald-600 text-emerald-700 py-3 font-semibold disabled:opacity-50"
          >
            Check in
          </button>
        )}
        {item.is_checked_in && (
          <p className="text-center text-sm font-semibold text-emerald-700">You are checked in</p>
        )}
      </div>

      {/* Engage: Ask A Question, Quiz, Session Feedback */}
      <div className="px-4 pt-5">
        <p className="text-sm font-semibold text-slate-700 mb-2">Engage</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setSheet('question')}
            className="rounded-xl border border-slate-200 py-3 flex flex-col items-center gap-1 text-xs font-semibold text-slate-800"
          >
            <HelpCircle size={18} />
            Ask A Question
          </button>
          <button
            type="button"
            onClick={() => navigate(`/sessions/${id}/quiz`)}
            className="rounded-xl border border-slate-200 py-3 flex flex-col items-center gap-1 text-xs font-semibold text-slate-800"
          >
            <ClipboardList size={18} />
            Take Quiz
          </button>
          <button
            type="button"
            onClick={() => setSheet('feedback')}
            className="rounded-xl border border-slate-200 py-3 flex flex-col items-center gap-1 text-xs font-semibold text-slate-800"
          >
            <Megaphone size={18} />
            Session Feedback
          </button>
        </div>
      </div>

      {/* About */}
      {longDescription && (
        <div className="px-4 pt-6">
          <p className="text-sm font-semibold text-slate-900 mb-2">About Session</p>
          <p className="text-sm text-slate-700 leading-relaxed">{shortDescription}</p>
          {longDescription.length > 160 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-sm text-[#0000c8] font-medium mt-1"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      {/* Speakers */}
      {(item.speakers || []).length > 0 && (
        <div className="px-4 pt-6">
          <p className="text-sm font-semibold text-slate-900 mb-2">Speakers</p>
          <div className="space-y-2">
            {item.speakers.map((sp) => (
              <div key={sp.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <User size={18} />
                </div>
                <p className="text-sm font-semibold text-slate-900">{sp.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ask A Question sheet */}
      {sheet === 'question' && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center" onClick={() => setSheet(null)}>
          <div
            className="bg-white w-full max-w-[430px] rounded-t-2xl p-4 mb-16"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-slate-900">Ask A Question</p>
              <button type="button" onClick={() => setSheet(null)} aria-label="Close" className="text-slate-500">
                <X size={20} />
              </button>
            </div>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Type your question..."
              className="w-full border border-slate-300 rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={submitQuestion}
              disabled={submitting}
              className="w-full mt-3 rounded-lg bg-[#0000c8] text-white py-3 font-semibold disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Send question'}
            </button>
          </div>
        </div>
      )}

      {/* Feedback sheet */}
      {sheet === 'feedback' && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center" onClick={() => setSheet(null)}>
          <div
            className="bg-white w-full max-w-[430px] rounded-t-2xl p-4 mb-16"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-slate-900">Session Feedback</p>
              <button type="button" onClick={() => setSheet(null)} aria-label="Close" className="text-slate-500">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-700 mb-2">How was this session?</p>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                >
                  <Star
                    size={28}
                    className={n <= rating ? 'text-yellow-500 fill-yellow-400' : 'text-slate-300'}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Anything you'd like to add? (optional)"
              className="w-full border border-slate-300 rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={submitFeedback}
              disabled={submitting}
              className="w-full mt-3 rounded-lg bg-[#0000c8] text-white py-3 font-semibold disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Submit feedback'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}