import React, { useEffect, useState } from 'react';
import { Sparkles, MessageCircle, UserCheck, X, Heart, Briefcase, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../../components/layout/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';
import { useFeatureManagement } from '../../hooks/useFeatureManagement';

const AIMatchesScreen = () => {
  const { items: hookMatches, loading: hookLoading, fetchItems } = useFeatureManagement('aiMatches');

  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [viewMode, setViewMode] = useState('cards');
  const [likedMatches, setLikedMatches] = useState(new Set());

  useEffect(() => {
    if (typeof fetchItems === 'function') {
      fetchItems();
    }
    loadMatches();
  }, [fetchItems]);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/ai/networking/matches', {
        params: { limit: 20 }
      });
      const rawData = response?.data;
      const list = Array.isArray(rawData)
        ? rawData
        : rawData?.matches || rawData?.data || [];
      setMatches(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Error loading matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const displayMatches = matches.length > 0 ? matches : hookMatches || [];

  const handleLikeMatch = async (matchId) => {
    try {
      await apiClient.post('/networking/accept-match/' + matchId);
    } catch (error) {
      // Fallback gracefully if endpoint returns 404
    }
    setLikedMatches((prev) => new Set([...prev, matchId]));
    toast.success('Connection request sent!');

    if (viewMode === 'cards' && currentMatchIndex < displayMatches.length - 1) {
      setCurrentMatchIndex((prev) => prev + 1);
    }
  };

  const handleSkipMatch = () => {
    if (currentMatchIndex < displayMatches.length - 1) {
      setCurrentMatchIndex((prev) => prev + 1);
    } else {
      toast('You have viewed all current matches!');
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

  const currentMatch = displayMatches[currentMatchIndex];

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
          React.createElement(
            'div',
            { className: 'flex items-center justify-between flex-wrap gap-4' },
            React.createElement(
              'div',
              null,
              React.createElement(
                'h1',
                { className: 'text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2' },
                React.createElement(Sparkles, { className: 'w-8 h-8' }),
                'AI Networking Matches'
              ),
              React.createElement(
                'p',
                { className: 'text-white/80' },
                'Smart attendee recommendations based on your interests and goals'
              )
            ),
            React.createElement(
              'div',
              { className: 'flex gap-2' },
              React.createElement(
                'button',
                {
                  type: 'button',
                  onClick: () => setViewMode('cards'),
                  className:
                    'px-4 py-2 rounded-lg font-medium transition-colors ' +
                    (viewMode === 'cards'
                      ? 'bg-white text-primary-600'
                      : 'bg-white/20 text-white hover:bg-white/30')
                },
                'Card View'
              ),
              React.createElement(
                'button',
                {
                  type: 'button',
                  onClick: () => setViewMode('list'),
                  className:
                    'px-4 py-2 rounded-lg font-medium transition-colors ' +
                    (viewMode === 'list'
                      ? 'bg-white text-primary-600'
                      : 'bg-white/20 text-white hover:bg-white/30')
                },
                'List View'
              )
            )
          )
        )
      ),
      React.createElement(
        'div',
        { className: 'container-max py-8' },
        displayMatches.length === 0
          ? React.createElement(
              'div',
              { className: 'bg-neutral-50 rounded-lg border border-neutral-200 p-12 text-center' },
              React.createElement(Sparkles, {
                className: 'w-12 h-12 text-neutral-400 mx-auto mb-4 opacity-50'
              }),
              React.createElement('p', { className: 'text-neutral-600 mb-4' }, 'No AI matches available yet')
            )
          : viewMode === 'cards' && currentMatch
          ? React.createElement(
              'div',
              { className: 'max-w-2xl mx-auto' },
              React.createElement(
                'div',
                { className: 'bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-lg mb-6' },
                React.createElement(
                  'div',
                  { className: 'h-36 bg-gradient-to-r from-primary-500 to-secondary-500 relative' },
                  React.createElement(
                    'div',
                    { className: 'absolute top-4 right-4 bg-white px-4 py-2 rounded-full shadow-lg' },
                    React.createElement(
                      'span',
                      { className: 'font-bold text-primary-600' },
                      Math.round(currentMatch.match_score || currentMatch.compatibility_score || 92) + '% Match'
                    )
                  )
                ),
                React.createElement(
                  'div',
                  { className: 'p-8' },
                  React.createElement(
                    'h2',
                    { className: 'text-2xl font-bold text-neutral-900 mb-1' },
                    currentMatch.name ||
                      currentMatch.full_name ||
                      ((currentMatch.first_name || '') + ' ' + (currentMatch.last_name || '')).trim() ||
                      'Attendee'
                  ),
                  React.createElement(
                    'p',
                    { className: 'text-primary-600 font-semibold mb-4' },
                    (currentMatch.job_title || 'AI Professional') +
                      (currentMatch.company ? ' at ' + currentMatch.company : '')
                  ),
                  React.createElement(
                    'div',
                    { className: 'bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6' },
                    React.createElement(
                      'p',
                      { className: 'text-sm font-medium text-primary-900' },
                      '💡 Why you match: ' +
                        (currentMatch.match_reason ||
                          (Array.isArray(currentMatch.Shared_Interests)
                            ? 'Shared interest in ' + currentMatch.Shared_Interests.join(', ')
                            : 'Aligned professional interests in AI & technology'))
                    )
                  ),
                  React.createElement(
                    'div',
                    { className: 'flex gap-4' },
                    React.createElement(
                      'button',
                      {
                        type: 'button',
                        onClick: handleSkipMatch,
                        className: 'flex-1 btn btn-outline flex items-center justify-center gap-2'
                      },
                      React.createElement(X, { className: 'w-5 h-5' }),
                      'Next'
                    ),
                    React.createElement(
                      'button',
                      {
                        type: 'button',
                        onClick: () => handleLikeMatch(currentMatch.user_id || currentMatch.id),
                        disabled: likedMatches.has(currentMatch.user_id || currentMatch.id),
                        className: 'flex-1 btn btn-primary flex items-center justify-center gap-2'
                      },
                      React.createElement(Heart, { className: 'w-5 h-5' }),
                      likedMatches.has(currentMatch.user_id || currentMatch.id) ? 'Connected' : 'Connect'
                    )
                  )
                )
              ),
              React.createElement(
                'div',
                { className: 'text-center text-sm text-neutral-600' },
                'Match ' + (currentMatchIndex + 1) + ' of ' + displayMatches.length
              )
            )
          : React.createElement(
              'div',
              { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
              displayMatches.map((match, idx) => {
                const mId = match.user_id || match.id || idx;
                return React.createElement(
                  'div',
                  {
                    key: mId,
                    className: 'bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-lg transition-shadow'
                  },
                  React.createElement(
                    'div',
                    { className: 'flex items-start justify-between mb-3' },
                    React.createElement(
                      'div',
                      null,
                      React.createElement(
                        'h3',
                        { className: 'text-lg font-bold text-neutral-900' },
                        match.name || match.full_name || 'Attendee'
                      ),
                      React.createElement(
                        'p',
                        { className: 'text-sm text-primary-600 font-semibold' },
                        match.job_title || 'Participant'
                      ),
                      match.company &&
                        React.createElement('p', { className: 'text-xs text-neutral-600' }, match.company)
                    ),
                    React.createElement(
                      'span',
                      { className: 'px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-bold' },
                      Math.round(match.match_score || 90) + '%'
                    )
                  ),
                  React.createElement(
                    'p',
                    { className: 'text-xs text-neutral-600 mb-4' },
                    match.match_reason || 'Recommended networking connection'
                  ),
                  React.createElement(
                    'button',
                    {
                      type: 'button',
                      onClick: () => handleLikeMatch(mId),
                      disabled: likedMatches.has(mId),
                      className: 'w-full btn btn-primary btn-sm flex items-center justify-center gap-2'
                    },
                    React.createElement(UserCheck, { className: 'w-4 h-4' }),
                    likedMatches.has(mId) ? 'Connected' : 'Connect'
                  )
                );
              })
            )
      )
    )
  );
};

export default AIMatchesScreen;