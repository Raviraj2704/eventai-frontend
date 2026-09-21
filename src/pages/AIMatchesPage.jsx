// ============================================================================
// FEATURE 17: PAGE 13 - AI MATCHES SCREEN (REAL API)
// ============================================================================
// File: frontend/src/pages/AIMatchesScreen.jsx
// Purpose: AI-powered networking recommendations based on compatibility

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../services/api';
import TopBar from '../components/TopBar';
import MatchFilterBar from '../components/MatchFilterBar';
import MatchCard from '../components/MatchCard';
import '../styles/ai-matches.css';

export const AIMatchesPage = () => {
  const navigate = useNavigate();

  // ============= STATE MANAGEMENT =============
  const [userProfile, setUserProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [filters, setFilters] = useState({ industry: 'all', role: 'all' });
  const [sortBy, setSortBy] = useState('compatibility');
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============= FETCH REAL DATA =============
  useEffect(() => {
    const profile = sessionStorage.getItem('userProfile');
    if (!profile) {
      setUserProfile({ name: "User", role: "attendee" });
    } else {
      setUserProfile(JSON.parse(profile));
    }

    fetchMatchesData();
  }, []);

  const fetchMatchesData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch AI matches from backend endpoint
      const res = await apiGet('/api/v1/ai/matches');
      const matchesData = Array.isArray(res) ? res : (res?.matches || res?.data || []);
      
      setMatches(matchesData);
      setFilteredMatches(matchesData);
      setSavedCount(matchesData.filter(m => m.isSaved || m.is_saved).length);
    } catch (err) {
      console.error('Failed to load AI matches:', err);
      setError('Unable to load AI matches from server.');
      setMatches([]);
      setFilteredMatches([]);
    } finally {
      setLoading(false);
    }
  };

  // ============= APPLY FILTERS =============
  const applyFilters = useCallback((filtersToApply, currentMatches, currentActiveFilter, currentSortBy) => {
    let filtered = [...currentMatches];

    // Filter by saved status
    if (currentActiveFilter === 'saved') {
      filtered = filtered.filter((m) => m.isSaved || m.is_saved);
    }

    // Filter by industry
    if (filtersToApply.industry && filtersToApply.industry !== 'all') {
      const industryMap = {
        tech: 'Technology',
        finance: 'Finance',
        healthcare: 'Healthcare',
        retail: 'Retail',
        manufacturing: 'Manufacturing',
      };
      const targetIndustry = industryMap[filtersToApply.industry] || filtersToApply.industry;
      filtered = filtered.filter((m) => m.industry?.toLowerCase() === targetIndustry.toLowerCase());
    }

    // Sort matches
    if (currentSortBy === 'compatibility') {
      filtered.sort((a, b) => (b.compatibilityScore || b.compatibility_score || 0) - (a.compatibilityScore || a.compatibility_score || 0));
    } else if (currentSortBy === 'recent') {
      filtered.reverse();
    }

    setFilteredMatches(filtered);
  }, []);

  // Update filtered list when filters, sort, or tab changes
  useEffect(() => {
    applyFilters(filters, matches, activeFilter, sortBy);
  }, [filters, matches, activeFilter, sortBy, applyFilters]);

  // ============= HANDLE FILTER CHANGE =============
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // ============= HANDLE CONNECT =============
  const handleConnect = async (matchId) => {
    try {
      await apiPost('/api/v1/connections/request', {
        recipient_id: matchId,
        message: 'Hello! Our AI match score looked great. Let\'s connect!'
      });
      alert('Connection request sent! They will receive a notification.');
    } catch (err) {
      console.error('Failed to send connection request:', err);
      alert('Failed to send connection request. Please try again.');
    }
  };

  // ============= HANDLE SAVE =============
  const handleSave = async (matchId, isSaved) => {
    try {
      // Optional API call to sync bookmark/save state with backend if route exists
      await apiPost(`/api/v1/ai/matches/${matchId}/save`, { is_saved: isSaved }).catch(() => {});

      setMatches((prevMatches) =>
        prevMatches.map((match) =>
          match.id === matchId ? { ...match, isSaved, is_saved: isSaved } : match
        )
      );

      setSavedCount((prev) => (isSaved ? prev + 1 : Math.max(0, prev - 1)));
    } catch (err) {
      console.error('Failed to update saved status:', err);
    }
  };

  // ============= HANDLE BACK =============
  const handleBack = () => {
    navigate('/hub');
  };

  // ============= HANDLE PICBOT =============
  const handlePicbot = () => {
    navigate('/picbot');
  };

  if (loading || !userProfile) {
    return (
      <div className="ai-matches-loading flex items-center justify-center min-h-screen bg-slate-950">
        <div className="ai-matches-spinner border-t-blue-500 border-4 rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  const avgCompatibility = Math.round(
    filteredMatches.reduce((sum, m) => sum + (m.compatibilityScore || m.compatibility_score || 0), 0) /
      (filteredMatches.length || 1)
  );

  return (
    <div className="ai-matches-screen bg-slate-950 min-h-screen text-white">
      {/* Top Bar */}
      <TopBar onPicbotClick={handlePicbot} notificationCount={3} />

      {/* Main Content */}
      <div className="ai-matches-content max-w-6xl mx-auto px-4 py-8">
        
        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>⚠️ {error}</span>
            <button onClick={fetchMatchesData} className="underline hover:no-underline font-semibold">Retry</button>
          </div>
        )}

        {/* Header */}
        <div className="ai-matches-header flex items-center gap-4 mb-8">
          <button
            className="ai-matches-back-button p-2 bg-slate-800 rounded-full shadow hover:bg-slate-700 transition"
            onClick={handleBack}
            aria-label="Go back"
          >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="ai-matches-header-content">
            <h1 className="ai-matches-header-title text-3xl font-bold">AI Matches</h1>
            <p className="ai-matches-header-subtitle text-slate-400">Personalized networking recommendations</p>
          </div>
          <div className="ai-matches-header-spacer" />
        </div>

        {/* Stats Cards */}
        <div className="ai-matches-stats grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="ai-matches-stat-card bg-slate-900 p-6 rounded-xl border border-white/10">
            <p className="ai-matches-stat-label text-slate-400 text-sm">Matches Found</p>
            <p className="ai-matches-stat-value text-3xl font-bold mt-1">{filteredMatches.length}</p>
          </div>
          <div className="ai-matches-stat-card bg-slate-900 p-6 rounded-xl border border-white/10">
            <p className="ai-matches-stat-label text-slate-400 text-sm">Saved</p>
            <p className="ai-matches-stat-value text-3xl font-bold mt-1">{savedCount}</p>
          </div>
          <div className="ai-matches-stat-card bg-slate-900 p-6 rounded-xl border border-white/10">
            <p className="ai-matches-stat-label text-slate-400 text-sm">Avg. Compatibility</p>
            <p className="ai-matches-stat-value text-3xl font-bold mt-1">
              {avgCompatibility}%
            </p>
          </div>
        </div>

        {/* How AI Matching Works */}
        <div className="ai-matches-info-card bg-blue-900/20 border border-blue-500/30 p-6 rounded-xl mb-8 flex gap-4 items-start">
          <div className="ai-matches-info-icon text-2xl">🤖</div>
          <div className="ai-matches-info-content">
            <h3 className="ai-matches-info-title font-bold text-blue-400 mb-1">How AI Matching Works</h3>
            <p className="ai-matches-info-text text-sm text-blue-100">
              Our AI analyzes your profile, interests, and goals to recommend professionals who share similar expertise, industry focus, or career aspirations. Each match is scored based on compatibility factors.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <MatchFilterBar onFilterChange={handleFilterChange} />

        {/* View Toggle and Sort */}
        <div className="ai-matches-controls flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 my-6">
          <div className="ai-matches-view-tabs flex gap-2">
            <button
              className={`ai-matches-view-tab px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${activeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
              onClick={() => setActiveFilter('all')}
            >
              All Matches ({matches.length})
            </button>
            <button
              className={`ai-matches-view-tab px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${activeFilter === 'saved' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
              onClick={() => setActiveFilter('saved')}
            >
              Saved ({savedCount})
            </button>
          </div>

          <div className="ai-matches-sort flex items-center gap-2">
            <label htmlFor="sort-select" className="ai-matches-sort-label text-sm text-slate-400">
              Sort by:
            </label>
            <select
              id="sort-select"
              className="ai-matches-sort-select bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="compatibility">Compatibility Score</option>
              <option value="recent">Recently Added</option>
            </select>
          </div>
        </div>

        {/* Matches Grid */}
        <div className="ai-matches-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.length > 0 ? (
            filteredMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={{
                  ...match,
                  isSaved: match.isSaved || match.is_saved,
                  compatibilityScore: match.compatibilityScore || match.compatibility_score || 0
                }}
                onConnect={handleConnect}
                onSave={handleSave}
              />
            ))
          ) : (
            <div className="ai-matches-empty-state col-span-full text-center py-16 bg-slate-900 rounded-2xl border border-white/10">
              <div className="ai-matches-empty-icon text-4xl mb-3">🔍</div>
              <p className="ai-matches-empty-title text-lg font-semibold text-white mb-1">No matches found</p>
              <p className="ai-matches-empty-text text-sm text-slate-400">
                Try adjusting your filters or check back soon for new matches!
              </p>
            </div>
          )}
        </div>

        {/* Tips Section */}
        {filteredMatches.length > 0 && (
          <div className="ai-matches-tips mt-12 bg-slate-900/50 p-6 rounded-xl border border-white/10">
            <h3 className="ai-matches-tips-title font-bold text-white mb-4">💡 Networking Tips</h3>
            <ul className="ai-matches-tips-list text-sm text-slate-400 space-y-2">
              <li>✓ Personalize your connection message with a specific detail</li>
              <li>✓ Check their profile for recent activity before connecting</li>
              <li>✓ Save interesting matches to review later</li>
              <li>✓ Schedule meetings during the event for meaningful conversations</li>
              <li>✓ Follow up after connecting with valuable insights or resources</li>
            </ul>
          </div>
        )}

        {/* Bottom Spacing */}
        <div className="ai-matches-bottom-spacing h-12" />
      </div>
    </div>
  );
};

export default AIMatchesPage;