// ============================================================================
// ProfileScreen.jsx - PROFESSIONAL UI UPDATE (MATCHING ADOBE XD)
// ============================================================================
// File: frontend/src/pages/main/ProfileScreen.jsx
// Purpose: Display user profile with edit capability, custom modals, and data persistence

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../../services/api';
import apiClient from '../../config/apiClient';
import authService from '../../services/authService';
import toast from 'react-hot-toast';
import { 
  Settings, Edit2, Bookmark, Calendar, UserSquare2, Briefcase, Camera, LogOut, CheckCircle2 
} from 'lucide-react';

const getProfileKey = () => {
  const uid = localStorage.getItem('user_id') || 'guest';
  return `eventai_profile_${uid}`;
};

export default function ProfileScreen() {
  const navigate = useNavigate();

  // State Management
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState(null); 

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
      (rawResponse && rawResponse.data && rawResponse.data.user) ||
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
      const fallbackData = normalizeProfile({});
      if (fallbackData.email || fallbackData.first_name) {
        setProfileData(fallbackData);
        setFormData({
          firstName: fallbackData.first_name || '',
          lastName: fallbackData.last_name || '',
          email: fallbackData.email || '',
          phone: fallbackData.phone || '',
          designation: fallbackData.designation || '',
          company: fallbackData.company || '',
          industry: fallbackData.industry || '',
          subIndustry: fallbackData.subIndustry || '',
          bio: fallbackData.bio || '',
          profilePicture: fallbackData.profile_picture_url || null
        });
      } else {
        setError('Failed to load profile data');
      }
    } finally {
      setIsLoading(false);
    }
  }, [normalizeProfile]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, profilePicture: previewUrl }));
    }
  }, []);

  const handleSaveProfile = useCallback(async () => {
    try {
      setIsSaving(true);
      let finalAvatarUrl = formData.profilePicture;

      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);
        try {
          const uploadResponse = await apiClient.post('/users/me/avatar', uploadData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          finalAvatarUrl = uploadResponse.data.avatar_url;
        } catch (imgError) {
          console.error('Failed to upload image:', imgError);
        }
      }

      const updatePayload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        full_name: ((formData.firstName || '') + ' ' + (formData.lastName || '')).trim(),
        phone: formData.phone,
        designation: formData.designation,
        job_title: formData.designation,
        company: formData.company,
        industry: formData.industry,
        subIndustry: formData.subIndustry,
        bio: formData.bio
      };

      const mergedProfile = {
        ...(profileData || {}),
        ...updatePayload,
        email: formData.email || profileData?.email || '',
        profile_picture_url: finalAvatarUrl || profileData?.profile_picture_url || null
      };

      try {
        localStorage.setItem(getProfileKey(), JSON.stringify(mergedProfile));
      } catch (_) {}

      const response = await apiPost('/users/me', updatePayload);
      const updatedData = normalizeProfile(response || mergedProfile);

      setProfileData(updatedData);
      setSelectedFile(null);
      setIsEditing(false);
      setShowSuccessModal(true); // Trigger exact success modal

    } catch (err) {
      console.error('Failed to save profile:', err);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [formData, profileData, normalizeProfile, selectedFile]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      window.location.href = '/login'; 
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const getInitials = (first, last) => {
    return `${(first || '').charAt(0)}${(last || '').charAt(0)}`.toUpperCase() || 'U';
  };

  if (isLoading) return <div className="min-h-screen bg-[#F5F7FA] flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0000c8]"></div></div>;

  const displayFirstName = profileData?.first_name || formData.firstName || '';
  const displayLastName = profileData?.last_name || formData.lastName || '';
  const displayFullName = `${displayFirstName} ${displayLastName}`.trim() || 'Attendee';
  const displayDesignation = profileData?.designation || formData.designation || '';
  const displayCompany = profileData?.company || formData.company || '';
  const displayAvatar = profileData?.profile_picture_url || formData.profilePicture || null;
  const userInitials = getInitials(displayFirstName, displayLastName);

  // ============================================================================
  // RENDER: EDIT MODE
  // ============================================================================
  if (isEditing) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] pb-24 font-sans relative">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
          <button onClick={() => { setIsEditing(false); setSelectedFile(null); }} className="text-gray-600 font-medium">Cancel</button>
          <h1 className="text-lg font-bold text-gray-900 absolute left-1/2 -translate-x-1/2">Edit Profile</h1>
          <button onClick={handleSaveProfile} disabled={isSaving} className="text-[#0000c8] font-bold">
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="max-w-3xl mx-auto p-4 space-y-6 mt-4">
          
          {/* Avatar Edit */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0000c8] to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-md overflow-hidden">
                {displayAvatar ? <img src={displayAvatar} alt="Profile" className="w-full h-full object-cover" /> : <span>{userInitials}</span>}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-md border border-gray-100">
                <Camera className="w-4 h-4 text-gray-700" />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            <h2 className="mt-3 text-lg font-bold text-gray-900">{displayFullName}</h2>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1 uppercase tracking-wider">Designation</label>
              <input type="text" name="designation" value={formData.designation} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#0000c8]" placeholder="Project Manager"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1 uppercase tracking-wider">Company</label>
              <input type="text" name="company" value={formData.company} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#0000c8]" placeholder="Company Name"/>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mt-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">Info</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Email Id</label>
                <input type="email" value={formData.email} disabled className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Phone Number</label>
                <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white focus-within:border-[#0000c8]">
                  <div className="px-4 py-3 bg-white border-r border-gray-200 text-gray-600 font-medium">+91</div>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-3 outline-none" placeholder="9828098280"/>
                </div>
              </div>
              
              <div>
                <select name="industry" value={formData.industry} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-[#0000c8] appearance-none">
                  <option value="">- Select Industry -</option>
                  <option value="IT">Information Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance">Finance</option>
                  <option value="Education">Education</option>
                </select>
              </div>
              
              <div>
                <select name="subIndustry" value={formData.subIndustry} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-[#0000c8] appearance-none">
                  <option value="">- Select Sub Industry -</option>
                  <option value="Software">Software</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Services">Services</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mt-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">Bio</h3>
            <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows="4" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#0000c8] resize-none text-sm text-gray-600" placeholder="Add a short bio..."></textarea>
          </div>

        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: VIEW MODE (MATCHING DESIGN EXACTLY)
  // ============================================================================
  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-24 font-sans relative">
      
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowLogoutModal(true)} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">
            <Settings size={18} />
          </button>
          <button onClick={() => setIsEditing(true)} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">
            <Edit2 size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto pt-6 px-4">
        {/* Profile Head */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0000c8] to-indigo-500 flex items-center justify-center text-white text-3xl font-bold shadow-sm overflow-hidden mb-3 border-2 border-white ring-2 ring-gray-100">
            {displayAvatar ? <img src={displayAvatar} alt="Profile" className="w-full h-full object-cover" /> : <span>{userInitials}</span>}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{displayFullName}</h2>
          <p className="text-sm text-gray-500 font-medium leading-tight mt-1">{displayDesignation || 'Add designation'}</p>
          <p className="text-sm text-gray-500 font-medium leading-tight">{displayCompany || 'Add company'}</p>
        </div>

        {/* Quick Action Icons Row */}
        <div className="flex items-center justify-center gap-4 mt-8 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex flex-col items-center gap-2 min-w-[72px]" onClick={() => navigate('/my-favourites')}>
            <button className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-800 hover:border-gray-300">
              <Bookmark className="w-6 h-6" />
            </button>
            <span className="text-[11px] font-semibold text-gray-600">Favourites</span>
          </div>
          
          <div className="flex flex-col items-center gap-2 min-w-[72px]" onClick={() => navigate('/my-calendar')}>
            <button className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-800 hover:border-gray-300">
              <Calendar className="w-6 h-6" />
            </button>
            <span className="text-[11px] font-semibold text-gray-600">My Meetings</span>
          </div>
          
          <div className="flex flex-col items-center gap-2 min-w-[72px]" onClick={() => navigate('/my-badges')}>
            <button className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-800 hover:border-gray-300">
              <UserSquare2 className="w-6 h-6" />
            </button>
            <span className="text-[11px] font-semibold text-gray-600">My Badge</span>
          </div>
          
          <div className="flex flex-col items-center gap-2 min-w-[72px]" onClick={() => navigate('/briefcase')}>
            <button className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-800 hover:border-gray-300">
              <Briefcase className="w-6 h-6" />
            </button>
            <span className="text-[11px] font-semibold text-gray-600">Briefcase</span>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="text-base font-bold text-gray-900 mb-4">Info</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-sm font-medium text-gray-500 w-24">Email</span>
              <span className="text-sm font-semibold text-gray-800 flex-1 text-right">{profileData?.email || 'Not specified'}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-sm font-medium text-gray-500 w-24">Phone</span>
              <span className="text-sm font-semibold text-gray-800 flex-1 text-right">{profileData?.phone || '+91 -'}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-sm font-medium text-gray-500 w-24">Industry</span>
              <span className="text-sm font-semibold text-gray-800 flex-1 text-right">{profileData?.industry || 'Industry Name'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 w-32">Sub Industry</span>
              <span className="text-sm font-semibold text-gray-800 flex-1 text-right">{profileData?.subIndustry || 'Sub Industry Name'}</span>
            </div>
          </div>
        </div>

        {/* Bio Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-base font-bold text-gray-900 mb-3">Bio</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {profileData?.bio || 'Add a short bio to introduce yourself...'}
          </p>
        </div>

      </div>

      {/* SUCCESS MODAL OVERLAY */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-2xl w-full max-w-[320px] p-8 flex flex-col items-center text-center shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">Your profile has been saved<br/>successfully!</p>
            <button onClick={() => setShowSuccessModal(false)} className="w-full py-3 bg-[#0000c8] text-white rounded-xl font-bold hover:bg-blue-800 transition-colors">
              My Profile
            </button>
          </div>
        </div>
      )}

      {/* LOGOUT MODAL OVERLAY */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-2xl w-full max-w-[320px] p-8 flex flex-col items-center text-center shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 mb-4 shadow-sm">
              <LogOut className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Logout?</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">Are you sure you want to logout</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleLogout} className="flex-1 py-3 bg-[#0000c8] text-white rounded-xl font-bold hover:bg-blue-800 transition-colors">
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}