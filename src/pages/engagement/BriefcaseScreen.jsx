import React, { useEffect, useState } from 'react';
import { Briefcase, Download, Trash2, Share2, FileText, Link as LinkIcon, Search, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../../components/layout/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const BriefcaseScreen = () => {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [deleting, setDeleting] = useState(null);
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({
    title: '',
    description: '',
    resource_type: 'link',
    file_url: ''
  });

  useEffect(() => {
    loadBriefcaseResources();
  }, [selectedType]);

  useEffect(() => {
    filterResources();
  }, [searchQuery, resources]);

  const loadBriefcaseResources = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 50,
        ...(selectedType && { resource_type: selectedType })
      };
      const response = await apiClient.get('/resources', { params });
      const rawData = response?.data;
      const list = Array.isArray(rawData) ? rawData : rawData?.data || rawData?.resources || [];
      setResources(list);
      setFilteredResources(list);
    } catch (error) {
      console.error('Error loading briefcase:', error);
      toast.error('Failed to load briefcase items');
    } finally {
      setLoading(false);
    }
  };

  const filterResources = () => {
    if (!searchQuery) {
      setFilteredResources(resources);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = resources.filter(
      (resource) =>
        (resource?.title || '').toLowerCase().includes(query) ||
        (resource?.description || '').toLowerCase().includes(query)
    );
    setFilteredResources(filtered);
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!addForm.title || !addForm.file_url) {
      toast.error('Title and URL are required');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await apiClient.post('/resources', addForm);
      toast.success('Resource saved to briefcase!');
      setShowAddModal(false);
      setAddForm({ title: '', description: '', resource_type: 'link', file_url: '' });
      loadBriefcaseResources();
    } catch (error) {
      console.error('Error adding resource:', error);
      toast.error('Failed to save resource');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (resourceId) => {
    if (!window.confirm('Remove this item from your briefcase?')) return;
    
    setDeleting(resourceId);
    try {
      await apiClient.delete(`/resources/${resourceId}`);
      setResources((prev) => prev.filter((r) => r.id !== resourceId));
      setFilteredResources((prev) => prev.filter((r) => r.id !== resourceId));
      toast.success('Removed from briefcase');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to remove item');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (resource) => {
    if (resource?.file_url || resource?.url) {
      window.open(resource.file_url || resource.url, '_blank');
    }
  };

  const handleShare = (resource) => {
    const shareUrl = resource?.file_url || resource?.url || window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  const getResourceIcon = (type) => {
    return (type || '').toLowerCase() === 'link' 
      ? <LinkIcon className="w-5 h-5 text-green-600" />
      : <FileText className="w-5 h-5 text-blue-600" />;
  };

  return (
    <>
      <Header />
      <main className="pb-20 md:pb-0 min-h-screen bg-neutral-50">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
          <div className="max-w-6xl mx-auto py-10 px-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">💼 My Briefcase</h1>
              <p className="text-white/80">Your saved resources, slides, and links ({filteredResources.length})</p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-white text-blue-700 px-5 py-2.5 rounded-lg font-bold shadow-lg hover:bg-blue-50 flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Link
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto py-8 px-6">
          <div className="space-y-4 mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-3 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search saved resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-white w-full py-3 rounded-lg border border-neutral-200 shadow-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {['', 'pdf', 'slides', 'link', 'document'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedType === type ? 'bg-blue-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {type ? type.toUpperCase() : 'All Types'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredResources.map((resource) => (
                <div key={resource.id} className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="p-3 bg-neutral-100 rounded-lg flex-shrink-0">
                      {getResourceIcon(resource.resource_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-neutral-900 mb-1 truncate">{resource.title}</h3>
                      <p className="text-sm text-neutral-500 line-clamp-2 mb-3">{resource.description || 'Saved resource link'}</p>
                      <span className="text-xs px-2.5 py-1 bg-neutral-100 font-semibold rounded-md text-neutral-600">
                        {(resource.resource_type || 'LINK').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <div className="flex gap-1">
                      <button onClick={() => handleDownload(resource)} className="p-2 hover:bg-neutral-100 rounded-lg text-blue-600" title="Open Link">
                        <Download className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleShare(resource)} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-600" title="Share">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      disabled={deleting === resource.id}
                      className="px-3 py-1.5 hover:bg-red-50 rounded-lg text-red-500 flex items-center gap-1 text-xs font-bold transition-colors w-full justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deleting === resource.id ? '...' : 'Remove'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-neutral-200 shadow-sm">
              <div className="bg-neutral-100 p-6 rounded-full mb-4">
                <Briefcase className="w-12 h-12 text-neutral-400" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Your briefcase is empty</h3>
              <p className="text-neutral-500 max-w-sm mb-6">Save helpful presentation links, external documents, and slides here for easy access.</p>
              <button 
                onClick={() => setShowAddModal(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Add Your First Link
              </button>
            </div>
          )}
        </div>

        {/* Add Link Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <h3 className="text-2xl font-bold text-neutral-900 mb-4">Add to Briefcase</h3>
              <form onSubmit={handleAddResource} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={addForm.title}
                    onChange={(e) => setAddForm({...addForm, title: e.target.value})}
                    placeholder="e.g., FastAPI Presentation Slides"
                    className="w-full border border-neutral-300 rounded-lg p-3 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-1">URL Link *</label>
                  <input
                    type="url"
                    required
                    value={addForm.file_url}
                    onChange={(e) => setAddForm({...addForm, file_url: e.target.value})}
                    placeholder="https://docs.google.com/..."
                    className="w-full border border-neutral-300 rounded-lg p-3 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-1">Type</label>
                  <select
                    value={addForm.resource_type}
                    onChange={(e) => setAddForm({...addForm, resource_type: e.target.value})}
                    className="w-full border border-neutral-300 rounded-lg p-3 focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="link">Web Link</option>
                    <option value="slides">Slides / Presentation</option>
                    <option value="pdf">PDF Document</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-1">Description (Optional)</label>
                  <textarea
                    value={addForm.description}
                    onChange={(e) => setAddForm({...addForm, description: e.target.value})}
                    placeholder="Brief notes about this link..."
                    className="w-full border border-neutral-300 rounded-lg p-3 focus:outline-none focus:border-blue-500"
                    rows="2"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 bg-neutral-100 text-neutral-700 font-bold rounded-lg hover:bg-neutral-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Link'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default BriefcaseScreen;