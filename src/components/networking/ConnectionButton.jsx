// ============================================================================
// Connection button for an attendee profile
// File: src/components/networking/ConnectionButton.jsx
// Real API only:
//   GET    /connections/status/{user_id}
//   POST   /connections/requests/{user_id}      send request with message
//   POST   /connections/requests/{id}/accept
//   POST   /connections/requests/{id}/reject
//   DELETE /connections/requests/{id}           revoke
// ============================================================================

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { UserPlus, MessageCircle, X, Clock, Check } from 'lucide-react';
import apiClient from '../../config/apiClient';

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

export default function ConnectionButton({ userId, onChat }) {
  const [state, setState] = useState(null); // none | pending_out | pending_in | connected | self
  const [requestId, setRequestId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const res = await apiClient.get(`/connections/status/${userId}`);
      setState(res?.data?.data?.state || 'none');
      setRequestId(res?.data?.data?.request_id ?? null);
    } catch (error) {
      setState('none');
    }
  };

  useEffect(() => {
    load();
  }, [userId]);

  const sendRequest = async () => {
    setBusy(true);
    try {
      await apiClient.post(`/connections/requests/${userId}`, {
        message: message.trim() || null,
      });
      toast.success('Request sent');
      setSheetOpen(false);
      setMessage('');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not send your request'));
    } finally {
      setBusy(false);
    }
  };

  const respond = async (action) => {
    if (!requestId) return;
    setBusy(true);
    try {
      await apiClient.post(`/connections/requests/${requestId}/${action}`);
      toast.success(action === 'accept' ? 'Connected' : 'Request declined');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update the request'));
    } finally {
      setBusy(false);
    }
  };

  const revoke = async () => {
    if (!requestId) return;
    setBusy(true);
    try {
      await apiClient.delete(`/connections/requests/${requestId}`);
      toast.success('Request revoked');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not revoke the request'));
    } finally {
      setBusy(false);
    }
  };

  if (state === null || state === 'self') return null;

  const button = 'flex-1 flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold disabled:opacity-50';

  if (state === 'connected') {
    return (
      <button type="button" onClick={onChat} className={`${button} border-slate-300 text-slate-800`}>
        <MessageCircle size={16} /> Chat
      </button>
    );
  }

  if (state === 'pending_out') {
    return (
      <div className="w-full space-y-2">
        <div className={`${button} border-slate-300 text-slate-500`}>
          <Clock size={16} /> Request pending
        </div>
        <button type="button" onClick={revoke} disabled={busy} className="w-full text-sm font-semibold text-red-600">
          Revoke request
        </button>
      </div>
    );
  }

  if (state === 'pending_in') {
    return (
      <div className="w-full flex gap-2">
        <button type="button" onClick={() => respond('reject')} disabled={busy} className={`${button} border-slate-300 text-slate-800`}>
          <X size={16} /> Decline
        </button>
        <button type="button" onClick={() => respond('accept')} disabled={busy} className={`${button} border-[#0000c8] bg-[#0000c8] text-white`}>
          <Check size={16} /> Accept
        </button>
      </div>
    );
  }

  // none
  return (
    <>
      <button type="button" onClick={() => setSheetOpen(true)} className={`${button} border-[#0000c8] text-[#0000c8]`}>
        <UserPlus size={16} /> Connect
      </button>

      {sheetOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center" onClick={() => setSheetOpen(false)}>
          <div
            className="bg-white w-full max-w-[430px] rounded-t-2xl p-4 mb-16 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">Enter your message</p>
              <button type="button" onClick={() => setSheetOpen(false)} aria-label="Close" className="text-slate-500">
                <X size={20} />
              </button>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Type here"
              className="w-full border border-slate-300 rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={sendRequest}
              disabled={busy}
              className="w-full rounded-lg bg-[#0000c8] text-white py-3 font-semibold disabled:opacity-50"
            >
              {busy ? 'Sending...' : 'Connect'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
