import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Search, Filter, Bookmark, Sparkles, 
  MapPin, FileText, MessageSquare, Video, 
  Mail, Phone, Edit2, Check, MessageCircle, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

export default function PartnersScreen() {
  const navigate = useNavigate();

  // Data states
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState([]);
  const [featuredPartners, setFeaturedPartners] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Navigation / Selection State
  const [selectedPartner, setSelectedPartner] = useState(null);

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

      // If backend has no data yet, provide matching sample data from the video
      if (!data || data.length === 0) {
        const samplePartners = [
          {
            id: 1,
            name: 'SAJNOR',
            booth: 'Booth No. 8 | Hall No. 5',
            category: 'Technology',
            tier: 'Platinum',
            featured: true,
            description: 'Lorem Ipsum is simply dummy text of the printing and type setting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s.',
            contact_email: 'contact@sajnor.com',
            phone: '+91 9828098280',
            logo_text: 'SAJNOR',
            representatives: [
              { name: 'Mayank Sharma', role: 'Manager at Dreamcast', virtual: true },
              { name: 'Olivia Smith', role: 'Manager at Dreamcast', virtual: true },
              { name: 'ED Petro', role: 'Manager at Dreamcast', virtual: true },
              { name: 'Zoya Khan', role: 'Manager at Dreamcast', virtual: true }
            ]
          },
          {
            id: 2,
            name: 'IIEPL',
            booth: 'Booth No. 8 | Hall No. 5',
            category: 'Innovation',
            tier: 'Gold',
            featured: true,
            description: 'Leading industrial intelligence and enterprise software solutions provider.',
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
            description: 'Intelligence institute transforming organizational human capital management.',
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
            description: 'Next-gen enterprise branding and digital customer experience systems.',
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
      toast.error('Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = (id, e) => {
    if (e) e.stopPropagation();
    const updated = bookmarkedIds.includes(id)
      ? bookmarkedIds.filter(bId => bId !== id)
      : [...bookmarkedIds, id];
    setBookmarkedIds(updated);
    localStorage.setItem('eventai_bookmarked_partners', JSON.stringify(updated));
    toast.success(updated.includes(id) ? 'Partner saved to favorites' : 'Removed from favorites');
  };

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
  // 1. PARTNER DETAILS VIEW (Exact XD Prototype Layout)
  // ============================================================================
  if (selectedPartner) {
    const savedNote = partnerNotes[selectedPartner.id];
    const isBookmarked = bookmarkedIds.includes(selectedPartner.id);

    return (
      <div className="min-h-screen bg-slate-50 pb-24 text-slate-900 select-none">
        {/* Top Header */}
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

        {/* Hero Banner with Overlapping Circular Logo */}
        <div className="relative">
          <div className="h-36 bg-gradient-to-r from-[#180A47] via-[#2F106D] to-[#4B1E8A] w-full relative overflow-hidden">
            {/* Iridescent background swirls */}
            <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-pink-500/30 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-cyan-400/30 blur-2xl pointer-events-none" />
          </div>

          <div className="px-5">
            <div className="relative -mt-12 mb-3">
              <div className="w-24 h-24 rounded-full bg-white shadow-lg p-2 border-2 border-white flex items-center justify-center overflow-hidden">
                {selectedPartner.logo_url ? (
                  <img src={selectedPartner.logo_url} alt={selectedPartner.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-50 flex flex-col items-center justify-center text-center p-1">
                    <span className="text-[11px] font-black tracking-wider text-purple-900 uppercase">
                      {selectedPartner.name || 'Partner'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Title & Metadata */}
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              {selectedPartner.name}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-3">
              <MapPin size={14} className="text-slate-400" />
              <span>{selectedPartner.booth || 'Booth No. 8 | Hall No. 5'}</span>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              {selectedPartner.description || 'Welcome to our partner booth. We provide innovative enterprise technology, professional learning resources, and software tools.'}
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
                onClick={() => toast('No video streams currently active')}
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
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-[10px] font-semibold text-blue-700">
                            💻 Attending Virtually
                          </span>
                        </div>
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
                  <span className="font-semibold text-slate-800">{selectedPartner.contact_email || 'amanshrivastava@gmail.com'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span className="text-slate-400 font-medium w-12">Phone :</span>
                  <span className="font-semibold text-slate-800">{selectedPartner.phone || '+91 9828098280'}</span>
                </div>
              </div>
            </div>

            {/* Add Notes / Saved Notes Interactive Box */}
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
  // 2. MAIN PARTNERS LIST VIEW (Exact XD Prototype Grid)
  // ============================================================================
  return (
    <div className="min-h-screen bg-white pb-24 text-slate-900 select-none">
      {/* Top App Header */}
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
                {/* Bookmark Top-Right */}
                <button
                  onClick={(e) => toggleBookmark(partner.id, e)}
                  className="absolute top-2.5 right-2.5 text-slate-300 hover:text-slate-600"
                >
                  <Bookmark size={16} className={isBookmarked ? "fill-amber-500 text-amber-500" : "text-slate-300"} />
                </button>

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
    </div>
  );
}