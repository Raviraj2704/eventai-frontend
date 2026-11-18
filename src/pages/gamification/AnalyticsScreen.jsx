// ============================================================================
// Analytics Screen
// ============================================================================
// File: src/pages/gamification/AnalyticsScreen.jsx
// Purpose: Personal analytics and statistics (100% Real DB Data)
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, Users, Target, Award, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../../components/layout/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';
import { useFeatureManagement } from '../../hooks/useFeatureManagement';

const AnalyticsScreen = () => {
  const { fetchItems } = useFeatureManagement('analytics');

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [chartData, setChartData] = useState({
    pointsTrend: [],
    activityDistribution: [],
    engagementByDay: []
  });

  useEffect(() => {
    if (fetchItems) {
      fetchItems();
    }
    loadAnalyticsData();
  }, [fetchItems]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/analytics/user/me');
      const rawData = response?.data?.data || response?.data || {};

      const safeAnalytics = {
        total_points: rawData.total_points ?? 0,
        sessions_attended: rawData.sessions_attended ?? 0,
        ratings_given: rawData.ratings_given ?? 0,
        posts_created: rawData.posts_created ?? 0,
        badges_earned: rawData.badges_earned ?? 0,
        challenges_completed: rawData.challenges_completed ?? 0,
        current_rank: rawData.current_rank ?? 1,
        active_days: rawData.active_days ?? 0
      };

      setAnalytics(safeAnalytics);

      // Only include activity types that have real counts > 0
      const realActivityDistribution = [
        { name: 'Sessions', value: safeAnalytics.sessions_attended },
        { name: 'Ratings', value: safeAnalytics.ratings_given },
        { name: 'Posts', value: safeAnalytics.posts_created },
        { name: 'Challenges', value: safeAnalytics.challenges_completed }
      ].filter((item) => item.value > 0);

      setChartData({
        pointsTrend: Array.isArray(rawData.points_trend) ? rawData.points_trend : [],
        activityDistribution: realActivityDistribution,
        engagementByDay: Array.isArray(rawData.engagement_by_day) ? rawData.engagement_by_day : []
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
      setAnalytics({
        total_points: 0,
        sessions_attended: 0,
        ratings_given: 0,
        posts_created: 0,
        badges_earned: 0,
        challenges_completed: 0,
        current_rank: 1,
        active_days: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <LoadingSpinner fullScreen />
      </>
    );
  }

  const COLORS = ['#0284c7', '#a855f7', '#10b981', '#f59e0b', '#ef4444'];
  const isTopTen = (analytics?.current_rank || 1) <= 10;

  return (
    <>
      <Header />
      <main className="pb-20 md:pb-0">
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
          <div className="container-max py-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Analytics</h1>
            <p className="text-white/80">Track your real-time engagement and progress</p>
          </div>
        </div>

        <div className="container-max py-8">
          {analytics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <div className="bg-white rounded-lg border border-neutral-200 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <TrendingUp className="w-6 h-6 text-primary-600" />
                    <span className="text-2xl font-bold text-neutral-900">{analytics.total_points}</span>
                  </div>
                  <p className="text-sm text-neutral-600">Total Points</p>
                </div>

                <div className="bg-white rounded-lg border border-neutral-200 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Users className="w-6 h-6 text-secondary-600" />
                    <span className="text-2xl font-bold text-neutral-900">{analytics.sessions_attended}</span>
                  </div>
                  <p className="text-sm text-neutral-600">Sessions Attended</p>
                </div>

                <div className="bg-white rounded-lg border border-neutral-200 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Award className="w-6 h-6 text-yellow-600" />
                    <span className="text-2xl font-bold text-neutral-900">{analytics.badges_earned}</span>
                  </div>
                  <p className="text-sm text-neutral-600">Badges Earned</p>
                </div>

                <div className="bg-white rounded-lg border border-neutral-200 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Target className="w-6 h-6 text-blue-600" />
                    <span className="text-2xl font-bold text-neutral-900">{analytics.challenges_completed}</span>
                  </div>
                  <p className="text-sm text-neutral-600">Challenges</p>
                </div>

                <div className="bg-white rounded-lg border border-neutral-200 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Clock className="w-6 h-6 text-green-600" />
                    <span className="text-2xl font-bold text-neutral-900">#{analytics.current_rank}</span>
                  </div>
                  <p className="text-sm text-neutral-600">Current Rank</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-lg border border-neutral-200 p-6">
                  <h3 className="text-lg font-bold text-neutral-900 mb-4">Points Trend (Last 7 Days)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.pointsTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="points"
                        stroke="#0284c7"
                        strokeWidth={2}
                        dot={{ fill: '#0284c7', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg border border-neutral-200 p-6">
                  <h3 className="text-lg font-bold text-neutral-900 mb-4">Activity Distribution</h3>
                  {chartData.activityDistribution.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-sm text-neutral-400">
                      No activity recorded yet. Attend sessions, rate talks, or post on the social wall!
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={chartData.activityDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.activityDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-8">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">Daily Actions (Last 7 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.engagementByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Bar dataKey="engagement" fill="#0284c7" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
                  <h4 className="font-semibold text-blue-900 mb-2">🔥 Weekly Activity</h4>
                  <p className="text-sm text-blue-800">
                    {analytics.active_days > 0
                      ? `You were active on ${analytics.active_days} of the last 7 days!`
                      : 'Start attending sessions or posting updates to build your weekly streak.'}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
                  <h4 className="font-semibold text-green-900 mb-2">⬆️ Leaderboard Rank</h4>
                  <p className="text-sm text-green-800">
                    {analytics.total_points > 0
                      ? `You are currently ranked #${analytics.current_rank}${isTopTen ? ' (Top 10!)' : ''}.`
                      : 'Earn your first points by checking into sessions or rating speakers.'}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6">
                  <h4 className="font-semibold text-purple-900 mb-2">🎯 Contributions</h4>
                  <p className="text-sm text-purple-800">
                    You have given {analytics.ratings_given} session {analytics.ratings_given === 1 ? 'rating' : 'ratings'} and created {analytics.posts_created} social {analytics.posts_created === 1 ? 'post' : 'posts'}.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default AnalyticsScreen;