// ============================================================================
// Organizer tools on a session's detail page
// File: src/components/sessions/SessionAdminBar.jsx
// Real API only:
//   GET    /session-admin/me/roles
//   GET    /session-admin/sessions/{id}/manage
//   GET    /session-admin/sessions/{id}/history
//   POST   /session-admin/sessions/{id}/publish
//   POST   /session-admin/sessions/{id}/image
//   DELETE /session-admin/sessions/{id}
//   PUT    /session-admin/sessions/{id}          (through SessionForm)
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Pencil, Send, ImagePlus, Trash2, History, X } from 'lucide-react';
import apiClient from '../../config/apiClient';
import SessionForm from './SessionForm';

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

const postForm = async (path, formData) => {
  const token = localStorage.getItem('access_token');
  const base = (apiClient.defaults.baseURL || '').replace(/\/$/, '');
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = body?.detail;
    throw new Error(typeof detail === 'string' ? detail : 'Upload failed');
  }
  return body;
};

const STATUS_TEXT = {
  draft: 'Draft: only organizers can see this session',
  published: 'Published and visible to attendees',
  proposed: 'Waiting for approval',
  rejected: 'Not approved',
  deleted: 'Removed',
};

const ACTION_LABELS = {
  created: 'Created',
  edited: 'Edited',
  published: 'Published',
  proposed: 'Proposed by speaker',
  resubmitted: 'Resent by speaker',
  approved: 'Approved',
  rejected: 'Rejected',
  removed: 'Removed',
  photo_updated: 'Photo updated',
};

const formatWhen = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function SessionAdminBar({ sessionId, onChanged }) {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [manage, setManage] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const roles = await apiClient.get('/session-admin/me/roles');
      const admin = Boolean(roles?.data?.data?.is_admin);
      setIsAdmin(admin);
      if (admin) {
        const res = await apiClient.get(`/session-admin/sessions/${sessionId}/manage`);
        setManage(res?.data?.data || null);
      }
    } catch (error) {
      console.error('Organizer tools unavailable:', error);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  const openHistory = async () => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await apiClient.get(`/session-admin/sessions/${sessionId}/history`);
      setHistory(res?.data?.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load the history'));
    } finally {
      setHistoryLoading(false);
    }
  };

  const publish = async () => {
    setBusy(true);
    try {
      await apiClient.post(`/session-admin/sessions/${sessionId}/publish`);
      toast.success('Session published');
      await load();
      onChanged?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not publish this session'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Remove this session? Attendees will no longer see it.')) return;
    setBusy(true);
    try {
      await apiClient.delete(`/session-admin/sessions/${sessionId}`);
      toast.success('Session removed');
      navigate('/sessions');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not remove this session'));
    } finally {
      setBusy(false);
    }
  };

  const uploadPhoto = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await postForm(`/session-admin/sessions/${sessionId}/image`, fd);
      toast.success('Photo updated');
      await load();
      onChanged?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not upload the photo'));
    } finally {
      setBusy(false);
    }
  };

  if (!isAdmin || !manage) return null;

  return (
    <div className="mx-4 mt-4 rounded-xl border border-dashed border-[#0000c8]/40 bg-blue-50/40 p-4">
      <p className="text-sm font-semibold text-slate-900">Organizer tools</p>
      <p className="text-xs text-slate-600 mt-1">
        {STATUS_TEXT[manage.publish_status] || manage.publish_status}
      </p>

      <div className="flex flex-wrap gap-2 mt-3">
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          disabled={busy}
          className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 disabled:opacity-50"
        >
          <Pencil size={14} />
          Edit
        </button>

        {manage.publish_status === 'draft' && (
          <button
            type="button"
            onClick={publish}
            disabled={busy}
            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Send size={14} />
            Publish
          </button>
        )}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 disabled:opacity-50"
        >
          <ImagePlus size={14} />
          Photo
        </button>

        <button
          type="button"
          onClick={openHistory}
          disabled={busy}
          className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 disabled:opacity-50"
        >
          <History size={14} />
          History
        </button>

        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-600 disabled:opacity-50"
        >
          <Trash2 size={14} />
          Remove
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          uploadPhoto(file);
        }}
      />

      {formOpen && (
        <SessionForm
          mode="edit"
          isAdmin={isAdmin}
          sessionId={sessionId}
          initial={manage}
          onClose={() => setFormOpen(false)}
          onSaved={async () => {
            setFormOpen(false);
            await load();
            onChanged?.();
          }}
        />
      )}

      {historyOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center" onClick={() => setHistoryOpen(false)}>
          <div
            className="bg-white w-full max-w-[430px] max-h-[80vh] rounded-t-2xl flex flex-col mb-16"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <p className="font-semibold text-slate-900">Session history</p>
              <button type="button" onClick={() => setHistoryOpen(false)} aria-label="Close" className="text-slate-500">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {historyLoading && <p className="text-sm text-slate-500 text-center py-8">Loading...</p>}

              {!historyLoading && history.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">No changes recorded yet.</p>
              )}

              {!historyLoading &&
                history.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {ACTION_LABELS[entry.action] || entry.action}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {entry.actor_name} | {formatWhen(entry.created_at)}
                    </p>
                    {entry.note && (
                      <p className="text-sm text-slate-700 mt-2">Note: {entry.note}</p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}