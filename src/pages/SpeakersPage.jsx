import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut } from '../services/api';
import EditSpeakerForm from '../components/forms/EditSpeakerForm';
import '../styles/speakers.css';

export default function SpeakersPage() {
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSpeakers();
  }, []);

  const fetchSpeakers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet('/api/v1/speakers');
      setSpeakers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load speakers. Please try again later.');
      console.error('Error fetching speakers:', err);
      setSpeakers([]);
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
    setSpeakers([newSpeaker, ...speakers]);
    setShowEditForm(false);
  };

  const filteredSpeakers = speakers.filter(speaker =>
    speaker.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    speaker.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    speaker.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (speakerId) => {
    setSelectedSpeakerId(speakerId);
    setShowEditForm(true);
  };

  if (loading) {
    return (
      <div className="speakers-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading speakers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="speakers-container">
      <div className="speakers-header">
        <h1>🎤 Speakers</h1>
        <p>Meet the experts shaping the future of HR & Technology</p>
      </div>

      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
          <button onClick={fetchSpeakers}>Retry</button>
        </div>
      )}

      {/* Search and Create Button */}
      <div className="speakers-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search speakers by name, title, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <button
          className="btn-create-profile"
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
      <div className="speakers-grid">
        {filteredSpeakers.length === 0 ? (
          <div className="empty-state">
            <p>
              {searchTerm
                ? 'No speakers found matching your search.'
                : 'No speakers registered yet. Be the first to create a profile!'}
            </p>
            {!searchTerm && (
              <button
                className="btn-primary"
                onClick={() => {
                  setShowEditForm(true);
                  setSelectedSpeakerId(null);
                }}
              >
                Create First Speaker Profile
              </button>
            )}
          </div>
        ) : (
          filteredSpeakers.map(speaker => (
            <div key={speaker.id} className="speaker-card">
              {speaker.avatar && (
                <div className="speaker-avatar">
                  <img
                    src={speaker.avatar}
                    alt={speaker.name || 'Speaker'}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/150?text=Speaker';
                    }}
                  />
                </div>
              )}

              <div className="speaker-content">
                <h3 className="speaker-name">{speaker.name || 'Unnamed Speaker'}</h3>

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
                    <span className="stars">
                      {'⭐'.repeat(Math.min(Math.round(speaker.rating), 5))}
                    </span>
                    <span className="rating-value">
                      {speaker.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              <div className="speaker-actions">
                <button
                  className="btn-edit"
                  onClick={() => handleEditClick(speaker.id)}
                >
                  Edit Profile
                </button>
                <button className="btn-follow">Follow</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}