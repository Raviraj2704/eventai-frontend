import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, User, Menu, Plus, Trash2, X, CheckCircle, BarChart2, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../config/apiClient';

export default function PollsScreen() {
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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
      // First check standard user profile
      const res = await apiClient.get('/users/me');
      const user = res.data?.data || res.data;
      let hasAdminRights = user?.role === 'admin' || user?.role === 'organizer' || user?.is_admin === true;
      
      // Fallback check against the specific roles endpoint if needed
      if (!hasAdminRights) {
        try {
          const roleRes = await apiClient.get('/session-admin/me/roles');
          const roles = roleRes.data?.roles || [];
          if (roles.includes('admin') || roles.includes('organizer')) {
            hasAdminRights = true;
          }
        } catch (e) {}
      }
      setIsAdmin(hasAdminRights);
    } catch (err) { 
      console.error("Failed to verify admin status", err);
    }
  };

  const fetchPolls = async () => {
    try {
      const res = await apiClient.get('/session-hub/polls'); 
      const data = res.data?.data || res.data || [];
      setPolls(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch polls', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId, optionIndex) => {
    const updatedPolls = polls.map(p => {
      if (p.id === pollId && !p.has_voted) {
        const newOptions = [...p.options];
        newOptions[optionIndex] = {
          ...newOptions[optionIndex],
          votes: (newOptions[optionIndex].votes || 0) + 1
        };
        const newTotal = newOptions.reduce((acc, curr) => acc + (curr.votes || 0), 0);
        return { ...p, has_voted: true, selected_option: optionIndex, total_votes: newTotal, options: newOptions };
      }
      return p;
    });
    setPolls(updatedPolls);

    try {
      await apiClient.post(`/session-hub/polls/${pollId}/vote`, { option_index: optionIndex });
    } catch (err) {
      toast.error('Failed to record vote');
      fetchPolls();
    }
  };

  const handleDelete = async (pollId) => {
    if (!window.confirm('Delete this poll?')) return;
    try {
      await apiClient.delete(`/session-hub/polls/${pollId}`);
      setPolls(polls.filter(p => p.id !== pollId));
      toast.success('Poll deleted');
    } catch (err) {
      toast.error('Failed to delete poll');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const validOptions = newOptions.filter(o => o.trim() !== '');
    if (!newQuestion.trim() || validOptions.length < 2) return toast.error('Need question and 2 options');
    
    setCreating(true);
    try {
      await apiClient.post('/session-hub/polls', { question: newQuestion, options: validOptions });
      toast.success('Poll created!');
      setShowCreate(false);
      setNewQuestion('');
      setNewOptions(['', '']);
      fetchPolls();
    } catch (err) {
      toast.error('Creation failed');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* EventAI Standard Top Navbar - Now with active links! */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/hub')}>
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
            E
          </div>
          <span className="font-bold text-lg text-slate-800 tracking-tight">EventAI</span>
        </div>
        <div className="flex items-center gap-4 text-blue-400">
          <Search size={22} className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => navigate('/search')} />
          <Bell size={22} className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => navigate('/notifications')} />
          <div 
            onClick={() => navigate('/profile')}
            className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-white shadow-inner cursor-pointer"
          >
            <User size={18} />
          </div>
          <Menu size={24} className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => navigate('/menu')} />
        </div>
      </div>

      {/* Blue Theme Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-6 shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-1">Community Polls</h1>
            <p className="text-blue-100 text-sm font-medium">Vote and see what others think</p>
          </div>
          {/* This button will now correctly show up for you! */}
          {isAdmin && (
            <button onClick={() => setShowCreate(true)} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 rounded-xl transition-all">
              <Plus size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4 max-w-2xl mx-auto mt-2">
        {loading ? (
          <div className="flex justify-center py-10"><Loader size={32} className="animate-spin text-blue-500" /></div>
        ) : polls.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <BarChart2 size={40} className="mx-auto text-slate-300 mb-2" />
            <h3 className="font-bold text-slate-700">No Active Polls</h3>
          </div>
        ) : (
          polls.map((poll) => {
            const totalVotes = poll.options.reduce((acc, curr) => acc + (curr.votes || 0), 0);
            return (
              <div key={poll.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative">
                {isAdmin && (
                  <button onClick={() => handleDelete(poll.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500">
                    <Trash2 size={18} />
                  </button>
                )}
                <h2 className="text-lg font-bold text-slate-800 mb-4 pr-6 leading-tight">{poll.question}</h2>
                <div className="space-y-3">
                  {poll.options.map((opt, idx) => {
                    const percentage = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
                    const isSelected = poll.selected_option === idx;
                    return (
                      <div key={idx} className="relative">
                        {poll.has_voted ? (
                          <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-3 flex justify-between items-center z-0">
                            <div className={`absolute top-0 left-0 h-full -z-10 transition-all duration-1000 ${isSelected ? 'bg-blue-100' : 'bg-slate-200'}`} style={{ width: `${percentage}%` }} />
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>{opt.text}</span>
                              {isSelected && <CheckCircle size={14} className="text-blue-600" />}
                            </div>
                            <span className="text-sm font-bold text-slate-600">{percentage}%</span>
                          </div>
                        ) : (
                          <button onClick={() => handleVote(poll.id, idx)} className="w-full text-left p-3 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 text-sm font-bold text-slate-700 transition-all">
                            {opt.text}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs font-semibold text-slate-400 mt-4 text-right">{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</p>
              </div>
            )
          })
        )}
      </div>

      {/* Admin Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">New Poll</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <input type="text" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder="What's your question?" className="w-full p-3 rounded-xl border-2 border-slate-100 font-semibold text-slate-800 focus:border-blue-500 outline-none" required />
              <div className="space-y-2">
                {newOptions.map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input type="text" value={opt} onChange={(e) => { const updated = [...newOptions]; updated[idx] = e.target.value; setNewOptions(updated); }} placeholder={`Option ${idx + 1}`} className="flex-1 p-3 rounded-xl border-2 border-slate-100 font-medium text-slate-700 focus:border-blue-500 outline-none" required={idx < 2} />
                    {idx >= 2 && <button type="button" onClick={() => setNewOptions(newOptions.filter((_, i) => i !== idx))} className="p-3 text-red-500 bg-red-50 rounded-xl"><Trash2 size={18} /></button>}
                  </div>
                ))}
              </div>
              {newOptions.length < 5 && (
                <button type="button" onClick={() => setNewOptions([...newOptions, ''])} className="text-sm text-blue-600 font-bold flex items-center gap-1"><Plus size={16} /> Add Option</button>
              )}
              <button type="submit" disabled={creating} className="w-full mt-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex justify-center items-center gap-2">
                {creating && <Loader size={16} className="animate-spin" />} Publish Poll
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}