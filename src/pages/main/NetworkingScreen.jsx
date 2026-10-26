// ============================================================================
// Networking Screen
// File: src/pages/main/NetworkingScreen.jsx
// Design: Representatives list from the video (search, filter, rows with
//         avatar, name, designation, company, and a message action)
// Data:   Real API only
//   GET  /users?limit=100            list attendees
//   GET  /users/designations         job titles for the filter
//   GET  /auth/me                    logged-in user (to hide Message on yourself)
//   GET  /chat/inbox                 your conversations
//   GET  /chat/users/{id}/messages   conversation with a user
//   POST /chat/users/{id}/messages   send a message to a user
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Search, SlidersHorizontal, MessageCircle, MessageSquare, X, Send, Briefcase, MapPin,
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.detail ||
  error?.data?.detail ||
  error?.data?.message ||
  error?.message ||
  fallback;

const getFullName = (u) =>
  `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Attendee';

const getInitials = (u) =>
  getFullName(u)
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'A';

const NetworkingScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myUserId, setMyUserId] = useState(null);
  const [designations, setDesignations] = useState([]);
  const [designationFilter, setDesignationFilter] = useState('all');
  const [designationOpen, setDesignationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Inbox
  const [inboxOpen, setInboxOpen] = useState(false);
  const [inboxItems, setInboxItems] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(false);

  // Chat
  const [chatPartner, setChatPartner] = useState(null); // { userId, title }
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatText, setChatText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadCurrentUser();
    loadDesignations();
    loadUsers();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      setMyUserId(response?.data?.id ?? null);
    } catch (err) {
      console.error('Could not load current user:', err);
    }
  };

  const loadDesignations = async () => {
    try {
      const response = await apiClient.get('/users/designations');
      const raw = response?.data;
      setDesignations(Array.isArray(raw) ? raw : raw?.data || []);
    } catch (err) {
      console.error('Could not load job titles:', err);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/users', { params: { limit: 100 } });
      const raw = response?.data;
      setUsers(Array.isArray(raw) ? raw : raw?.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(getErrorMessage(err, 'Failed to load people. Please try again.'));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const isMe = (u) => myUserId !== null && u.id === myUserId;

  // Search by name, job title, company, or location, plus the job title filter
  const visibleUsers = useMemo(() => {
    let list = users;

    if (designationFilter !== 'all') {
      const wanted = designationFilter.toLowerCase();
      list = list.filter((u) => (u.job_title || '').toLowerCase() === wanted);
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (u) =>
          getFullName(u).toLowerCase().includes(query) ||
          (u.job_title || '').toLowerCase().includes(query) ||
          (u.company || '').toLowerCase().includes(query) ||
          (u.location || '').toLowerCase().includes(query)
      );
    }

    return list;
  }, [users, designationFilter, searchQuery]);

  // ---------------------------------------------------------------------------
  // Inbox and chat (saved to the server)
  // ---------------------------------------------------------------------------
  const openInbox = async () => {
    setInboxOpen(true);
    setInboxLoading(true);
    try {
      const response = await apiClient.get('/chat/inbox');
      setInboxItems(response?.data?.data || []);
    } catch (err) {
      console.error('Could not load inbox:', err);
      toast.error(getErrorMessage(err, 'Could not load messages'));
    } finally {
      setInboxLoading(false);
    }
  };

  const openChat = async (partnerUserId, title) => {
    setInboxOpen(false);
    setChatPartner({ userId: partnerUserId, title });
    setMessages([]);
    setChatText('');
    setChatLoading(true);
    try {
      const response = await apiClient.get(`/chat/users/${partnerUserId}/messages`, {
        params: { limit: 100 },
      });
      setMessages(response?.data?.data || []);
    } catch (err) {
      console.error('Could not load conversation:', err);
      toast.error(getErrorMessage(err, 'Could not load messages'));
    } finally {
      setChatLoading(false);
    }
  };

  const closeChat = () => {
    setChatPartner(null);
    setMessages([]);
    setChatText('');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const content = chatText.trim();
    if (!content || !chatPartner || sending) return;

    setSending(true);
    try {
      const response = await apiClient.post(`/chat/users/${chatPartner.userId}/messages`, {
        content,
      });
      const saved = response?.data?.data;
      if (saved) {
        setMessages((prev) => [...prev, saved]);
      }
      setChatText('');
    } catch (err) {
      console.error('Send failed:', err);
      // Shows the server's reason, such as "This user is currently not available for chat"
      toast.error(getErrorMessage(err, 'Could not send your message'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28">
      {/* Header */}
      <div className="bg-[#0c1b78] text-white px-4 pt-5 pb-4 flex justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Networking</h1>
          <p className="text-sm text-white/80">Connect with fellow attendees</p>
        </div>
        <button
          onClick={openInbox}
          className="flex items-center gap-1 bg-white/15 text-white px-3 py-2 rounded-lg text-sm font-semibold"
        >
          <MessageSquare size={16} /> Inbox
        </button>
      </div>

      {/* Search and filter */}
      <div className="px-4 pt-4 flex gap-2 relative">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-neutral-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, job title, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setDesignationOpen((open) => !open)}
          aria-label="Filter by job title"
          className="w-11 h-11 border border-neutral-300 rounded-lg flex items-center justify-center text-neutral-700"
        >
          <SlidersHorizontal size={18} />
        </button>

        {designationOpen && (
          <div className="absolute top-full right-4 mt-2 w-56 max-h-64 overflow-y-auto bg-white border border-neutral-300 rounded-lg shadow-lg z-50">
            <button
              onClick={() => {
                setDesignationFilter('all');
                setDesignationOpen(false);
              }}
              className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-100 ${
                designationFilter === 'all' ? 'font-semibold text-[#1d1fb8]' : 'text-neutral-800'
              }`}
            >
              All job titles
            </button>
            {designations.map((title) => (
              <button
                key={title}
                onClick={() => {
                  setDesignationFilter(title);
                  setDesignationOpen(false);
                }}
                className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-100 ${
                  designationFilter === title ? 'font-semibold text-[#1d1fb8]' : 'text-neutral-800'
                }`}
              >
                {title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
          <button onClick={loadUsers} className="ml-3 underline font-medium">
            Try Again
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-16">
          <LoadingSpinner />
        </div>
      ) : visibleUsers.length > 0 ? (
        <>
          <p className="px-4 pt-5 text-sm font-semibold text-neutral-800">
            Found {visibleUsers.length} {visibleUsers.length === 1 ? 'person' : 'people'}
          </p>

          {/* Representatives-style list */}
          <div className="px-4 pt-2 divide-y divide-neutral-200">
            {visibleUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-4">
                <div className="w-14 h-14 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center font-semibold text-neutral-600 shrink-0">
                  {getInitials(u)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-neutral-900 truncate">
                    {getFullName(u)}
                  </p>
                  <p className="text-sm text-neutral-500 truncate">{u.job_title || 'Attendee'}</p>
                  {u.company && (
                    <p className="text-xs font-semibold text-neutral-400 truncate flex items-center gap-1">
                      <Briefcase size={12} /> {u.company}
                    </p>
                  )}
                  {u.location && (
                    <p className="text-xs text-neutral-400 truncate flex items-center gap-1">
                      <MapPin size={12} /> {u.location}
                    </p>
                  )}
                </div>

                {isMe(u) ? (
                  <span className="text-xs font-medium text-neutral-500 border border-dashed border-neutral-300 rounded-lg px-2 py-1">
                    You
                  </span>
                ) : (
                  <button
                    onClick={() => openChat(u.id, getFullName(u))}
                    aria-label={`Message ${getFullName(u)}`}
                    className="w-10 h-10 rounded-full bg-[#1d1fb8] text-white flex items-center justify-center shrink-0"
                  >
                    <MessageCircle size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        !error && (
          <div className="text-center py-16 px-4">
            <p className="text-neutral-600 mb-4">
              {searchQuery || designationFilter !== 'all'
                ? 'No people found'
                : 'No attendees available yet'}
            </p>
            {(searchQuery || designationFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDesignationFilter('all');
                }}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
              >
                Clear
              </button>
            )}
          </div>
        )
      )}

      {/* Inbox sheet */}
      {inboxOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center">
          <div className="bg-white w-full max-w-[430px] h-[70vh] rounded-t-2xl flex flex-col mb-16">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
              <p className="font-semibold text-neutral-900">Messages</p>
              <button onClick={() => setInboxOpen(false)} aria-label="Close inbox" className="text-neutral-500">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-neutral-200">
              {inboxLoading ? (
                <LoadingSpinner />
              ) : inboxItems.length === 0 ? (
                <p className="text-center text-sm text-neutral-500 pt-8">No conversations yet</p>
              ) : (
                inboxItems.map((item) => (
                  <button
                    key={item.partner_user_id}
                    onClick={() => openChat(item.partner_user_id, item.name)}
                    className="w-full text-left px-4 py-3 hover:bg-neutral-50"
                  >
                    <p className="text-sm font-semibold text-neutral-900 truncate">{item.name}</p>
                    <p className="text-xs text-neutral-500 truncate">{item.last_message}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat sheet */}
      {chatPartner && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center">
          <div className="bg-white w-full max-w-[430px] h-[70vh] rounded-t-2xl flex flex-col mb-16">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
              <p className="font-semibold text-neutral-900 truncate">{chatPartner.title}</p>
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

export default NetworkingScreen;