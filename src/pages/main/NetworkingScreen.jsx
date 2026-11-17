// ============================================================================
// Networking Screen
// File: src/pages/main/NetworkingScreen.jsx
// Design: Representatives list from the video (search, filter, rows with
//         avatar, name, designation, company, and actions)
// Data:   Real API only
//   GET  /users?limit=100           list attendees
//   GET  /users/designations        job titles for the filter
//   GET  /auth/me                   logged-in user (to hide actions on yourself)
//   GET  /chat/inbox                your conversations
//   GET  /chat/users/{id}/messages  conversation with a user
//   POST /chat/users/{id}/messages  send a message to a user
// ============================================================================

import ConnectionButton from '../../components/networking/ConnectionButton';
import BlockButton from '../../components/networking/BlockButton';
import ScheduleMeetingSheet from '../../components/networking/ScheduleMeetingSheet';
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Search, SlidersHorizontal, MessageSquare, X, Send, Briefcase, MapPin, Trash2, CalendarPlus
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
  const [meetingWith, setMeetingWith] = useState(null);
  const navigate = useNavigate();

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

  const handleDeleteMessage = async (messageId) => {
    try {
      await apiClient.delete(`/chat/messages/${messageId}`);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success('Message deleted');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete message'));
    }
  };

  const handleClearChat = async () => {
    if (!chatPartner || !window.confirm(`Delete entire conversation with ${chatPartner.title}?`)) return;
    try {
      await apiClient.delete(`/chat/users/${chatPartner.userId}/messages`);
      setMessages([]);
      setInboxItems((prev) => prev.filter((item) => item.partner_user_id !== chatPartner.userId));
      toast.success('Conversation deleted');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete conversation'));
    }
  };

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28 font-sans">
      
      {/* 1. Header (Clean White Theme) */}
      <div className="bg-white px-5 pt-8 pb-4 flex justify-between items-center gap-3 sticky top-0 z-10">
        <div>
          <h1 className="text-[24px] font-extrabold text-slate-900 tracking-tight">Networking</h1>
          <p className="text-[14px] font-medium text-slate-500 mt-1">Connect with fellow attendees</p>
          <div className="flex flex-wrap gap-2 mt-5">
            <button
              type="button"
              onClick={() => navigate('/my-contacts')}
              className="rounded-[12px] bg-slate-50 border border-slate-100 px-5 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
            >
              My Contacts
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={openInbox}
          className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-700 px-4 py-2.5 rounded-[12px] text-[13px] font-bold hover:bg-slate-100 transition-colors shadow-sm"
        >
          <MessageSquare size={16} /> Inbox
        </button>
      </div>

      {/* 2. Search and Filter (Soft Rounded Styling) */}
      <div className="px-5 pt-4 flex gap-3 relative">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-4 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search attendees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-[16px] text-[15px] focus:bg-white focus:border-[#0000c8] focus:shadow-sm transition-all placeholder:text-slate-400 text-slate-800 outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setDesignationOpen((open) => !open)}
          aria-label="Filter by job title"
          className="w-[52px] h-[52px] bg-slate-50 rounded-[16px] flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
        >
          <SlidersHorizontal size={18} />
        </button>

        {designationOpen && (
          <div className="absolute top-full right-5 mt-2 w-56 max-h-64 overflow-y-auto bg-white border border-slate-100 shadow-xl rounded-[16px] z-50">
            <button
              type="button"
              onClick={() => {
                setDesignationFilter('all');
                setDesignationOpen(false);
              }}
              className={`block w-full text-left px-4 py-3 text-[14px] hover:bg-slate-50 transition-colors ${
                designationFilter === 'all' ? 'font-bold text-[#0000c8]' : 'font-medium text-slate-700'
              }`}
            >
              All job titles
            </button>
            {designations.map((title) => (
              <button
                type="button"
                key={title}
                onClick={() => {
                  setDesignationFilter(title);
                  setDesignationOpen(false);
                }}
                className={`block w-full text-left px-4 py-3 text-[14px] hover:bg-slate-50 transition-colors ${
                  designationFilter === title ? 'font-bold text-[#0000c8]' : 'font-medium text-slate-700'
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
        <div className="mx-5 mt-4 p-4 bg-rose-50 text-rose-600 rounded-[16px] text-[13px] font-medium">
          {error}
          <button type="button" onClick={loadUsers} className="ml-3 underline font-bold">
            Try Again
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20">
          <LoadingSpinner />
        </div>
      ) : visibleUsers.length > 0 ? (
        <>
          <p className="px-5 pt-8 pb-3 text-[12px] font-bold text-slate-400 uppercase tracking-wider">
            {visibleUsers.length} {visibleUsers.length === 1 ? 'Person Found' : 'People Found'}
          </p>

          {/* 3. Representatives-style list (Soft Rounded Cards theme) */}
          <div className="px-5 pt-1 flex flex-col gap-4">
            {visibleUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-[16px]">
                <div className="w-14 h-14 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center font-bold text-slate-600 text-[18px] shrink-0">
                  {getInitials(u)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-bold text-slate-900 tracking-tight truncate">
                    {getFullName(u)}
                  </p>
                  <p className="text-[13px] font-medium text-slate-600 truncate mt-0.5">{u.job_title || 'Attendee'}</p>
                  {u.company && (
                    <p className="text-[12px] font-medium text-slate-400 truncate flex items-center gap-1.5 mt-2">
                      <Briefcase size={12} /> {u.company}
                    </p>
                  )}
                  {u.location && (
                    <p className="text-[12px] font-medium text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                      <MapPin size={12} /> {u.location}
                    </p>
                  )}
                </div>

                {isMe(u) ? (
                  <span className="text-[11px] font-bold text-slate-400 bg-white border border-slate-200 rounded-full px-3 py-1.5 uppercase tracking-wide">
                    You
                  </span>
                ) : (
                  <div className="flex flex-col items-end gap-2">
                    <ConnectionButton userId={u.id} onChat={() => openChat(u.id, getFullName(u))} />
                    <button
                      type="button"
                      onClick={() => setMeetingWith(u.id)}
                      className="flex items-center justify-center gap-1.5 w-full rounded-full border border-slate-200 bg-white text-slate-700 py-2 px-4 text-[12px] font-bold hover:border-[#0000c8] hover:text-[#0000c8] transition-colors"
                    >
                      <CalendarPlus size={14} strokeWidth={2.5} /> Schedule
                    </button>
                    <BlockButton userId={u.id} onBlocked={loadUsers} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        !error && (
          <div className="text-center py-20 px-5">
            <p className="text-slate-500 font-medium mb-4 text-[15px]">
              {searchQuery || designationFilter !== 'all'
                ? 'No people found matching your filters'
                : 'No attendees available yet'}
            </p>
            {(searchQuery || designationFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDesignationFilter('all');
                }}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold text-[14px] transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )
      )}

      {/* 4. Inbox sheet (Rounded Clean Drawer) */}
      {inboxOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-end justify-center">
          <div className="bg-white w-full max-w-[430px] h-[75vh] rounded-t-[24px] shadow-2xl flex flex-col mb-0">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <p className="font-bold text-[20px] text-slate-900 tracking-tight">Messages</p>
              <button
                type="button"
                onClick={() => setInboxOpen(false)}
                aria-label="Close inbox"
                className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2.5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {inboxLoading ? (
                <div className="pt-10"><LoadingSpinner /></div>
              ) : inboxItems.length === 0 ? (
                <p className="text-center text-[15px] text-slate-400 font-medium pt-12">No conversations yet</p>
              ) : (
                inboxItems.map((item) => (
                  <button
                    type="button"
                    key={item.partner_user_id}
                    onClick={() => openChat(item.partner_user_id, item.name)}
                    className="w-full text-left px-6 py-5 hover:bg-slate-50 transition-colors"
                  >
                    <p className="text-[16px] font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[14px] text-slate-500 font-medium truncate mt-1">{item.last_message}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Chat sheet (Rounded Chat Drawer) */}
      {chatPartner && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-end justify-center">
          <div className="bg-white w-full max-w-[430px] h-[75vh] rounded-t-[24px] shadow-2xl flex flex-col mb-0">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <p className="font-bold text-[20px] text-slate-900 tracking-tight truncate pr-2">{chatPartner.title}</p>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearChat}
                    aria-label="Delete conversation"
                    title="Delete entire conversation"
                    className="text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 p-2.5 rounded-full transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeChat}
                  aria-label="Close chat"
                  className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2.5 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-white">
              {chatLoading ? (
                <div className="pt-10"><LoadingSpinner /></div>
              ) : messages.length === 0 ? (
                <p className="text-center text-[14px] text-slate-400 font-medium pt-8">No messages yet. Say hello!</p>
              ) : (
                messages.map((m) => {
                  const mine = myUserId !== null && m.sender_id === myUserId;
                  return (
                    <div
                      key={m.id}
                      className={`group flex items-center gap-2 max-w-[85%] ${
                        mine ? 'ml-auto flex-row-reverse' : ''
                      }`}
                    >
                      <div
                        className={`px-5 py-3 text-[15px] break-words shadow-sm ${
                          mine ? 'bg-[#0000c8] text-white rounded-[20px] rounded-br-sm' : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-[20px] rounded-bl-sm'
                        }`}
                      >
                        {m.content}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(m.id)}
                        aria-label="Delete message"
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-1.5 shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-3 p-5 border-t border-slate-100 bg-white">
              <input
                type="text"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-5 py-3.5 bg-slate-50 rounded-full text-[15px] focus:bg-white focus:border-[#0000c8] border border-transparent transition-all outline-none placeholder:text-slate-400 text-slate-800 shadow-inner"
              />
              <button
                type="submit"
                disabled={sending || !chatText.trim()}
                aria-label="Send message"
                className="w-14 h-14 rounded-full bg-[#0000c8] text-white flex items-center justify-center shadow-md disabled:opacity-50 active:scale-95 transition-transform shrink-0"
              >
                <Send size={18} className="ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Schedule 1-2-1 sheet */}
      {meetingWith && (
        <ScheduleMeetingSheet
          userId={meetingWith}
          onClose={() => setMeetingWith(null)}
          onSaved={() => setMeetingWith(null)}
        />
      )}
    </div>
  );
};

export default NetworkingScreen;