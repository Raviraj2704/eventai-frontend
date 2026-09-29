// ============================================================================
// useFeatureManagement.js - Create/Delete Handlers for All 12 Features
// ============================================================================
// File: frontend/src/hooks/useFeatureManagement.js
// Purpose: Unified Create/Delete logic for all 12 hub features
// Status: Production-Ready ✅

import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiDelete } from '../services/api';
import toast from 'react-hot-toast';

// ============================================================================
// Feature Configuration - What can be created/deleted
// ============================================================================
const FEATURE_CONFIG = {
  announcements: {
    name: 'Announcements',
    canCreate: true,
    canDelete: false,
    endpoint: '/announcements'
  },
  speakers: {
    name: 'Speakers',
    canCreate: true,
    canDelete: true,
    endpoint: '/speakers'
  },
  sessions: {
    name: 'Sessions',
    canCreate: true,
    canDelete: true,
    endpoint: '/sessions'
  },
  learning: {
    name: 'Learning Paths',
    canCreate: true,
    canDelete: true,
    endpoint: '/learning_paths'
  },
  engagement: {
    name: 'Engagement',
    canCreate: true,
    canDelete: true,
    endpoint: '/engagement/polls'
  },
  partners: {
    name: 'Partners',
    canCreate: true,
    canDelete: true,
    endpoint: '/partners'
  },
  briefcase: {
    name: 'Briefcase',
    canCreate: false,  // Saved resources only
    canDelete: true,
    endpoint: '/resources'
  },
  ratings: {
    name: 'Ratings',
    canCreate: false,  // View only
    canDelete: false,
    endpoint: '/ratings'
  },
  analytics: {
    name: 'Analytics',
    canCreate: false,  // View only
    canDelete: false,
    endpoint: '/analytics/dashboard'
  },
  admin: {
    name: 'Admin',
    canCreate: true,
    canDelete: true,
    endpoint: '/admin/users'
  },
  picbot: {
    name: 'Picbot',
    canCreate: false,  // Chat only
    canDelete: false,
    endpoint: '/ai/chat'
  },
  aiMatches: {
    name: 'AI Matches',
    canCreate: false,  // Auto-generated
    canDelete: false,
    endpoint: '/ai/networking/matches'
  }
};

// ============================================================================
// Main Hook - useFeatureManagement
// ============================================================================
export const useFeatureManagement = (featureKey) => {
  const feature = FEATURE_CONFIG[featureKey];
  
  if (!feature) {
    throw new Error(`Unknown feature: ${featureKey}`);
  }

  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================================================
  // Fetch Items
  // ============================================================================
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiGet(feature.endpoint);
      setItems(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (err) {
      console.error(`Failed to fetch ${feature.name}:`, err);
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [feature]);

  // ============================================================================
  // Create Item
  // ============================================================================
  const createItem = useCallback(async (formData) => {
    if (!feature.canCreate) {
      toast.error(`Cannot create ${feature.name}`);
      return false;
    }

    try {
      setIsCreating(true);
      const response = await apiPost(feature.endpoint, formData);
      
      // Add to local state
      setItems([...items, response.data]);
      toast.success(`${feature.name} created successfully!`);
      return true;
    } catch (err) {
      console.error(`Failed to create ${feature.name}:`, err);
      toast.error(`Failed to create ${feature.name}`);
      return false;
    } finally {
      setIsCreating(false);
    }
  }, [feature, items]);

  // ============================================================================
  // Delete Item
  // ============================================================================
  const deleteItem = useCallback(async (itemId) => {
    if (!feature.canDelete) {
      toast.error(`Cannot delete ${feature.name}`);
      return false;
    }

    try {
      setIsDeleting(true);
      await apiDelete(`${feature.endpoint}/${itemId}`);
      
      // Remove from local state
      setItems(items.filter(item => item.id !== itemId));
      toast.success(`${feature.name} deleted successfully!`);
      return true;
    } catch (err) {
      console.error(`Failed to delete ${feature.name}:`, err);
      toast.error(`Failed to delete ${feature.name}`);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [feature, items]);

  // ============================================================================
  // Update Item
  // ============================================================================
  const updateItem = useCallback(async (itemId, formData) => {
    try {
      const response = await apiPost(`${feature.endpoint}/${itemId}`, formData);
      
      // Update in local state
      setItems(items.map(item => 
        item.id === itemId ? response.data : item
      ));
      toast.success(`${feature.name} updated successfully!`);
      return true;
    } catch (err) {
      console.error(`Failed to update ${feature.name}:`, err);
      toast.error(`Failed to update ${feature.name}`);
      return false;
    }
  }, [feature, items]);

  return {
    feature,
    items,
    loading,
    error,
    isCreating,
    isDeleting,
    fetchItems,
    createItem,
    deleteItem,
    updateItem,
    canCreate: feature.canCreate,
    canDelete: feature.canDelete
  };
};

// ============================================================================
// Helper Component - Create/Delete Buttons
// ============================================================================
export const CreateDeleteButtons = ({ 
  featureKey, 
  itemId, 
  onDelete, 
  onEdit,
  isDeleting 
}) => {
  const feature = FEATURE_CONFIG[featureKey];

  return (
    <div className="feature-actions">
      {feature.canCreate && (
        <button 
          onClick={onEdit}
          className="btn btn-primary"
          title={`Edit ${feature.name}`}
        >
          ✏️ Edit
        </button>
      )}
      
      {feature.canDelete && (
        <button 
          onClick={() => onDelete(itemId)}
          className="btn btn-danger"
          disabled={isDeleting}
          title={`Delete ${feature.name}`}
        >
          {isDeleting ? '⏳ Deleting...' : '🗑️ Delete'}
        </button>
      )}
    </div>
  );
};

// ============================================================================
// Export configuration for reference
// ============================================================================
export { FEATURE_CONFIG };

// ============================================================================
// USAGE EXAMPLES
// ============================================================================
/*

// In a component using speakers:
import { useFeatureManagement, CreateDeleteButtons } from '../hooks/useFeatureManagement';

export default function SpeakersPage() {
  const {
    feature,
    items,
    loading,
    canCreate,
    canDelete,
    fetchItems,
    createItem,
    deleteItem,
    isDeleting
  } = useFeatureManagement('speakers');

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCreate = async (formData) => {
    const success = await createItem(formData);
    if (success) {
      // Show success UI
    }
  };

  const handleDelete = async (speakerId) => {
    if (window.confirm('Delete this speaker?')) {
      await deleteItem(speakerId);
    }
  };

  return (
    <div>
      <h1>{feature.name}</h1>
      
      {canCreate && (
        <button onClick={() => openCreateModal()}>
          ➕ Create {feature.name}
        </button>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="items-grid">
          {items.map(item => (
            <div key={item.id} className="item-card">
              <h3>{item.name}</h3>
              <CreateDeleteButtons
                featureKey="speakers"
                itemId={item.id}
                onDelete={handleDelete}
                onEdit={() => openEditModal(item)}
                isDeleting={isDeleting}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// For read-only features (ratings, analytics, picbot):
// They won't show create/delete buttons automatically

*/