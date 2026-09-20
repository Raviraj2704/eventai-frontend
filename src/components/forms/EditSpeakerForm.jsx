import { useState, useEffect } from 'react';
import { apiPost, apiPut, apiGet } from '../../services/api';
import './EditSpeakerForm.css';

export default function EditSpeakerForm({ speakerId, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    company: '',
    bio: '',
    expertise: [],
    rating: 0,
    avatar: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isNew, setIsNew] = useState(!speakerId);

  useEffect(() => {
    if (speakerId) {
      loadSpeaker();
    }
  }, [speakerId]);

  const loadSpeaker = async () => {
    try {
      const data = await apiGet(`/api/v1/speakers/${speakerId}`);
      setFormData(data);
      setIsNew(false);
    } catch (err) {
      setError('Failed to load speaker data');
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleExpertiseChange = (e) => {
    const expertise = e.target.value.split(',').map(item => item.trim());
    setFormData(prev => ({
      ...prev,
      expertise,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (isNew) {
        result = await apiPost('/api/v1/speakers', formData);
        alert('Speaker profile created!');
      } else {
        result = await apiPut(`/api/v1/speakers/${speakerId}`, formData);
        alert('Speaker profile updated!');
      }
      onSubmit(result);
    } catch (err) {
      setError(err.message || 'Failed to save speaker profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-speaker-form">
      <h2>{isNew ? 'Create Speaker Profile' : 'Edit Speaker Profile'}</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
            required
          />
        </div>

        <div className="form-group">
          <label>Professional Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., VP of Talent & Culture"
            required
          />
        </div>

        <div className="form-group">
          <label>Company</label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Your company"
          />
        </div>

        <div className="form-group">
          <label>Bio *</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us about yourself..."
            rows="4"
            required
          />
        </div>

        <div className="form-group">
          <label>Areas of Expertise (comma-separated)</label>
          <input
            type="text"
            value={formData.expertise.join(', ')}
            onChange={handleExpertiseChange}
            placeholder="e.g., Talent Management, AI, Leadership"
          />
        </div>

        <div className="form-group">
          <label>Avatar URL</label>
          <input
            type="url"
            name="avatar"
            value={formData.avatar}
            onChange={handleChange}
            placeholder="https://example.com/avatar.jpg"
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : isNew ? 'Create Profile' : 'Update Profile'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}