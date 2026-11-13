// ============================================================================
// EventAI Splash Screen - Exact Poster Design Match
// File: src/pages/auth/SplashScreen.jsx
// ============================================================================

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Sparkles } from 'lucide-react';

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    // Automatically redirect to login after 20 seconds
    const timer = setTimeout(() => {
      navigate('/login');
    }, 20000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="h-screen w-full max-w-[430px] mx-auto bg-white relative overflow-hidden flex flex-col font-sans selection:bg-none">
      
      {/* --- TOP RIGHT WAVES (Pure SVG for sharpness) --- */}
      <svg className="absolute top-0 right-0 w-[200px] h-[200px]" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M200 0H0C0 0 95 10 145 60C195 110 200 200 200 200V0Z" fill="#06b6d4" opacity="0.8"/>
        <path d="M200 0H50C50 0 115 15 155 55C195 95 200 160 200 160V0Z" fill="#3b82f6" opacity="0.9"/>
      </svg>

      {/* --- BOTTOM RIGHT WAVES (Pure SVG) --- */}
      <svg className="absolute bottom-0 right-0 w-[350px] h-[250px] transform translate-x-10 translate-y-10" viewBox="0 0 350 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M350 250V0C350 0 310 110 220 180C130 250 0 250 0 250H350Z" fill="#3b82f6" opacity="0.9"/>
        <path d="M350 250V50C350 50 280 140 190 200C100 260 20 250 20 250H350Z" fill="#d946ef" opacity="0.9"/>
        <path d="M350 250V120C350 120 250 170 160 210C70 250 40 250 40 250H350Z" fill="#f97316" opacity="0.95"/>
      </svg>

      {/* --- HEADER LOGO --- */}
      <div className="relative z-10 flex items-center gap-3 pt-16 px-8">
        {/* Custom icon combining colorful elements like the reference */}
        <div className="flex -space-x-2">
          <Sparkles className="text-rose-500 fill-rose-500" size={32} />
          <Sparkles className="text-blue-500 fill-blue-500 mt-3" size={24} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-[#0f172a] tracking-wider leading-none mb-1">
            EVENT AI
          </h1>
          <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase leading-none">
            Conference & Expo
          </p>
        </div>
      </div>

      {/* --- MAIN CENTER TEXT (POWER OF PEOPLE) --- */}
      <div className="relative z-10 flex flex-col items-center justify-center mt-20 px-4 w-full">
        {/* POWER */}
        <h2 
          className="text-[72px] font-black text-[#0a1128] tracking-tighter leading-[0.9]"
          style={{ textShadow: '0 0 45px rgba(59,130,246,0.3)' }}
        >
          POWER
        </h2>
        
        {/* - OF - */}
        <div className="flex items-center gap-3 my-1 w-full max-w-[180px]">
          <div className="h-[2px] flex-1 bg-slate-800"></div>
          <span className="text-[15px] font-black text-slate-800 tracking-widest uppercase">
            OF
          </span>
          <div className="h-[2px] flex-1 bg-slate-800"></div>
        </div>
        
        {/* PEOPLE (Gradient) */}
        <h2 className="text-[64px] font-black tracking-tighter leading-[1] text-transparent bg-clip-text bg-gradient-to-r from-[#9333ea] via-[#e11d48] to-[#ea580c]">
          PEOPLE
        </h2>
      </div>

      {/* --- DATE & LOCATION DETAILS --- */}
      <div className="relative z-10 mt-20 px-10 flex flex-col gap-8">
        
        {/* Date Row */}
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <Calendar className="text-rose-600" size={34} strokeWidth={1.5} />
          </div>
          <div className="flex flex-col">
            <p className="text-[18px] font-black text-[#0f172a] leading-none mb-1">
              26TH & 27TH
            </p>
            <p className="text-[13px] font-bold text-[#0f172a] tracking-wider leading-none">
              NOVEMBER 2026
            </p>
          </div>
        </div>

        {/* Custom Divider Line */}
        <div className="w-[80%] h-[1.5px] bg-slate-200"></div>

        {/* Location Row */}
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <MapPin className="text-slate-400" size={34} strokeWidth={1.5} />
          </div>
          <div className="flex flex-col">
            <p className="text-[16px] font-black text-[#0f172a] leading-tight">
              HI-TECH city, HYDERABAD
            </p>
            <p className="text-[12px] font-bold text-[#0f172a] tracking-wider leading-none mt-1">
              CONVENTION CENTRE
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}