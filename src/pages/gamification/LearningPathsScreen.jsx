// ============================================================================
// Event AI Library (SHRM Library Design)
// File: src/pages/gamification/LearningPathsScreen.jsx
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  PlayCircle, 
  FileText, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Briefcase, 
  Plus, 
  Trash2, 
  X 
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const LearningPathsScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [me, setMe] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New Resource Form
  const [formData, setFormData] = useState({
    title: '',
    category: 'pdf', // acts as file type
    description: ''  // acts as the URL/link
  });

  useEffect(() => {
    // 1. Get current user to check Admin status
    apiClient.get('/auth/me')
      .then((res) => {
        const user = res?.data?.data || res?.data?.user || res?.data;
        setMe(user);
      })
      .catch((err) => console.error("Could not fetch user", err));

    // 2. Load resources
    loadResources();
  }, []);

  const loadResources = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/learning_paths', { params: { limit: 100 } });
      const rawData = response?.data;
      const list = Array.isArray(rawData) ? rawData : rawData?.data || rawData?.learning_paths || [];
      setResources(list);
    } catch (error) {
      toast.error('Failed to load library resources');
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Title and URL are required');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        difficulty: 'Beginner', // Required by backend schema, hidden from UI
        duration_weeks: 0,
        points_reward: 0
      };

      await apiClient.post('/learning_paths', payload);
      toast.success('Resource added successfully!');
      setShowCreateModal(false);
      setFormData({ title: '', category: 'pdf', description: '' });
      loadResources(); // Reload list
    } catch (error) {
      toast.error('Failed to add resource');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    
    try {
      await apiClient.delete(`/learning_paths/${id}`);
      toast.success('Resource deleted');
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      toast.error('Failed to delete resource');
    }
  };

  const openResource = (url) => {
    if (!url) {
      toast.error('No link available for this resource');
      return;
    }
    // Ensure URL has http/https
    const validUrl = url.match(/^https?:\/\//) ? url : `https://${url}`;
    window.open(validUrl, '_blank', 'noopener,noreferrer');
  };

  const getIconForType = (type) => {
    switch (type?.toLowerCase()) {
      case 'video': return <PlayCircle size={22} className="text-slate-700" strokeWidth={1.5} />;
      case 'image': return <ImageIcon size={22} className="text-slate-700" strokeWidth={1.5} />;
      case 'link':  return <LinkIcon size={22} className="text-slate-700" strokeWidth={1.5} />;
      case 'pdf':
      default:      return <FileText size={22} className="text-slate-700" strokeWidth={1.5} />;
    }
  };

  // Determine if user is admin based on role or is_admin flag
  const isAdmin = me?.role === 'admin' || me?.is_admin === true;

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto font-sans relative pb-20">
      
      {/* HEADER - CLEAN WHITE EXACTLY LIKE ADOBE XD */}
      <div className="bg-white text-slate-900 px-5 pt-5 pb-4 flex items-center justify-between border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/hub')} className="text-slate-800 hover:text-black transition-colors">
            <ChevronLeft size={26} strokeWidth={2.5} />
          </button>
          <h1 className="text-[20px] font-bold tracking-tight">Event AI Library</h1>
        </div>
        
        {/* ONLY ADMINS SEE THE ADD BUTTON */}
        {isAdmin && (
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      <div className="px-5 pt-6">
        {loading ? (
          <div className="py-24 flex justify-center"><LoadingSpinner /></div>
        ) : resources.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-[24px] border border-slate-100">
            <FileText size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-[14px] text-slate-500 px-8">No resources available in the library yet.</p>
          </div>
        ) : (
          <div className="bg-slate-50/80 rounded-[20px] border border-slate-100 flex flex-col overflow-hidden shadow-sm">
            {resources.map((resource, index) => (
              <React.Fragment key={resource.id}>
                <div className="flex items-center justify-between p-4 hover:bg-slate-100/50 transition">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex-shrink-0">
                      {getIconForType(resource.category)}
                    </div>
                    <p className="text-[15px] font-medium text-slate-800 truncate pr-2">
                      {resource.title}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Admin Delete Button */}
                    {isAdmin && (
                      <button 
                        onClick={() => handleDeleteResource(resource.id)}
                        className="p-2 border border-slate-200 rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 text-slate-400 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    
                    {/* Briefcase Button (Open/Download) */}
                    <button 
                      onClick={() => openResource(resource.description)}
                      className="p-2 border border-slate-200 rounded-xl hover:bg-white bg-transparent shadow-sm text-slate-700 transition"
                    >
                      <Briefcase size={18} />
                    </button>
                  </div>
                </div>
                {/* Divider Line, except for last item */}
                {index < resources.length - 1 && (
                  <div className="h-px bg-slate-200/50 mx-4" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* ADMIN CREATE MODAL */}
      {showCreateModal && isAdmin && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <form 
            onSubmit={handleCreateResource}
            className="w-full max-w-[340px] bg-white rounded-3xl p-6 flex flex-col relative shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[18px] font-bold text-slate-900">Add Resource</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-full transition">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[13px] font-bold text-slate-900 mb-2">Resource Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Quarterly report_March 2024"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-[14px] font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0000c8]/20 focus:border-[#0000c8]"
                  required
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-900 mb-2">File Type</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-[14px] font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0000c8]/20 focus:border-[#0000c8]"
                >
                  <option value="pdf">PDF Document</option>
                  <option value="video">Video</option>
                  <option value="image">Image</option>
                  <option value="link">Web Link</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-900 mb-2">File URL / Link</label>
                <input
                  type="url"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-[14px] font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0000c8]/20 focus:border-[#0000c8]"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-[#0000c8] text-white py-3.5 text-[15px] font-bold shadow-md hover:bg-blue-800 transition disabled:opacity-70"
            >
              {isSubmitting ? 'Uploading...' : 'Upload Resource'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default LearningPathsScreen;