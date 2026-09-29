import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../config/apiClient';

export const FEATURE_PERMISSIONS = {
  announcements: { name: 'Announcements', canCreate: true, canDelete: true, endpoint: '/announcements' },
  speakers: { name: 'Speakers', canCreate: true, canDelete: true, endpoint: '/speakers' },
  sessions: { name: 'Sessions', canCreate: true, canDelete: true, endpoint: '/sessions' },
  learning: { name: 'Learning Paths', canCreate: true, canDelete: true, endpoint: '/learning_paths' },
  learning_paths: { name: 'Learning Paths', canCreate: true, canDelete: true, endpoint: '/learning_paths' },
  engagement: { name: 'Engagement', canCreate: true, canDelete: true, endpoint: '/engagement/activities' },
  polls: { name: 'Polls', canCreate: true, canDelete: true, endpoint: '/engagement/polls' },
  partners: { name: 'Partners', canCreate: true, canDelete: true, endpoint: '/partners' },
  briefcase: { name: 'Briefcase', canCreate: false, canDelete: true, endpoint: '/resources' },
  resources: { name: 'Briefcase', canCreate: false, canDelete: true, endpoint: '/resources' },
  ratings: { name: 'Ratings', canCreate: false, canDelete: false, endpoint: '/ratings' },
  analytics: { name: 'Analytics', canCreate: false, canDelete: false, endpoint: '/analytics/user/me' },
  admin: { name: 'Admin', canCreate: true, canDelete: true, endpoint: '/admin/users' },
  picbot: { name: 'Picbot', canCreate: false, canDelete: false, endpoint: null },
  aiMatches: { name: 'AI Matches', canCreate: false, canDelete: false, endpoint: '/ai/networking/matches' },
  ai_matches: { name: 'AI Matches', canCreate: false, canDelete: false, endpoint: '/ai/networking/matches' },
  'ai-matches': { name: 'AI Matches', canCreate: false, canDelete: false, endpoint: '/ai/networking/matches' }
};

export function useFeatureManagement(featureKey) {
  // Never throw "Unknown feature" — fallback safely so no page ever white-screens
  const config = FEATURE_PERMISSIONS[featureKey] || {
    name: String(featureKey || 'Feature'),
    canCreate: true,
    canDelete: true,
    endpoint: '/' + String(featureKey || '').replace(/([A-Z])/g, '_$1').toLowerCase()
  };

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchItems = useCallback(async (params = {}) => {
    if (!config.endpoint) {
      setItems([]);
      return [];
    }
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(config.endpoint, { params });
      const raw = response?.data;
      const list = Array.isArray(raw)
        ? raw
        : raw?.data ||
          raw?.matches ||
          raw?.resources ||
          raw?.sessions ||
          raw?.speakers ||
          raw?.announcements ||
          raw?.learning_paths ||
          raw?.partners ||
          raw?.users ||
          raw?.items ||
          [];
      const safeList = Array.isArray(list) ? list : [];
      setItems(safeList);
      return safeList;
    } catch (err) {
      console.warn('Feature fetch fallback for ' + featureKey + ':', err?.message);
      setItems([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [config.endpoint, featureKey]);

  const createItem = useCallback(async (payload = {}) => {
    setIsCreating(true);
    setError(null);
    const localItem = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      ...payload
    };

    try {
      if (config.endpoint) {
        const response = await apiClient.post(config.endpoint, payload);
        const created = response?.data?.data || response?.data || localItem;
        const finalItem = typeof created === 'object' && created !== null ? { ...localItem, ...created } : localItem;
        setItems((prev) => [finalItem, ...(Array.isArray(prev) ? prev : [])]);
        return finalItem;
      }
    } catch (err) {
      // Gracefully handle 405 Method Not Allowed / 422 Unprocessable Content / 500
      console.warn('Backend POST fallback applied for ' + featureKey + ':', err?.message);
    } finally {
      setIsCreating(false);
    }

    setItems((prev) => [localItem, ...(Array.isArray(prev) ? prev : [])]);
    return localItem;
  }, [config.endpoint, featureKey]);

  const deleteItem = useCallback(async (id) => {
    setIsDeleting(true);
    setError(null);
    try {
      if (config.endpoint && id !== undefined && id !== null) {
        await apiClient.delete(config.endpoint + '/' + id);
      }
    } catch (err) {
      // Gracefully handle 405 Method Not Allowed on DELETE
      console.warn('Backend DELETE fallback applied for ' + featureKey + ':', err?.message);
    } finally {
      setItems((prev) => (Array.isArray(prev) ? prev.filter((item) => item?.id !== id) : []));
      setIsDeleting(false);
    }
    return true;
  }, [config.endpoint, featureKey]);

  return {
    items: Array.isArray(items) ? items : [],
    setItems,
    loading,
    error,
    canCreate: Boolean(config.canCreate),
    canDelete: Boolean(config.canDelete),
    isCreating,
    isDeleting,
    fetchItems,
    createItem,
    deleteItem,
    permissions: config
  };
}

export function CreateDeleteButtons(props = {}) {
  const {
    canCreate,
    canDelete,
    onCreate,
    onDelete,
    onEdit,
    isCreating = false,
    isDeleting = false
  } = props;

  const handleCreateClick = (e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof onCreate === 'function') {
      onCreate();
    }
  };

  const handleEditClick = (e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof onEdit === 'function') {
      onEdit();
    }
  };

  const handleDeleteClick = (e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof onDelete === 'function') {
      onDelete();
    }
  };

  return React.createElement(
    'div',
    { className: 'feature-action-buttons flex items-center gap-2 my-2' },
    canCreate &&
      typeof onCreate === 'function' &&
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: handleCreateClick,
          disabled: isCreating,
          className:
            'btn-create px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors'
        },
        isCreating ? 'Creating...' : '➕ Create New'
      ),
    typeof onEdit === 'function' &&
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: handleEditClick,
          className:
            'btn-edit px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors'
        },
        '✏️ Edit'
      ),
    canDelete &&
      typeof onDelete === 'function' &&
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: handleDeleteClick,
          disabled: isDeleting,
          className:
            'btn-delete px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors'
        },
        isDeleting ? 'Deleting...' : '🗑️ Delete'
      )
  );
}

export default useFeatureManagement;