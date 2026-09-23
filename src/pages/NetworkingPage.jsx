import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../services/api';
import BottomNavigation from '../components/BottomNavigation';
import AttendeeCard from '../components/networking/PersonCard'; 
import '../styles/networking.css';

export const NetworkingPage = () => {
  const navigate = useNavigate();

  // ============= STATE MANAGEMENT =============
  const [activeTab, setActiveTab] = useState('networking');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [showAIMatches, setShowAIMatches] = useState(false);
  
  // Data States
  const [people, setPeople] = useState([]);
  const [filteredAttendees, setFilteredAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============= DESIGNATION OPTIONS =============
  const designations = [
    'HR Manager', 'HR Executive', 'Recruiter', 'Talent Manager',
    'HR Director', 'CHRO', 'Learning & Development', 'Compensation Manager',
  ];

  // ============= FETCH REAL DATA FROM API =============
  useEffect(() => {
    loadNetworkingData();
  }, []);

  const loadNetworkingData = async () => {
  try {
    setLoading(true);
    setError(null);

    // Get all users
    const usersData = await apiGet('/api/v1/users');
    const attendees = Array.isArray(usersData) ? usersData : [];
    setPeople(attendees);
    
    // Set initial filtered list to show everyone
    setFilteredAttendees(attendees);

    // Get designations for dropdown
    const desigData = await apiGet('/api/v1/designations');
    setDesignations(Array.isArray(desigData) ? desigData : []);

  } catch (err) {
    console.error('Failed to load attendees:', err);
    setError('Unable to load attendees. Please try again.');
    setPeople([]);
  } finally {
    setLoading(false);
  }
};

  const handleConnect = async (recipientId) => {
    try {
      await apiPost('/api/v1/connections/request', {
        recipient_id: recipientId,
        message: 'Let\'s connect at the event!'
      });
      alert('Connection request sent!');
    } catch (err) {
      console.error('Failed to send connection request:', err);
      alert('Failed to send connection request. Please try again.');
    }
  };

  // =========== FILTER LOGIC ===========
useEffect(() => {
  const applyFilters = async () => {
    try {
      // If no filters are active, show everyone
      if (!searchQuery && !selectedDesignation) {
        setFilteredAttendees(people);
        return;
      }

      let results;
      if (searchQuery) {
        // Search users via API
        results = await apiGet(`/api/v1/users/search?q=${searchQuery}`);
      } else if (selectedDesignation) {
        // Filter by designation via API
        results = await apiGet(`/api/v1/users?designation=${selectedDesignation}`);
      }
      
      setFilteredAttendees(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error("Filter request failed:", error);
    }
  };
  
  // Only run if the initial people data has been loaded
  if (people.length > 0) {
    applyFilters();
  }
}, [searchQuery, selectedDesignation, people]);

  // ============= NAVIGATION HANDLER =============
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'home') navigate('/home');
    if (tab === 'sessions') navigate('/sessions');
    if (tab === 'hub') navigate('/hub');
    if (tab === 'networking') navigate('/networking');
    if (tab === 'profile') navigate('/profile');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
        <div className="border-t-blue-500 border-4 rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 min-h-screen text-white font-sans pb-32 overflow-y-auto">
      
      {/* Header with Back Button */}
      <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md px-6 py-4 border-b border-white/10 flex justify-between items-center">
        <button 
          onClick={() => navigate('/home')}
          className="w-10 h-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-lg hover:bg-slate-800 transition-colors"
        >
          ←
        </button>
        <div className="text-center">
          <h1 className="font-bold text-lg tracking-wide">Networking</h1>
          <p className="text-xs text-slate-400">Find Connections</p>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Main Container */}
      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
            ⚠️ {error}
            <button 
              onClick={loadNetworkingData}
              className="ml-2 underline hover:text-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-4">
          <input
            type="text"
            className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500"
            placeholder="Search attendees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Designation Filter Dropdown */}
        <div className="mb-6">
          <select
            className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none focus:outline-none focus:border-blue-500"
            value={selectedDesignation}
            onChange={(e) => setSelectedDesignation(e.target.value)}
          >
            <option value="">All Designations</option>
            {designations.map((designation) => (
              <option key={designation} value={designation}>{designation}</option>
            ))}
          </select>
        </div>

        {/* AI Matches Toggle */}
        <div className="flex justify-between items-center bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center">
            <span className="mr-2">⭐</span>
            <span className="font-semibold text-blue-400">AI Matches Only</span>
          </div>
          <button
            className={`w-12 h-6 rounded-full transition-colors relative ${showAIMatches ? 'bg-blue-500' : 'bg-slate-700'}`}
            onClick={() => setShowAIMatches(!showAIMatches)}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${showAIMatches ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Results Count */}
        <div className="text-sm text-slate-400 mb-4">
          Found {filteredAttendees.length} attendee{filteredAttendees.length !== 1 ? 's' : ''}
        </div>

        {/* Attendees List */}
        <div className="networking-grid grid gap-4">
          {filteredAttendees.length > 0 ? (
            filteredAttendees.map((attendee) => (
              <AttendeeCard
                key={attendee.id}
                attendee={{
                  id: attendee.id,
                  name: attendee.full_name || 'User',
                  jobTitle: attendee.title || 'Professional',
                  company: attendee.company || 'Company',
                  avatar: attendee.avatar,
                  aiMatch: attendee.ai_match || false,
                  badges: attendee.location === 'onground' ? ['Onground'] : ['Virtual']
                }}
                onConnect={() => handleConnect(attendee.id)}
              />
            ))
          ) : (
            <div className="text-center py-10 text-slate-500">
              <p className="text-lg mb-2">No attendees found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation Component */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950">
        <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
      
    </div>
  );
};

export default NetworkingPage;