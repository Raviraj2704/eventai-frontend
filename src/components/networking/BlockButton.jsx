// ============================================================================
// Block / Unblock button for an attendee profile
// File: src/components/networking/BlockButton.jsx
// Real API only:
//   GET    /blocks/            check whether this person is blocked
//   POST   /blocks/{user_id}   block (also removes any connection)
//   DELETE /blocks/{user_id}   unblock
// ============================================================================

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Ban } from 'lucide-react';
import apiClient from '../../config/apiClient';

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

export default function BlockButton({ userId, onBlocked }) {
  const [blocked, setBlocked] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get('/blocks/')
      .then((res) => {
        const list = res?.data?.data || [];
        if (!cancelled) setBlocked(list.some((p) => p.user_id === Number(userId)));
      })
      .catch(() => {
        if (!cancelled) setBlocked(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const block = async () => {
    if (!window.confirm('Block this person? You will no longer see each other, and any connection will be removed.')) return;
    setBusy(true);
    try {
      await apiClient.post(`/blocks/${userId}`);
      setBlocked(true);
      toast.success('Blocked');
      onBlocked?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not block this person'));
    } finally {
      setBusy(false);
    }
  };

  const unblock = async () => {
    setBusy(true);
    try {
      await apiClient.delete(`/blocks/${userId}`);
      setBlocked(false);
      toast.success('Unblocked');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not unblock this person'));
    } finally {
      setBusy(false);
    }
  };

  if (blocked === null) return null;

  return blocked ? (
    <button
      type="button"
      onClick={unblock}
      disabled={busy}
      className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-800 disabled:opacity-50"
    >
      Unblock
    </button>
  ) : (
    <button
      type="button"
      onClick={block}
      disabled={busy}
      className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-600 disabled:opacity-50"
    >
      <Ban size={16} /> Block
    </button>
  );
}