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
  ArrowLeft,
  Award,
  Bell,
  BellOff,
  Bookmark,
  Briefcase,
  Building,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Edit2,
  Edit3,
  ExternalLink,
  FileText,
  Folder,
  Globe,
  Heart,
  Info,
  Layers,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MoreVertical,
  Pencil,
  Phone,
  QrCode,
  Save,
  Search,
  Settings,
  Share2,
  Shield,
  Sliders,
  Sparkles,
  Star,
  Trash2,
  Upload,
  User as UserIcon,
  User,
  UserCheck,
  Users,
  UserSquare,
  UserSquare2,
  X,
  XCircle
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
      
      const updated = { ...profileData, ...formData, full_name: payload.full_name};
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-blue-600">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 max-w-[430px] mx-auto pb-32">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">{isEditing ? 'Edit Profile' : 'My Profile'}</h1>
        <div className="flex items-center gap-3">
          {!isEditing && (
            <button 
              type="button" 
              onClick={() => setShowTimeZoneModal(true)}
              className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              title="Profile Settings"
            >
              <Settings size={18} />
            </button>
          )}
          <button 
            type="button" 
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Edit Profile"
          >
            {isEditing ? <X size={18} /> : <Edit2 size={18} />}
          </button>
        </div>
      </div>

      {!isEditing ? (
        <div className="px-4 pt-6 space-y-6">
          {/* Avatar & Basic Info */}
          <div className="flex flex-col items-center text-center">
            <div className="relative w-24 h-24 rounded-full overflow-hidden shadow-sm mb-3 bg-slate-100 border-4 border-white">
              {profileData?.profile_picture_url ? (
                <img src={profileData.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold bg-blue-100 text-blue-700">
                  {(profileData?.first_name?.[0] || 'U').toUpperCase()}
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {profileData?.first_name} {profileData?.last_name}
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">{profileData?.designation || 'Attendee'}</p>
            <p className="text-xs text-slate-400 mt-0.5">{profileData?.company || 'Company Name'}</p>
          </div>

          {/* Action Icons Row (Matching Adobe XD) */}
          <div className="flex justify-between items-center bg-white border border-slate-200 shadow-sm rounded-2xl px-5 py-4">
            <button onClick={() => navigate('/favourites')} className="flex flex-col items-center gap-2 group">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 group-hover:bg-slate-100 transition">
                <Bookmark size={22} className="text-slate-700" />
              </div>
              <span className="text-[11px] font-medium text-slate-600">Favourites</span>
            </button>
            <button onClick={() => navigate('/meetings')} className="flex flex-col items-center gap-2 group">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 group-hover:bg-slate-100 transition">
                <Calendar size={22} className="text-slate-700" />
              </div>
              <span className="text-[11px] font-medium text-slate-600">My Meetings</span>
            </button>
            <button onClick={() => navigate('/my-badges')} className="flex flex-col items-center gap-2 group">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 group-hover:bg-slate-100 transition">
                <UserSquare2 size={22} className="text-slate-700" />
              </div>
              <span className="text-[11px] font-medium text-slate-600">My Badge</span>
            </button>
            <button onClick={() => navigate('/briefcase')} className="flex flex-col items-center gap-2 group">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 group-hover:bg-slate-100 transition">
                <Briefcase size={22} className="text-slate-700" />
              </div>
              <span className="text-[11px] font-medium text-slate-600">Briefcase</span>
            </button>
          </div>

          {/* Info Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Info</h3>
            <div className="space-y-0 text-sm">
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Email :</span>
                <span className="text-slate-800">{profileData?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Phone :</span>
                <span className="text-slate-800">{profileData?.phone || '+91 9828098280'}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Industry :</span>
                <span className="text-slate-800">{profileData?.industry || 'Industry Name'}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-slate-500 font-medium">Sub Industry :</span>
                <span className="text-slate-800">{profileData?.subIndustry || 'Sub Industry Name'}</span>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
            <h3 className="text-sm font-bold text-slate-900">Bio</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {profileData?.bio || 'Attendee at EventAI. Passionate about technology, networking, and building autonomous systems.'}
            </p>
          </div>

          {/* Settings Menu Options (Rendered Inline as in original logic) */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-6">
            <button 
              onClick={() => setShowTimeZoneModal(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition border-b border-slate-100"
            >
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-slate-700" />
                <span className="text-sm font-medium text-slate-800">Time Zone</span>
              </div>
              <span className="text-lg text-slate-400">›</span>
            </button>
            
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-slate-700" />
                <span className="text-sm font-medium text-slate-800">Mute Notification</span>
              </div>
              <button 
                type="button"
                onClick={() => setMuteNotifications(!muteNotifications)}
                className={`w-11 h-6 rounded-full transition relative ${muteNotifications ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 shadow-sm transition-all ${muteNotifications ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
            
            <button 
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center gap-3 p-4 hover:bg-red-50 transition text-red-600"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      ) : (
        /* Edit Profile Form */
        <form onSubmit={handleSave} className="px-4 pt-6 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            
            {/* Form Fields Matching Adobe XD */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 ml-1">Designation</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                placeholder="Project Manager"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 ml-1">Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                placeholder="Company Name"
              />
            </div>

            <div className="pt-2 pb-2">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Info</h3>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 ml-1">Email Id</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 ml-1">Phone Number</label>
                  <div className="flex gap-2">
                    <span className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 font-medium flex items-center justify-center min-w-[60px]">+91</span>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                      placeholder="9828098280"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition appearance-none"
                  >
                    <option value="">- Select Industry -</option>
                    <option value="Technology">Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <select
                    value={formData.subIndustry}
                    onChange={(e) => setFormData({ ...formData, subIndustry: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition appearance-none"
                  >
                    <option value="">- Select Sub Industry -</option>
                    <option value="Software & AI">Software & AI</option>
                    <option value="SaaS">SaaS</option>
                    <option value="Fintech">Fintech</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-medium text-slate-500 ml-1">Bio</label>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition resize-none"
                placeholder="Write your bio here..."
              />
            </div>
          </div>

          <div className="pt-2 pb-6">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-[#0000c8] hover:bg-blue-800 text-white font-semibold py-3.5 rounded-xl transition text-sm shadow-md"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Time Zone Modal */}
      {showTimeZoneModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <button onClick={() => setShowTimeZoneModal(false)} className="text-slate-400 hover:text-slate-600">
                <ArrowLeft size={20} />
              </button>
              <h3 className="text-lg font-bold text-slate-900">Time Zone</h3>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search here"
                  value={tzSearch}
                  onChange={(e) => setTzSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 transition"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              
              <div className="text-xs text-slate-500 font-medium px-1">Selected Timezone</div>
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {TIMEZONES.filter(tz => tz.toLowerCase().includes(tzSearch.toLowerCase())).map((tz, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedTimeZone(tz)}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-left text-sm transition text-slate-700 hover:bg-slate-50"
                  >
                    <span className="pr-4">{tz}</span>
                    {selectedTimeZone === tz && <Check size={18} className="text-slate-900 flex-shrink-0" />}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => {
                  setShowTimeZoneModal(false);
                  toast.success('Timezone updated');
                }}
                className="w-full bg-[#0000c8] hover:bg-blue-800 text-white font-semibold py-3.5 rounded-xl transition text-sm mt-2"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-green-500/30">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Success!</h3>
            <p className="text-sm text-slate-600 pb-2">Your profile has been saved successfully!</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-[#0000c8] hover:bg-blue-800 text-white font-semibold py-3.5 rounded-xl transition text-sm"
            >
              My Profile
            </button>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
              <LogOut size={28} className="ml-1" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Logout?</h3>
            <p className="text-sm text-slate-600 mb-6">Are you sure you want to logout</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3.5 rounded-xl transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-[#0000c8] hover:bg-blue-800 text-white font-semibold py-3.5 rounded-xl transition text-sm shadow-md"
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