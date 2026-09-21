// ============================================================================
// FEATURE: PAGE 12 - ACTIVITY HUB SCREEN (DARK THEME)
// ============================================================================
// File: src/pages/ActivityPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../services/api';

// ============================================================================
// INLINE COMPONENTS (Prevents missing file crashes!)
// ============================================================================
const PointsCard = ({ points, nextMilestone, pointsNeeded }) => (
  <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white shadow-lg">
    <h3 className="text-lg font-bold opacity-90">Your Total Points</h3>
    <div className="text-4xl font-extrabold my-2">{points}</div>
    <p className="text-sm opacity-80">{pointsNeeded} points needed for Level {nextMilestone}</p>
  </div>
);

const BadgeCard = ({ badge, isUnlocked }) => (
  <div className={`p-4 rounded-xl border ${isUnlocked ? 'bg-orange-500/20 border-orange-500/50' : 'bg-slate-800/80 border-slate-700 opacity-60'} flex flex-col items-center text-center`}>
    <div className="text-3xl mb-2">{badge.icon || '🏆'}</div>
    <h4 className="font-bold text-sm text-slate-200">{badge.name}</h4>
    <p className="text-xs text-slate-400 mt-1">{badge.description}</p>
  </div>
);

const LeaderboardItem = ({ rank, user, isCurrentUser }) => (
  <div className={`flex items-center gap-4 p-3 rounded-lg ${isCurrentUser ? 'bg-orange-500/20 border border-orange-500/50' : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-colors'}`}>
    <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-full ${rank <= 3 ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
      {rank}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className={`font-bold truncate ${isCurrentUser ? 'text-orange-400' : 'text-slate-200'}`}>{user.name || 'Anonymous User'}</h4>
      <p className="text-xs text-slate-400 truncate">{user.title || user.job_title || 'Professional'}</p>
    </div>
    <div className="font-bold text-orange-500 whitespace-nowrap">{user.points || 0} pts</div>
  </div>
);

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
const ActivityPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dynamic Data States
  const [userStats, setUserStats] = useState({ points: 0, sessions: 0, connections: 0 });
  const [badges, setBadges] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [activityLog, setActivityLog] = useState([]);

  const currentUserId = parseInt(localStorage.getItem('user_id'), 10);

  useEffect(() => {
    // Session Profile
    const profile = sessionStorage.getItem('userProfile');
    if (!profile) {
      setUserProfile({ firstName: "User", lastName: "", jobTitle: "Professional" });
    } else {
      setUserProfile(JSON.parse(profile));
    }
    
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all activity data safely in parallel
      const [statsRes, badgesRes, leaderboardRes, logsRes] = await Promise.allSettled([
        apiGet('/api/v1/activity/stats'),
        apiGet('/api/v1/activity/badges'),
        apiGet('/api/v1/activity/leaderboard'),
        apiGet('/api/v1/activity/logs')
      ]);

      // Map Stats
      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setUserStats({
          points: statsRes.value.points || 0,
          sessions: statsRes.value.sessions_count || 0,
          connections: statsRes.value.connections_count || 0
        });
      }

      // Map Badges
      if (badgesRes.status === 'fulfilled' && badgesRes.value) {
        setBadges(Array.isArray(badgesRes.value) ? badgesRes.value : []);
      }

      // Map Leaderboard
      if (leaderboardRes.status === 'fulfilled' && leaderboardRes.value) {
        setLeaderboardData(Array.isArray(leaderboardRes.value) ? leaderboardRes.value : []);
      }

      // Map Logs
      if (logsRes.status === 'fulfilled' && logsRes.value) {
        setActivityLog(Array.isArray(logsRes.value) ? logsRes.value : []);
      }

    } catch (err) {
      console.error('Failed to load activity data:', err);
      setError('Some activity data could not be loaded. Please refresh to try again.');
    } finally {
      setLoading(false);
    }
  };

  const getUnlockedBadges = () => badges.filter((b) => b.progress >= 100 || b.is_unlocked);
  const filteredLeaderboard = [...leaderboardData].sort((a, b) => (b.points || 0) - (a.points || 0));
  const unlockedBadges = getUnlockedBadges();
  const userPoints = userStats.points;
  const pointsNeeded = 100 - (userPoints % 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 pb-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header & Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/hub')} 
            className="p-2 bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 transition"
            aria-label="Go back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">🎮 Activity Hub</h1>
            <p className="text-slate-400">Track your engagement and earn badges</p>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>⚠️ {error}</span>
            <button onClick={fetchActivityData} className="underline hover:text-red-100">Retry</button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-700 overflow-x-auto mb-8 scrollbar-hide">
          {['overview', 'badges', 'leaderboard'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-semibold border-b-2 transition-all capitalize whitespace-nowrap ${
                activeTab === tab 
                ? 'border-orange-500 text-orange-500' 
                : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            <PointsCard 
              points={userPoints} 
              nextMilestone={Math.floor(userPoints / 100) + 1} 
              pointsNeeded={pointsNeeded} 
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors">
                <div className="text-2xl mb-1">📅</div>
                <p className="text-sm text-slate-400">Sessions</p>
                <p className="text-xl font-bold text-white">{userStats.sessions}</p>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors">
                <div className="text-2xl mb-1">🤝</div>
                <p className="text-sm text-slate-400">Connections</p>
                <p className="text-xl font-bold text-white">{userStats.connections}</p>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors">
                <div className="text-2xl mb-1">🏆</div>
                <p className="text-sm text-slate-400">Badges</p>
                <p className="text-xl font-bold text-white">{unlockedBadges.length}</p>
              </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-sm">
              <h3 className="text-xl font-bold mb-4 text-white">Recent Activity</h3>
              <div className="space-y-4">
                {activityLog.length > 0 ? (
                  activityLog.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-3 bg-slate-800 rounded-lg border border-slate-700/50 hover:bg-slate-750 transition-colors">
                      <div className="text-2xl">{activity.icon || '✨'}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-200 truncate">{activity.action}</p>
                        <p className="text-sm text-slate-400 truncate">{activity.description}</p>
                      </div>
                      <p className="font-bold text-green-400 whitespace-nowrap">+{activity.points}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-500">
                    <p>No recent activity found.</p>
                    <p className="text-sm mt-1">Start engaging with the event to earn points!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
              <h3 className="text-xl font-bold mb-4 text-white">Unlocked ({unlockedBadges.length}/{badges.length})</h3>
              {unlockedBadges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {unlockedBadges.map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} isUnlocked={true} />
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic py-4">No badges unlocked yet. Keep participating!</p>
              )}
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
              <h3 className="text-xl font-bold mb-4 text-white">In Progress</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {badges.filter((b) => (b.progress || 0) < 100 && !b.is_unlocked).map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} isUnlocked={false} />
                ))}
                {badges.length === 0 && (
                  <div className="col-span-full text-slate-500 italic py-4">
                    Badges are currently unavailable.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
              <h3 className="text-xl font-bold mb-6 text-white flex justify-between items-center">
                <span>Global Leaderboard</span>
                <span className="text-sm font-normal text-slate-400 px-3 py-1 bg-slate-800 rounded-full">Top Participants</span>
              </h3>
              
              <div className="space-y-3">
                {filteredLeaderboard.length > 0 ? (
                  filteredLeaderboard.map((user, index) => (
                    <LeaderboardItem 
                      key={user.id || index} 
                      rank={index + 1} 
                      user={user} 
                      isCurrentUser={user.id === currentUserId} 
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    Leaderboard data is currently unavailable.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ActivityPage;