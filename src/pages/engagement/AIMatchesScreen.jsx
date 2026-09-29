import React, { useEffect, useState } from 'react';
import { Users, Zap, MessageCircle, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../../components/layout/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const AIMatchesScreen = () => {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processedMatches, setProcessedMatches] = useState(new Set());

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/ai/networking/matches');
      const rawData = response?.data;
      const list = Array.isArray(rawData)
        ? rawData
        : rawData?.data || rawData?.matches || [];
      setMatches(list);
    } catch (error) {
      console.error('Error loading matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (matchId) => {
    try {
      await apiClient.post(`/networking/accept-match/${matchId}`);
      setProcessedMatches((prev) => new Set([...prev, matchId]));
      moveToNextMatch();
      toast.success('Match accepted! You can now connect.');
    } catch (error) {
      console.error('Error accepting match:', error);
      toast.error('Failed to accept match');
    }
  };

  const handleSkip = () => {
    if (matches[currentIndex]) {
      setProcessedMatches((prev) => new Set([...prev, matches[currentIndex].id]));
    }
    moveToNextMatch();
  };

  const moveToNextMatch = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  if (loading) {
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(Header, null),
      React.createElement(LoadingSpinner, { fullScreen: true }),
    );
  }

  if (matches.length === 0 || currentIndex >= matches.length) {
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(Header, null),
      React.createElement(
        'main',
        { className: 'pb-20 md:pb-0' },
        React.createElement(
          'div',
          { className: 'container-max py-12 flex flex-col items-center justify-center min-h-screen text-center' },
          React.createElement(Zap, { className: 'w-16 h-16 text-primary-600 mb-4 opacity-50' }),
          React.createElement('h1', { className: 'text-2xl font-bold text-neutral-900 mb-2' }, 'No More Matches'),
          React.createElement('p', { className: 'text-neutral-600 mb-6' }, 'Come back tomorrow for more AI-powered recommendations'),
          React.createElement(
            'button',
            { onClick: loadMatches, className: 'btn btn-primary' },
            'Refresh'
          )
        )
      ),
    );
  }

  const currentMatch = matches[currentIndex];
  const matchPercentage = currentMatch.match_percentage || currentMatch.score || 85;

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
          React.createElement('h1', { className: 'text-3xl md:text-4xl font-bold mb-2' }, 'AI Matches'),
          React.createElement('p', { className: 'text-white/80' }, 'AI-powered recommendations based on your profile and interests')
        )
      ),
      React.createElement(
        'div',
        { className: 'container-max py-8' },
        React.createElement(
          'div',
          { className: 'mb-8' },
          React.createElement('p', { className: 'text-sm text-neutral-600 mb-2' }, `Match \({currentIndex + 1} of\){matches.length}`),
          React.createElement(
            'div',
            { className: 'w-full bg-neutral-200 rounded-full h-2' },
            React.createElement('div', {
              className: 'bg-primary-600 h-2 rounded-full transition-all duration-300',
              style: { width: `${((currentIndex + 1) / matches.length) * 100}%` }
            })
          )
        ),
        React.createElement(
          'div',
          { className: 'max-w-2xl mx-auto' },
          React.createElement(
            'div',
            { className: 'bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xl' },
            React.createElement('div', { className: 'h-40 bg-gradient-to-r from-primary-500 to-secondary-500' }),
            React.createElement(
              'div',
              { className: 'px-8 py-8 -mt-20 relative text-center' },
              React.createElement(
                'div',
                { className: 'w-32 h-32 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 border-4 border-white flex items-center justify-center mx-auto mb-6 overflow-hidden' },
                currentMatch.avatar_url
                  ? React.createElement('img', {
                      src: currentMatch.avatar_url,
                      alt: currentMatch.first_name || currentMatch.name,
                      className: 'w-full h-full object-cover'
                    })
                  : React.createElement(Users, { className: 'w-16 h-16 text-white' })
              ),
              React.createElement(
                'div',
                { className: 'inline-block mb-4' },
                React.createElement(
                  'div',
                  { className: 'bg-primary-100 text-primary-900 px-4 py-2 rounded-full font-bold text-lg' },
                  `${matchPercentage}% Match`
                )
              ),
              React.createElement(
                'h1',
                { className: 'text-3xl font-bold text-neutral-900 mb-1' },
                currentMatch.name || `\({currentMatch.first_name || ''}\){currentMatch.last_name || ''}`
              ),
              React.createElement('p', { className: 'text-lg text-primary-600 font-medium mb-4' }, currentMatch.job_title || currentMatch.role || ''),
              React.createElement('p', { className: 'text-neutral-600 mb-2' }, currentMatch.company || ''),
              React.createElement('p', { className: 'text-neutral-700 max-w-lg mx-auto mb-8 leading-relaxed' }, currentMatch.bio || 'No bio provided'),
              React.createElement(
                'div',
                { className: 'flex gap-4' },
                React.createElement(
                  'button',
                  {
                    onClick: handleSkip,
                    className: 'flex-1 btn btn-outline py-3 flex items-center justify-center gap-2'
                  },
                  React.createElement(X, { className: 'w-5 h-5' }),
                  'Pass'
                ),
                React.createElement(
                  'button',
                  {
                    onClick: () => handleAccept(currentMatch.id || currentMatch.user_id),
                    className: 'flex-1 btn btn-primary py-3 flex items-center justify-center gap-2'
                  },
                  React.createElement(Check, { className: 'w-5 h-5' }),
                  'Connect'
                )
              ),
              React.createElement(
                'button',
                { className: 'w-full mt-3 btn btn-ghost flex items-center justify-center gap-2' },
                React.createElement(MessageCircle, { className: 'w-5 h-5' }),
                'Send Message'
              )
            )
          )
        )
      )
    ),
  );
};

export default AIMatchesScreen;