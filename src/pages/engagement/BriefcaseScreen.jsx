import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, PlayCircle, FileText, Image, Link2, Briefcase } from 'lucide-react';
import apiClient from '../../config/apiClient';

export default function BriefcaseScreen() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBriefcase();
  }, []);

  const fetchBriefcase = async () => {
    try {
      // Adjust this endpoint to match where you placed the backend route
      // To this:
      const res = await apiClient.get('/sessions/briefcase');
      const data = res.data?.data || res.data || [];
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load briefcase', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to pick the small left-side icon based on file type
  const getTypeIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'video': return <PlayCircle size={18} className="text-slate-600" />;
      case 'pdf': return <FileText size={18} className="text-slate-600" />;
      case 'image': return <Image size={18} className="text-slate-600" />;
      default: return <Link2 size={18} className="text-slate-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header matching XD Design */}
      <div className="flex items-center p-4 border-b border-slate-100">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors mr-2">
          <ChevronLeft size={24} className="text-slate-800" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Briefcase</h1>
      </div>

      {/* Main Content Area */}
      <div className="p-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-10 text-slate-500">Your briefcase is empty.</div>
        ) : (
          <div className="bg-slate-50 rounded-2xl p-2 space-y-2">
            {items.map((item, index) => (
              <div 
                key={item.id || index} 
                className="flex items-center justify-between p-4 bg-white rounded-xl hover:shadow-sm transition-shadow border border-transparent hover:border-slate-100 cursor-pointer"
                onClick={() => window.open(item.file_url, '_blank')}
              >
                <div className="flex items-center gap-3">
                  {getTypeIcon(item.file_type)}
                  <span className="font-medium text-slate-800 text-[15px]">{item.title}</span>
                </div>
                {/* Yellow Briefcase Icon from XD Design */}
                <div className="w-10 h-10 rounded-xl border border-amber-200 flex items-center justify-center bg-amber-50/50">
                  <Briefcase size={20} className="text-amber-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}