// ============================================================================
// File: src/pages/chat/ChatListScreen.jsx
// Purpose: Live Chat Directory (Active, Received, Sent)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, ArrowUpDown, Loader2 } from 'lucide-react';
import chatService from '.././services/chatService';

export default function ChatListScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'received', 'sent'
  const [searchQuery, setSearchQuery] = useState('');
  
  const [chats, setChats] = useState({ active: [], received: [], sent: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const res = await chatService.getChatList();
      if (res.success) {
        setChats(res.data);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const currentList = chats[activeTab]?.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans max-w-[430px] mx-auto pb-20 relative shadow-xl">
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-slate-100">
        <button onClick={() => navigate('/home')} className="p-2 -ml-2 mr-2">
          <ChevronLeft size={24} className="text-slate-800" />
        </button>
        <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">Chats</h1>
      </div>

      {/* Sub-header & Tab Selector */}
      <div className="px-5 py-4 flex items-center justify-between">
        <h2 className="text-[18px] font-semibold text-slate-400">Total {currentList.length} Found</h2>
        
        <div className="relative group">
          <select 
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="appearance-none bg-white border border-slate-300 text-slate-700 text-[13px] font-medium py-1.5 pl-8 pr-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="active">Active Chats</option>
            <option value="received">Request Received</option>
            <option value="sent">Request Sent</option>
          </select>
          <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-5 mb-4">
        <div className="bg-slate-50 border border-slate-100 rounded-[14px] flex items-center px-4 py-3">
          <Search size={20} className="text-slate-400 mr-3" />
          <input 
            type="text" 
            placeholder="Search here" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-[15px] w-full placeholder:text-slate-400 text-slate-800"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-5">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : currentList.length === 0 ? (
          <p className="text-center text-slate-400 mt-10 text-[14px]">No chats found in this category.</p>
        ) : (
          currentList.map((chat) => (
            <div 
              key={chat.id} 
              onClick={() => navigate(`/chat/${chat.id}?state=${activeTab}&name=${encodeURIComponent(chat.name)}`)}
              className="flex items-center justify-between py-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors rounded-lg px-2 -mx-2"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[15px] border border-slate-200 uppercase">
                  {chat.avatar}
                </div>
                <div className="flex flex-col">
                  <span className="text-[16px] font-semibold text-slate-800 leading-tight">{chat.name}</span>
                  <span className="text-[13px] text-slate-400 mt-1 truncate max-w-[180px]">{chat.message}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                {chat.unread > 0 ? (
                  <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                    {chat.unread}
                  </div>
                ) : <div className="h-5"></div>}
                {chat.date && <span className="text-[11px] font-medium text-slate-400">{chat.date}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}