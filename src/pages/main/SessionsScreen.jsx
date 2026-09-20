import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import SessionCard from '../../components/SessionCard'; // <-- Updated this path!
import apiClient from '../../config/apiClient';
import CreateSessionForm from '../../components/CreateSessionForm'; // <-- Added form import

const SessionsScreen = () => {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // <-- Added modal state

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Filter sessions when search query or filter changes
  useEffect(() => {
    filterSessions();
  }, [searchQuery, selectedFilter, sessions]);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/sessions?limit=50');
      setSessions(response.data || []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError('Failed to load sessions. Please try again.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const filterSessions = () => {
    let filtered = sessions;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (session) =>
          session.title?.toLowerCase().includes(query) ||
          session.speaker_name?.toLowerCase().includes(query) ||
          session.description?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter((session) => session.category === selectedFilter);
    }

    setFilteredSessions(filtered);
  };

  // Skeleton loader for session cards
  const SkeletonCard = () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden animate-pulse border border-slate-200 dark:border-slate-700">
      <div className="bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 h-24"></div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-3/4"></div>
        <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-1/2"></div>
        <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-full"></div>
      </div>
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 h-10 bg-slate-300 dark:bg-slate-600 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header - Updated with Flexbox and Create Button */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 pt-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Sessions</h1>
          <p className="text-blue-100">Browse and discover {sessions.length || '0'} sessions</p>
        </div>
        
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-sm"
        >
          + Create Session
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search sessions, speakers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative w-full">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:text-white"
            >
              <Filter size={18} />
              <span className="text-sm font-medium">
                {selectedFilter === 'all' ? 'All Sessions' : selectedFilter}
              </span>
              <ChevronDown size={16} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </button>

            {filterOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg z-50">
                <button
                  onClick={() => {
                    setSelectedFilter('all');
                    setFilterOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors dark:text-white font-medium"
                >
                  All Sessions
                </button>
                <button
                  onClick={() => {
                    setSelectedFilter('Technical');
                    setFilterOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors dark:text-white"
                >
                  Technical
                </button>
                <button
                  onClick={() => {
                    setSelectedFilter('Workshop');
                    setFilterOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors dark:text-white"
                >
                  Workshop
                </button>
                <button
                  onClick={() => {
                    setSelectedFilter('Networking');
                    setFilterOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors dark:text-white"
                >
                  Networking
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg">
            {error}
            <button
              onClick={fetchSessions}
              className="ml-3 underline font-medium hover:no-underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State - Skeleton Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredSessions.length > 0 ? (
          <>
            <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              Showing {filteredSessions.length} of {sessions.length} sessions
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onSessionUpdate={fetchSessions}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
              {searchQuery
                ? `No sessions found matching "${searchQuery}"`
                : 'No sessions available yet'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            
            {/* Close Button (X) */}
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 z-10"
            >
              ✕
            </button>

            {/* Your Form Component */}
            <div className="p-2">
              <CreateSessionForm 
                onSuccess={() => {
                  setIsCreateModalOpen(false); 
                  fetchSessions();             
                }} 
              />
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default SessionsScreen;