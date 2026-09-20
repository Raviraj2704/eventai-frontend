import { useState } from 'react';
import { apiPost } from '../../services/api';
import './CreateSessionForm.css';

export default function CreateSessionForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    category: 'workshop',
    max_attendees: 100,
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
      const result = await apiPost('/api/v1/sessions', formData);
      alert('Session created successfully!');
      onSubmit(result);
      setFormData({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        location: '',
        category: 'workshop',
        max_attendees: 100,
      });
    } catch (err) {
      setError(err.message || 'Failed to create session');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-session-form">
      <h2>Submit Your Session</h2>
      
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Session Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., AI-Ready HR Leaders"
            required
          />
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your session..."
            rows="4"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Start Time *</label>
            <input
              type="datetime-local"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>End Time *</label>
            <input
              type="datetime-local"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Hall A"
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select name="category" value={formData.category} onChange={handleChange}>
              <option value="keynote">Keynote</option>
              <option value="workshop">Workshop</option>
              <option value="panel">Panel Discussion</option>
              <option value="breakout">Breakout Session</option>
              <option value="networking">Networking</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Max Attendees</label>
          <input
            type="number"
            name="max_attendees"
            value={formData.max_attendees}
            onChange={handleChange}
            min="1"
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create Session'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}