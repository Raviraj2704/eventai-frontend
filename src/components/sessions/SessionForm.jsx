// ============================================================================
// Session form: create (organizer), propose (speaker), edit (organizer)
// File: src/components/sessions/SessionForm.jsx
// Real API only:
//   POST /session-admin/sessions           create
//   POST /session-admin/proposals          propose
//   PUT  /session-admin/sessions/{id}      edit
//   POST /session-admin/sessions/{id}/image   photo
//   GET  /session-hub/tracks               track suggestions
//   GET  /speakers                         speaker choices (organizer)
// ============================================================================

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { X, ImagePlus } from 'lucide-react';
import apiClient from '../../config/apiClient';

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

const unwrapList = (body) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  return [];
};

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

const EMPTY = {
  title: '',
  description: '',
  start: '',
  end: '',
  location: '',
  track: '',
  tags: '',
  speakerId: '',
  publish: false,
  photo: null,
};

const fromInitial = (initial) => ({
  ...EMPTY,
  title: initial.title || '',
  description: initial.description || '',
  start: (initial.start_time || '').slice(0, 16),
  end: (initial.end_time || '').slice(0, 16),
  location: initial.location || '',
  track: initial.track || '',
  tags: (initial.tags || []).join(', '),
  speakerId: initial.speaker_id ? String(initial.speaker_id) : '',
});

const TITLES = {
  create: 'Create session',
  propose: 'Propose a session',
  edit: 'Edit session',
};

export default function SessionForm({ mode, isAdmin, sessionId, initial, onClose, onSaved }) {
  const [form, setForm] = useState(() => (initial ? fromInitial(initial) : EMPTY));
  const [speakers, setSpeakers] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [tracksRes, speakersRes] = await Promise.all([
          apiClient.get('/session-hub/tracks'),
          isAdmin ? apiClient.get('/speakers', { params: { limit: 50 } }) : Promise.resolve(null),
        ]);
        if (cancelled) return;

        setTracks(unwrapList(tracksRes?.data));

        if (speakersRes) {
          const options = unwrapList(speakersRes?.data)
            .filter((s) => s.user_id)
            .map((s) => ({
              value: String(s.user_id),
              label: s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Speaker',
            }));
          setSpeakers(options);
        }
      } catch (error) {
        console.error('Could not load form choices:', error);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const title = form.title.trim();
    if (title.length < 3) {
      toast.error('Enter a title with at least 3 letters');
      return;
    }
    if (!form.start || !form.end) {
      toast.error('Choose the start and end time');
      return;
    }
    if (new Date(form.end) <= new Date(form.start)) {
      toast.error('End time must be after start time');
      return;
    }

    const payload = {
      title,
      description: form.description.trim(),
      start_time: form.start,
      end_time: form.end,
      location: form.location.trim() || null,
      track: form.track.trim() || null,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      speaker_id: isAdmin && form.speakerId ? Number(form.speakerId) : null,
    };

    setSaving(true);
    try {
      let id = sessionId;

      if (mode === 'create') {
        const res = await apiClient.post('/session-admin/sessions', {
          ...payload,
          publish: form.publish,
        });
        id = res?.data?.data?.id;
      } else if (mode === 'propose') {
        const res = await apiClient.post('/session-admin/proposals', payload);
        id = res?.data?.data?.id;
      } else {
        await apiClient.put(`/session-admin/sessions/${sessionId}`, payload);
      }

      if (form.photo && id) {
        try {
          const fd = new FormData();
          fd.append('file', form.photo);
          await postForm(`/session-admin/sessions/${id}/image`, fd);
        } catch (photoError) {
          toast.error('Saved, but the photo could not be uploaded');
        }
      }

      if (mode === 'propose') {
        toast.success('Your proposal was sent to the organizers');
      } else if (mode === 'create') {
        toast.success(form.publish ? 'Session published' : 'Draft saved');
      } else {
        toast.success('Session saved');
      }

      onSaved?.(id);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-[430px] max-h-[90vh] rounded-t-2xl flex flex-col mb-16"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <p className="font-semibold text-slate-900">{TITLES[mode] || 'Session'}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-800">Title</label>
            <input type="text" value={form.title} onChange={setField('title')} className={`${inputClass} mt-1`} />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800">Description</label>
            <textarea
              value={form.description}
              onChange={setField('description')}
              rows={4}
              className={`${inputClass} mt-1`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-slate-800">Starts</label>
              <input type="datetime-local" value={form.start} onChange={setField('start')} className={`${inputClass} mt-1`} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-800">Ends</label>
              <input type="datetime-local" value={form.end} onChange={setField('end')} className={`${inputClass} mt-1`} />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={setField('location')}
              placeholder="Hall A, or a virtual link"
              className={`${inputClass} mt-1`}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800">Track</label>
            <input
              type="text"
              list="session-track-options"
              value={form.track}
              onChange={setField('track')}
              placeholder="Pick one or type a new track"
              className={`${inputClass} mt-1`}
            />
            <datalist id="session-track-options">
              {tracks.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800">Tags</label>
            <input
              type="text"
              value={form.tags}
              onChange={setField('tags')}
              placeholder="AI, Hands-on, Beginner"
              className={`${inputClass} mt-1`}
            />
            <p className="text-xs text-slate-500 mt-1">Separate tags with commas.</p>
          </div>

          {isAdmin && (
            <div>
              <label className="text-sm font-semibold text-slate-800">Speaker</label>
              <select value={form.speakerId} onChange={setField('speakerId')} className={`${inputClass} mt-1`}>
                <option value="">No speaker</option>
                {speakers.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <ImagePlus size={16} /> Photo (camera or gallery)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm((f) => ({ ...f, photo: e.target.files?.[0] || null }))}
              className="mt-1 block w-full text-sm text-slate-700"
            />
            <p className="text-xs text-slate-500 mt-1">JPG, PNG, or WEBP, up to 5 MB.</p>
          </div>

          {isAdmin && mode === 'create' && (
            <label className="flex items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={form.publish}
                onChange={(e) => setForm((f) => ({ ...f, publish: e.target.checked }))}
              />
              Publish now (attendees can see it straight away)
            </label>
          )}

          {!isAdmin && mode === 'propose' && (
            <p className="text-xs text-slate-500">
              Organizers review your proposal. It appears in Sessions once approved.
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-[#0000c8] text-white py-3 font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : mode === 'propose' ? 'Send proposal' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
}