// ============================================================================
// Schedule 1-2-1 sheet (request a meeting, or edit a pending one)
// File: src/components/networking/ScheduleMeetingSheet.jsx
// Real API only:
//   POST /meetings/requests/{user_id}   create request
//   PUT  /meetings/{id}                 edit pending request
// ============================================================================

import { useState } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import apiClient from '../../config/apiClient';

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

const inputClass =
  'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500';

// Converts a datetime-local value to ISO without timezone shifts
const toIso = (local) => (local ? new Date(local).toISOString() : null);

export default function ScheduleMeetingSheet({ userId, meeting, onClose, onSaved }) {
  const editing = Boolean(meeting);
  const [title, setTitle] = useState(meeting?.title || '');
  const [note, setNote] = useState(meeting?.note || '');
  const [location, setLocation] = useState(meeting?.location || '');
  const [start, setStart] = useState(meeting?.start_time ? meeting.start_time.slice(0, 16) : '');
  const [end, setEnd] = useState(meeting?.end_time ? meeting.end_time.slice(0, 16) : '');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (title.trim().length < 3) {
      toast.error('Enter a meeting title');
      return;
    }
    if (!start || !end || new Date(end) <= new Date(start)) {
      toast.error('End time must be after start time');
      return;
    }

    const body = {
      title: title.trim(),
      note: note.trim() || null,
      location: location.trim() || null,
      start_time: toIso(start),
      end_time: toIso(end),
    };

    setSaving(true);
    try {
      if (editing) {
        await apiClient.put(`/meetings/${meeting.id}`, body);
        toast.success('Meeting updated');
      } else {
        await apiClient.post(`/meetings/requests/${userId}`, body);
        toast.success('Meeting request sent');
      }
      onSaved?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save the meeting'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-[430px] max-h-[90vh] rounded-t-2xl flex flex-col mb-16"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <p className="font-semibold text-slate-900">{editing ? 'Edit 1-2-1' : 'Schedule 1-2-1'}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-800">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={`${inputClass} mt-1`} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-slate-800">Starts</label>
              <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className={`${inputClass} mt-1`} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-800">Ends</label>
              <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className={`${inputClass} mt-1`} />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800">Location (optional)</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Booth, lounge, or video link" className={`${inputClass} mt-1`} />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800">Note (optional)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={`${inputClass} mt-1`} />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-[#0000c8] text-white py-3 font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : editing ? 'Save changes' : 'Send request'}
          </button>
        </form>
      </div>
    </div>
  );
}