// ============================================================================
// File: src/pages/chat/ChatDetailScreen.jsx
// Purpose: Live Conversation & Accept/Reject Logic (Full-Screen Mobile Overlay)
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Send, Check, X, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import chatService from '../../services/chatService.js';

export default function ChatDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [chatState, setChatState] = useState(searchParams.get('state') || 'active'); 
  const chatName = searchParams.get('name') || 'User';

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (chatState === 'active') {
      loadMessages();
    }
  }, [id, chatState]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    const res = await chatService.getMessages(id);
    if (res.success) {
      setMessages(res.data);
      if (res.connection_status) {
        setChatState(res.connection_status);
      }
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  };

  const handleRespond = async (statusAction) => {
    const res = await chatService.respondToRequest(id, statusAction);
    if (res.success) {
      toast.success(`Request ${statusAction}!`);
      if (statusAction === 'accepted') {
        setChatState('active');
        loadMessages();
      } else {
        navigate('/chat');
      }
    } else {
      toast.error(res.error);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    
    // Optimistic UI update
    const textToSend = message;
    const tempId = Date.now();
    setMessages(prev => [...prev, { id: tempId, text: textToSend, time: 'Sending...', sender: 'me' }]);
    setMessage('');
    setSending(true);

    const res = await chatService.sendMessage(id, textToSend);
    if (res.success) {
      setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
    } else {
      toast.error(res.error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setMessage(textToSend);
    }
    setSending(false);
  };

  return (
    // Bulletproof mobile wrapper: forces exactly 100% of the viewport height and hides any overflow
    <div className="fixed inset-0 w-full h-[100dvh] bg-white z-[60] sm:relative sm:max-w-[430px] sm:mx-auto sm:shadow-2xl overflow-hidden flex flex-col">
      
      {/* Header (Shrink-0 prevents it from squishing) */}
      <div className="flex items-center px-2 py-3 border-b border-slate-100 shadow-sm bg-white shrink-0 h-[60px]">
        <button onClick={() => navigate('/chat')} className="p-2">
          <ChevronLeft size={24} className="text-slate-800" />
        </button>
        <div className="flex items-center gap-3 ml-1">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200 uppercase">
            {chatName.substring(0,2)}
          </div>
          <h1 className="text-[17px] font-bold text-slate-800 tracking-tight truncate max-w-[200px]">{chatName}</h1>
        </div>
      </div>

      {/* Chat Body (Flex-1 allows it to take up remaining space, overflow-y-auto enables scrolling) */}
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-slate-50 flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : messages.length === 0 && chatState === 'active' ? (
          <p className="text-center text-slate-400 mt-10 text-[13px]">No messages yet. Say hello!</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
              <div 
                className={`px-4 py-3 rounded-[16px] max-w-[80%] text-[15px] ${
                  msg.sender === 'me' 
                    ? 'bg-[#2a2a2a] text-white rounded-tr-sm' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-400 mt-1.5 font-medium px-1">
                {msg.time}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} className="h-4 w-full shrink-0" />
      </div>

      {/* Dynamic Footer (Shrink-0 keeps it visible at the exact bottom) */}
      <div className="bg-white border-t border-slate-200 p-3 shrink-0 min-h-[70px]">
        
        {/* State 1: Active Chat Input */}
        {chatState === 'active' && (
          <div className="flex items-center gap-3">
            <div className="flex-1 border border-slate-200 rounded-[20px] bg-slate-50 px-4 py-2.5 flex items-center focus-within:bg-white focus-within:border-[#0000c8] transition-colors">
              <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Message..."
                className="w-full bg-transparent outline-none text-[15px] placeholder:text-slate-400"
                disabled={sending}
              />
            </div>
            <button 
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="w-11 h-11 rounded-full bg-[#0000c8] flex items-center justify-center flex-shrink-0 shadow-md disabled:opacity-50"
            >
              {sending ? <Loader2 size={18} className="text-white animate-spin" /> : <Send size={18} className="text-white ml-1" />}
            </button>
          </div>
        )}

        {/* State 2: Request Received (Accept/Reject) */}
        {chatState === 'received' && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
            <p className="text-[13px] text-slate-600 font-medium text-center">To continue chat please accept request</p>
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => handleRespond('accepted')}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 transition-colors text-white px-6 py-2.5 rounded-full font-bold text-[14px] shadow-sm"
              >
                <Check size={16} strokeWidth={3} /> Accept
              </button>
              <button 
                onClick={() => handleRespond('rejected')}
                className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 transition-colors text-white px-6 py-2.5 rounded-full font-bold text-[14px] shadow-sm"
              >
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
        {chatState === 'rejected' || chatState === 'blocked' ? (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-center justify-center gap-2">
            <AlertTriangle size={16} className="text-rose-500" />
            <p className="text-[13px] text-rose-500 font-medium">This user is currently not available for chat!</p>
          </div>
        ) : null}

      </div>
    </div>
  );
}