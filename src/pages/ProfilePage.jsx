import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPut } from '../services/api';
import ProfileSettingsItem from '../components/ProfileSettingsItem';
import '../styles/profile-screen.css';

export const ProfilePage = () => {
  const navigate = useNavigate();
  
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    company: '',
    title: '',
    phone: '',
    location: '',
    social_twitter: '',
    social_linkedin: '',
    is_public: true
  });

  // ==========================================
  // FETCH USER DATA
  // ==========================================
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError('');

      const userData = await apiGet('/api/v1/users/me');
      setUser(userData);
      setFormData({
        full_name: userData.full_name || '',
        bio: userData.bio || '',
        company: userData.company || '',
        title: userData.title || '',
        phone: userData.phone || '',
        location: userData.location || '',
        social_twitter: userData.social_twitter || '',
        social_linkedin: userData.social_linkedin || '',
        is_public: userData.is_public !== false
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Unable to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // HANDLE FORM CHANGES
  // ==========================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // ==========================================
  // SAVE PROFILE
  // ==========================================
  const handleSave = async () => {
    if (!user?.id) {
      setError('User ID not found. Please refresh and try again.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updatedUser = await apiPut(`/api/v1/users/${user.id}`, formData);
      setUser(updatedUser);
      setSuccess('✅ Profile updated successfully');
      setEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    sessionStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="bg-slate-950 min-h-screen text-white flex items-center justify-center">
        <div className="border-t-blue-500 border-4 rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 min-h-screen text-white font-sans pb-32 overflow-y-auto">
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md px-6 py-4 border-b border-white/10 flex justify-between items-center">
        <button 
          onClick={() => navigate('/home')}
          className="w-10 h-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-lg hover:bg-slate-800 transition-colors"
        >
          ←
        </button>
        <div className="text-center">
          <h1 className="font-bold text-lg tracking-wide">Profile</h1>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        
        {/* Notifications */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-xl">
            {success}
          </div>
        )}

        {editing ? (
          // ==========================================
          // EDIT MODE
          // ==========================================
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Edit Profile</h2>
              <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="3"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2">Company</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2">Job Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2">Twitter</label>
                  <input
                    type="text"
                    name="social_twitter"
                    value={formData.social_twitter}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2">LinkedIn</label>
                  <input
                    type="text"
                    name="social_linkedin"
                    value={formData.social_linkedin}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-white"
                />
              </div>

              <button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 mt-6 rounded-xl transition-all"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          // ==========================================
          // VIEW MODE
          // ==========================================
          <div className="space-y-6">
            
            {/* Profile Header */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold overflow-hidden border-2 border-slate-950">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.full_name?.charAt(0) || 'U'}</span>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold leading-tight">{user?.full_name || 'User'}</h2>
                  <p className="text-blue-400 text-xs mt-1">{user?.title || 'Professional'}</p>
                  <p className="text-slate-400 text-xs">{user?.company || 'Company'}</p>
                </div>
              </div>
              <button 
                className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600/30"
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
            </div>

            {/* Account Section */}
            <div>
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3 px-2">Account</h3>
              <div className="space-y-2">
                <ProfileSettingsItem 
                  icon="👤" 
                  label="Edit Profile" 
                  description="Update your profile information" 
                  onClick={() => setEditing(true)} 
                />
                <ProfileSettingsItem 
                  icon="📧" 
                  label="Email Address" 
                  value={user?.email || 'N/A'} 
                  showArrow={true} 
                  onClick={() => alert("Email editing coming soon!")} 
                />
              </div>
            </div>

            {/* Notifications */}
            <div>
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3 px-2 mt-6">Notifications</h3>
              <div className="bg-slate-900 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">🔔</div>
                  <div>
                    <p className="font-medium text-white">All Notifications</p>
                    <p className="text-slate-400 text-xs">Event updates and reminders</p>
                  </div>
                </div>
                <button 
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${notificationsEnabled ? 'bg-blue-600' : 'bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${notificationsEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            {/* Logout Button */}
            <button
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold border border-red-500/20 py-4 mt-8 rounded-xl transition-all"
              onClick={() => setShowLogoutConfirm(true)}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm">
            <h2 className="text-xl font-bold mb-2 text-white">Confirm Logout</h2>
            <p className="text-slate-400 mb-6">Are you sure you want to sign out?</p>
            <div className="flex gap-4">
              <button 
                className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700" 
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-500" 
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-lg border-t border-white/10 px-6 py-3 flex justify-between items-center z-50">
        <button onClick={() => navigate('/home')} className="flex flex-col items-center text-slate-400 hover:text-white">
          <span className="text-xl mb-1">🏠</span><span className="text-[10px]">Home</span>
        </button>
        <button onClick={() => navigate('/sessions')} className="flex flex-col items-center text-slate-400 hover:text-white">
          <span className="text-xl mb-1">📅</span><span className="text-[10px]">Agenda</span>
        </button>
        <button onClick={() => navigate('/hub')} className="flex flex-col items-center text-slate-400 hover:text-white">
          <span className="text-xl mb-1">⚡</span><span className="text-[10px]">Hub</span>
        </button>
        <button onClick={() => navigate('/networking')} className="flex flex-col items-center text-slate-400 hover:text-white">
          <span className="text-xl mb-1">🤝</span><span className="text-[10px]">Network</span>
        </button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center text-blue-500">
          <span className="text-xl mb-1">👤</span><span className="text-[10px] font-bold">Profile</span>
        </button>
      </div>

    </div>
  );
};

export default ProfilePage;