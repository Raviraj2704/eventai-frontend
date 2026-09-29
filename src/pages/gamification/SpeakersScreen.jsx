// ============================================================================
// Speakers Screen
// ============================================================================
// File: src/pages/gamification/SpeakersScreen.jsx
// Purpose: Browse event speakers
// Status: Production-Ready ✅

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Briefcase, Star, MessageCircle, Share2, Calendar, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import Header from '../../components/layout/Header'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import apiClient from '../../config/apiClient'
import { useFeatureManagement, CreateDeleteButtons } from '../../hooks/useFeatureManagement'

const SpeakersScreen = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [speakers, setSpeakers] = useState([])
  const [filteredSpeakers, setFilteredSpeakers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSpeaker, setExpandedSpeaker] = useState(null)

  const {
    feature,
    items,
    loading: featureLoading,
    canCreate,
    canDelete,
    fetchItems,
    createItem,
    deleteItem,
    isDeleting
  } = useFeatureManagement('speakers')

  useEffect(() => {
    if (fetchItems) {
      fetchItems()
    }
  }, [fetchItems])

  useEffect(() => {
    loadSpeakers()
  }, [])

  useEffect(() => {
    if (Array.isArray(items) && items.length > 0) {
      setSpeakers(items)
    }
  }, [items])

  useEffect(() => {
    filterSpeakers()
  }, [searchQuery, speakers])

  const loadSpeakers = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get('/speakers', {
        params: { limit: 50 }
      })
      const rawData = response?.data
      const dataList = Array.isArray(rawData)
        ? rawData
        : rawData?.data || rawData?.speakers || []
      setSpeakers(dataList)
      setFilteredSpeakers(dataList)
    } catch (error) {
      console.error('Error loading speakers:', error)
      toast.error('Failed to load speakers')
    } finally {
      setLoading(false)
    }
  }

  const filterSpeakers = () => {
    if (!searchQuery) {
      setFilteredSpeakers(speakers)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = speakers.filter((speaker) =>
      `\({speaker.first_name || ''}\){speaker.last_name || ''} ${speaker.name || ''}`.toLowerCase().includes(query) ||
      speaker.bio?.toLowerCase().includes(query) ||
      speaker.expertise?.some(e => e.toLowerCase().includes(query))
    )

    setFilteredSpeakers(filtered)
  }

  const handleRate = (speakerId) => {
    navigate('/ratings')
  }

  const handleFollow = async (speakerId) => {
    try {
      await apiClient.post(`/speakers/${speakerId}/follow`)
      toast.success('Speaker followed!')
      // Update local state
      setSpeakers(prev => prev.map(s =>
        s.id === speakerId ? { ...s, user_following: !s.user_following } : s
      ))
    } catch (error) {
      console.error('Error following speaker:', error)
      toast.error('Failed to follow speaker')
    }
  }

  const openCreateModal = async () => {
    const firstName = window.prompt('Enter speaker first name:')
    if (!firstName) return
    const lastName = window.prompt('Enter speaker last name:') || ''
    const designation = window.prompt('Enter speaker designation/title:') || 'Speaker'
    const company = window.prompt('Enter speaker company:') || ''
    const bio = window.prompt('Enter speaker bio:') || ''

    try {
      if (createItem) {
        await createItem({
          first_name: firstName,
          last_name: lastName,
          name: `\({firstName}\){lastName}`.trim(),
          designation,
          company,
          bio
        })
      } else {
        await apiClient.post('/speakers', {
          first_name: firstName,
          last_name: lastName,
          name: `\({firstName}\){lastName}`.trim(),
          designation,
          company,
          bio
        })
      }
      toast.success('Speaker created!')
      loadSpeakers()
    } catch (error) {
      console.error('Error creating speaker:', error)
      toast.error('Failed to create speaker')
    }
  }

  const openEditModal = (speaker) => {
    setExpandedSpeaker(speaker)
  }

  const handleDeleteSpeaker = async (speakerId) => {
    try {
      if (deleteItem) {
        await deleteItem(speakerId)
      } else {
        await apiClient.delete(`/speakers/${speakerId}`)
      }
      setSpeakers(prev => prev.filter(s => s.id !== speakerId))
      toast.success('Speaker deleted!')
    } catch (error) {
      console.error('Error deleting speaker:', error)
      toast.error('Failed to delete speaker')
    }
  }

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Header, null),
    React.createElement(
      'main',
      { className: 'pb-20 md:pb-0' },
      /* Page Header */
      React.createElement(
        'div',
        { className: 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white' },
        React.createElement(
          'div',
          { className: 'container-max py-8 flex items-center justify-between flex-wrap gap-4' },
          React.createElement(
            'div',
            null,
            React.createElement('h1', { className: 'text-3xl md:text-4xl font-bold mb-2' }, 'Speakers'),
            React.createElement(
              'p',
              { className: 'text-white/80' },
              'Meet the industry experts sharing their knowledge'
            )
          ),
          canCreate &&
            React.createElement(
              'button',
              {
                onClick: () => openCreateModal(),
                className: 'btn bg-white text-primary-600 hover:bg-neutral-100 font-semibold px-4 py-2 rounded-lg shadow-sm'
              },
              '➕ Create Speaker'
            )
        )
      ),
      React.createElement(
        'div',
        { className: 'container-max py-8' },
        /* Search */
        React.createElement(
          'div',
          { className: 'mb-8 relative' },
          React.createElement(Search, { className: 'absolute left-4 top-3 w-5 h-5 text-neutral-400' }),
          React.createElement('input', {
            type: 'text',
            placeholder: 'Search speakers by name, expertise...',
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            className: 'pl-12 bg-white w-full py-2 rounded-lg border border-neutral-200'
          })
        ),
        /* Speakers Grid */
        loading && featureLoading
          ? React.createElement(LoadingSpinner, null)
          : filteredSpeakers.length > 0
          ? React.createElement(
              'div',
              { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
              filteredSpeakers.map((speaker) =>
                React.createElement(
                  'div',
                  {
                    key: speaker.id,
                    className: 'bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-lg transition-all'
                  },
                  /* Header Background */
                  React.createElement('div', {
                    className: 'h-32 bg-gradient-to-r from-primary-500 to-secondary-500'
                  }),
                  /* Content */
                  React.createElement(
                    'div',
                    { className: 'px-6 pb-6 -mt-16 relative' },
                    /* Avatar */
                    React.createElement(
                      'div',
                      {
                        className:
                          'w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 border-4 border-white flex items-center justify-center mb-4 overflow-hidden'
                      },
                      speaker.avatar_url
                        ? React.createElement('img', {
                            src: speaker.avatar_url,
                            alt: speaker.first_name || speaker.name,
                            className: 'w-full h-full object-cover'
                          })
                        : React.createElement(
                            'span',
                            { className: 'text-2xl font-bold text-white' },
                            speaker.first_name?.[0] || speaker.name?.[0] || 'S',
                            speaker.last_name?.[0] || ''
                          )
                    ),
                    /* Name */
                    React.createElement(
                      'h3',
                      { className: 'text-lg font-bold text-neutral-900 mb-1' },
                      speaker.name || `\({speaker.first_name || ''}\){speaker.last_name || ''}`.trim()
                    ),
                    /* Title */
                    React.createElement(
                      'p',
                      { className: 'text-sm text-primary-600 font-medium mb-2' },
                      speaker.designation
                    ),
                    /* Company */
                    speaker.company &&
                      React.createElement(
                        'p',
                        { className: 'text-xs text-neutral-600 mb-3' },
                        speaker.company
                      ),
                    /* Bio */
                    React.createElement(
                      'p',
                      { className: 'text-sm text-neutral-600 line-clamp-2 mb-4' },
                      speaker.bio
                    ),
                    /* Rating */
                    speaker.average_rating > 0 &&
                      React.createElement(
                        'div',
                        { className: 'flex items-center gap-1 mb-4' },
                        React.createElement(Star, {
                          className: 'w-4 h-4 text-yellow-500 fill-yellow-500'
                        }),
                        React.createElement(
                          'span',
                          { className: 'text-sm font-semibold text-neutral-900' },
                          speaker.average_rating.toFixed(1)
                        ),
                        React.createElement(
                          'span',
                          { className: 'text-xs text-neutral-600' },
                          `(${speaker.rating_count} ratings)`
                        )
                      ),
                    /* Expertise Tags */
                    speaker.expertise &&
                      speaker.expertise.length > 0 &&
                      React.createElement(
                        'div',
                        { className: 'flex flex-wrap gap-2 mb-4' },
                        speaker.expertise.slice(0, 2).map((exp, idx) =>
                          React.createElement(
                            'span',
                            {
                              key: idx,
                              className:
                                'px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-xs font-medium'
                            },
                            exp
                          )
                        ),
                        speaker.expertise.length > 2 &&
                          React.createElement(
                            'span',
                            {
                              className:
                                'px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-xs font-medium'
                            },
                            `+${speaker.expertise.length - 2}`
                          )
                      ),
                    /* Sessions Count */
                    speaker.session_count > 0 &&
                      React.createElement(
                        'div',
                        {
                          className:
                            'flex items-center gap-2 text-xs text-neutral-600 mb-4 pb-4 border-b border-neutral-200'
                        },
                        React.createElement(Calendar, { className: 'w-4 h-4' }),
                        React.createElement(
                          'span',
                          null,
                          `\({speaker.session_count} session\){speaker.session_count !== 1 ? 's' : ''}`
                        )
                      ),
                    /* Actions */
                    React.createElement(
                      'div',
                      { className: 'space-y-2' },
                      React.createElement(
                        'button',
                        {
                          onClick: () => handleFollow(speaker.id),
                          className: `w-full btn btn-sm ${
                            speaker.user_following ? 'btn-primary' : 'btn-outline'
                          }`
                        },
                        speaker.user_following ? '✓ Following' : 'Follow'
                      ),
                      React.createElement(
                        'button',
                        {
                          onClick: () => handleRate(speaker.id),
                          className: 'w-full btn btn-sm btn-ghost flex items-center justify-center gap-2'
                        },
                        React.createElement(Star, { className: 'w-4 h-4' }),
                        'Rate'
                      ),
                      React.createElement(
                        'button',
                        {
                          className: 'w-full btn btn-sm btn-ghost flex items-center justify-center gap-2'
                        },
                        React.createElement(MessageCircle, { className: 'w-4 h-4' }),
                        'Message'
                      ),
                      CreateDeleteButtons &&
                        React.createElement(CreateDeleteButtons, {
                          featureKey: 'speakers',
                          itemId: speaker.id,
                          onDelete: handleDeleteSpeaker,
                          onEdit: () => openEditModal(speaker),
                          isDeleting: isDeleting
                        })
                    )
                  )
                )
              )
            )
          : React.createElement(
              'div',
              { className: 'bg-neutral-50 rounded-lg border border-neutral-200 p-12 text-center' },
              React.createElement(
                'p',
                { className: 'text-neutral-600 mb-4' },
                searchQuery ? 'No speakers found' : 'No speakers available'
              ),
              searchQuery &&
                React.createElement(
                  'button',
                  {
                    onClick: () => setSearchQuery(''),
                    className: 'btn btn-primary'
                  },
                  'Clear Search'
                )
            )
      )
    )
  )
}

export default SpeakersScreen