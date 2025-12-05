import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, FunnelIcon, BookOpenIcon, HeartIcon, EyeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { storyApiService } from '../services/storyApiService';
import { useI18nStore } from '../stores/i18nStore';
import { API_BASE_URL } from '../config/constants';
import CustomDropdown, { DropdownOption } from '../components/common/CustomDropdown';

interface PublicStory {
  id: string;
  title: string;
  author_name: string;
  summary: string;
  category: string;
  genres: string[];  // Array of genre strings
  language: string;
  cover_image?: string;
  views: number;
  likes_count: number;
  average_rating: number;
  is_liked_by_user: boolean;
}

const PublicLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18nStore();
  
  const [stories, setStories] = useState<PublicStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Genre options matching backend CATEGORY_CHOICES
  const genres = [
    { value: '', label: 'All Genres' },
    { value: 'adventure', label: 'Adventure' },
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'mystery', label: 'Mystery' },
    { value: 'sci_fi', label: 'Science Fiction' },
    { value: 'fairy_tale', label: 'Fairy Tale' },
    { value: 'educational', label: 'Educational' },
    { value: 'animal', label: 'Animal Stories' },
    { value: 'other', label: 'Other' },
  ];

  const languages = [
    { value: '', label: 'All Languages' },
    { value: 'en', label: '🇺🇸 English' },
    { value: 'tl', label: '🇵🇭 Tagalog' },
  ];

  useEffect(() => {
    fetchStories();
  }, [selectedLanguage, selectedGenre, searchQuery]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      
      // Build query parameters - use 'public' not 'public=true'
      const params = new URLSearchParams();
      params.append('public', 'true');
      params.append('page_size', '100'); // Request more stories to show all
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (selectedLanguage) {
        params.append('language', selectedLanguage);
      }
      
      if (selectedGenre) {
        params.append('category', selectedGenre);
      }

      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/stories/?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      const fetchedStories = data.results || data.stories || data || [];
      setStories(fetchedStories);
    } catch (error) {
      console.error('Error fetching public stories:', error);
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStories();
  };

  const handleStoryClick = (storyId: string) => {
    navigate(`/story/${storyId}`);
  };

  const getCategoryLabel = (category: string) => {
    const genre = genres.find(g => g.value === category);
    return genre ? genre.label : category;
  };

  const getLanguageLabel = (lang: string) => {
    const language = languages.find(l => l.value === lang);
    return language ? language.label : lang;
  };

  return (
    <div className="public-library-page">
      {/* Header with Back Button */}
      <div className="public-library-header" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', 
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <button
          onClick={() => navigate(-1)}
          className="public-library-back-button"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            border: 'none',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            color: '#8b5cf6',
            fontSize: '18px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.color = '#7c3aed';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#8b5cf6';
          }}
          title="Go back"
        >
          <span>&lt;</span>
        </button>
        <div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            color: '#111827', 
            margin: '0' 
          }}>
            Public Library
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            margin: '4px 0 0 0' 
          }}>
            Discover stories from the community
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="public-library-search-section">
        <form onSubmit={handleSearch} className="public-library-search-form">
          <div className="public-library-search-input-wrapper">
            <MagnifyingGlassIcon className="public-library-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stories, authors..."
              className="public-library-search-input"
            />
          </div>
          
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="public-library-filter-btn"
          >
            <FunnelIcon className="w-5 h-5" />
            Filters
          </button>
        </form>

        {/* Filter Panel */}
        {showFilters && (
          <div className="public-library-filters">
            <div className="public-library-filter-group">
              <label className="public-library-filter-label">Language</label>
              <CustomDropdown
                key="language-dropdown"
                value={selectedLanguage}
                onChange={(value) => setSelectedLanguage(value)}
                options={languages}
                className="public-library-filter-select language-filter"
              />
            </div>

            <div className="public-library-filter-group">
              <label className="public-library-filter-label">Genre</label>
              <CustomDropdown
                key="genre-dropdown"
                value={selectedGenre}
                onChange={(value) => setSelectedGenre(value)}
                options={genres}
                className="public-library-filter-select genre-filter"
              />
            </div>

            <button
              onClick={() => {
                setSelectedLanguage('');
                setSelectedGenre('');
                setSearchQuery('');
              }}
              className="public-library-clear-filters-btn"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {(selectedLanguage || selectedGenre || searchQuery) && (
        <div className="public-library-active-filters">
          <span className="public-library-active-filters-label">Active filters:</span>
          {searchQuery && (
            <span className="public-library-filter-tag">
              Search: "{searchQuery}"
              <button onClick={() => setSearchQuery('')}>×</button>
            </span>
          )}
          {selectedLanguage && (
            <span className="public-library-filter-tag">
              {getLanguageLabel(selectedLanguage)}
              <button onClick={() => setSelectedLanguage('')}>×</button>
            </span>
          )}
          {selectedGenre && (
            <span className="public-library-filter-tag">
              {getCategoryLabel(selectedGenre)}
              <button onClick={() => setSelectedGenre('')}>×</button>
            </span>
          )}
        </div>
      )}

      {/* Stories Grid */}
      <div className="public-library-content">
        {loading ? (
          <div className="public-library-loading">
            <div className="public-library-spinner"></div>
            <p>Loading stories...</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="public-library-empty">
            <BookOpenIcon className="public-library-empty-icon" />
            <h3>No stories found</h3>
            <p>Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="public-library-grid">
            {stories.map((story) => (
              <div
                key={story.id}
                onClick={() => handleStoryClick(story.id)}
                className="public-library-card"
              >
                {/* Cover Image */}
                {story.cover_image ? (
                  <div className="public-library-card-cover">
                    <img 
                      src={story.cover_image} 
                      alt={story.title}
                      onError={(e) => {
                        // Fallback to letter placeholder if image fails to load
                        const placeholder = document.createElement('div');
                        placeholder.className = 'public-library-card-cover-placeholder';
                        placeholder.innerHTML = `<div style="font-size: 3rem; font-weight: 700; color: #a78bfa;">${story.title.charAt(0).toUpperCase()}</div>`;
                        e.currentTarget.parentElement!.replaceWith(placeholder);
                      }}
                    />
                  </div>
                ) : (
                  <div className="public-library-card-cover-placeholder">
                    <div style={{ fontSize: '3rem', fontWeight: 700, color: '#a78bfa' }}>
                      {story.title.charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}

                {/* Card Content */}
                <div className="public-library-card-content">
                  <h3 className="public-library-card-title">{story.title}</h3>

                  {/* Stats */}
                  <div className="public-library-card-stats">
                    <div className="public-library-stat">
                      <EyeIcon className="w-4 h-4" />
                      <span>{story.views || 0}</span>
                    </div>
                    <div className="public-library-stat">
                      <HeartIcon className="w-4 h-4" />
                      <span>{story.likes_count || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results Count */}
      {!loading && stories.length > 0 && (
        <div className="public-library-results-count">
          Showing {stories.length} {stories.length === 1 ? 'story' : 'stories'}
        </div>
      )}
    </div>
  );
};

export default PublicLibraryPage;
