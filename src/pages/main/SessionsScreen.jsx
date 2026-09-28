import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, Clock, MapPin, User } from 'lucide-react';
import apiClient from '../../config/apiClient';
import CreateSessionForm from '../../components/forms/CreateSessionForm';

const h = React.createElement;

const SessionCard = ({ session }) => {
  return h(
    'div',
    {
      className:
        'bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all flex flex-col justify-between'
    },
    h(
      'div',
      null,
      h(
        'div',
        {
          className:
            'bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex justify-between items-start'
        },
        h(
          'span',
          {
            className:
              'text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm'
          },
          session?.category || session?.track || 'General'
        ),
        session?.start_time || session?.time
          ? h(
              'span',
              { className: 'text-xs flex items-center gap-1 text-blue-100' },
              h(Clock, { size: 14 }),
              session.start_time || session.time
            )
          : null
      ),
      h(
        'div',
        { className: 'p-4' },
        h(
          'h3',
          {
            className:
              'text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2'
          },
          session?.title || 'Untitled Session'
        ),
        session?.speaker_name
          ? h(
              'div',
              {
                className:
                  'flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mb-2'
              },
              h(User, { size: 16, className: 'text-blue-500 shrink-0' }),
              h('span', { className: 'truncate' }, session.speaker_name)
            )
          : null,
        session?.location || session?.room
          ? h(
              'div',
              {
                className:
                  'flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3'
              },
              h(MapPin, { size: 14, className: 'text-slate-400 shrink-0' }),
              h('span', { className: 'truncate' }, session.location || session.room)
            )
          : null,
        session?.description
          ? h(
              'p',
              {
                className:
                  'text-sm text-slate-600 dark:text-slate-400 line-clamp-3'
              },
              session.description
            )
          : null
      )
    )
  );
};

const SessionsScreen = () => {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    filterSessions();
  }, [searchQuery, selectedFilter, sessions]);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/sessions?limit=50');
      setSessions(response.data || []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError('Failed to load sessions. Please try again.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const filterSessions = () => {
    let filtered = sessions;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (session) =>
          session.title?.toLowerCase().includes(query) ||
          session.speaker_name?.toLowerCase().includes(query) ||
          session.description?.toLowerCase().includes(query)
      );
    }

    if (selectedFilter !== 'all') {
      filtered = filtered.filter((session) => session.category === selectedFilter);
    }

    setFilteredSessions(filtered);
  };

  const SkeletonCard = () =>
    h(
      'div',
      {
        className:
          'bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden animate-pulse border border-slate-200 dark:border-slate-700'
      },
      h('div', {
        className:
          'bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 h-24'
      }),
      h(
        'div',
        { className: 'p-4 space-y-3' },
        h('div', { className: 'h-4 bg-slate-300 dark:bg-slate-600 rounded w-3/4' }),
        h('div', { className: 'h-3 bg-slate-300 dark:bg-slate-600 rounded w-1/2' }),
        h('div', { className: 'h-3 bg-slate-300 dark:bg-slate-600 rounded w-full' })
      ),
      h(
        'div',
        {
          className:
            'px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700'
        },
        h(
          'div',
          { className: 'flex gap-2' },
          [1, 2, 3, 4].map((i) =>
            h('div', {
              key: i,
              className: 'flex-1 h-10 bg-slate-300 dark:bg-slate-600 rounded'
            })
          )
        )
      )
    );

  return h(
    'div',
    { className: 'min-h-screen bg-white dark:bg-slate-950 pb-20' },
    // Header
    h(
      'div',
      {
        className:
          'bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 pt-8 flex justify-between items-center'
      },
      h(
        'div',
        null,
        h('h1', { className: 'text-3xl font-bold mb-2' }, 'Sessions'),
        h(
          'p',
          { className: 'text-blue-100' },
          `Browse and discover ${sessions.length || '0'} sessions`
        )
      ),
      h(
        'button',
        {
          onClick: () => setIsCreateModalOpen(true),
          className:
            'bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-sm'
        },
        '+ Create Session'
      )
    ),

    // Search & Filter Bar
    h(
      'div',
      {
        className:
          'sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4'
      },
      h(
        'div',
        { className: 'max-w-6xl mx-auto' },
        h(
          'div',
          { className: 'relative mb-3' },
          h(Search, { className: 'absolute left-3 top-3 text-slate-400', size: 20 }),
          h('input', {
            type: 'text',
            placeholder: 'Search sessions, speakers...',
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            className:
              'w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white'
          })
        ),
        h(
          'div',
          { className: 'relative w-full' },
          h(
            'button',
            {
              onClick: () => setFilterOpen(!filterOpen),
              className:
                'flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:text-white'
            },
            h(Filter, { size: 18 }),
            h(
              'span',
              { className: 'text-sm font-medium' },
              selectedFilter === 'all' ? 'All Sessions' : selectedFilter
            ),
            h(ChevronDown, {
              size: 16,
              className: `transition-transform ${filterOpen ? 'rotate-180' : ''}`
            })
          ),
          filterOpen
            ? h(
                'div',
                {
                  className:
                    'absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg z-50'
                },
                ['all', 'Technical', 'Workshop', 'Networking'].map((category) =>
                  h(
                    'button',
                    {
                      key: category,
                      onClick: () => {
                        setSelectedFilter(category);
                        setFilterOpen(false);
                      },
                      className:
                        'block w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors dark:text-white font-medium'
                    },
                    category === 'all' ? 'All Sessions' : category
                  )
                )
              )
            : null
        )
      )
    ),

    // Main Content
    h(
      'div',
      { className: 'max-w-6xl mx-auto p-6' },
      error
        ? h(
            'div',
            {
              className:
                'mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg'
            },
            error,
            h(
              'button',
              {
                onClick: fetchSessions,
                className: 'ml-3 underline font-medium hover:no-underline'
              },
              'Try Again'
            )
          )
        : null,
      loading
        ? h(
            'div',
            { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
            [1, 2, 3, 4, 5, 6].map((i) => h(SkeletonCard, { key: i }))
          )
        : filteredSessions.length > 0
        ? h(
            React.Fragment,
            null,
            h(
              'div',
              { className: 'mb-4 text-sm text-slate-600 dark:text-slate-400' },
              `Showing \({filteredSessions.length} of\){sessions.length} sessions`
            ),
            h(
              'div',
              { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
              filteredSessions.map((session, index) =>
                h(SessionCard, {
                  key: session.id || index,
                  session: session,
                  onSessionUpdate: fetchSessions
                })
              )
            )
          )
        : h(
            'div',
            { className: 'text-center py-16' },
            h(
              'p',
              { className: 'text-lg text-slate-600 dark:text-slate-400 mb-4' },
              searchQuery
                ? `No sessions found matching "${searchQuery}"`
                : 'No sessions available yet'
            ),
            searchQuery
              ? h(
                  'button',
                  {
                    onClick: () => setSearchQuery(''),
                    className:
                      'px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors'
                  },
                  'Clear Search'
                )
              : null
          )
    ),

    // Create Session Modal
    isCreateModalOpen
      ? h(
          'div',
          {
            className:
              'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4'
          },
          h(
            'div',
            {
              className:
                'bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative'
            },
            h(
              'button',
              {
                onClick: () => setIsCreateModalOpen(false),
                className:
                  'absolute top-4 right-4 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 z-10'
              },
              '✕'
            ),
            h(
              'div',
              { className: 'p-2' },
              h(CreateSessionForm, {
                onSuccess: () => {
                  setIsCreateModalOpen(false);
                  fetchSessions();
                }
              })
            )
          )
        )
      : null
  );
};

export default SessionsScreen;