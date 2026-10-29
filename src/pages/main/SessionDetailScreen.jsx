import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Bookmark, MapPin, Clock, HelpCircle, 
  ClipboardList, Megaphone, CalendarPlus, ChevronRight
} from 'lucide-react';
import apiClient from '../../config/apiClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function SessionDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchSession = async () => {
      try {
        const res = await apiClient.get(`/sessions/${id}`);
        if (!cancelled) setSession(res?.data?.data || res?.data);
      } catch (error) {
        // Fallback mock data for immediate UI rendering if endpoint isn't fully seeded
        if (!cancelled) {
          setSession({
            title: "How to book meetings fully automated with the help of cold email outreach",
            track: "Foundational Track",
            is_live: true,
            date: "15th Oct, 2024",
            time: "10:00 AM - 05:00 PM",
            room: "Primary Hall (Meeting room 1)",
            description: "Learn the exact frameworks, templates, and automation sequences top performers use to book 20+ qualified meetings per month on autopilot without spamming.",
            speakers: [
              { id: 1, name: "Sarah Jenkins", title: "VP of Sales", company: "Outreach.io", avatar: "https://i.pravatar.cc/150?img=5", isModerator: true },
              { id: 2, name: "David Chen", title: "Growth Lead", company: "TechFlow", avatar: "https://i.pravatar.cc/150?img=11" }
            ],
            sponsors: [
              { id: 1, name: "Acme Corp", logo: "https://ui-avatars.com/api/?name=Acme&background=f8fafc&color=0f172a" },
              { id: 2, name: "GlobalTech", logo: "https://ui-avatars.com/api/?name=GT&background=f8fafc&color=0f172a" }
            ]
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSession();
    return () => { cancelled = true; };
  }, [id]);

  const handleAction = (actionType) => {
    // These will eventually trigger the action modals we built in SessionsScreen
    toast.success(`Opening ${actionType}...`);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><LoadingSpinner /></div>;
  }

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">Session not found.</div>;
  }

  const trackColor = session.track === 'Foundational Track' ? 'bg-pink-600' : 'bg-blue-600';

  return (
    <div className="min-h-screen bg-[#F8FAFC] max-w-md mx-auto pb-24 font-sans select-none">
      
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between bg-white sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-700">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-slate-900 truncate pr-4">Session Details</h1>
        </div>
        <button onClick={() => setIsBookmarked(!isBookmarked)} className="text-slate-400 hover:text-[#1d1fb8] transition-colors">
          <Bookmark size={24} className={isBookmarked ? "fill-[#1d1fb8] text-[#1d1fb8]" : ""} />
        </button>
      </div>

      {/* Hero Banner Area */}
      <div className="bg-white px-5 pt-6 pb-5 border-b border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <span className={`${trackColor} text-white text-[11px] font-bold px-3 py-1 rounded-full`}>
            {session.track || 'General'}
          </span>
          {session.is_live && (
            <span className="text-[11px] font-bold text-red-500 flex items-center gap-1.5 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> Live Now
            </span>
          )}
        </div>

        <h2 className="text-[22px] font-black text-slate-900 leading-[1.2] mb-4">
          {session.title}
        </h2>

        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
            <Clock size={16} className="text-slate-400" />
            <span>{session.date} | {session.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
            <MapPin size={16} className="text-slate-400" />
            <span>{session.room}</span>
          </div>
        </div>

        <button 
          onClick={() => setIsAdded(!isAdded)}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-colors ${
            isAdded ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-[#1d1fb8] text-white shadow-md shadow-blue-900/20'
          }`}
        >
          <CalendarPlus size={18} />
          {isAdded ? 'Added to Schedule' : 'Add to My Schedule'}
        </button>
      </div>

      {/* Interactive Action Row */}
      <div className="px-5 py-6 bg-white mt-2 border-y border-slate-100">
        <h3 className="text-[15px] font-bold text-slate-900 mb-4">Engage</h3>
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => handleAction('Ask a Question')}
            className="flex flex-col items-center justify-center gap-2 py-4 px-2 bg-slate-50 border border-slate-200 rounded-2xl active:scale-95 transition-transform"
          >
            <HelpCircle size={22} className="text-[#1d1fb8]" />
            <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">Ask A<br/>Question</span>
          </button>
          <button 
            onClick={() => handleAction('Quiz')}
            className="flex flex-col items-center justify-center gap-2 py-4 px-2 bg-slate-50 border border-slate-200 rounded-2xl active:scale-95 transition-transform"
          >
            <ClipboardList size={22} className="text-[#1d1fb8]" />
            <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">Take<br/>Quiz</span>
          </button>
          <button 
            onClick={() => handleAction('Feedback')}
            className="flex flex-col items-center justify-center gap-2 py-4 px-2 bg-slate-50 border border-slate-200 rounded-2xl active:scale-95 transition-transform"
          >
            <Megaphone size={22} className="text-[#1d1fb8]" />
            <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">Session<br/>Feedback</span>
          </button>
        </div>
      </div>

      {/* About Section */}
      <div className="px-5 py-6 bg-white mt-2 border-y border-slate-100">
        <h3 className="text-[15px] font-bold text-slate-900 mb-2">About Session</h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          {session.description}
        </p>
      </div>

      {/* Speakers Section */}
      {session.speakers && session.speakers.length > 0 && (
        <div className="px-5 py-6 bg-white mt-2 border-y border-slate-100">
          <h3 className="text-[15px] font-bold text-slate-900 mb-4">Speakers</h3>
          <div className="space-y-3">
            {session.speakers.map((speaker) => (
              <div key={speaker.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-4">
                  <img src={speaker.avatar} alt={speaker.name} className="w-14 h-14 rounded-full object-cover border border-slate-200" />
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-[15px] font-bold text-slate-900">{speaker.name}</h4>
                      {speaker.isModerator && (
                        <span className="bg-[#E9E4FF] text-[#5B34EA] text-[9px] font-bold px-2 py-0.5 rounded-md">
                          Moderator
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-500">{speaker.title}</p>
                    <p className="text-xs text-slate-400">{speaker.company}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sponsors Carousel */}
      {session.sponsors && session.sponsors.length > 0 && (
        <div className="px-5 py-6 bg-white mt-2 border-y border-slate-100">
          <h3 className="text-[15px] font-bold text-slate-900 mb-4">Session Sponsors</h3>
          <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar">
            {session.sponsors.map((sponsor) => (
              <div key={sponsor.id} className="min-w-[140px] p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col items-center justify-center gap-3">
                <img src={sponsor.logo} alt={sponsor.name} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                <span className="text-xs font-bold text-slate-700 text-center">{sponsor.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}