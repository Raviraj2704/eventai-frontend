import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, MessageSquare, MapPin, Sparkles, Bookmark, Users, User, Award,
  Mic, CalendarDays, ChevronRight,
} from 'lucide-react';

// Edit these values for your event. Logos are handled later.
const EVENT = {
  name: 'EventAI',
  dates: '26 - 27 Nov, 2026',
  venue: 'Yashobhoomi, New Delhi',
  start: '2026-11-26T09:00:00+05:30',
};

const SLIDES = [
  { kicker: 'Keynote', name: 'Speaker Name', role: 'Designation, Company', bg: 'from-[#1e3a8a] to-[#0c1b78]' },
  { kicker: 'Featured', name: 'Opening Session', role: 'Main Hall, 10:00 AM', bg: 'from-[#6d28d9] to-[#1e3a8a]' },
  { kicker: 'Expo', name: 'Visit the Innovation Hub', role: 'Discover partner booths', bg: 'from-[#0c1b78] to-[#4c1d95]' },
];

const QUICK_ACTIONS = [
  { label: 'My Profile', icon: User, path: '/profile' },
  { label: 'My Meetings', icon: Users, path: '/networking' },
  { label: 'My Favourites', icon: Bookmark, path: '/briefcase' },
  { label: 'My Badge', icon: Award, path: '/profile' },
];

const FEATURES = [
  { label: 'Partners', icon: Users, path: '/partners' },
  { label: 'Speakers', icon: Mic, path: '/speakers' },
  { label: 'AI Matches', icon: Sparkles, path: '/ai-matches' },
  { label: 'Agenda', icon: CalendarDays, path: '/sessions' },
];

const pad = (n) => String(n).padStart(2, '0');

function getTimeLeft(target) {
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    h: Math.floor(diff / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

export default function HomePage() {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [time, setTime] = useState(() => getTimeLeft(EVENT.start));
  const touchX = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTime(getTimeLeft(EVENT.start)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSlide((p) => (p + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
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

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28">
      {/* Header banner */}
      <div className="bg-[#0c1b78] text-white px-4 pt-4 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <span className="font-bold text-lg">{EVENT.name}</span>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center" aria-label="Chat">
              <MessageSquare size={18} />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center" aria-label="Notifications">
              <Bell size={18} />
            </button>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-start gap-3">
          <div>
            <p className="text-lg font-semibold">{EVENT.dates}</p>
            <p className="text-xs flex items-center gap-1 mt-1 text-white/90 underline">
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

      {/* Hero carousel (swipe + auto-advance) */}
      <div className="px-4 pt-4" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className={`relative h-44 rounded-2xl overflow-hidden bg-gradient-to-r ${SLIDES[slide].bg} text-white transition-all duration-500`}>
          <div className="absolute inset-0 p-5 flex flex-col justify-end">
            <p className="text-[11px] uppercase tracking-wider text-white/80">{SLIDES[slide].kicker}</p>
            <p className="text-2xl font-bold">{SLIDES[slide].name}</p>
            <p className="text-sm text-white/85">{SLIDES[slide].role}</p>
          </div>
        </div>
        <div className="flex justify-center gap-1.5 mt-3">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${slide === i ? 'w-6 bg-[#0c1b78]' : 'w-1.5 bg-gray-300'}`}
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
        <h2 className="text-lg font-semibold text-gray-800">Features</h2>
        <div className="flex gap-3 overflow-x-auto pt-3 pb-1 hide-scrollbar">
          {FEATURES.map(({ label, icon: Icon, path }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="shrink-0 w-[84px] h-[72px] rounded-lg bg-gradient-to-br from-[#7e22ce] to-[#a21caf] text-white flex flex-col items-center justify-center gap-1 text-[11px] font-medium shadow-sm"
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => navigate('/hub')}
          className="w-full text-center text-sm text-gray-700 py-4 flex items-center justify-center gap-1"
        >
          Explore More <ChevronRight size={16} />
        </button>
      </div>

      {/* Floating AI button */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[430px] pointer-events-none">
        <div className="flex justify-end pr-4">
          <button
            onClick={() => navigate('/picbot')}
            aria-label="AI Assistant"
            className="pointer-events-auto w-14 h-14 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-[#1d4ed8]"
          >
            <Sparkles size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}