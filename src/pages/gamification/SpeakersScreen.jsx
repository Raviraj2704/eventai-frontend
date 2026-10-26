// ============================================================================
// Speakers Screen
// File: src/pages/gamification/SpeakersScreen.jsx
// Design: Matches the video's Speakers page (featured speaker cards, search with
//         filter, Total Count line, AI Matches badge, list rows with bookmarks)
// Data:   Real API only
//   GET    /speakers                      list speakers
//   GET    /speakers/me/following         speaker IDs the logged-in user follows
//   POST   /speakers/{id}/follow          follow
//   DELETE /speakers/{id}/follow          unfollow
//   GET    /chat/speakers/{id}/messages   conversation with a speaker
//   POST   /chat/speakers/{id}/messages   send a message to a speaker
//   GET    /auth/me                       logged-in user (to detect own profile)
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search, SlidersHorizontal, Bookmark, Star, MessageCircle, Sparkles,
  Plus, Trash2, Pencil, Calendar, ChevronRight, X, Send,
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';
import { useFeatureManagement } from '../../hooks/useFeatureManagement';

const FILTERS = [
  { value: 'all', label: 'All speakers' },
  { value: 'following', label: 'Following' },
  { value: 'bookmarked', label: 'Bookmarked' },
];

// Reads the server's reason (e.g. "You cannot follow yourself") from any error shape
const getErrorMessage = (error, fallback) =>
  error?.response?.data?.detail ||
  error?.data?.detail ||
  error?.data?.message ||
  error?.message ||
  fallback;

const getFullName = (s) =>
  s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Speaker';

const getInitials = (s) =>
  getFullName(s)
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'S';

const Avatar = ({ speaker, size = 'w-14 h-14', textSize = 'text-base' }) =>
  speaker.avatar_url ? (
    <img
      src={speaker.avatar_url}
      alt={getFullName(speaker)}
      className={`${size} rounded-full object-cover shrink-0`}
    />
  ) : (
    <div
      className={`${size} rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 font-semibold text-neutral-600 ${textSize}`}
    >
      {getInitials(speaker)}
    </div>
  );

const SpeakersScreen = () => {
  const navigate = useNavigate();

  const {
    canCreate,
    canDelete,
    fetchItems,
    createItem,
    deleteItem,
    isDeleting,
  } = useFeatureManagement('speakers');

  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState(null);
  const [followingIds, setFollowingIds] = useState([]);
  const [followBusyId, setFollowBusyId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  // Chat state
  const [chatSpeaker, setChatSpeaker] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatText, setChatText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (fetchItems) {
      fetchItems();
    }
    loadCurrentUser();
    loadFollowing();
    loadSpeakers();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      setMyUserId(response?.data?.id ?? null);
    } catch (error) {
      console.error('Could not load current user:', error);
    }
  };

  const loadFollowing = async () => {
    try {
      const response = await apiClient.get('/speakers/me/following');
      const ids = response?.data?.data?.speaker_ids || [];
      setFollowingIds(ids);
    } catch (error) {
      console.error('Could not load followed speakers:', error);
    }
  };

  const loadSpeakers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/speakers', { params: { limit: 50 } });
      const raw = response?.data;
      const list = Array.isArray(raw) ? raw : raw?.data || raw?.speakers || [];
      setSpeakers(list);
    } catch (error) {
      console.error('Error loading speakers:', error);
      toast.error(getErrorMessage(error, 'Failed to load speakers'));
    } finally {
      setLoading(false);
    }
  };

  const isOwnProfile = (speaker) =>
    myUserId !== null && speaker.user_id !== undefined && speaker.user_id === myUserId;

  const isFollowing = (speakerId) => followingIds.includes(speakerId);

  // Search by name, designation, company, bio, and expertise, plus the filter
  const visibleSpeakers = useMemo(() => {
    let list = speakers;

    if (filter === 'following') {
      list = list.filter((s) => followingIds.includes(s.id));
    } else if (filter === 'bookmarked') {
      list = list.filter((s) => bookmarkedIds.includes(s.id));
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (s) =>
          getFullName(s).toLowerCase().includes(query) ||
          (s.designation || '').toLowerCase().includes(query) ||
          (s.company || '').toLowerCase().includes(query) ||
          (s.bio || '').toLowerCase().includes(query) ||
          (Array.isArray(s.expertise) &&
            s.expertise.some((e) => String(e).toLowerCase().includes(query)))
      );
    }

    return list;
  }, [speakers, searchQuery, filter, bookmarkedIds, followingIds]);

  // Featured = top rated speakers from the real data
  const featuredSpeakers = useMemo(
    () =>
      [...speakers]
        .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
        .slice(0, 6),
    [speakers]
  );

  const toggleBookmark = (speakerId) => {
    setBookmarkedIds((prev) =>
      prev.includes(speakerId) ? prev.filter((id) => id !== speakerId) : [...prev, speakerId]
    );
  };

  const handleFollowToggle = async (speaker) => {
    if (followBusyId !== null) return;
    setFollowBusyId(speaker.id);
    try {
      if (isFollowing(speaker.id)) {
        await apiClient.delete(`/speakers/${speaker.id}/follow`);
        setFollowingIds((prev) => prev.filter((id) => id !== speaker.id));
        toast.success('Unfollowed');
      } else {
        await apiClient.post(`/speakers/${speaker.id}/follow`);
        setFollowingIds((prev) => (prev.includes(speaker.id) ? prev : [...prev, speaker.id]));
        toast.success('Speaker followed!');
      }
    } catch (error) {
      console.error('Follow update failed:', error);
      toast.error(getErrorMessage(error, 'Failed to update follow'));
    } finally {
      setFollowBusyId(null);
    }
  };

  const handleRate = () => {
    navigate('/ratings');
  };

  // ---------------------------------------------------------------------------
  // Chat with a speaker (real endpoints)
  // ---------------------------------------------------------------------------
  const openChat = async (speaker) => {
    setChatSpeaker(speaker);
    setMessages([]);
    setChatText('');
    setChatLoading(true);
    try {
      const response = await apiClient.get(`/chat/speakers/${speaker.id}/messages`, {
        params: { limit: 100 },
      });
      setMessages(response?.data?.data || []);
    } catch (error) {
      console.error('Could not load conversation:', error);
      toast.error(getErrorMessage(error, 'Could not load messages'));
    } finally {
      setChatLoading(false);
    }
  };

  const closeChat = () => {
    setChatSpeaker(null);
    setMessages([]);
    setChatText('');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const content = chatText.trim();
    if (!content || !chatSpeaker || sending) return;

    setSending(true);
    try {
      const response = await apiClient.post(`/chat/speakers/${chatSpeaker.id}/messages`, {
        content,
      });
      const saved = response?.data?.data;
      if (saved) {
        setMessages((prev) => [...prev, saved]);
      }
      setChatText('');
    } catch (error) {
      console.error('Send failed:', error);
      toast.error(getErrorMessage(error, 'Could not send your message'));
    } finally {
      setSending(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Create / edit / delete (unchanged behaviour)
  // ---------------------------------------------------------------------------
  const handleCreate = async () => {
    const firstName = window.prompt('Enter speaker first name:');
    if (!firstName) return;
    const lastName = window.prompt('Enter speaker last name:') || '';
    const designation = window.prompt('Enter speaker designation/title:') || 'Speaker';
    const company = window.prompt('Enter speaker company:') || '';
    const bio = window.prompt('Enter speaker bio:') || '';

    const payload = {
      first_name: firstName,
      last_name: lastName,
      name: `${firstName} ${lastName}`.trim(),
      designation,
      company,
      bio,
    };

    try {
      if (createItem) {
        await createItem(payload);
      } else {
        await apiClient.post('/speakers', payload);
      }
      toast.success('Speaker created!');
      loadSpeakers();
    } catch (error) {
      console.error('Error creating speaker:', error);
      toast.error(getErrorMessage(error, 'Failed to create speaker'));
    }
  };

  const handleEdit = async (speaker) => {
    const designation = window.prompt('Designation:', speaker.designation || '');
    if (designation === null) return;
    const company = window.prompt('Company:', speaker.company || '');
    if (company === null) return;
    const bio = window.prompt('Bio:', speaker.bio || '');
    if (bio === null) return;

    try {
      await apiClient.put(`/speakers/${speaker.id}`, { designation, company, bio });
      toast.success('Speaker updated!');
      loadSpeakers();
    } catch (error) {
      console.error('Error updating speaker:', error);
      toast.error(getErrorMessage(error, 'Failed to update speaker'));
    }
  };

  const handleDelete = async (speakerId) => {
    if (!window.confirm('Are you sure you want to delete this speaker?')) return;
    try {
      if (deleteItem) {
        await deleteItem(speakerId);
      } else {
        await apiClient.delete(`/speakers/${speakerId}`);
      }
      setSpeakers((prev) => prev.filter((s) => s.id !== speakerId));
      toast.success('Speaker deleted!');
    } catch (error) {
      console.error('Error deleting speaker:', error);
      toast.error(getErrorMessage(error, 'Failed to delete speaker'));
    }
  };

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28">
      {/* Header banner */}
      <div className="bg-[#0c1b78] text-white px-4 pt-5 pb-4 flex justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Speakers</h1>
          <p className="text-sm text-white/80">Meet the industry experts</p>
        </div>
        {canCreate && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-1 bg-white text-[#0c1b78] px-3 py-2 rounded-lg text-sm font-semibold shadow-sm"
          >
            <Plus size={16} /> Create
          </button>
        )}
      </div>

      {/* Search and filter */}
      <div className="px-4 pt-4 flex gap-2 relative">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-neutral-400" size={18} />
          <input
            type="text"
            placeholder="Search speakers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setFilterOpen((open) => !open)}
          aria-label="Filter speakers"
          className="w-11 h-11 border border-neutral-300 rounded-lg flex items-center justify-center text-neutral-700"
        >
          <SlidersHorizontal size={18} />
        </button>

        {filterOpen && (
          <div className="absolute top-full right-4 mt-2 w-44 bg-white border border-neutral-300 rounded-lg shadow-lg z-50">
            {FILTERS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setFilter(option.value);
                  setFilterOpen(false);
                }}
                className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-100 ${
                  filter === option.value ? 'font-semibold text-[#1d1fb8]' : 'text-neutral-800'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-16">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Featured speakers */}
          {featuredSpeakers.length > 0 && (
            <div className="pt-5">
              <h2 className="px-4 text-base font-semibold text-neutral-500">Featured Speakers</h2>
              <div className="flex gap-3 overflow-x-auto px-4 pt-3 pb-1 hide-scrollbar">
                {featuredSpeakers.map((speaker) => {
                  const isBookmarked = bookmarkedIds.includes(speaker.id);
                  return (
                    <div
                      key={speaker.id}
                      className="relative shrink-0 w-36 rounded-xl border border-neutral-200 p-3 text-center shadow-sm"
                    >
                      <button
                        onClick={() => toggleBookmark(speaker.id)}
                        aria-label="Bookmark speaker"
                        className={`absolute top-2 right-2 ${isBookmarked ? 'text-amber-500' : 'text-neutral-400'}`}
                      >
                        <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
                      </button>
                      <div className="flex justify-center pt-2">
                        <Avatar speaker={speaker} size="w-16 h-16" textSize="text-lg" />
                      </div>
                      <p className="mt-2 text-sm font-semibold text-neutral-900 truncate">
                        {getFullName(speaker)}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {speaker.designation || 'Speaker'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Total count and AI Matches badge */}
          <div className="px-4 pt-6 flex justify-between items-center">
            <p className="text-sm font-semibold text-neutral-800">
              Total Count ({speakers.length})
            </p>
            <button
              onClick={() => navigate('/ai-matches')}
              className="flex items-center gap-1 bg-[#7e22ce] text-white text-xs font-semibold px-3 py-1.5 rounded-full"
            >
              <Sparkles size={14} /> AI Matches
            </button>
          </div>

          {/* Speaker list */}
          {visibleSpeakers.length > 0 ? (
            <div className="px-4 pt-2 divide-y divide-neutral-200">
              {visibleSpeakers.map((speaker) => {
                const isExpanded = expandedId === speaker.id;
                const isBookmarked = bookmarkedIds.includes(speaker.id);
                const following = isFollowing(speaker.id);
                const own = isOwnProfile(speaker);
                const expertise = Array.isArray(speaker.expertise) ? speaker.expertise : [];

                return (
                  <div key={speaker.id} className="py-4">
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : speaker.id)}
                      className="flex items-start gap-3 cursor-pointer"
                    >
                      <Avatar speaker={speaker} />
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-neutral-900 truncate">
                          {getFullName(speaker)}
                        </p>
                        <p className="text-sm text-neutral-500 truncate">
                          {speaker.designation || 'Speaker'}
                        </p>
                        {speaker.company && (
                          <p className="text-xs font-semibold text-neutral-400 truncate">
                            {speaker.company}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(speaker.id);
                        }}
                        aria-label="Bookmark speaker"
                        className={`mt-1 ${isBookmarked ? 'text-amber-500' : 'text-neutral-400'}`}
                      >
                        <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 space-y-4">
                        {speaker.bio && (
                          <p className="text-sm text-neutral-600">{speaker.bio}</p>
                        )}

                        {expertise.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {expertise.map((item) => (
                              <span
                                key={String(item)}
                                className="px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-4 text-sm text-neutral-600">
                          {speaker.average_rating > 0 && (
                            <span className="flex items-center gap-1">
                              <Star size={14} className="text-yellow-500 fill-yellow-500" />
                              {Number(speaker.average_rating).toFixed(1)}
                              <span className="text-xs text-neutral-400">
                                ({speaker.rating_count || 0})
                              </span>
                            </span>
                          )}
                          {speaker.session_count > 0 && (
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {speaker.session_count} session
                              {speaker.session_count !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {own ? (
                          <p className="text-sm font-medium text-neutral-500 text-center py-2 border border-dashed border-neutral-300 rounded-lg">
                            This is your speaker profile
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleFollowToggle(speaker)}
                              disabled={followBusyId === speaker.id}
                              className={`py-2 rounded-lg text-sm font-semibold border disabled:opacity-50 ${
                                following
                                  ? 'bg-[#1d1fb8] text-white border-[#1d1fb8]'
                                  : 'border-[#1d1fb8] text-[#1d1fb8]'
                              }`}
                            >
                              {following ? 'Following' : 'Follow'}
                            </button>
                            <button
                              onClick={handleRate}
                              className="py-2 rounded-lg text-sm font-semibold border border-neutral-300 text-neutral-700 flex items-center justify-center gap-1"
                            >
                              <Star size={14} /> Rate
                            </button>
                            <button
                              onClick={() => openChat(speaker)}
                              className="py-2 rounded-lg text-sm font-semibold border border-neutral-300 text-neutral-700 flex items-center justify-center gap-1"
                            >
                              <MessageCircle size={14} /> Message
                            </button>
                            <button
                              onClick={() => handleEdit(speaker)}
                              className="py-2 rounded-lg text-sm font-semibold border border-neutral-300 text-neutral-700 flex items-center justify-center gap-1"
                            >
                              <Pencil size={14} /> Edit
                            </button>
                          </div>
                        )}

                        {canDelete !== false && (
                          <button
                            onClick={() => handleDelete(speaker.id)}
                            disabled={isDeleting}
                            className="w-full py-2 rounded-lg text-sm font-semibold text-red-600 border border-red-200 flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            <Trash2 size={14} /> Delete speaker
                          </button>
                        )}
                      </div>
                    )}

                    {!isExpanded && (
                      <button
                        onClick={() => setExpandedId(speaker.id)}
                        className="mt-2 ml-[68px] text-xs text-[#1d1fb8] font-medium flex items-center gap-0.5"
                      >
                        View details <ChevronRight size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <p className="text-neutral-600 mb-4">
                {searchQuery || filter !== 'all' ? 'No speakers found' : 'No speakers available yet'}
              </p>
              {(searchQuery || filter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilter('all');
                  }}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Chat sheet */}
      {chatSpeaker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-[430px] h-[70vh] rounded-t-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
              <p className="font-semibold text-neutral-900 truncate">{getFullName(chatSpeaker)}</p>
              <button onClick={closeChat} aria-label="Close chat" className="text-neutral-500">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {chatLoading ? (
                <LoadingSpinner />
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-neutral-500 pt-8">No messages yet</p>
              ) : (
                messages.map((m) => {
                  const mine = myUserId !== null && m.sender_id === myUserId;
                  return (
                    <div
                      key={m.id}
                      className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                        mine ? 'ml-auto bg-[#1d1fb8] text-white' : 'bg-neutral-100 text-neutral-900'
                      }`}
                    >
                      {m.content}
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2 p-3 border-t border-neutral-200">
              <input
                type="text"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2.5 border border-neutral-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={sending || !chatText.trim()}
                aria-label="Send message"
                className="w-11 h-11 rounded-lg bg-[#1d1fb8] text-white flex items-center justify-center disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeakersScreen;