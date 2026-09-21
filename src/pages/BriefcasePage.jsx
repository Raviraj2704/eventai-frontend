import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost, apiDelete } from '../services/api';

// Components
import DocumentList from '../components/Resources/DocumentList';
import ResourceCategoryTab from '../components/Resources/ResourceCategoryTab';
import ResourceCard from '../components/Resources/DocumentCard';
import ResourceDownloadModal from '../components/Resources/DownloadButton';

// Styles
import '../styles/briefcase.css';

export const BriefcasePage = () => {
  const navigate = useNavigate();

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [resources, setResources] = useState([]);
  const [briefcaseItems, setBriefcaseItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('all');
  const [fileType, setFileType] = useState('all');
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredResources, setFilteredResources] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedResource, setSelectedResource] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadedResources, setDownloadedResources] = useState([]);
  const [bookmarkedResources, setBookmarkedResources] = useState([]);

  // ============= RESOURCE CATEGORIES =============
  const categories = [
    { id: 'all', label: 'All Resources', icon: '📚', count: 0 },
    { id: 'template', label: 'Templates', icon: '📋', count: 0 },
    { id: 'guide', label: 'Guides', icon: '📖', count: 0 },
    { id: 'case_study', label: 'Case Studies', icon: '📑', count: 0 },
    { id: 'whitepaper', label: 'Whitepapers', icon: '📄', count: 0 },
    { id: 'video', label: 'Videos', icon: '🎬', count: 0 },
    { id: 'tool', label: 'Tools', icon: '🛠️', count: 0 },
  ];

  // ==========================================
  // FETCH REAL DATA
  // ==========================================
  useEffect(() => {
    loadResourcesData();
  }, []);

  const loadResourcesData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch resources
      const resourcesData = await apiGet('/api/v1/resources');
      const allResources = Array.isArray(resourcesData) ? resourcesData : [];
      setResources(allResources);
      setFilteredResources(allResources);

      // Fetch briefcase items
      const briefcaseData = await apiGet('/api/v1/briefcase');
      setBriefcaseItems(Array.isArray(briefcaseData) ? briefcaseData : []);

      // Calculate stats
      setStats({
        total_resources: allResources.length,
        total_downloads: allResources.reduce((sum, r) => sum + (r.download_count || 0), 0),
        total_views: allResources.reduce((sum, r) => sum + (r.view_count || 0), 0)
      });
    } catch (err) {
      console.error('Failed to load resources:', err);
      setError('Unable to load resources. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FILTERING LOGIC
  // ==========================================
  useEffect(() => {
    applyFilters();
  }, [searchTerm, view, category, fileType, resources, briefcaseItems]);

  const applyFilters = () => {
    let filtered = resources;

    // View filter
    if (view === 'briefcase') {
      const briefcaseResourceIds = briefcaseItems.map(item => item.resource_id || item.resource?.id);
      filtered = filtered.filter(r => briefcaseResourceIds.includes(r.id));
    } else if (view === 'featured') {
      filtered = filtered.filter(r => r.is_featured);
    }

    // Category filter
    if (category !== 'all') {
      filtered = filtered.filter(r => r.category === category);
    }

    // File type filter
    if (fileType !== 'all') {
      filtered = filtered.filter(r => r.file_type === fileType);
    }

    // Search filter
    if (searchTerm.trim()) {
      const lowerQuery = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        (r.title && r.title.toLowerCase().includes(lowerQuery)) ||
        (r.description && r.description.toLowerCase().includes(lowerQuery))
      );
    }

    setFilteredResources(filtered);
  };

  // ==========================================
  // EVENT HANDLERS
  // ==========================================
  const handleSaveBriefcase = async (resourceId) => {
    try {
      await apiPost('/api/v1/briefcase', {
        resource_id: resourceId
      });
      await loadResourcesData();
    } catch (err) {
      console.error('Failed to save to briefcase:', err);
      setError('Failed to save resource to briefcase');
    }
  };

  const handleRemoveBriefcase = async (resourceId) => {
    try {
      const briefcaseItem = briefcaseItems.find(item => item.resource_id === resourceId);
      if (briefcaseItem) {
        await apiDelete(`/api/v1/briefcase/${briefcaseItem.id}`);
        await loadResourcesData();
      }
    } catch (err) {
      console.error('Failed to remove from briefcase:', err);
      setError('Failed to remove resource from briefcase');
    }
  };

  const handleDownload = (resourceId) => {
    const resource = resources.find(r => r.id === resourceId);
    setSelectedResource(resource);
    setIsModalOpen(true);
  };

  const handleConfirmDownload = async (resourceId) => {
    try {
      await apiPost(`/api/v1/resources/${resourceId}/download`, {});
      setDownloadedResources([...downloadedResources, resourceId]);
      alert('Resource downloaded successfully!');
    } catch (err) {
      console.error('Failed to download:', err);
      alert('Failed to download resource');
    }
  };

  const handlePreview = (resourceId) => {
    const resource = resources.find(r => r.id === resourceId);
    if (resource?.preview_url) {
      window.open(resource.preview_url, '_blank');
    }
  };

  const handleShare = async (resourceId, shareType) => {
    const resource = resources.find(r => r.id === resourceId);
    if (shareType === 'bookmark') {
      if (!bookmarkedResources.includes(resourceId)) {
        setBookmarkedResources([...bookmarkedResources, resourceId]);
        alert(`${resource?.title} bookmarked!`);
      } else {
        setBookmarkedResources(bookmarkedResources.filter(id => id !== resourceId));
        alert(`${resource?.title} removed from bookmarks!`);
      }
    }
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    setCategory(categoryId);
  };

  const handleBack = () => navigate('/hub');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="border-t-blue-500 border-4 rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col w-full">

      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-7xl mx-auto w-full">
        
        {/* HEADER */}
        <div className="flex items-center mb-8">
          <button
            className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-white mr-4 transition-colors"
            onClick={handleBack}
            aria-label="Go back"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <h1 className="text-4xl font-bold text-white mb-1">
              💼 Briefcase & Resources
            </h1>
            <p className="text-slate-400">
              Download presentations, guides, and event materials
            </p>
          </div>
        </div>

        {/* ERROR BANNER */}
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-600 text-red-300 px-4 py-3 rounded-lg">
            ⚠️ {error}
            <button 
              onClick={loadResourcesData}
              className="ml-2 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* STATISTICS */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-6 text-center">
              <p className="text-3xl font-bold text-blue-500">{stats.total_resources}</p>
              <p className="text-sm text-slate-400 mt-2">Resources</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-6 text-center">
              <p className="text-3xl font-bold text-emerald-500">{stats.total_downloads}</p>
              <p className="text-sm text-slate-400 mt-2">Downloads</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-6 text-center">
              <p className="text-3xl font-bold text-purple-500">{stats.total_views}</p>
              <p className="text-sm text-slate-400 mt-2">Views</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-6 text-center">
              <p className="text-3xl font-bold text-orange-500">{briefcaseItems.length}</p>
              <p className="text-sm text-slate-400 mt-2">In Briefcase</p>
            </div>
          </div>
        )}

        {/* SEARCH & FILTERS */}
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 mb-8 border border-slate-700">
          
          <div className="mb-6 relative">
            <svg className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M14 14l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search resources..."
              className="w-full pl-12 pr-4 py-3 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-900 text-white placeholder-slate-500"
            />
          </div>

          <div className="flex gap-2 mb-6 border-b border-slate-700 pb-4 overflow-x-auto">
            {[
              { id: 'all', label: '📋 All Resources' },
              { id: 'briefcase', label: '💼 My Briefcase' },
              { id: 'featured', label: '⭐ Featured' }
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`
                  px-4 py-2 font-semibold transition-all whitespace-nowrap rounded-t-lg
                  ${view === v.id
                    ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-900'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }
                `}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {view === 'all' && (
              <>
                <div>
                  <p className="text-sm font-semibold text-slate-300 mb-2">File Type</p>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-900 text-white"
                  >
                    <option value="all">All Types</option>
                    <option value="pdf">📄 PDF</option>
                    <option value="docx">📝 Document</option>
                    <option value="pptx">🎨 Presentation</option>
                    <option value="xlsx">📊 Spreadsheet</option>
                    <option value="video">🎬 Video</option>
                  </select>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-300 mb-2">Category</p>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-900 text-white"
                  >
                    <option value="all">All Categories</option>
                    <option value="template">📋 Template</option>
                    <option value="guide">📖 Guide</option>
                    <option value="case_study">📑 Case Study</option>
                    <option value="whitepaper">📄 Whitepaper</option>
                    <option value="video">🎬 Video</option>
                    <option value="tool">🛠️ Tool</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* CATEGORY TABS */}
        <div className="mb-6">
          <ResourceCategoryTab
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>

        {/* INFO BANNER */}
        <div className="bg-blue-900/40 border border-blue-500/30 rounded-xl p-4 flex gap-4 mb-8">
          <div className="text-2xl">💼</div>
          <div>
            <h3 className="text-white font-semibold text-lg">Your Resource Library</h3>
            <p className="text-blue-200 text-sm mt-1">
              Download templates, guides, and tools to maximize your EventAI experience
            </p>
          </div>
        </div>

        {/* RESOURCES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredResources.length > 0 ? (
            filteredResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={{
                  id: resource.id,
                  title: resource.title || 'Untitled',
                  description: resource.description || '',
                  category: resource.category,
                  author: resource.author,
                  publishedDate: resource.published_date,
                  fileSize: resource.file_size,
                  fileType: resource.file_type,
                  tags: resource.tags || [],
                  downloads: resource.download_count || 0,
                  rating: resource.rating || 0,
                  previewUrl: resource.preview_url,
                  features: resource.features || []
                }}
                onDownload={() => handleDownload(resource.id)}
                onPreview={() => handlePreview(resource.id)}
                onShare={(type) => handleShare(resource.id, type)}
                isSaved={briefcaseItems.some(item => item.resource_id === resource.id)}
                onSaveBriefcase={() => handleSaveBriefcase(resource.id)}
                onRemoveBriefcase={() => handleRemoveBriefcase(resource.id)}
              />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-slate-400 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-lg font-medium text-white mb-1">No resources found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* DOCUMENT LIST */}
        <div className="mb-12 border-t border-slate-700 pt-8">
          <h2 className="text-2xl font-bold text-white mb-6">Detailed Document List</h2>
          <DocumentList
            resources={filteredResources}
            briefcaseItems={briefcaseItems}
            onSaveBriefcase={handleSaveBriefcase}
            onRemoveBriefcase={handleRemoveBriefcase}
            onDownload={loadResourcesData}
            loading={loading}
          />
        </div>

        {/* TIPS */}
        {filteredResources.length > 0 && (
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-lg mt-8">
            <h3 className="text-lg font-bold text-white mb-4">💡 Resource Tips</h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li>✓ All resources are available offline after download</li>
              <li>✓ Use templates as-is or customize for your organization</li>
              <li>✓ Bookmark resources for quick access later</li>
              <li>✓ Share resources with your team via email</li>
              <li>✓ Preview before downloading to verify content</li>
            </ul>
          </div>
        )}

      </div>

      {/* DOWNLOAD MODAL */}
      <ResourceDownloadModal
        resource={selectedResource}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirmDownload={handleConfirmDownload}
      />
      
    </div>
  );
};

export default BriefcasePage;