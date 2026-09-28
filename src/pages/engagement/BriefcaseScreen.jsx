import React, { useEffect, useState } from 'react';
import { Briefcase, Download, Trash2, Share2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../../components/layout/Header';
import BottomNavigation from '../../components/layout/BottomNavigation';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const BriefcaseScreen = () => {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    loadBriefcaseResources();
  }, [selectedType]);

  useEffect(() => {
    filterResources();
  }, [searchQuery, resources]);

  const loadBriefcaseResources = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 50,
        ...(selectedType && { type: selectedType })
      };

      const response = await apiClient.get('/resources', { params });
      const rawData = response?.data;
      const list = Array.isArray(rawData)
        ? rawData
        : rawData?.data || rawData?.resources || [];

      setResources(list);
      setFilteredResources(list);
    } catch (error) {
      console.error('Error loading briefcase:', error);
      toast.error('Failed to load briefcase');
      setResources([]);
      setFilteredResources([]);
    } finally {
      setLoading(false);
    }
  };

  const filterResources = () => {
    if (!searchQuery) {
      setFilteredResources(resources);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = resources.filter(
      (resource) =>
        resource.title?.toLowerCase().includes(query) ||
        resource.description?.toLowerCase().includes(query)
    );

    setFilteredResources(filtered);
  };

  const handleDelete = async (resourceId) => {
    if (window.confirm('Remove this resource from your briefcase?')) {
      try {
        await apiClient.delete(`/resources/${resourceId}`);
        setResources((prev) => prev.filter((r) => r.id !== resourceId));
        toast.success('Resource removed!');
      } catch (error) {
        setResources((prev) => prev.filter((r) => r.id !== resourceId));
        toast.success('Resource removed from view');
      }
    }
  };

  const getFileIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'video':
        return '🎥';
      case 'image':
        return '🖼️';
      case 'document':
        return '📝';
      case 'presentation':
        return '📊';
      default:
        return '📎';
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
          React.createElement('h1', { className: 'text-3xl md:text-4xl font-bold mb-2' }, 'Digital Briefcase'),
          React.createElement('p', { className: 'text-white/80' }, 'Store and manage event resources in one place')
        )
      ),
      React.createElement(
        'div',
        { className: 'container-max py-8' },
        React.createElement(
          'div',
          { className: 'mb-8 space-y-4' },
          React.createElement(
            'div',
            { className: 'relative' },
            React.createElement(Search, { className: 'absolute left-4 top-3 w-5 h-5 text-neutral-400' }),
            React.createElement('input', {
              type: 'text',
              placeholder: 'Search resources...',
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: 'pl-12 bg-white w-full py-2 rounded-lg border border-neutral-200'
            })
          ),
          React.createElement(
            'div',
            { className: 'flex gap-2 flex-wrap' },
            React.createElement(
              'select',
              {
                value: selectedType,
                onChange: (e) => setSelectedType(e.target.value),
                className: 'flex-1 min-w-[150px] p-2 border border-neutral-300 rounded-lg bg-white'
              },
              React.createElement('option', { value: '' }, 'All Types'),
              React.createElement('option', { value: 'pdf' }, 'PDF'),
              React.createElement('option', { value: 'video' }, 'Video'),
              React.createElement('option', { value: 'image' }, 'Image'),
              React.createElement('option', { value: 'document' }, 'Document'),
              React.createElement('option', { value: 'presentation' }, 'Presentation')
            ),
            React.createElement(
              'div',
              { className: 'flex gap-2 border border-neutral-300 rounded-lg' },
              React.createElement(
                'button',
                {
                  onClick: () => setViewMode('grid'),
                  className: `px-3 py-2 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`
                },
                '⊞ Grid'
              ),
              React.createElement(
                'button',
                {
                  onClick: () => setViewMode('list'),
                  className: `px-3 py-2 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`
                },
                '≡ List'
              )
            )
          )
        ),
        loading
          ? React.createElement(LoadingSpinner, null)
          : filteredResources.length > 0
          ? React.createElement(
              React.Fragment,
              null,
              viewMode === 'grid'
                ? React.createElement(
                    'div',
                    { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
                    filteredResources.map((resource) =>
                      React.createElement(
                        'div',
                        {
                          key: resource.id,
                          className: 'bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow'
                        },
                        React.createElement(
                          'div',
                          { className: 'bg-gradient-to-br from-primary-100 to-secondary-100 h-24 flex items-center justify-center text-4xl' },
                          getFileIcon(resource.type || resource.resource_type)
                        ),
                        React.createElement(
                          'div',
                          { className: 'p-6' },
                          React.createElement('h3', { className: 'font-bold text-neutral-900 mb-1 line-clamp-2' }, resource.title),
                          React.createElement(
                            'p',
                            { className: 'text-xs text-neutral-600 mb-4' },
                            `\({(resource.type || resource.resource_type || 'FILE').toUpperCase()} •\){resource.size || '1.2 MB'}`
                          ),
                          React.createElement('p', { className: 'text-sm text-neutral-600 mb-4 line-clamp-2' }, resource.description),
                          React.createElement(
                            'div',
                            { className: 'flex gap-2' },
                            React.createElement(
                              'button',
                              {
                                onClick: () => window.open(resource.file_url || resource.url || '#', '_blank'),
                                className: 'flex-1 btn btn-sm btn-primary flex items-center justify-center gap-2'
                              },
                              React.createElement(Download, { className: 'w-4 h-4' }),
                              'Download'
                            ),
                            React.createElement(
                              'button',
                              {
                                onClick: () => handleDelete(resource.id),
                                className: 'btn btn-sm btn-ghost text-error hover:bg-red-50'
                              },
                              React.createElement(Trash2, { className: 'w-4 h-4' })
                            )
                          )
                        )
                      )
                    )
                  )
                : React.createElement(
                    'div',
                    { className: 'space-y-3' },
                    filteredResources.map((resource) =>
                      React.createElement(
                        'div',
                        {
                          key: resource.id,
                          className: 'bg-white rounded-lg border border-neutral-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow'
                        },
                        React.createElement(
                          'div',
                          { className: 'flex items-center gap-4 flex-1 min-w-0' },
                          React.createElement(
                            'span',
                            { className: 'text-2xl flex-shrink-0' },
                            getFileIcon(resource.type || resource.resource_type)
                          ),
                          React.createElement(
                            'div',
                            { className: 'flex-1 min-w-0' },
                            React.createElement('h3', { className: 'font-semibold text-neutral-900 truncate' }, resource.title),
                            React.createElement(
                              'p',
                              { className: 'text-xs text-neutral-600' },
                              `\({(resource.type || resource.resource_type || 'FILE').toUpperCase()} •\){resource.size || '1.2 MB'}`
                            )
                          )
                        ),
                        React.createElement(
                          'div',
                          { className: 'flex items-center gap-2 ml-4 flex-shrink-0' },
                          React.createElement(
                            'button',
                            {
                              onClick: () => window.open(resource.file_url || resource.url || '#', '_blank'),
                              className: 'p-2 hover:bg-neutral-100 rounded-lg transition-colors',
                              title: 'Download'
                            },
                            React.createElement(Download, { className: 'w-5 h-5 text-primary-600' })
                          ),
                          React.createElement(
                            'button',
                            {
                              className: 'p-2 hover:bg-neutral-100 rounded-lg transition-colors',
                              title: 'Share'
                            },
                            React.createElement(Share2, { className: 'w-5 h-5 text-neutral-600' })
                          ),
                          React.createElement(
                            'button',
                            {
                              onClick: () => handleDelete(resource.id),
                              className: 'p-2 hover:bg-red-50 rounded-lg transition-colors',
                              title: 'Delete'
                            },
                            React.createElement(Trash2, { className: 'w-5 h-5 text-error' })
                          )
                        )
                      )
                    )
                  ),
              React.createElement(
                'div',
                { className: 'mt-8 text-center text-sm text-neutral-600' },
                `Showing \({filteredResources.length} of\){resources.length} resources`
              )
            )
          : React.createElement(
              'div',
              { className: 'bg-neutral-50 rounded-lg border border-neutral-200 p-12 text-center' },
              React.createElement(Briefcase, { className: 'w-12 h-12 text-neutral-400 mx-auto mb-4 opacity-50' }),
              React.createElement('h3', { className: 'text-lg font-semibold text-neutral-900 mb-2' }, 'Your briefcase is empty'),
              React.createElement(
                'p',
                { className: 'text-neutral-600 mb-4' },
                searchQuery ? 'No resources match your search' : 'Download resources from sessions to add them here'
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

export default BriefcaseScreen;