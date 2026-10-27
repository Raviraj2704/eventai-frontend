import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, MessageSquare, MapPin, Sparkles, User, Users, Award, Bookmark,
  Building2, Mic, CalendarDays, ChevronRight, Clock,
} from 'lucide-react';
import apiClient from '../../config/apiClient';

// Edit these values to match your event.
const EVENT = {
  name: 'EventAI',
  dates: '26 - 27 Nov, 2026',
  venue: 'Yashobhoomi, New Delhi',
  start: '2026-11-26T09:00:00+05:30',
};

// Real event photos. Place them in public/images/home/
const SLIDES = [
  { image: '/images/home/keynote-1.jpg', kicker: 'Keynote', title: 'Keynote Speaker', subtitle: 'Designation, Company' },
  { image: '/images/home/keynote-2.jpg', kicker: 'Featured Session', title: 'Opening Session', subtitle: 'Main Hall, 10:00 AM' },
  { image: '/images/home/keynote-3.jpg', kicker: 'Expo', title: 'Visit the Innovation Hub', subtitle: 'Partner booths and demos' },
];

const QUICK_ACTIONS = [
  { label: 'My Profile', icon: User, path: '/profile' },
  { label: 'My Meetings', icon: Users, path: '/my-meetings' },
  { label: 'My Favourites', icon: Bookmark, path: '/briefcase' },
  { label: 'My Badge', icon: Award, path: '/profile' },
];

const FEATURES = [
  { label: 'Partners', icon: Building2, path: '/partners' },
  { label: 'Speakers', icon: Mic, path: '/speakers' },
  { label: 'AI Matches', icon: Sparkles, path: '/ai-matches' },
  { label: 'Agenda', icon: CalendarDays, path: '/sessions' },
];

const pad = (n) => String(n).padStart(2, '0');

const getTimeLeft = (target) => {
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    h: Math.floor(diff / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
};

export default function HomeScreen() {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [time, setTime] = useState(() => getTimeLeft(EVENT.start));
  const [recommended, setRecommended] = useState([]);
  const touchX = useRef(null);

  // Countdown
  useEffect(() => {
    const t = setInterval(() => setTime(getTimeLeft(EVENT.start)), 1000);
    return () => clearInterval(t);
  }, []);

  // Carousel auto-advance
  useEffect(() => {
    const t = setInterval(() => setSlide((p) => (p + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Recommended For You (real AI route)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await apiClient.get('/ai/recommendations/sessions');
        const raw = response?.data;
        const list = Array.isArray(raw) ? raw : raw?.data || raw?.recommendations || [];
        if (!cancelled) setRecommended(list.slice(0, 10));
      } catch (error) {
        console.error('Could not load recommendations:', error);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) {
      setSlide((p) => (dx < 0 ? (p + 1) % SLIDES.length : (p - 1 + SLIDES.length) % SLIDES.length));
    }
    touchX.current = null;
  };

  const current = SLIDES[slide];

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28">
      {/* Header banner */}
      <div className="bg-[#0c1b78] text-white px-4 pt-5 pb-5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg">{EVENT.name}</span>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/networking')}
              aria-label="Messages"
              className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center"
            >
              <MessageSquare size={18} />
            </button>
            <button
              onClick={() => navigate('/announcements')}
              aria-label="Notifications"
              className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center"
            >
              <Bell size={18} />
            </button>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-start gap-3">
          <div>
            <p className="text-lg font-semibold">{EVENT.dates}</p>
            <p className="text-xs flex items-center gap-1 mt-1 text-white/90 underline underline-offset-2">
              <MapPin size={12} /> {EVENT.venue}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
            <p className="text-[11px] text-white/90">Event Begins in</p>
            <p className="text-xl font-bold tabular-nums">
              {pad(time.h)} : {pad(time.m)} : {pad(time.s)}
            </p>
          </div>
        </div>
      </div>

      {/* Speaker carousel */}
      <div className="px-4 pt-4" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="relative h-44 rounded-2xl overflow-hidden bg-[#0c1b78] text-white">
          <img
            src={current.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c1b78]/95 via-[#0c1b78]/40 to-transparent" />
          <div className="absolute inset-0 p-5 flex flex-col justify-end">
            <p className="text-[11px] uppercase tracking-wider text-white/85">{current.kicker}</p>
            <p className="text-2xl font-bold">{current.title}</p>
            <p className="text-sm text-white/90">{current.subtitle}</p>
          </div>
        </div>
        <div className="flex justify-center gap-1.5 mt-3">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${slide === i ? 'w-6 bg-[#0c1b78]' : 'w-1.5 bg-neutral-300'}`}
            />
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 pt-5 grid grid-cols-4 gap-2">
        {QUICK_ACTIONS.map(({ label, icon: Icon, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="bg-[#1d1fb8] text-white rounded-xl py-4 flex flex-col items-center gap-2 text-[11px] font-medium"
          >
            <Icon size={22} />
            {label}
          </button>
        ))}
      </div>

      {/* Features */}
      <div className="px-4 pt-6">
        <h2 className="text-lg font-semibold text-neutral-800">Features</h2>
        <div className="grid grid-cols-4 gap-2 pt-3">
          {FEATURES.map(({ label, icon: Icon, path }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="h-[72px] rounded-lg bg-gradient-to-br from-[#7e22ce] to-[#a21caf] text-white flex flex-col items-center justify-center gap-1 text-[11px] font-medium shadow-sm"
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => navigate('/hub')}
          className="w-full text-center text-sm text-neutral-700 py-4 flex items-center justify-center gap-1"
        >
          Explore More <ChevronRight size={16} />
        </button>
      </div>

      {/* Recommended For You */}
      {recommended.length > 0 && (
        <div className="pt-2">
          <div className="px-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-neutral-800">Recommended For You</h2>
            <button onClick={() => navigate('/ai-matches')} className="text-sm text-[#1d1fb8] font-medium">
              View All
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pt-3 pb-2 hide-scrollbar">
            {recommended.map((item, index) => {
              const title = item.title || item.name || 'Recommended';
              const type = item.type || 'Session';
              const when = item.start_time || item.date || '';
              const image = item.image_url || item.avatar_url || null;
              return (
                <button
                  key={item.id ?? index}
                  onClick={() => navigate(item.id && type.toLowerCase() === 'session' ? `/sessions` : '/ai-matches')}
                  className="shrink-0 w-44 rounded-xl border border-neutral-200 overflow-hidden text-left shadow-sm"
                >
                  <div className="h-24 bg-neutral-200">
                    {image && <img src={image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] font-semibold uppercase text-[#1d1fb8]">{type}</p>
                    <p className="text-sm font-semibold text-neutral-900 line-clamp-2">{title}</p>
                    {when && (
                      <p className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                        <Clock size={12} /> {when}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating AI button (matches the video: white circle, blue icon) */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[430px] pointer-events-none z-40">
        <div className="flex justify-end pr-4">
          <button
            onClick={() => navigate('/picbot')}
            aria-label="AI Assistant"
            className="pointer-events-auto w-14 h-14 rounded-full bg-white shadow-lg border border-neutral-200 flex items-center justify-center text-[#1d1fb8]"
          >
            <Sparkles size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}