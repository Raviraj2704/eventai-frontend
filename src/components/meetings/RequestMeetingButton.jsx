// ============================================================================
// RequestMeetingButton
// File: src/components/meetings/RequestMeetingButton.jsx
// Usage: <RequestMeetingButton personId={id} personName={name} />
// Backend: POST /api/v1/meetings/requests/{user_id}
// ============================================================================

import { useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarPlus, X } from 'lucide-react';
import apiClient from '../../config/apiClient';

const DURATIONS = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '60 minutes' },
];

const errorText = (e, fallback) => {
  const d = e?.response?.data?.detail;
  if (Array.isArray(d)) return d.map((x) => x.msg).join(', ');
  return d || e?.message || fallback;
};

const todayLocal = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function RequestMeetingButton({ personId, personName, onCreated }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [location, setLocation] = useState('In Person');
  const [note, setNote] = useState('');

  const reset = () => {
    setTitle('');
    setDate('');
    setTime('');
    setDuration(30);
    setLocation('In Person');
    setNote('');
  };

  const close = () => {
    if (!saving) setOpen(false);
  };

  const submit = async (e) => {
    e.preventDefault();

    if (title.trim().length < 3) {
      toast.error('Title must be at least 3 characters');
      return;
    }
    if (!date || !time) {
      toast.error('Choose a date and time');
      return;
    }

    const start = new Date(`${date}T${time}:00`);
    if (Number.isNaN(start.getTime()) || start <= new Date()) {
      toast.error('Choose a time in the future');
      return;
    }
    const end = new Date(start.getTime() + duration * 60 * 1000);

    setSaving(true);
    try {
      const res = await apiClient.post(`/meetings/requests/${personId}`, {
        title: title.trim(),
        note: note.trim() || null,
        location: location.trim() || null,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      });
      toast.success('Meeting request sent');
      reset();
      setOpen(false);
      if (onCreated) onCreated(res?.data?.data);
    } catch (err) {
      toast.error(errorText(err, 'Could not send the meeting request'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#0000c8] text-white py-3.5 text-[14px] font-bold shadow-md hover:bg-blue-800 transition"
      >
        <CalendarPlus size={16} /> Request meeting
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-end justify-center">
          <form
            onSubmit={submit}
            className="w-full max-w-[430px] bg-white rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[17px] font-bold text-slate-900">Request meeting</p>
                <p className="text-[12px] text-slate-500">with {personName || 'this attendee'}</p>
              </div>
              <button type="button" onClick={close} aria-label="Close" className="text-slate-500">
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-slate-900 mb-2">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="e.g. Discuss EventAI partnership"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0000c8]/20 focus:border-[#0000c8]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-bold text-slate-900 mb-2">Date</label>
                <input
                  type="date"
                  min={todayLocal()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0000c8]/20 focus:border-[#0000c8]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-900 mb-2">Start time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0000c8]/20 focus:border-[#0000c8]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-slate-900 mb-2">Duration</label>
              <div className="grid grid-cols-2 gap-3">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDuration(d.value)}
                    className={`rounded-xl border-2 py-3 text-[13px] font-bold transition ${
                      duration === d.value
                        ? 'border-[#0000c8] text-[#0000c8]'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-slate-900 mb-2">Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={255}
                placeholder="In Person, or e.g. Table 4"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0000c8]/20 focus:border-[#0000c8]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-slate-900 mb-2">Note (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Type here"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-[#0000c8]/20 focus:border-[#0000c8]"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-[#0000c8] text-white py-4 text-[15px] font-bold shadow-lg hover:bg-blue-800 transition disabled:opacity-70"
            >
              {saving ? 'Sending...' : 'Send request'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}