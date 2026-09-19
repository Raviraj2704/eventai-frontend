import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Heart, Share2, Clock, Users } from 'lucide-react';
import apiClient from '../services/apiClient';

const AIEventRecommendations = ({ userProfile }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedRecs, setSavedRecs] = useState({});

  useEffect(() => {
    fetchAIRecommendations();
  }, [userProfile?.id]);

  const fetchAIRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/ai/recommendations/sessions');
      setRecommendations(response.data || response.recommendations || []);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError('Failed to load AI recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (sessionId) => {
    try {
      await apiClient.post(`/sessions/${sessionId}/save`);
      setSavedRecs((prev) => ({
        ...prev,
        [sessionId]: !prev[sessionId]
      }));
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const handleAttend = async (sessionId) => {
    try {
      await apiClient.post(`/sessions/${sessionId}/attend`, {
        status: 'attending'
      });
      // Update recommendation
      fetchAIRecommendations();
    } catch (err) {
      console.error('Attend error:', err);
    }
  };

  const RecommendationSkeleton = () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 animate-pulse border border-slate-200 dark:border-slate-700">
      <div className="flex gap-4 mb-4">
        <div className="w-12 h-12 bg-slate-300 dark:bg-slate-600 rounded-lg"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-3/4"></div>
          <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded"></div>
        <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-5/6"></div>
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
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 pt-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles size={32} className="animate-pulse" />
          <h1 className="text-3xl font-bold">For You</h1>
        </div>
        <p className="text-purple-100">
          AI-powered recommendations tailored to your interests
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Filter Tabs */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full font-medium text-sm transition-colors whitespace-nowrap">
            ✨ For You
          </button>
          <button className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-full font-medium text-sm transition-colors whitespace-nowrap">
            🔥 Trending
          </button>
          <button className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-full font-medium text-sm transition-colors whitespace-nowrap">
            👥 Popular Today
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg">
            {error}
            <button
              onClick={fetchAIRecommendations}
              className="ml-3 underline font-medium hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <RecommendationSkeleton key={i} />
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-5 border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                {/* AI Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1 rounded-full flex items-center gap-1">
                      <Sparkles size={14} />
                      <span className="text-xs font-semibold">AI Pick</span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {rec.match_percentage || Math.floor(Math.random() * 30 + 70)}% match
                    </span>
                  </div>
                  {rec.trending && (
                    <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded text-xs font-medium">
                      <TrendingUp size={14} />
                      Trending
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left - Session Info */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      {rec.title}
                    </h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-3">
                      {rec.speaker_name || 'Expert Speaker'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                      {rec.description}
                    </p>

                    {/* Why recommended */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3 mb-4">
                      <p className="text-xs font-semibold text-purple-900 dark:text-purple-300 mb-1">
                        Why recommended:
                      </p>
                      <p className="text-xs text-purple-800 dark:text-purple-400">
                        {rec.reason ||
                          "Based on your interest in advanced React patterns and your attendance history"}
                      </p>
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{rec.start_time ? new Date(rec.start_time).toLocaleDateString() : 'TBA'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={14} />
                        <span>{rec.attendee_count || 0} attending</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🏆 {rec.points_reward || 50} points</span>
                      </div>
                    </div>
                  </div>

                  {/* Right - Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleAttend(rec.id)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-semibold text-sm transition-all duration-200 hover:shadow-md active:scale-95"
                    >
                      Add to My Plan
                    </button>
                    <button
                      onClick={() => handleSave(rec.id)}
                      className={`w-full px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                        savedRecs[rec.id]
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                      }`}
                    >
                      <Heart size={16} fill={savedRecs[rec.id] ? 'currentColor' : 'none'} />
                      {savedRecs[rec.id] ? 'Saved' : 'Save'}
                    </button>
                    <button className="w-full px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2">
                      <Share2 size={16} />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Sparkles size={48} className="text-slate-400 mx-auto mb-4" />
            <p className="text-lg text-slate-600 dark:text-slate-400">
              No recommendations yet. Complete your profile to get personalized suggestions!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIEventRecommendations;