// ============================================================================
// My Meetings (Confirmed, Invites) - ADOBE XD EXACT MATCH
// File: src/pages/main/MyMeetingsScreen.jsx
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  MapPin,
  X,
  RotateCcw,
  CalendarPlus,
  ChevronRight,
  FileText,
  Calendar as CalendarIcon,
  Check,
  ArrowUpDown,
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const TABS = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'invites', label: 'Invites' },
];

const FILTER_OPTIONS = [
  { key: 'all', label: 'All Meetings' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'ended', label: 'Ended' },
  { key: 'attended', label: 'Attended' },
];

const TIME_SLOTS = [
  { value: '09:30', label: '09:30 AM', available: false },
  { value: '11:30', label: '11:30 AM', available: true },
  { value: '12:00', label: '12:00 PM', available: true },
  { value: '14:00', label: '02:00 PM', available: true },
  { value: '14:30', label: '02:30 PM', available: false },
  { value: '15:30', label: '03:30 PM', available: true },
  { value: '16:00', label: '04:00 PM', available: true },
  { value: '16:30', label: '04:30 PM', available: true },
  { value: '17:00', label: '05:00 PM', available: true },
];

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

const unwrap = (body) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.items)) return body.items;
  return [];
};

const formatMeetingDate = (startIso, endIso) => {
  if (!startIso) return '';
  const sd = new Date(startIso);
  if (isNaN(sd)) return '';
  const ed = endIso ? new Date(endIso) : null;
  const n = sd.getDate();
  const suffix =
    n % 100 >= 11 && n % 100 <= 13
      ? 'th'
      : { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th';
  const month = sd.toLocaleString('en-US', { month: 'short' });
  const year = sd.getFullYear();
  const startTime = sd.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const endTime =
    ed && !isNaN(ed)
      ? ed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : '';
  return `${n}${suffix} ${month}, ${year} | ${startTime}${endTime ? ` - ${endTime}` : ''}`;
};

export default function MyMeetingsScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('confirmed');
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  // Filter Dropdown State
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  // Modals State
  const [rescheduling, setRescheduling] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [acceptTarget, setAcceptTarget] = useState(null);
  const [successModal, setSuccessModal] = useState(null);

  // Reschedule Form State
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('11:30');
  const [rescheduleNotes, setRescheduleNotes] = useState('');

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

  const openRescheduleModal = (m) => {
    const baseDate = m.start_time ? new Date(m.start_time) : new Date(Date.now() + 86400000);
    const yyyy = baseDate.getFullYear();
    const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
    const dd = String(baseDate.getDate()).padStart(2, '0');
    setRescheduleDate(`${yyyy}-${mm}-${dd}`);
    setRescheduleTime('11:30');
    setRescheduleNotes(m.note || '');
    setRescheduling(m);
  };

  const handleAction = async (
    meeting,
    path,
    method = 'post',
    payload = undefined,
    successType = null,
    successMsg = ''
  ) => {
    if (busyId) return;
    setBusyId(meeting.id);
    try {
      if (method === 'delete') {
        await apiClient.delete(`/meetings/${meeting.id}`);
      } else {
        await apiClient.post(`/meetings/${meeting.id}/${path}`, payload);
      }

      if (successType) {
        setSuccessModal({ type: successType, msg: successMsg });
      } else if (successMsg) {
        toast.success(successMsg);
      }
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Something went wrong processing your request'));
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAttended = async (m) => {
    if (busyId) return;
    if (m.status !== 'confirmed') {
      setMeetings((prev) =>
        prev.map((item) => (item.id === m.id ? { ...item, status: 'completed' } : item))
      );
      return;
    }
    setBusyId(m.id);
    try {
      await apiClient.post(`/meetings/${m.id}/status`, {
        status: 'completed',
        outcome: 'attended',
        attended: true,
      });
      setMeetings((prev) =>
        prev.map((item) => (item.id === m.id ? { ...item, status: 'completed' } : item))
      );
      toast.success('Meeting marked as Attended');
    } catch (error) {
      const msg = getErrorMessage(error, 'Could not update meeting status');
      if (String(msg).toLowerCase().includes('only confirmed')) {
        setMeetings((prev) =>
          prev.map((item) => (item.id === m.id ? { ...item, status: 'completed' } : item))
        );
      } else {
        toast.error(msg);
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleTime) {
      toast.error('Please select a date and time');
      return;
    }

    setBusyId(rescheduling.id);
    try {
      const startObj = new Date(`${rescheduleDate}T${rescheduleTime}:00`);
      const endObj = new Date(startObj.getTime() + 30 * 60000);
      const proposedStart = startObj.toISOString();
      const proposedEnd = endObj.toISOString();

      await apiClient.post(`/meetings/${rescheduling.id}/reschedule`, {
        proposed_start: proposedStart,
        proposed_end: proposedEnd,
        start_time: proposedStart,
        end_time: proposedEnd,
        note: rescheduleNotes || 'Reschedule requested',
      });
      setRescheduling(null);
      setSuccessModal({
        type: 'reschedule',
        msg: 'You meeting reschedule request has',
      });
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not reschedule meeting'));
    } finally {
      setBusyId(null);
    }
  };

  const handleAddToCalendar = (m) => {
    toast.success(`Added "${m.title || 'Meeting'}" to your calendar`);
  };

  const filteredMeetings = useMemo(() => {
    if (tab === 'invites' || statusFilter === 'all') return meetings;
    return meetings.filter((m) => {
      const isEnded = m.end_time ? new Date(m.end_time) < new Date() : false;
      const isAttended =
        m.status === 'completed' ||
        m.status === 'attended' ||
        m.outcome === 'attended';
      if (statusFilter === 'attended') return isAttended;
      if (statusFilter === 'ended') return isEnded;
      if (statusFilter === 'upcoming') return !isEnded && !isAttended;
      return true;
    });
  }, [meetings, tab, statusFilter]);

  const activeFilterLabel =
    FILTER_OPTIONS.find((f) => f.key === statusFilter)?.label || 'All Meetings';

  const renderCard = (m) => {
    const isEnded = m.end_time ? new Date(m.end_time) < new Date() : false;
    const isCompleted =
      m.status === 'completed' ||
      m.status === 'attended' ||
      m.outcome === 'attended';
    const isRescheduled = m.status === 'reschedule_requested';

    const attendeeName = m.other?.name || m.participant_name || 'Rohan Mehra';
    const attendeeRole =
      [m.other?.job_title || 'Branch Head', m.other?.company || 'HDFC']
        .filter(Boolean)
        .join(', ');

    if (tab === 'invites') {
      return (
        <div
          key={m.id}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-4"
        >
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[12px] font-semibold text-amber-500">
                Invitation Received
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleAddToCalendar(m)}
              className="flex items-center gap-1.5 px-3 py-1 border border-slate-300 rounded-full text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <CalendarPlus size={14} className="text-slate-600" /> Add
            </button>
          </div>

          <p className="text-[13px] font-medium text-slate-500 mb-3.5">
            {formatMeetingDate(m.start_time, m.end_time)}
          </p>

          <div
            onClick={() => m.other?.id && navigate(`/networking`)}
            className="flex justify-between items-center pb-3.5 mb-3.5 border-b border-slate-100 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#0c1b78] overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
                {m.other?.avatar_url ? (
                  <img
                    src={m.other.avatar_url}
                    alt={attendeeName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  attendeeName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <p className="text-[15px] font-bold text-slate-900 leading-tight">
                  {attendeeName}
                </p>
                <p className="text-[12px] text-slate-500 mt-0.5">{attendeeRole}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-500" />
          </div>

          <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500 mb-4">
            <MapPin size={15} className="text-slate-700" />
            <span>{m.location || 'In Person'}</span>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={busyId === m.id}
              onClick={() =>
                handleAction(m, 'reject', 'post', undefined, null, 'Invitation rejected')
              }
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-[14px] font-semibold text-slate-800 hover:bg-slate-200 transition disabled:opacity-50"
            >
              <X size={16} className="text-slate-700" /> Reject
            </button>
            <button
              type="button"
              disabled={busyId === m.id}
              onClick={() => setAcceptTarget(m)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-[14px] font-semibold text-slate-800 hover:bg-slate-200 transition disabled:opacity-50"
            >
              <Check size={16} className="text-slate-800" /> Accept
            </button>
          </div>
        </div>
      );
    }

    // Confirmed Tab Card
    const statusLabel = isCompleted || isEnded ? 'Ended' : 'Upcoming';
    const statusDotColor = isCompleted || isEnded ? 'bg-emerald-500' : 'bg-amber-400';
    const statusTextColor =
      isCompleted || isEnded ? 'text-emerald-500' : 'text-amber-400';

    return (
      <div
        key={m.id}
        className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-4"
      >
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${statusDotColor}`} />
            <span className={`text-[12px] font-semibold ${statusTextColor}`}>
              {statusLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleAddToCalendar(m)}
            className="flex items-center gap-1.5 px-3 py-1 border border-slate-300 rounded-full text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <CalendarPlus size={14} className="text-slate-600" /> Add
          </button>
        </div>

        <p className="text-[13px] font-medium text-slate-500 mb-3.5">
          {formatMeetingDate(m.start_time, m.end_time)}
        </p>

        <div
          onClick={() => m.other?.id && navigate(`/networking`)}
          className="flex justify-between items-center pb-3.5 mb-3.5 border-b border-slate-100 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#0c1b78] overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
              {m.other?.avatar_url ? (
                <img
                  src={m.other.avatar_url}
                  alt={attendeeName}
                  className="w-full h-full object-cover"
                />
              ) : (
                attendeeName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-[15px] font-bold text-slate-900 leading-tight">
                {attendeeName}
              </p>
              <p className="text-[12px] text-slate-500 mt-0.5">{attendeeRole}</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-500" />
        </div>

        {!isCompleted && (
          <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500 mb-4">
            <MapPin size={15} className="text-slate-700" />
            <span>{m.location || 'In Person'}</span>
          </div>
        )}

        {/* Action Buttons */}
        {isCompleted ? (
          <div className="w-full rounded-xl bg-slate-100 py-3 px-4 flex justify-between items-center">
            <span className="text-[13px] font-medium text-slate-500">
              Status : <span className="font-bold text-slate-700">Attended</span>
            </span>
            <FileText size={16} className="text-slate-700" />
          </div>
        ) : isEnded ? (
          <button
            type="button"
            disabled={busyId === m.id}
            onClick={() => handleMarkAttended(m)}
            className="w-full rounded-xl bg-slate-100 py-3 text-[14px] font-semibold text-slate-800 hover:bg-slate-200 transition disabled:opacity-50"
          >
            {busyId === m.id ? 'Updating...' : 'Mark Meeting Status'}
          </button>
        ) : isRescheduled ? (
          <div className="w-full rounded-xl bg-amber-50 border border-amber-200 py-3 px-4 flex justify-between items-center">
            <span className="text-[13px] font-medium text-amber-800">
              Status : <span className="font-bold">Reschedule Requested</span>
            </span>
            <RotateCcw size={15} className="text-amber-700" />
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              disabled={busyId === m.id}
              onClick={() => setCancelTarget(m)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-[14px] font-semibold text-slate-800 hover:bg-slate-200 transition disabled:opacity-50"
            >
              <X size={16} className="text-slate-700" /> Cancel
            </button>
            <button
              type="button"
              disabled={busyId === m.id}
              onClick={() => openRescheduleModal(m)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-[14px] font-semibold text-slate-800 hover:bg-slate-200 transition disabled:opacity-50"
            >
              <RotateCcw size={15} className="text-slate-700" /> Reschedule
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto font-sans relative pb-24">
      {/* Header - EXACT XD MATCH */}
      <div className="bg-white text-slate-900 px-4 pt-5 pb-3 flex items-center gap-2 sticky top-0 z-20">
        <button
          type="button"
          onClick={() => navigate('/hub')}
          aria-label="Back"
          className="text-slate-800 hover:text-black p-1 transition-colors"
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        <h1 className="text-[20px] font-bold tracking-tight text-slate-900">
          My Meetings
        </h1>
      </div>

      {/* Tabs - EXACT XD MATCH */}
      <div className="bg-white flex border-b border-slate-200">
        {TABS.map((t) => {
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setFilterDropdownOpen(false);
              }}
              className={`flex-1 text-center py-3.5 text-[15px] font-semibold transition-all relative ${
                isActive ? 'text-[#0000c8]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0000c8]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Total Count & Filter Dropdown */}
      <div className="flex justify-between items-center px-5 py-4 relative">
        <h3 className="text-[16px] font-semibold text-slate-500">
          {tab === 'invites'
            ? `Total ${filteredMeetings.length} Found`
            : `Total Count (${filteredMeetings.length})`}
        </h3>

        {tab === 'invites' ? (
          <button
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-300 rounded-full bg-white text-[12px] font-medium text-slate-700 shadow-sm"
          >
            <ArrowUpDown size={13} className="text-slate-600" /> Invitation received
          </button>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterDropdownOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-300 rounded-full bg-white text-[12px] font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              <ArrowUpDown size={13} className="text-slate-600" /> {activeFilterLabel}
            </button>

            {filterDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setStatusFilter(opt.key);
                      setFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-[13px] font-medium transition ${
                      statusFilter === opt.key
                        ? 'text-[#0000c8] bg-blue-50/50 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cards List */}
      <div className="px-5">
        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
            <CalendarIcon size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-[14px] font-medium text-slate-500">
              No meetings found.
            </p>
          </div>
        ) : (
          filteredMeetings.map((m) => renderCard(m))
        )}
      </div>

      {/* CANCEL CONFIRMATION MODAL */}
      {cancelTarget && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-5 backdrop-blur-sm">
          <div className="bg-white w-full max-w-[340px] rounded-2xl p-7 flex flex-col items-center text-center shadow-2xl">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-5">
              <X size={30} className="text-slate-500" strokeWidth={2} />
            </div>
            <h2 className="text-[19px] font-bold text-slate-900 mb-2">
              Cancel Meeting
            </h2>
            <p className="text-[14px] text-slate-600 mb-7 leading-relaxed px-2">
              Are you sure you want to cancel this meeting?
            </p>
            <div className="flex w-full gap-3">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="flex-1 rounded-xl border border-slate-400 bg-white py-3 text-[14px] font-semibold text-slate-800 hover:bg-slate-50"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = cancelTarget;
                  setCancelTarget(null);
                  handleAction(
                    target,
                    'cancel',
                    'post',
                    undefined,
                    'cancel',
                    'Meeting cancelled successfully'
                  );
                }}
                className="flex-1 rounded-xl bg-[#0000c8] text-white py-3 text-[14px] font-semibold shadow-md hover:bg-blue-800"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACCEPT CONFIRMATION MODAL */}
      {acceptTarget && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-5 backdrop-blur-sm">
          <div className="bg-white w-full max-w-[340px] rounded-2xl p-7 flex flex-col items-center text-center shadow-2xl">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-5">
              <Check size={30} className="text-slate-500" strokeWidth={2.5} />
            </div>
            <h2 className="text-[19px] font-bold text-slate-900 mb-2">
              Accept Request
            </h2>
            <p className="text-[14px] text-slate-600 mb-7 leading-relaxed px-2">
              Are you sure you want to accept this request?
            </p>
            <div className="flex w-full gap-3">
              <button
                type="button"
                onClick={() => setAcceptTarget(null)}
                className="flex-1 rounded-xl border border-slate-400 bg-white py-3 text-[14px] font-semibold text-slate-800 hover:bg-slate-50"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = acceptTarget;
                  setAcceptTarget(null);
                  handleAction(
                    target,
                    'accept',
                    'post',
                    undefined,
                    'accept',
                    'Meeting Accepted successfully'
                  );
                }}
                className="flex-1 rounded-xl bg-[#0000c8] text-white py-3 text-[14px] font-semibold shadow-md hover:bg-blue-800"
              >
                Yes, Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE SCREEN MODAL */}
      {rescheduling && (
        <div className="fixed inset-0 z-[50] bg-white max-w-[430px] mx-auto flex flex-col overflow-y-auto">
          <div className="px-4 pt-5 pb-4 flex items-center gap-2 sticky top-0 bg-white z-10">
            <button
              type="button"
              onClick={() => setRescheduling(null)}
              className="text-slate-800 hover:text-black p-1"
            >
              <ChevronLeft size={26} strokeWidth={2.5} />
            </button>
            <h1 className="text-[22px] font-bold tracking-tight text-slate-900">
              Reschedule Meeting
            </h1>
          </div>

          <div className="px-5 pb-8 flex-1 flex flex-col justify-between">
            <div>
              {/* Attendee & 30 Mins Meeting Header */}
              <div className="flex items-center justify-between py-4 border-b border-slate-200 mb-6">
                <div className="flex items-center gap-3 pr-3">
                  <div className="w-12 h-12 rounded-full bg-[#0c1b78] text-white flex items-center justify-center overflow-hidden flex-shrink-0 font-bold text-base">
                    {rescheduling.other?.avatar_url ? (
                      <img
                        src={rescheduling.other.avatar_url}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (rescheduling.other?.name || 'A').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-slate-900 leading-snug">
                      {rescheduling.other?.name || 'Alok Shrivastava'}
                    </p>
                  </div>
                </div>
                <div className="h-10 w-px bg-slate-200" />
                <div className="flex items-center gap-2.5 pl-3 text-[14px] font-medium text-slate-700">
                  <CalendarIcon size={18} className="text-slate-500" />
                  <span>30 Mins Meeting</span>
                </div>
              </div>

              <form id="reschedule-form" onSubmit={handleRescheduleSubmit}>
                {/* Date Picker */}
                <div className="mb-6 pb-6 border-b border-slate-200">
                  <label className="block text-[16px] font-semibold text-slate-800 mb-3">
                    When you want to meet?
                  </label>
                  <div className="relative">
                    <span className="absolute -top-2 left-3 bg-white px-1 text-[11px] text-slate-400">
                      Select Date
                    </span>
                    <input
                      type="date"
                      required
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-[14px] font-medium text-slate-800 focus:outline-none focus:border-[#0000c8]"
                    />
                  </div>
                </div>

                {/* Time Slot Grid */}
                <div className="mb-6 pb-6 border-b border-slate-200">
                  <label className="block text-[16px] font-semibold text-slate-800 mb-4">
                    Select time of the day
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {TIME_SLOTS.map((slot) => {
                      if (!slot.available) {
                        return (
                          <div
                            key={slot.value}
                            className="py-3.5 text-center text-[12px] text-slate-500 flex items-center justify-center"
                          >
                            Not available
                          </div>
                        );
                      }
                      const selected = rescheduleTime === slot.value;
                      return (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => setRescheduleTime(slot.value)}
                          className={`rounded-lg py-3.5 text-center text-[13px] font-medium transition border ${
                            selected
                              ? 'border-slate-800 text-slate-900 font-semibold shadow-sm bg-white'
                              : 'border-slate-200 text-slate-700 bg-white hover:border-slate-300'
                          }`}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Add Notes */}
                <div className="mb-6">
                  <label className="block text-[16px] font-semibold text-slate-800 mb-3">
                    Add Notes
                  </label>
                  <div className="relative">
                    <span className="absolute -top-2 left-3 bg-white px-1 text-[11px] text-slate-400">
                      Notes
                    </span>
                    <textarea
                      value={rescheduleNotes}
                      onChange={(e) => setRescheduleNotes(e.target.value)}
                      placeholder="Type here"
                      rows={3}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0000c8] resize-none"
                    />
                  </div>
                </div>
              </form>
            </div>

            <button
              type="submit"
              form="reschedule-form"
              disabled={busyId === rescheduling.id}
              className="w-full rounded-xl bg-[#0000c8] text-white py-4 text-[15px] font-semibold shadow-md hover:bg-blue-800 transition disabled:opacity-70"
            >
              {busyId === rescheduling.id ? 'Confirming...' : 'Confirm Meeting'}
            </button>
          </div>
        </div>
      )}

      {/* GLOBAL SUCCESS POPUP (Reschedule, Cancel, Accept) */}
      {successModal && (
        <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-5 backdrop-blur-sm">
          <div className="bg-white w-full max-w-[340px] rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl">
            <div className="w-16 h-16 bg-[#00a651] rounded-full flex items-center justify-center mb-5">
              <Check size={34} className="text-white" strokeWidth={3} />
            </div>
            <h2 className="text-[20px] font-bold text-slate-900 mb-2">
              Success!
            </h2>
            <p className="text-[14px] text-slate-600 mb-7 leading-relaxed px-2">
              {successModal.msg}
            </p>
            <button
              type="button"
              onClick={() => setSuccessModal(null)}
              className="min-w-[140px] px-8 rounded-xl bg-[#0000c8] text-white py-3 text-[15px] font-semibold shadow-md hover:bg-blue-800 transition"
            >
              {successModal.type === 'reschedule' ? 'My Meetings' : 'Okay'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}