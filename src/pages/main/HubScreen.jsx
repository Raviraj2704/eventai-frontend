// ============================================================================
// HubScreen.jsx - PREMIUM UI UPDATE
// ============================================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../services/api';
import { 
  Megaphone, Mic, Calendar, BookOpen, Users, Handshake, 
  Briefcase, Star, BarChart2, Settings, Target, MessageSquare 
} from 'lucide-react';

export default function HubPage() {
  const navigate = useNavigate();
  const [hubData, setHubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modern feature cards with Lucide icons and route paths
  const featureCards = [
    { id: 1, title: 'Announcements', icon: <Megaphone className="w-6 h-6" />, description: 'Latest news & updates', path: '/announcements', apiEndpoint: '/announcements', color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 2, title: 'Speakers', icon: <Mic className="w-6 h-6" />, description: 'Meet the experts', path: '/speakers', apiEndpoint: '/speakers', color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 3, title: 'Schedule', icon: <Calendar className="w-6 h-6" />, description: 'Sessions and events', path: '/sessions', apiEndpoint: '/sessions', color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 4, title: 'Learning', icon: <BookOpen className="w-6 h-6" />, description: 'Boost your skills', path: '/learning-paths', apiEndpoint: '/learning_paths', color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 5, title: 'Engagement', icon: <Target className="w-6 h-6" />, description: 'Polls and quizzes', path: '/engagement-center', apiEndpoint: '/engagement/polls', color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 6, title: 'Social Wall', icon: <MessageSquare className="w-6 h-6" />, description: 'Community discussions', path: '/social-wall', apiEndpoint: '/social/posts', color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 7, title: 'Partners', icon: <Handshake className="w-6 h-6" />, description: 'Discover our partners', path: '/partners', apiEndpoint: '/partners', color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 8, title: 'Briefcase', icon: <Briefcase className="w-6 h-6" />, description: 'Your saved resources', path: '/briefcase', apiEndpoint: '/resources', color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 9, title: 'Ratings', icon: <Star className="w-6 h-6" />, description: 'View session ratings', path: '/ratings', apiEndpoint: '/ratings', color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { id: 10, title: 'Analytics', icon: <BarChart2 className="w-6 h-6" />, description: 'Your performance', path: '/analytics', apiEndpoint: '/analytics/dashboard', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 11, title: 'AI Matches', icon: <Users className="w-6 h-6" />, description: 'Networking matches', path: '/ai-matches', apiEndpoint: '/ai/networking/matches', color: 'text-red-500', bg: 'bg-red-50' },
    { id: 12, title: 'Admin', icon: <Settings className="w-6 h-6" />, description: 'Admin controls', path: '/admin', apiEndpoint: '/admin/users', color: 'text-neutral-500', bg: 'bg-neutral-50' }
  ];

  useEffect(() => {
    loadHubData();
  }, []);

  const loadHubData = async () => {
    try {
      setLoading(true);
      setError(null);
      setHubData({ name: 'NextGen AI Expo 2026', description: 'Innovation Hub', location: 'Online' });
    } catch (err) {
      console.error('Failed to load hub data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureClick = async (feature) => {
    if (!feature.apiEndpoint || feature.path === '/admin') {
      navigate(feature.path);
      return;
    }
    try {
      await apiGet(feature.apiEndpoint);
      navigate(feature.path);
    } catch (err) {
      console.warn('API endpoint warning:', err);
      navigate(feature.path); // Fallback navigation even if pre-fetch fails
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <p className="text-neutral-500 font-medium">Loading hub features...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Premium Header Widget */}
      <div className="bg-blue-600 text-white px-6 py-8 rounded-b-3xl shadow-sm mb-6">
        <h1 className="text-2xl font-bold">{hubData?.name || 'NextGen AI Expo'}</h1>
        <p className="text-blue-100 mt-1">{hubData?.description || 'Innovation Hub'}</p>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-lg font-bold text-neutral-900 mb-4">Hub Features</h2>
        
        {/* Premium White-Card Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {featureCards.map((feature) => (
            <button
              key={feature.id}
              onClick={() => handleFeatureClick(feature)}
              className="bg-white rounded-xl p-5 shadow-sm border border-neutral-100 hover:shadow-md hover:border-blue-200 transition-all text-left flex flex-col group"
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${feature.bg} ${feature.color} group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="font-bold text-neutral-900 text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-neutral-500 leading-snug">{feature.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}