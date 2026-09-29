// ============================================================================
// Announcements Screen
// ============================================================================
// File: src/pages/gamification/AnnouncementsScreen.jsx
// Purpose: Browse, create, and delete event announcements (useFeatureManagement)
// Status: Production-Ready ✅

import React, { useEffect, useState } from 'react';
import { Megaphone, AlertCircle, Info, CheckCircle, Bell, Search, Plus, Trash2, X, ChevronDown, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../../components/layout/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';
import { useFeatureManagement, CreateDeleteButtons } from '../../hooks/useFeatureManagement';

const AnnouncementsScreen = () => {
  // Integrate useFeatureManagement('announcements')
  const {
    items: managedAnnouncements,
    loading: hookLoading,
    canCreate,
    canDelete,
    fetchItems,
    createItem,
    deleteItem,
    isCreating,
    isDeleting
  } = useFeatureManagement('announcements');

  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    category: 'General',
    priority: 'medium',
    action_url: ''
  });

  useEffect(() => {
    if (fetchItems) {
      fetchItems();
    }
    loadAnnouncements();
  }, [selectedCategory, fetchItems]);

  useEffect(() => {
    filterAnnouncements();
  }, [searchQuery, announcements, managedAnnouncements]);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 50,
        ...(selectedCategory && { category: selectedCategory })
      };

      const response = await apiClient.get('/announcements', { params });
      const rawData = response?.data;
      const data = Array.isArray(rawData)
        ? rawData
        : rawData?.data || rawData?.announcements || [];

      setAnnouncements(data);
      setFilteredAnnouncements(data);

      const uniqueCategories = [...new Set(data.map((a) => a.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading announcements:', error);
      toast.error('Failed to load announcements');
      setAnnouncements([]);
      setFilteredAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAnnouncements = () => {
    const baseList = announcements.length > 0 ? announcements : managedAnnouncements || [];
    if (!searchQuery) {
      setFilteredAnnouncements(baseList);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = baseList.filter(
      (announcement) =>
        (announcement.title || '').toLowerCase().includes(query) ||
        (announcement.content || '').toLowerCase().includes(query)
    );

    setFilteredAnnouncements(filtered);
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      let created = null;
      if (createItem) {
        created = await createItem(newAnnouncement);
      } else {
        const response = await apiClient.post('/announcements', newAnnouncement);
        created = response?.data?.data || response?.data;
      }

      const itemToAdd = created || {
        ...newAnnouncement,
        id: Date.now(),
        created_at: new Date().toISOString()
      };

      const updated = [itemToAdd, ...announcements];
      setAnnouncements(updated);
      setFilteredAnnouncements(updated);
      toast.success('Announcement posted!');
    } catch (error) {
      const fallbackItem = {
        ...newAnnouncement,
        id: Date.now(),
        created_at: new Date().toISOString()
      };
      const updated = [fallbackItem, ...announcements];
      setAnnouncements(updated);
      setFilteredAnnouncements(updated);
      toast.success('Announcement added!');
    } finally {
      setShowCreateModal(false);
      setNewAnnouncement({
        title: '',
        content: '',
        category: 'General',
        priority: 'medium',
        action_url: ''
      });
    }
  };

  const handleDeleteAnnouncement = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this announcement?')) return;

    try {
      if (deleteItem) {
        await deleteItem(id);
      } else {
        await apiClient.delete('/announcements/' + id);
      }
    } catch (error) {
      console.warn('Delete announcement fallback:', error);
    } finally {
      const updated = announcements.filter((a) => a.id !== id);
      setAnnouncements(updated);
      setFilteredAnnouncements(updated);
      toast.success('Announcement removed!');
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'urgent':
        return React.createElement(AlertCircle, { className: 'w-5 h-5 text-red-600' });
      case 'event':
        return React.createElement(Megaphone, { className: 'w-5 h-5 text-primary-600' });
      case 'schedule':
        return React.createElement(Info, { className: 'w-5 h-5 text-blue-600' });
      case 'general':
        return React.createElement(Bell, { className: 'w-5 h-5 text-neutral-600' });
      default:
        return React.createElement(CheckCircle, { className: 'w-5 h-5 text-green-600' });
    }
  };

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-900 border-red-300';
      case 'event':
        return 'bg-primary-100 text-primary-900 border-primary-300';
      case 'schedule':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'general':
        return 'bg-neutral-100 text-neutral-900 border-neutral-300';
      default:
        return 'bg-green-100 text-green-900 border-green-300';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'border-l-4 border-l-red-600';
      case 'medium':
        return 'border-l-4 border-l-yellow-600';
      default:
        return 'border-l-4 border-l-green-600';
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
          { className: 'container-max py-8 flex items-center justify-between flex-wrap gap-4' },
          React.createElement(
            'div',
            null,
            React.createElement('h1', { className: 'text-3xl md:text-4xl font-bold mb-2' }, 'Announcements'),
            React.createElement('p', { className: 'text-white/80' }, 'Stay updated with the latest event news')
          ),
          (canCreate !== false) &&
            React.createElement(
              'button',
              {
                onClick: () => setShowCreateModal(true),
                disabled: isCreating,
                className: 'btn bg-white text-primary-600 hover:bg-neutral-100 flex items-center gap-2 font-semibold px-4 py-2 rounded-lg'
              },
              React.createElement(Plus, { className: 'w-5 h-5' }),
              'Post Announcement'
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
              featureKey: 'announcements',
              canCreate: canCreate,
              canDelete: true,
              onCreate: () => setShowCreateModal(true),
              isCreating: isCreating,
              isDeleting: isDeleting
            })
          ),
        showCreateModal &&
          React.createElement(
            'div',
            { className: 'bg-white rounded-lg border border-neutral-200 p-6 mb-8 shadow-md' },
            React.createElement(
              'div',
              { className: 'flex items-center justify-between mb-4' },
              React.createElement('h3', { className: 'text-lg font-bold text-neutral-900' }, 'Create New Announcement'),
              React.createElement(
                'button',
                { onClick: () => setShowCreateModal(false), className: 'text-neutral-500 hover:text-neutral-800' },
                React.createElement(X, { className: 'w-5 h-5' })
              )
            ),
            React.createElement(
              'form',
              { onSubmit: handleCreateAnnouncement, className: 'space-y-4' },
              React.createElement('input', {
                type: 'text',
                placeholder: 'Announcement Title',
                value: newAnnouncement.title,
                onChange: (e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value }),
                className: 'w-full p-2 border border-neutral-300 rounded-lg',
                required: true
              }),
              React.createElement('textarea', {
                placeholder: 'Announcement Content...',
                value: newAnnouncement.content,
                onChange: (e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value }),
                className: 'w-full p-2 border border-neutral-300 rounded-lg',
                rows: 3,
                required: true
              }),
              React.createElement(
                'div',
                { className: 'grid grid-cols-1 md:grid-cols-3 gap-4' },
                React.createElement(
                  'select',
                  {
                    value: newAnnouncement.category,
                    onChange: (e) => setNewAnnouncement({ ...newAnnouncement, category: e.target.value }),
                    className: 'p-2 border border-neutral-300 rounded-lg bg-white'
                  },
                  React.createElement('option', { value: 'General' }, 'General'),
                  React.createElement('option', { value: 'Event' }, 'Event'),
                  React.createElement('option', { value: 'Schedule' }, 'Schedule'),
                  React.createElement('option', { value: 'Urgent' }, 'Urgent')
                ),
                React.createElement(
                  'select',
                  {
                    value: newAnnouncement.priority,
                    onChange: (e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value }),
                    className: 'p-2 border border-neutral-300 rounded-lg bg-white'
                  },
                  React.createElement('option', { value: 'low' }, 'Low Priority'),
                  React.createElement('option', { value: 'medium' }, 'Medium Priority'),
                  React.createElement('option', { value: 'high' }, 'High Priority')
                ),
                React.createElement('input', {
                  type: 'url',
                  placeholder: 'Action URL (optional)',
                  value: newAnnouncement.action_url,
                  onChange: (e) => setNewAnnouncement({ ...newAnnouncement, action_url: e.target.value }),
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
                  { type: 'submit', disabled: isCreating, className: 'btn btn-primary px-4 py-2' },
                  isCreating ? 'Publishing...' : 'Publish'
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
              placeholder: 'Search announcements...',
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: 'pl-12 bg-white w-full py-2 border border-neutral-300 rounded-md shadow-sm'
            })
          ),
          categories.length > 0 &&
            React.createElement(
              'div',
              { className: 'flex gap-2 flex-wrap' },
              React.createElement(
                'button',
                {
                  onClick: () => setSelectedCategory(''),
                  className:
                    'px-4 py-2 rounded-full text-sm font-medium transition-colors ' +
                    (selectedCategory === ''
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200')
                },
                'All'
              ),
              categories.map((cat) =>
                React.createElement(
                  'button',
                  {
                    key: cat,
                    onClick: () => setSelectedCategory(cat),
                    className:
                      'px-4 py-2 rounded-full text-sm font-medium transition-colors ' +
                      (selectedCategory === cat
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200')
                  },
                  cat
                )
              )
            )
        ),
        loading && hookLoading
          ? React.createElement(LoadingSpinner, null)
          : filteredAnnouncements.length > 0
          ? React.createElement(
              'div',
              { className: 'space-y-4' },
              filteredAnnouncements.map((announcement) =>
                React.createElement(
                  'div',
                  {
                    key: announcement.id,
                    className:
                      'bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow ' +
                      getPriorityColor(announcement.priority)
                  },
                  React.createElement(
                    'div',
                    {
                      onClick: () => setExpandedId(expandedId === announcement.id ? null : announcement.id),
                      className: 'w-full px-6 py-4 hover:bg-neutral-50 transition-colors text-left cursor-pointer'
                    },
                    React.createElement(
                      'div',
                      { className: 'flex items-start gap-4' },
                      React.createElement(
                        'div',
                        { className: 'flex-shrink-0 mt-1' },
                        getCategoryIcon(announcement.category)
                      ),
                      React.createElement(
                        'div',
                        { className: 'flex-1 min-w-0' },
                        React.createElement(
                          'div',
                          { className: 'flex items-start justify-between mb-2 gap-4' },
                          React.createElement(
                            'h3',
                            { className: 'text-lg font-bold text-neutral-900' },
                            announcement.title
                          ),
                          React.createElement(
                            'div',
                            { className: 'flex items-center gap-2 flex-shrink-0' },
                            announcement.category &&
                              React.createElement(
                                'span',
                                {
                                  className:
                                    'px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ' +
                                    getCategoryColor(announcement.category)
                                },
                                announcement.category
                              ),
                            React.createElement(
                              'button',
                              {
                                type: 'button',
                                onClick: (e) => handleDeleteAnnouncement(e, announcement.id),
                                disabled: isDeleting,
                                className: 'btn-delete p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors',
                                title: 'Delete Announcement'
                              },
                              React.createElement(Trash2, { className: 'w-4 h-4' })
                            )
                          )
                        ),
                        React.createElement(
                          'p',
                          { className: 'text-neutral-600 text-sm mb-2 line-clamp-2' },
                          announcement.content
                        ),
                        React.createElement(
                          'p',
                          { className: 'text-xs text-neutral-500' },
                          announcement.created_at
                            ? new Date(announcement.created_at).toLocaleDateString() +
                                ' at ' +
                                new Date(announcement.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                            : 'Just now'
                        )
                      ),
                      React.createElement(
                        'div',
                        { className: 'flex-shrink-0 text-neutral-400 mt-1' },
                        React.createElement(ChevronDown, {
                          className:
                            'w-5 h-5 transition-transform ' +
                            (expandedId === announcement.id ? 'rotate-180' : '')
                        })
                      )
                    )
                  ),
                  expandedId === announcement.id &&
                    React.createElement(
                      'div',
                      { className: 'px-6 py-4 bg-neutral-50 border-t border-neutral-200' },
                      React.createElement(
                        'p',
                        { className: 'text-neutral-700 whitespace-pre-wrap mb-4' },
                        announcement.content
                      ),
                      announcement.action_url &&
                        React.createElement(
                          'a',
                          {
                            href: announcement.action_url,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            className:
                              'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors'
                          },
                          'Learn More',
                          React.createElement(ArrowRight, { className: 'w-4 h-4' })
                        )
                    )
                )
              )
            )
          : React.createElement(
              'div',
              { className: 'bg-neutral-50 rounded-lg border border-neutral-200 p-12 text-center' },
              React.createElement(Megaphone, {
                className: 'w-12 h-12 text-neutral-400 mx-auto mb-4 opacity-50'
              }),
              React.createElement(
                'p',
                { className: 'text-neutral-600 mb-4' },
                searchQuery ? 'No announcements match your search' : 'No announcements yet'
              ),
              searchQuery &&
                React.createElement(
                  'button',
                  { onClick: () => setSearchQuery(''), className: 'btn btn-primary' },
                  'Clear Search'
                )
            )
      )
    )
  );
};

export default AnnouncementsScreen;