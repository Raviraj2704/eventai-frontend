import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../services/api';
import RecommendationsList from '../components/Recommendations/RecommendationsList';

export const RecommendationsPage = () => {
  const [profile, setProfile] = useState(null);
  
  // We now store ALL recommendations here, and filter them into the 'displayed' array
  const [allRecommendations, setAllRecommendations] = useState([]);
  const [displayedRecommendations, setDisplayedRecommendations] = useState([]);
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendationType, setRecommendationType] = useState('all');
  const [showProfileForm, setShowProfileForm] = useState(false);
  
  const [formData, setFormData] = useState({
    interests: '',
    skills: '',
    industry: '',
    job_title: '',
    bio: ''
  });

  // Dynamic user ID fallback
  const currentUserId = parseInt(localStorage.getItem('user_id'), 10) || 1;

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  // When profile is ready, fetch everything
  useEffect(() => {
    if (profile && !showProfileForm) {
      fetchRecommendations();
    }
  }, [profile, showProfileForm]);

  // Handle local filtering when a button is clicked
  useEffect(() => {
    if (recommendationType === 'all') {
      setDisplayedRecommendations(allRecommendations);
    } else if (recommendationType === 'networking') {
      setDisplayedRecommendations(allRecommendations.filter(r => !r.session_id));
    } else if (recommendationType === 'interest_match') {
      setDisplayedRecommendations(allRecommendations.filter(r => r.session_id));
    } else if (recommendationType === 'skill_growth') {
      // Show sessions that mention skills in the AI reason
      setDisplayedRecommendations(allRecommendations.filter(r => 
        r.session_id && r.reason?.toLowerCase().includes('skill')
      ));
    }
  }, [recommendationType, allRecommendations]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await apiGet(`/api/v1/profiles/${currentUserId}`, {
        params: { event_id: 1 }
      });
      if (!res?.interests || res.interests === '[]') {
        setShowProfileForm(true);
      }
      setProfile(res);
    } catch (err) {
      setShowProfileForm(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (regenerate = false) => {
    try {
      setLoading(true);
      
      // Fetch BOTH sessions and networking at the same time using Promise.allSettled
      const [sessionRes, networkRes] = await Promise.allSettled([
        apiGet('/api/v1/recommendations/sessions', { params: { user_id: currentUserId, event_id: 1, limit: 10, regenerate } }),
        apiGet('/api/v1/recommendations/network', { params: { user_id: currentUserId, event_id: 1, limit: 10, regenerate } })
      ]);
      
      const sessionRecs = (sessionRes.status === 'fulfilled' && sessionRes.value?.recommendations) ? sessionRes.value.recommendations : [];
      const networkRecs = (networkRes.status === 'fulfilled' && networkRes.value?.recommendations) ? networkRes.value.recommendations : [];

      // Combine and sort them by match score
      const combined = [
        ...sessionRecs,
        ...networkRecs
      ].sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

      setAllRecommendations(combined);
      fetchStats();
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiGet('/api/v1/recommendations/stats', {
        params: { user_id: currentUserId, event_id: 1 }
      });
      setStats(res);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        user_id: currentUserId,
        event_id: 1,
        interests: formData.interests.split(',').map(i => i.trim()),
        skills: formData.skills.split(',').map(s => s.trim()),
        industry: formData.industry,
        job_title: formData.job_title,
        bio: formData.bio
      };
      
      await apiPost('/api/v1/profiles/create', payload);
      setShowProfileForm(false);
      fetchProfile();
    } catch (err) {
      console.error('Error creating profile:', err);
      alert('Failed to save profile. Please try again.');
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex justify-center items-center">
        <p className="text-gray-600 dark:text-gray-400 text-xl font-bold animate-pulse">Loading AI Engine...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🤖 AI Recommendations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Personalized suggestions powered by Groq LLaMA 3.3
          </p>
        </div>

        {showProfileForm ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 border-t-4 border-orange-500 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              📋 Tell the AI About Yourself
            </h2>
            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Interests (comma separated: AI, HR, Tech)"
                  value={formData.interests}
                  onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Skills (comma separated: Python, React)"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Industry (e.g., Technology)"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Job Title (e.g., Developer)"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors shadow-md"
              >
                Generate My Custom Recommendations
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Profile Active</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 capitalize">
                    <strong>Job:</strong> {profile?.job_title || 'N/A'} | <strong>Industry:</strong> {profile?.industry || 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => setShowProfileForm(true)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  ✏️ Edit Profile
                </button>
              </div>
            </div>

            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-b-4 border-orange-500">
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold">Total Matches</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {(stats.total_session_recommendations || 0) + (stats.total_network_recommendations || 0)}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-b-4 border-blue-500">
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold">Viewed Cards</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.viewed_sessions || 0}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-b-4 border-green-500">
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold">Session Avg Match</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stats.avg_session_score || 0}%
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-b-4 border-purple-500">
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold">Connections</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.connected || 0}</p>
                </div>
              </div>
            )}

            {/* Filter Buttons */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
              <div className="flex gap-2 flex-wrap">
                {['all', 'interest_match', 'skill_growth', 'networking'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setRecommendationType(type)}
                    className={`
                      px-4 py-2 rounded-lg font-semibold transition-all
                      ${recommendationType === type
                        ? 'bg-orange-600 text-white shadow-lg'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:border-orange-500'
                      }
                    `}
                  >
                    {type === 'all' && '📋 All'}
                    {type === 'interest_match' && '💡 Interest'}
                    {type === 'skill_growth' && '📈 Skills'}
                    {type === 'networking' && '🤝 Networking'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => fetchRecommendations(true)}
                disabled={loading}
                className="px-6 py-2 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                {loading ? '⏳ Generating...' : '🔄 Regenerate AI Matches'}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400 text-lg animate-pulse">Groq is analyzing your profile...</p>
              </div>
            ) : (
              <RecommendationsList
                recommendations={displayedRecommendations}
                onFeedback={fetchStats}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RecommendationsPage;