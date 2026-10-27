import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, MessageSquare, X, ChevronRight, Trophy, BarChart3, Info, Bot,
  MessagesSquare, Activity, Building2, CalendarDays, Briefcase, Sparkles,
  Calendar, Users, Map, Mic, Library, ClipboardCheck,
} from 'lucide-react';

// Same 15 tiles and order as the reference video.
// Wide tiles span both columns.
const TILES = [
  { id: 'event-info', label: 'Event Info', icon: Info, path: '/event-info' },
  { id: 'picbot', label: 'Picbot', icon: Bot, path: '/picbot' },
  { id: 'social-wall', label: 'Social Wall', icon: MessagesSquare, path: '/social-wall' },
  { id: 'activity-hub', label: 'Activity Hub', icon: Activity, path: '/activity-hub' },
  { id: 'partners', label: 'Partners', icon: Building2, path: '/partners', wide: true },
  { id: 'sessions', label: 'Sessions', icon: CalendarDays, path: '/sessions' },
  { id: 'briefcase', label: 'Briefcase', icon: Briefcase, path: '/briefcase' },
  { id: 'ai-matches', label: 'AI Matches', icon: Sparkles, path: '/ai-matches' },
  { id: 'my-calendar', label: 'My Calendar', icon: Calendar, path: '/my-calendar' },
  { id: 'engagement', label: 'Engagement Center', icon: BarChart3, action: 'engagement', wide: true },
  { id: 'my-meetings', label: 'My Meetings', icon: Users, path: '/my-meetings' },
  { id: 'floor-plan', label: 'Floor Plan', icon: Map, path: '/floor-plan' },
  { id: 'speakers', label: 'Speakers', icon: Mic, path: '/speakers' },
  { id: 'library', label: 'Resource Library', icon: Library, path: '/library' },
  { id: 'feedback', label: 'Feedback', icon: ClipboardCheck, path: '/feedback', wide: true },
];

const ENGAGEMENT_ITEMS = [
  { label: 'Polls', icon: BarChart3, path: '/engagement-center' },
  { label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
];

export default function HubScreen() {
  const navigate = useNavigate();
  const [engagementOpen, setEngagementOpen] = useState(false);

  const openTile = (tile) => {
    if (tile.action === 'engagement') {
      setEngagementOpen(true);
      return;
    }
    navigate(tile.path);
  };

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28">
      {/* Header */}
      <div className="bg-[#0c1b78] text-white px-4 pt-5 pb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Hub</h1>
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

      {/* Tile grid */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.id}
              onClick={() => openTile(tile)}
              className={`rounded-2xl bg-sky-100 active:scale-[0.98] transition-transform text-left ${
                tile.wide ? 'col-span-2 px-5 py-4 flex items-center justify-between' : 'min-h-[120px] p-4 flex flex-col items-center justify-center gap-3'
              }`}
            >
              {tile.wide ? (
                <>
                  <span className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-xl bg-[#0c1b78] text-white flex items-center justify-center">
                      <Icon size={22} />
                    </span>
                    <span className="text-base font-semibold text-neutral-900">{tile.label}</span>
                  </span>
                  <ChevronRight size={20} className="text-neutral-500" />
                </>
              ) : (
                <>
                  <span className="w-14 h-14 rounded-2xl bg-[#0c1b78] text-white flex items-center justify-center">
                    <Icon size={26} />
                  </span>
                  <span className="text-sm font-semibold text-neutral-900 text-center">{tile.label}</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Engagement Center sheet */}
      {engagementOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center"
          onClick={() => setEngagementOpen(false)}
        >
          <div
            className="bg-white w-full max-w-[430px] rounded-t-2xl mb-16"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-200">
              <p className="font-semibold text-neutral-900">Engagement Center</p>
              <button onClick={() => setEngagementOpen(false)} aria-label="Close" className="text-neutral-500">
                <X size={20} />
              </button>
            </div>
            {ENGAGEMENT_ITEMS.map(({ label, icon: Icon, path }) => (
              <button
                key={label}
                onClick={() => {
                  setEngagementOpen(false);
                  navigate(path);
                }}
                className="w-full flex items-center gap-3 px-4 py-4 border-b border-neutral-100 text-left"
              >
                <span className="w-9 h-9 rounded-md border border-neutral-200 flex items-center justify-center text-neutral-700">
                  <Icon size={18} />
                </span>
                <span className="text-base text-neutral-900">{label}</span>
                <ChevronRight size={18} className="ml-auto text-neutral-400" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}