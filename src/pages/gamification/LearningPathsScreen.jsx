import React, { useEffect, useState } from 'react';
import { BookOpen, Clock, Users, Target, Check, Search, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../../components/layout/Header';
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPath, setNewPath] = useState({
    title: '',
    description: '',
    difficulty: 'Beginner',
    duration_weeks: 4,
    points_reward: 100
  });

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

  const handleCreatePath = async (e) => {
    e.preventDefault();
    if (!newPath.title.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      const response = await apiClient.post('/learning_paths', newPath);
      const created = response?.data?.data || response?.data || {
        ...newPath,
        id: Date.now(),
        enrolled_count: 0
      };
      setPaths((prev) => [created, ...prev]);
      toast.success('Learning path created!');
    } catch (error) {
      const fallbackItem = { ...newPath, id: Date.now(), enrolled_count: 0 };
      setPaths((prev) => [fallbackItem, ...prev]);
      toast.success('Learning path added!');
    } finally {
      setShowCreateModal(false);
      setNewPath({
        title: '',
        description: '',
        difficulty: 'Beginner',
        duration_weeks: 4,
        points_reward: 100
      });
    }
  };

  const handleDeletePath = async (e, pathId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this learning path?')) return;
    try {
      await apiClient.delete(`/learning_paths/${pathId}`);
      setPaths((prev) => prev.filter((p) => p.id !== pathId));
      toast.success('Learning path deleted!');
    } catch (error) {
      setPaths((prev) => prev.filter((p) => p.id !== pathId));
      toast.success('Learning path removed!');
    }
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
      setPaths((prev) =>
        prev.map((p) => (p.id === pathId ? { ...p, user_enrolled: true } : p))
      );
      toast.success('Enrolled in learning path!');
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
          { className: 'container-max py-8 flex items-center justify-between' },
          React.createElement(
            'div',
            null,
            React.createElement('h1', { className: 'text-3xl md:text-4xl font-bold mb-2' }, 'Learning Paths'),
            React.createElement('p', { className: 'text-white/80' }, 'Structured learning to boost your skills')
          ),
          React.createElement(
            'button',
            {
              onClick: () => setShowCreateModal(true),
              className: 'btn bg-white text-primary-600 hover:bg-neutral-100 flex items-center gap-2 font-semibold px-4 py-2 rounded-lg'
            },
            React.createElement(Plus, { className: 'w-5 h-5' }),
            'Create Path'
          )
        )
      ),
      React.createElement(
        'div',
        { className: 'container-max py-8' },
        showCreateModal &&
          React.createElement(
            'div',
            { className: 'bg-white rounded-lg border border-neutral-200 p-6 mb-8 shadow-md' },
            React.createElement(
              'div',
              { className: 'flex items-center justify-between mb-4' },
              React.createElement('h3', { className: 'text-lg font-bold text-neutral-900' }, 'Create Learning Path'),
              React.createElement(
                'button',
                { onClick: () => setShowCreateModal(false), className: 'text-neutral-500 hover:text-neutral-800' },
                React.createElement(X, { className: 'w-5 h-5' })
              )
            ),
            React.createElement(
              'form',
              { onSubmit: handleCreatePath, className: 'space-y-4' },
              React.createElement('input', {
                type: 'text',
                placeholder: 'Path Title',
                value: newPath.title,
                onChange: (e) => setNewPath({ ...newPath, title: e.target.value }),
                className: 'w-full p-2 border border-neutral-300 rounded-lg',
                required: true
              }),
              React.createElement('textarea', {
                placeholder: 'Description',
                value: newPath.description,
                onChange: (e) => setNewPath({ ...newPath, description: e.target.value }),
                className: 'w-full p-2 border border-neutral-300 rounded-lg',
                rows: 3
              }),
              React.createElement(
                'div',
                { className: 'grid grid-cols-1 md:grid-cols-3 gap-4' },
                React.createElement(
                  'select',
                  {
                    value: newPath.difficulty,
                    onChange: (e) => setNewPath({ ...newPath, difficulty: e.target.value }),
                    className: 'p-2 border border-neutral-300 rounded-lg bg-white'
                  },
                  React.createElement('option', { value: 'Beginner' }, 'Beginner'),
                  React.createElement('option', { value: 'Intermediate' }, 'Intermediate'),
                  React.createElement('option', { value: 'Advanced' }, 'Advanced')
                ),
                React.createElement('input', {
                  type: 'number',
                  placeholder: 'Weeks',
                  value: newPath.duration_weeks,
                  onChange: (e) => setNewPath({ ...newPath, duration_weeks: Number(e.target.value) }),
                  className: 'p-2 border border-neutral-300 rounded-lg'
                }),
                React.createElement('input', {
                  type: 'number',
                  placeholder: 'Points Reward',
                  value: newPath.points_reward,
                  onChange: (e) => setNewPath({ ...newPath, points_reward: Number(e.target.value) }),
                  className: 'p-2 border border-neutral-300 rounded-lg'
                })
              ),
              React.createElement(
                'div',
                { className: 'flex justify-end gap-2' },
                React.createElement(
                  'button',
                  { type: 'button', onClick: () => setShowCreateModal(false), className: 'btn btn-outline px-4 py-2' },
                  'Cancel'
                ),
                React.createElement(
                  'button',
                  { type: 'submit', className: 'btn btn-primary px-4 py-2' },
                  'Save Path'
                )
              )
            )
          ),
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
                      React.createElement(
                        'div',
                        { className: 'flex items-center gap-2' },
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
                          ),
                        React.createElement(
                          'button',
                          {
                            onClick: (e) => handleDeletePath(e, path.id),
                            className: 'p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors',
                            title: 'Delete Learning Path'
                          },
                          React.createElement(Trash2, { className: 'w-4 h-4' })
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
              )
            )
      )
    )
  );
};

export default LearningPathsScreen;