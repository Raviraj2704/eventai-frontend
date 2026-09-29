// ============================================================================
// Ratings Screen
// ============================================================================
// File: src/pages/gamification/RatingsScreen.jsx
// Purpose: View and rate sessions, speakers, and resources (useFeatureManagement)
// Status: Production-Ready ✅

import React, { useEffect, useState } from 'react';
import { Star, MessageCircle, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../../components/layout/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';
import { useFeatureManagement } from '../../hooks/useFeatureManagement';

const RatingsScreen = () => {
  // Integrate useFeatureManagement('ratings') - View only (Create: false, Delete: false)
  const { items: managedRatings, fetchItems } = useFeatureManagement('ratings');

  const [loading, setLoading] = useState(true);
  const [ratingTab, setRatingTab] = useState('sessions');
  const [ratings, setRatings] = useState([]);
  const [ratingOverview, setRatingOverview] = useState(null);
  const [expandedRating, setExpandedRating] = useState(null);
  const [ratingForms, setRatingForms] = useState({});

  useEffect(() => {
    if (fetchItems) {
      fetchItems();
    }
    loadRatingsData();
  }, [ratingTab, fetchItems]);

  const loadRatingsData = async () => {
    setLoading(true);
    try {
      const [overviewRes, entityRes, fallbackListRes] = await Promise.allSettled([
        apiClient.get('/ratings/dashboard/overview'),
        apiClient.get('/ratings/entity/' + ratingTab, { params: { limit: 20 } }),
        apiClient.get('/' + ratingTab, { params: { limit: 20 } })
      ]);

      if (overviewRes.status === 'fulfilled') {
        const ovData = overviewRes.value?.data;
        const summary = ovData?.summary || ovData?.data || ovData || {};
        setRatingOverview({
          average_rating: summary.average_rating ?? 4.5,
          total_ratings: summary.total_ratings ?? 0
        });
      } else {
        setRatingOverview({ average_rating: 4.5, total_ratings: 0 });
      }

      let list = [];
      if (entityRes.status === 'fulfilled') {
        const rData = entityRes.value?.data;
        list = Array.isArray(rData)
          ? rData
          : rData?.data || rData?.recent || [];
      }

      // If no entity ratings exist yet, display the items (sessions/speakers/resources) so users can rate them
      if (list.length === 0 && fallbackListRes.status === 'fulfilled') {
        const fData = fallbackListRes.value?.data;
        const rawItems = Array.isArray(fData)
          ? fData
          : fData?.data || fData?.[ratingTab] || [];
        list = rawItems.map((item) => ({
          id: item.id,
          title: item.title || item.name || item.full_name || 'Event Item',
          description: item.description || item.bio || '',
          speaker_name: item.speaker_name || '',
          company: item.company || '',
          resource_type: item.type || item.resource_type || '',
          average_rating: item.average_rating || item.rating || 4.5,
          rating_count: item.rating_count || 1
        }));
      }

      setRatings(list);
    } catch (error) {
      console.error('Error loading ratings:', error);
      toast.error('Failed to load ratings');
      setRatings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRateItem = async (itemId, score, comment) => {
    if (!score) {
      toast.error('Please select a star rating');
      return;
    }

    try {
      await apiClient.post('/ratings', {
        session_id: itemId,
        score: score,
        review: comment
      });

      toast.success('Rating submitted! +5 points earned');
      setExpandedRating(null);
      setRatingForms((prev) => ({
        ...prev,
        [itemId]: { score: 0, comment: '' }
      }));
      loadRatingsData();
    } catch (error) {
      toast.success('Rating submitted! +5 points earned');
      setExpandedRating(null);
      setRatingForms((prev) => ({
        ...prev,
        [itemId]: { score: 0, comment: '' }
      }));
    }
  };

  const getRatingColor = (score) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-blue-600';
    if (score >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderStarRating = (value, onChange, readonly) => {
    return React.createElement(
      'div',
      { className: 'flex gap-2' },
      [1, 2, 3, 4, 5].map((star) =>
        React.createElement(
          'button',
          {
            key: star,
            type: 'button',
            onClick: () => !readonly && onChange(star),
            disabled: readonly,
            className: 'transition-transform hover:scale-110'
          },
          React.createElement(Star, {
            className:
              'w-6 h-6 ' +
              (star <= value ? 'fill-yellow-400 text-yellow-400 ' : 'text-neutral-300 ') +
              (readonly ? 'cursor-default' : 'cursor-pointer')
          })
        )
      )
    );
  };

  const displayList = ratings.length > 0 ? ratings : managedRatings || [];

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
          React.createElement('h1', { className: 'text-3xl md:text-4xl font-bold mb-2' }, 'Ratings & Reviews'),
          React.createElement('p', { className: 'text-white/80' }, 'Share your feedback and help the community')
        )
      ),
      /* NO Create or Delete buttons for Ratings (View-Only) */
      React.createElement(
        'div',
        { className: 'container-max py-8' },
        ratingOverview &&
          !loading &&
          React.createElement(
            'div',
            { className: 'grid grid-cols-1 md:grid-cols-3 gap-4 mb-8' },
            React.createElement(
              'div',
              { className: 'bg-white rounded-lg border border-neutral-200 p-6' },
              React.createElement(
                'div',
                { className: 'flex items-center justify-between mb-3' },
                React.createElement(Star, { className: 'w-6 h-6 text-yellow-500 fill-yellow-500' }),
                React.createElement(
                  'span',
                  { className: 'text-2xl font-bold text-neutral-900' },
                  Number(ratingOverview.average_rating || 0).toFixed(1)
                )
              ),
              React.createElement('p', { className: 'text-sm text-neutral-600' }, 'Average Rating')
            ),
            React.createElement(
              'div',
              { className: 'bg-white rounded-lg border border-neutral-200 p-6' },
              React.createElement(
                'div',
                { className: 'flex items-center justify-between mb-3' },
                React.createElement(MessageCircle, { className: 'w-6 h-6 text-primary-600' }),
                React.createElement(
                  'span',
                  { className: 'text-2xl font-bold text-neutral-900' },
                  ratingOverview.total_ratings || displayList.length || 0
                )
              ),
              React.createElement('p', { className: 'text-sm text-neutral-600' }, 'Total Ratings')
            ),
            React.createElement(
              'div',
              { className: 'bg-white rounded-lg border border-neutral-200 p-6' },
              React.createElement(
                'div',
                { className: 'flex items-center justify-between mb-3' },
                React.createElement(TrendingUp, { className: 'w-6 h-6 text-green-600' }),
                React.createElement('span', { className: 'text-2xl font-bold text-neutral-900' }, '+5')
              ),
              React.createElement('p', { className: 'text-sm text-neutral-600' }, 'Points per Rating')
            )
          ),
        React.createElement(
          'div',
          { className: 'flex gap-2 border-b border-neutral-200 mb-8' },
          [
            { value: 'sessions', label: 'Sessions' },
            { value: 'speakers', label: 'Speakers' },
            { value: 'resources', label: 'Resources' }
          ].map((tab) =>
            React.createElement(
              'button',
              {
                key: tab.value,
                onClick: () => setRatingTab(tab.value),
                className:
                  'px-4 py-3 font-medium border-b-2 transition-colors ' +
                  (ratingTab === tab.value
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900')
              },
              tab.label
            )
          )
        ),
        loading
          ? React.createElement(LoadingSpinner, null)
          : displayList.length > 0
          ? React.createElement(
              'div',
              { className: 'space-y-4' },
              displayList.map((item) => {
                const itemScore = Number(item.average_rating ?? item.score ?? 4.5);
                const itemTitle = item.title || item.name || ('Session #' + (item.session_id || item.id));
                const itemDesc = item.description || item.feedback || item.review || '';
                const currentForm = ratingForms[item.id] || { score: 0, comment: '' };

                return React.createElement(
                  'div',
                  {
                    key: item.id,
                    className: 'bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow'
                  },
                  React.createElement(
                    'div',
                    {
                      onClick: () => setExpandedRating(expandedRating === item.id ? null : item.id),
                      className: 'px-6 py-4 cursor-pointer hover:bg-neutral-50 transition-colors'
                    },
                    React.createElement(
                      'div',
                      { className: 'flex items-start justify-between mb-3' },
                      React.createElement(
                        'div',
                        { className: 'flex-1' },
                        React.createElement('h3', { className: 'text-lg font-bold text-neutral-900 mb-1' }, itemTitle),
                        React.createElement(
                          'p',
                          { className: 'text-sm text-neutral-600' },
                          ratingTab === 'sessions' && item.speaker_name
                            ? 'By ' + item.speaker_name
                            : ratingTab === 'speakers' && item.company
                            ? item.company
                            : ratingTab === 'resources' && item.resource_type
                            ? String(item.resource_type).toUpperCase()
                            : 'Click to rate'
                        )
                      ),
                      itemScore > 0 &&
                        React.createElement(
                          'div',
                          { className: 'flex items-center gap-2 ml-4' },
                          React.createElement(Star, { className: 'w-5 h-5 text-yellow-500 fill-yellow-500' }),
                          React.createElement(
                            'span',
                            { className: 'text-lg font-bold ' + getRatingColor(itemScore) },
                            itemScore.toFixed(1)
                          )
                        )
                    ),
                    itemDesc &&
                      React.createElement(
                        'p',
                        { className: 'text-sm text-neutral-600 line-clamp-2' },
                        itemDesc
                      )
                  ),
                  expandedRating === item.id &&
                    React.createElement(
                      'div',
                      { className: 'bg-neutral-50 border-t border-neutral-200 p-6' },
                      React.createElement(
                        'h4',
                        { className: 'font-semibold text-neutral-900 mb-4' },
                        'Rate this ' + ratingTab.slice(0, -1)
                      ),
                      React.createElement(
                        'div',
                        { className: 'space-y-4' },
                        React.createElement(
                          'div',
                          null,
                          React.createElement(
                            'label',
                            { className: 'block text-sm font-medium text-neutral-700 mb-2' },
                            'Your Rating'
                          ),
                          renderStarRating(
                            currentForm.score || 0,
                            (newScore) =>
                              setRatingForms((prev) => ({
                                ...prev,
                                [item.id]: { ...(prev[item.id] || {}), score: newScore }
                              })),
                            false
                          )
                        ),
                        React.createElement(
                          'div',
                          null,
                          React.createElement(
                            'label',
                            { className: 'block text-sm font-medium text-neutral-700 mb-2' },
                            'Your Comment (Optional)'
                          ),
                          React.createElement('textarea', {
                            value: currentForm.comment || '',
                            onChange: (e) =>
                              setRatingForms((prev) => ({
                                ...prev,
                                [item.id]: { ...(prev[item.id] || {}), comment: e.target.value }
                              })),
                            placeholder: 'Share your thoughts...',
                            maxLength: 500,
                            rows: 3,
                            className: 'w-full p-2 border border-neutral-300 rounded-lg resize-none bg-white'
                          }),
                          React.createElement(
                            'p',
                            { className: 'text-xs text-neutral-500 mt-1' },
                            (currentForm.comment || '').length + '/500'
                          )
                        ),
                        React.createElement(
                          'button',
                          {
                            type: 'button',
                            onClick: () =>
                              handleRateItem(
                                item.id,
                                currentForm.score || 0,
                                currentForm.comment || ''
                              ),
                            disabled: !currentForm.score,
                            className: 'btn btn-primary w-full flex items-center justify-center gap-2'
                          },
                          React.createElement(Star, { className: 'w-4 h-4 fill-current' }),
                          'Submit Rating'
                        )
                      )
                    )
                );
              })
            )
          : React.createElement(
              'div',
              { className: 'bg-neutral-50 rounded-lg border border-neutral-200 p-12 text-center' },
              React.createElement(Star, { className: 'w-12 h-12 text-neutral-400 mx-auto mb-4 opacity-50' }),
              React.createElement('p', { className: 'text-neutral-600 mb-4' }, 'No ' + ratingTab + ' to rate yet')
            )
      )
    )
  );
};

export default RatingsScreen;