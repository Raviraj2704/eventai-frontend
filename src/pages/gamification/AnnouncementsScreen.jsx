// ============================================================================
// Announcements (same layout as Notifications)
// General = announcements from /announcements
// Personal = empty until a notifications API is connected
// Admins see a "+" button to post.
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, X } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const errMsg = (e, fallback) => e?.response?.data?.detail || e?.message || fallback;

const listFrom = (body) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.data)) return body.data.data;
  if (Array.isArray(body?.announcements)) return body.announcements;
  return [];
};

// True if any common shape of a user object says "admin"
const isAdminObject = (obj) => {
  if (!obj || typeof obj !== 'object') return false;
  const candidates = [obj, obj.user, obj.data, obj.data?.user];
  return candidates.some(
    (c) => c && (c.is_admin === true || c.is_admin === 'true' || c.is_admin === 1 || c.role === 'admin')
  );
};

const readSavedUser = () => {
  try {
    const keys = ['user', 'currentUser', 'eventai_user'];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (raw) return JSON.parse(raw);
    }
  } catch {
    /* ignore bad JSON */
  }
  return null;
};

const normalize = (a) => ({
  id: a.id,
  title: a.title || 'Announcement',
  message: a.message ?? a.content ?? '',
  created_at: a.created_at ?? null,
  link: a.action_url ?? null,
});

const ordinal = (n) => {
  if (n % 100 >= 11 && n % 100 <= 13) return 'th';
  return ['th', 'st', 'nd', 'rd'][n % 10] || 'th';
};

const dayLabel = (iso) => {
  const d = new Date(iso);
  if (!iso || isNaN(d)) return 'Unknown date';
  const day = d.getDate();
  return `${day}${ordinal(day)} ${d.toLocaleString('en-US', { month: 'long' })}`;
};

const timeLabel = (iso) => {
  const d = new Date(iso);
  if (!iso || isNaN(d)) return '';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export default function AnnouncementsScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('general');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', link: '' });

  const load = async () => {
    try {
      const res = await apiClient.get('/announcements');
      const list = listFrom(res?.data).map(normalize);
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setItems(list);
    } catch (e) {
      toast.error(errMsg(e, 'Could not load announcements'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    const checkAdmin = async () => {
      if (isAdminObject(readSavedUser())) {
        setIsAdmin(true);
        return;
      }
      const [meRes, profileRes] = await Promise.allSettled([
        apiClient.get('/auth/me'),
        apiClient.get('/users/me'),
      ]);
      const found = [meRes, profileRes].some(
        (r) => r.status === 'fulfilled' && isAdminObject(r.value?.data)
      );
      setIsAdmin(found);
    };
    checkAdmin();
  }, []);

  const groups = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const key = dayLabel(item.created_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return [...map.entries()];
  }, [items]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/announcements', {
        title: form.title.trim(),
        content: form.message.trim(),
        action_url: form.link.trim() || null,
      });
      toast.success('Announcement posted');
      setForm({ title: '', message: '', link: '' });
      setShowCreate(false);
      await load();
    } catch (e) {
      toast.error(errMsg(e, 'Could not post announcement'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} aria-label="Back" className="text-slate-800">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-semibold text-slate-900">Announcements</h1>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            aria-label="New announcement"
            className="p-2 rounded-full bg-[#0000c8] text-white"
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 px-4">
        <button
          type="button"
          onClick={() => setTab('general')}
          className={`flex-1 py-3 text-sm font-medium ${
            tab === 'general' ? 'text-[#0000c8] border-b-2 border-[#0000c8]' : 'text-slate-500'
          }`}
        >
          General
        </button>
        <button
          type="button"
          onClick={() => setTab('personal')}
          className={`flex-1 py-3 text-sm font-medium ${
            tab === 'personal' ? 'text-[#0000c8] border-b-2 border-[#0000c8]' : 'text-slate-500'
          }`}
        >
          Personal
        </button>
      </div>

      {/* List */}
      <div className="px-4 pt-2">
        {tab === 'general' ? (
          loading ? (
            <div className="py-16">
              <LoadingSpinner />
            </div>
          ) : groups.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-16">No announcements yet.</p>
          ) : (
            groups.map(([day, list]) => (
              <div key={day}>
                <p className="text-sm text-slate-500 pt-4 pb-2">{day}</p>
                {list.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 p-4 mb-3 bg-white">
                    <p className="text-xs text-slate-400">{timeLabel(item.created_at)}</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{item.title}</p>
                    {item.message && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>}
                    {item.link && (
                      <button
                        type="button"
                        onClick={() => window.open(item.link, '_blank', 'noopener')}
                        className="text-xs font-semibold text-[#0000c8] mt-3"
                      >
                        Know More
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))
          )
        ) : (
          <p className="text-center text-sm text-slate-500 py-16">No personal notifications yet.</p>
        )}
      </div>

      {/* Create sheet (admins only) */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">
          <form onSubmit={submit} className="w-full max-w-[430px] bg-white rounded-t-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-slate-900">New Announcement</p>
              <button type="button" onClick={() => setShowCreate(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Title"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            />
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Message"
              rows={4}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            />
            <input
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="Link (optional)"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-[#0000c8] text-white py-3 text-sm font-semibold disabled:opacity-60"
            >
              {saving ? 'Posting...' : 'Post Announcement'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}