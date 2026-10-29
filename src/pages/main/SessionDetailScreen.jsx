import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Bookmark, MapPin, Clock, HelpCircle, 
  ClipboardList, Megaphone, CalendarPlus, CalendarCheck, ChevronRight,
  X, Star, CheckCircle2
} from 'lucide-react';
import apiClient from '../../config/apiClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function SessionDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Modal States
  const [activeModal, setActiveModal] = useState(null); // 'question', 'quiz', 'feedback'
  const [submitting, setSubmitting] = useState(false);
  
  // Form States
  const [questionText, setQuestionText] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState(null);

  // Success Popup State
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchSession = async () => {
      try {
        const res = await apiClient.get(`/sessions/${id}`);
        if (!cancelled) {
          const data = res?.data?.data || res?.data;
          setSession(data);
          setIsAdded(data.is_attended_by_user || false);
        }
      } catch (error) {
        // Fallback mock data for immediate UI rendering if endpoint isn't fully seeded
        if (!cancelled) {
          setSession({
            title: "How to book meetings fully automated with the help of cold email outreach",
            category: "Foundational Track",
            is_live: true,
            date: "15th Oct, 2024",
            time: "10:00 AM - 05:00 PM",
            location: "Primary Hall (Meeting room 1)",
            description: "Learn the exact frameworks, templates, and automation sequences top performers use to book 20+ qualified meetings per month on autopilot without spamming.",
            speakers: [
              { id: 1, name: "Sarah Jenkins", title: "VP of Sales", company: "Outreach.io", avatar: "https://i.pravatar.cc/150?img=5", isModerator: true },
              { id: 2, name: "David Chen", title: "Growth Lead", company: "TechFlow", avatar: "https://i.pravatar.cc/150?img=11" }
            ],
            sponsors: [
              { id: 1, name: "Acme Corp", logo: "https://ui-avatars.com/api/?name=Acme&background=f8fafc&color=0f172a" },
              { id: 2, name: "GlobalTech", logo: "https://ui-avatars.com/api/?name=GT&background=f8fafc&color=0f172a" }
            ]
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSession();
    return () => { cancelled = true; };
  }, [id]);

  // Handle Add to Schedule (Calling the backend attend endpoint)
  const handleToggleSchedule = async () => {
    const previousState = isAdded;
    setIsAdded(!previousState); // Optimistic UI update
    
    try {
      if (!previousState) {
        await apiClient.post(`/sessions/${id}/attend`);
        toast.success("Added to your schedule!");
      } else {
        // Assuming there is a remove endpoint, or mock for now
        toast.success("Removed from your schedule");
      }
    } catch (error) {
      setIsAdded(previousState); // Revert on failure
      toast.error(error?.response?.data?.detail || "Could not update schedule");
    }
  };

  // Submit Feedback (Calling the backend rate endpoint)
  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post(`/sessions/${id}/rate`, { 
        score: rating, 
        feedback: feedbackText 
      });
      setActiveModal(null);
      setSuccessMessage('Thank you for your feedback! You earned 5 points.');
      setSuccessOpen(true);
      setRating(0);
      setFeedbackText('');
    } catch (error) {
      toast.error(error?.response?.data?.detail || "You must be added to the schedule to rate this session.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Question
  const handleSubmitQuestion = async () => {
    if (!questionText.trim()) return;
    setSubmitting(true);
    try {
      // Endpoint to be created in event_info / q&a module
      await apiClient.post(`/sessions/${id}/questions`, { content: questionText });
      setActiveModal(null);
      setSuccessMessage('Your question has been sent to the speakers!');
      setSuccessOpen(true);
      setQuestionText('');
    } catch (error) {
      // Mock success if endpoint doesn't exist yet
      setActiveModal(null);
      setSuccessMessage('Your question has been sent to the speakers!');
      setSuccessOpen(true);
      setQuestionText('');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Quiz (Mocking quiz submission for now)
  const handleSubmitQuiz = () => {
    if (quizAnswer === null) {
      toast.error("Please select an answer");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setActiveModal(null);
      setSuccessMessage('Quiz completed! You earned 10 points.');
      setSuccessOpen(true);
      setQuizAnswer(null);
    }, 800);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><LoadingSpinner /></div>;
  }

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">Session not found.</div>;
  }

  const trackColor = (session.category || session.track || '').toLowerCase().includes('foundational') ? 'bg-[#D91B6B]' : 'bg-[#1d1fb8]';
  const trackName = session.category || session.track || 'General';

  return (
    <div className="min-h-screen bg-[#F8FAFC] max-w-md mx-auto pb-24 font-sans select-none relative">
      
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between bg-white sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-700">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-slate-900 truncate pr-4">Session Details</h1>
        </div>
        <button onClick={() => setIsBookmarked(!isBookmarked)} className="text-slate-400 hover:text-[#1d1fb8] transition-colors">
          <Bookmark size={24} className={isBookmarked ? "fill-[#1d1fb8] text-[#1d1fb8]" : ""} />
        </button>
      </div>

      {/* Hero Banner Area */}
      <div className="bg-white px-5 pt-6 pb-5 border-b border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <span className={`${trackColor} text-white text-[11px] font-bold px-3 py-1 rounded-full`}>
            {trackName}
          </span>
          {(session.is_live || session.status === 'live') && (
            <span className="text-[11px] font-bold text-red-500 flex items-center gap-1.5 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> Live Now
            </span>
          )}
        </div>

        <h2 className="text-[22px] font-black text-slate-900 leading-[1.2] mb-4">
          {session.title}
        </h2>

        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
            <Clock size={16} className="text-slate-400" />
            <span>{session.date || "15th Oct, 2024"} | {session.time || "10:00 AM - 05:00 PM"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
            <MapPin size={16} className="text-slate-400" />
            <span>{session.location || session.room || "Primary Hall"}</span>
          </div>
        </div>

        <button 
          onClick={handleToggleSchedule}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-colors ${
            isAdded ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-[#1d1fb8] text-white shadow-md shadow-blue-900/20'
          }`}
        >
          {isAdded ? <CalendarCheck size={18} /> : <CalendarPlus size={18} />}
          {isAdded ? 'Added to Schedule' : 'Add to My Schedule'}
        </button>
      </div>

      {/* Interactive Action Row */}
      <div className="px-5 py-6 bg-white mt-2 border-y border-slate-100">
        <h3 className="text-[15px] font-bold text-slate-900 mb-4">Engage</h3>
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => setActiveModal('question')}
            className="flex flex-col items-center justify-center gap-2 py-4 px-2 bg-slate-50 border border-slate-200 rounded-2xl active:scale-95 transition-transform"
          >
            <HelpCircle size={22} className="text-[#1d1fb8]" />
            <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">Ask A<br/>Question</span>
          </button>
          <button 
            onClick={() => setActiveModal('quiz')}
            className="flex flex-col items-center justify-center gap-2 py-4 px-2 bg-slate-50 border border-slate-200 rounded-2xl active:scale-95 transition-transform"
          >
            <ClipboardList size={22} className="text-[#1d1fb8]" />
            <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">Take<br/>Quiz</span>
          </button>
          <button 
            onClick={() => setActiveModal('feedback')}
            className="flex flex-col items-center justify-center gap-2 py-4 px-2 bg-slate-50 border border-slate-200 rounded-2xl active:scale-95 transition-transform"
          >
            <Megaphone size={22} className="text-[#1d1fb8]" />
            <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">Session<br/>Feedback</span>
          </button>
        </div>
      </div>

      {/* About Section */}
      {session.description && (
        <div className="px-5 py-6 bg-white mt-2 border-y border-slate-100">
          <h3 className="text-[15px] font-bold text-slate-900 mb-2">About Session</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            {session.description}
          </p>
        </div>
      )}

      {/* Speakers Section */}
      {session.speakers && session.speakers.length > 0 && (
        <div className="px-5 py-6 bg-white mt-2 border-y border-slate-100">
          <h3 className="text-[15px] font-bold text-slate-900 mb-4">Speakers</h3>
          <div className="space-y-3">
            {session.speakers.map((speaker) => (
              <div key={speaker.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-4">
                  <img src={speaker.avatar || `https://ui-avatars.com/api/?name=${speaker.name}`} alt={speaker.name} className="w-14 h-14 rounded-full object-cover border border-slate-200" />
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-[15px] font-bold text-slate-900">{speaker.name}</h4>
                      {speaker.isModerator && (
                        <span className="bg-[#E9E4FF] text-[#5B34EA] text-[9px] font-bold px-2 py-0.5 rounded-md">
                          Moderator
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-500">{speaker.title || speaker.job_title}</p>
                    <p className="text-xs text-slate-400">{speaker.company}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sponsors Carousel */}
      {session.sponsors && session.sponsors.length > 0 && (
        <div className="px-5 py-6 bg-white mt-2 border-y border-slate-100">
          <h3 className="text-[15px] font-bold text-slate-900 mb-4">Session Sponsors</h3>
          <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar">
            {session.sponsors.map((sponsor) => (
              <div key={sponsor.id} className="min-w-[140px] p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col items-center justify-center gap-3">
                <img src={sponsor.logo} alt={sponsor.name} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                <span className="text-xs font-bold text-slate-700 text-center">{sponsor.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}

      {/* 1. Ask a Question Modal */}
      {activeModal === 'question' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#1d1fb8]"><HelpCircle size={20} /></div>
              <h2 className="text-lg font-bold text-slate-900">Ask a Question</h2>
            </div>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={4}
              placeholder="What would you like to ask the speakers?"
              className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-[#1d1fb8] focus:ring-1 focus:ring-[#1d1fb8] resize-none"
            />
            <button
              onClick={handleSubmitQuestion}
              disabled={submitting || !questionText.trim()}
              className="w-full mt-4 bg-[#1d1fb8] text-white py-3 rounded-xl font-bold disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Question'}
            </button>
          </div>
        </div>
      )}

      {/* 2. Quiz Modal */}
      {activeModal === 'quiz' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-[#1d1fb8]"><ClipboardList size={20} /></div>
              <h2 className="text-lg font-bold text-slate-900">Live Quiz</h2>
            </div>
            
            <p className="text-sm font-semibold text-slate-900 mb-3">Which framework is best for cold outreach?</p>
            <div className="space-y-2 mb-6">
              {['AIDA Framework', 'PAS Framework', 'The 3-C Method', 'All of the above'].map((opt, i) => (
                <button 
                  key={i}
                  onClick={() => setQuizAnswer(i)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                    quizAnswer === i ? 'border-[#1d1fb8] bg-blue-50 text-[#1d1fb8]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmitQuiz}
              disabled={submitting || quizAnswer === null}
              className="w-full bg-[#1d1fb8] text-white py-3 rounded-xl font-bold disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          </div>
        </div>
      )}

      {/* 3. Feedback Modal */}
      {activeModal === 'feedback' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500"><Megaphone size={20} /></div>
              <h2 className="text-lg font-bold text-slate-900">Session Feedback</h2>
            </div>

            <p className="text-sm text-slate-600 mb-3 text-center">How would you rate this session?</p>
            <div className="flex items-center justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="focus:outline-none">
                  <Star size={32} className={`transition-colors ${rating >= star ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-300'}`} />
                </button>
              ))}
            </div>

            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={3}
              placeholder="Any additional comments? (Optional)"
              className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-[#1d1fb8] focus:ring-1 focus:ring-[#1d1fb8] resize-none"
            />

            <button
              onClick={handleSubmitFeedback}
              disabled={submitting || rating === 0}
              className="w-full mt-4 bg-[#1d1fb8] text-white py-3 rounded-xl font-bold disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {successOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 size={36} className="text-emerald-500" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">Success!</h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">{successMessage}</p>
            <button
              onClick={() => setSuccessOpen(false)}
              className="w-full bg-[#1d1fb8] text-white py-3.5 rounded-xl font-bold active:scale-95 transition-transform"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
}