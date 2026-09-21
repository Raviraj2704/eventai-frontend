import { useState, useEffect } from 'react';
import { apiGet, apiDelete } from '../services/api';
import CreateAnnouncementForm from '../components/forms/CreateAnnouncementForm';
import '../styles/announcements.css';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  useEffect(() => {
    checkAdminStatus();
    fetchAnnouncements();
  }, []);

  const checkAdminStatus = () => {
    try {
      const userRole = localStorage.getItem('user_role');
      const isAdminFlag = localStorage.getItem('is_admin') === 'true';
      setIsAdmin(userRole === 'admin' || isAdminFlag);
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet('/api/v1/announcements');
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load announcements. Please try again later.');
      console.error('Error fetching announcements:', err);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnnouncementCreated = (newAnnouncement) => {
    setAnnouncements([newAnnouncement, ...announcements]);
    setShowCreateForm(false);
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      await apiDelete(`/api/v1/announcements/${announcementId}`);
      setAnnouncements(announcements.filter(a => a.id !== announcementId));
      alert('Announcement deleted successfully');
    } catch (err) {
      console.error('Error deleting announcement:', err);
      alert('Failed to delete announcement');
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const categoryMatch = filterCategory === 'all' || announcement.category === filterCategory;
    const priorityMatch = filterPriority === 'all' || announcement.priority === filterPriority;
    return categoryMatch && priorityMatch;
  });

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#3b82f6',
      medium: '#f59e0b',
      high: '#ef4444',
      urgent: '#7c3aed'
    };
    return colors[priority] || '#3b82f6';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      update: '📢',
      important: '⚠️',
      reminder: '🔔',
      schedule: '📅',
      alert: '🚨'
    };
    return icons[category] || '📢';
  };

  if (loading) {
    return (
      <div className="announcements-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="announcements-container">
      <div className="announcements-header">
        <h1>📢 Announcements</h1>
        <p>Stay updated with the latest event news and updates</p>
      </div>

      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
          <button onClick={fetchAnnouncements}>Retry</button>
        </div>
      )}

      {/* Create Button (Always Visible) */}
      <div className="announcements-admin mb-4">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          onClick={() => setShowCreateForm(true)}
        >
          + Create Announcement
        </button>
      </div>

      {/* Create Announcement Modal Overlay */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl relative shadow-xl max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowCreateForm(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl font-bold"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-4">Create New Announcement</h2>
            <CreateAnnouncementForm
              onSubmit={handleAnnouncementCreated}
              onCancel={() => setShowCreateForm(false)}
              onClose={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      {announcements.length > 0 && (
        <div className="announcements-filters">
          <div className="filter-group">
            <label>Category:</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              <option value="update">Update</option>
              <option value="important">Important</option>
              <option value="reminder">Reminder</option>
              <option value="schedule">Schedule</option>
              <option value="alert">Alert</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Priority:</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="announcements-list">
        {filteredAnnouncements.length === 0 ? (
          <div className="empty-state">
            <p>
              {announcements.length === 0
                ? 'No announcements yet.'
                : 'No announcements matching your filters.'}
            </p>
          </div>
        ) : (
          filteredAnnouncements.map(announcement => (
            <div
              key={announcement.id}
              className={`announcement-card priority-${announcement.priority}`}
              style={{
                borderLeftColor: getPriorityColor(announcement.priority)
              }}
            >
              <div className="announcement-header">
                <div className="announcement-title-section">
                  <span className="category-icon">
                    {getCategoryIcon(announcement.category)}
                  </span>
                  <h3 className="announcement-title">
                    {announcement.title}
                  </h3>
                </div>

                <div className="announcement-badges">
                  <span
                    className="category-badge"
                    style={{
                      backgroundColor: getPriorityColor(announcement.priority),
                      opacity: 0.2
                    }}
                  >
                    {announcement.priority}
                  </span>
                  <span className="category-badge">
                    {announcement.category}
                  </span>
                </div>
              </div>

              <p className="announcement-content">
                {announcement.content}
              </p>

              <div className="announcement-footer">
                <span className="timestamp">
                  {announcement.created_at
                    ? new Date(announcement.created_at).toLocaleString()
                    : 'Just now'}
                </span>

                {isAdmin && (
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}