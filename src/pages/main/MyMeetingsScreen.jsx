// ============================================================================
// My Meetings - matches Adobe XD screens
// File: src/pages/main/MyMeetingsScreen.jsx
// Route: /my-meetings
// Backend: /api/v1/meetings
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowUpDown,
  Calendar as CalendarIcon,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  MapPin,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const DURATION_MIN = 30;

const CONFIRMED_FILTERS = [
  { key: 'all', label: 'All Meetings' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'ended', label: 'Ended' },
  { key: 'sent', label: 'Sent requests' },
  { key: 'cancelled', label: 'Cancelled' },
];

const INVITE_FILTERS = [
  { key: 'all', label: 'Invitation received' },
  { key: 'reschedule', label: 'Reschedule requests' },
];

const TIME_SLOTS = ['09:30', '10:00', '11:00', '11:30', '12:00', '14:30', '15:00', '16:00', '17:00'];

const TONES = {
  amber: { dot: 'bg-amber-400', text: 'text-amber-500' },
  green: { dot: 'bg-emerald-500', text: 'text-emerald-600' },
  red: { dot: 'bg-red-500', text: 'text-red-600' },
  blue: { dot: 'bg-[#0000c8]', text: 'text-[#0000c8]' },
};

const CONFIRM_COPY = {
  cancel: {
    title: 'Cancel Meeting',
    text: 'Are you sure you want to cancel this meeting?',
    yes: 'Yes, Cancel',
    icon: X,
  },
  withdraw: {
    title: 'Withdraw Request',
    text: 'Are you sure you want to withdraw this meeting request?',
    yes: 'Yes, Withdraw',
    icon: X,
  },
  accept: {
    title: 'Accept Request',
    text: 'Are you sure you want to accept this request?',
    yes: 'Yes, Accept',
    icon: Check,
  },
  remove: {
    title: 'Remove Meeting',
    text: 'It will be removed from your list only. The other person keeps their copy.',
    yes: 'Yes, Remove',
    icon: Trash2,
  },
};

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

const errorText = (e, fallback) => {
  const d = e?.response?.data?.detail;
  if (Array.isArray(d)) return d.map((x) => x.msg).join(', ');
  return d || e?.message || fallback;
};

const ordinal = (n) => {
  if (n % 100 >= 11 && n % 100 <= 13) return 'th';
  return { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th';
};

const fmtDay = (iso) => {
  const d = new Date(iso);
  return `${d.getDate()}${ordinal(d.getDate())} ${d.toLocaleString('en-US', { month: 'short' })}, ${d.getFullYear()}`;
};

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const fmtRange = (start, end) => `${fmtDay(start)} | ${fmtTime(start)} - ${fmtTime(end)}`;

const to12h = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const initial = (name) => (name ? name.trim().charAt(0).toUpperCase() : 'U');

// Invites show the proposed time when the other person proposed a reschedule
const shownStart = (m) =>
  m.status === 'reschedule_requested' && !m.proposed_by_me ? m.proposed_start : m.start_time;
const shownEnd = (m) =>
  m.status === 'reschedule_requested' && !m.proposed_by_me ? m.proposed_end : m.end_time;

const cardState = (m, tab) => {
  if (tab === 'invites') {
    return m.status === 'reschedule_requested'
      ? { label: 'Reschedule Requested', tone: 'amber' }
      : { label: 'Invitation Received', tone: 'amber' };
  }
  switch (m.status) {
    case 'completed':
    case 'no_show':
      return { label: 'Ended', tone: 'green' };
    case 'cancelled':
      return { label: 'Cancelled', tone: 'red' };
    case 'rejected':
      return { label: 'Declined', tone: 'red' };
    case 'pending':
      return { label: 'Request Pending', tone: 'blue' };
    case 'reschedule_requested':
      return { label: 'Reschedule Pending', tone: 'amber' };
    default:
      return m.is_ended
        ? { label: 'Ended', tone: 'green' }
        : { label: 'Upcoming', tone: 'amber' };
  }
};

// Which actions are allowed for this meeting in this tab
const actionsFor = (m, tab) => {
  const a = { accept: false, reject: false, cancel: false, withdraw: false, reschedule: false, status: false, remove: false };
  if (tab === 'invites') {
    a.accept = m.can_respond;
    a.reject = m.can_respond;
    return a;
  }
  if (m.status === 'confirmed' && !m.is_ended) {
    a.cancel = true;
    a.reschedule = true;
  }
  if (m.status === 'reschedule_requested' && m.proposed_by_me) a.cancel = true;
  if (m.status === 'pending' && m.is_requester) a.withdraw = true;
  if (m.status === 'confirmed' && m.is_ended) {
    a.status = true;
    a.remove = true;
  }
  if (['completed', 'no_show', 'cancelled', 'rejected'].includes(m.status)) a.remove = true;
  return a;
};

const downloadIcs = (m) => {
  const fmt = (s) => new Date(s).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const start = shownStart(m);
  const end = shownEnd(m);
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EventAI//Meetings//EN',
    'BEGIN:VEVENT',
    `UID:meeting-${m.id}@eventai`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(m.title)}`,
    `LOCATION:${esc(m.location || 'In Person')}`,
    `DESCRIPTION:${esc(m.note)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `meeting-${m.id}.ics`;
  a.click();
  URL.revokeObjectURL(url);
};

// ----------------------------------------------------------------------------
// Small UI pieces
// ----------------------------------------------------------------------------

function Avatar({ person, size = 42 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-[#0c1b78] text-white flex items-center justify-center overflow-hidden flex-shrink-0 font-bold text-sm border border-slate-100"
    >
      {person?.avatar_url ? (
        <img src={person.avatar_url} alt="" className="w-full h-full object-cover" />
      ) : (
        initial(person?.name)
      )}
    </div>
  );
}

function Btn({ children, onClick, disabled, tone = 'ghost', icon: Icon, block = false }) {
  const tones = {
    ghost: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
    primary: 'bg-[#0000c8] text-white border-[#0000c8] hover:bg-blue-800',
    danger: 'bg-white text-red-600 border-red-200 hover:bg-red-50',
    light: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${block ? 'w-full' : 'flex-1'} flex items-center justify-center gap-2 rounded-2xl border py-3.5 text-[13px] font-bold shadow-sm transition disabled:opacity-60 ${tones[tone]}`}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}

function Overlay({ children, z = 'z-[60]' }) {
  return (
    <div className={`fixed inset-0 ${z} bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm`}>
      {children}
    </div>
  );
}

function MeetingCard({ m, tab, busy, dispatch, addToCalendar }) {
  const state = cardState(m, tab);
  const tone = TONES[state.tone];
  const a = actionsFor(m, tab);
  const start = shownStart(m);
  const end = shownEnd(m);
  const otherLine = [m.other?.job_title, m.other?.company].filter(Boolean).join(', ') || 'Designation not added';

  let footer = null;
  if (tab === 'invites') {
    footer = (
      <div className="flex gap-3">
        <Btn icon={X} disabled={busy} onClick={() => dispatch('reject', m)}>Reject</Btn>
        <Btn icon={Check} disabled={busy} onClick={() => dispatch('accept', m)}>Accept</Btn>
      </div>
    );
  } else if (m.status === 'completed' || m.status === 'no_show') {
    footer = (
      <div className="w-full rounded-2xl bg-slate-50 border border-slate-100 py-3.5 px-5 flex justify-between items-center">
        <span className="text-[13px] font-bold text-slate-400">
          Status : <span className="text-slate-700">{m.status === 'completed' ? 'Attended' : 'No Show'}</span>
        </span>
        <FileText size={16} className="text-slate-700" />
      </div>
    );
  } else if (a.status) {
    footer = (
      <Btn block disabled={busy} onClick={() => dispatch('status', m)}>Mark Meeting Status</Btn>
    );
  } else if (a.withdraw) {
    footer = <Btn block icon={X} disabled={busy} onClick={() => dispatch('withdraw', m)}>Withdraw Request</Btn>;
  } else if (a.cancel && a.reschedule) {
    footer = (
      <div className="flex gap-3">
        <Btn icon={X} disabled={busy} onClick={() => dispatch('cancel', m)}>Cancel</Btn>
        <Btn icon={RotateCcw} disabled={busy} onClick={() => dispatch('reschedule', m)}>Reschedule</Btn>
      </div>
    );
  } else if (a.cancel) {
    footer = <Btn block icon={X} disabled={busy} onClick={() => dispatch('cancel', m)}>Cancel Meeting</Btn>;
  }

  return (
    <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-[0_2px_15px_rgb(0,0,0,0.04)] mb-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
          <span className={`text-[11px] font-bold ${tone.text}`}>{state.label}</span>
        </div>
        <button
          type="button"
          onClick={() => addToCalendar(m)}
          className="flex items-center gap-1.5 px-3 py-1 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm"
        >
          <CalendarPlus size={14} className="text-slate-400" /> Add
        </button>
      </div>

      <p className="text-[12px] font-medium text-slate-500 mb-4 px-0.5">{fmtRange(start, end)}</p>

      <button
        type="button"
        onClick={() => dispatch('open', m)}
        className="w-full flex justify-between items-center mb-4 px-0.5 text-left"
      >
        <div className="flex items-center gap-3">
          <Avatar person={m.other} />
          <div>
            <p className="text-[15px] font-bold text-slate-900 leading-snug">{m.other?.name || 'Attendee'}</p>
            <p className="text-[12px] text-slate-500 mt-0.5">{otherLine}</p>
          </div>
        </div>
        <ChevronRight size={20} className="text-slate-400" />
      </button>

      <div className="flex items-center gap-2 text-[12px] font-bold text-slate-500 mb-5 px-0.5">
        <MapPin size={15} className="text-slate-400" /> {m.location || 'In Person'}
      </div>

      {footer}
    </div>
  );
}

function ConfirmModal({ kind, busy, onYes, onClose }) {
  const copy = CONFIRM_COPY[kind];
  const Icon = copy.icon;
  return (
    <Overlay>
      <div className="bg-white w-full max-w-[320px] rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-5">
          <Icon size={28} className="text-slate-400" strokeWidth={kind === 'accept' ? 3 : 2} />
        </div>
        <h2 className="text-[19px] font-bold text-slate-900 mb-2">{copy.title}</h2>
        <p className="text-[14px] font-medium text-slate-500 mb-8 leading-relaxed px-2">{copy.text}</p>
        <div className="flex w-full gap-3">
          <Btn tone="light" onClick={onClose} disabled={busy}>Go Back</Btn>
          <Btn tone="primary" onClick={onYes} disabled={busy}>{copy.yes}</Btn>
        </div>
      </div>
    </Overlay>
  );
}

function StatusModal({ busy, onPick, onClose }) {
  return (
    <Overlay>
      <div className="bg-white w-full max-w-[320px] rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl">
        <h2 className="text-[19px] font-bold text-slate-900 mb-2">Mark Meeting Status</h2>
        <p className="text-[14px] font-medium text-slate-500 mb-8 leading-relaxed px-2">How did this meeting go?</p>
        <div className="flex w-full gap-3">
          <Btn tone="light" onClick={() => onPick('no_show')} disabled={busy}>No Show</Btn>
          <Btn tone="primary" onClick={() => onPick('completed')} disabled={busy}>Attended</Btn>
        </div>
        <button type="button" onClick={onClose} className="mt-4 text-[13px] font-bold text-slate-500">
          Close
        </button>
      </div>
    </Overlay>
  );
}

function SuccessPopup({ msg, cta, onClose }) {
  return (
    <Overlay z="z-[70]">
      <div className="bg-white w-full max-w-[320px] rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl">
        <div className="w-16 h-16 bg-[#1eb15a] rounded-full flex items-center justify-center mb-5 shadow-lg shadow-green-500/30">
          <Check size={32} className="text-white" strokeWidth={4} />
        </div>
        <h2 className="text-[20px] font-bold text-slate-900 mb-2">Success!</h2>
        <p className="text-[14px] font-medium text-slate-500 mb-8 leading-relaxed px-2">{msg}</p>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-2xl bg-[#0000c8] text-white py-3.5 text-[15px] font-bold shadow-md hover:bg-blue-800 transition"
        >
          {cta}
        </button>
      </div>
    </Overlay>
  );
}

// ----------------------------------------------------------------------------
// Reschedule (full page, as in design)
// ----------------------------------------------------------------------------

function ReschedulePage({ meeting, onClose, onDone }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const today = new Date().toLocaleDateString('en-CA');
  const durationMs = new Date(meeting.end_time) - new Date(meeting.start_time) || DURATION_MIN * 60000;
  const durationMin = Math.round(durationMs / 60000);

  const isPast = (slot) => !!date && new Date(`${date}T${slot}:00`) <= new Date();

  const submit = async (e) => {
    e.preventDefault();
    if (!date || !time) {
      toast.error('Please select a date and time');
      return;
    }
    const start = new Date(`${date}T${time}:00`);
    if (start <= new Date()) {
      toast.error('Choose a time in the future');
      return;
    }
    const end = new Date(start.getTime() + durationMs);
    setSaving(true);
    try {
      await apiClient.post(`/meetings/${meeting.id}/reschedule`, {
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        note: notes.trim() || null,
      });
      onDone();
    } catch (err) {
      toast.error(errorText(err, 'Could not reschedule this meeting'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="max-w-[430px] mx-auto min-h-screen">
        <div className="px-5 pt-5 pb-4 flex items-center gap-3 border-b border-slate-100 sticky top-0 bg-white z-10">
          <button type="button" onClick={onClose} aria-label="Back" className="text-slate-800">
            <ChevronLeft size={26} strokeWidth={2.5} />
          </button>
          <h1 className="text-[20px] font-bold tracking-tight">Reschedule Meeting</h1>
        </div>

        <form onSubmit={submit} className="p-5">
          <div className="flex items-center justify-between bg-white border border-slate-100 p-4 rounded-2xl mb-8 shadow-sm">
            <div className="flex items-center gap-3">
              <Avatar person={meeting.other} size={40} />
              <div>
                <p className="text-[14px] font-bold text-slate-900">{meeting.other?.name || 'Attendee'}</p>
                <p className="text-[12px] text-slate-500 mt-0.5">{meeting.other?.company || ''}</p>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-2 text-[13px] font-bold text-slate-600">
              <CalendarIcon size={16} className="text-slate-400" /> {durationMin} Mins Meeting
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-[15px] font-bold text-slate-900 mb-4">When you want to meet?</label>
            <input
              type="date"
              required
              min={today}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setTime('');
              }}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-[14px] font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0000c8]/20 focus:border-[#0000c8]"
            />
          </div>

          <div className="mb-8">
            <label className="block text-[15px] font-bold text-slate-900 mb-4">Select time of the day</label>
            <div className="grid grid-cols-3 gap-3">
              {TIME_SLOTS.map((slot) => {
                const past = isPast(slot);
                const selected = time === slot;
                const cls = past
                  ? 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed'
                  : selected
                  ? 'border-[#0000c8] text-[#0000c8] bg-white'
                  : 'border-slate-200 text-slate-700 bg-white hover:border-slate-300';
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={past}
                    onClick={() => setTime(slot)}
                    className={`border-2 rounded-xl py-3.5 text-center text-[12px] font-bold shadow-sm transition ${cls}`}
                  >
                    {past ? 'Not available' : to12h(slot)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-[15px] font-bold text-slate-900 mb-4">Add Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Type here"
              rows={4}
              maxLength={1000}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-[14px] font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0000c8]/20 focus:border-[#0000c8] resize-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-[#0000c8] text-white py-4 text-[15px] font-bold shadow-lg hover:bg-blue-800 transition disabled:opacity-70"
          >
            {saving ? 'Confirming...' : 'Confirm Meeting'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Meeting detail (opened from the chevron)
// ----------------------------------------------------------------------------

function MeetingDetail({ id, tab, busyId, dispatch, addToCalendar, onClose }) {
  const [m, setM] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get(`/meetings/${id}`)
      .then((res) => {
        if (!cancelled) setM(res?.data?.data ?? null);
      })
      .catch((e) => {
        if (!cancelled) {
          toast.error(errorText(e, 'Could not open this meeting'));
          onClose();
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading || !m) {
    return (
      <div className="fixed inset-0 z-40 bg-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const state = cardState(m, tab);
  const tone = TONES[state.tone];
  const a = actionsFor(m, tab);
  const busy = busyId === m.id;
  const start = shownStart(m);
  const end = shownEnd(m);
  const otherLine = [m.other?.job_title, m.other?.company].filter(Boolean).join(', ') || 'Designation not added';

  return (
    <div className="fixed inset-0 z-40 bg-[#f8fafc] overflow-y-auto">
      <div className="max-w-[430px] mx-auto min-h-screen pb-10">
        <div className="bg-white px-5 pt-5 pb-3 flex items-center gap-3 sticky top-0 z-20 border-b border-slate-100">
          <button type="button" onClick={onClose} aria-label="Back" className="text-slate-800">
            <ChevronLeft size={26} strokeWidth={2.5} />
          </button>
          <h1 className="text-[20px] font-bold tracking-tight">Meeting details</h1>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-1.5 mb-3">
              <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
              <span className={`text-[11px] font-bold ${tone.text}`}>{state.label}</span>
            </div>
            <p className="text-[13px] font-medium text-slate-500 mb-5">{fmtRange(start, end)}</p>
            <div className="flex items-center gap-3 mb-5">
              <Avatar person={m.other} size={48} />
              <div>
                <p className="text-[16px] font-bold text-slate-900">{m.other?.name || 'Attendee'}</p>
                <p className="text-[12px] text-slate-500 mt-0.5">{otherLine}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[13px] font-bold text-slate-500">
              <MapPin size={15} className="text-slate-400" /> {m.location || 'In Person'}
            </div>
          </div>

          {m.note && (
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <p className="text-[12px] font-bold text-slate-400 mb-2">Note</p>
              <p className="text-[14px] text-slate-700 leading-relaxed">{m.note}</p>
            </div>
          )}

          {m.status === 'reschedule_requested' && (
            <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-sm">
              <p className="text-[12px] font-bold text-amber-500 mb-2">
                {m.proposed_by_me ? 'You proposed a new time' : 'New time proposed'}
              </p>
              <p className="text-[14px] font-bold text-slate-900">{fmtRange(m.proposed_start, m.proposed_end)}</p>
              {m.proposed_note && <p className="text-[13px] text-slate-600 mt-2">{m.proposed_note}</p>}
            </div>
          )}

          {(m.status === 'completed' || m.status === 'no_show') && (
            <div className="w-full rounded-2xl bg-white border border-slate-100 py-3.5 px-5 flex justify-between items-center shadow-sm">
              <span className="text-[13px] font-bold text-slate-400">
                Status : <span className="text-slate-700">{m.status === 'completed' ? 'Attended' : 'No Show'}</span>
              </span>
              <FileText size={16} className="text-slate-700" />
            </div>
          )}

          <div className="space-y-3 pt-2">
            {a.accept && <Btn block tone="primary" icon={Check} disabled={busy} onClick={() => dispatch('accept', m)}>Accept</Btn>}
            {a.reject && <Btn block icon={X} disabled={busy} onClick={() => dispatch('reject', m)}>Reject</Btn>}
            {a.status && <Btn block disabled={busy} onClick={() => dispatch('status', m)}>Mark Meeting Status</Btn>}
            {a.reschedule && <Btn block icon={RotateCcw} disabled={busy} onClick={() => dispatch('reschedule', m)}>Reschedule</Btn>}
            {a.withdraw && <Btn block icon={X} disabled={busy} onClick={() => dispatch('withdraw', m)}>Withdraw Request</Btn>}
            {a.cancel && <Btn block icon={X} disabled={busy} onClick={() => dispatch('cancel', m)}>Cancel Meeting</Btn>}
            <Btn block icon={CalendarPlus} onClick={() => addToCalendar(m)}>Add to calendar</Btn>
            {a.remove && <Btn block tone="danger" icon={Trash2} disabled={busy} onClick={() => dispatch('remove', m)}>Remove from my meetings</Btn>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Screen
// ----------------------------------------------------------------------------

export default function MyMeetingsScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('confirmed');
  const [filter, setFilter] = useState('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [rescheduleFor, setRescheduleFor] = useState(null);
  const [confirm, setConfirm] = useState(null); // { kind, meeting }
  const [success, setSuccess] = useState(null); // { msg, cta }

  const filters = tab === 'invites' ? INVITE_FILTERS : CONFIRMED_FILTERS;
  const activeFilter = filters.find((f) => f.key === filter) || filters[0];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/meetings/', { params: { tab, filter } });
      const list = res?.data?.data ?? [];
      setMeetings(list);
      setTotal(res?.data?.total ?? list.length);
    } catch (e) {
      toast.error(errorText(e, 'Could not load your meetings'));
      setMeetings([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [tab, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (m, request, { msg, popup = null } = {}) => {
    setBusyId(m.id);
    try {
      await request();
      setDetailId(null);
      if (popup) setSuccess({ msg, cta: popup });
      else toast.success(msg);
      await load();
    } catch (e) {
      toast.error(errorText(e, 'Something went wrong. Please try again.'));
    } finally {
      setBusyId(null);
    }
  };

  const confirmAction = (statusValue) => {
    const { kind, meeting: m } = confirm;
    setConfirm(null);
    if (kind === 'accept') {
      return run(m, () => apiClient.post(`/meetings/${m.id}/accept`), {
        msg: 'Meeting Accepted successfully',
        popup: 'Okay',
      });
    }
    if (kind === 'cancel') {
      return run(m, () => apiClient.post(`/meetings/${m.id}/cancel`), {
        msg: 'Meeting cancelled successfully',
        popup: 'Okay',
      });
    }
    if (kind === 'withdraw') {
      return run(m, () => apiClient.post(`/meetings/${m.id}/cancel`), {
        msg: 'Your meeting request was withdrawn',
        popup: 'Okay',
      });
    }
    if (kind === 'remove') {
      return run(m, () => apiClient.delete(`/meetings/${m.id}`), {
        msg: 'Removed from your meetings',
      });
    }
    if (kind === 'status') {
      return run(m, () => apiClient.post(`/meetings/${m.id}/status`, { status: statusValue }), {
        msg: statusValue === 'completed' ? 'Marked as Attended' : 'Marked as No Show',
      });
    }
  };

  const dispatch = (kind, m) => {
    if (kind === 'open') return setDetailId(m.id);
    if (kind === 'reschedule') return setRescheduleFor(m);
    if (kind === 'reject') {
      return run(m, () => apiClient.post(`/meetings/${m.id}/reject`), { msg: 'Meeting declined' });
    }
    setConfirm({ kind, meeting: m });
  };

  const addToCalendar = (m) => {
    downloadIcs(m);
    toast.success('Calendar file downloaded');
  };

  const switchTab = (key) => {
    setTab(key);
    setFilter('all');
    setMenuOpen(false);
  };

  const countLabel = loading
    ? 'Loading...'
    : tab === 'invites'
    ? `Total ${total} Found`
    : `Total Count (${total})`;

  return (
    <div className="min-h-screen bg-[#f8fafc] max-w-[430px] mx-auto font-sans relative pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-5 pb-3 flex items-center gap-3 sticky top-0 z-20">
        <button type="button" onClick={() => navigate(-1)} aria-label="Back" className="text-slate-800">
          <ChevronLeft size={26} strokeWidth={2.5} />
        </button>
        <h1 className="text-[20px] font-bold tracking-tight">My Meetings</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white flex px-6 border-b border-slate-100 shadow-sm">
        {[
          { key: 'confirmed', label: 'Confirmed' },
          { key: 'invites', label: 'Invites' },
        ].map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => switchTab(t.key)}
              className={`flex-1 text-center pb-3 pt-3 text-[15px] font-bold relative transition-all ${
                active ? 'text-[#0000c8]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t.label}
              {active && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0000c8]" />}
            </button>
          );
        })}
      </div>

      {/* Count and filter */}
      <div className="flex justify-between items-center px-5 py-5">
        <h3 className="text-[16px] font-bold text-slate-500">{countLabel}</h3>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-full bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50 shadow-sm"
          >
            <ArrowUpDown size={14} className="text-slate-500" /> {activeFilter.label}
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 z-40 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2">
                {filters.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => {
                      setFilter(f.key);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 text-left text-[14px] font-bold text-slate-800 hover:bg-slate-50"
                  >
                    {f.label}
                    {filter === f.key && <Check size={16} className="text-[#0000c8]" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* List */}
      <div className="px-5">
        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <CalendarIcon size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-[14px] font-medium text-slate-500">No meetings found.</p>
          </div>
        ) : (
          meetings.map((m) => (
            <MeetingCard
              key={m.id}
              m={m}
              tab={tab}
              busy={busyId === m.id}
              dispatch={dispatch}
              addToCalendar={addToCalendar}
            />
          ))
        )}
      </div>

      {/* Detail */}
      {detailId && (
        <MeetingDetail
          id={detailId}
          tab={tab}
          busyId={busyId}
          dispatch={dispatch}
          addToCalendar={addToCalendar}
          onClose={() => setDetailId(null)}
        />
      )}

      {/* Reschedule */}
      {rescheduleFor && (
        <ReschedulePage
          meeting={rescheduleFor}
          onClose={() => setRescheduleFor(null)}
          onDone={() => {
            setRescheduleFor(null);
            setDetailId(null);
            setSuccess({ msg: 'Your reschedule request has been sent', cta: 'My Meetings' });
            load();
          }}
        />
      )}

      {/* Confirmations */}
      {confirm && confirm.kind !== 'status' && (
        <ConfirmModal
          kind={confirm.kind}
          busy={busyId === confirm.meeting.id}
          onYes={() => confirmAction()}
          onClose={() => setConfirm(null)}
        />
      )}
      {confirm && confirm.kind === 'status' && (
        <StatusModal
          busy={busyId === confirm.meeting.id}
          onPick={(value) => confirmAction(value)}
          onClose={() => setConfirm(null)}
        />
      )}

      {/* Success */}
      {success && (
        <SuccessPopup msg={success.msg} cta={success.cta} onClose={() => setSuccess(null)} />
      )}
    </div>
  );
}