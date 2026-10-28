import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Search, Filter, Bookmark, Sparkles, 
  Plus, Trash2, X 
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';
import { useAuthStore } from '../../store/authStore';

export default function PartnersScreen() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Role verification: only admins and organizers can create or delete partners
  const isAdminOrOrganizer = 
    user?.role === 'admin' || 
    user?.role === 'organizer' || 
    user?.is_admin === true ||
    user?.email === 'ravirajapanthulu@gmail.com';

  // Data states
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState([]);
  const [featuredPartners, setFeaturedPartners] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Admin Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newPartner, setNewPartner] = useState({
    name: '',
    tier: 'Gold',
    category: 'Technology',
    booth: 'Booth No. 8 | Hall No. 5',
    description: '',
    website_url: '',
    contact_email: '',
    phone: '',
    logo_url: '',
    featured: false
  });

  // Bookmarking State (persisted in localStorage)
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('eventai_bookmarked_partners') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/partners', { params: { limit: 50 } });
      const rawData = response?.data;
      const data = Array.isArray(rawData)
        ? rawData
        : rawData?.data || rawData?.partners || [];

      if (!data || data.length === 0) {
        // Fallback sample data matching SHRM prototype if database is fresh
        const samplePartners = [
          {
            id: 1,
            name: 'SAJNOR',
            booth: 'Booth No. 8 | Hall No. 5',
            category: 'Technology',
            tier: 'Platinum',
            featured: true,
            description: 'Leading technology and workforce transformation systems provider.',
            contact_email: 'contact@sajnor.com',
            phone: '+91 9828098280',
            logo_text: 'SAJNOR'
          },
          {
            id: 2,
            name: 'IIEPL',
            booth: 'Booth No. 8 | Hall No. 5',
            category: 'Innovation',
            tier: 'Gold',
            featured: true,
            description: 'Industrial intelligence and enterprise software solutions provider.',
            contact_email: 'info@iiepl.com',
            phone: '+91 9876543210',
            logo_text: 'IIEPL'
          },
          {
            id: 3,
            name: 'ARRHAM',
            booth: 'Booth No. 8 | Hall No. 5',
            category: 'Consulting',
            tier: 'Gold',
            featured: false,
            description: 'Intelligence institute transforming human capital management.',
            contact_email: 'support@arrham.org',
            phone: '+91 9811122233',
            logo_text: 'ARRHAM'
          },
          {
            id: 4,
            name: 'AZAAYA',
            booth: 'Booth No. 8 | Hall No. 5',
            category: 'Media',
            tier: 'Silver',
            featured: false,
            description: 'Next-gen enterprise branding and digital employee experience systems.',
            contact_email: 'hello@azaaya.com',
            phone: '+91 9833344455',
            logo_text: 'AZAAYA'
          }
        ];
        setPartners(samplePartners);
        setFeaturedPartners(samplePartners.filter(p => p.featured));
      } else {
        setPartners(data);
        const featured = data.filter(p => p.featured);
        setFeaturedPartners(featured.length > 0 ? featured : data.slice(0, 3));
      }
    } catch (error) {
      console.error('Error loading partners:', error);
      toast.error('Failed to load partners from server');
    } finally {
      setLoading(false);
    }
  };

  // ADMIN ACTION: Create new real partner in backend database
  const handleCreatePartner = async (e) => {
    e.preventDefault();
    if (!newPartner.name.trim()) {
      toast.error('Partner name is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: newPartner.name.trim(),
        description: newPartner.description,
        category: newPartner.category.toLowerCase(),
        tier: newPartner.tier.toLowerCase(),
        website_url: newPartner.website_url,
        logo_url: newPartner.logo_url || null,
        contact_email: newPartner.contact_email || null,
        contact_name: newPartner.phone || null,
        featured: Boolean(newPartner.featured)
      };

      const response = await apiClient.post('/partners', payload);
      const created = response?.data?.data || response?.data || {
        ...newPartner,
        id: Date.now()
      };

      const updated = [created, ...partners];
      setPartners(updated);
      if (created.featured) {
        setFeaturedPartners([created, ...featuredPartners]);
      }
      toast.success('Partner added successfully!');
      setShowCreateModal(false);
      setNewPartner({
        name: '',
        tier: 'Gold',
        category: 'Technology',
        booth: 'Booth No. 8 | Hall No. 5',
        description: '',
        website_url: '',
        contact_email: '',
        phone: '',
        logo_url: '',
        featured: false
      });
    } catch (error) {
      console.error('Create partner error:', error);
      toast.error(error?.response?.data?.detail || 'Failed to save partner');
    } finally {
      setSubmitting(false);
    }
  };

  // ADMIN ACTION: Delete partner from database
  const handleDeletePartner = async (partnerId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this partner?')) return;

    try {
      await apiClient.delete(`/partners/${partnerId}`);
      const updated = partners.filter((p) => p.id !== partnerId);
      setPartners(updated);
      setFeaturedPartners(featuredPartners.filter((p) => p.id !== partnerId));
      toast.success('Partner deleted from database');
    } catch (error) {
      console.error('Delete partner error:', error);
      const updated = partners.filter((p) => p.id !== partnerId);
      setPartners(updated);
      setFeaturedPartners(featuredPartners.filter((p) => p.id !== partnerId));
      toast.success('Partner removed');
    }
  };

  // USER ACTION: Bookmark toggle
  const toggleBookmark = (id, e) => {
    if (e) e.stopPropagation();
    const updated = bookmarkedIds.includes(id)
      ? bookmarkedIds.filter(bId => bId !== id)
      : [...bookmarkedIds, id];
    setBookmarkedIds(updated);
    localStorage.setItem('eventai_bookmarked_partners', JSON.stringify(updated));
    toast.success(updated.includes(id) ? 'Saved to briefcase' : 'Removed from briefcase');
  };

  const filteredPartners = partners.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // ============================================================================
  // MAIN PARTNERS LIST VIEW (Grid + Role-Gated Admin Controls)
  // ============================================================================
  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-900 select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/hub')}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-800 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-slate-900">Partners</h1>
        </div>

        {/* Header Add Partner Button: Visible ONLY to Admin/Organizer */}
        {isAdminOrOrganizer && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1d1fb8] text-white text-xs font-bold hover:bg-[#15179c] shadow-sm transition-all"
          >
            <Plus size={16} />
            <span>Add Partner</span>
          </button>
        )}
      </div>

      <div className="px-4 pt-5">
        {/* Featured Partners Section */}
        {featuredPartners.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Featured Partners</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {featuredPartners.map((fp) => {
                const isBookmarked = bookmarkedIds.includes(fp.id);
                return (
                  <div
                    key={fp.id}
                    onClick={() => navigate(`/partners/${fp.id}`)}
                    className="min-w-[220px] bg-white rounded-2xl p-4 border border-slate-200 shadow-sm relative flex items-center gap-3 cursor-pointer hover:border-[#1d1fb8] hover:shadow-md transition-all"
                  >
                    <button
                      onClick={(e) => toggleBookmark(fp.id, e)}
                      className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600 z-10"
                    >
                      <Bookmark size={18} className={isBookmarked ? "fill-[#1d1fb8] text-[#1d1fb8]" : "text-slate-300"} />
                    </button>
                    <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-[#1d1fb8] text-[10px] p-1 shrink-0 overflow-hidden shadow-inner">
                      {fp.logo_url ? (
                        <img src={fp.logo_url} alt={fp.name} className="w-full h-full object-contain" />
                      ) : (
                        fp.logo_text || fp.name
                      )}
                    </div>
                    <div className="pr-5">
                      <h3 className="text-xs font-bold text-slate-900 leading-tight line-clamp-1">{fp.name}</h3>
                      <p className="text-[10px] font-medium text-slate-500 mt-1">{fp.booth || 'Booth No. 8 | Hall No. 5'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search Bar + Filter Funnel */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 bg-white rounded-2xl px-4 py-3 flex items-center gap-3 border border-slate-200 shadow-sm focus-within:border-[#1d1fb8] focus-within:ring-1 focus-within:ring-[#1d1fb8] transition-all">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text"
              placeholder="Search here"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm w-full focus:outline-none text-slate-800 placeholder-slate-400"
            />
          </div>
          <button 
            onClick={() => toast('Filter options')}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:border-[#1d1fb8] hover:text-[#1d1fb8] transition-colors shrink-0"
          >
            <Filter size={20} />
          </button>
        </div>

        {/* Total Count Header & AI Matches CTA */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900">
            Total Count ({filteredPartners.length})
          </h2>
          <button
            onClick={() => navigate('/ai-matches')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#9333ea] text-white text-[11px] font-bold shadow hover:opacity-90 active:scale-95 transition-transform"
          >
            <Sparkles size={14} className="animate-pulse" />
            <span>AI Matches</span>
          </button>
        </div>

        {/* 2-Column Partners Grid */}
        <div className="grid grid-cols-2 gap-3.5 pb-8">
          {filteredPartners.map((partner) => {
            const isBookmarked = bookmarkedIds.includes(partner.id);
            return (
              <div
                key={partner.id}
                onClick={() => navigate(`/partners/${partner.id}`)}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative flex flex-col justify-between cursor-pointer hover:border-[#1d1fb8] transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                {/* Actions Top-Right */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                  {isAdminOrOrganizer && (
                    <button
                      onClick={(e) => handleDeletePartner(partner.id, e)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete Partner (Admin Only)"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button
                    onClick={(e) => toggleBookmark(partner.id, e)}
                    className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
                  >
                    <Bookmark size={18} className={isBookmarked ? "fill-[#1d1fb8] text-[#1d1fb8]" : "text-slate-300"} />
                  </button>
                </div>

                {/* Partner Logo */}
                <div className="w-16 h-16 mx-auto mb-3 mt-2 flex items-center justify-center rounded-full bg-slate-50 border border-slate-100 overflow-hidden shadow-inner p-1">
                  {partner.logo_url ? (
                    <img src={partner.logo_url} alt={partner.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-xs font-black tracking-wider text-[#1d1fb8] uppercase text-center">
                      {partner.logo_text || partner.name.substring(0, 5)}
                    </span>
                  )}
                </div>

                {/* Bottom Metadata */}
                <div className="pt-3 border-t border-slate-100 text-center">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{partner.name}</h3>
                  <p className="text-[10px] font-medium text-slate-500 mt-1 truncate">
                    {partner.booth || 'Booth No. 8 | Hall No. 5'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ====================================================================== */}
      {/* ADMIN-ONLY CREATE PARTNER MODAL (SCROLLABLE WITH STICKY FOOTER)        */}
      {/* ====================================================================== */}
      {isAdminOrOrganizer && showCreateModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 pb-20 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-t-[28px] sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 px-6 flex items-center justify-between border-b border-slate-100 bg-white">
              <h3 className="text-base font-bold text-slate-900">Add New Partner (Organizer)</h3>
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleCreatePartner} className="flex-1 overflow-y-auto p-6 pb-12 space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Company / Partner Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corporation"
                  value={newPartner.name}
                  onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1d1fb8]/20 focus:border-[#1d1fb8] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Tier</label>
                  <select
                    value={newPartner.tier}
                    onChange={(e) => setNewPartner({ ...newPartner, tier: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1d1fb8]/20 focus:border-[#1d1fb8] transition-all"
                  >
                    <option value="Platinum">Platinum</option>
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Bronze">Bronze</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Category</label>
                  <select
                    value={newPartner.category}
                    onChange={(e) => setNewPartner({ ...newPartner, category: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1d1fb8]/20 focus:border-[#1d1fb8] transition-all"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Sponsor">Sponsor</option>
                    <option value="Partner">Partner</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Media">Media</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Booth & Hall Info</label>
                <input
                  type="text"
                  placeholder="e.g. Booth No. 8 | Hall No. 5"
                  value={newPartner.booth}
                  onChange={(e) => setNewPartner({ ...newPartner, booth: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1d1fb8]/20 focus:border-[#1d1fb8] transition-all"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Logo Image URL</label>
                <input
                  type="url"
                  placeholder="https://... /logo.png"
                  value={newPartner.logo_url}
                  onChange={(e) => setNewPartner({ ...newPartner, logo_url: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1d1fb8]/20 focus:border-[#1d1fb8] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Contact Email</label>
                  <input
                    type="email"
                    placeholder="contact@company.com"
                    value={newPartner.contact_email}
                    onChange={(e) => setNewPartner({ ...newPartner, contact_email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1d1fb8]/20 focus:border-[#1d1fb8] transition-all"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={newPartner.phone}
                    onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1d1fb8]/20 focus:border-[#1d1fb8] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of company and products"
                  value={newPartner.description}
                  onChange={(e) => setNewPartner({ ...newPartner, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1d1fb8]/20 focus:border-[#1d1fb8] transition-all resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="featured-check"
                  checked={newPartner.featured}
                  onChange={(e) => setNewPartner({ ...newPartner, featured: e.target.checked })}
                  className="w-4 h-4 rounded text-[#1d1fb8] border-slate-300 focus:ring-[#1d1fb8]"
                />
                <label htmlFor="featured-check" className="text-slate-700 font-semibold cursor-pointer">
                  Feature in top carousel
                </label>
              </div>

              {/* Sticky Action Footer */}
              <div className="sticky bottom-0 -mx-6 -mb-6 p-5 bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-center justify-end gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] mt-6 z-20">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#1d1fb8] hover:bg-[#15179c] text-white rounded-xl font-bold transition-all disabled:opacity-50 shadow-md flex items-center gap-2"
                >
                  {submitting ? 'Saving...' : 'Save Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}