// ============================================================================
// Home Screen (matches the reference screenshots)
// File: src/pages/main/HomeScreen.jsx
// Route: /home
// Real API only:
//   GET  /ai/recommendations/sessions    Recommended For You
//   GET  /activity/leaderboard/top       Leaderboard podium
//   GET  /social/wall                    #DreamcastAnnual24 posts and Activity Hub preview
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Bell, MessageSquare, MapPin, Sparkles, User, Users, Award, Bookmark,
  Building2, Mic, CalendarDays, ChevronRight, Clock, Crown, Globe,
} from 'lucide-react';
import apiClient from '../../config/apiClient';
import SocialPostCard, { CommentsSheet } from '../../components/social/SocialPostCard';

// Edit these to match your event.
const EVENT = {
  name: 'EventAI',
  dates: '26 - 27 Nov, 2026',
  venue: 'HI-TECH CITY, HYDERABAD',
  start: '2026-11-26T09:00:00+05:30',
};

// Add your real social links here. Empty means "not set yet".
const SOCIAL_LINKS = [
  { label: 'Facebook', mark: 'f', url: '' },
  { label: 'X', mark: 'X', url: '' },
  { label: 'Instagram', mark: 'IG', url: '' },
  { label: 'LinkedIn', mark: 'in', url: '' },
  { label: 'YouTube', mark: '▶', url: '' },
  { label: 'Website', icon: Globe, url: '' },
];

// Real event photos in public/images/home/
const SLIDES = [
  { image: '/images/home/keynote-1.jpg', kicker: 'Keynote', title: 'Keynote Speaker', subtitle: 'Designation, Company' },
  { image: '/images/home/keynote-2.jpg', kicker: 'Featured Session', title: 'Opening Session', subtitle: 'Main Hall, 10:00 AM' },
  { image: '/images/home/keynote-3.jpg', kicker: 'Expo', title: 'Visit the Innovation Hub', subtitle: 'Partner booths and demos' },
];

const QUICK_ACTIONS = [
  { label: 'My Profile', icon: User, path: '/profile' },
  { label: 'My Meetings', icon: Users, path: '/my-meetings' },
  { label: 'My Favourites', icon: Bookmark, path: '/my-favourites' },
  { label: 'My Badge', icon: Award, path: '/my-badges' },
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

const getErrorMessage = (error, fallback) => {
  const detail = error?.data?.detail ?? error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  return error?.message || fallback;
};

const initialsOf = (name = '') =>
  name.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'A';

const Avatar = ({ src, name, size = 'w-14 h-14', text = 'text-base', ring = false }) =>
  src ? (
    <img
      src={src}
      alt={name}
      className={`${size} rounded-full object-cover shrink-0 ${ring ? 'ring-4 ring-white' : ''}`}
    />
  ) : (
    <div
      className={`${size} rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center font-semibold text-neutral-600 shrink-0 ${text} ${ring ? 'ring-4 ring-white' : ''}`}
    >
      {initialsOf(name)}
    </div>
  );

// Date circle used for session cards that have no photo
function DateBadge({ iso }) {
  const d = iso ? new Date(iso) : null;
  const day = d && !isNaN(d) ? d.toLocaleDateString('en-IN', { day: '2-digit' }) : '--';
  const month = d && !isNaN(d) ? d.toLocaleDateString('en-IN', { month: 'short' }) : '';
  const time = d && !isNaN(d)
    ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '';
  return (
    <div className="w-36 h-36 bg-neutral-100 flex flex-col items-center justify-center gap-2">
      <div className="w-20 h-20 rounded-full border-2 border-purple-600 flex flex-col items-center justify-center text-center leading-tight">
        <span className="text-sm font-semibold text-neutral-900">{day}</span>
        <span className="text-sm font-semibold text-neutral-900">{month}</span>
      </div>
      <span className="text-[11px] text-neutral-600">{time}</span>
    </div>
  );
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [time, setTime] = useState(() => getTimeLeft(EVENT.start));
  const [recommended, setRecommended] = useState([]);
  const [podium, setPodium] = useState([]);
  const [wall, setWall] = useState([]);
  const [commentPost, setCommentPost] = useState(null);
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

  const loadWall = async () => {
    try {
      const res = await apiClient.get('/social/wall', { params: { page: 1, limit: 10 } });
      setWall(res?.data?.data || []);
    } catch (error) {
      console.error('Could not load social wall:', error);
    }
  };

  // Load everything once
  useEffect(() => {
    let cancelled = false;

    const loadRecommended = async () => {
      try {
        const res = await apiClient.get('/ai/recommendations/sessions');
        const raw = res?.data;
        const list = Array.isArray(raw) ? raw : raw?.data || raw?.recommendations || [];
        if (!cancelled) setRecommended(list.slice(0, 10));
      } catch (error) {
        console.error('Could not load recommendations:', error);
      }
    };

    const loadPodium = async () => {
      try {
        const res = await apiClient.get('/activity/leaderboard/top', { params: { limit: 3 } });
        if (!cancelled) setPodium(res?.data?.data || []);
      } catch (error) {
        console.error('Could not load leaderboard:', error);
      }
    };

    const loadWallOnce = async () => {
      try {
        const res = await apiClient.get('/social/wall', { params: { page: 1, limit: 10 } });
        if (!cancelled) setWall(res?.data?.data || []);
      } catch (error) {
        console.error('Could not load social wall:', error);
      }
    };

    loadRecommended();
    loadPodium();
    loadWallOnce();
    return () => {
      cancelled = true;
    };
  }, []);

  const bumpComments = (postId, delta) =>
    setWall((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comment_count: Math.max(0, (p.comment_count || 0) + delta) } : p))
    );

  const openSocialLink = (link) => {
    if (link.url) window.open(link.url, '_blank', 'noopener');
    else toast(`${link.label} link coming soon`);
  };

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
  const withPhotos = wall.filter((p) => p.image_url);
  const dreamcastPosts = (withPhotos.length ? withPhotos : wall).slice(0, 2);
  const activityPost = wall[0];

  // Video layout: #2 left, #1 center (blue card with crown), #3 right
  const podiumOrder = [podium[1], podium[0], podium[2]];

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28">
      {/* Header banner */}
      <div className="bg-[#0c1b78] text-white px-4 pt-5 pb-5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg">{EVENT.name}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate('/networking')}
              aria-label="Messages"
              className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center"
            >
              <MessageSquare size={18} />
            </button>
            <button
              type="button"
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
          <img src={current.image} alt="" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500" />
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

      {/* Quick actions: blue tiles with label under each */}
      <div className="px-4 pt-6 grid grid-cols-4 gap-3">
        {QUICK_ACTIONS.map(({ label, icon: Icon, path }) => (
          <button
            type="button"
            key={label}
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-2"
          >
            <span className="w-14 h-14 rounded-2xl bg-[#0000c8] text-white flex items-center justify-center shadow-sm">
              <Icon size={22} />
            </span>
            <span className="text-[11px] text-neutral-800 text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* Features: purple gradient tiles */}
      <div className="px-4 pt-6">
        <h2 className="text-lg font-semibold text-neutral-800">Features</h2>
        <div className="grid grid-cols-4 gap-2 pt-3">
          {FEATURES.map(({ label, icon: Icon, path }) => (
            <button
              type="button"
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
          type="button"
          onClick={() => navigate('/hub')}
          className="w-full text-center text-sm text-neutral-700 py-4 flex items-center justify-center gap-1"
        >
          Explore More <ChevronRight size={16} />
        </button>
      </div>

      {/* #DreamcastAnnual24: posts in a light card, same card as Social Wall */}
      {dreamcastPosts.length > 0 && (
        <div className="px-4 pt-2">
          <h2 className="text-lg font-semibold text-neutral-900">#DreamcastAnnual24</h2>
          <div className="mt-3 rounded-2xl bg-slate-100 p-4 space-y-5">
            {dreamcastPosts.map((post) => (
              <SocialPostCard
                key={post.id}
                post={post}
                variant="wall"
                onChanged={loadWall}
                onComment={setCommentPost}
                onDeleted={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recommended For You */}
      {recommended.length > 0 && (
        <div className="px-4 pt-8">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-neutral-900">Recommended For You</h2>
            <button type="button" onClick={() => navigate('/ai-matches')} className="text-sm text-[#0000c8] font-medium">
              View All
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pt-3 pb-2 hide-scrollbar">
            {recommended.map((item, index) => {
              const title = item.title || item.name || 'Recommended';
              const type = item.type || 'Session';
              const subtitle = item.company || item.organization || item.subtitle || '';
              const image = item.image_url || item.avatar_url || null;
              const isSession = type.toLowerCase() === 'session';
              return (
                <button
                  type="button"
                  key={item.id ?? index}
                  onClick={() => navigate(isSession ? '/sessions' : '/ai-matches')}
                  className="shrink-0 w-36 text-left"
                >
                  <div className="w-36 h-36 rounded-xl overflow-hidden bg-neutral-100">
                    {image ? (
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    ) : isSession ? (
                      <DateBadge iso={item.start_time || item.date} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-neutral-500">
                        {initialsOf(title)}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-[#0000c8] mt-2 capitalize">{type.toLowerCase()}</p>
                  <p className="text-sm font-medium text-neutral-900 line-clamp-2">{title}</p>
                  {subtitle && <p className="text-xs text-neutral-500 truncate">{subtitle}</p>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Leaderboard podium */}
      {podium.length > 0 && (
        <div className="px-4 pt-8">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-neutral-900">Leaderboard</h2>
            <button type="button" onClick={() => navigate('/engagement-center')} className="text-sm text-[#0000c8] font-medium">
              View All
            </button>
          </div>
          <div className="mt-3 flex items-end justify-center gap-2">
            {podiumOrder.map((entry, i) => {
              if (!entry) return <div key={`empty-${i}`} className="flex-1" />;
              const isFirst = entry.rank === 1;
              return (
                <div
                  key={entry.user_id ?? i}
                  className={`flex-1 flex flex-col items-center text-center rounded-2xl px-2 py-4 ${
                    isFirst
                      ? 'bg-[#0000c8] text-white shadow-lg -mt-4'
                      : 'bg-white border border-neutral-200 text-neutral-900'
                  }`}
                >
                  <div className="relative">
                    {isFirst && (
                      <Crown size={22} className="absolute -top-5 left-1/2 -translate-x-1/2 text-amber-400 fill-amber-300" />
                    )}
                    <Avatar
                      src={entry.avatar_url}
                      name={entry.name}
                      size={isFirst ? 'w-20 h-20' : 'w-16 h-16'}
                      text={isFirst ? 'text-xl' : 'text-base'}
                      ring={isFirst}
                    />
                  </div>
                  <p className={`mt-2 text-xs font-medium ${isFirst ? 'text-white/85' : 'text-neutral-500'}`}>
                    #{entry.rank}
                  </p>
                  <p className="text-sm font-semibold truncate w-full">{entry.name}</p>
                  <p className={`text-sm font-bold ${isFirst ? 'text-white' : 'text-[#0000c8]'}`}>
                    {entry.total_points}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity Hub preview: latest post with the same reactions as Activity Hub */}
      {activityPost && (
        <div className="px-4 pt-8">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-neutral-900">Activity Hub</h2>
            <button type="button" onClick={() => navigate('/activity-hub')} className="text-sm text-[#0000c8] font-medium">
              View All
            </button>
          </div>
          <div className="mt-3">
            <SocialPostCard
              post={activityPost}
              variant="hub"
              onChanged={loadWall}
              onComment={setCommentPost}
              onDeleted={() => {}}
            />
          </div>
        </div>
      )}

      {/* Social Media */}
      <div className="px-4 pt-8">
        <h2 className="text-lg font-semibold text-neutral-900">Social Media</h2>
        <div className="mt-3 rounded-2xl bg-slate-100 p-4 flex justify-around">
          {SOCIAL_LINKS.map((link) => (
            <button
              type="button"
              key={link.label}
              onClick={() => openSocialLink(link)}
              aria-label={link.label}
              className="w-11 h-11 rounded-full bg-white shadow-sm flex items-center justify-center text-neutral-900 font-bold text-base"
            >
              {link.icon ? <link.icon size={20} /> : link.mark}
            </button>
          ))}
        </div>
      </div>

      {/* Comments sheet for any post */}
      {commentPost && (
        <CommentsSheet
          post={commentPost}
          onClose={() => setCommentPost(null)}
          onCountChange={bumpComments}
        />
      )}

      {/* Floating AI button */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[430px] pointer-events-none z-40">
        <div className="flex justify-end pr-4">
          <button
            type="button"
            onClick={() => navigate('/picbot')}
            aria-label="AI Assistant"
            className="pointer-events-auto w-14 h-14 rounded-full bg-white shadow-lg border border-neutral-200 flex items-center justify-center text-[#0000c8]"
          >
            <Sparkles size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}