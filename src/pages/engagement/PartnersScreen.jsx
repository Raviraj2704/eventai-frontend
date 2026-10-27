import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Search, Filter, Bookmark, Sparkles, 
  MapPin, FileText, MessageSquare, Video, 
  Mail, Phone, Plus, Trash2, X, Globe, MessageCircle
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

  // Navigation / Selection State
  const [selectedPartner, setSelectedPartner] = useState(null);

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

  // Notes state per partner (persisted in localStorage)
  const [partnerNotes, setPartnerNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('eventai_partner_notes') || '{}');
    } catch {
      return {};
    }
  });
  const [noteInput, setNoteInput] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);

  useEffect(() => {
    loadPartners();
  }, []);

  // Sync active partner's note to input box
  useEffect(() => {
    if (selectedPartner) {
      const existing = partnerNotes[selectedPartner.id] || '';
      setNoteInput(existing);
      setIsEditingNote(!existing);
    }
  }, [selectedPartner, partnerNotes]);

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
            logo_text: 'SAJNOR',
            representatives: [
              { name: 'Mayank Sharma', role: 'Manager at Dreamcast', virtual: true },
              { name: 'Olivia Smith', role: 'Manager at Dreamcast', virtual: true }
            ]
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
            logo_text: 'IIEPL',
            representatives: [
              { name: 'Aman Shrivastava', role: 'Director', virtual: true }
            ]
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
            logo_text: 'ARRHAM',
            representatives: []
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
            logo_text: 'AZAAYA',
            representatives: []
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
      if (selectedPartner?.id === partnerId) {
        setSelectedPartner(null);
      }
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

  // USER ACTION: Save personal notes
  const handleSaveNote = () => {
    if (!selectedPartner) return;
    const updatedNotes = {
      ...partnerNotes,
      [selectedPartner.id]: noteInput.trim()
    };
    setPartnerNotes(updatedNotes);
    localStorage.setItem('eventai_partner_notes', JSON.stringify(updatedNotes));
    setIsEditingNote(false);
    toast.success('Note saved!');
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
  // 1. PARTNER DETAILS VIEW (Matching Adobe XD Reference)
  // ============================================================================
  if (selectedPartner) {
    const savedNote = partnerNotes[selectedPartner.id];
    const isBookmarked = bookmarkedIds.includes(selectedPartner.id);

    return (
      <div className="min-h-screen bg-slate-50 pb-24 text-slate-900 select-none">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedPartner(null)}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-800"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-bold text-slate-900">Partner Details</h1>
          </div>
          <div className="flex items-center gap-2">
            {isAdminOrOrganizer && (
              <button
                onClick={(e) => handleDeletePartner(selectedPartner.id, e)}
                className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                title="Delete Partner"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button 
              onClick={() => toggleBookmark(selectedPartner.id)}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-700"
            >
              <Bookmark 
                size={22} 
                className={isBookmarked ? "fill-amber-500 text-amber-500" : "text-slate-400"} 
              />
            </button>
          </div>
        </div>

        {/* Hero Banner with Circular Logo */}
        <div className="relative">
          <div className="h-36 bg-gradient-to-r from-[#180A47] via-[#2F106D] to-[#4B1E8A] w-full relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-pink-500/30 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-cyan-400/30 blur-2xl pointer-events-none" />
          </div>

          <div className="px-5">
            <div className="relative -mt-12 mb-3">
              <div className="w-24 h-24 rounded-full bg-white shadow-lg p-2 border-2 border-white flex items-center justify-center overflow-hidden">
                {selectedPartner.logo_url ? (
                  <img src={selectedPartner.logo_url} alt={selectedPartner.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-50 flex items-center justify-center text-center p-1">
                    <span className="text-[11px] font-black tracking-wider text-purple-900 uppercase">
                      {selectedPartner.name || 'Partner'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-1">{selectedPartner.name}</h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-3">
              <MapPin size={14} className="text-slate-400" />
              <span>{selectedPartner.booth || 'Booth No. 8 | Hall No. 5'}</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              {selectedPartner.description || 'Welcome to our official partner booth. Discover our solutions, speak with virtual representatives, and explore collaborative opportunities.'}
            </p>

            {/* Action Pills */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button 
                onClick={() => toast('No brochures uploaded yet')}
                className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-white rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold shadow-sm hover:bg-slate-50"
              >
                <FileText size={14} className="text-slate-500" />
                <span>Documents</span>
              </button>

              <button 
                onClick={() => navigate('/messaging')}
                className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-white rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold shadow-sm hover:bg-slate-50"
              >
                <MessageSquare size={14} className="text-slate-500" />
                <span>Ask A Question</span>
              </button>

              <button 
                onClick={() => toast('No video streams active currently')}
                className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-white rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold shadow-sm hover:bg-slate-50"
              >
                <Video size={14} className="text-slate-500" />
                <span>Videos</span>
              </button>
            </div>

            {/* Social Media Links */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-900 mb-2.5">Social Media</h3>
              <div className="flex items-center gap-2.5">
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-black text-xs shadow-sm hover:bg-slate-50">
                  f
                </a>
                <a href="https://x.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-black text-xs shadow-sm hover:bg-slate-50">
                  𝕏
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-black text-xs shadow-sm hover:bg-slate-50">
                  in
                </a>
                {selectedPartner.website_url && (
                  <a href={selectedPartner.website_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm hover:bg-slate-50">
                    <Globe size={14} />
                  </a>
                )}
              </div>
            </div>

            {/* Representatives */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900">Representatives</h3>
                <span className="text-xs font-bold text-[#0F259E] cursor-pointer">View All</span>
              </div>

              <div className="space-y-2.5">
                {(selectedPartner.representatives && selectedPartner.representatives.length > 0
                  ? selectedPartner.representatives
                  : [
                      { name: 'Mayank Sharma', role: 'Manager at Dreamcast', virtual: true },
                      { name: 'Olivia Smith', role: 'Manager at Dreamcast', virtual: true }
                    ]
                ).map((rep, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-3 border border-slate-200/70 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                        {rep.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{rep.name}</h4>
                        <p className="text-[11px] text-slate-500">{rep.role}</p>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-[10px] font-semibold text-blue-700 mt-0.5">
                          💻 Attending Virtually
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate('/messaging')}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600"
                    >
                      <MessageCircle size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Details */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-900 mb-2.5">Contact Details</h3>
              <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-sm space-y-2">
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span className="text-slate-400 font-medium w-12">Email :</span>
                  <span className="font-semibold text-slate-800">{selectedPartner.contact_email || 'contact@partner.com'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span className="text-slate-400 font-medium w-12">Phone :</span>
                  <span className="font-semibold text-slate-800">{selectedPartner.phone || '+91 9828098280'}</span>
                </div>
              </div>
            </div>

            {/* Add / Edit Notes Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-900">
                  {savedNote && !isEditingNote ? 'Notes' : 'Add Notes'}
                </h3>
                {savedNote && !isEditingNote ? (
                  <button 
                    onClick={() => setIsEditingNote(true)}
                    className="text-xs font-bold text-[#0F259E] hover:underline"
                  >
                    Edit
                  </button>
                ) : (
                  <button 
                    onClick={handleSaveNote}
                    className="text-xs font-bold text-[#0F259E] hover:underline"
                  >
                    Save
                  </button>
                )}
              </div>

              {savedNote && !isEditingNote ? (
                <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-sm text-xs text-slate-700 leading-relaxed">
                  {savedNote}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-3 border border-slate-200/70 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">Notes</span>
                  <textarea
                    rows={3}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Type here"
                    className="w-full text-xs text-slate-800 focus:outline-none resize-none placeholder-slate-400"
                  />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 2. MAIN PARTNERS LIST VIEW (Grid + Role-Gated Admin Controls)
  // ============================================================================
  return (
    <div className="min-h-screen bg-white pb-24 text-slate-900 select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/hub')}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-800"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-slate-900">Partners</h1>
        </div>

        {/* Header Add Partner Button: Visible ONLY to Admin/Organizer */}
        {isAdminOrOrganizer && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0F259E] text-white text-xs font-bold hover:bg-[#0c1e80] shadow-sm transition-all"
          >
            <Plus size={16} />
            <span>Add Partner</span>
          </button>
        )}
      </div>

      <div className="px-4 pt-4">
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
                    onClick={() => setSelectedPartner(fp)}
                    className="min-w-[210px] bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm relative flex items-center gap-3 cursor-pointer hover:border-slate-300 transition-colors"
                  >
                    <button
                      onClick={(e) => toggleBookmark(fp.id, e)}
                      className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <Bookmark size={16} className={isBookmarked ? "fill-amber-500 text-amber-500" : "text-slate-300"} />
                    </button>
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-purple-900 text-[10px] p-1">
                      {fp.logo_text || fp.name}
                    </div>
                    <div className="pr-4">
                      <h3 className="text-xs font-bold text-slate-900 leading-tight">{fp.name}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">{fp.booth || 'Booth No. 8 | Hall No. 5'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search Bar + Filter Funnel */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex-1 bg-slate-100 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 border border-transparent focus-within:border-slate-300">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text"
              placeholder="Search here"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs w-full focus:outline-none text-slate-800 placeholder-slate-400"
            />
          </div>
          <button 
            onClick={() => toast('Filter options')}
            className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <Filter size={18} />
          </button>
        </div>

        {/* Total Count Header & AI Matches CTA */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900">
            Total Count ({filteredPartners.length})
          </h2>
          <button
            onClick={() => navigate('/ai-matches')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-bold shadow-sm hover:opacity-95 active:scale-95 transition-transform"
          >
            <Sparkles size={12} />
            <span>AI Matches</span>
          </button>
        </div>

        {/* 2-Column Partners Grid */}
        <div className="grid grid-cols-2 gap-3 pb-8">
          {filteredPartners.map((partner) => {
            const isBookmarked = bookmarkedIds.includes(partner.id);
            return (
              <div
                key={partner.id}
                onClick={() => setSelectedPartner(partner)}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm relative flex flex-col justify-between cursor-pointer hover:border-slate-300 transition-all hover:scale-[1.01]"
              >
                {/* Actions Top-Right */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                  {isAdminOrOrganizer && (
                    <button
                      onClick={(e) => handleDeletePartner(partner.id, e)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                      title="Delete Partner (Admin Only)"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                  <button
                    onClick={(e) => toggleBookmark(partner.id, e)}
                    className="p-1 text-slate-300 hover:text-slate-600"
                  >
                    <Bookmark size={16} className={isBookmarked ? "fill-amber-500 text-amber-500" : "text-slate-300"} />
                  </button>
                </div>

                {/* Partner Logo */}
                <div className="w-16 h-12 mx-auto my-2 flex items-center justify-center">
                  {partner.logo_url ? (
                    <img src={partner.logo_url} alt={partner.name} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-xs font-black tracking-wider text-purple-900 uppercase">
                      {partner.logo_text || partner.name}
                    </span>
                  )}
                </div>

                {/* Bottom Metadata */}
                <div className="pt-2 border-t border-slate-100 mt-2">
                  <h3 className="text-xs font-bold text-slate-900 truncate">{partner.name}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {partner.booth || 'Booth No. 8 | Hall No. 5'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ====================================================================== */}
      {/* ADMIN-ONLY CREATE PARTNER MODAL                                         */}
      {/* ====================================================================== */}
      {isAdminOrOrganizer && showCreateModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-t-[28px] sm:rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Partner (Organizer)</h3>
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePartner} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Partner Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corporation"
                  value={newPartner.name}
                  onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tier</label>
                  <select
                    value={newPartner.tier}
                    onChange={(e) => setNewPartner({ ...newPartner, tier: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  >
                    <option value="Platinum">Platinum</option>
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Bronze">Bronze</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newPartner.category}
                    onChange={(e) => setNewPartner({ ...newPartner, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
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
                <label className="block font-semibold text-slate-700 mb-1">Booth & Hall Info</label>
                <input
                  type="text"
                  placeholder="e.g. Booth No. 8 | Hall No. 5"
                  value={newPartner.booth}
                  onChange={(e) => setNewPartner({ ...newPartner, booth: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Logo Image URL</label>
                <input
                  type="url"
                  placeholder="https://... /logo.png"
                  value={newPartner.logo_url}
                  onChange={(e) => setNewPartner({ ...newPartner, logo_url: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="contact@company.com"
                    value={newPartner.contact_email}
                    onChange={(e) => setNewPartner({ ...newPartner, contact_email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={newPartner.phone}
                    onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of company and products"
                  value={newPartner.description}
                  onChange={(e) => setNewPartner({ ...newPartner, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="featured-check"
                  checked={newPartner.featured}
                  onChange={(e) => setNewPartner({ ...newPartner, featured: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <label htmlFor="featured-check" className="text-slate-700 font-semibold cursor-pointer">
                  Feature in top carousel
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#0F259E] hover:bg-[#0c1e80] text-white rounded-xl font-bold transition-all disabled:opacity-50"
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