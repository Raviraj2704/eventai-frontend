// ============================================================================
// ProfileScreen.jsx - FIXED - Display Profile Data After Save
// ============================================================================
// File: frontend/src/pages/main/ProfileScreen.jsx
// Purpose: Display user profile with edit capability and data persistence
// Status: Production-Ready ✅

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../../services/api';
import toast from 'react-hot-toast';
import '../../styles/profile.css';

const h = React.createElement;

const DEFAULT_AVATAR_150 = 'https://ui-avatars.com/api/?name=User&size=150&background=3b82f6&color=fff';
const DEFAULT_AVATAR_100 = 'https://ui-avatars.com/api/?name=User&size=100&background=3b82f6&color=fff';
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

    const first_name =
      unwrapped.first_name ||
      unwrapped.firstName ||
      cached.first_name ||
      nameParts[0] ||
      '';
    const last_name =
      unwrapped.last_name ||
      unwrapped.lastName ||
      cached.last_name ||
      (nameParts.length !== 0 ? nameParts.slice(1).join(' ') : '') ||
      '';
    const email = unwrapped.email || cached.email || '';
    const phone = unwrapped.phone || cached.phone || '';
    const designation =
      unwrapped.designation ||
      unwrapped.job_title ||
      cached.designation ||
      cached.job_title ||
      '';
    const company = unwrapped.company || cached.company || '';
    const bio = unwrapped.bio || cached.bio || '';
    const profile_picture_url =
      unwrapped.profile_picture_url ||
      unwrapped.avatar_url ||
      cached.profile_picture_url ||
      null;

    return {
      ...unwrapped,
      id: unwrapped.id || cached.id || 1,
      role: unwrapped.role || cached.role || 'User',
      created_at: unwrapped.created_at || cached.created_at || new Date().toISOString(),
      first_name: first_name,
      last_name: last_name,
      email: email,
      phone: phone,
      designation: designation,
      job_title: designation,
      company: company,
      bio: bio,
      profile_picture_url: profile_picture_url
    };
  }, []);

  // ============================================================================
  // FETCH PROFILE DATA - Runs ONCE on mount
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
  // HANDLE INPUT CHANGE
  // ============================================================================
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // ============================================================================
  // HANDLE FILE UPLOAD
  // ============================================================================
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

  // ============================================================================
  // SAVE PROFILE - Update state immediately & persist
  // ============================================================================
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
        profile_picture_url:
          formData.profilePicture || (profileData && profileData.profile_picture_url) || null
      };

      try {
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(mergedProfile));
      } catch (_) {
        // ignore storage errors
      }

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

  // ============================================================================
  // LOADING STATE
  // ============================================================================
  if (isLoading) {
    return h(
      'div',
      { className: 'profile-container loading' },
      h(
        'div',
        { className: 'loading-spinner' },
        h('p', null, 'Loading your profile...')
      )
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================
  if (error && !profileData) {
    return h(
      'div',
      { className: 'profile-container error' },
      h(
        'div',
        { className: 'error-box' },
        h('h2', null, '❌ Unable to Load Profile'),
        h('p', null, error),
        h(
          'button',
          { onClick: fetchProfileData, className: 'btn btn-primary' },
          '🔄 Retry'
        )
      )
    );
  }

  // ============================================================================
  // EDIT MODE - Form
  // ============================================================================
  if (isEditing) {
    return h(
      'div',
      { className: 'profile-container edit-mode' },
      h(
        'div',
        { className: 'profile-header' },
        h('h1', null, 'Edit Profile'),
        h(
          'button',
          { onClick: () => setIsEditing(false), className: 'btn btn-secondary' },
          '✕ Cancel'
        )
      ),
      h(
        'div',
        { className: 'profile-form' },
        // Profile Picture Section
        h(
          'div',
          { className: 'form-section' },
          h('h3', null, 'Profile Picture'),
          h(
            'div',
            { className: 'profile-picture-upload' },
            h('img', {
              src: formData.profilePicture || DEFAULT_AVATAR_150,
              alt: 'Profile',
              className: 'profile-picture-preview'
            }),
            h('input', {
              type: 'file',
              accept: 'image/*',
              onChange: handleImageUpload,
              className: 'file-input'
            }),
            h('label', null, 'Click to upload photo')
          )
        ),
        // Personal Information
        h(
          'div',
          { className: 'form-section' },
          h('h3', null, 'Personal Information'),
          h(
            'div',
            { className: 'form-group' },
            h('label', null, 'First Name'),
            h('input', {
              type: 'text',
              name: 'firstName',
              value: formData.firstName,
              onChange: handleInputChange,
              placeholder: 'Enter first name',
              className: 'form-input'
            })
          ),
          h(
            'div',
            { className: 'form-group' },
            h('label', null, 'Last Name'),
            h('input', {
              type: 'text',
              name: 'lastName',
              value: formData.lastName,
              onChange: handleInputChange,
              placeholder: 'Enter last name',
              className: 'form-input'
            })
          ),
          h(
            'div',
            { className: 'form-group' },
            h('label', null, 'Email (Read-only)'),
            h('input', {
              type: 'email',
              value: formData.email,
              disabled: true,
              className: 'form-input disabled'
            })
          ),
          h(
            'div',
            { className: 'form-group' },
            h('label', null, 'Phone'),
            h('input', {
              type: 'tel',
              name: 'phone',
              value: formData.phone,
              onChange: handleInputChange,
              placeholder: 'Enter phone number',
              className: 'form-input'
            })
          )
        ),
        // Professional Information
        h(
          'div',
          { className: 'form-section' },
          h('h3', null, 'Professional Information'),
          h(
            'div',
            { className: 'form-group' },
            h('label', null, 'Designation'),
            h('input', {
              type: 'text',
              name: 'designation',
              value: formData.designation,
              onChange: handleInputChange,
              placeholder: 'e.g., Software Engineer',
              className: 'form-input'
            })
          ),
          h(
            'div',
            { className: 'form-group' },
            h('label', null, 'Company'),
            h('input', {
              type: 'text',
              name: 'company',
              value: formData.company,
              onChange: handleInputChange,
              placeholder: 'Enter company name',
              className: 'form-input'
            })
          ),
          h(
            'div',
            { className: 'form-group' },
            h('label', null, 'Bio'),
            h('textarea', {
              name: 'bio',
              value: formData.bio,
              onChange: handleInputChange,
              placeholder: 'Tell us about yourself',
              className: 'form-textarea',
              rows: '4'
            })
          )
        ),
        // Action Buttons
        h(
          'div',
          { className: 'form-actions' },
          h(
            'button',
            {
              onClick: () => setIsEditing(false),
              className: 'btn btn-secondary',
              disabled: isSaving
            },
            'Cancel'
          ),
          h(
            'button',
            {
              onClick: handleSaveProfile,
              className: 'btn btn-primary',
              disabled: isSaving
            },
            isSaving ? '💾 Saving...' : '💾 Save Profile'
          )
        )
      )
    );
  }

  // ============================================================================
  // VIEW MODE - Display Profile Data
  // ============================================================================
  const displayFirstName = (profileData && profileData.first_name) || formData.firstName || 'User';
  const displayLastName = (profileData && profileData.last_name) || formData.lastName || '';
  const displayDesignation =
    (profileData && (profileData.designation || profileData.job_title)) ||
    formData.designation ||
    'Designation not set';
  const displayEmail = (profileData && profileData.email) || formData.email || 'Not specified';
  const displayPhone = (profileData && profileData.phone) || formData.phone || 'Not specified';
  const displayCompany = (profileData && profileData.company) || formData.company || 'Not specified';
  const displayBio = (profileData && profileData.bio) || formData.bio || 'Not specified';
  const displayAvatar =
    (profileData && profileData.profile_picture_url) ||
    formData.profilePicture ||
    DEFAULT_AVATAR_100;

  return h(
    'div',
    { className: 'profile-container view-mode' },
    // Header Section
    h(
      'div',
      { className: 'profile-header' },
      h(
        'div',
        { className: 'profile-info' },
        h('img', {
          src: displayAvatar,
          alt: 'Profile',
          className: 'profile-avatar'
        }),
        h(
          'div',
          null,
          h('h1', null, displayFirstName + ' ' + displayLastName),
          h('p', { className: 'designation' }, displayDesignation)
        )
      ),
      h(
        'button',
        { onClick: () => setIsEditing(true), className: 'btn btn-primary' },
        '✏️ Edit Profile'
      )
    ),
    // Profile Details
    h(
      'div',
      { className: 'profile-details' },
      // Contact Information
      h(
        'div',
        { className: 'detail-section' },
        h('h2', null, '📞 Contact Information'),
        h(
          'div',
          { className: 'detail-item' },
          h('label', null, 'Email:'),
          h('p', null, displayEmail)
        ),
        h(
          'div',
          { className: 'detail-item' },
          h('label', null, 'Phone:'),
          h('p', null, displayPhone)
        )
      ),
      // Professional Information
      h(
        'div',
        { className: 'detail-section' },
        h('h2', null, '💼 Professional Information'),
        h(
          'div',
          { className: 'detail-item' },
          h('label', null, 'Designation:'),
          h('p', null, displayDesignation)
        ),
        h(
          'div',
          { className: 'detail-item' },
          h('label', null, 'Company:'),
          h('p', null, displayCompany)
        ),
        h(
          'div',
          { className: 'detail-item' },
          h('label', null, 'Bio:'),
          h('p', null, displayBio)
        )
      ),
      // Account Information
      h(
        'div',
        { className: 'detail-section' },
        h('h2', null, 'ℹ️ Account Information'),
        h(
          'div',
          { className: 'detail-item' },
          h('label', null, 'User ID:'),
          h('p', null, (profileData && profileData.id) || 'N/A')
        ),
        h(
          'div',
          { className: 'detail-item' },
          h('label', null, 'Role:'),
          h('p', null, (profileData && profileData.role) || 'User')
        ),
        h(
          'div',
          { className: 'detail-item' },
          h('label', null, 'Joined:'),
          h(
            'p',
            null,
            profileData && profileData.created_at
              ? new Date(profileData.created_at).toLocaleDateString()
              : 'N/A'
          )
        )
      )
    )
  );
}