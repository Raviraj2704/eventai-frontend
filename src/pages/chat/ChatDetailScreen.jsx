// ============================================================================
// File: src/pages/chat/ChatDetailScreen.jsx
// Purpose: Matches the dynamic chat UI (Active, Accept/Reject, Pending)
// ============================================================================

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Send, Check, X, AlertTriangle } from 'lucide-react';

export default function ChatDetailScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chatState = searchParams.get('state') || 'active'; 
  const chatName = searchParams.get('name') || 'User Name';

  const [message, setMessage] = useState('');
  
  // Mock Messages to match the UI
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hi', time: '21 Jun, 10:23 AM', sender: 'them' },
    { id: 2, text: 'Hello', time: '21 Jun, 12:20 AM', sender: 'them' },
    { id: 3, text: 'Hello', time: '21 Jun, 12:20 AM', sender: 'me' },
    { id: 4, text: 'We are waiting for absent teammate?', time: '21 Jun, 10:23 AM', sender: 'them' },
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages([...messages, { id: Date.now(), text: message, time: 'Just now', sender: 'me' }]);
    setMessage('');
  };

  return (
    <div className="h-screen bg-white flex flex-col font-sans max-w-[430px] mx-auto shadow-xl relative">
      
      {/* Header */}
      <div className="flex items-center px-2 py-3 border-b border-slate-100 shadow-sm z-10 bg-white">
        <button onClick={() => navigate('/networking')} className="p-2">
          <ChevronLeft size={24} className="text-slate-800" />
        </button>
        <div className="flex items-center gap-3 ml-1">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200">
            {chatName.substring(0,2).toUpperCase()}
          </div>
          <h1 className="text-[17px] font-bold text-slate-800 tracking-tight">{chatName}</h1>
        </div>
      </div>

      {/* Chat Body */}
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-white flex flex-col gap-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
            <div 
              className={`px-4 py-3 rounded-[16px] max-w-[80%] text-[15px] ${
                msg.sender === 'me' 
                  ? 'bg-[#2a2a2a] text-white rounded-tr-sm' 
                  : 'bg-slate-100 text-slate-800 rounded-tl-sm'
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[10px] text-slate-400 mt-1.5 font-medium px-1">
              {msg.time}
            </span>
          </div>
        ))}
      </div>

      {/* Dynamic Footer based on chat state */}
      <div className="bg-white border-t border-slate-100 p-4 pb-6">
        
        {/* State 1: Active Chat Input */}
        {chatState === 'active' && (
          <div className="flex items-center gap-3">
            <div className="flex-1 border border-slate-200 rounded-[14px] bg-white px-4 py-3 flex items-center">
              <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="w-full bg-transparent outline-none text-[15px] placeholder:text-slate-400"
              />
            </div>
            <button 
              onClick={handleSend}
              className="w-12 h-12 rounded-[12px] bg-[#0000c8] flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-900/20"
            >
              <Send size={20} className="text-white ml-1" />
            </button>
          </div>
        )}

        {/* State 2: Request Received (Accept/Reject) */}
        {chatState === 'received' && (
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-3">
            <p className="text-[13px] text-slate-600 font-medium text-center">To continue chat please accept request</p>
            <div className="flex justify-center gap-4">
              <button className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-2.5 rounded-full font-bold text-[14px] shadow-sm">
                <Check size={16} strokeWidth={3} /> Accept
              </button>
              <button className="flex items-center gap-2 bg-rose-500 text-white px-6 py-2.5 rounded-full font-bold text-[14px] shadow-sm">
                <X size={16} strokeWidth={3} /> Reject
              </button>
            </div>
          </div>
        )}

        {/* State 3: Request Sent (Waiting) */}
        {chatState === 'sent' && (
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-center">
            <p className="text-[13px] text-indigo-600 font-medium">Chat request has been sent. Waiting for approval!</p>
          </div>
        )}

        {/* State 4: Rejected / Blocked */}
        {chatState === 'blocked' && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-center justify-center gap-2">
            <AlertTriangle size={16} className="text-rose-500" />
            <p className="text-[13px] text-rose-500 font-medium">This user is currently not available for chat!</p>
          </div>
        )}

      </div>
    </div>
  );
}