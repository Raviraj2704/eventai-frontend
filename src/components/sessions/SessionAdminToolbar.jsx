// ============================================================================
// Sessions toolbar: Create (organizer), Propose (speaker), Pending and My proposals
// File: src/components/sessions/SessionAdminToolbar.jsx
// Real API only:
//   GET  /session-admin/me/roles
//   GET  /session-admin/proposals
//   POST /session-admin/proposals/{id}/approve
//   POST /session-admin/proposals/{id}/reject
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, ClipboardList, X, CheckCircle2, XCircle, Pencil } from 'lucide-react';
import apiClient from '../../config/apiClient';
import SessionForm from './SessionForm';

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

const unwrapList = (body) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  return [];
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

const STATUS_TEXT = {
  proposed: { text: 'Waiting for approval', className: 'text-amber-600' },
  rejected: { text: 'Not approved', className: 'text-red-600' },
  published: { text: 'Approved and published', className: 'text-emerald-700' },
};

export default function SessionAdminToolbar({ onChanged }) {
  const [roles, setRoles] = useState({ is_admin: false, is_speaker: false });
  const [loadedRoles, setLoadedRoles] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [createMode, setCreateMode] = useState(null); // 'create' | 'propose' | null
  const [editing, setEditing] = useState(null); // proposal being edited by the speaker
  const [listOpen, setListOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const loadRoles = useCallback(async () => {
    try {
      const res = await apiClient.get('/session-admin/me/roles');
      setRoles(res?.data?.data || { is_admin: false, is_speaker: false });
    } catch (error) {
      console.error('Could not load session roles:', error);
    } finally {
      setLoadedRoles(true);
    }
  }, []);

  const loadProposals = useCallback(async () => {
    try {
      const res = await apiClient.get('/session-admin/proposals');
      setProposals(unwrapList(res?.data));
    } catch (error) {
      console.error('Could not load proposals:', error);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    if (loadedRoles && (roles.is_admin || roles.is_speaker)) {
      loadProposals();
    }
  }, [loadedRoles, roles.is_admin, roles.is_speaker, loadProposals]);

  const decide = async (item, action) => {
    let note = null;
    if (action === 'reject') {
      const answer = window.prompt('Reason shown to the speaker (optional):', '');
      if (answer === null) return;
      note = answer.trim() || null;
    }

    setBusyId(item.id);
    try {
      await apiClient.post(
        `/session-admin/proposals/${item.id}/${action}`,
        action === 'reject' ? { note } : undefined
      );
      toast.success(action === 'approve' ? 'Session approved and published' : 'Proposal rejected');
      await loadProposals();
      onChanged?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update this proposal'));
    } finally {
      setBusyId(null);
    }
  };

  if (!loadedRoles || (!roles.is_admin && !roles.is_speaker)) {
    return null;
  }

  const pendingCount = proposals.filter((p) => p.publish_status === 'proposed').length;

  return (
    <>
      <div className="flex flex-wrap gap-2 px-4 pt-4">
        {roles.is_admin && (
          <button
            type="button"
            onClick={() => setCreateMode('create')}
            className="flex items-center gap-1 rounded-lg bg-[#0000c8] text-white px-3 py-2 text-sm font-semibold"
          >
            <Plus size={16} />
            Create session
          </button>
        )}

        {roles.is_speaker && !roles.is_admin && (
          <button
            type="button"
            onClick={() => setCreateMode('propose')}
            className="flex items-center gap-1 rounded-lg bg-[#0000c8] text-white px-3 py-2 text-sm font-semibold"
          >
            <Plus size={16} />
            Propose session
          </button>
        )}

        <button
          type="button"
          onClick={() => setListOpen(true)}
          className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800"
        >
          <ClipboardList size={16} />
          {roles.is_admin ? `Pending (${pendingCount})` : `My proposals (${proposals.length})`}
        </button>
      </div>

      {createMode && (
        <SessionForm
          mode={createMode}
          isAdmin={roles.is_admin}
          onClose={() => setCreateMode(null)}
          onSaved={async () => {
            setCreateMode(null);
            await loadProposals();
            onChanged?.();
          }}
        />
      )}

      {editing && (
        <SessionForm
          mode="resubmit"
          isAdmin={false}
          sessionId={editing.id}
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await loadProposals();
            onChanged?.();
          }}
        />
      )}

      {listOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center" onClick={() => setListOpen(false)}>
          <div
            className="bg-white w-full max-w-[430px] max-h-[80vh] rounded-t-2xl flex flex-col mb-16"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <p className="font-semibold text-slate-900">
                {roles.is_admin ? 'Pending proposals' : 'My proposals'}
              </p>
              <button type="button" onClick={() => setListOpen(false)} aria-label="Close" className="text-slate-500">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {proposals.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">
                  {roles.is_admin ? 'No proposals waiting for approval.' : 'You have not proposed any sessions yet.'}
                </p>
              )}

              {proposals.map((item) => {
                const status = STATUS_TEXT[item.publish_status];
                const canEditAsSpeaker =
                  !roles.is_admin && (item.publish_status === 'proposed' || item.publish_status === 'rejected');

                return (
                  <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatWhen(item.start_time)}
                      {item.track ? ` | ${item.track}` : ''}
                    </p>
                    {item.description && (
                      <p className="text-sm text-slate-700 mt-2 line-clamp-3">{item.description}</p>
                    )}

                    {status && (
                      <p className={`text-xs font-semibold mt-3 ${status.className}`}>{status.text}</p>
                    )}

                    {!roles.is_admin && item.publish_status === 'rejected' && item.rejection_note && (
                      <div className="mt-2 rounded-lg bg-red-50 p-3">
                        <p className="text-xs font-semibold text-red-700">Note from the organizers</p>
                        <p className="text-sm text-red-800 mt-1">{item.rejection_note}</p>
                      </div>
                    )}

                    {roles.is_admin && item.publish_status === 'proposed' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => decide(item, 'approve')}
                          disabled={busyId === item.id}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
                        >
                          <CheckCircle2 size={14} />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => decide(item, 'reject')}
                          disabled={busyId === item.id}
                          className="flex items-center gap-1 rounded-lg border border-red-200 text-red-600 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
                      </div>
                    )}

                    {canEditAsSpeaker && (
                      <button
                        type="button"
                        onClick={() => {
                          setListOpen(false);
                          setEditing(item);
                        }}
                        className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-800 mt-3"
                      >
                        <Pencil size={14} />
                        {item.publish_status === 'rejected' ? 'Edit and resend' : 'Edit'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}