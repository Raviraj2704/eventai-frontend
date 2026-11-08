// ============================================================================
// Reschedule sheet: propose a new time for a confirmed meeting
// File: src/components/networking/TimeProposalSheet.jsx
// Real API only:
//   POST /meetings/{id}/reschedule
// ============================================================================

import { useState } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import apiClient from '../../config/apiClient';

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

const inputClass =
  'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function TimeProposalSheet({ meeting, onClose, onSaved }) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!start || !end || new Date(end) <= new Date(start)) {
      toast.error('End time must be after start time');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post(`/meetings/${meeting.id}/reschedule`, {
        start_time: new Date(start).toISOString(),
        end_time: new Date(end).toISOString(),
      });
      toast.success('New time sent for approval');
      onSaved?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not send the new time'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-[430px] rounded-t-2xl flex flex-col mb-16"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <p className="font-semibold text-slate-900">Reschedule</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-500">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-slate-800">New start</label>
              <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className={`${inputClass} mt-1`} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-800">New end</label>
              <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className={`${inputClass} mt-1`} />
            </div>
          </div>
          <button type="submit" disabled={saving} className="w-full rounded-lg bg-[#0000c8] text-white py-3 font-semibold disabled:opacity-50">
            {saving ? 'Sending...' : 'Propose new time'}
          </button>
        </form>
      </div>
    </div>
  );
}