import React, { useState, useEffect } from 'react';
import { apiGet, apiPut, apiDelete } from '../services/api';
import { NotificationCard } from '../components/Notifications/NotificationCard';
import { NotificationSettings } from '../components/Notifications/NotificationSettings';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadNotificationsData();
  }, [filterType]);

  const loadNotificationsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch notifications
      const notificationsData = await apiGet('/api/v1/notifications');
      let filtered = Array.isArray(notificationsData) ? notificationsData : [];

      // Apply filter
      if (filterType === 'unread') {
        filtered = filtered.filter(n => !n.is_read);
      } else if (filterType === 'session_reminder') {
        filtered = filtered.filter(n => n.type === 'session');
      }

      setNotifications(filtered);

      // Calculate stats
      const allNotifications = Array.isArray(notificationsData) ? notificationsData : [];
      const unreadCount = allNotifications.filter(n => !n.is_read).length;
      const messageCount = allNotifications.filter(n => n.type === 'message').length;

      setStats({
        total: allNotifications.length,
        unread: unreadCount,
        by_type: {
          message: messageCount,
          session: allNotifications.filter(n => n.type === 'session').length,
          announcement: allNotifications.filter(n => n.type === 'announcement').length
        }
      });
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Unable to load notifications. Please try again.');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await apiPut(`/api/v1/notifications/${notificationId}/read`, {});
      await loadNotificationsData();
    } catch (err) {
      console.error('Error marking as read:', err);
      setError('Failed to mark notification as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(n => apiPut(`/api/v1/notifications/${n.id}/read`, {}))
      );
      await loadNotificationsData();
    } catch (err) {
      console.error('Error marking all as read:', err);
      setError('Failed to mark all as read');
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await apiDelete(`/api/v1/notifications/${notificationId}`);
      await loadNotificationsData();
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">🔔 Notifications</h1>
            <p className="text-gray-600 dark:text-gray-400">Stay updated with event activities</p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="mb-8 relative">
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowSettings(false)} />
            <div className="relative z-50">
              <NotificationSettings onSave={() => { loadNotificationsData(); }} />
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
            ⚠️ {error}
            <button 
              onClick={loadNotificationsData}
              className="ml-2 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold">Total</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.total}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold">Unread</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.unread}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold">Messages</p>
              <p className="text-3xl font-bold text-pink-600 mt-2">{stats.by_type?.message || 0}</p>
            </div>
          </div>
        )}

        {/* Filter & Actions */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex gap-3">
            {['all', 'unread', 'session_reminder'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filterType === type
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                }`}
              >
                {type === 'all' && '📋 All'}
                {type === 'unread' && '🔴 Unread'}
                {type === 'session_reminder' && '📋 Sessions'}
              </button>
            ))}
          </div>

          {stats && stats.unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">✨ No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.map((notif) => (
                <NotificationCard
                  key={notif.id}
                  notification={{
                    id: notif.id,
                    title: notif.title || 'Notification',
                    message: notif.message || notif.content || '',
                    type: notif.type || 'notification',
                    is_read: notif.is_read || false,
                    created_at: notif.created_at,
                    updated_at: notif.updated_at
                  }}
                  onMarkRead={() => handleMarkRead(notif.id)}
                  onDelete={() => handleDelete(notif.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;