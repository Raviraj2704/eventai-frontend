// ============================================================================
// FEATURE 21: PAGE 20 - LEARNING PATHS SCREEN (REAL API)
// ============================================================================
// File: frontend/src/pages/LearningPathsScreen.jsx
// Purpose: Curated learning paths for professional development

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../services/api';
import LearningPathCard from '../components/LearningPathCard';
import CourseModule from '../components/CourseModule';
import LearningPathModal from '../components/LearningPathModal';
import '../styles/learning-paths.css';

export const LearningPathsScreen = () => {
  const navigate = useNavigate();

  // ============= STATE MANAGEMENT =============
  const [userProfile, setUserProfile] = useState(null);
  const [learningPaths, setLearningPaths] = useState([]);
  const [filteredPaths, setFilteredPaths] = useState([]);
  const [enrolledPaths, setEnrolledPaths] = useState([]);
  const [userProgress, setUserProgress] = useState([]);
  
  const [selectedPath, setSelectedPath] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeLevel, setActiveLevel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============= DYNAMIC LEVEL COUNTS =============
  const levelCounts = {
    all: learningPaths.length,
    beginner: learningPaths.filter(p => p.level === 'beginner').length,
    intermediate: learningPaths.filter(p => p.level === 'intermediate').length,
    advanced: learningPaths.filter(p => p.level === 'advanced').length,
    expert: learningPaths.filter(p => p.level === 'expert').length,
  };

  const levels = [
    { id: 'all', label: 'All Levels', icon: '📊', count: levelCounts.all },
    { id: 'beginner', label: 'Beginner', icon: '🌱', count: levelCounts.beginner },
    { id: 'intermediate', label: 'Intermediate', icon: '📖', count: levelCounts.intermediate },
    { id: 'advanced', label: 'Advanced', icon: '⚡', count: levelCounts.advanced },
    { id: 'expert', label: 'Expert', icon: '🎯', count: levelCounts.expert },
  ];

  // ============= FETCH REAL DATA =============
  useEffect(() => {
    const profile = sessionStorage.getItem('userProfile');
    if (!profile) {
      setUserProfile({ name: "User", role: "attendee" });
    } else {
      setUserProfile(JSON.parse(profile));
    }

    fetchLearningData();
  }, []);

  const fetchLearningData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch paths and user's enrollments concurrently
      const [pathsRes, enrollRes, progressRes] = await Promise.allSettled([
        apiGet('/api/v1/learning-paths'),
        apiGet('/api/v1/learning-paths/enrolled'),
        apiGet('/api/v1/learning-paths/progress')
      ]);

      // Set Paths
      if (pathsRes.status === 'fulfilled' && pathsRes.value) {
        const fetchedPaths = Array.isArray(pathsRes.value) ? pathsRes.value : (pathsRes.value.paths || []);
        setLearningPaths(fetchedPaths);
        setFilteredPaths(fetchedPaths); // Default unfiltered
      }

      // Set Enrollments
      if (enrollRes.status === 'fulfilled' && enrollRes.value) {
        const fetchedEnrolled = Array.isArray(enrollRes.value) ? enrollRes.value : (enrollRes.value.enrolled || []);
        // Assuming backend returns an array of IDs or objects with id/path_id
        setEnrolledPaths(fetchedEnrolled.map(e => e.id || e.path_id || e));
      }

      // Set Progress
      if (progressRes.status === 'fulfilled' && progressRes.value) {
        setUserProgress(Array.isArray(progressRes.value) ? progressRes.value : []);
      }

    } catch (err) {
      console.error('Error fetching learning paths:', err);
      setError('Unable to load learning paths from the server.');
    } finally {
      setLoading(false);
    }
  };

  // ============= APPLY FILTERS =============
  const applyFilters = useCallback((levelId, query, paths) => {
    let filtered = [...paths];

    // Filter by level
    if (levelId !== 'all') {
      filtered = filtered.filter((p) => p.level === levelId);
    }

    // Filter by search query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.title && p.title.toLowerCase().includes(lowerQuery)) ||
          (p.description && p.description.toLowerCase().includes(lowerQuery)) ||
          (p.instructor?.name && p.instructor.name.toLowerCase().includes(lowerQuery))
      );
    }

    // Sort by rating safely
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    setFilteredPaths(filtered);
  }, []);

  // Update filters when query or level changes
  useEffect(() => {
    applyFilters(activeLevel, searchQuery, learningPaths);
  }, [activeLevel, searchQuery, learningPaths, applyFilters]);

  // ============= HANDLERS =============
  const handleLevelChange = (levelId) => {
    setActiveLevel(levelId);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleCardClick = (path) => {
    setSelectedPath(path);
    setIsModalOpen(true);
  };

  const handleEnroll = async (pathId) => {
    if (!enrolledPaths.includes(pathId)) {
      try {
        await apiPost(`/api/v1/learning-paths/${pathId}/enroll`);
        setEnrolledPaths([...enrolledPaths, pathId]);
      } catch (err) {
        console.error('Failed to enroll:', err);
        alert('Failed to enroll in the learning path. Please try again.');
      }
    }
  };

  const handleBack = () => {
    navigate('/hub');
  };

  if (loading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="border-t-orange-500 border-4 border-solid rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-12">

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4 flex-1">
            <button
              className="p-2 bg-slate-800 rounded-full shadow hover:bg-slate-700 transition"
              onClick={handleBack}
              aria-label="Go back"
            >
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Learning Paths</h1>
              <p className="text-slate-400">Professional development courses</p>
            </div>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded-full border border-slate-700 sm:block">
            <span className="font-bold text-orange-500">{enrolledPaths.length}</span> <span className="text-slate-400 text-sm">Enrolled</span>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>⚠️ {error}</span>
            <button onClick={fetchLearningData} className="underline hover:no-underline">Retry</button>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded-r-lg mb-8 flex gap-4 items-center">
          <div className="text-2xl">📚</div>
          <div>
            <h3 className="font-bold text-blue-300 mb-1">Grow Your Skills</h3>
            <p className="text-sm text-blue-100">
              Explore curated learning paths designed to help you master new skills and advance your career
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M14 14l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="Search learning paths..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Level Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {levels.map((level) => (
            <button
              key={level.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                activeLevel === level.id
                  ? 'bg-orange-500/20 border-orange-500 text-orange-500'
                  : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              onClick={() => handleLevelChange(level.id)}
            >
              <span>{level.icon}</span>
              <span>{level.label}</span>
              {level.count > 0 && (
                <span className="bg-black/20 px-2 py-0.5 rounded-full text-xs">{level.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl shadow-md p-6 border border-slate-700">
            <p className="text-slate-400 text-sm font-semibold">Total Paths</p>
            <p className="text-3xl font-bold text-white mt-2">{learningPaths.length}</p>
          </div>
          <div className="bg-slate-800 rounded-xl shadow-md p-6 border border-slate-700">
            <p className="text-slate-400 text-sm font-semibold">Enrolled</p>
            <p className="text-3xl font-bold text-white mt-2">{enrolledPaths.length}</p>
          </div>
          <div className="bg-slate-800 rounded-xl shadow-md p-6 border border-slate-700">
            <p className="text-slate-400 text-sm font-semibold">Avg. Rating</p>
            <p className="text-3xl font-bold text-yellow-400 mt-2">
              {(
                learningPaths.length > 0 
                  ? (learningPaths.reduce((sum, p) => sum + (p.rating || 0), 0) / learningPaths.length) 
                  : 0
              ).toFixed(1)}
              ⭐
            </p>
          </div>
        </div>

        {/* Learning Paths Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPaths.length > 0 ? (
            filteredPaths.map((path) => (
              <LearningPathCard
                key={path.id}
                path={path}
                onCardClick={handleCardClick}
                userProgress={userProgress}
                isEnrolled={enrolledPaths.includes(path.id)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-16 bg-slate-800 rounded-2xl border border-slate-700">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-xl font-bold text-white mb-2">No paths found</p>
              <p className="text-slate-400">
                Try adjusting your search or filters. If you are an admin, try adding some paths in the backend!
              </p>
            </div>
          )}
        </div>

        {/* Tips Section */}
        {filteredPaths.length > 0 && (
          <div className="mt-12 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">💡 Learning Tips</h3>
            <ul className="text-sm text-slate-400 space-y-2">
              <li>✓ Enroll in paths that match your skill level</li>
              <li>✓ Commit 1-2 hours per week for consistent progress</li>
              <li>✓ Complete modules in order for best results</li>
              <li>✓ Engage in peer discussions and projects</li>
              <li>✓ Earn certificates upon completion</li>
            </ul>
          </div>
        )}

      </div>

      {/* Learning Path Detail Modal */}
      <LearningPathModal
        path={selectedPath}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEnroll={handleEnroll}
        isEnrolled={
          selectedPath ? enrolledPaths.includes(selectedPath.id) : false
        }
      />
    </div>
  );
};

export default LearningPathsScreen;