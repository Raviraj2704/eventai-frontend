import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, MessageCircle, UserPlus } from 'lucide-react';
import apiClient from '../../config/apiClient';

const NetworkingScreen = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/users?limit=50');
      setUsers(response.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users. Please try again.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.first_name?.toLowerCase().includes(query) ||
          user.last_name?.toLowerCase().includes(query) ||
          user.job_title?.toLowerCase().includes(query) ||
          user.company?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleConnect = async (userId) => {
    try {
      await apiClient.post(`/users/${userId}/connect`);
      setConnectionStatus((prev) => ({
        ...prev,
        [userId]: 'connected'
      }));
    } catch (err) {
      console.error('Connection request failed:', err);
    }
  };

  const UserSkeletonCard = () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 animate-pulse border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-3/4"></div>
          <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-full"></div>
        <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-2/3"></div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-10 bg-slate-300 dark:bg-slate-600 rounded"></div>
        <div className="flex-1 h-10 bg-slate-300 dark:bg-slate-600 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 pt-8">
        <h1 className="text-3xl font-bold mb-2">Networking</h1>
        <p className="text-blue-100">Connect and build relationships with fellow attendees</p>
      </div>

      {/* Search Bar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, job title, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
            />
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
              onClick={fetchUsers}
              className="ml-3 underline font-medium hover:no-underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <UserSkeletonCard key={i} />
            ))}
          </div>
        ) : filteredUsers.length > 0 ? (
          <>
            <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              Found {filteredUsers.length} {filteredUsers.length === 1 ? 'person' : 'people'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-slate-200 dark:border-slate-700"
                >
                  {/* Avatar Section */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {user.first_name} {user.last_name}
                      </h3>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        {user.job_title || 'Professional'}
                      </p>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="space-y-2 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    {user.company && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Briefcase size={14} />
                        <span>{user.company}</span>
                      </div>
                    )}
                    {user.location && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <MapPin size={14} />
                        <span>{user.location}</span>
                      </div>
                    )}
                    {user.mutual_interests && (
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        {user.mutual_interests} mutual interests
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConnect(user.id)}
                      disabled={connectionStatus[user.id] === 'connected'}
                      className={`flex-1 px-3 py-2 rounded font-medium text-sm transition-all duration-200 flex items-center justify-center gap-1 ${
                        connectionStatus[user.id] === 'connected'
                          ? 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300 cursor-not-allowed'
                          : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white hover:shadow-md active:scale-95'
                      }`}
                    >
                      <UserPlus size={16} />
                      <span>
                        {connectionStatus[user.id] === 'connected' ? 'Connected' : 'Connect'}
                      </span>
                    </button>
                    <button className="flex-1 px-3 py-2 bg-slate-400 hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-700 text-white rounded font-medium text-sm transition-all duration-200 hover:shadow-md active:scale-95 flex items-center justify-center gap-1">
                      <MessageCircle size={16} />
                      <span>Message</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
              {searchQuery ? `No users found matching "${searchQuery}"` : 'No users available yet'}
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
    </div>
  );
};

export default NetworkingScreen;