import React, { useEffect, useState } from 'react';
import { Globe, MapPin, Users, Award, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../../components/layout/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const PartnersScreen = () => {
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState([]);
  const [filteredPartners, setFilteredPartners] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [categories, setCategories] = useState([]);
  const [tiers, setTiers] = useState([]);

  useEffect(() => {
    loadPartners();
  }, [selectedCategory, selectedTier]);

  const loadPartners = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 50,
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedTier && { tier: selectedTier })
      };

      const response = await apiClient.get('/partners', { params });
      const rawData = response?.data;
      const data = Array.isArray(rawData)
        ? rawData
        : rawData?.data || rawData?.partners || [];

      setPartners(data);
      setFilteredPartners(data);

      const uniqueCategories = [...new Set(data.map((p) => p.category).filter(Boolean))];
      const uniqueTiers = [...new Set(data.map((p) => p.tier).filter(Boolean))];

      setCategories(uniqueCategories);
      setTiers(uniqueTiers);
    } catch (error) {
      console.error('Error loading partners:', error);
      toast.error('Failed to load partners');
      setPartners([]);
      setFilteredPartners([]);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'platinum':
        return 'bg-cyan-100 text-cyan-900 border-cyan-300';
      case 'gold':
        return 'bg-yellow-100 text-yellow-900 border-yellow-300';
      case 'silver':
        return 'bg-gray-100 text-gray-900 border-gray-300';
      case 'bronze':
        return 'bg-orange-100 text-orange-900 border-orange-300';
      default:
        return 'bg-neutral-100 text-neutral-900 border-neutral-300';
    }
  };

  if (loading) {
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(Header, null),
      React.createElement(LoadingSpinner, { fullScreen: true }),
    );
  }

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Header, null),
    React.createElement(
      'main',
      { className: 'pb-20 md:pb-0' },
      React.createElement(
        'div',
        { className: 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white' },
        React.createElement(
          'div',
          { className: 'container-max py-8' },
          React.createElement('h1', { className: 'text-3xl md:text-4xl font-bold mb-2' }, 'Partners & Sponsors'),
          React.createElement('p', { className: 'text-white/80' }, 'Meet the organizations powering this event')
        )
      ),
      React.createElement(
        'div',
        { className: 'container-max py-8' },
        React.createElement(
          'div',
          { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-8' },
          categories.length > 0 &&
            React.createElement(
              'div',
              null,
              React.createElement('label', { className: 'block text-sm font-medium text-neutral-700 mb-2' }, 'Category'),
              React.createElement(
                'select',
                {
                  value: selectedCategory,
                  onChange: (e) => setSelectedCategory(e.target.value),
                  className: 'w-full p-2 border border-neutral-300 rounded-lg bg-white'
                },
                React.createElement('option', { value: '' }, 'All Categories'),
                categories.map((cat) =>
                  React.createElement('option', { key: cat, value: cat }, cat)
                )
              )
            ),
          tiers.length > 0 &&
            React.createElement(
              'div',
              null,
              React.createElement('label', { className: 'block text-sm font-medium text-neutral-700 mb-2' }, 'Sponsorship Tier'),
              React.createElement(
                'select',
                {
                  value: selectedTier,
                  onChange: (e) => setSelectedTier(e.target.value),
                  className: 'w-full p-2 border border-neutral-300 rounded-lg bg-white'
                },
                React.createElement('option', { value: '' }, 'All Tiers'),
                tiers.map((tier) =>
                  React.createElement('option', { key: tier, value: tier }, tier)
                )
              )
            )
        ),
        filteredPartners.length > 0
          ? React.createElement(
              'div',
              { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
              filteredPartners.map((partner) =>
                React.createElement(
                  'div',
                  {
                    key: partner.id,
                    className: 'bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-lg transition-all hover:scale-105 active:scale-100'
                  },
                  React.createElement(
                    'div',
                    { className: 'h-40 bg-neutral-100 flex items-center justify-center p-6 border-b border-neutral-200' },
                    partner.logo_url
                      ? React.createElement('img', {
                          src: partner.logo_url,
                          alt: partner.name,
                          className: 'max-h-full max-w-full object-contain'
                        })
                      : React.createElement(
                          'div',
                          { className: 'text-center' },
                          React.createElement(Award, { className: 'w-10 h-10 text-neutral-400 mx-auto mb-2' }),
                          React.createElement('p', { className: 'text-xs text-neutral-600' }, partner.name)
                        )
                  ),
                  React.createElement(
                    'div',
                    { className: 'p-6' },
                    React.createElement('h3', { className: 'text-lg font-bold text-neutral-900 mb-2' }, partner.name),
                    partner.tier &&
                      React.createElement(
                        'div',
                        { className: 'mb-4' },
                        React.createElement(
                          'span',
                          { className: `inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getTierColor(partner.tier)}` },
                          partner.tier
                        )
                      ),
                    React.createElement('p', { className: 'text-sm text-neutral-600 mb-4 line-clamp-2' }, partner.description),
                    React.createElement(
                      'div',
                      { className: 'space-y-2 mb-6 text-sm' },
                      partner.industry &&
                        React.createElement(
                          'div',
                          { className: 'flex items-center gap-2 text-neutral-700' },
                          React.createElement(Globe, { className: 'w-4 h-4 text-primary-600 flex-shrink-0' }),
                          React.createElement('span', null, partner.industry)
                        ),
                      partner.location &&
                        React.createElement(
                          'div',
                          { className: 'flex items-center gap-2 text-neutral-700' },
                          React.createElement(MapPin, { className: 'w-4 h-4 text-primary-600 flex-shrink-0' }),
                          React.createElement('span', null, partner.location)
                        ),
                      partner.employees &&
                        React.createElement(
                          'div',
                          { className: 'flex items-center gap-2 text-neutral-700' },
                          React.createElement(Users, { className: 'w-4 h-4 text-primary-600 flex-shrink-0' }),
                          React.createElement('span', null, `${partner.employees} employees`)
                        )
                    ),
                    React.createElement(
                      'div',
                      { className: 'space-y-2 pt-4 border-t border-neutral-200' },
                      partner.website_url &&
                        React.createElement(
                          'a',
                          {
                            href: partner.website_url,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            className: 'block w-full btn btn-outline btn-sm flex items-center justify-center gap-2'
                          },
                          React.createElement(Globe, { className: 'w-4 h-4' }),
                          'Visit Website'
                        ),
                      React.createElement(
                        'button',
                        { className: 'w-full btn btn-primary btn-sm flex items-center justify-center gap-2' },
                        React.createElement(ArrowRight, { className: 'w-4 h-4' }),
                        'Learn More'
                      )
                    )
                  )
                )
              )
            )
          : React.createElement(
              'div',
              { className: 'bg-neutral-50 rounded-lg border border-neutral-200 p-12 text-center' },
              React.createElement(Award, { className: 'w-12 h-12 text-neutral-400 mx-auto mb-4 opacity-50' }),
              React.createElement('p', { className: 'text-neutral-600 mb-4' }, 'No partners found'),
              React.createElement(
                'button',
                {
                  onClick: () => {
                    setSelectedCategory('');
                    setSelectedTier('');
                  },
                  className: 'btn btn-primary'
                },
                'View All Partners'
              )
            )
      )
    ),
  );
};

export default PartnersScreen;