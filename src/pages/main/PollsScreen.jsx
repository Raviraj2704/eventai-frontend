import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Plus, Trash2, X, CheckCircle, ArrowLeft, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../config/apiClient';

export default function PollsScreen() {
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Create Poll Modal State
  const [showCreate, setShowCreate] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '']);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchPolls();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const res = await apiClient.get('/users/me');
      const user = res.data?.data || res.data;
      setIsAdmin(user?.role === 'admin' || user?.is_admin === true);
    } catch (err) {
      console.error('Failed to check admin status', err);
    }
  };

  const fetchPolls = async () => {
    try {
      // Adjust this endpoint if your backend uses a different path like /activity/polls
      const res = await apiClient.get('/session-hub/polls'); 
      const data = res.data?.data || res.data || [];
      setPolls(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch polls', err);
      toast.error('Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId, optionIndex) => {
    // Optimistic UI update
    const updatedPolls = polls.map(p => {
      if (p.id === pollId && !p.has_voted) {
        const newTotal = (p.total_votes || 0) + 1;
        const newOptions = [...p.options];
        newOptions[optionIndex] = {
          ...newOptions[optionIndex],
          votes: (newOptions[optionIndex].votes || 0) + 1
        };
        return { ...p, has_voted: true, selected_option: optionIndex, total_votes: newTotal, options: newOptions };
      }
      return p;
    });
    setPolls(updatedPolls);

    try {
      await apiClient.post(`/session-hub/polls/${pollId}/vote`, { option_index: optionIndex });
    } catch (err) {
      console.error('Vote failed', err);
      toast.error('Failed to record vote');
      fetchPolls(); // Revert on failure
    }
  };

  const handleDelete = async (pollId) => {
    if (!window.confirm('Are you sure you want to delete this poll?')) return;
    
    try {
      await apiClient.delete(`/session-hub/polls/${pollId}`);
      setPolls(polls.filter(p => p.id !== pollId));
      toast.success('Poll deleted');
    } catch (err) {
      console.error('Delete failed', err);
      toast.error('Failed to delete poll');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const validOptions = newOptions.filter(o => o.trim() !== '');
    if (!newQuestion.trim() || validOptions.length < 2) {
      toast.error('Question and at least 2 options are required');
      return;
    }

    setCreating(true);
    try {
      await apiClient.post('/session-hub/polls', {
        question: newQuestion,
        options: validOptions
      });
      toast.success('Poll created successfully!');
      setShowCreate(false);
      setNewQuestion('');
      setNewOptions(['', '']);
      fetchPolls();
    } catch (err) {
      console.error('Create failed', err);
      toast.error('Failed to create poll');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-[#0000c8] text-white p-4 sticky top-0 z-10 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Community Polls</h1>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 bg-white text-[#0000c8] px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
          >
            <Plus size={16} />
            Create
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader size={32} className="animate-spin mb-3 text-[#0000c8]" />
            <p>Loading polls...</p>
          </div>
        ) : polls.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <BarChart2 size={48} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Active Polls</h3>
            <p className="text-sm text-slate-500 mt-1">Check back later for new community questions.</p>
          </div>
        ) : (
          polls.map((poll) => (
            <div key={poll.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 relative">
              {isAdmin && (
                <button 
                  onClick={() => handleDelete(poll.id)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
              
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 pr-8 leading-snug">
                {poll.question}
              </h2>
              
              <div className="space-y-3">
                {poll.options.map((opt, idx) => {
                  const total = poll.total_votes || 0;
                  const votes = opt.votes || 0;
                  const percentage = total > 0 ? Math.round((votes / total) * 100) : 0;
                  const isSelected = poll.selected_option === idx;

                  return (
                    <div key={idx} className="relative">
                      {poll.has_voted ? (
                        // Voted State - Show Progress Bars
                        <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 flex justify-between items-center z-0">
                          <div 
                            className={`absolute top-0 left-0 h-full -z-10 transition-all duration-1000 ease-out ${isSelected ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-slate-200 dark:bg-slate-700/50'}`}
                            style={{ width: `${percentage}%` }}
                          />
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${isSelected ? 'text-[#0000c8] dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                              {opt.text || opt}
                            </span>
                            {isSelected && <CheckCircle size={14} className="text-[#0000c8] dark:text-blue-400" />}
                          </div>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{percentage}%</span>
                        </div>
                      ) : (
                        // Unvoted State - Clickable Buttons
                        <button
                          onClick={() => handleVote(poll.id, idx)}
                          className="w-full text-left p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-[#0000c8] dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all"
                        >
                          {opt.text || opt}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 mt-4 text-right">
                {poll.total_votes || 0} {(poll.total_votes === 1) ? 'vote' : 'votes'}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Admin Create Poll Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Create New Poll</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Question</label>
                <input 
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="e.g., Which AI tool do you use most?"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#0000c8] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Options</label>
                <div className="space-y-2">
                  {newOptions.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...newOptions];
                          updated[idx] = e.target.value;
                          setNewOptions(updated);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-sm outline-none"
                        required={idx < 2}
                      />
                      {idx >= 2 && (
                        <button 
                          type="button"
                          onClick={() => setNewOptions(newOptions.filter((_, i) => i !== idx))}
                          className="p-2.5 text-red-500 bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {newOptions.length < 5 && (
                  <button 
                    type="button"
                    onClick={() => setNewOptions([...newOptions, ''])}
                    className="mt-2 text-sm text-[#0000c8] font-semibold flex items-center gap-1"
                  >
                    <Plus size={16} /> Add Option
                  </button>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-xl bg-[#0000c8] text-white font-semibold flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {creating && <Loader size={16} className="animate-spin" />}
                  Publish Poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}