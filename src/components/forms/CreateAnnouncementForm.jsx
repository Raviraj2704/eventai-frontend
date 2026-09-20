import { useState } from 'react';
import { apiPost } from '../../services/api';
import './CreateAnnouncementForm.css';

export default function CreateAnnouncementForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'update',
    priority: 'medium',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await apiPost('/api/v1/announcements', formData);
      alert('Announcement created!');
      onSubmit(result);
      setFormData({
        title: '',
        content: '',
        category: 'update',
        priority: 'medium',
      });
    } catch (err) {
      setError(err.message || 'Failed to create announcement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-announcement-form">
      <h2>Create Announcement</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Announcement title"
            required
          />
        </div>

        <div className="form-group">
          <label>Content *</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Write your announcement..."
            rows="6"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category</label>
            <select name="category" value={formData.category} onChange={handleChange}>
              <option value="update">Update</option>
              <option value="important">Important</option>
              <option value="reminder">Reminder</option>
              <option value="schedule">Schedule</option>
              <option value="alert">Alert</option>
            </select>
          </div>

          <div className="form-group">
            <label>Priority</label>
            <select name="priority" value={formData.priority} onChange={handleChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Post Announcement'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}