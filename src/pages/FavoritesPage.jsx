import React, { useState, useEffect } from 'react';
import { apiGet } from '../services/api';
import { FavoriteCard } from '../components/Favorites/FavoriteCard';

export const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [stats, setStats] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFavoritesData();
  }, [filterType, sortBy]);

  const loadFavoritesData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch favorites
      const favoritesData = await apiGet('/api/v1/favorites');
      let filtered = Array.isArray(favoritesData) ? favoritesData : [];

      // Apply filter
      if (filterType !== 'all') {
        filtered = filtered.filter(f => f.type === filterType || f.favorite_type === filterType);
      }

      // Apply sort
      if (sortBy === 'pinned') {
        filtered.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));
      } else if (sortBy === 'az') {
        filtered.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''));
      } else {
        filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      }

      setFavorites(filtered);

      // Calculate stats
      setStats({
        total_favorites: filtered.length,
        pinned_count: filtered.filter(f => f.is_pinned).length,
        by_type: {
          session: filtered.filter(f => f.type === 'session').length,
          speaker: filtered.filter(f => f.type === 'speaker').length,
          person: filtered.filter(f => f.type === 'person').length
        }
      });
    } catch (err) {
      console.error('Failed to load favorites:', err);
      setError('Unable to load favorites. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">My Bookmarks & Favorites</h1>
        <p className="text-gray-400 mb-6">Access your saved sessions, speakers, and event highlights in one place.</p>

        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-600 text-red-300 px-4 py-3 rounded-lg">
            ⚠️ {error}
            <button 
              onClick={loadFavoritesData}
              className="ml-2 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-sm">Total Saved</p>
              <p className="text-2xl font-bold">{stats.total_favorites}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-sm">Pinned Items</p>
              <p className="text-2xl font-bold text-red-400">{stats.pinned_count}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-sm">Sessions</p>
              <p className="text-2xl font-bold text-blue-400">{stats.by_type?.session || 0}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-sm">People / Speakers</p>
              <p className="text-2xl font-bold text-green-400">{stats.by_type?.speaker || stats.by_type?.person || 0}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded text-sm font-semibold ${filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              All Favorites
            </button>
            <button
              onClick={() => setFilterType('session')}
              className={`px-4 py-2 rounded text-sm font-semibold ${filterType === 'session' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              Sessions
            </button>
            <button
              onClick={() => setFilterType('speaker')}
              className={`px-4 py-2 rounded text-sm font-semibold ${filterType === 'speaker' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              Speakers
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="recent">Recent First</option>
              <option value="pinned">Pinned First</option>
              <option value="az">A-Z</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="border-t-blue-500 border-4 rounded-full w-8 h-8 animate-spin mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading favorites...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-lg mb-2">No favorites found.</p>
            <p className="text-sm text-gray-500">Click the star icon (⭐) on any session or speaker to save them here!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((fav) => (
              <FavoriteCard
                key={fav.id}
                favorite={{
                  id: fav.id,
                  type: fav.type || fav.favorite_type,
                  title: fav.title || fav.name,
                  description: fav.description || '',
                  image: fav.image || fav.avatar,
                  isPinned: fav.is_pinned || false,
                  createdAt: fav.created_at
                }}
                onUpdate={loadFavoritesData}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;