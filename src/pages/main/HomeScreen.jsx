import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Bell, MessageSquare, MapPin, Sparkles, User, Users, Award, Bookmark,
  Building2, Mic, CalendarDays, ChevronRight, Clock, Crown, ThumbsUp, MessageCircle,
} from 'lucide-react';
import apiClient from '../../config/apiClient';

// Edit these values to match your event.
const EVENT = {
  name: 'EventAI',
  dates: '26 - 27 Nov, 2026',
  venue: 'HI-TECH CITY, HYDERABAD',
  start: '2026-11-26T09:00:00+05:30',
};

// Real event photos in public/images/home/
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

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.detail || error?.data?.detail || error?.message || fallback;

const initialsOf = (name) =>
  name.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'A';

const formatWhen = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

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

export default function HomeScreen() {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [time, setTime] = useState(() => getTimeLeft(EVENT.start));
  const [recommended, setRecommended] = useState([]);
  const [podium, setPodium] = useState([]);
  const [feed, setFeed] = useState([]);
  const [likedIds, setLikedIds] = useState([]);
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

  // Load Recommended, Leaderboard top 3, and Activity Hub preview from real routes
  useEffect(() => {
    let cancelled = false;

    const loadRecommended = async () => {
      try {
        const response = await apiClient.get('/ai/recommendations/sessions');
        const raw = response?.data;
        const list = Array.isArray(raw) ? raw : raw?.data || raw?.recommendations || [];
        if (!cancelled) setRecommended(list.slice(0, 10));
      } catch (error) {
        console.error('Could not load recommendations:', error);
      }
    };

    const loadPodium = async () => {
      try {
        const response = await apiClient.get('/activity/leaderboard/top', { params: { limit: 3 } });
        const list = response?.data?.data || [];
        if (!cancelled) setPodium(list);
      } catch (error) {
        console.error('Could not load leaderboard:', error);
      }
    };

    const loadFeed = async () => {
      try {
        const response = await apiClient.get('/activity/feed', { params: { limit: 3 } });
        const raw = response?.data;
        const list = Array.isArray(raw) ? raw : raw?.data || [];
        if (!cancelled) setFeed(list);
      } catch (error) {
        console.error('Could not load activity feed:', error);
      }
    };

    loadRecommended();
    loadPodium();
    loadFeed();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLike = async (post) => {
    if (likedIds.includes(post.id)) return;
    try {
      const response = await apiClient.post(`/social/posts/${post.id}/like`);
      const likeCount = response?.data?.like_count ?? post.like_count + 1;
      setFeed((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, like_count: likeCount } : p))
      );
      setLikedIds((prev) => [...prev, post.id]);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not like this post'));
    }
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

  // Video layout: #2 on the left, #1 in the center (blue card with crown), #3 on the right
  const podiumOrder = [podium[1], podium[0], podium[2]];

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
                  onClick={() => navigate(type.toLowerCase() === 'session' ? '/sessions' : '/ai-matches')}
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

      {/* Leaderboard (top 3 with profile photos) */}
      {podium.length > 0 && (
        <div className="px-4 pt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-neutral-800">Leaderboard</h2>
            <button onClick={() => navigate('/engagement-center')} className="text-sm text-[#1d1fb8] font-medium">
              View All
            </button>
          </div>
          <div className="mt-3 flex items-end justify-center gap-2">
            {podiumOrder.map((entry, i) => {
              if (!entry) return <div key={`empty-${i}`} className="flex-1" />;
              const isFirst = entry.rank === 1;
              return (
                <div
                  key={entry.user_id}
                  className={`flex-1 flex flex-col items-center text-center rounded-2xl px-2 py-4 ${
                    isFirst
                      ? 'bg-[#1d1fb8] text-white shadow-lg -mt-4'
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
                  <p className={`text-sm font-bold ${isFirst ? 'text-white' : 'text-[#1d1fb8]'}`}>
                    {entry.total_points}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity Hub preview */}
      {feed.length > 0 && (
        <div className="px-4 pt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-neutral-800">Activity Hub</h2>
            <button onClick={() => navigate('/activity-hub')} className="text-sm text-[#1d1fb8] font-medium">
              View All
            </button>
          </div>
          <div className="mt-3 space-y-4">
            {feed.map((post) => {
              const liked = likedIds.includes(post.id);
              return (
                <div key={post.id} className="rounded-2xl border border-neutral-200 shadow-sm p-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={post.author_avatar_url} name={post.author_name} size="w-10 h-10" text="text-sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{post.author_name}</p>
                      <p className="text-xs text-neutral-500">{formatWhen(post.created_at)}</p>
                    </div>
                  </div>

                  <p className="text-sm text-neutral-800 mt-3 whitespace-pre-line">{post.content}</p>

                  {post.image_url && (
                    <img src={post.image_url} alt="" className="mt-3 w-full h-48 object-cover rounded-xl" />
                  )}

                  <div className="mt-3 pt-3 border-t border-neutral-200 flex justify-between items-center">
                    <button
                      onClick={() => handleLike(post)}
                      disabled={liked}
                      className={`flex items-center gap-2 text-sm font-medium ${liked ? 'text-[#1d1fb8]' : 'text-neutral-700'}`}
                    >
                      <ThumbsUp size={16} className={liked ? 'fill-[#1d1fb8]' : ''} />
                      Like · {post.like_count}
                    </button>
                    <span className="flex items-center gap-2 text-sm text-neutral-700">
                      <MessageCircle size={16} /> {post.comment_count} comments
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating AI button */}
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