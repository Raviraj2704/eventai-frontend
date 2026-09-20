import { useState, useEffect } from 'react';
import { apiGet } from '../services/api';
import EditSpeakerForm from '../components/forms/EditSpeakerForm';
import '../styles/speakers.css';

export default function SpeakersPage() {
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState(null);

  useEffect(() => {
    fetchSpeakers();
  }, []);

  const fetchSpeakers = async () => {
    try {
      setLoading(true);
      const data = await apiGet('/api/v1/speakers');
      setSpeakers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch speakers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeakerUpdated = (updatedSpeaker) => {
    setSpeakers(speakers.map(s =>
      s.id === updatedSpeaker.id ? updatedSpeaker : s
    ));
    setShowEditForm(false);
    setSelectedSpeakerId(null);
  };

  const handleCreateNew = (newSpeaker) => {
    setSpeakers([...speakers, newSpeaker]);
    setShowEditForm(false);
  };

  if (loading) {
    return (
      <div className="speakers-container">
        <div className="loading-spinner">Loading speakers...</div>
      </div>
    );
  }

  return (
    <div className="speakers-container">
      <div className="speakers-header">
        <h1>🎤 Speakers</h1>
        <p>Meet the experts shaping the future of HR</p>
      </div>

      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
        </div>
      )}

      {/* Edit Profile Button */}
      <div className="speakers-actions">
        <button
          className="btn-edit-profile"
          onClick={() => {
            setShowEditForm(!showEditForm);
            setSelectedSpeakerId(null);
          }}
        >
          {showEditForm ? '✖ Close' : '+ Create Speaker Profile'}
        </button>
      </div>

      {/* Edit Speaker Form */}
      {showEditForm && (
        <EditSpeakerForm
          speakerId={selectedSpeakerId}
          onSubmit={selectedSpeakerId ? handleSpeakerUpdated : handleCreateNew}
          onCancel={() => {
            setShowEditForm(false);
            setSelectedSpeakerId(null);
          }}
        />
      )}

      {/* Speakers Grid */}
      {speakers.length === 0 ? (
        <div className="empty-state">
          <p>No speakers registered yet.</p>
        </div>
      ) : (
        <div className="speakers-grid">
          {speakers.map(speaker => (
            <div key={speaker.id} className="speaker-card">
              {speaker.avatar && (
                <div className="speaker-avatar">
                  <img src={speaker.avatar} alt={speaker.name} />
                </div>
              )}

              <h3>{speaker.name || 'Speaker Name'}</h3>

              <p className="speaker-title">
                {speaker.title || 'Professional'}
              </p>

              {speaker.company && (
                <p className="speaker-company">@ {speaker.company}</p>
              )}

              <p className="speaker-bio">
                {speaker.bio || 'No bio available'}
              </p>

              {speaker.expertise && speaker.expertise.length > 0 && (
                <div className="speaker-expertise">
                  {speaker.expertise.map((exp, idx) => (
                    <span key={idx} className="expertise-badge">
                      {exp}
                    </span>
                  ))}
                </div>
              )}

              {speaker.rating && (
                <div className="speaker-rating">
                  <span className="stars">{'⭐'.repeat(Math.round(speaker.rating))}</span>
                  <span className="rating-value">{speaker.rating.toFixed(1)}</span>
                </div>
              )}

              <div className="speaker-actions">
                <button
                  className="btn-edit"
                  onClick={() => {
                    setSelectedSpeakerId(speaker.id);
                    setShowEditForm(true);
                  }}
                >
                  Edit Profile
                </button>
                <button className="btn-follow">Follow</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}