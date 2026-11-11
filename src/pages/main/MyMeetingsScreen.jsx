// ============================================================================
// My Meetings (Confirmed, Invites) - ADOBE XD EXACT MATCH
// File: src/pages/main/MyMeetingsScreen.jsx
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
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
  ArrowUpDown
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const TABS = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'invites', label: 'Invites' },
];

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

const unwrap = (body) => (Array.isArray(body?.data) ? body.data : []);

const formatMeetingDate = (startIso, endIso) => {
  if (!startIso) return '';
  const sd = new Date(startIso);
  const ed = endIso ? new Date(endIso) : null;
  const n = sd.getDate();
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
  const month = sd.toLocaleString('en-US', { month: 'short' });
  const year = sd.getFullYear();
  const startTime = sd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const endTime = ed ? ed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
  return `${n}${suffix} ${month}, ${year} | ${startTime}${endTime ? ` - ${endTime}` : ''}`;
};

export default function MyMeetingsScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('confirmed');
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  
  // Modals State
  const [rescheduling, setRescheduling] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [acceptTarget, setAcceptTarget] = useState(null);
  const [successModal, setSuccessModal] = useState(null); // { type: 'cancel' | 'accept' | 'reschedule', msg: string }
  
  // Reschedule Form State
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
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

  const handleAction = async (meeting, path, method = 'post', payload = undefined, successType = null, successMsg = '') => {
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
      } else {
        toast.success(successMsg);
      }
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Something went wrong processing your request'));
    } finally {
      setBusyId(null);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleTime) return toast.error("Please select a date and time");
    
    setBusyId(rescheduling.id);
    try {
      const proposedStart = new Date(`${rescheduleDate}T${rescheduleTime}`).toISOString();
      await apiClient.post(`/meetings/${rescheduling.id}/reschedule`, {
        proposed_start: proposedStart,
        note: rescheduleNotes
      });
      setRescheduling(null);
      setSuccessModal({ type: 'reschedule', msg: 'You meeting reschedule request has been sent' });
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not reschedule meeting'));
    } finally {
      setBusyId(null);
    }
  };

  const renderCard = (m) => {
    const isEnded = new Date(m.end_time) < new Date();
    const isCompleted = m.status === 'completed' || m.status === 'no_show'; 
    
    if (tab === 'invites') {
      return (
        <div key={m.id} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-[0_2px_15px_rgb(0,0,0,0.04)] mb-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span className="text-[11px] font-bold text-amber-400 uppercase">Invitation Received</span>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm">
              <CalendarPlus size={14} className="text-slate-400" /> Add
            </button>
          </div>
          <p className="text-[12px] font-medium text-slate-500 mb-4 px-0.5">{formatMeetingDate(m.start_time, m.end_time)}</p>
          <div className="flex justify-between items-center mb-4 px-0.5">
            <div className="flex items-center gap-3">
              <div className="w-[42px] h-[42px] rounded-full bg-[#0c1b78] overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-sm border border-slate-100">
                {m.other?.avatar_url ? <img src={m.other?.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : m.other?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-[15px] font-bold text-slate-900 leading-snug">{m.other?.name || 'Attendee'}</p>
                <p className="text-[12px] text-slate-500 mt-0.5">{m.other?.job_title || 'Designation'}, {m.other?.company || 'Company'}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-400" />
          </div>
          <div className="flex items-center gap-2 text-[12px] font-bold text-slate-500 mb-5 px-0.5">
            <MapPin size={15} className="text-slate-400" /> {m.location || 'In Person'}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => handleAction(m, 'reject', 'post', undefined, null, 'Meeting rejected')}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3.5 text-[13px] font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm"
            >
              <X size={16} className="text-slate-500" /> Reject
            </button>
            <button 
              onClick={() => setAcceptTarget(m)}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3.5 text-[13px] font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm"
            >
              <Check size={16} className="text-slate-800" /> Accept
            </button>
          </div>
        </div>
      );
    }

    // Confirmed Tab Render
    const statusLabel = isEnded ? 'Ended' : 'Upcoming';
    const statusColor = isEnded ? 'bg-emerald-500' : 'bg-amber-400';
    const statusTextColor = isEnded ? 'text-emerald-500' : 'text-amber-400';
    
    return (
      <div key={m.id} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-[0_2px_15px_rgb(0,0,0,0.04)] mb-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`}></span>
            <span className={`text-[11px] font-bold ${statusTextColor}`}>{statusLabel}</span>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm">
            <CalendarPlus size={14} className="text-slate-400" /> Add
          </button>
        </div>
        <p className="text-[12px] font-medium text-slate-500 mb-4 px-0.5">{formatMeetingDate(m.start_time, m.end_time)}</p>
        <div className="flex justify-between items-center mb-4 px-0.5">
          <div className="flex items-center gap-3">
            <div className="w-[42px] h-[42px] rounded-full bg-[#0c1b78] overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-sm border border-slate-100">
              {m.other?.avatar_url ? <img src={m.other?.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : m.other?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-[15px] font-bold text-slate-900 leading-snug">{m.other?.name || 'Attendee Name'}</p>
              <p className="text-[12px] text-slate-500 mt-0.5">{m.other?.job_title || 'Designation'}, {m.other?.company || 'Company'}</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-400" />
        </div>
        <div className="flex items-center gap-2 text-[12px] font-bold text-slate-500 mb-5 px-0.5">
          <MapPin size={15} className="text-slate-400" /> {m.location || 'In Person'}
        </div>

        {/* Action Buttons */}
        {isCompleted ? (
          <div className="w-full rounded-2xl bg-slate-50 border border-slate-100 py-3.5 px-5 flex justify-between items-center">
            <span className="text-[13px] font-bold text-slate-400">Status : <span className="text-slate-700">Attended</span></span>
            <FileText size={16} className="text-slate-700" />
          </div>
        ) : isEnded ? (
          <button 
            disabled={busyId === m.id}
            onClick={() => handleAction(m, 'status', 'post', { status: 'completed' }, null, 'Meeting marked as attended')}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 text-[14px] font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm"
          >
            Mark Meeting Status
          </button>
        ) : (
          <div className="flex gap-3">
            <button 
              disabled={busyId === m.id}
              onClick={() => setCancelTarget(m)}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3.5 text-[13px] font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm"
            >
              <X size={16} className="text-slate-500" /> Cancel
            </button>
            <button 
              disabled={busyId === m.id}
              onClick={() => setRescheduling(m)}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3.5 text-[13px] font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm"
            >
              <RotateCcw size={14} className="text-slate-500" /> Reschedule
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] max-w-[430px] mx-auto font-sans relative">
      
      {/* Header - EXACT XD MATCH */}
      <div className="bg-white text-slate-900 px-5 pt-5 pb-3 flex items-center gap-3 sticky top-0 z-20">
        <button type="button" onClick={() => navigate('/hub')} aria-label="Back" className="text-slate-800 hover:text-black transition-colors">
          <ChevronLeft size={26} strokeWidth={2.5} />
        </button>
        <h1 className="text-[20px] font-bold tracking-tight">My Meetings</h1>
      </div>

      {/* Tabs - EXACT XD MATCH */}
      <div className="bg-white flex px-6 pt-1 pb-0 border-b border-slate-100 shadow-sm">
        {TABS.map((t) => {
          const isActive = tab === t.key;
          return (
            <button 
              key={t.key} 
              type="button" 
              onClick={() => setTab(t.key)} 
              className={`flex-1 text-center pb-3 pt-3 text-[15px] font-bold transition-all relative ${
                isActive ? 'text-[#0000c8]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t.label}
              {isActive && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0000c8]" />}
            </button>
          );
        })}
      </div>

      {/* Total Count & Filter */}
      <div className="flex justify-between items-center px-5 py-5">
        <h3 className="text-[16px] font-bold text-slate-500">
          Total Count ({meetings.length})
        </h3>
        <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-full bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50 shadow-sm">
          <ArrowUpDown size={14} className="text-slate-500" /> All Meetings
        </button>
      </div>

      {/* List */}
      <div className="px-5 pb-24">
        {loading ? (
          <div className="py-16 flex justify-center"><LoadingSpinner /></div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <CalendarIcon size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-[14px] font-medium text-slate-500">No meetings found.</p>
          </div>
        ) : (
          meetings.map((m) => renderCard(m))
        )}
      </div>

      {/* CANCEL CONFIRMATION MODAL */}
      {cancelTarget && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-[320px] rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-5">
              <X size={28} className="text-slate-400" />
            </div>
            <h2 className="text-[19px] font-bold text-slate-900 mb-2">Cancel Meeting</h2>
            <p className="text-[14px] font-medium text-slate-500 mb-8 leading-relaxed px-2">
              Are you sure you want to cancel this meeting?
            </p>
            <div className="flex w-full gap-3">
              <button onClick={() => setCancelTarget(null)} className="flex-1 rounded-2xl border border-slate-200 bg-white py-3.5 text-[14px] font-bold text-slate-700 shadow-sm hover:bg-slate-50">Go Back</button>
              <button onClick={() => { handleAction(cancelTarget, 'cancel', 'post', undefined, 'cancel', 'Meeting cancelled successfully'); setCancelTarget(null); }} className="flex-1 rounded-2xl bg-[#0000c8] text-white py-3.5 text-[14px] font-bold shadow-md hover:bg-blue-800">Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ACCEPT CONFIRMATION MODAL */}
      {acceptTarget && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-[320px] rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-5">
              <Check size={32} className="text-slate-400" strokeWidth={3} />
            </div>
            <h2 className="text-[19px] font-bold text-slate-900 mb-2">Accept Request</h2>
            <p className="text-[14px] font-medium text-slate-500 mb-8 leading-relaxed px-2">
              Are you sure you want to accept this request?
            </p>
            <div className="flex w-full gap-3">
              <button onClick={() => setAcceptTarget(null)} className="flex-1 rounded-2xl border border-slate-200 bg-white py-3.5 text-[14px] font-bold text-slate-700 shadow-sm hover:bg-slate-50">Go Back</button>
              <button onClick={() => { handleAction(acceptTarget, 'accept', 'post', undefined, 'accept', 'Meeting Accepted successfully'); setAcceptTarget(null); }} className="flex-1 rounded-2xl bg-[#0000c8] text-white py-3.5 text-[14px] font-bold shadow-md hover:bg-blue-800">Yes, Accept</button>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE SCREEN MODAL (Bottom Sheet) */}
      {rescheduling && (
        <div className="fixed inset-0 z-[50] bg-white flex flex-col overflow-y-auto animate-in slide-in-from-bottom-full duration-300">
          <div className="px-5 pt-5 pb-4 flex items-center gap-3 border-b border-slate-100 sticky top-0 bg-white z-10 shadow-sm">
            <button type="button" onClick={() => setRescheduling(null)} className="text-slate-800 hover:text-black">
              <ChevronLeft size={26} strokeWidth={2.5} />
            </button>
            <h1 className="text-[20px] font-bold tracking-tight">Reschedule Meeting</h1>
          </div>
          
          <div className="p-5 flex-1 bg-white">
            <div className="flex items-center justify-between bg-white border border-slate-100 p-4 rounded-2xl mb-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0c1b78] text-white flex items-center justify-center overflow-hidden flex-shrink-0 font-bold text-sm">
                  {rescheduling.other?.avatar_url ? <img src={rescheduling.other.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : rescheduling.other?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-[14px] font-bold text-slate-900">{rescheduling.other?.name || 'Attendee'}</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">{rescheduling.other?.company || 'Company'}</p>
                </div>
              </div>
              <div className="h-10 w-px bg-slate-200 mx-2"></div>
              <div className="flex items-center gap-2 text-[13px] font-bold text-slate-600">
                <CalendarIcon size={16} className="text-slate-400" /> 30 Mins Meeting
              </div>
            </div>

            <form onSubmit={handleRescheduleSubmit}>
              <div className="mb-8">
                <label className="block text-[15px] font-bold text-slate-900 mb-4">When you want to meet?</label>
                <input 
                  type="date" 
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-[14px] font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0000c8]/20 focus:border-[#0000c8]"
                />
              </div>

              <div className="mb-8">
                <label className="block text-[15px] font-bold text-slate-900 mb-4">Select time of the day</label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="border border-slate-100 rounded-xl py-3.5 text-center text-[12px] font-medium text-slate-300 bg-slate-50">Not available</div>
                  <div className={`border-2 rounded-xl py-3.5 text-center text-[13px] font-bold shadow-sm cursor-pointer transition ${rescheduleTime === "11:30" ? 'border-[#0000c8] text-[#0000c8] bg-white' : 'border-slate-200 text-slate-700 bg-white hover:border-slate-300'}`} onClick={() => setRescheduleTime("11:30")}>11:30 AM</div>
                  <div className="border border-slate-100 rounded-xl py-3.5 text-center text-[12px] font-medium text-slate-300 bg-slate-50">Not available</div>
                  
                  <div className={`border-2 rounded-xl py-3.5 text-center text-[13px] font-bold shadow-sm cursor-pointer transition ${rescheduleTime === "12:00" ? 'border-[#0000c8] text-[#0000c8] bg-white' : 'border-slate-200 text-slate-700 bg-white hover:border-slate-300'}`} onClick={() => setRescheduleTime("12:00")}>12:00 PM</div>
                  <div className="border border-slate-100 rounded-xl py-3.5 text-center text-[12px] font-medium text-slate-300 bg-slate-50">Not available</div>
                  <div className={`border-2 rounded-xl py-3.5 text-center text-[13px] font-bold shadow-sm cursor-pointer transition ${rescheduleTime === "14:30" ? 'border-[#0000c8] text-[#0000c8] bg-white' : 'border-slate-200 text-slate-700 bg-white hover:border-slate-300'}`} onClick={() => setRescheduleTime("14:30")}>02:30 PM</div>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-[15px] font-bold text-slate-900 mb-4">Add Notes</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-[11px] font-bold text-slate-300">Notes</span>
                  <textarea
                    value={rescheduleNotes}
                    onChange={(e) => setRescheduleNotes(e.target.value)}
                    placeholder="Type here"
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 pt-8 pb-3 text-[14px] font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0000c8]/20 focus:border-[#0000c8] resize-none transition"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={busyId === rescheduling.id}
                className="w-full rounded-2xl bg-[#0000c8] text-white py-4 text-[15px] font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-800 transition disabled:opacity-70 mt-4"
              >
                {busyId === rescheduling.id ? 'Confirming...' : 'Confirm Meeting'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* GLOBAL SUCCESS POPUP (Handles Reschedule, Cancel, Accept) */}
      {successModal && (
        <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-[320px] rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-[#1eb15a] rounded-full flex items-center justify-center mb-5 shadow-lg shadow-green-500/30">
              <Check size={32} className="text-white" strokeWidth={4} />
            </div>
            <h2 className="text-[20px] font-bold text-slate-900 mb-2">Success!</h2>
            <p className="text-[14px] font-medium text-slate-500 mb-8 leading-relaxed px-2">
              {successModal.msg}
            </p>
            <button 
              onClick={() => setSuccessModal(null)} 
              className="w-full rounded-2xl bg-[#0000c8] text-white py-3.5 text-[15px] font-bold shadow-md hover:bg-blue-800 transition"
            >
              {successModal.type === 'reschedule' ? 'My Meetings' : 'Okay'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}