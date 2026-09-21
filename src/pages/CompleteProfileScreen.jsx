// ============================================================================
// Complete Profile Screen - REAL API VERSION
// ============================================================================
// File: src/pages/CompleteProfileScreen.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Building2, Briefcase, Camera, ArrowRight, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiGet, apiPut, apiPost } from '../services/api';

const CompleteProfileScreen = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    jobTitle: '',
    bio: ''
  });
  
  const [avatar, setAvatar] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const userId = localStorage.getItem('user_id');

  // Fetch existing user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      
      try {
        const userData = await apiGet(`/api/v1/users/${userId}`);
        if (userData) {
          setFormData({
            firstName: userData.first_name || userData.name?.split(' ')[0] || '',
            lastName: userData.last_name || userData.name?.split(' ').slice(1).join(' ') || '',
            company: userData.company || '',
            jobTitle: userData.title || userData.job_title || '',
            bio: userData.bio || ''
          });
          if (userData.avatar || userData.profile_photo_url) {
            setAvatar(userData.avatar || userData.profile_photo_url);
          }
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.jobTitle.trim()) {
      errors.jobTitle = 'Job title is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
      setAvatarFile(file);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !userId) return null;

    try {
      const formDataForUpload = new FormData();
      formDataForUpload.append('file', avatarFile);
      
      const response = await apiPost(`/api/v1/users/${userId}/avatar`, formDataForUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response?.avatar_url || response?.profile_photo_url;
    } catch (err) {
      console.error('Avatar upload failed:', err);
      toast.error('Failed to upload avatar');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!userId) {
      toast.error('Session expired. Please log in again.');
      navigate('/');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload avatar if changed
      if (avatarFile) {
        await uploadAvatar();
      }

      // Update profile details
      await apiPut(`/api/v1/users/${userId}`, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        company: formData.company,
        title: formData.jobTitle,
        job_title: formData.jobTitle,
        bio: formData.bio
      });

      toast.success('Profile completed successfully!');
      navigate('/home', { replace: true });
    } catch (err) {
      console.error('Profile update failed:', err);
      toast.error('An error occurred while updating your profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigate('/home', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <Loader className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-lg mb-4">
            <User className="w-6 h-6 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Complete Your Profile
          </h1>
          
          <p className="text-neutral-600">
            Help us get to know you better
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 mb-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <button
              type="button"
              onClick={handleAvatarClick}
              className="relative group"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </button>
            
            <p className="text-sm text-neutral-600 mt-3">
              Click to upload avatar
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter your first name"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                formErrors.firstName ? 'border-red-500' : 'border-neutral-300'
              }`}
              disabled={isSubmitting}
            />
            {formErrors.firstName && (
              <p className="mt-1 text-sm text-red-500">{formErrors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter your last name"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                formErrors.lastName ? 'border-red-500' : 'border-neutral-300'
              }`}
              disabled={isSubmitting}
            />
            {formErrors.lastName && (
              <p className="mt-1 text-sm text-red-500">{formErrors.lastName}</p>
            )}
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Company
            </label>
            <div className="relative">
              <Building2 className="absolute left-4 top-3 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Enter your company name"
                className="pl-12 w-full p-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Job Title *
            </label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-3 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                placeholder="Enter your job title"
                className={`pl-12 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  formErrors.jobTitle ? 'border-red-500' : 'border-neutral-300'
                }`}
                disabled={isSubmitting}
              />
            </div>
            {formErrors.jobTitle && (
              <p className="mt-1 text-sm text-red-500">{formErrors.jobTitle}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself"
              rows="4"
              maxLength="500"
              className="w-full p-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-neutral-500 mt-1">
              {formData.bio.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 mt-8 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                Complete Profile
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Skip Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfileScreen;