// ============================================================================
// ProfileScreen.jsx - PROFESSIONAL UI UPDATE
// ============================================================================
// File: frontend/src/pages/main/ProfileScreen.jsx
// Purpose: Display user profile with edit capability and data persistence
// Status: Production-Ready ✅

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Mail, Phone, Briefcase, Building, FileText, Info, 
  Shield, Calendar, Edit2, Save, X, Camera, User as UserIcon 
} from 'lucide-react';

const LOCAL_PROFILE_KEY = 'eventai_saved_profile_cache';

export default function ProfileScreen() {
  const navigate = useNavigate();

  // State Management
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: '',
    company: '',
    bio: '',
    profilePicture: null
  });

  // Helper to normalize profile payload from any backend/wrapper format
  const normalizeProfile = useCallback((rawResponse) => {
    const unwrapped =
      (rawResponse && rawResponse.user) ||
      (rawResponse && rawResponse.data && rawResponse.data.user) ||
      (rawResponse && rawResponse.data && rawResponse.data.data) ||
      (rawResponse && rawResponse.data) ||
      rawResponse ||
      {};

    let cached = {};
    try {
      const savedStr = localStorage.getItem(LOCAL_PROFILE_KEY);
      if (savedStr) {
        cached = JSON.parse(savedStr);
      }
    } catch (_) {
      // ignore storage errors
    }

    const fullName = unwrapped.full_name || cached.full_name || '';
    const nameParts = fullName ? fullName.split(' ') : [];

    const first_name = unwrapped.first_name || unwrapped.firstName || cached.first_name || nameParts[0] || '';
    const last_name = unwrapped.last_name || unwrapped.lastName || cached.last_name || (nameParts.length !== 0 ? nameParts.slice(1).join(' ') : '') || '';
    const email = unwrapped.email || cached.email || '';
    const phone = unwrapped.phone || cached.phone || '';
    const designation = unwrapped.designation || unwrapped.job_title || cached.designation || cached.job_title || '';
    const company = unwrapped.company || cached.company || '';
    const bio = unwrapped.bio || cached.bio || '';
    const profile_picture_url = unwrapped.profile_picture_url || unwrapped.avatar_url || cached.profile_picture_url || null;

    return {
      ...unwrapped,
      id: unwrapped.id || cached.id || 1,
      role: unwrapped.role || cached.role || 'User',
      created_at: unwrapped.created_at || cached.created_at || new Date().toISOString(),
      first_name,
      last_name,
      email,
      phone,
      designation,
      job_title: designation,
      company,
      bio,
      profile_picture_url
    };
  }, []);

  // ============================================================================
  // FETCH PROFILE DATA
  // ============================================================================
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
          designation: data.designation || data.job_title || '',
          company: data.company || '',
          bio: data.bio || '',
          profilePicture: data.profile_picture_url || null
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      const fallbackData = normalizeProfile({});
      if (fallbackData.email || fallbackData.first_name || fallbackData.phone) {
        setProfileData(fallbackData);
        setFormData({
          firstName: fallbackData.first_name || '',
          lastName: fallbackData.last_name || '',
          email: fallbackData.email || '',
          phone: fallbackData.phone || '',
          designation: fallbackData.designation || '',
          company: fallbackData.company || '',
          bio: fallbackData.bio || '',
          profilePicture: fallbackData.profile_picture_url || null
        });
      } else {
        setError('Failed to load profile data');
        setProfileData(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [normalizeProfile]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleImageUpload = useCallback((e) => {
    const files = e.target.files;
    const file = files && files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          profilePicture: event.target ? event.target.result : null
        }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSaveProfile = useCallback(async () => {
    try {
      setIsSaving(true);
      const updatePayload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        full_name: ((formData.firstName || '') + ' ' + (formData.lastName || '')).trim(),
        phone: formData.phone,
        designation: formData.designation,
        job_title: formData.designation,
        company: formData.company,
        bio: formData.bio
      };

   const mergedProfile = {
        ...(profileData || {}),
        ...updatePayload,
        email: formData.email || (profileData && profileData.email) || '',
        profile_picture_url: formData.profilePicture || (profileData && profileData.profile_picture_url) || null
      };

      try {
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(mergedProfile));
      } catch (_) {}

      const response = await apiPost('/users/me', updatePayload);
      const updatedData = normalizeProfile(response || mergedProfile);

      setProfileData({
        ...updatedData,
        first_name: formData.firstName || updatedData.first_name,
        last_name: formData.lastName || updatedData.last_name,
        phone: formData.phone || updatedData.phone,
        designation: formData.designation || updatedData.designation || updatedData.job_title,
        job_title: formData.designation || updatedData.job_title,
        company: formData.company || updatedData.company,
        bio: formData.bio || updatedData.bio,
        profile_picture_url: formData.profilePicture || updatedData.profile_picture_url
      });

      toast.success('Profile updated successfully! 🎉');
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [formData, profileData, normalizeProfile]);

  // Helper to generate initials for avatar
  const getInitials = (first, last) => {
    return `${(first || '').charAt(0)}${(last || '').charAt(0)}`.toUpperCase() || 'U';
  };

  // ============================================================================
  // RENDER: LOADING & ERROR STATES
  // ============================================================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center pb-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-neutral-500 font-medium">Loading your profile...</p>
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center pb-24 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Unable to Load Profile</h2>
          <p className="text-neutral-600 mb-6">{error}</p>
          <button onClick={fetchProfileData} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Define display variables
  const displayFirstName = (profileData && profileData.first_name) || formData.firstName || '';
  const displayLastName = (profileData && profileData.last_name) || formData.lastName || '';
  const displayDesignation = (profileData && (profileData.designation || profileData.job_title)) || formData.designation || '';
  const displayEmail = (profileData && profileData.email) || formData.email || '';
  const displayPhone = (profileData && profileData.phone) || formData.phone || '';
  const displayCompany = (profileData && profileData.company) || formData.company || '';
  const displayBio = (profileData && profileData.bio) || formData.bio || '';
  const displayAvatar = (profileData && profileData.profile_picture_url) || formData.profilePicture || null;
  const userInitials = getInitials(displayFirstName, displayLastName);

  // Helper for empty states
  const EmptyState = ({ text }) => <span className="text-neutral-400 italic text-sm">{text}</span>;

// ============================================================================
  // RENDER: EDIT MODE
  // ============================================================================
  if (isEditing) {
    return (
      <div className="min-h-screen bg-neutral-50 pb-24">
        {/* Sticky Action Bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-4 py-4 flex items-center justify-between shadow-sm">
          <h1 className="text-xl font-bold text-neutral-900">Edit Profile</h1>
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(false)} disabled={isSaving} className="px-4 py-2 text-sm font-bold text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">
              Cancel
            </button>
            <button onClick={handleSaveProfile} disabled={isSaving} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Save className="w-4 h-4"/>}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto p-4 space-y-6 mt-4">
          {/* Avatar Edit Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-md overflow-hidden border-4 border-white">
                {displayAvatar ? (
                  <img src={displayAvatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{userInitials}</span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-neutral-800 transition-colors border-2 border-white">
                <Camera className="w-4 h-4 text-white" />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            <p className="text-sm text-neutral-500 font-medium">Tap icon to change photo</p>
          </div>

          {/* Personal Info Form */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
            <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-blue-500" /> Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1">First Name</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="First Name"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1">Last Name</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Last Name"/>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-neutral-700 mb-1">Email (Read Only)</label>
                <input type="email" value={formData.email} disabled className="w-full px-4 py-2.5 bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-500 cursor-not-allowed" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-neutral-700 mb-1">Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g., +91 9876543210"/>
              </div>
            </div>
          </div>

          {/* Professional Info Form */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
            <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-500" /> Professional Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1">Designation</label>
                <input type="text" name="designation" value={formData.designation} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g., Senior AI Engineer"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1">Company</label>
                <input type="text" name="company" value={formData.company} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g., Tech Corp"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1">Bio</label>
                <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows="4" className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" placeholder="Write a short bio about yourself..."></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: VIEW MODE (Professional Card Layout)
  // ============================================================================
  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      
      {/* Header Profile Card */}
      <div className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar - Perfect Circle */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden flex-shrink-0 ring-4 ring-blue-50">
              {displayAvatar ? (
                <img src={displayAvatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{userInitials}</span>
              )}
            </div>
            
            {/* Title & Edit Button */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-extrabold text-neutral-900 mb-1">
                {displayFirstName} {displayLastName}
              </h1>
              <p className="text-lg text-neutral-600 font-medium mb-4">
                {displayDesignation || <EmptyState text="+ Add designation" />}
              </p>
              <button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-neutral-200 rounded-full text-sm font-bold text-neutral-700 hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm">
                <Edit2 className="w-4 h-4" /> Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-4 mt-2">
        
        {/* Contact Info Card */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-neutral-100">
          <h2 className="text-base font-bold text-neutral-900 mb-4 flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Mail className="w-5 h-5 text-blue-500" /> Contact Information
          </h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <span className="text-sm font-medium text-neutral-500 w-32">Email</span>
              <span className="text-base font-semibold text-neutral-900 flex-1">{displayEmail || <EmptyState text="Not specified" />}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <span className="text-sm font-medium text-neutral-500 w-32">Phone</span>
              <span className="text-base font-semibold text-neutral-900 flex-1">{displayPhone || <EmptyState text="+ Add phone number" />}</span>
            </div>
          </div>
        </div>

        {/* Professional Info Card */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-neutral-100">
          <h2 className="text-base font-bold text-neutral-900 mb-4 flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Briefcase className="w-5 h-5 text-blue-500" /> Professional Overview
          </h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between">
              <span className="text-sm font-medium text-neutral-500 w-32 pt-0.5">Company</span>
              <span className="text-base font-semibold text-neutral-900 flex-1 flex items-center gap-2">
                <Building className="w-4 h-4 text-neutral-400" />
                {displayCompany || <EmptyState text="+ Add company" />}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between">
              <span className="text-sm font-medium text-neutral-500 w-32 pt-0.5">Bio</span>
              <span className="text-base font-medium text-neutral-700 flex-1 leading-relaxed">
                {displayBio || <EmptyState text="Add a short bio to introduce yourself to others." />}
              </span>
            </div>
          </div>
        </div>

        {/* Account Info Card */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-neutral-100">
          <h2 className="text-base font-bold text-neutral-900 mb-4 flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Shield className="w-5 h-5 text-blue-500" /> Account Details
          </h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <span className="text-sm font-medium text-neutral-500 w-32">User ID</span>
              <span className="text-sm font-mono font-bold text-neutral-700 bg-neutral-100 px-2 py-1 rounded">#{(profileData && profileData.id) || 'N/A'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <span className="text-sm font-medium text-neutral-500 w-32">Role</span>
              <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full w-max">
                {(profileData && profileData.role) || 'User'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <span className="text-sm font-medium text-neutral-500 w-32">Member Since</span>
              <span className="text-base font-semibold text-neutral-900 flex-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-400" />
                {profileData && profileData.created_at ? new Date(profileData.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}