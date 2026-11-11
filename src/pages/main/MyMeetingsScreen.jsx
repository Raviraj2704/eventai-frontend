// ============================================================================
// My Meetings (Confirmed, Invites, Sent) - ADOBE XD EXACT MATCH
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
  SlidersHorizontal, 
  ChevronRight, 
  FileText,
  Calendar as CalendarIcon,
  Check
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const TABS = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'invites', label: 'Invites' },
  { key: 'sent', label: 'Sent' },
];

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

const unwrap = (body) => (Array.isArray(body?.data) ? body.data : []);

// Date Formatter matching: "19th Oct, 2024 | 10:00 AM - 05:00 PM"
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
  
  // Reschedule & Success Modals
  const [rescheduling, setRescheduling] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
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

  const confirmCancel = (meeting) => {
    if (!window.confirm('Cancel this meeting?')) return;
    act(meeting, 'cancel', 'Meeting cancelled');
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleTime) {
      toast.error("Please select a date and time");
      return;
    }
    
    setBusyId(rescheduling.id);
    try {
      // Create a full ISO string from the selected date and time
      const proposedStart = new Date(`${rescheduleDate}T${rescheduleTime}`).toISOString();
      await apiClient.post(`/meetings/${rescheduling.id}/reschedule`, {
        proposed_start: proposedStart,
        note: rescheduleNotes
      });
      setRescheduling(null);
      setShowSuccess(true);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not reschedule'));
    } finally {
      setBusyId(null);
    }
  };

  const closeSuccess = () => {
    setShowSuccess(false);
  };

  const renderCard = (m) => {
    const isEnded = new Date(m.end_time) < new Date() || m.status === 'completed' || m.status === 'no_show';
    const isCompleted = m.status === 'completed';
    
    // Status visual mapping based on XD design
    const statusLabel = isEnded ? 'Ended' : 'Upcoming';
    const statusColor = isEnded ? 'bg-emerald-500' : 'bg-amber-500';
    
    return (
      <div key={m.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-[0_2px_10px_rgb(0,0,0,0.04)] mb-4">
        
        {/* Top Row: Status & Add Button */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`}></span>
            <span className={`text-[11px] font-bold ${isEnded ? 'text-emerald-600' : 'text-amber-500'}`}>
              {statusLabel}
            </span>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-xl text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition">
            <CalendarPlus size={14} className="text-slate-500" /> Add
          </button>
        </div>

        {/* Date & Time */}
        <p className="text-[12px] font-medium text-slate-500 mb-4">
          {formatMeetingDate(m.start_time, m.end_time)}
        </p>

        {/* User Info */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="w-[42px] h-[42px] rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
              {m.other?.avatar_url ? (
                <img src={m.other.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#0c1b78] text-white flex items-center justify-center font-bold text-sm">
                  {m.other?.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div>
              <p className="text-[15px] font-bold text-slate-900 leading-snug">{m.other?.name || 'Attendee Name'}</p>
              <p className="text-[12px] text-slate-500">{m.other?.job_title || 'Designation'}, {m.other?.company || 'Company'}</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-400" />
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-600 mb-5">
          <MapPin size={14} className="text-slate-400" /> 
          {m.location || 'In Person'}
        </div>

        {/* Action Buttons */}
        {isCompleted ? (
          <div className="w-full rounded-2xl bg-slate-50 border border-slate-100 py-3.5 px-4 flex justify-between items-center">
            <span className="text-[13px] font-bold text-slate-500">Status : <span className="text-slate-700">Attended</span></span>
            <FileText size={16} className="text-slate-400" />
          </div>
        ) : isEnded ? (
          <button 
            disabled={busyId === m.id}
            onClick={() => act(m, 'status', { status: 'completed', message: 'Marked as completed' })}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 text-[14px] font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            Mark Meeting Status
          </button>
        ) : (
          <div className="flex gap-3">
            <button 
              disabled={busyId === m.id}
              onClick={() => confirmCancel(m)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white py-3.5 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <X size={16} /> Cancel
            </button>
            <button 
              disabled={busyId === m.id}
              onClick={() => setRescheduling(m)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white py-3.5 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <RotateCcw size={14} /> Reschedule
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto font-sans">
      
      {/* Header - EXACT XD MATCH */}
      <div className="bg-white text-slate-900 px-5 pt-5 pb-3 flex items-center gap-3 sticky top-0 z-20">
        <button type="button" onClick={() => navigate('/networking')} aria-label="Back" className="text-slate-800 hover:text-black transition-colors">
          <ChevronLeft size={26} strokeWidth={2.5} />
        </button>
        <h1 className="text-[20px] font-bold tracking-tight">My Meetings</h1>
      </div>

      {/* Tabs - EXACT XD MATCH */}
      <div className="flex px-6 pt-5 pb-0 border-b border-slate-100 gap-8">
        {TABS.map((t) => {
          const isActive = tab === t.key;
          return (
            <button 
              key={t.key} 
              type="button" 
              onClick={() => setTab(t.key)} 
              className={`pb-3 text-[15px] font-bold transition-all relative ${
                isActive ? 'text-[#0000c8]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t.label}
              {isActive && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0000c8] rounded-t-full" />}
            </button>
          );
        })}
      </div>

      {/* Total Count & Filter */}
      <div className="flex justify-between items-center px-5 py-5">
        <h3 className="text-[15px] font-bold text-slate-900">
          Total Count ({meetings.length})
        </h3>
        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-full text-[12px] font-bold text-slate-700 hover:bg-slate-50 shadow-sm">
          <SlidersHorizontal size={14} className="text-slate-500" /> All Meetings
        </button>
      </div>

      {/* List */}
      <div className="px-5 pb-24">
        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : meetings.length === 0 ? (
          <p className="text-center text-sm text-slate-500 py-12">Nothing here yet.</p>
        ) : (
          meetings.map((m) => renderCard(m))
        )}
      </div>

      {/* RESCHEDULE SCREEN MODAL (Matching XD Design 1000319298.jpg) */}
      {rescheduling && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto animate-in slide-in-from-bottom-full duration-300">
          <div className="px-5 pt-5 pb-3 flex items-center gap-3 border-b border-slate-50 sticky top-0 bg-white z-10">
            <button type="button" onClick={() => setRescheduling(null)} className="text-slate-800 hover:text-black">
              <ChevronLeft size={26} strokeWidth={2.5} />
            </button>
            <h1 className="text-[20px] font-bold tracking-tight">Reschedule Meeting</h1>
          </div>
          
          <div className="p-5 flex-1">
            {/* Top User Info Bar */}
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl mb-8 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                  <img src={rescheduling.other?.avatar_url || "https://ui-avatars.com/api/?name=User"} alt="avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-slate-900">{rescheduling.other?.name || 'Attendee'}</p>
                  <p className="text-[12px] text-slate-500">{rescheduling.other?.company || 'Company'}</p>
                </div>
              </div>
              <div className="h-10 w-px bg-slate-200 mx-2"></div>
              <div className="flex items-center gap-2 text-[13px] font-bold text-slate-600">
                <CalendarIcon size={16} className="text-slate-400" />
                30 Mins Meeting
              </div>
            </div>

            <form onSubmit={handleRescheduleSubmit}>
              {/* Date Selection */}
              <div className="mb-8">
                <label className="block text-[15px] font-bold text-slate-900 mb-3">When you want to meet?</label>
                <input 
                  type="date" 
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-[14px] font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0000c8]/20 focus:border-[#0000c8]"
                />
              </div>

              {/* Time Grid */}
              <div className="mb-8">
                <label className="block text-[15px] font-bold text-slate-900 mb-3">Select time of the day</label>
                <div className="grid grid-cols-3 gap-3">
                  {/* Mock Time Grid to match design */}
                  <div className="border border-slate-200 rounded-xl py-3 text-center text-[12px] font-medium text-slate-400 bg-slate-50">Not available</div>
                  <div className="border-2 border-[#0000c8] rounded-xl py-3 text-center text-[13px] font-bold text-[#0000c8] bg-white shadow-sm cursor-pointer" onClick={() => setRescheduleTime("11:30")}>11:30 AM</div>
                  <div className="border border-slate-200 rounded-xl py-3 text-center text-[12px] font-medium text-slate-400 bg-slate-50">Not available</div>
                  <div className="border border-slate-300 rounded-xl py-3 text-center text-[13px] font-bold text-slate-700 bg-white cursor-pointer hover:border-slate-400" onClick={() => setRescheduleTime("12:00")}>12:00 PM</div>
                  <div className="border border-slate-200 rounded-xl py-3 text-center text-[12px] font-medium text-slate-400 bg-slate-50">Not available</div>
                  <div className="border border-slate-300 rounded-xl py-3 text-center text-[13px] font-bold text-slate-700 bg-white cursor-pointer hover:border-slate-400" onClick={() => setRescheduleTime("14:30")}>02:30 PM</div>
                </div>
              </div>

              {/* Add Notes */}
              <div className="mb-8">
                <label className="block text-[15px] font-bold text-slate-900 mb-3">Add Notes</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-[11px] font-bold text-slate-400">Notes</span>
                  <textarea
                    value={rescheduleNotes}
                    onChange={(e) => setRescheduleNotes(e.target.value)}
                    placeholder="Type here"
                    rows={4}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 pt-8 pb-3 text-[14px] text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0000c8]/20 focus:border-[#0000c8] resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={busyId === rescheduling.id}
                className="w-full rounded-2xl bg-[#0000c8] text-white py-4 text-[15px] font-bold shadow-md hover:bg-blue-800 transition disabled:opacity-70"
              >
                {busyId === rescheduling.id ? 'Confirming...' : 'Confirm Meeting'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUCCESS POPUP MODAL (Matching XD Design 1000319303.jpg) */}
      {showSuccess && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-[320px] rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-[#1eb15a] rounded-full flex items-center justify-center mb-5 shadow-lg shadow-green-500/30">
              <Check size={32} className="text-white" strokeWidth={3} />
            </div>
            <h2 className="text-[20px] font-bold text-slate-900 mb-2">Success!</h2>
            <p className="text-[14px] text-slate-500 mb-8 leading-relaxed px-2">
              Your meeting reschedule request has been sent successfully.
            </p>
            <button 
              onClick={closeSuccess} 
              className="w-full rounded-2xl bg-[#0000c8] text-white py-3.5 text-[15px] font-bold shadow-md hover:bg-blue-800 transition"
            >
              My Meetings
            </button>
          </div>
        </div>
      )}

    </div>
  );
}