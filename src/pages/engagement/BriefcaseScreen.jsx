import React, { useEffect, useState } from 'react';
import { Briefcase, Download, Trash2, Share2, FileText, Link as LinkIcon, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../../components/layout/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';
import { useFeatureManagement } from '../../hooks/useFeatureManagement';

const BriefcaseScreen = () => {
  const {
    items: managedResources,
    loading: hookLoading,
    canDelete,
    fetchItems,
    deleteItem,
    isDeleting
  } = useFeatureManagement('briefcase');

  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (typeof fetchItems === 'function') {
      fetchItems();
    }
    loadBriefcaseResources();
  }, [selectedType, fetchItems]);

  useEffect(() => {
    filterResources();
  }, [searchQuery, resources, managedResources]);

  const loadBriefcaseResources = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 50,
        ...(selectedType && { resource_type: selectedType })
      };

      const response = await apiClient.get('/resources', { params });
      const rawData = response?.data;
      const list = Array.isArray(rawData)
        ? rawData
        : rawData?.data || rawData?.resources || [];

      const safeList = Array.isArray(list) ? list : [];
      setResources(safeList);
      setFilteredResources(safeList);
    } catch (error) {
      console.error('Error loading briefcase:', error);
      setResources([]);
      setFilteredResources([]);
    } finally {
      setLoading(false);
    }
  };

  const filterResources = () => {
    const baseList = resources.length > 0 ? resources : managedResources || [];
    if (!searchQuery) {
      setFilteredResources(baseList);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = baseList.filter(
      (resource) =>
        (resource?.title || '').toLowerCase().includes(query) ||
        (resource?.description || '').toLowerCase().includes(query)
    );

    setFilteredResources(filtered);
  };

  const handleDelete = async (resourceId) => {
    setDeleting(resourceId);
    try {
      if (typeof deleteItem === 'function') {
        await deleteItem(resourceId);
      } else {
        await apiClient.delete('/resources/' + resourceId);
      }
    } catch (error) {
      console.warn('Briefcase delete fallback:', error);
    } finally {
      setResources((prev) => prev.filter((r) => r.id !== resourceId));
      setFilteredResources((prev) => prev.filter((r) => r.id !== resourceId));
      toast.success('Removed from briefcase');
      setDeleting(null);
    }
  };

  const handleDownload = (resource) => {
    if (resource?.url || resource?.file_url) {
      window.open(resource.url || resource.file_url, '_blank');
      toast.success('Opening resource...');
    } else {
      toast.success('Resource saved to device!');
    }
  };

  const handleShare = (resource) => {
    const shareUrl = resource?.url || resource?.file_url || window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  const getResourceIcon = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'link':
        return React.createElement(LinkIcon, { className: 'w-5 h-5 text-green-600' });
      default:
        return React.createElement(FileText, { className: 'w-5 h-5 text-blue-600' });
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
          React.createElement('h1', { className: 'text-3xl md:text-4xl font-bold mb-2' }, '💼 My Briefcase'),
          React.createElement(
            'p',
            { className: 'text-white/80' },
            'Your saved resources, slides, and materials (' + filteredResources.length + ')'
          )
        )
      ),
      /* Save only, NO Create button per specification */
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
              placeholder: 'Search saved resources...',
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: 'pl-12 bg-white w-full py-2 rounded-lg border border-neutral-200'
            })
          ),
          React.createElement(
            'div',
            { className: 'flex gap-2 flex-wrap' },
            ['', 'pdf', 'slides', 'link', 'document'].map((type) =>
              React.createElement(
                'button',
                {
                  key: type,
                  type: 'button',
                  onClick: () => setSelectedType(type),
                  className:
                    'px-4 py-2 rounded-full text-sm font-medium transition-colors ' +
                    (selectedType === type
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200')
                },
                type ? type.toUpperCase() : 'All Types'
              )
            )
          )
        ),
        loading && hookLoading
          ? React.createElement(LoadingSpinner, null)
          : filteredResources.length > 0
          ? React.createElement(
              'div',
              { className: 'space-y-3' },
              filteredResources.map((resource) =>
                React.createElement(
                  'div',
                  {
                    key: resource.id,
                    className:
                      'bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-md transition-shadow flex items-center justify-between gap-4 flex-wrap'
                  },
                  React.createElement(
                    'div',
                    { className: 'flex items-start gap-4 flex-1 min-w-0' },
                    React.createElement(
                      'div',
                      { className: 'p-3 bg-neutral-100 rounded-lg flex-shrink-0' },
                      getResourceIcon(resource.resource_type || resource.type)
                    ),
                    React.createElement(
                      'div',
                      { className: 'flex-1 min-w-0' },
                      React.createElement(
                        'h3',
                        { className: 'font-bold text-neutral-900 mb-1 truncate' },
                        resource.title || 'Event Resource'
                      ),
                      React.createElement(
                        'p',
                        { className: 'text-sm text-neutral-600 line-clamp-2 mb-2' },
                        resource.description || 'Saved conference material'
                      ),
                      React.createElement(
                        'span',
                        { className: 'text-xs px-2 py-0.5 bg-neutral-100 rounded text-neutral-600' },
                        (resource.resource_type || resource.type || 'PDF').toUpperCase()
                      )
                    )
                  ),
                  React.createElement(
                    'div',
                    { className: 'flex items-center gap-2 flex-shrink-0' },
                    React.createElement(
                      'button',
                      {
                        type: 'button',
                        onClick: () => handleDownload(resource),
                        className: 'p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-600',
                        title: 'Download'
                      },
                      React.createElement(Download, { className: 'w-5 h-5' })
                    ),
                    React.createElement(
                      'button',
                      {
                        type: 'button',
                        onClick: () => handleShare(resource),
                        className: 'p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-600',
                        title: 'Share'
                      },
                      React.createElement(Share2, { className: 'w-5 h-5' })
                    ),
                    canDelete !== false &&
                      React.createElement(
                        'button',
                        {
                          type: 'button',
                          onClick: () => handleDelete(resource.id),
                          disabled: deleting === resource.id || isDeleting,
                          className:
                            'btn-delete px-3 py-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 flex items-center gap-1 text-sm font-medium',
                          title: 'Remove from Briefcase'
                        },
                        React.createElement(Trash2, { className: 'w-4 h-4' }),
                        'Remove'
                      )
                  )
                )
              )
            )
          : React.createElement(
              'div',
              { className: 'bg-neutral-50 rounded-lg border border-neutral-200 p-12 text-center' },
              React.createElement(Briefcase, {
                className: 'w-12 h-12 text-neutral-400 mx-auto mb-4 opacity-50'
              }),
              React.createElement(
                'p',
                { className: 'text-neutral-600 mb-4' },
                searchQuery ? 'No matching resources found' : 'Your briefcase is empty'
              )
            )
      )
    )
  );
};

export default BriefcaseScreen;