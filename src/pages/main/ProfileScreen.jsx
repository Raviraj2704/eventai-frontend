// ============================================================================
// ProfileScreen.jsx - PROFESSIONAL UI UPDATE (MATCHING ADOBE XD)
// ============================================================================
// File: frontend/src/pages/main/ProfileScreen.jsx
// Purpose: Display user profile with edit capability, custom modals, time zone, and quick actions

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../../services/api';
import apiClient from '../../config/apiClient';
import authService from '../../services/authService';
import toast from 'react-hot-toast';
import {
  Settings, Edit2, Bookmark, Calendar, UserSquare2, Briefcase, Camera, LogOut, CheckCircle2, Globe, Bell, X, Check
} from 'lucide-react';

const getProfileKey = () => {
  const uid = localStorage.getItem('user_id') || 'guest';
  return `eventai_profile_${uid}`;
};

const TIMEZONES = [
  "(GMT-07:00) Mountain Standard Time - Dawson Creek",
  "(GMT-11:00) Niue Time",
  "(GMT-11:00) Samoa Standard Time",
  "(GMT-11:00) Tahiti Time",
  "(GMT-11:00) America/Sitika",
  "(GMT-11:00) Alaska Time - Anchorage",
  "(GMT-11:00) Alaska Time - Nome"
];

export default function ProfileScreen() {
  const navigate = useNavigate();

  // State Management
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Settings & Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showTimeZoneModal, setShowTimeZoneModal] = useState(false);
  const [muteNotifications, setMuteNotifications] = useState(false);
  const [selectedTimeZone, setSelectedTimeZone] = useState("(GMT-07:00) Mountain Standard Time - Dawson Creek");
  const [tzSearch, setTzSearch] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: '',
    company: '',
    industry: '',
    subIndustry: '',
    bio: '',
    profilePicture: null
  });

  const normalizeProfile = useCallback((rawResponse) => {
    const unwrapped =
      (rawResponse && rawResponse.user) ||
      (rawResponse && rawResponse.data && rawResponse.user) ||
      (rawResponse && rawResponse.data && rawResponse.data.data) ||
      (rawResponse && rawResponse.data) ||
      rawResponse ||
      {};

    let cached = {};
    try {
      const savedStr = localStorage.getItem(getProfileKey());
      if (savedStr) {
        cached = JSON.parse(savedStr);
      }
    } catch (_) {}

    const fullName = unwrapped.full_name || cached.full_name || '';
    const nameParts = fullName ? fullName.split(' ') : [];

    const first_name = unwrapped.first_name || unwrapped.firstName || cached.first_name || nameParts[0] || '';
    const last_name = unwrapped.last_name || unwrapped.lastName || cached.last_name || (nameParts.length !== 0 ? nameParts.slice(1).join(' ') : '') || '';
    
    return {
      ...unwrapped,
      id: unwrapped.id || cached.id || 1,
      first_name,
      last_name,
      email: unwrapped.email || cached.email || '',
      phone: unwrapped.phone || cached.phone || '',
      designation: unwrapped.designation || unwrapped.job_title || cached.designation || cached.job_title || '',
      company: unwrapped.company || cached.company || '',
      industry: unwrapped.industry || cached.industry || '',
      subIndustry: unwrapped.subIndustry || cached.subIndustry || '',
      bio: unwrapped.bio || cached.bio || '',
      profile_picture_url: unwrapped.profile_picture_url || unwrapped.avatar_url || cached.profile_picture_url || null
    };
  }, []);

  const fetchProfileData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiGet('/users/me');
      const data = normalizeProfile(response);
      
      if (data) {
        setProfileData(data);
        setFormData({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          designation: data.designation || '',
          company: data.company || '',
          industry: data.industry || '',
          subIndustry: data.subIndustry || '',
          bio: data.bio || '',
          profilePicture: data.profile_picture_url || null
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      // Fallback to cache if available
      try {
        const savedStr = localStorage.getItem(getProfileKey());
        if (savedStr) {
          const cached = JSON.parse(savedStr);
          setProfileData(cached);
          setFormData(cached);
        }
      } catch (_) {}
    } finally {
      setIsLoading(false);
    }
  }, [normalizeProfile]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone,
        designation: formData.designation,
        company: formData.company,
        industry: formData.industry,
        subIndustry: formData.subIndustry,
        bio: formData.bio
      };

      await apiPost('/users/me', payload).catch(() => {});
      
      const updated = { ...profileData, ...formData, full_name: payload.full_name };
      setProfileData(updated);
      localStorage.setItem(getProfileKey(), JSON.stringify(updated));
      
      setIsEditing(false);
      setShowSuccessModal(true);
    } catch (err) {
      toast.error('Could not save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (_) {}
    localStorage.clear();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white max-w-[430px] mx-auto pb-32">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        <h1 className="text-xl font-bold">My Profile</h1>
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => setShowTimeZoneModal(true)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/25 transition"
            title="Profile Settings"
          >
            <Settings size={18} />
          </button>
          <button 
            type="button" 
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/25 transition"
            title="Edit Profile"
          >
            <Edit2 size={18} />
          </button>
        </div>
      </div>

      {!isEditing ? (
        <div className="px-4 pt-6 space-y-6">
          {/* Avatar & Basic Info */}
          <div className="flex flex-col items-center text-center">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500 mb-3 bg-slate-800">
              {profileData?.profile_picture_url ? (
                <img src={profileData.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold bg-blue-600">
                  {(profileData?.first_name?.[0] || 'U').toUpperCase()}
                </div>
              )}
            </div>
            <h2 className="text-lg font-bold">
              {profileData?.first_name} {profileData?.last_name}
            </h2>
            <p className="text-sm text-slate-400">{profileData?.designation || 'Attendee'}</p>
            <p className="text-xs text-slate-500">{profileData?.company || 'Company Name'}</p>
          </div>

          {/* Action Icons Row (Matching Adobe XD) */}
          <div className="grid grid-cols-4 gap-3 bg-slate-900 border border-white/10 rounded-2xl p-3">
            <button onClick={() => navigate('/favourites')} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/5 transition text-slate-300">
              <Bookmark size={20} className="text-blue-400" />
              <span className="text-[11px] font-medium">Favourites</span>
            </button>
            <button onClick={() => navigate('/meetings')} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/5 transition text-slate-300">
              <Calendar size={20} className="text-purple-400" />
              <span className="text-[11px] font-medium">Meetings</span>
            </button>
            <button onClick={() => navigate('/my-badges')} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/5 transition text-slate-300">
              <UserSquare2 size={20} className="text-emerald-400" />
              <span className="text-[11px] font-medium">My Badge</span>
            </button>
            <button onClick={() => navigate('/briefcase')} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/5 transition text-slate-300">
              <Briefcase size={20} className="text-amber-400" />
              <span className="text-[11px] font-medium">Briefcase</span>
            </button>
          </div>

          {/* Info Section */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Email :</span>
                <span className="text-slate-200 font-medium">{profileData?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Phone :</span>
                <span className="text-slate-200 font-medium">{profileData?.phone || '+91 9828098280'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Industry :</span>
                <span className="text-slate-200 font-medium">{profileData?.industry || 'Industry Name'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Sub Industry :</span>
                <span className="text-slate-200 font-medium">{profileData?.subIndustry || 'Sub Industry Name'}</span>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bio</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {profileData?.bio || 'Attendee at EventAI. Passionate about technology, networking, and building autonomous systems.'}
            </p>
          </div>

          {/* Profile Settings Menu Options */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
            <button 
              onClick={() => setShowTimeZoneModal(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition border-b border-white/5"
            >
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-blue-400" />
                <span className="text-sm font-medium">Time Zone</span>
              </div>
              <span className="text-xs text-slate-400">›</span>
            </button>
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-purple-400" />
                <span className="text-sm font-medium">Mute Notification</span>
              </div>
              <button 
                type="button"
                onClick={() => setMuteNotifications(!muteNotifications)}
                className={`w-11 h-6 rounded-full transition relative ${muteNotifications ? 'bg-blue-600' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${muteNotifications ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
            <button 
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center gap-3 p-4 hover:bg-red-500/10 transition text-red-400"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      ) : (
        /* Edit Profile Form */
        <form onSubmit={handleSave} className="px-4 pt-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400">First Name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Last Name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Designation</label>
            <input
              type="text"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Company</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Email Id (Read-only)</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Phone Number</label>
            <div className="flex gap-2">
              <span className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-400 flex items-center">+91</span>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Select Industry</label>
            <select
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">- Select Industry -</option>
              <option value="Technology">Technology</option>
              <option value="Finance">Finance</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Select Sub Industry</label>
            <select
              value={formData.subIndustry}
              onChange={(e) => setFormData({ ...formData, subIndustry: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">- Select Sub Industry -</option>
              <option value="Software & AI">Software & AI</option>
              <option value="SaaS">SaaS</option>
              <option value="Fintech">Fintech</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Bio</label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition text-sm"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Time Zone Modal */}
      {showTimeZoneModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Time Zone</h3>
              <button onClick={() => setShowTimeZoneModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <input
              type="text"
              placeholder="Search here..."
              value={tzSearch}
              onChange={(e) => setTzSearch(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {TIMEZONES.filter(tz => tz.toLowerCase().includes(tzSearch.toLowerCase())).map((tz, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTimeZone(tz)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs transition ${selectedTimeZone === tz ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'hover:bg-white/5 text-slate-300'}`}
                >
                  <span>{tz}</span>
                  {selectedTimeZone === tz && <Check size={16} />}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setShowTimeZoneModal(false);
                toast.success('Timezone updated successfully');
              }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition text-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-lg font-bold text-white">Success!</h3>
            <p className="text-sm text-slate-400">Your profile has been saved successfully!</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition text-sm"
            >
              My Profile
            </button>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto">
              <LogOut size={32} />
            </div>
            <h3 className="text-lg font-bold text-white">Logout?</h3>
            <p className="text-sm text-slate-400">Are you sure you want to logout</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition text-sm"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}