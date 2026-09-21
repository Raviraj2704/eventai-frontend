import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet } from '../services/api';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check for standard token or fallback to the one we set in LoginScreen
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchEventData();
  }, [id, navigate]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch event details and sessions in parallel safely
      const [eventRes, sessionsRes] = await Promise.allSettled([
        apiGet(`/api/v1/events/${id}`),
        apiGet(`/api/v1/events/${id}/sessions`)
      ]);

      if (eventRes.status === 'fulfilled' && eventRes.value) {
        setEvent(eventRes.value);
      } else {
        setError('Failed to load event details. Please try again.');
      }

      if (sessionsRes.status === 'fulfilled' && sessionsRes.value) {
        // Handle response dynamically, checking if it's nested or direct
        const sessionsData = sessionsRes.value?.sessions || (Array.isArray(sessionsRes.value) ? sessionsRes.value : []);
        setSessions(sessionsData);
      } else {
        setSessions([]);
      }

    } catch (err) {
      console.error('Error fetching event data:', err);
      setError('An unexpected error occurred while loading the event.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex justify-center pt-20">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="bg-gray-50 min-h-screen p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6 text-center">
          <p className="text-red-600 mb-4">{error || 'Event not found'}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:underline font-medium"
          >
            &larr; Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6 animate-fade-in">
        <button 
          onClick={() => navigate(-1)} // Smarter navigation: goes back to exactly where they came from
          className="mb-4 text-blue-600 hover:underline font-medium flex items-center gap-1"
        >
          &larr; Back
        </button>
        
        <h1 className="text-3xl font-bold mb-2 text-gray-900">{event.name || event.title}</h1>
        <p className="text-gray-600 mb-4 flex items-center gap-2">
          <span>📍</span> {event.location || 'Virtual / TBA'}
        </p>
        <p className="text-sm font-semibold text-blue-600 mb-6 bg-blue-50 inline-block px-3 py-1 rounded-full">
          {event.date ? new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date TBA'}
        </p>
        <p className="text-gray-700 mb-8 leading-relaxed whitespace-pre-wrap">
          {event.description || 'No description provided.'}
        </p>

        <div className="border-t border-gray-200 pt-8 mt-4">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Event Sessions</h2>
          
          {sessions.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-4xl mb-3 block">🗓️</span>
              <p className="text-gray-500">No sessions have been scheduled for this event yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="border border-gray-200 p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{session.title}</h3>
                    {session.time && (
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {session.time}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3 text-sm leading-relaxed">{session.description}</p>
                  
                  <div className="flex items-center mt-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mr-3">
                      {session.speaker_name ? session.speaker_name.charAt(0) : 'S'}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {session.speaker_name || 'TBA'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}