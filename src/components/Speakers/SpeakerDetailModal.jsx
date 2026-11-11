// ============================================================================
// COMPONENT: Speaker Detail Modal
// ============================================================================
// File: src/components/Speakers/SpeakerDetailModal.jsx
// Purpose: Modal for viewing detailed speaker profile matching Adobe XD
// ============================================================================

import React from 'react';
import { 
  ChevronLeft, 
  Info, 
  Share2, 
  Bookmark, 
  Facebook, 
  Twitter, 
  Linkedin, 
  MapPin, 
  ChevronRight, 
  Play, 
  CalendarPlus 
} from 'lucide-react';

export const SpeakerDetailModal = ({
  speaker,
  isOpen,
  onClose
}) => {
  if (!isOpen || !speaker) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-slate-50 w-full max-w-[400px] h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col relative">
        
        {/* TOP HEADER */}
        <div className="flex items-center justify-between px-5 py-4 bg-white">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-slate-800 hover:text-black">
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-[19px] font-bold text-slate-900">Speaker Profile</h2>
          </div>
          <div className="flex items-center gap-4 text-slate-800">
            <button><Info size={20} /></button>
            <button><Share2 size={20} /></button>
            <button><Bookmark size={20} /></button>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="overflow-y-auto flex-1 px-5 pt-6 pb-10 bg-slate-50">
          
          {/* PROFILE INFO */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-[88px] h-[88px] rounded-full overflow-hidden mb-3 border-2 border-white shadow-sm bg-slate-200">
              <img 
                src={speaker.avatarUrl || speaker.image || "https://ui-avatars.com/api/?name=" + (speaker.name || 'Speaker')} 
                alt={speaker.name} 
                className="w-full h-full object-cover" 
              />
            </div>
            <h3 className="text-xl font-bold text-slate-900">{speaker.name || "Speaker Name"}</h3>
            <p className="text-[13px] text-slate-500 mt-0.5">{speaker.designation || speaker.role || "Designation"}</p>
            <p className="text-[13px] text-slate-500">{speaker.company || "Company Name"}</p>
          </div>

          {/* BIO */}
          <div className="mb-8">
            <h4 className="text-[15px] font-bold text-slate-900 mb-2">Bio</h4>
            <p className="text-[13px] text-slate-600 leading-relaxed pr-2">
              {speaker.bio ? speaker.bio.substring(0, 150) : `${speaker.name} is a professional with years of experience across product, technology and analyst roles. He has around 8 years of experience...`}
              <span className="text-[#0000c8] font-semibold ml-1 cursor-pointer hover:underline">Read more</span>
            </p>
          </div>

          {/* SOCIAL MEDIA */}
          <div className="mb-8">
            <h4 className="text-[15px] font-bold text-slate-900 mb-3">Social Media</h4>
            <div className="flex items-center gap-5 text-slate-600">
              <button className="hover:text-blue-600 transition"><Facebook size={20} /></button>
              {/* X / Twitter */}
              <button className="hover:text-black transition">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>
              <button className="hover:text-blue-800 transition"><Linkedin size={20} /></button>
            </div>
          </div>

          {/* SESSIONS CARD */}
          <div>
            <h4 className="text-[15px] font-bold text-slate-900 mb-3">Sessions</h4>
            
            <div className="bg-white border-[1.5px] border-[#e61b72] rounded-2xl p-4 shadow-sm relative overflow-hidden">
              {/* Card Top Row */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-[#e61b72] text-white text-[10px] font-bold px-2 py-1 rounded-md tracking-wide uppercase">
                    Foundational Track
                  </span>
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-full">
                    +2
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center text-red-500 text-[11px] font-bold gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Live
                  </span>
                  <Bookmark size={18} className="text-slate-600 cursor-pointer" />
                </div>
              </div>

              {/* Date & Time */}
              <p className="text-[11px] text-slate-500 mb-1 font-medium">15th Oct, 2024 | 10:00 AM - 05:00 PM</p>

              {/* Title */}
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-bold text-slate-900 text-[14px] leading-snug pr-4">
                  How to book meetings fully automated with the help of cold...
                </h5>
                <ChevronRight size={18} className="text-slate-400 mt-1 flex-shrink-0" />
              </div>

              {/* Location */}
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500 mb-4 pb-4 border-b border-slate-100 font-medium">
                <MapPin size={14} />
                <span>Primary Hall (Meeting room 1)</span>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-between items-center">
                {/* Avatars */}
                <div className="flex -space-x-2">
                  <img src="https://i.pravatar.cc/100?img=1" className="w-[26px] h-[26px] rounded-full border-2 border-white object-cover" alt="a1" />
                  <img src="https://i.pravatar.cc/100?img=2" className="w-[26px] h-[26px] rounded-full border-2 border-white object-cover" alt="a2" />
                  <div className="w-[26px] h-[26px] rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600 z-10 shadow-sm">
                    +3
                  </div>
                </div>
                {/* Buttons */}
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1.5 text-slate-700 text-[13px] font-semibold hover:text-black">
                    <Play size={15} /> Watch
                  </button>
                  <button className="flex items-center gap-1.5 text-slate-700 text-[13px] font-semibold hover:text-black">
                    <CalendarPlus size={15} /> Add
                  </button>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};  