import { useState, useEffect } from 'react';
import { apiGet } from '../services/api';
import CreateSessionForm from '../components/forms/CreateSessionForm';
import CreateRatingForm from '../components/forms/CreateRatingForm';
import '../styles/sessions.css';

export default function SessionReviewsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [ratingFormSessionId, setRatingFormSessionId] = useState(null);
  // New - with date filtering
  const [selectedDay, setSelectedDay] = useState('2026-05-21'); // or get from user selection

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await apiGet(`/api/v1/sessions?day=${selectedDay}`);
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [selectedDay]);

  const handleSessionCreated = (newSession) => {
    setSessions([...sessions, newSession]);
    setShowCreateForm(false);
  };

  const handleRatingSubmitted = () => {
    setRatingFormSessionId(null);
    // Optionally refresh sessions to show updated rating
    fetchSessions();
  };

  if (loading) {
    return (
      <div className="sessions-container">
        <div className="loading-spinner">Loading sessions...</div>
      </div>
    );
  }

  return (
    <div className="sessions-container">
      <div className="sessions-header">
        <h1>📅 Sessions & Reviews</h1>
        <p>Explore talks and share your feedback</p>
      </div>

      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
        </div>
      )}

      {/* Create Session Button */}
      <div className="sessions-actions">
        <button
          className="btn-create-session"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? '✖ Close' : '+ Submit Session'}
        </button>
      </div>

      {/* Create Session Form */}
      {showCreateForm && (
        <CreateSessionForm
          onSubmit={handleSessionCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="empty-state">
          <p>No sessions yet. Be the first to submit!</p>
        </div>
      ) : (
        <div className="sessions-grid">
          {sessions.map(session => (
            <div key={session.id} className="session-card">
              <div className="session-header">
                <h3>{session.title || 'Untitled Session'}</h3>
                <span className={`category-badge ${session.category}`}>
                  {session.category || 'Session'}
                </span>
              </div>

              <p className="session-description">
                {session.description || 'No description available'}
              </p>

              <div className="session-meta">
                <div className="meta-item">
                  <span className="label">Speaker:</span>
                  <span className="value">{session.speaker_name || 'TBA'}</span>
                </div>
                <div className="meta-item">
                  <span className="label">Time:</span>
                  <span className="value">
                    {session.start_time
                      ? new Date(session.start_time).toLocaleString()
                      : 'TBA'}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="label">Location:</span>
                  <span className="value">{session.location || 'TBA'}</span>
                </div>
              </div>

              {session.average_rating && (
                <div className="session-rating">
                  <span className="stars">
                    {'⭐'.repeat(Math.round(session.average_rating))}
                  </span>
                  <span className="rating-value">
                    {session.average_rating.toFixed(1)} ({session.total_ratings || 0} ratings)
                  </span>
                </div>
              )}

              <div className="session-actions">
                <button
                  className="btn-rate"
                  onClick={() => setRatingFormSessionId(session.id)}
                >
                  Rate Session
                </button>
                <button className="btn-save">Save</button>
              </div>

              {/* Rating Form */}
              {ratingFormSessionId === session.id && (
                <CreateRatingForm
                  sessionId={session.id}
                  onSubmit={handleRatingSubmitted}
                  onCancel={() => setRatingFormSessionId(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}