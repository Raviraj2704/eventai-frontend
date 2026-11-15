// ============================================================================
// File: src/pages/chat/ChatDetailScreen.jsx
// Purpose: Live Conversation & Accept/Reject Logic (Fixed Layout & Delete)
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Send, Check, X, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
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
    loadMessages();
  }, [id]);

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

  const handleDelete = async (messageId) => {
    const res = await chatService.deleteMessage(messageId);
    if (res.success) {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success('Message deleted');
    } else {
      toast.error(res.error);
    }
  };

  let renderFooter = null;
  const currentState = chatState?.toLowerCase();

  if (currentState === 'received') {
    renderFooter = (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
        <p className="text-[13px] text-slate-600 font-medium text-center">To continue chat please accept request</p>
        <div className="flex justify-center gap-4">
          <button onClick={() => handleRespond('accepted')} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-full font-bold text-[14px] shadow-sm">
            <Check size={16} strokeWidth={3} /> Accept
          </button>
          <button onClick={() => handleRespond('rejected')} className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-6 py-2.5 rounded-full font-bold text-[14px] shadow-sm">
            <X size={16} strokeWidth={3} /> Reject
          </button>
        </div>
      </div>
    );
  } else if (currentState === 'sent' || currentState === 'pending') {
    renderFooter = (
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-center">
        <p className="text-[13px] text-indigo-600 font-medium">Request sent. Waiting for approval!</p>
      </div>
    );
  } else if (currentState === 'rejected' || currentState === 'blocked') {
    renderFooter = (
      <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-center justify-center gap-2">
        <AlertTriangle size={16} className="text-rose-500" />
        <p className="text-[13px] text-rose-500 font-medium">User is currently not available for chat.</p>
      </div>
    );
  } else {
    renderFooter = (
      <div className="flex items-center gap-3">
        <div className="flex-1 border border-slate-300 rounded-[20px] bg-slate-50 px-4 py-2.5 flex items-center focus-within:bg-white focus-within:border-[#0000c8] transition-colors">
          <input 
            type="text" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="w-full bg-transparent outline-none text-[15px] placeholder:text-slate-400 text-slate-900"
            disabled={sending}
          />
        </div>
        <button 
          onClick={handleSend}
          disabled={sending || !message.trim()}
          className="w-12 h-12 rounded-full bg-[#0000c8] flex items-center justify-center flex-shrink-0 shadow-md disabled:opacity-50"
        >
          {sending ? <Loader2 size={20} className="text-white animate-spin" /> : <Send size={18} className="text-white ml-1" />}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen w-full max-w-[430px] mx-auto relative pb-[120px]">
      
      {/* HEADER */}
      <div className="fixed top-0 left-0 right-0 w-full max-w-[430px] mx-auto z-[50] flex items-center px-2 py-3 border-b border-slate-100 shadow-sm bg-white">
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

      {/* CHAT BODY - FIXED LAYOUT */}
      <div className="px-4 py-6 pt-[80px] bg-slate-50 min-h-screen flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-slate-400 mt-10 text-[13px]">No messages yet. Say hello!</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === 'me';
            return (
              <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end gap-2 max-w-[95%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Bubble & Time */}
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div 
                      className={`px-4 py-2.5 text-[15px] break-words w-fit min-w-[50px] shadow-sm ${
                        isMe 
                          ? 'bg-[#0000c8] text-white rounded-[18px] rounded-br-sm' 
                          : 'bg-white border border-slate-200 text-slate-800 rounded-[18px] rounded-bl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 font-medium px-1">
                      {msg.time}
                    </span>
                  </div>

                  {/* Always Visible Delete Button */}
                  {isMe && (
                    <button 
                      onClick={() => handleDelete(msg.id)} 
                      className="p-2 mb-4 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-full flex-shrink-0 shadow-sm border border-rose-100 active:scale-95 transition-all"
                      title="Delete message"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}

                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} className="h-4 w-full" />
      </div>

      {/* FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 w-full z-[9999] bg-white border-t border-slate-200 p-3 pb-8 sm:pb-3 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)]">
        <div className="max-w-[430px] mx-auto">
          {renderFooter}
        </div>
      </div>
      
    </div>
  );
}