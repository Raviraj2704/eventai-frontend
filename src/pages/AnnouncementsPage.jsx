import { useState, useEffect } from 'react';
import { apiGet } from '../services/api';
import CreateAnnouncementForm from '../components/forms/CreateAnnouncementForm';
import '../styles/announcements.css';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isAdmin] = useState(localStorage.getItem('user_role') === 'admin');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await apiGet('/api/v1/announcements');
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnnouncementCreated = (newAnnouncement) => {
    setAnnouncements([newAnnouncement, ...announcements]);
    setShowCreateForm(false);
  };

  if (loading) {
    return (
      <div className="announcements-container">
        <div className="loading-spinner">Loading announcements...</div>
      </div>
    );
  }

  return (
    <div className="announcements-container">
      <div className="announcements-header">
        <h1>📢 Announcements</h1>
        <p>Stay updated with the latest event news</p>
      </div>

      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
        </div>
      )}

      {/* Create Announcement Button (Admin Only) */}
      {isAdmin && (
        <div className="announcements-actions">
          <button
            className="btn-create-announcement"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? '✖ Close' : '+ New Announcement'}
          </button>
        </div>
      )}

      {/* Create Announcement Form */}
      {showCreateForm && isAdmin && (
        <CreateAnnouncementForm
          onSubmit={handleAnnouncementCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="empty-state">
          <p>No announcements yet.</p>
        </div>
      ) : (
        <div className="announcements-list">
          {announcements.map(announcement => (
            <div
              key={announcement.id}
              className={`announcement-card priority-${announcement.priority}`}
            >
              <div className="announcement-header">
                <h3>{announcement.title}</h3>
                <div className="badges">
                  <span className={`category-badge ${announcement.category}`}>
                    {announcement.category}
                  </span>
                  <span className={`priority-badge ${announcement.priority}`}>
                    {announcement.priority}
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}