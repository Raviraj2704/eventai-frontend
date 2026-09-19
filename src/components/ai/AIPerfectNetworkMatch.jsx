import React, { useState, useEffect } from 'react';
import { Users, Sparkles, MessageCircle, UserPlus, Heart, Share2, MapPin, Briefcase, Trophy, Loader, RotateCcw } from 'lucide-react';
import apiClient from '../services/apiClient';

const AIPerfectNetworkMatch = ({ userProfile }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [connections, setConnections] = useState({});
  const [filterMode, setFilterMode] = useState('all'); // all, mentors, peers, mentees

  useEffect(() => {
    fetchNetworkMatches();
  }, [userProfile?.id, filterMode]);

  const fetchNetworkMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/ai/networking/matches?filter=${filterMode}`);
      setMatches(response.data || response.matches || []);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
      setError('Failed to find network matches');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (userId, action = 'connect') => {
    try {
      await apiClient.post(`/users/${userId}/connect`, { action });
      setConnections((prev) => ({
        ...prev,
        [userId]: true
      }));
    } catch (err) {
      console.error('Connection error:', err);
    }
  };

  const handleSkip = () => {
    if (currentIndex < matches.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSwipeLeft = () => {
    if (currentIndex < matches.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSwipeRight = async () => {
    if (matches[currentIndex]) {
      await handleConnect(matches[currentIndex].id);
      handleSkip();
    }
  };

  const handleReset = () => {
    fetchNetworkMatches();
  };

  const MatchSkeleton = () => (
    <div className="animate-pulse">
      <div className="bg-slate-300 dark:bg-slate-600 rounded-lg h-96 mb-4"></div>
      <div className="space-y-3">
        <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-3/4"></div>
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-1/2"></div>
        <div className="space-y-2 mt-4">
          <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded"></div>
          <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );

  const FilterButton = ({ label, value, icon }) => (
    <button
      onClick={() => setFilterMode(value)}
      className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
        filterMode === value
          ? 'bg-purple-500 text-white'
          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
      }`}
    >
      <span>{icon} {label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white p-6 pt-8">
        <div className="flex items-center gap-3 mb-2">
          <Users size={32} className="animate-pulse" />
          <h1 className="text-3xl font-bold">Perfect Matches</h1>
        </div>
        <p className="text-purple-100">
          AI finds professionals perfect for you to connect with
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-6">
        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <FilterButton label="All" value="all" icon="👥" />
          <FilterButton label="Mentors" value="mentors" icon="🎓" />
          <FilterButton label="Peers" value="peers" icon="⚡" />
          <FilterButton label="Mentees" value="mentees" icon="📈" />
        </div>

        {loading ? (
          <MatchSkeleton />
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">❌</div>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">{error}</p>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="text-slate-400 mx-auto mb-4" />
            <p className="text-lg text-slate-600 dark:text-slate-400">
              No matches found. Try a different filter!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Match Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border-2 border-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-700 dark:to-pink-700">
              {/* Header with badge */}
              <div className="relative">
                {/* Background */}
                <div className="h-48 bg-gradient-to-r from-purple-400 to-pink-400 relative">
                  {/* AI Match Badge */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-white dark:bg-slate-800 rounded-full px-3 py-1 shadow-lg flex items-center gap-1">
                      <Sparkles size={16} className="text-yellow-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {matches[currentIndex]?.match_percentage || 92}% Match
                      </span>
                    </div>
                  </div>

                  {/* Connection Type Badge */}
                  <div className="absolute top-4 left-4">
                    <div className={`rounded-full px-3 py-1 text-xs font-bold text-white ${
                      matches[currentIndex]?.connection_type === 'mentor'
                        ? 'bg-blue-500'
                        : matches[currentIndex]?.connection_type === 'mentee'
                        ? 'bg-green-500'
                        : 'bg-purple-500'
                    }`}>
                      {matches[currentIndex]?.connection_type === 'mentor'
                        ? '👨‍🏫 Mentor'
                        : matches[currentIndex]?.connection_type === 'mentee'
                        ? '📈 Mentee'
                        : '⚡ Peer'}
                    </div>
                  </div>
                </div>

                {/* Avatar - Overlapping */}
                <div className="flex justify-center -mt-16 relative z-10 mb-4">
                  <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-4xl font-bold text-white">
                    {matches[currentIndex]?.avatar_initials || 'AB'}
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="px-6 pb-6 text-center">
                {/* Name & Title */}
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {matches[currentIndex]?.name}
                </h2>
                <p className="text-lg text-blue-600 dark:text-blue-400 font-semibold mb-3">
                  {matches[currentIndex]?.job_title}
                </p>

                {/* Location & Company */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Briefcase size={16} />
                    <span>{matches[currentIndex]?.company}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={16} />
                    <span>{matches[currentIndex]?.location}</span>
                  </div>
                </div>

                {/* Why Match Section */}
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">
                    Why you'll click:
                  </p>
                  <p className="text-sm text-purple-800 dark:text-purple-400">
                    {matches[currentIndex]?.match_reason ||
                      "You both love React, have 5+ years of experience, and are interested in AI/ML"}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-2">
                    <Trophy size={20} className="text-yellow-500 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {matches[currentIndex]?.experience_years || 5}yr
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Experience</p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-2">
                    <Users size={20} className="text-blue-500 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {matches[currentIndex]?.connections || 234}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Connections</p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-2">
                    <Sparkles size={20} className="text-purple-500 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {matches[currentIndex]?.interests_count || 8}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Interests</p>
                  </div>
                </div>

                {/* Skills/Interests */}
                <div className="mb-6 text-left">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
                    Shared Interests
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {matches[currentIndex]?.shared_interests?.slice(0, 5).map((interest, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium"
                      >
                        {interest}
                      </span>
                    )) || [
                      <span key="1" className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">React</span>,
                      <span key="2" className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">AI/ML</span>,
                      <span key="3" className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">Web3</span>,
                      <span key="4" className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">Startups</span>,
                      <span key="5" className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">Mentoring</span>,
                    ]}
                  </div>
                </div>

                {/* Bio */}
                <div className="text-left bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 mb-6">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {matches[currentIndex]?.bio ||
                      "Passionate about building scalable applications and mentoring junior developers. Love connecting with like-minded professionals!"}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleSwipeLeft}
                    className="px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={18} />
                    Skip
                  </button>
                  <button
                    onClick={handleSwipeRight}
                    disabled={connections[matches[currentIndex]?.id]}
                    className={`px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                      connections[matches[currentIndex]?.id]
                        ? 'bg-green-500 text-white cursor-default'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover:shadow-lg active:scale-95'
                    }`}
                  >
                    {connections[matches[currentIndex]?.id] ? (
                      <>
                        <Users size={18} />
                        Connected
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        Connect
                      </>
                    )}
                  </button>
                </div>

                {/* Secondary Actions */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <button className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
                    <MessageCircle size={16} />
                    Message
                  </button>
                  <button className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
                    <Share2 size={16} />
                    Share
                  </button>
                </div>
              </div>

              {/* Footer - Progress */}
              <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 text-center">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {currentIndex + 1} of {matches.length} matches
                </p>
                <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                    style={{ width: `${((currentIndex + 1) / matches.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Keyboard Tips */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
              💡 <strong>Pro tip:</strong> Use arrow keys or swipe left/right to navigate through matches
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPerfectNetworkMatch;