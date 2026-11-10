// ============================================================================
// NotificationsScreen.jsx - PROFESSIONAL UI MATCHING ADOBE XD
// ============================================================================
// File: frontend/src/pages/main/NotificationsScreen.jsx
// Route: /notifications
// Purpose: Display categorized and date-grouped notifications

import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Dummy data to perfectly match the Adobe XD date groupings and messages
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: 'general',
    dateGroup: '6th March',
    time: '09:30 AM',
    title: 'Keynote Session',
    message: 'We welcome you all, please proceed to Auditorium 1 for the keynote session',
    linkText: 'Know More',
    linkAction: '/sessions'
  },
  {
    id: 2,
    type: 'general',
    dateGroup: '3rd March',
    time: '10:00 AM',
    title: 'Keynote Session',
    message: 'We welcome you all, please proceed to Auditorium 1 for the keynote session',
    linkText: null,
    linkAction: null
  },
  {
    id: 3,
    type: 'personal',
    dateGroup: '6th March',
    time: '11:00 AM',
    title: 'Meeting Request',
    message: 'Rahul Khanna has requested a 1:1 meeting with you.',
    linkText: 'View Request',
    linkAction: '/networking'
  },
  {
    id: 4,
    type: 'personal',
    dateGroup: '5th March',
    time: '04:15 PM',
    title: 'Profile Approved',
    message: 'Your speaker profile details have been successfully verified.',
    linkText: 'View Profile',
    linkAction: '/profile'
  }
];

export default function NotificationsScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('general'); // 'general' or 'personal'
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Filter data based on active tab
    const filtered = MOCK_NOTIFICATIONS.filter(n => n.type === tab);
    setNotifications(filtered);
  }, [tab]);

  // Group the filtered notifications by their 'dateGroup' string
  const groupedNotifications = notifications.reduce((groups, notification) => {
    if (!groups[notification.dateGroup]) {
      groups[notification.dateGroup] = [];
    }
    groups[notification.dateGroup].push(notification);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-white font-sans max-w-[430px] mx-auto pb-24 shadow-sm border-x border-gray-100">
      
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="text-gray-800 hover:bg-gray-50 p-1 rounded-full">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Notifications</h1>
      </div>

      {/* Dual Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab('general')}
          className={`flex-1 py-3 text-[15px] font-semibold transition-all relative ${
            tab === 'general' ? 'text-[#0000c8]' : 'text-gray-500'
          }`}
        >
          General
          {tab === 'general' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0000c8]"></div>
          )}
        </button>

        <button
          onClick={() => setTab('personal')}
          className={`flex-1 py-3 text-[15px] font-semibold transition-all relative flex items-center justify-center gap-2 ${
            tab === 'personal' ? 'text-[#0000c8]' : 'text-gray-500'
          }`}
        >
          Personal
          <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            2
          </span>
          {tab === 'personal' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0000c8]"></div>
          )}
        </button>
      </div>

      {/* Notification List by Date Group */}
      <div className="px-4 pt-5 pb-6">
        {Object.keys(groupedNotifications).length === 0 ? (
          <p className="text-center text-gray-500 text-sm mt-10">No new notifications.</p>
        ) : (
          Object.keys(groupedNotifications).map((date) => (
            <div key={date} className="mb-6">
              
              {/* Date Header */}
              <h3 className="text-gray-600 font-semibold text-sm mb-3">
                {date}
              </h3>
              
              {/* Cards for this Date */}
              <div className="space-y-4">
                {groupedNotifications[date].map((item) => (
                  <div 
                    key={item.id} 
                    className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 shadow-sm"
                  >
                    <span className="text-gray-400 text-xs font-medium block mb-1">
                      {item.time}
                    </span>
                    <h4 className="text-gray-900 font-bold text-sm mb-1.5">
                      {item.title}
                    </h4>
                    <p className="text-gray-600 text-xs leading-relaxed mb-3">
                      {item.message}
                    </p>
                    
                    {item.linkText && (
                      <button 
                        onClick={() => navigate(item.linkAction)}
                        className="text-[#0000c8] text-xs font-semibold hover:underline"
                      >
                        {item.linkText}
                      </button>
                    )}
                  </div>
                ))}
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}