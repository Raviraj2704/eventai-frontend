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

  // ============================================================================
  // FETCH PROFILE DATA - Runs ONCE on mount
  // ============================================================================
  useEffect(() => {
    fetchProfileData();
  }, []); // Empty dependency array - fetch only ONCE

  const fetchProfileData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch from /users/me endpoint
      const response = await apiGet('/users/me');
      
      if (response.status === 200 && response.data) {
        const data = response.data;
        
        // Set profile data
        setProfileData(data);
        
        // Populate form with existing data
        setFormData({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          designation: data.designation || '',
          company: data.company || '',
          bio: data.bio || '',
          profilePicture: data.profile_picture_url || null
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile data');
      setProfileData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================================================
  // HANDLE INPUT CHANGE
  // ============================================================================
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // ============================================================================
  // HANDLE FILE UPLOAD
  // ============================================================================
  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          profilePicture: event.target?.result
        }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // ============================================================================
  // SAVE PROFILE - Then FETCH fresh data
  // ============================================================================
  const handleSaveProfile = useCallback(async () => {
    try {
      setIsSaving(true);
      
      const updatePayload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        designation: formData.designation,
        company: formData.company,
        bio: formData.bio
      };

      // Send update to backend
      const response = await apiPost('/users/me', updatePayload);
      
      if (response.status === 200) {
        toast.success('Profile updated successfully! 🎉');
        setIsEditing(false);
        
        // ✅ CRITICAL: Fetch fresh data after save
        await fetchProfileData();
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [formData, fetchProfileData]);

  // ============================================================================
  // LOADING STATE
  // ============================================================================
  if (isLoading) {
    return (
      <div className="profile-container loading">
        <div className="loading-spinner">
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================
  if (error && !profileData) {
    return (
      <div className="profile-container error">
        <div className="error-box">
          <h2>❌ Unable to Load Profile</h2>
          <p>{error}</p>
          <button 
            onClick={fetchProfileData}
            className="btn btn-primary"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // EDIT MODE - Form
  // ============================================================================
  if (isEditing) {
    return (
      <div className="profile-container edit-mode">
        <div className="profile-header">
          <h1>Edit Profile</h1>
          <button 
            onClick={() => setIsEditing(false)}
            className="btn btn-secondary"
          >
            ✕ Cancel
          </button>
        </div>

        <div className="profile-form">
          {/* Profile Picture Section */}
          <div className="form-section">
            <h3>Profile Picture</h3>
            <div className="profile-picture-upload">
              <img 
                src={formData.profilePicture || 'https://via.placeholder.com/150'} 
                alt="Profile" 
                className="profile-picture-preview"
              />
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="file-input"
              />
              <label>Click to upload photo</label>
            </div>
          </div>

          {/* Personal Information */}
          <div className="form-section">
            <h3>Personal Information</h3>
            
            <div className="form-group">
              <label>First Name</label>
              <input 
                type="text" 
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter first name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input 
                type="text" 
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter last name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Email (Read-only)</label>
              <input 
                type="email" 
                value={formData.email}
                disabled
                className="form-input disabled"
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input 
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                className="form-input"
              />
            </div>
          </div>

          {/* Professional Information */}
          <div className="form-section">
            <h3>Professional Information</h3>
            
            <div className="form-group">
              <label>Designation</label>
              <input 
                type="text" 
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                placeholder="e.g., Software Engineer"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Company</label>
              <input 
                type="text" 
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                placeholder="Enter company name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Bio</label>
              <textarea 
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself"
                className="form-textarea"
                rows="4"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button 
              onClick={() => setIsEditing(false)}
              className="btn btn-secondary"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveProfile}
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? '💾 Saving...' : '💾 Save Profile'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW MODE - Display Profile Data
  // ============================================================================
  return (
    <div className="profile-container view-mode">
      {/* Header Section */}
      <div className="profile-header">
        <div className="profile-info">
          <img 
            src={profileData?.profile_picture_url || 'https://via.placeholder.com/100'} 
            alt="Profile" 
            className="profile-avatar"
          />
          <div>
            <h1>
              {profileData?.first_name || 'User'} {profileData?.last_name || ''}
            </h1>
            <p className="designation">
              {profileData?.designation || 'Designation not set'}
            </p>
          </div>
        </div>

        <button 
          onClick={() => setIsEditing(true)}
          className="btn btn-primary"
        >
          ✏️ Edit Profile
        </button>
      </div>

      {/* Profile Details */}
      <div className="profile-details">
        {/* Contact Information */}
        <div className="detail-section">
          <h2>📞 Contact Information</h2>
          <div className="detail-item">
            <label>Email:</label>
            <p>{profileData?.email || 'Not specified'}</p>
          </div>
          <div className="detail-item">
            <label>Phone:</label>
            <p>{profileData?.phone || 'Not specified'}</p>
          </div>
        </div>

        {/* Professional Information */}
        <div className="detail-section">
          <h2>💼 Professional Information</h2>
          <div className="detail-item">
            <label>Designation:</label>
            <p>{profileData?.designation || 'Not specified'}</p>
          </div>
          <div className="detail-item">
            <label>Company:</label>
            <p>{profileData?.company || 'Not specified'}</p>
          </div>
          <div className="detail-item">
            <label>Bio:</label>
            <p>{profileData?.bio || 'Not specified'}</p>
          </div>
        </div>

        {/* Account Information */}
        <div className="detail-section">
          <h2>ℹ️ Account Information</h2>
          <div className="detail-item">
            <label>User ID:</label>
            <p>{profileData?.id || 'N/A'}</p>
          </div>
          <div className="detail-item">
            <label>Role:</label>
            <p>{profileData?.role || 'User'}</p>
          </div>
          <div className="detail-item">
            <label>Joined:</label>
            <p>
              {profileData?.created_at 
                ? new Date(profileData.created_at).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}