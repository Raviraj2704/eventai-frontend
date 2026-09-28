import React, { useEffect, useState } from 'react';
import { BookOpen, Clock, Users, Target, Check, Play, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../../components/layout/Header';
import BottomNavigation from '../../components/layout/BottomNavigation';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const LearningPathsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [paths, setPaths] = useState([]);
  const [filteredPaths, setFilteredPaths] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [expandedPath, setExpandedPath] = useState(null);
  const [enrollingPath, setEnrollingPath] = useState(null);

  useEffect(() => {
    loadLearningPaths();
  }, [selectedLevel]);

  useEffect(() => {
    filterPaths();
  }, [searchQuery, paths]);

  const loadLearningPaths = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 50,
        ...(selectedLevel && { level: selectedLevel })
      };

      const response = await apiClient.get('/learning_paths', { params });
      const rawData = response?.data;
      const list = Array.isArray(rawData)
        ? rawData
        : rawData?.data || rawData?.learning_paths || [];

      setPaths(list);
      setFilteredPaths(list);
    } catch (error) {
      console.error('Error loading learning paths:', error);
      toast.error('Failed to load learning paths');
      setPaths([]);
      setFilteredPaths([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPaths = () => {
    if (!searchQuery) {
      setFilteredPaths(paths);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = paths.filter(
      (path) =>
        path.title?.toLowerCase().includes(query) ||
        path.description?.toLowerCase().includes(query)
    );

    setFilteredPaths(filtered);
  };

  const handleEnroll = async (pathId) => {
    setEnrollingPath(pathId);
    try {
      await apiClient.post(`/learning_paths/${pathId}/enroll`);
      toast.success('Enrolled in learning path!');
      setPaths((prev) =>
        prev.map((p) => (p.id === pathId ? { ...p, user_enrolled: true } : p))
      );
    } catch (error) {
      console.error('Error enrolling:', error);
      toast.error('Failed to enroll in learning path');
    } finally {
      setEnrollingPath(null);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Header, null),
    React.createElement(
      'main',
      { className: 'pb-20 md:pb-0' },
      React.createElement(
        'div',
        { className: 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white' },
        React.createElement(
          'div',
          { className: 'container-max py-8' },
          React.createElement('h1', { className: 'text-3xl md:text-4xl font-bold mb-2' }, 'Learning Paths'),
          React.createElement('p', { className: 'text-white/80' }, 'Structured learning to boost your skills')
        )
      ),
      React.createElement(
        'div',
        { className: 'container-max py-8' },
        React.createElement(
          'div',
          { className: 'space-y-4 mb-8' },
          React.createElement(
            'div',
            { className: 'relative' },
            React.createElement(Search, { className: 'absolute left-4 top-3 w-5 h-5 text-neutral-400' }),
            React.createElement('input', {
              type: 'text',
              placeholder: 'Search learning paths...',
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: 'pl-12 bg-white w-full py-2 rounded-lg border border-neutral-200'
            })
          ),
          React.createElement(
            'div',
            { className: 'flex gap-2 flex-wrap' },
            ['', 'Beginner', 'Intermediate', 'Advanced'].map((level) =>
              React.createElement(
                'button',
                {
                  key: level,
                  onClick: () => setSelectedLevel(level),
                  className: `px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedLevel === level
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`
                },
                level || 'All Levels'
              )
            )
          )
        ),
        loading
          ? React.createElement(LoadingSpinner, null)
          : filteredPaths.length > 0
          ? React.createElement(
              'div',
              { className: 'space-y-6' },
              filteredPaths.map((path) =>
                React.createElement(
                  'div',
                  {
                    key: path.id,
                    className: 'bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow'
                  },
                  React.createElement(
                    'div',
                    {
                      onClick: () => setExpandedPath(expandedPath === path.id ? null : path.id),
                      className: 'px-6 py-4 hover:bg-neutral-50 transition-colors cursor-pointer'
                    },
                    React.createElement(
                      'div',
                      { className: 'flex items-start gap-4 mb-3' },
                      React.createElement(
                        'div',
                        { className: 'w-12 h-12 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0' },
                        React.createElement(BookOpen, { className: 'w-6 h-6 text-primary-600' })
                      ),
                      React.createElement(
                        'div',
                        { className: 'flex-1 min-w-0' },
                        React.createElement('h3', { className: 'text-lg font-bold text-neutral-900 mb-1' }, path.title),
                        React.createElement('p', { className: 'text-sm text-neutral-600 line-clamp-2' }, path.description)
                      ),
                      path.user_enrolled &&
                        React.createElement(
                          'div',
                          { className: 'flex-shrink-0 bg-green-100 px-3 py-1 rounded-full' },
                          React.createElement(
                            'span',
                            { className: 'text-xs font-semibold text-green-800 flex items-center gap-1' },
                            React.createElement(Check, { className: 'w-3 h-3' }),
                            'Enrolled'
                          )
                        )
                    ),
                    React.createElement(
                      'div',
                      { className: 'flex flex-wrap gap-4 text-xs text-neutral-600' },
                      React.createElement(
                        'div',
                        { className: 'flex items-center gap-1' },
                        React.createElement(Target, { className: 'w-4 h-4' }),
                        React.createElement(
                          'span',
                          { className: `px-2 py-1 rounded ${getDifficultyColor(path.difficulty || path.level)}` },
                          path.difficulty || path.level || 'Beginner'
                        )
                      ),
                      React.createElement(
                        'div',
                        { className: 'flex items-center gap-1' },
                        React.createElement(Clock, { className: 'w-4 h-4' }),
                        React.createElement('span', null, `${path.duration_weeks || 4} weeks`)
                      ),
                      React.createElement(
                        'div',
                        { className: 'flex items-center gap-1' },
                        React.createElement(Users, { className: 'w-4 h-4' }),
                        React.createElement('span', null, `${path.enrolled_count || 0} enrolled`)
                      ),
                      React.createElement(
                        'div',
                        null,
                        React.createElement('span', { className: 'font-semibold text-primary-600' }, `+${path.points_reward || 50} pts`)
                      )
                    )
                  ),
                  expandedPath === path.id &&
                    React.createElement(
                      'div',
                      { className: 'border-t border-neutral-200 p-6 bg-neutral-50' },
                      React.createElement(
                        'div',
                        { className: 'mb-6' },
                        React.createElement('h4', { className: 'font-semibold text-neutral-900 mb-2' }, 'About'),
                        React.createElement('p', { className: 'text-neutral-700 text-sm' }, path.description)
                      ),
                      !path.user_enrolled &&
                        React.createElement(
                          'button',
                          {
                            onClick: () => handleEnroll(path.id),
                            disabled: enrollingPath === path.id,
                            className: 'w-full btn btn-primary flex items-center justify-center gap-2'
                          },
                          enrollingPath === path.id
                            ? 'Enrolling...'
                            : React.createElement(
                                React.Fragment,
                                null,
                                React.createElement(BookOpen, { className: 'w-4 h-4' }),
                                'Start Learning'
                              )
                        )
                    )
                )
              )
            )
          : React.createElement(
              'div',
              { className: 'bg-neutral-50 rounded-lg border border-neutral-200 p-12 text-center' },
              React.createElement(BookOpen, { className: 'w-12 h-12 text-neutral-400 mx-auto mb-4 opacity-50' }),
              React.createElement(
                'p',
                { className: 'text-neutral-600 mb-4' },
                searchQuery ? 'No learning paths found' : 'No learning paths available'
              ),
              searchQuery &&
                React.createElement(
                  'button',
                  { onClick: () => setSearchQuery(''), className: 'btn btn-primary' },
                  'Clear Search'
                )
            )
      )
    ),
    React.createElement(BottomNavigation, null)
  );
};

export default LearningPathsScreen;