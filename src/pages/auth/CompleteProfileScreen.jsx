// ============================================================================
// Onboarding & Profile Completion Screen (Item 19)
// ============================================================================
// File: src/pages/auth/CompleteProfileScreen.jsx
// Purpose: 2-Step Welcome Tour + Optional Profile Setup (White/Soft-Gray Theme)
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Briefcase,
  Building2,
  MapPin,
  FileText,
  ArrowRight,
  Calendar,
  Users,
  Award,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../config/apiClient';
import { useAuthStore } from '../../store/authStore';

const WELCOME_SLIDES = [
  {
    icon: Calendar,
    title: 'Discover & Check In to Sessions',
    description:
      'Browse the full event schedule, bookmark talks you want to attend, and scan QR codes at the door to check in instantly.'
  },
  {
    icon: Users,
    title: 'Smart AI Networking',
    description:
      'Connect with fellow attendees, speakers, and sponsors who share your industry and interests—and schedule 1-on-1 meetings.'
  },
  {
    icon: Award,
    title: 'Earn Points & Track Progress',
    description:
      'Rate sessions, join live polls, post on the social wall, and climb the event leaderboard in real time.'
  }
];

const CompleteProfileScreen = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();

  // Step 1 = Welcome Tour (0, 1, 2), Step 2 = Profile Setup Form
  const [step, setStep] = useState(1);
  const [slideIndex, setSlideIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    designation: user?.designation || '',
    company: user?.company || '',
    location: user?.location || '',
    bio: user?.bio || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNextSlide = () => {
    if (slideIndex < WELCOME_SLIDES.length - 1) {
      setSlideIndex((prev) => prev + 1);
    } else {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/complete-profile', formData);

      if (response.data) {
        if (typeof updateProfile === 'function') {
          updateProfile(formData);
        }
        localStorage.setItem('eventai_onboarded', 'true');
        localStorage.removeItem('eventai_needs_onboarding');
        toast.success('Welcome to EventAI! Profile saved.');
        setTimeout(() => {
          navigate('/home', { replace: true });
        }, 400);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('eventai_onboarded', 'true');
    localStorage.removeItem('eventai_needs_onboarding');
    navigate('/home', { replace: true });
  };

  const CurrentIcon = WELCOME_SLIDES[slideIndex].icon;

  return (
    <div className="min-h-screen bg-white max-w-[390px] mx-auto px-5 py-8 flex flex-col justify-between font-sans text-slate-800">
      {/* Top Progress Bar & Skip Button */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <span className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
            {step === 1 ? `Welcome (${slideIndex + 1}/3)` : 'Step 2 of 2 • Your Profile'}
          </span>
          <button
            type="button"
            onClick={handleSkip}
            className="text-[13px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Step Indicator Bars */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[0, 1, 2, 3].map((idx) => {
            const active = step === 1 ? idx <= slideIndex : true;
            return (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-colors ${
                  active ? 'bg-[#0000c8]' : 'bg-slate-100'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* STEP 1: Welcome Feature Tour */}
      {step === 1 ? (
        <div className="flex-1 flex flex-col justify-center">
          <div className="bg-slate-50 border border-slate-100 rounded-[24px] p-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mx-auto mb-6 text-[#0000c8]">
              <CurrentIcon size={32} />
            </div>

            <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight mb-3 leading-snug">
              {WELCOME_SLIDES[slideIndex].title}
            </h1>

            <p className="text-[14px] font-medium text-slate-600 leading-relaxed">
              {WELCOME_SLIDES[slideIndex].description}
            </p>
          </div>
        </div>
      ) : (
        /* STEP 2: Optional Profile Completion Form */
        <div className="flex-1">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[12px] font-semibold text-slate-600 mb-3">
              <CheckCircle2 size={14} className="text-[#0000c8]" />
              Account Ready
            </div>
            <h1 className="text-[24px] font-extrabold text-slate-900 tracking-tight mb-1">
              Complete Your Profile
            </h1>
            <p className="text-[13px] font-medium text-slate-500">
              Add a few details so other attendees can connect with you (optional).
            </p>
          </div>

          <form id="onboarding-profile-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Designation */}
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                Role / Designation
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="e.g., AI Engineer, Student, Founder"
                  className="w-full pl-10 pr-4 py-3 rounded-[14px] bg-slate-50 border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#0000c8] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Company / Organization */}
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                Company / College
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="e.g., Acme Corp or JBIT"
                  className="w-full pl-10 pr-4 py-3 rounded-[14px] bg-slate-50 border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#0000c8] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                City / Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Hyderabad, India"
                  className="w-full pl-10 pr-4 py-3 rounded-[14px] bg-slate-50 border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#0000c8] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                Short Bio
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="What are you excited to learn or build?"
                  rows="3"
                  maxLength="500"
                  className="w-full pl-10 pr-4 py-3 rounded-[14px] bg-slate-50 border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#0000c8] focus:outline-none transition-colors resize-none"
                />
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-1 text-right">
                {formData.bio.length}/500
              </p>
            </div>
          </form>
        </div>
      )}

      {/* Bottom Action Buttons */}
      <div className="pt-4">
        {step === 1 ? (
          <button
            type="button"
            onClick={handleNextSlide}
            className="w-full py-3 rounded-[14px] bg-[#0000c8] text-white text-[15px] font-bold hover:bg-blue-900 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {slideIndex < WELCOME_SLIDES.length - 1 ? 'Next' : 'Set Up Profile'}
            <ArrowRight size={18} />
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 py-3 rounded-[14px] bg-slate-100 text-slate-700 text-[14px] font-bold hover:bg-slate-200 transition-colors"
            >
              Skip for Now
            </button>

            <button
              type="submit"
              form="onboarding-profile-form"
              disabled={loading}
              className="flex-1 py-3 rounded-[14px] bg-[#0000c8] text-white text-[14px] font-bold hover:bg-blue-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? 'Saving...' : 'Finish & Enter'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompleteProfileScreen;