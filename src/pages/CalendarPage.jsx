import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from '../services/api';
import CalendarView from '../components/Calendar/CalendarView';
import CreateEventModal from '../components/Calendar/CreateEventModal';

export const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [userCalendar, setUserCalendar] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dynamic user ID fallback
  const currentUserId = parseInt(localStorage.getItem('user_id'), 10) || 1;

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch events, user calendar, and stats in parallel safely
      const [eventsRes, userRes, statsRes] = await Promise.allSettled([
        apiGet('/api/v1/calendar/events', { params: { event_id: 1 } }),
        apiGet('/api/v1/calendar/user', { params: { user_id: currentUserId, event_id: 1, include_past: false } }),
        apiGet('/api/v1/calendar/stats', { params: { event_id: 1 } })
      ]);

      // Set Events
      if (eventsRes.status === 'fulfilled' && eventsRes.value) {
        const eventsData = eventsRes.value?.events || (Array.isArray(eventsRes.value) ? eventsRes.value : []);
        setEvents(eventsData);
      } else {
        setEvents([]);
      }

      // Set User Calendar
      if (userRes.status === 'fulfilled' && userRes.value) {
        const userData = userRes.value?.calendars || (Array.isArray(userRes.value) ? userRes.value : []);
        setUserCalendar(userData);
      } else {
        setUserCalendar([]);
      }

      // Set Stats
      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setStats(statsRes.value);
      } else {
        setStats(null);
      }

    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setError('Unable to load calendar data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    try {
      await apiPost('/api/v1/calendar/register', {
        user_id: currentUserId,
        calendar_event_id: eventId,
        event_id: 1,
        reminder_minutes: 15
      });
      fetchAllData();
    } catch (err) {
      console.error('Error registering:', err);
      alert('Failed to register for event.');
    }
  };

  const handleUnregister = async (eventId) => {
    try {
      await apiDelete(`/api/v1/calendar/unregister`, {
        params: { user_id: currentUserId, calendar_event_id: eventId }
      });
      fetchAllData();
    } catch (err) {
      console.error('Error unregistering:', err);
      alert('Failed to unregister from event.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header with Create Event Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              📅 Event Calendar
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Browse and register for sessions
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            ➕ Create Event
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex justify-between items-center">
            <span>⚠️ {error}</span>
            <button onClick={fetchAllData} className="underline hover:no-underline font-semibold">Retry</button>
          </div>
        )}

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.total_events || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Total Events</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.total_registrations || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Registrations</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
              <p className="text-3xl font-bold text-purple-600">{stats.total_attended || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Attended</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
              <p className="text-3xl font-bold text-orange-600">{stats.attendance_rate || 0}%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Attendance Rate</p>
            </div>
          </div>
        )}

        {/* Calendar View */}
        <CalendarView
          events={events}
          userCalendar={userCalendar}
          onRegister={handleRegister}
          onUnregister={handleUnregister}
        />

        {/* Create Event Modal */}
        <CreateEventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onEventCreated={fetchAllData}
        />

      </div>
    </div>
  );
};

export default CalendarPage;