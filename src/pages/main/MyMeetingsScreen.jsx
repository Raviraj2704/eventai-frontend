// ============================================================================
// My Meetings (Confirmed, Invites, Sent)
// File: src/pages/main/MyMeetingsScreen.jsx
// Route: /my-meetings
// Real API only:
//   GET    /meetings/?tab=confirmed|invites|sent
//   POST   /meetings/{id}/accept
//   POST   /meetings/{id}/reject
//   POST   /meetings/{id}/cancel
//   POST   /meetings/{id}/status        completed | no_show
//   DELETE /meetings/{id}
//   PUT    /meetings/{id}               (via ScheduleMeetingSheet)
//   POST   /meetings/{id}/reschedule    (via TimeProposalSheet)
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, MapPin, Pencil, CalendarClock, Trash2, Check, X } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ScheduleMeetingSheet from '../../components/networking/ScheduleMeetingSheet';
import TimeProposalSheet from '../../components/networking/TimeProposalSheet';
import apiClient from '../../config/apiClient';

const TABS = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'invites', label: 'Invites' },
  { key: 'sent', label: 'Sent' },
];

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

const unwrap = (body) => (Array.isArray(body?.data) ? body.data : []);

const formatWhen = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

const STATUS_LABEL = {
  pending: 'Waiting for response',
  confirmed: 'Confirmed',
  reschedule_requested: 'New time proposed',
  rejected: 'Declined',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'No show',
};

const STATUS_COLOR = {
  confirmed: 'text-emerald-700',
  completed: 'text-emerald-700',
  pending: 'text-amber-600',
  reschedule_requested: 'text-amber-600',
  rejected: 'text-red-600',
  cancelled: 'text-red-600',
  no_show: 'text-red-600',
};

export default function MyMeetingsScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('confirmed');
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [rescheduling, setRescheduling] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/meetings/', { params: { tab } });
      setMeetings(unwrap(res?.data));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load your meetings'));
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (meeting, path, successText, method = 'post') => {
    if (busyId) return;
    setBusyId(meeting.id);
    try {
      if (method === 'delete') {
        await apiClient.delete(`/meetings/${meeting.id}`);
      } else {
        await apiClient.post(`/meetings/${meeting.id}/${path}`, path === 'status' ? { status: successText.status } : undefined);
      }
      toast.success(successText.message || successText);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Something went wrong'));
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = (meeting) => {
    if (!window.confirm('Delete this meeting from your list?')) return;
    act(meeting, '', 'Meeting deleted', 'delete');
  };

  const confirmCancel = (meeting) => {
    if (!window.confirm('Cancel this meeting? The other person will see it as cancelled.')) return;
    act(meeting, 'cancel', 'Meeting cancelled');
  };

  const renderActions = (m) => {
    const busy = busyId === m.id;
    const btn = 'flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-semibold disabled:opacity-50';

    // Invites: someone asked you
    if (tab === 'invites') {
      if (m.status === 'pending') {
        return (
          <div className="flex gap-2 mt-3">
            <button type="button" disabled={busy} onClick={() => act(m, 'reject', 'Meeting declined')} className={`${btn} border-slate-300 text-slate-800`}>
              <X size={14} /> Decline
            </button>
            <button type="button" disabled={busy} onClick={() => act(m, 'accept', 'Meeting confirmed')} className={`${btn} border-[#0000c8] bg-[#0000c8] text-white`}>
              <Check size={14} /> Accept
            </button>
          </div>
        );
      }
      if (m.status === 'reschedule_requested') {
        return (
          <div className="flex gap-2 mt-3">
            <button type="button" disabled={busy} onClick={() => act(m, 'reject', 'Kept the original time')} className={`${btn} border-slate-300 text-slate-800`}>
              <X size={14} /> Keep original
            </button>
            <button type="button" disabled={busy} onClick={() => act(m, 'accept', 'New time confirmed')} className={`${btn} border-[#0000c8] bg-[#0000c8] text-white`}>
              <Check size={14} /> Accept new time
            </button>
          </div>
        );
      }
    }

    // Confirmed: outcome, reschedule, cancel
    if (tab === 'confirmed' && m.status === 'confirmed') {
      return (
        <div className="space-y-2 mt-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => act(m, 'status', { status: 'completed', message: 'Marked as completed' })} className={`${btn} border-emerald-600 text-emerald-700`}>
              <Check size={14} /> Completed
            </button>
            <button type="button" disabled={busy} onClick={() => act(m, 'status', { status: 'no_show', message: 'Marked as no show' })} className={`${btn} border-slate-300 text-slate-800`}>
              No show
            </button>
            <button type="button" disabled={busy} onClick={() => setRescheduling(m)} className={`${btn} border-slate-300 text-slate-800`}>
              <CalendarClock size={14} /> Reschedule
            </button>
          </div>
          <button type="button" disabled={busy} onClick={() => confirmCancel(m)} className="text-sm font-semibold text-red-600">
            Cancel meeting
          </button>
        </div>
      );
    }

    // Sent: edit a pending request, cancel it, or delete a closed one
    if (tab === 'sent') {
      return (
        <div className="flex flex-wrap gap-2 mt-3">
          {m.status === 'pending' && (
            <>
              <button type="button" disabled={busy} onClick={() => setEditing(m)} className={`${btn} border-slate-300 text-slate-800`}>
                <Pencil size={14} /> Edit
              </button>
              <button type="button" disabled={busy} onClick={() => confirmCancel(m)} className={`${btn} border-red-200 text-red-600`}>
                Cancel
              </button>
            </>
          )}
          {['rejected', 'cancelled'].includes(m.status) && (
            <button type="button" disabled={busy} onClick={() => confirmDelete(m)} className={`${btn} border-red-200 text-red-600`}>
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      );
    }

    // Closed meetings in any tab can be deleted
    if (['rejected', 'cancelled'].includes(m.status)) {
      return (
        <div className="flex gap-2 mt-3">
          <button type="button" disabled={busy} onClick={() => confirmDelete(m)} className={`${btn} border-red-200 text-red-600`}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28">
      <div className="bg-[#0c1b78] text-white px-4 pt-5 pb-4 flex items-center gap-3">
        <button type="button" onClick={() => navigate('/networking')} aria-label="Back" className="text-white">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">My Meetings</h1>
      </div>

      <div className="flex gap-2 px-4 pt-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold border ${
              tab === t.key ? 'bg-[#0000c8] text-white border-[#0000c8]' : 'border-slate-300 text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner />
          </div>
        ) : meetings.length === 0 ? (
          <p className="text-center text-sm text-slate-500 py-12">Nothing here yet.</p>
        ) : (
          meetings.map((m) => (
            <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex justify-between items-start gap-2">
                <p className="text-base font-semibold text-slate-900">{m.title}</p>
                <span className={`text-xs font-semibold shrink-0 ${STATUS_COLOR[m.status] || 'text-slate-500'}`}>
                  {STATUS_LABEL[m.status] || m.status}
                </span>
              </div>

              <p className="text-sm text-slate-600 mt-1">
                With {m.other?.name || 'attendee'}
                {m.other?.job_title ? `, ${m.other.job_title}` : ''}
              </p>

              <div className="mt-2 space-y-1">
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock size={12} /> {formatWhen(m.start_time)} to {formatWhen(m.end_time)}
                </p>
                {m.location && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin size={12} /> {m.location}
                  </p>
                )}
                {m.status === 'reschedule_requested' && m.proposed_start && (
                  <p className="text-xs text-amber-700">
                    Proposed: {formatWhen(m.proposed_start)} to {formatWhen(m.proposed_end)}
                  </p>
                )}
                {m.note && <p className="text-xs text-slate-500 italic">"{m.note}"</p>}
              </div>

              {renderActions(m)}
            </div>
          ))
        )}
      </div>

      {editing && (
        <ScheduleMeetingSheet
          userId={editing.other?.user_id}
          meeting={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}

      {rescheduling && (
        <TimeProposalSheet
          meeting={rescheduling}
          onClose={() => setRescheduling(null)}
          onSaved={async () => {
            setRescheduling(null);
            await load();
          }}
        />
      )}
    </div>
  );
}