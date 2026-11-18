// ============================================================================
// Analytics Screen
// ============================================================================
// File: src/pages/gamification/AnalyticsScreen.jsx
// Purpose: Personal analytics and statistics (100% Real DB Data, Clean White/Gray Theme)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { TrendingUp, Users, Target, Award, Clock, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';
import { useFeatureManagement } from '../../hooks/useFeatureManagement';

const AnalyticsScreen = () => {
  const navigate = useNavigate();
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
      <div className="min-h-screen bg-white max-w-[430px] mx-auto flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const COLORS = ['#0000c8', '#3b82f6', '#10b981', '#f59e0b', '#64748b'];
  const isTopTen = (analytics?.current_rank || 1) <= 10;

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28 font-sans text-slate-800">
      {/* Clean White Header (No EventAI logo, search, bell, avatar, or hamburger menu) */}
      <div className="sticky top-0 z-10 bg-white px-4 py-4 border-b border-slate-100 flex items-center gap-2 shadow-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="p-2 -ml-2 text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-[20px] font-bold text-slate-900 tracking-tight leading-tight">Analytics</h1>
          <p className="text-[12px] font-medium text-slate-500">Track your real-time engagement and progress</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 pt-6 space-y-6">
        {analytics && (
          <>
            {/* Stat Cards (Soft Gray Rounded Theme) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-100 rounded-[16px] p-4 col-span-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-[#0000c8]">
                    <TrendingUp size={20} />
                  </div>
                  <p className="text-[14px] font-semibold text-slate-700">Total Points</p>
                </div>
                <span className="text-[24px] font-extrabold text-slate-900">{analytics.total_points}</span>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-[16px] p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-700">
                    <Users size={18} />
                  </div>
                  <span className="text-[20px] font-extrabold text-slate-900">{analytics.sessions_attended}</span>
                </div>
                <p className="text-[13px] font-medium text-slate-600">Sessions Attended</p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-[16px] p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-700">
                    <Award size={18} />
                  </div>
                  <span className="text-[20px] font-extrabold text-slate-900">{analytics.badges_earned}</span>
                </div>
                <p className="text-[13px] font-medium text-slate-600">Badges Earned</p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-[16px] p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-700">
                    <Target size={18} />
                  </div>
                  <span className="text-[20px] font-extrabold text-slate-900">{analytics.challenges_completed}</span>
                </div>
                <p className="text-[13px] font-medium text-slate-600">Challenges</p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-[16px] p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-700">
                    <Clock size={18} />
                  </div>
                  <span className="text-[20px] font-extrabold text-slate-900">#{analytics.current_rank}</span>
                </div>
                <p className="text-[13px] font-medium text-slate-600">Current Rank</p>
              </div>
            </div>

            {/* Points Trend Chart */}
            <div className="bg-slate-50 border border-slate-100 rounded-[16px] p-5">
              <h3 className="text-[15px] font-bold text-slate-900 mb-4">Points Trend (Last 7 Days)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData.pointsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="points"
                    stroke="#0000c8"
                    strokeWidth={2.5}
                    dot={{ fill: '#0000c8', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Activity Distribution Chart */}
            <div className="bg-slate-50 border border-slate-100 rounded-[16px] p-5">
              <h3 className="text-[15px] font-bold text-slate-900 mb-4">Activity Distribution</h3>
              {chartData.activityDistribution.length === 0 ? (
                <div className="h-[180px] flex items-center justify-center text-center px-4 text-[13px] font-medium text-slate-400">
                  No activity recorded yet. Attend sessions, rate talks, or post on the social wall!
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={chartData.activityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#0000c8"
                      dataKey="value"
                    >
                      {chartData.activityDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Daily Actions Chart */}
            <div className="bg-slate-50 border border-slate-100 rounded-[16px] p-5">
              <h3 className="text-[15px] font-bold text-slate-900 mb-4">Daily Actions (Last 7 Days)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData.engagementByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="engagement" fill="#0000c8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Insights (Clean Soft-Gray Cards) */}
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-100 rounded-[16px] p-4">
                <h4 className="text-[14px] font-bold text-slate-900 mb-1">Weekly Activity</h4>
                <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
                  {analytics.active_days > 0
                    ? `You were active on ${analytics.active_days} of the last 7 days!`
                    : 'Start attending sessions or posting updates to build your weekly streak.'}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-[16px] p-4">
                <h4 className="text-[14px] font-bold text-slate-900 mb-1">Leaderboard Rank</h4>
                <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
                  {analytics.total_points > 0
                    ? `You are currently ranked #${analytics.current_rank}${isTopTen ? ' (Top 10!)' : ''}.`
                    : 'Earn your first points by checking into sessions or rating speakers.'}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-[16px] p-4">
                <h4 className="text-[14px] font-bold text-slate-900 mb-1">Contributions</h4>
                <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
                  You have given {analytics.ratings_given} session {analytics.ratings_given === 1 ? 'rating' : 'ratings'} and created {analytics.posts_created} social {analytics.posts_created === 1 ? 'post' : 'posts'}.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsScreen;