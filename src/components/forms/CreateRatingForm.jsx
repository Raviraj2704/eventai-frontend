import { useState } from 'react';
import { apiPost } from '../../services/api';
import './CreateRatingForm.css';

export default function CreateRatingForm({ sessionId, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    session_id: sessionId,
    score: 5,
    review: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'score' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await apiPost('/api/v1/ratings', formData);
      alert('Thank you for your rating!');
      onSubmit(result);
    } catch (err) {
      setError(err.message || 'Failed to submit rating');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map(num => (
      <button
        key={num}
        type="button"
        className={`star ${num <= formData.score ? 'active' : ''}`}
        onClick={() => setFormData(prev => ({ ...prev, score: num }))}
      >
        ⭐
      </button>
    ));
  };

  return (
    <div className="create-rating-form">
      <h2>Rate This Session</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Your Rating</label>
          <div className="star-rating">
            {renderStars()}
            <span className="rating-text">{formData.score} out of 5</span>
          </div>
        </div>

        <div className="form-group">
          <label>Your Review (Optional)</label>
          <textarea
            name="review"
            value={formData.review}
            onChange={handleChange}
            placeholder="Share your feedback about this session..."
            rows="4"
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Submitting...' : 'Submit Rating'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}