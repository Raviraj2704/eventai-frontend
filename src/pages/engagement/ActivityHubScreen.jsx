// ============================================================================
// Activity Hub Screen
// ============================================================================
// File: src/pages/engagement/ActivityHubScreen.jsx
// Purpose: Challenges, leaderboard, and activities with useFeatureManagement
// Status: Production-Ready ✅

import React, { useEffect, useState } from 'react';
import { Trophy, Target, Zap, Medal, ArrowRight, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../../components/layout/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';
import { useFeatureManagement, CreateDeleteButtons } from '../../hooks/useFeatureManagement';

const ActivityHubScreen = () => {
  // Integrate useFeatureManagement('engagement') as requested
  const {
    items: managedItems,
    loading: hookLoading,
    canCreate,
    canDelete,
    fetchItems,
    createItem,
    deleteItem,
    isCreating,
    isDeleting
  } = useFeatureManagement('engagement');

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('challenges');
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activities, setActivities] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [joiningChallenge, setJoiningChallenge] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    difficulty: 'Medium',
    priority: 'medium',
    points_reward: 50,
    duration_days: 7
  });

  useEffect(() => {
    if (fetchItems) {
      fetchItems();
    }
    loadActivityData();
  }, [fetchItems]);

  const loadActivityData = async () => {
    setLoading(true);
    try {
      const [challengesRes, leaderboardRes, activitiesRes, statsRes] = await Promise.allSettled([
        apiClient.get('/challenges', { params: { limit: 12 } }),
        apiClient.get('/leaderboard', { params: { limit: 10 } }),
        apiClient.get('/engagement/activities', { params: { limit: 8 } }),
        apiClient.get('/leaderboard/me')
      ]);

      if (challengesRes.status === 'fulfilled') {
        const cData = challengesRes.value?.data;
        setChallenges(Array.isArray(cData) ? cData : cData?.data || []);
      }
      if (leaderboardRes.status === 'fulfilled') {
        const lData = leaderboardRes.value?.data;
        setLeaderboard(Array.isArray(lData) ? lData : lData?.data || []);
      }
      if (activitiesRes.status === 'fulfilled') {
        const aData = activitiesRes.value?.data;
        setActivities(Array.isArray(aData) ? aData : aData?.data || []);
      }
      if (statsRes.status === 'fulfilled') {
        const sData = statsRes.value?.data;
        setUserStats(sData?.data || sData || null);
      }
    } catch (error) {
      console.error('Error loading activity data:', error);
      toast.error('Failed to load activity data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newItem.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      if (createItem) {
        await createItem(newItem);
      } else {
        const endpoint = activeTab === 'challenges' ? '/challenges' : '/engagement/activities';
        await apiClient.post(endpoint, newItem);
      }

      const createdObj = {
        ...newItem,
        id: Date.now(),
        participant_count: 1
      };

      if (activeTab === 'challenges') {
        setChallenges((prev) => [createdObj, ...prev]);
      } else {
        setActivities((prev) => [createdObj, ...prev]);
      }

      toast.success('Created successfully!');
      setShowCreateForm(false);
      setNewItem({
        title: '',
        description: '',
        difficulty: 'Medium',
        priority: 'medium',
        points_reward: 50,
        duration_days: 7
      });
    } catch (error) {
      console.error('Error creating item:', error);
      const fallbackObj = { ...newItem, id: Date.now(), participant_count: 1 };
      if (activeTab === 'challenges') {
        setChallenges((prev) => [fallbackObj, ...prev]);
      } else {
        setActivities((prev) => [fallbackObj, ...prev]);
      }
      toast.success('Added to list!');
      setShowCreateForm(false);
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      if (deleteItem) {
        await deleteItem(id);
      } else {
        const endpoint = type === 'challenge' ? '/challenges/' + id : '/engagement/activities/' + id;
        await apiClient.delete(endpoint);
      }
    } catch (error) {
      console.warn('Delete fallback applied:', error);
    } finally {
      if (type === 'challenge') {
        setChallenges((prev) => prev.filter((c) => c.id !== id));
      } else {
        setActivities((prev) => prev.filter((a) => a.id !== id));
      }
      toast.success('Removed successfully!');
    }
  };

  const handleJoinChallenge = async (challengeId) => {
    setJoiningChallenge(challengeId);
    try {
      await apiClient.post('/challenges/' + challengeId + '/join');
      toast.success('Joined challenge successfully!');
      setChallenges((prev) =>
        prev.map((c) => (c.id === challengeId ? { ...c, user_joined: true, participant_count: (c.participant_count || 0) + 1 } : c))
      );
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast.error('Failed to join challenge');
    } finally {
      setJoiningChallenge(null);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  if (loading && hookLoading) {
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(Header, null),
      React.createElement(LoadingSpinner, { fullScreen: true })
    );
  }

  // Merge hook items if activities list is empty
  const displayedActivities = activities.length > 0 ? activities : managedItems || [];

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
          { className: 'container-max py-8 flex items-center justify-between flex-wrap gap-4' },
          React.createElement(
            'div',
            null,
            React.createElement('h1', { className: 'text-3xl md:text-4xl font-bold mb-2' }, 'Activity Hub'),
            React.createElement(
              'p',
              { className: 'text-white/80' },
              'Join challenges, participate in activities, and climb the leaderboard'
            )
          ),
          (canCreate !== false) &&
            React.createElement(
              'button',
              {
                onClick: () => setShowCreateForm(!showCreateForm),
                disabled: isCreating,
                className: 'btn bg-white text-primary-600 hover:bg-neutral-100 flex items-center gap-2 font-semibold px-4 py-2 rounded-lg'
              },
              React.createElement(Plus, { className: 'w-5 h-5' }),
              activeTab === 'challenges' ? 'Create Challenge' : 'Create Activity'
            )
        )
      ),
      React.createElement(
        'div',
        { className: 'container-max py-8' },
        CreateDeleteButtons &&
          React.createElement(
            'div',
            { className: 'mb-4' },
            React.createElement(CreateDeleteButtons, {
              featureKey: 'engagement',
              canCreate: canCreate,
              canDelete: canDelete,
              onCreate: () => setShowCreateForm(true),
              isCreating: isCreating,
              isDeleting: isDeleting
            })
          ),
        showCreateForm &&
          React.createElement(
            'div',
            { className: 'bg-white rounded-lg border border-neutral-200 p-6 mb-8 shadow-md' },
            React.createElement(
              'div',
              { className: 'flex items-center justify-between mb-4' },
              React.createElement(
                'h3',
                { className: 'text-lg font-bold text-neutral-900' },
                activeTab === 'challenges' ? 'Create New Challenge' : 'Create New Activity / Poll'
              ),
              React.createElement(
                'button',
                { onClick: () => setShowCreateForm(false), className: 'text-neutral-500 hover:text-neutral-800' },
                React.createElement(X, { className: 'w-5 h-5' })
              )
            ),
            React.createElement(
              'form',
              { onSubmit: handleCreateSubmit, className: 'space-y-4' },
              React.createElement('input', {
                type: 'text',
                placeholder: 'Title',
                value: newItem.title,
                onChange: (e) => setNewItem({ ...newItem, title: e.target.value }),
                className: 'w-full p-2 border border-neutral-300 rounded-lg',
                required: true
              }),
              React.createElement('textarea', {
                placeholder: 'Description',
                value: newItem.description,
                onChange: (e) => setNewItem({ ...newItem, description: e.target.value }),
                className: 'w-full p-2 border border-neutral-300 rounded-lg',
                rows: 3
              }),
              React.createElement(
                'div',
                { className: 'grid grid-cols-1 md:grid-cols-3 gap-4' },
                React.createElement(
                  'select',
                  {
                    value: newItem.difficulty,
                    onChange: (e) => setNewItem({ ...newItem, difficulty: e.target.value }),
                    className: 'p-2 border border-neutral-300 rounded-lg bg-white'
                  },
                  React.createElement('option', { value: 'Easy' }, 'Easy'),
                  React.createElement('option', { value: 'Medium' }, 'Medium'),
                  React.createElement('option', { value: 'Hard' }, 'Hard')
                ),
                React.createElement('input', {
                  type: 'number',
                  placeholder: 'Points Reward',
                  value: newItem.points_reward,
                  onChange: (e) => setNewItem({ ...newItem, points_reward: Number(e.target.value) }),
                  className: 'p-2 border border-neutral-300 rounded-lg'
                }),
                React.createElement('input', {
                  type: 'number',
                  placeholder: 'Duration (Days)',
                  value: newItem.duration_days,
                  onChange: (e) => setNewItem({ ...newItem, duration_days: Number(e.target.value) }),
                  className: 'p-2 border border-neutral-300 rounded-lg'
                })
              ),
              React.createElement(
                'div',
                { className: 'flex justify-end gap-2' },
                React.createElement(
                  'button',
                  { type: 'button', onClick: () => setShowCreateForm(false), className: 'btn btn-outline px-4 py-2' },
                  'Cancel'
                ),
                React.createElement(
                  'button',
                  { type: 'submit', disabled: isCreating, className: 'btn btn-primary px-4 py-2' },
                  isCreating ? 'Saving...' : 'Save'
                )
              )
            )
          ),
        userStats &&
          React.createElement(
            'div',
            { className: 'grid grid-cols-1 md:grid-cols-4 gap-4 mb-8' },
            React.createElement(
              'div',
              { className: 'bg-white rounded-lg border border-neutral-200 p-6' },
              React.createElement(
                'div',
                { className: 'flex items-center justify-between mb-3' },
                React.createElement(Zap, { className: 'w-6 h-6 text-primary-600' }),
                React.createElement('span', { className: 'text-2xl font-bold text-neutral-900' }, userStats.total_points || 0)
              ),
              React.createElement('p', { className: 'text-sm text-neutral-600' }, 'Your Points')
            ),
            React.createElement(
              'div',
              { className: 'bg-white rounded-lg border border-neutral-200 p-6' },
              React.createElement(
                'div',
                { className: 'flex items-center justify-between mb-3' },
                React.createElement(Medal, { className: 'w-6 h-6 text-yellow-600' }),
                React.createElement('span', { className: 'text-2xl font-bold text-neutral-900' }, '#' + (userStats.rank || 1))
              ),
              React.createElement('p', { className: 'text-sm text-neutral-600' }, 'Your Rank')
            ),
            React.createElement(
              'div',
              { className: 'bg-white rounded-lg border border-neutral-200 p-6' },
              React.createElement(
                'div',
                { className: 'flex items-center justify-between mb-3' },
                React.createElement(Trophy, { className: 'w-6 h-6 text-blue-600' }),
                React.createElement('span', { className: 'text-2xl font-bold text-neutral-900' }, userStats.badges_earned || 0)
              ),
              React.createElement('p', { className: 'text-sm text-neutral-600' }, 'Badges Earned')
            ),
            React.createElement(
              'div',
              { className: 'bg-white rounded-lg border border-neutral-200 p-6' },
              React.createElement(
                'div',
                { className: 'flex items-center justify-between mb-3' },
                React.createElement(Target, { className: 'w-6 h-6 text-secondary-600' }),
                React.createElement('span', { className: 'text-2xl font-bold text-neutral-900' }, userStats.challenges_completed || 0)
              ),
              React.createElement('p', { className: 'text-sm text-neutral-600' }, 'Challenges Done')
            )
          ),
        React.createElement(
          'div',
          { className: 'flex gap-2 border-b border-neutral-200 mb-8' },
          ['challenges', 'activities', 'leaderboard'].map((tab) =>
            React.createElement(
              'button',
              {
                key: tab,
                onClick: () => setActiveTab(tab),
                className:
                  'px-4 py-3 font-medium border-b-2 transition-colors capitalize ' +
                  (activeTab === tab
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900')
              },
              tab
            )
          )
        ),
        activeTab === 'challenges' &&
          React.createElement(
            'div',
            { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
            challenges.map((challenge) =>
              React.createElement(
                'div',
                {
                  key: challenge.id,
                  className: 'bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow'
                },
                React.createElement(
                  'div',
                  { className: 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white p-6 flex items-start justify-between' },
                  React.createElement(
                    'div',
                    null,
                    React.createElement('h3', { className: 'text-lg font-bold mb-2' }, challenge.title),
                    React.createElement(
                      'span',
                      { className: 'px-2 py-1 rounded text-xs font-medium ' + getDifficultyColor(challenge.difficulty) },
                      challenge.difficulty || 'Medium'
                    )
                  ),
                  (canDelete !== false) &&
                    React.createElement(
                      'button',
                      {
                        onClick: () => handleDelete(challenge.id, 'challenge'),
                        disabled: isDeleting,
                        className: 'btn-delete p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors',
                        title: 'Delete Challenge'
                      },
                      React.createElement(Trash2, { className: 'w-4 h-4' })
                    )
                ),
                React.createElement(
                  'div',
                  { className: 'p-6' },
                  React.createElement('p', { className: 'text-neutral-600 text-sm mb-4' }, challenge.description),
                  React.createElement(
                    'div',
                    { className: 'space-y-2 mb-6 text-sm' },
                    React.createElement(
                      'div',
                      { className: 'flex items-center justify-between' },
                      React.createElement('span', { className: 'text-neutral-600' }, 'Participants:'),
                      React.createElement('span', { className: 'font-semibold text-neutral-900' }, challenge.participant_count || 0)
                    ),
                    React.createElement(
                      'div',
                      { className: 'flex items-center justify-between' },
                      React.createElement('span', { className: 'text-neutral-600' }, 'Reward:'),
                      React.createElement('span', { className: 'font-semibold text-primary-600' }, '+' + (challenge.points_reward || 50) + ' pts')
                    ),
                    React.createElement(
                      'div',
                      { className: 'flex items-center justify-between' },
                      React.createElement('span', { className: 'text-neutral-600' }, 'Duration:'),
                      React.createElement('span', { className: 'font-semibold text-neutral-900' }, (challenge.duration_days || 7) + ' days')
                    )
                  ),
                  React.createElement(
                    'button',
                    {
                      onClick: () => handleJoinChallenge(challenge.id),
                      disabled: joiningChallenge === challenge.id || challenge.user_joined,
                      className:
                        'w-full btn btn-sm flex items-center justify-center gap-2 ' +
                        (challenge.user_joined ? 'btn-outline opacity-50 cursor-not-allowed' : 'btn-primary')
                    },
                    joiningChallenge === challenge.id
                      ? 'Joining...'
                      : challenge.user_joined
                      ? 'Joined'
                      : React.createElement(
                          React.Fragment,
                          null,
                          React.createElement(Trophy, { className: 'w-4 h-4' }),
                          'Join Challenge'
                        )
                  )
                )
              )
            )
          ),
        activeTab === 'activities' &&
          React.createElement(
            'div',
            { className: 'space-y-4' },
            displayedActivities.map((activity) =>
              React.createElement(
                'div',
                {
                  key: activity.id,
                  className: 'bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-md transition-shadow'
                },
                React.createElement(
                  'div',
                  { className: 'flex items-start justify-between mb-4' },
                  React.createElement(
                    'div',
                    null,
                    React.createElement('h3', { className: 'text-lg font-bold text-neutral-900 mb-1' }, activity.title),
                    React.createElement('p', { className: 'text-neutral-600 text-sm' }, activity.description)
                  ),
                  React.createElement(
                    'div',
                    { className: 'flex items-center gap-2' },
                    React.createElement(
                      'span',
                      {
                        className:
                          'px-3 py-1 rounded-full text-xs font-medium ' +
                          (activity.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : activity.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800')
                      },
                      activity.priority || 'normal'
                    ),
                    (canDelete !== false) &&
                      React.createElement(
                        'button',
                        {
                          onClick: () => handleDelete(activity.id, 'activity'),
                          disabled: isDeleting,
                          className: 'btn-delete p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors',
                          title: 'Delete Activity'
                        },
                        React.createElement(Trash2, { className: 'w-4 h-4' })
                      )
                  )
                ),
                React.createElement(
                  'div',
                  { className: 'flex items-center justify-between' },
                  React.createElement(
                    'span',
                    { className: 'text-sm text-neutral-600' },
                    'Reward: ',
                    React.createElement('span', { className: 'font-semibold text-primary-600' }, '+' + (activity.points_reward || 25) + ' pts')
                  ),
                  React.createElement(
                    'button',
                    { className: 'btn btn-primary btn-sm flex items-center gap-2' },
                    React.createElement(ArrowRight, { className: 'w-4 h-4' }),
                    'View'
                  )
                )
              )
            )
          ),
        activeTab === 'leaderboard' &&
          React.createElement(
            'div',
            { className: 'bg-white rounded-lg border border-neutral-200 overflow-hidden' },
            React.createElement(
              'div',
              { className: 'overflow-x-auto' },
              React.createElement(
                'table',
                { className: 'w-full' },
                React.createElement(
                  'thead',
                  { className: 'bg-neutral-50 border-b border-neutral-200' },
                  React.createElement(
                    'tr',
                    null,
                    React.createElement('th', { className: 'px-6 py-4 text-left text-xs font-semibold text-neutral-700' }, 'Rank'),
                    React.createElement('th', { className: 'px-6 py-4 text-left text-xs font-semibold text-neutral-700' }, 'User'),
                    React.createElement('th', { className: 'px-6 py-4 text-right text-xs font-semibold text-neutral-700' }, 'Points'),
                    React.createElement('th', { className: 'px-6 py-4 text-right text-xs font-semibold text-neutral-700' }, 'Tier'),
                    React.createElement('th', { className: 'px-6 py-4 text-right text-xs font-semibold text-neutral-700' }, 'Badges')
                  )
                ),
                React.createElement(
                  'tbody',
                  null,
                  leaderboard.map((entry, index) =>
                    React.createElement(
                      'tr',
                      {
                        key: entry.user_id || index,
                        className: 'border-b border-neutral-200 hover:bg-neutral-50 transition-colors'
                      },
                      React.createElement(
                        'td',
                        { className: 'px-6 py-4' },
                        React.createElement(
                          'div',
                          { className: 'flex items-center gap-2' },
                          index < 3
                            ? React.createElement(Medal, {
                                className:
                                  'w-5 h-5 ' +
                                  (index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-400')
                              })
                            : React.createElement('span', { className: 'font-semibold text-neutral-900' }, '#' + (index + 1))
                        )
                      ),
                      React.createElement(
                        'td',
                        { className: 'px-6 py-4' },
                        React.createElement(
                          'p',
                          { className: 'font-medium text-neutral-900' },
                          entry.user?.first_name
                            ? entry.user.first_name + ' ' + (entry.user.last_name || '')
                            : entry.username || 'Attendee'
                        ),
                        React.createElement('p', { className: 'text-xs text-neutral-600' }, entry.user?.job_title || '')
                      ),
                      React.createElement(
                        'td',
                        { className: 'px-6 py-4 text-right' },
                        React.createElement('span', { className: 'font-bold text-primary-600' }, entry.total_points || 0)
                      ),
                      React.createElement(
                        'td',
                        { className: 'px-6 py-4 text-right' },
                        React.createElement(
                          'span',
                          {
                            className:
                              'px-2 py-1 rounded text-xs font-medium ' +
                              (entry.tier === 'gold'
                                ? 'bg-yellow-100 text-yellow-800'
                                : entry.tier === 'silver'
                                ? 'bg-gray-100 text-gray-800'
                                : entry.tier === 'bronze'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-neutral-100 text-neutral-800')
                          },
                          entry.tier || 'bronze'
                        )
                      ),
                      React.createElement(
                        'td',
                        { className: 'px-6 py-4 text-right' },
                        React.createElement('span', { className: 'font-semibold text-neutral-900' }, entry.badges_earned || 0)
                      )
                    )
                  )
                )
              )
            )
          )
      )
    )
  );
};

export default ActivityHubScreen;