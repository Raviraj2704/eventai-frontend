// ============================================================================
// Sessions Screen
// ============================================================================
// File: src/pages/main/SessionsScreen.jsx
// Purpose: Browse, create, and delete event sessions (Full CRUD + useFeatureManagement)
// Design: Matches the video's Session Details cards (reactions, track tags,
//         Live badge, Add button, Ask a Question / Quiz / Feedback chips,
//         and the green Success popup)
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, ChevronDown, Clock, MapPin, User, Trash2, ThumbsUp,
  Hand, Megaphone, Bookmark, Plus, X, HelpCircle, ClipboardList,
  CheckCircle2, Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../config/apiClient';
import CreateSessionForm from '../../components/forms/CreateSessionForm';
import { useFeatureManagement, CreateDeleteButtons } from '../../hooks/useFeatureManagement';

const CATEGORIES = ['all', 'Technical', 'Workshop', 'Networking'];

// Track tag colors, as shown in the video
const TRACK_COLORS = {
  'Foundational Track': 'bg-pink-600',
  Workshop: 'bg-orange-600',
  'AI Track': 'bg-sky-600',
  'Open Forum': 'bg-slate-800',
  Technical: 'bg-indigo-600',
  Networking: 'bg-emerald-600',
};

const getTrackColor = (name) => TRACK_COLORS[name] || 'bg-blue-600';

// ============================================================================
// Session Card (video style)
// ============================================================================
const SessionCard = ({
  session,
  canDelete,
  onDelete,
  isDeleting,
  reactionState,
  onReact,
  isAdded,
  onToggleAdd,
  isBookmarked,
  onToggleBookmark,
  onOpenAction,
  onOpenQuiz,
}) => {
  const trackName = session?.category || session?.track || 'General';
  const timeText = session?.start_time || session?.time;
  const roomText = session?.location || session?.room;
  const isLive = Boolean(session?.is_live || session?.status === 'live');

  const reactions = [
    { key: 'like', icon: ThumbsUp, label: 'Like' },
    { key: 'clap', icon: Hand, label: 'Clap' },
    { key: 'announce', icon: Megaphone, label: 'Announce' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Cover image */}
      <div className="relative h-40 bg-gradient-to-br from-slate-700 to-slate-900">
        {session?.image_url && (
          <img
            src={session.image_url}
            alt={session?.title || 'Session'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        {canDelete !== false && (
          <button
            type="button"
            onClick={() => onDelete(session.id)}
            disabled={isDeleting}
            className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-red-500 text-white rounded-lg transition-colors"
            title="Delete Session"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Reactions */}
      <div className="flex items-center gap-5 px-4 pt-3 text-slate-600">
        {reactions.map(({ key, icon: Icon, label }) => {
          const active = reactionState[key].active;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onReact(session.id, key)}
              className={`flex items-center gap-1 text-sm ${active ? 'text-blue-600' : 'text-slate-500'}`}
              title={label}
            >
              <Icon size={18} />
              <span>{reactionState[key].count}</span>
            </button>
          );
        })}
      </div>

      {/* Track tags */}
      <div className="flex gap-2 px-4 pt-3 overflow-x-auto">
        <span className={`shrink-0 text-xs font-semibold text-white px-3 py-1 rounded-full ${getTrackColor(trackName)}`}>
          {trackName}
        </span>
        {session?.tags?.slice?.(0, 2).map((tag) => (
          <span key={tag} className="shrink-0 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
            {tag}
          </span>
        ))}
      </div>

      {/* Details */}
      <div className="mx-4 mt-3 p-4 bg-slate-50 rounded-lg">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {isLive && (
              <span className="flex items-center gap-1 text-red-500 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Live
              </span>
            )}
            {timeText && (
              <span className="flex items-center gap-1">
                <Clock size={12} /> {timeText}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onToggleAdd(session.id)}
            className={`flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-md border ${
              isAdded ? 'bg-blue-600 text-white border-blue-600' : 'text-slate-700 border-slate-300 bg-white'
            }`}
          >
            {isAdded ? <CheckCircle2 size={12} /> : <Calendar size={12} />}
            {isAdded ? 'Added' : 'Add'}
          </button>
        </div>

        {roomText && (
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
            <MapPin size={12} /> <span className="truncate">{roomText}</span>
          </div>
        )}

        <h3 className="text-base font-bold text-slate-900 mt-2 line-clamp-2">
          {session?.title || 'Untitled Session'}
        </h3>

        {session?.description && (
          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{session.description}</p>
        )}

        <button type="button" className="text-sm text-blue-700 font-medium mt-1">
          Read more
        </button>
      </div>

      {/* Action chips */}
      <div className="flex gap-2 px-4 pt-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => onOpenAction(session.id, 'question')}
          className="shrink-0 flex items-center gap-1 text-xs font-medium text-slate-700 border border-slate-300 rounded-full px-3 py-1.5"
        >
          <HelpCircle size={14} /> Ask a Question
        </button>
        <button
          type="button"
          onClick={() => onOpenQuiz(session.id)}
          className="shrink-0 flex items-center gap-1 text-xs font-medium text-slate-700 border border-slate-300 rounded-full px-3 py-1.5"
        >
          <ClipboardList size={14} /> Quiz
        </button>
        <button
          type="button"
          onClick={() => onOpenAction(session.id, 'feedback')}
          className="shrink-0 flex items-center gap-1 text-xs font-medium text-slate-700 border border-slate-300 rounded-full px-3 py-1.5"
        >
          <Megaphone size={14} /> Feedback
        </button>
      </div>

      {/* Speaker */}
      {session?.speaker_name && (
        <div className="flex items-center justify-between px-4 py-4 mt-2 border-t border-slate-200">
          <div className="flex items-center gap-2 min-w-0">
            <User size={16} className="text-blue-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{session.speaker_name}</p>
              {session?.speaker_title && (
                <p className="text-xs text-slate-500 truncate">{session.speaker_title}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onToggleBookmark(session.id)}
            className={isBookmarked ? 'text-amber-500' : 'text-slate-400'}
            title="Bookmark"
          >
            <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Sessions Screen
// ============================================================================
const SessionsScreen = () => {
  const navigate = useNavigate();

  // Full CRUD via useFeatureManagement('sessions')
  const {
    items: managedSessions,
    loading: hookLoading,
    canCreate,
    canDelete,
    fetchItems,
    deleteItem,
    isCreating,
    isDeleting,
  } = useFeatureManagement('sessions');

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Video-style local state (reactions, add, bookmark)
  const [reactions, setReactions] = useState({});
  const [addedIds, setAddedIds] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  // Ask a Question / Feedback modal
  const [actionModal, setActionModal] = useState(null); // { sessionId, type }
  const [actionText, setActionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Success popup (as in the video)
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (fetchItems) {
      fetchItems();
    }
    fetchSessions();
  }, [fetchItems]);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/sessions?limit=50');
      const raw = response?.data;
      const list = Array.isArray(raw) ? raw : raw?.data || raw?.sessions || [];
      setSessions(list);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError('Failed to load sessions. Please try again.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    try {
      if (deleteItem) {
        await deleteItem(sessionId);
      } else {
        await apiClient.delete('/sessions/' + sessionId);
      }
    } catch (err) {
      console.warn('Delete session fallback:', err);
    } finally {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success('Session deleted!');
    }
  };

  // Filtering (search + category), same logic as before
  const filteredSessions = useMemo(() => {
    const baseList = sessions.length > 0 ? sessions : managedSessions || [];
    let filtered = baseList;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (session) =>
          (session.title || '').toLowerCase().includes(query) ||
          (session.speaker_name || '').toLowerCase().includes(query) ||
          (session.description || '').toLowerCase().includes(query)
      );
    }

    if (selectedFilter !== 'all') {
      filtered = filtered.filter((session) => session.category === selectedFilter);
    }

    return filtered;
  }, [searchQuery, selectedFilter, sessions, managedSessions]);

  const totalCount = sessions.length || (managedSessions ? managedSessions.length : 0);

  // ---------------------------------------------------------------------------
  // Local video-style handlers
  // ---------------------------------------------------------------------------
  const getReactionState = (sessionId) =>
    reactions[sessionId] || {
      like: { count: 0, active: false },
      clap: { count: 0, active: false },
      announce: { count: 0, active: false },
    };

  const handleReact = (sessionId, key) => {
    const current = getReactionState(sessionId);
    const item = current[key];
    const next = {
      ...current,
      [key]: {
        count: item.active ? item.count - 1 : item.count + 1,
        active: !item.active,
      },
    };
    setReactions((prev) => ({ ...prev, [sessionId]: next }));
  };

  const toggleAdd = (sessionId) => {
    setAddedIds((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId]
    );
  };

  const toggleBookmark = (sessionId) => {
    setBookmarkedIds((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId]
    );
  };

  const openQuiz = (sessionId) => {
    navigate(`/sessions/${sessionId}/quiz`);
  };

  const openAction = (sessionId, type) => {
    setActionText('');
    setActionModal({ sessionId, type });
  };

  const handleSubmitAction = async () => {
    if (!actionModal || !actionText.trim()) return;
    setSubmitting(true);
    try {
      const path =
        actionModal.type === 'question'
          ? `/sessions/${actionModal.sessionId}/questions`
          : `/sessions/${actionModal.sessionId}/feedback`;
      await apiClient.post(path, { content: actionText.trim() });
      setSuccessMessage(
        actionModal.type === 'feedback'
          ? 'Your feedback submitted successfully'
          : 'Your question was submitted successfully'
      );
      setActionModal(null);
      setActionText('');
      setSuccessOpen(true);
    } catch (err) {
      console.error('Submit failed:', err);
      toast.error('Could not submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------------------------
  const SkeletonCard = () => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse border border-slate-200">
      <div className="bg-slate-300 h-40" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-300 rounded w-3/4" />
        <div className="h-3 bg-slate-300 rounded w-1/2" />
        <div className="h-3 bg-slate-300 rounded w-full" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28">
      {/* Header */}
      <div className="bg-[#0c1b78] text-white px-4 pt-5 pb-4 flex justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Sessions</h1>
          <p className="text-sm text-white/80">Browse and discover {totalCount} sessions</p>
        </div>
        {canCreate !== false && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={isCreating}
            className="flex items-center gap-1 bg-white text-[#0c1b78] px-3 py-2 rounded-lg text-sm font-semibold shadow-sm"
          >
            <Plus size={16} /> Create Session
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 p-4">
        {CreateDeleteButtons && (
          <div className="mb-3">
            <CreateDeleteButtons
              featureKey="sessions"
              canCreate={canCreate}
              canDelete={canDelete}
              onCreate={() => setIsCreateModalOpen(true)}
              isCreating={isCreating}
              isDeleting={isDeleting}
            />
          </div>
        )}

        <div className="relative mb-3">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search sessions, speakers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="relative w-full">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Filter size={18} />
            <span className="text-sm font-medium">
              {selectedFilter === 'all' ? 'All Sessions' : selectedFilter}
            </span>
            <ChevronDown size={16} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
          </button>

          {filterOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-300 rounded-lg shadow-lg z-50">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedFilter(category);
                    setFilterOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-slate-100 transition-colors font-medium"
                >
                  {category === 'all' ? 'All Sessions' : category}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
            <button onClick={fetchSessions} className="ml-3 underline font-medium">
              Try Again
            </button>
          </div>
        )}

        {loading && hookLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredSessions.length > 0 ? (
          <>
            <div className="mb-4 text-sm text-slate-600">
              Showing {filteredSessions.length} of {totalCount} sessions
            </div>
            <div className="grid grid-cols-1 gap-4">
              {filteredSessions.map((session, index) => (
                <SessionCard
                  key={session.id || index}
                  session={session}
                  canDelete={canDelete}
                  onDelete={handleDeleteSession}
                  isDeleting={isDeleting}
                  reactionState={getReactionState(session.id)}
                  onReact={handleReact}
                  isAdded={addedIds.includes(session.id)}
                  onToggleAdd={toggleAdd}
                  isBookmarked={bookmarkedIds.includes(session.id)}
                  onToggleBookmark={toggleBookmark}
                  onOpenAction={openAction}
                  onOpenQuiz={openQuiz}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-slate-600 mb-4">
              {searchQuery
                ? `No sessions found matching "${searchQuery}"`
                : 'No sessions available yet'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 z-10"
            >
              <X size={20} />
            </button>
            <div className="p-2">
              <CreateSessionForm
                onSuccess={() => {
                  setIsCreateModalOpen(false);
                  fetchSessions();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Ask a Question / Feedback Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5 relative">
            <button
              onClick={() => setActionModal(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold text-slate-900 mb-3">
              {actionModal.type === 'question' ? 'Ask a Question' : 'Feedback'}
            </h2>
            <textarea
              value={actionText}
              onChange={(e) => setActionText(e.target.value)}
              rows={4}
              placeholder={
                actionModal.type === 'question' ? 'Type your question...' : 'Share your feedback...'
              }
              className="w-full border border-slate-300 rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSubmitAction}
              disabled={submitting || !actionText.trim()}
              className="w-full mt-4 bg-blue-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      )}

      {/* Success Popup (as in the video) */}
      {successOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs p-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle2 size={36} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-4">Success!</h2>
            <p className="text-sm text-slate-600 mt-1">{successMessage}</p>
            <button
              onClick={() => setSuccessOpen(false)}
              className="mt-5 bg-blue-700 text-white px-8 py-2 rounded-md font-medium"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionsScreen;