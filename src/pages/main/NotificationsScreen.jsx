// ============================================================================
// NotificationsScreen.jsx
// File: frontend/src/pages/main/NotificationsScreen.jsx
// Route: /notifications
// General  = published announcements (/announcements)
// Personal = this user's notifications (/notifications)
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const listFrom = (body) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.data)) return body.data.data;
  return [];
};

const errMsg = (e, fallback) => e?.response?.data?.detail || e?.message || fallback;

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

const normalizeAnnouncement = (a) => ({
  id: `a-${a.id}`,
  title: a.title || 'Announcement',
  message: a.message ?? a.content ?? '',
  created_at: a.created_at ?? null,
  link: a.action_url ?? null,
  isRead: true,
  backendId: null,
});

const normalizeNotification = (n) => ({
  id: `n-${n.id}`,
  title: n.title || 'Notification',
  message: n.message ?? '',
  created_at: n.created_at ?? null,
  link: n.action_url ?? null,
  isRead: Boolean(n.is_read),
  backendId: n.id,
});

export default function NotificationsScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('general');
  const [general, setGeneral] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const [annRes, notiRes] = await Promise.allSettled([
        apiClient.get('/announcements'),
        apiClient.get('/notifications'),
      ]);

      if (cancelled) return;

      if (annRes.status === 'fulfilled') {
        const list = listFrom(annRes.value?.data).map(normalizeAnnouncement);
        list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setGeneral(list);
      } else {
        toast.error(errMsg(annRes.reason, 'Could not load announcements'));
      }

      if (notiRes.status === 'fulfilled') {
        const body = notiRes.value?.data;
        setPersonal(listFrom(body).map(normalizeNotification));
        setUnreadCount(body?.unread_count ?? 0);
      } else {
        toast.error(errMsg(notiRes.reason, 'Could not load notifications'));
      }

      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const markRead = async (item) => {
    if (item.isRead || item.backendId == null) return;
    try {
      await apiClient.post(`/notifications/${item.backendId}/read`);
      setPersonal((prev) => prev.map((p) => (p.id === item.id ? { ...p, isRead: true } : p)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* keep the item unread if the server did not accept it */
    }
  };

  const openLink = (item) => {
    if (!item.link) return;
    if (item.link.startsWith('/')) {
      navigate(item.link);
    } else {
      window.open(item.link, '_blank', 'noopener');
    }
  };

  const items = tab === 'general' ? general : personal;

  const groups = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const key = dayLabel(item.created_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return [...map.entries()];
  }, [items]);

  return (
    <div className="min-h-screen bg-white font-sans max-w-[430px] mx-auto pb-24 shadow-sm border-x border-gray-100">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 border-b border-gray-100">
        <button onClick={() => navigate(-1)} aria-label="Back" className="text-gray-800 hover:bg-gray-50 p-1 rounded-full">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Notifications</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab('general')}
          className={`flex-1 py-3 text-[15px] font-semibold transition-all relative ${
            tab === 'general' ? 'text-[#0000c8]' : 'text-gray-500'
          }`}
        >
          General
          {tab === 'general' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0000c8]" />}
        </button>

        <button
          onClick={() => setTab('personal')}
          className={`flex-1 py-3 text-[15px] font-semibold transition-all relative flex items-center justify-center gap-2 ${
            tab === 'personal' ? 'text-[#0000c8]' : 'text-gray-500'
          }`}
        >
          Personal
          {unreadCount > 0 && (
            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
          {tab === 'personal' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0000c8]" />}
        </button>
      </div>

      {/* List */}
      <div className="px-4 pt-5 pb-6">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner />
          </div>
        ) : groups.length === 0 ? (
          <p className="text-center text-gray-500 text-sm mt-10">
            {tab === 'general' ? 'No announcements yet.' : 'No personal notifications yet.'}
          </p>
        ) : (
          groups.map(([date, list]) => (
            <div key={date} className="mb-6">
              <h3 className="text-gray-600 font-semibold text-sm mb-3">{date}</h3>
              <div className="space-y-4">
                {list.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => markRead(item)}
                    className={`border rounded-xl p-4 shadow-sm ${
                      item.isRead ? 'border-gray-200 bg-gray-50/50' : 'border-[#0000c8]/30 bg-white'
                    }`}
                  >
                    <span className="text-gray-400 text-xs font-medium block mb-1">{timeLabel(item.created_at)}</span>
                    <h4 className="text-gray-900 font-bold text-sm mb-1.5">{item.title}</h4>
                    {item.message && <p className="text-gray-600 text-xs leading-relaxed mb-3">{item.message}</p>}
                    {item.link && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead(item);
                          openLink(item);
                        }}
                        className="text-[#0000c8] text-xs font-semibold hover:underline"
                      >
                        Know More
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}