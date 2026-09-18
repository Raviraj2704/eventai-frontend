import React, { useState } from 'react';
import { Share2, Star, Bookmark, CheckCircle } from 'lucide-react';
import apiClient from '../services/apiClient';

const SessionCard = ({ session, onSessionUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAttended, setIsAttended] = useState(session?.user_attended || false);
  const [isSaved, setIsSaved] = useState(session?.user_saved || false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Format date and time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const { date, time } = formatDateTime(session?.start_time);

  // Handle Attend Button
  const handleAttend = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post(`/sessions/${session.id}/attend`, {
        status: 'attending'
      });
      setIsAttended(true);
      setSuccess('Successfully attending this session!');
      setTimeout(() => setSuccess(null), 3000);
      onSessionUpdate?.();
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Already attending this session');
      } else {
        setError('Failed to attend session. Try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Save Button
  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isSaved) {
        await apiClient.delete(`/sessions/${session.id}/save`);
      } else {
        await apiClient.post(`/sessions/${session.id}/save`);
      }
      setIsSaved(!isSaved);
      onSessionUpdate?.();
    } catch (err) {
      setError('Failed to save session');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Rating Submission
  const handleRateSession = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.post(`/sessions/${session.id}/rate`, {
        score: rating,
        feedback: ''
      });
      setSuccess('Rating submitted successfully!');
      setRatingOpen(false);
      setRating(0);
      setTimeout(() => setSuccess(null), 3000);
      onSessionUpdate?.();
    } catch (err) {
      setError('Failed to submit rating');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Share
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/sessions/${session.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: session.title,
          text: `Check out this session: ${session.title}`,
          url: shareUrl
        });
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      setSuccess('Link copied to clipboard!');
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-slate-200 dark:border-slate-700">
      {/* Card Header with Points Badge */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold leading-tight pr-2 line-clamp-2">
            {session?.title}
          </h3>
          {isAttended && (
            <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full whitespace-nowrap">
              <CheckCircle size={14} />
              <span className="text-xs font-medium">Attending</span>
            </div>
          )}
        </div>
        <p className="text-sm opacity-90">{session?.speaker_name || 'TBA'}</p>
      </div>

      {/* Card Body */}
      <div className="p-4">
        {/* Date & Time */}
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
          <span className="font-medium">{date}</span>
          <span>•</span>
          <span>{time}</span>
          <span>•</span>
          <span className="text-blue-600 font-semibold">🏆 {session?.points_reward || 50} pts</span>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 mb-3">
          {session?.description}
        </p>

        {/* Location & Capacity */}
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
          <span>📍 {session?.location || 'Virtual'}</span>
          <span>👥 {session?.attendee_count || 0}/{session?.capacity || 'Unlimited'}</span>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-3 p-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 text-xs rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-3 p-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 text-xs rounded">
            {success}
          </div>
        )}

        {/* Rating Modal (only show if attended) */}
        {ratingOpen && isAttended && (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Rate this session
            </p>
            <div className="flex gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-2xl transition-transform hover:scale-110 ${
                    rating >= star ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <button
              onClick={handleRateSession}
              disabled={isLoading || rating === 0}
              className="w-full px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons - Bottom Horizontal Row */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex gap-2">
        {/* Attend Button */}
        <button
          onClick={handleAttend}
          disabled={isLoading || isAttended}
          className={`flex-1 px-3 py-2 rounded font-medium text-sm transition-all duration-200 ${
            isAttended
              ? 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white hover:shadow-md active:scale-95'
          }`}
        >
          {isLoading ? 'Loading...' : isAttended ? 'Attending' : 'Attend'}
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          disabled={isLoading}
          className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded font-medium text-sm transition-all duration-200 hover:shadow-md active:scale-95 flex items-center justify-center gap-1 disabled:opacity-50"
        >
          <Share2 size={16} />
          <span>Share</span>
        </button>

        {/* Rate Button */}
        {isAttended && (
          <button
            onClick={() => setRatingOpen(!ratingOpen)}
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-slate-400 hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-700 text-white rounded font-medium text-sm transition-all duration-200 hover:shadow-md active:scale-95 flex items-center justify-center gap-1"
          >
            <Star size={16} />
            <span>Rate</span>
          </button>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isLoading}
          className={`flex-1 px-3 py-2 rounded font-medium text-sm transition-all duration-200 flex items-center justify-center gap-1 ${
            isSaved
              ? 'bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white hover:shadow-md active:scale-95'
              : 'bg-slate-400 hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-700 text-white hover:shadow-md active:scale-95'
          }`}
        >
          <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
          <span>{isSaved ? 'Saved' : 'Save'}</span>
        </button>
      </div>
    </div>
  );
};

export default SessionCard;