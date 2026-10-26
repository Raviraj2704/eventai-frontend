import { useNavigate } from 'react-router-dom';
import {
  Megaphone, Mic, CalendarDays, BookOpen, Users, MessagesSquare,
  Handshake, Briefcase, Star, BarChart3, Settings, Sparkles,
} from 'lucide-react';

const FEATURES = [
  { title: 'Announcements', icon: Megaphone, path: '/announcements' },
  { title: 'Speakers', icon: Mic, path: '/speakers' },
  { title: 'Schedule', icon: CalendarDays, path: '/sessions' },
  { title: 'Learning', icon: BookOpen, path: '/learning-paths' },
  { title: 'Engagement', icon: Users, path: '/engagement-center' },
  { title: 'Social Wall', icon: MessagesSquare, path: '/social-wall' },
  { title: 'Partners', icon: Handshake, path: '/partners' },
  { title: 'Briefcase', icon: Briefcase, path: '/briefcase' },
  { title: 'Ratings', icon: Star, path: '/ratings' },
  { title: 'Analytics', icon: BarChart3, path: '/analytics' },
  { title: 'Admin', icon: Settings, path: '/admin' },
  { title: 'AI Matches', icon: Sparkles, path: '/ai-matches' },
];

export default function HubScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28">
      <div className="px-4 pt-5">
        <h1 className="text-xl font-semibold text-gray-800">Features</h1>

        <div className="grid grid-cols-2 gap-3 pt-4">
          {FEATURES.map(({ title, icon: Icon, path }) => (
            <button
              key={title}
              onClick={() => navigate(path)}
              className="h-[72px] rounded-xl bg-gradient-to-r from-[#1e0a45] via-[#2a115e] to-[#4b1d96] text-white text-base font-medium flex items-center justify-center gap-2 shadow-sm"
            >
              <Icon size={18} />
              <span>{title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}