import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../services/api';
import PartnerCard from '../components/Partners/PartnerCard';
import PartnerCategoryFilter from '../components/Partners/PartnerFilters';
import '../styles/partners.css';

export const PartnersPage = () => {
  const navigate = useNavigate();

  // ============= STATE MANAGEMENT =============
  const [partners, setPartners] = useState([]);
  const [filteredPartners, setFilteredPartners] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============= PARTNER CATEGORIES =============
  const categories = [
    { id: 'all', label: 'All Partners', icon: '🤝' },
    { id: 'premium', label: 'Premium', icon: '🎖️' },
    { id: 'platinum', label: 'Platinum', icon: '💎' },
    { id: 'gold', label: 'Gold', icon: '✨' },
    { id: 'silver', label: 'Silver', icon: '⭐' },
    { id: 'technology', label: 'Technology', icon: '💻' },
    { id: 'consulting', label: 'Consulting', icon: '📊' },
    { id: 'services', label: 'Services', icon: '🛠️' },
  ];

  // ============= FETCH REAL DATA =============
  useEffect(() => {
    loadPartnersData();
  }, []);

  const loadPartnersData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch partners from API
      const partnersData = await apiGet('/api/v1/partners');
      const allPartners = Array.isArray(partnersData) ? partnersData : [];
      
      setPartners(allPartners);
      setFilteredPartners(allPartners);

      // Calculate stats
      setStats({
        total_partners: allPartners.length,
        featured_partners: allPartners.filter(p => p.tier === 'platinum' || p.tier === 'gold').length,
        total_promotions: allPartners.filter(p => p.promotions && p.promotions.length > 0).length,
        total_interactions: allPartners.reduce((sum, p) => sum + (p.interaction_count || 0), 0)
      });
    } catch (err) {
      console.error('Failed to load partners:', err);
      setError('Unable to load partners. Please try again.');
      setPartners([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  // ============= HANDLE CATEGORY CHANGE =============
  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    applyFilters(categoryId, searchQuery);
  };

  // ============= HANDLE SEARCH =============
  const handleSearch = (query) => {
    setSearchQuery(query);
    applyFilters(activeCategory, query);
  };

  // ============= APPLY FILTERS =============
  const applyFilters = (categoryId, query) => {
    let filtered = partners;

    // Category filter
    if (categoryId !== 'all') {
      filtered = filtered.filter((p) => p.category === categoryId || p.tier === categoryId);
    }

    // Search filter
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(lowerQuery)) ||
          (p.tagline && p.tagline.toLowerCase().includes(lowerQuery)) ||
          (p.description && p.description.toLowerCase().includes(lowerQuery)) ||
          (p.services && p.services.some((s) => s.toLowerCase().includes(lowerQuery)))
      );
    }

    setFilteredPartners(filtered);
  };

  // ============= HANDLE VISIT WEBSITE =============
  const handleVisitWebsite = (partnerId) => {
    const partner = partners.find((p) => p.id === partnerId);
    if (partner?.website) {
      window.open(partner.website, '_blank');
    }
  };

  // ============= HANDLE INTERACTION =============
  const handleInteraction = async (partnerId, interactionType) => {
    try {
      await apiPost('/api/v1/partners/interactions', {
        partner_id: partnerId,
        interaction_type: interactionType
      });
      // Reload to update interaction count
      await loadPartnersData();
    } catch (err) {
      console.error('Failed to log interaction:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center py-20">
          <div className="border-t-blue-500 border-4 rounded-full w-12 h-12 animate-spin mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading partners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🤝 Partners & Sponsors
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore the organizations making EventAI possible
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
            ⚠️ {error}
            <button 
              onClick={loadPartnersData}
              className="ml-2 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Statistics Dashboard */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.total_partners}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Total Partners</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
              <p className="text-3xl font-bold text-purple-600">{stats.featured_partners}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Featured Sponsors</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.total_promotions}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Active Offers</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
              <p className="text-3xl font-bold text-orange-600">{stats.total_interactions}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Interactions</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <PartnerCategoryFilter 
          searchTerm={searchQuery}
          setSearchTerm={handleSearch}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          categories={categories}
        />

        {/* Info Banner */}
        <div className="bg-blue-900/40 border border-blue-500/30 rounded-xl p-4 flex gap-4 mb-8 mt-2">
          <div className="text-2xl">🏢</div>
          <div>
            <h3 className="text-white font-semibold text-lg">Connect with Industry Leaders</h3>
            <p className="text-blue-200 text-sm mt-1">
              Visit partner booths to learn about innovative HR solutions and special event offers
            </p>
          </div>
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.length > 0 ? (
            filteredPartners.map((partner) => (
              <PartnerCard
                key={partner.id}
                partner={{
                  id: partner.id,
                  name: partner.name || 'Partner',
                  type: partner.tier || 'Partner',
                  tagline: partner.tagline || '',
                  description: partner.description || '',
                  logo: partner.logo,
                  rating: partner.rating || 0,
                  services: partner.services || [],
                  features: partner.features || [],
                  boothLocation: partner.booth_location || 'TBA',
                  email: partner.email,
                  phone: partner.phone,
                  website: partner.website,
                  category: partner.category || 'other'
                }}
                onVisitWebsite={() => handleVisitWebsite(partner.id)}
                onInteract={(type) => handleInteraction(partner.id, type)}
              />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">No partners found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Partnership Tiers */}
        {filteredPartners.length > 0 && (
          <div className="mt-10 mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Partnership Tiers</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl text-center hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-2">💎</div>
                <p className="text-gray-900 dark:text-white font-semibold">Platinum</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Premier partners with exclusive benefits</p>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl text-center hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-2">✨</div>
                <p className="text-gray-900 dark:text-white font-semibold">Gold</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Premium partners with dedicated support</p>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl text-center hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-2">⭐</div>
                <p className="text-gray-900 dark:text-white font-semibold">Silver</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Supporting partners contributing value</p>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl text-center hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-2">🤝</div>
                <p className="text-gray-900 dark:text-white font-semibold">Specialist</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Category-specific partner expertise</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PartnersPage;