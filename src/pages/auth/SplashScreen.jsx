// ============================================================================
// Auto-Routing Splash Screen (Exact SHRM Poster Design Style)
// File: src/pages/auth/SplashScreen.jsx
// ============================================================================

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Sparkles } from 'lucide-react';

const SplashScreen = () => {
  const navigate = useNavigate();

  // Auto-redirect to Login after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login', { replace: true });
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex flex-col items-center justify-center font-sans">
      
      {/* Top Right Cyan Wave */}
      <svg className="absolute -top-10 -right-10 w-72 md:w-96 opacity-90 text-cyan-400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path fill="url(#grad1)" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.1,-46.3C90.4,-33.5,96.1,-18,95.5,-3C94.9,12,88,26,79,37.8C70,49.6,58.9,59.2,46.2,66.6C33.5,74,19.2,79.2,4.3,77.7C-10.6,76.2,-25.9,68,-39.1,59.3C-52.3,50.6,-63.4,41.4,-72.1,29.7C-80.8,18,-87.1,3.8,-86.6,-10.1C-86.1,-24,-78.8,-37.6,-68.8,-48.5C-58.8,-59.4,-46.1,-67.6,-32.7,-73.9C-19.3,-80.2,-5.3,-84.6,8.8,-82.9C22.9,-81.2,30.6,-83.6,44.7,-76.4Z" transform="translate(100 100) scale(1.1)" />
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Main Content Area (Matches Poster Stack) */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-[340px] px-4 -mt-20">
        
        {/* Top Logo Mark */}
        <div className="flex items-center gap-2 mb-12">
          <Sparkles className="text-pink-500 w-8 h-8" strokeWidth={2.5} />
          <span className="text-[17px] font-black text-[#0000c8] tracking-[0.2em] uppercase">Event AI</span>
        </div>

        {/* Massive Stacked Text */}
        <div className="text-center w-full">
          <h1 className="text-[5.5rem] leading-[0.8] font-black text-[#0000c8] tracking-tighter">
            EVENT
          </h1>
          
          <div className="flex items-center justify-center my-4">
            <div className="h-[2px] bg-slate-200 flex-1"></div>
            <span className="px-4 text-[13px] font-black text-slate-400 tracking-[0.2em]">POWERED BY</span>
            <div className="h-[2px] bg-slate-200 flex-1"></div>
          </div>
          
          <h1 className="text-[6.5rem] leading-[0.8] font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-amber-500 tracking-tighter">
            AI
          </h1>
        </div>

        {/* Lower Details Block (Mimics Calendar/Location layout) */}
        <div className="mt-16 w-full space-y-6 pl-4">
          <div className="flex items-start gap-4">
            <Calendar className="text-pink-500 w-7 h-7 shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <p className="text-[15px] font-black text-slate-800 leading-tight">SMART MATCHING &</p>
              <p className="text-[15px] font-black text-slate-800 leading-tight">NETWORKING HUB</p>
            </div>
          </div>
          
          <div className="h-px w-full bg-slate-100 ml-11"></div>
          
          <div className="flex items-start gap-4">
            <MapPin className="text-pink-500 w-7 h-7 shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <p className="text-[15px] font-black text-slate-800 leading-tight">NEXT-GENERATION</p>
              <p className="text-[15px] font-black text-slate-800 leading-tight">EVENT EXPERIENCE</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Overlapping Waves (Cyan, Pink, Orange) */}
      <svg className="absolute bottom-0 left-0 w-full h-[22vh] object-cover object-bottom" preserveAspectRatio="none" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
        <path fill="#06b6d4" fillOpacity="0.8" d="M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,218.7C672,213,768,139,864,128C960,117,1056,171,1152,197.3C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        <path fill="#ec4899" fillOpacity="0.9" d="M0,128L48,149.3C96,171,192,213,288,213.3C384,213,480,171,576,149.3C672,128,768,128,864,149.3C960,171,1056,213,1152,202.7C1248,192,1344,128,1392,96L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        <path fill="#f97316" fillOpacity="1" d="M0,288L60,266.7C120,245,240,203,360,197.3C480,192,600,224,720,213.3C840,203,960,149,1080,138.7C1200,128,1320,160,1380,176L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
      </svg>
      
    </div>
  );
};

export default SplashScreen;