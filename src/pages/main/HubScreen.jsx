import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Bell, ChevronRight, Sparkles } from 'lucide-react';

// ============================================================================
// 3D GLOSSY / IRIDESCENT ILLUSTRATED ICONS (MATCHING XD PROTOTYPE)
// ============================================================================

const EventInfoIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="drop-shadow-md">
    <defs>
      <linearGradient id="ei-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF1361" />
        <stop offset="50%" stopColor="#FF4B72" />
        <stop offset="100%" stopColor="#00E5FF" />
      </linearGradient>
      <linearGradient id="ei-grad2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00F0FF" />
        <stop offset="100%" stopColor="#0072FF" />
      </linearGradient>
    </defs>
    <rect x="12" y="8" width="24" height="22" rx="6" fill="url(#ei-grad1)" />
    <rect x="14" y="24" width="20" height="15" rx="5" fill="url(#ei-grad2)" fillOpacity="0.9" />
    <rect x="22" y="14" width="4" height="4" rx="2" fill="white" />
    <rect x="22" y="20" width="4" height="9" rx="2" fill="white" />
    <circle cx="24" cy="11" r="1.5" fill="white" />
  </svg>
);

const PicbotIcon = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" className="drop-shadow-md">
    <defs>
      <radialGradient id="pb-head" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#FF2E93" />
        <stop offset="60%" stopColor="#E60067" />
        <stop offset="100%" stopColor="#9C0045" />
      </radialGradient>
      <linearGradient id="pb-ear" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00E5FF" />
        <stop offset="100%" stopColor="#0051FF" />
      </linearGradient>
    </defs>
    <circle cx="8" cy="26" r="4.5" fill="url(#pb-ear)" />
    <circle cx="44" cy="26" r="4.5" fill="url(#pb-ear)" />
    <path d="M26 12V6" stroke="url(#pb-ear)" strokeWidth="3" strokeLinecap="round" />
    <circle cx="26" cy="5" r="3" fill="#00E5FF" />
    <circle cx="26" cy="27" r="18" fill="url(#pb-head)" />
    <rect x="15" y="20" width="22" height="13" rx="6.5" fill="#080826" />
    <circle cx="20" cy="26.5" r="3" fill="#00E5FF" />
    <circle cx="32" cy="26.5" r="3" fill="#00E5FF" />
    <path d="M23 29C24 30.5 28 30.5 29 29" stroke="#00E5FF" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SocialWallIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="drop-shadow-md">
    <defs>
      <linearGradient id="sw-pink" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF007F" />
        <stop offset="100%" stopColor="#FF5252" />
      </linearGradient>
      <linearGradient id="sw-blue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00E5FF" />
        <stop offset="100%" stopColor="#0066FF" />
      </linearGradient>
    </defs>
    <rect x="8" y="16" width="22" height="18" rx="6" fill="url(#sw-pink)" />
    <path d="M12 34L8 38V34H12Z" fill="url(#sw-pink)" />
    <path d="M15 24C15 22 19 21 19 24C19 26 15 28 15 28C15 28 11 26 11 24C11 21 15 22 15 24Z" fill="white" />
    <rect x="18" y="10" width="22" height="18" rx="6" fill="url(#sw-blue)" fillOpacity="0.95" />
    <path d="M36 28L40 32V28H36Z" fill="url(#sw-blue)" />
    <circle cx="25" cy="18" r="2" fill="white" />
    <circle cx="33" cy="18" r="2" fill="white" />
    <path d="M26 22C27.5 23.5 30.5 23.5 32 22" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ActivityHubIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="drop-shadow-md">
    <defs>
      <linearGradient id="ah-ring" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00F0FF" />
        <stop offset="50%" stopColor="#FF0099" />
        <stop offset="100%" stopColor="#7928CA" />
      </linearGradient>
    </defs>
    <ellipse cx="24" cy="24" rx="19" ry="8" stroke="url(#ah-ring)" strokeWidth="2.5" transform="rotate(-30 24 24)" />
    <circle cx="24" cy="24" r="11" fill="#FF007A" />
    <circle cx="24" cy="24" r="7" fill="white" />
    <circle cx="24" cy="24" r="4.5" fill="#FF007A" />
    <path d="M22 8L26 21H22L26 34" stroke="#00F0FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="39" cy="16" r="2.5" fill="#FF007A" />
    <circle cx="9" cy="32" r="2.5" fill="#00F0FF" />
  </svg>
);

const PartnersIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="drop-shadow-md">
    <defs>
      <linearGradient id="pt-circle" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF1493" />
        <stop offset="50%" stopColor="#9400D3" />
        <stop offset="100%" stopColor="#00BFFF" />
      </linearGradient>
      <radialGradient id="pt-center" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#E0F7FF" />
        <stop offset="100%" stopColor="#80D8FF" />
      </radialGradient>
    </defs>
    <circle cx="24" cy="24" r="19" stroke="url(#pt-circle)" strokeWidth="4" fill="url(#pt-center)" fillOpacity="0.4" />
    <path d="M15 22L20 27L24 23L22 21L17 21L15 22Z" fill="#FF1493" />
    <path d="M33 22L28 27L24 23L26 21L31 21L33 22Z" fill="#00BFFF" />
    <path d="M20 27L24 31L28 27L24 23L20 27Z" fill="#7928CA" />
  </svg>
);

const SessionsIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="drop-shadow-md">
    <defs>
      <linearGradient id="ss-screen" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF007F" />
        <stop offset="100%" stopColor="#FF5E62" />
      </linearGradient>
      <linearGradient id="ss-stand" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00E5FF" />
        <stop offset="100%" stopColor="#0051FF" />
      </linearGradient>
    </defs>
    <rect x="8" y="10" width="32" height="21" rx="4" fill="url(#ss-screen)" />
    <circle cx="24" cy="20.5" r="5.5" fill="white" />
    <polygon points="23,18 27,20.5 23,23" fill="#FF007F" />
    <path d="M14 31L11 39" stroke="url(#ss-stand)" strokeWidth="3" strokeLinecap="round" />
    <path d="M34 31L37 39" stroke="url(#ss-stand)" strokeWidth="3" strokeLinecap="round" />
    <path d="M24 31V37" stroke="url(#ss-stand)" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="drop-shadow-md">
    <defs>
      <linearGradient id="bc-body" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF2A85" />
        <stop offset="50%" stopColor="#FF70A6" />
        <stop offset="100%" stopColor="#00D2FF" />
      </linearGradient>
    </defs>
    <rect x="7" y="16" width="34" height="23" rx="6" fill="url(#bc-body)" />
    <path d="M18 16V12C18 10 20 8 22 8H26C28 8 30 10 30 12V16" stroke="#FF007F" strokeWidth="3" strokeLinecap="round" />
    <rect x="21" y="23" width="6" height="7" rx="2" fill="white" />
    <line x1="7" y1="26" x2="41" y2="26" stroke="white" strokeWidth="1.5" strokeOpacity="0.7" />
  </svg>
);

const AIMatchesIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="drop-shadow-md">
    <defs>
      <linearGradient id="ai-pink" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF007F" />
        <stop offset="100%" stopColor="#FF6584" />
      </linearGradient>
      <linearGradient id="ai-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00E5FF" />
        <stop offset="100%" stopColor="#0072FF" />
      </linearGradient>
    </defs>
    {/* Left Face profile */}
    <circle cx="17" cy="19" r="6" fill="url(#ai-pink)" />
    <path d="M9 36C9 29 13 27 17 27C21 27 22 30 22 36" fill="url(#ai-pink)" />
    {/* Right Face profile */}
    <circle cx="31" cy="19" r="6" fill="url(#ai-cyan)" />
    <path d="M39 36C39 29 35 27 31 27C27 27 26 30 26 36" fill="url(#ai-cyan)" />
    {/* Connection pulse */}
    <line x1="19" y1="22" x2="29" y2="22" stroke="white" strokeWidth="2" strokeDasharray="2 2" />
  </svg>
);

const MyCalendarIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="drop-shadow-md">
    <defs>
      <linearGradient id="mc-top" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF007F" />
        <stop offset="100%" stopColor="#FF5252" />
      </linearGradient>
    </defs>
    <rect x="9" y="11" width="30" height="28" rx="6" fill="white" stroke="#E2E8F0" strokeWidth="1.5" />
    <rect x="9" y="11" width="30" height="10" rx="6" fill="url(#mc-top)" />
    <text x="24" y="32" fontSize="16" fontWeight="bold" fill="#1E293B" textAnchor="middle" fontFamily="sans-serif">8</text>
    <circle cx="34" cy="34" r="6" fill="#00E5FF" />
    <polyline points="34,31 34,34 36,35" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const EngagementCenterIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="drop-shadow-md">
    <circle cx="24" cy="24" r="5" fill="#FF007A" />
    <circle cx="12" cy="16" r="3.5" fill="#00E5FF" />
    <circle cx="36" cy="16" r="3.5" fill="#00E5FF" />
    <circle cx="12" cy="32" r="3.5" fill="#7928CA" />
    <circle cx="36" cy="32" r="3.5" fill="#7928CA" />
    <circle cx="24" cy="10" r="3.5" fill="#FF007A" />
    <circle cx="24" cy="38" r="3.5" fill="#FF007A" />
    <line x1="24" y1="24" x2="12" y2="16" stroke="#94A3B8" strokeWidth="1.5" />
    <line x1="24" y1="24" x2="36" y2="16" stroke="#94A3B8" strokeWidth="1.5" />
    <line x1="24" y1="24" x2="12" y2="32" stroke="#94A3B8" strokeWidth="1.5" />
    <line x1="24" y1="24" x2="36" y2="32" stroke="#94A3B8" strokeWidth="1.5" />
    <line x1="24" y1="24" x2="24" y2="10" stroke="#94A3B8" strokeWidth="1.5" />
    <line x1="24" y1="24" x2="24" y2="38" stroke="#94A3B8" strokeWidth="1.5" />
  </svg>
);

const MyMeetingsIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="drop-shadow-md">
    <circle cx="15" cy="19" r="5.5" fill="#FF1493" />
    <path d="M8 35C8 29 11 27 15 27C19 27 22 29 22 35" fill="#FF1493" />
    <circle cx="33" cy="19" r="5.5" fill="#00BFFF" />
    <path d="M26 35C26 29 29 27 33 27C37 27 40 29 40 35" fill="#00BFFF" />
    <rect x="18" y="11" width="12" height="7" rx="3" fill="#FF007A" />
    <path d="M22 18L20 20V18H22Z" fill="#FF007A" />
  </svg>
);

const FloorPlanIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="drop-shadow-md">
    <defs>
      <linearGradient id="fp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF4B8B" />
        <stop offset="100%" stopColor="#00D2FF" />
      </linearGradient>
    </defs>
    <rect x="10" y="10" width="28" height="28" rx="6" fill="white" stroke="url(#fp-grad)" strokeWidth="2.5" />
    <path d="M16 10V24H28V38" stroke="#FF007A" strokeWidth="2" />
    <rect x="22" y="16" width="10" height="8" rx="2" fill="#00E5FF" fillOpacity="0.4" stroke="#00E5FF" strokeWidth="1.5" />
    <circle cx="20" cy="30" r="2.5" fill="#FF007A" />
  </svg>
);

const SpeakersIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="drop-shadow-md">
    <defs>
      <linearGradient id="sp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF007A" />
        <stop offset="100%" stopColor="#00F0FF" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="16" r="6" fill="#00E5FF" />
    <path d="M15 32C15 25 19 23 24 23C29 23 33 25 33 32" fill="#00E5FF" />
    <rect x="12" y="30" width="24" height="10" rx="3" fill="#FF007A" />
    <line x1="24" y1="23" x2="24" y2="28" stroke="white" strokeWidth="2" />
    <circle cx="24" cy="22" r="2" fill="white" />
  </svg>
);

const SHRMLibraryIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="drop-shadow-md">
    <defs>
      <linearGradient id="bk-1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FF007A" />
        <stop offset="100%" stopColor="#FF5252" />
      </linearGradient>
      <linearGradient id="bk-2" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#7928CA" />
        <stop offset="100%" stopColor="#FF0080" />
      </linearGradient>
      <linearGradient id="bk-3" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#00E5FF" />
        <stop offset="100%" stopColor="#0072FF" />
      </linearGradient>
    </defs>
    <rect x="11" y="29" width="26" height="7" rx="3" fill="url(#bk-1)" />
    <rect x="13" y="21" width="24" height="7" rx="3" fill="url(#bk-2)" />
    <rect x="15" y="13" width="22" height="7" rx="3" fill="url(#bk-3)" />
  </svg>
);

const FeedbackIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="drop-shadow-md">
    <defs>
      <linearGradient id="fb-card" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF007A" />
        <stop offset="100%" stopColor="#FF8A00" />
      </linearGradient>
    </defs>
    <rect x="10" y="12" width="28" height="20" rx="5" fill="url(#fb-card)" />
    <circle cx="16" cy="22" r="1.5" fill="#FFE600" />
    <circle cx="20" cy="22" r="1.5" fill="#FFE600" />
    <circle cx="24" cy="22" r="1.5" fill="#FFE600" />
    <circle cx="28" cy="22" r="1.5" fill="#FFE600" />
    <circle cx="32" cy="22" r="1.5" fill="#FFE600" />
    <circle cx="34" cy="33" r="8" fill="#00E5FF" />
    <path d="M32 35L30 32L32 30H36V34L34 36L32 35Z" fill="white" />
  </svg>
);

// ============================================================================
// MAIN HUB COMPONENT
// ============================================================================

export default function HubScreen() {
  const navigate = useNavigate();
  const [showEngagementSheet, setShowEngagementSheet] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-900 select-none">
      {/* 1. Header Bar */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md px-5 py-4 flex items-center justify-between border-b border-slate-100">
        <h1 className="text-2xl font-black text-[#0f172a] tracking-tight">Hub</h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/messaging')}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <MessageSquare size={20} />
          </button>
          <button 
            onClick={() => navigate('/notifications')}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Bell size={20} />
          </button>
        </div>
      </div>

      {/* 2. Interactive Hub Cards Layout */}
      <div className="px-4 pt-4 space-y-3.5 max-w-md mx-auto">
        
        {/* ROW 1: Event Info & Picbot */}
        <div className="grid grid-cols-2 gap-3.5">
          <button
            onClick={() => navigate('/event-info')}
            className="bg-[#E9F3FC] rounded-[22px] p-4 py-5 flex flex-col items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_2px_10px_rgba(0,102,255,0.04)] border border-white"
          >
            <EventInfoIcon />
            <span className="text-[15px] font-bold text-[#0f172a] tracking-tight">Event Info</span>
          </button>

          <button
            onClick={() => navigate('/discover')}
            className="bg-[#E9F3FC] rounded-[22px] p-4 py-5 flex flex-col items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_2px_10px_rgba(0,102,255,0.04)] border border-white"
          >
            <PicbotIcon />
            <span className="text-[15px] font-bold text-[#0f172a] tracking-tight">Picbot</span>
          </button>
        </div>

        {/* ROW 2: Social Wall & Activity Hub */}
        <div className="grid grid-cols-2 gap-3.5">
          <button
            onClick={() => navigate('/social-wall')}
            className="bg-[#E9F3FC] rounded-[22px] p-4 py-5 flex flex-col items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_2px_10px_rgba(0,102,255,0.04)] border border-white"
          >
            <SocialWallIcon />
            <span className="text-[15px] font-bold text-[#0f172a] tracking-tight">Social Wall</span>
          </button>

          <button
            onClick={() => navigate('/activity-hub')}
            className="bg-[#E9F3FC] rounded-[22px] p-4 py-5 flex flex-col items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_2px_10px_rgba(0,102,255,0.04)] border border-white"
          >
            <ActivityHubIcon />
            <span className="text-[15px] font-bold text-[#0f172a] tracking-tight">Activity Hub</span>
          </button>
        </div>

        {/* ROW 3: Partners (Full-width banner) */}
        <button
          onClick={() => navigate('/partners')}
          className="w-full bg-[#E9F3FC] rounded-[22px] px-5 py-4 flex items-center justify-between hover:scale-[1.01] active:scale-[0.99] transition-all shadow-[0_2px_10px_rgba(0,102,255,0.04)] border border-white"
        >
          <span className="text-[16px] font-bold text-[#0f172a]">Partners</span>
          <PartnersIcon />
          <ChevronRight size={22} className="text-slate-500" />
        </button>

        {/* ROW 4: Sessions & Briefcase */}
        <div className="grid grid-cols-2 gap-3.5">
          <button
            onClick={() => navigate('/sessions')}
            className="bg-[#E9F3FC] rounded-[22px] p-4 py-5 flex flex-col items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_2px_10px_rgba(0,102,255,0.04)] border border-white"
          >
            <SessionsIcon />
            <span className="text-[15px] font-bold text-[#0f172a] tracking-tight">Sessions</span>
          </button>

          <button
            onClick={() => navigate('/briefcase')}
            className="bg-[#E9F3FC] rounded-[22px] p-4 py-5 flex flex-col items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_2px_10px_rgba(0,102,255,0.04)] border border-white"
          >
            <BriefcaseIcon />
            <span className="text-[15px] font-bold text-[#0f172a] tracking-tight">Briefcase</span>
          </button>
        </div>

        {/* ROW 5: AI Matches & My Calendar */}
        <div className="grid grid-cols-2 gap-3.5">
          <button
            onClick={() => navigate('/ai-matches')}
            className="bg-[#E9F3FC] rounded-[22px] p-4 py-5 flex flex-col items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_2px_10px_rgba(0,102,255,0.04)] border border-white"
          >
            <AIMatchesIcon />
            <span className="text-[15px] font-bold text-[#0f172a] tracking-tight">AI Matches</span>
          </button>

          <button
            onClick={() => navigate('/calendar')}
            className="bg-[#E9F3FC] rounded-[22px] p-4 py-5 flex flex-col items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_2px_10px_rgba(0,102,255,0.04)] border border-white"
          >
            <MyCalendarIcon />
            <span className="text-[15px] font-bold text-[#0f172a] tracking-tight">My Calendar</span>
          </button>
        </div>

        {/* ROW 6: Engagement Center (Full-width banner) */}
        <button
          onClick={() => setShowEngagementSheet(true)}
          className="w-full bg-[#E9F3FC] rounded-[22px] px-5 py-4 flex items-center justify-between hover:scale-[1.01] active:scale-[0.99] transition-all shadow-[0_2px_10px_rgba(0,102,255,0.04)] border border-white"
        >
          <span className="text-[16px] font-bold text-[#0f172a]">Engagement Center</span>
          <EngagementCenterIcon />
          <ChevronRight size={22} className="text-slate-500" />
        </button>

        {/* ROW 7: My Meetings & Floor Plan */}
        <div className="grid grid-cols-2 gap-3.5">
          <button
            onClick={() => navigate('/networking')}
            className="bg-[#E9F3FC] rounded-[22px] p-4 py-5 flex flex-col items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_2px_10px_rgba(0,102,255,0.04)] border border-white"
          >
            <MyMeetingsIcon />
            <span className="text-[15px] font-bold text-[#0f172a] tracking-tight">My Meetings</span>
          </button>

          <button
            onClick={() => navigate('/engagement-center')}
            className="bg-[#E9F3FC] rounded-[22px] p-4 py-5 flex flex-col items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_2px_10px_rgba(0,102,255,0.04)] border border-white"
          >
            <FloorPlanIcon />
            <span className="text-[15px] font-bold text-[#0f172a] tracking-tight">Floor Plan</span>
          </button>
        </div>

        {/* ROW 8: Speakers & SHRM Library */}
        <div className="grid grid-cols-2 gap-3.5">
          <button
            onClick={() => navigate('/speakers')}
            className="bg-[#E9F3FC] rounded-[22px] p-4 py-5 flex flex-col items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_2px_10px_rgba(0,102,255,0.04)] border border-white"
          >
            <SpeakersIcon />
            <span className="text-[15px] font-bold text-[#0f172a] tracking-tight">Speakers</span>
          </button>

          <button
            onClick={() => navigate('/learning-paths')}
            className="bg-[#E9F3FC] rounded-[22px] p-4 py-5 flex flex-col items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_2px_10px_rgba(0,102,255,0.04)] border border-white"
          >
            <SHRMLibraryIcon />
            <span className="text-[15px] font-bold text-[#0f172a] tracking-tight">SHRM Library</span>
          </button>
        </div>

        {/* ROW 9: Feedback (Full-width banner) */}
        <button
          onClick={() => navigate('/ratings')}
          className="w-full bg-[#E9F3FC] rounded-[22px] px-5 py-4 flex items-center justify-between hover:scale-[1.01] active:scale-[0.99] transition-all shadow-[0_2px_10px_rgba(0,102,255,0.04)] border border-white"
        >
          <span className="text-[16px] font-bold text-[#0f172a]">Feedback</span>
          <FeedbackIcon />
          <ChevronRight size={22} className="text-slate-500" />
        </button>

      </div>

      {/* Floating Orange AI Assistant FAB */}
      <button
        onClick={() => navigate('/discover')}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white shadow-[0_8px_20px_rgba(249,115,22,0.4)] flex items-center justify-center z-50 hover:scale-105 active:scale-95 transition-transform"
        aria-label="AI Assistant"
      >
        <Sparkles size={24} className="animate-pulse" />
      </button>

      {/* Engagement Center Bottom Sheet Drawer */}
      {showEngagementSheet && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end flex-col"
          onClick={() => setShowEngagementSheet(false)}
        >
          <div 
            className="bg-white rounded-t-[28px] p-6 pb-10 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto -mt-2 mb-4" />
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-black text-slate-900">Engagement Center</h3>
              <button 
                onClick={() => setShowEngagementSheet(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>
            
            <button
              onClick={() => { setShowEngagementSheet(false); navigate('/ratings'); }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                📊
              </div>
              <div className="text-left font-bold text-slate-800">Polls</div>
            </button>

            <button
              onClick={() => { setShowEngagementSheet(false); navigate('/activity-hub'); }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                🏅
              </div>
              <div className="text-left font-bold text-slate-800">Leaderboard</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}