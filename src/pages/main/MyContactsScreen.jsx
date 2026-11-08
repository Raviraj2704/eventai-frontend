// ============================================================================
// My Contacts (Contacts, Requests, Blocked)
// File: src/pages/main/MyContactsScreen.jsx
// Route: /my-contacts
// Real API only:
//   GET    /connections/contacts
//   GET    /connections/requests?direction=in
//   POST   /connections/requests/{id}/accept
//   POST   /connections/requests/{id}/reject
//   DELETE /connections/contacts/{user_id}
//   GET    /blocks/                              (via BlockedList)
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, MessageCircle, Trash2, Check, X } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BlockedList from '../../components/networking/BlockedList';
import apiClient from '../../config/apiClient';

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

const unwrap = (body) => (Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : []);

const initialsOf = (name) =>
  (name || 'A').split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'A';

function Avatar({ src, name }) {
  return src ? (
    <img src={src} alt={name} className="w-12 h-12 rounded-full object-cover shrink-0" />
  ) : (
    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-600 shrink-0">
      {initialsOf(name)}
    </div>
  );
}

const tabClass = (active) =>
  `flex-1 rounded-xl py-2.5 text-sm font-semibold border ${
    active ? 'bg-[#0000c8] text-white border-[#0000c8]' : 'border-slate-300 text-slate-800'
  }`;

export default function MyContactsScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('contacts'); // contacts | requests | blocked
  const [contacts, setContacts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [contactsRes, requestsRes] = await Promise.all([
        apiClient.get('/connections/contacts', { params: { limit: 100 } }),
        apiClient.get('/connections/requests', { params: { direction: 'in' } }),
      ]);
      setContacts(unwrap(contactsRes?.data));
      setRequests(unwrap(requestsRes?.data));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load your contacts'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const respond = async (item, action) => {
    setBusyId(item.request_id);
    try {
      await apiClient.post(`/connections/requests/${item.request_id}/${action}`);
      toast.success(action === 'accept' ? 'Connected' : 'Request declined');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update the request'));
    } finally {
      setBusyId(null);
    }
  };

  const removeContact = async (contact) => {
    if (!window.confirm(`Remove ${contact.name} from your contacts?`)) return;
    setBusyId(contact.user_id);
    try {
      await apiClient.delete(`/connections/contacts/${contact.user_id}`);
      toast.success('Removed from your contacts');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not remove this contact'));
    } finally {
      setBusyId(null);
    }
  };

  const renderBody = () => {
    if (tab === 'blocked') return <BlockedList />;

    if (loading) {
      return (
        <div className="py-16">
          <LoadingSpinner />
        </div>
      );
    }

    if (tab === 'contacts') {
      if (contacts.length === 0) {
        return (
          <p className="text-center text-sm text-slate-500 py-12">
            No contacts yet. Connect with attendees to see them here.
          </p>
        );
      }
      return contacts.map((c) => (
        <div key={c.user_id} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
          <Avatar src={c.avatar_url} name={c.name} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{c.name}</p>
            {c.job_title && <p className="text-xs text-slate-500 truncate">{c.job_title}</p>}
            {c.company && <p className="text-xs text-slate-400 truncate">{c.company}</p>}
          </div>
          <button
            type="button"
            onClick={() => navigate('/networking')}
            aria-label={`Message ${c.name}`}
            className="w-10 h-10 rounded-full bg-[#0000c8] text-white flex items-center justify-center"
          >
            <MessageCircle size={16} />
          </button>
          <button
            type="button"
            onClick={() => removeContact(c)}
            disabled={busyId === c.user_id}
            aria-label={`Remove ${c.name}`}
            className="w-10 h-10 rounded-full border border-red-200 text-red-600 flex items-center justify-center disabled:opacity-50"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ));
    }

    // requests
    if (requests.length === 0) {
      return <p className="text-center text-sm text-slate-500 py-12">No requests waiting for you.</p>;
    }
    return requests.map((r) => (
      <div key={r.request_id} className="rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar src={r.avatar_url} name={r.name} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{r.name}</p>
            {r.job_title && <p className="text-xs text-slate-500 truncate">{r.job_title}</p>}
          </div>
        </div>
        {r.message && <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{r.message}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => respond(r, 'reject')}
            disabled={busyId === r.request_id}
            className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50"
          >
            <X size={14} /> Decline
          </button>
          <button
            type="button"
            onClick={() => respond(r, 'accept')}
            disabled={busyId === r.request_id}
            className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[#0000c8] py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Check size={14} /> Accept
          </button>
        </div>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28">
      <div className="bg-[#0c1b78] text-white px-4 pt-5 pb-4 flex items-center gap-3">
        <button type="button" onClick={() => navigate('/networking')} aria-label="Back" className="text-white">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">My Contacts</h1>
      </div>

      <div className="flex gap-2 px-4 pt-4">
        <button type="button" onClick={() => setTab('contacts')} className={tabClass(tab === 'contacts')}>
          Contacts ({contacts.length})
        </button>
        <button type="button" onClick={() => setTab('requests')} className={tabClass(tab === 'requests')}>
          Requests ({requests.length})
        </button>
        <button type="button" onClick={() => setTab('blocked')} className={tabClass(tab === 'blocked')}>
          Blocked
        </button>
      </div>

      <div className="px-4 pt-4 space-y-3">{renderBody()}</div>
    </div>
  );
}