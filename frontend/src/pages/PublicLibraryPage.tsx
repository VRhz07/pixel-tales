import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, FunnelIcon, BookOpenIcon, HeartIcon, EyeIcon, ArrowLeftIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { storyApiService } from '../services/storyApiService';
import { useI18nStore } from '../stores/i18nStore';
import { API_BASE_URL } from '../config/constants';
import CustomDropdown, { DropdownOption } from '../components/common/CustomDropdown';

interface PublicStory {
  id: string;
  title: string;
  author_name: string;
  author_id?: string;
  summary: string;
  category: string;
  genres: string[];  // Array of genre strings
  language: string;
  cover_image?: string;
  views: number;
  likes_count: number;
  average_rating: number;
  is_liked_by_user: boolean;
  pages_count?: number;
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
  const [recommendedStories, setRecommendedStories] = useState<PublicStory[]>([]);

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
      
      // Set recommended stories (top liked stories)
      if (!searchQuery && !selectedLanguage && !selectedGenre) {
        const recommended = [...fetchedStories]
          .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
          .slice(0, 6);
        setRecommendedStories(recommended);
      }
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
    <div className="public-library-page" style={{ padding: '20px', paddingBottom: '80px', maxWidth: '100%', margin: '0 auto' }}>
      {/* Header with Back Button */}
      <div className="public-library-header" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', 
        marginBottom: '24px',
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

      {/* Show default layout when no filters active */}
      {!searchQuery && !selectedLanguage && !selectedGenre ? (
        <>
          {/* Recommendations Section */}
          {recommendedStories.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <style>
                {`
                  #recommendations-carousel::-webkit-scrollbar {
                    height: 6px;
                  }
                  #recommendations-carousel::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 3px;
                  }
                  
                  /* Remove all outlines and borders */
                  #recommendations-carousel *,
                  #recommendations-carousel *:focus,
                  #recommendations-carousel *:focus-visible,
                  #recommendations-carousel *:focus-within,
                  #recommendations-carousel *:active {
                    outline: none !important;
                    outline-width: 0 !important;
                    outline-style: none !important;
                  }
                  
                  /* Force all children to full opacity */
                  .recommendation-card,
                  .recommendation-card *,
                  .recommendation-card-inner,
                  .recommendation-card-inner * {
                    opacity: 1 !important;
                    filter: none !important;
                    outline: none !important;
                    border: none !important;
                  }
                  
                  /* Override any focus/active states */
                  .recommendation-card:focus,
                  .recommendation-card:focus-visible,
                  .recommendation-card:focus-within,
                  .recommendation-card:active,
                  .recommendation-card-inner:focus,
                  .recommendation-card-inner:focus-visible,
                  .recommendation-card-inner:active {
                    outline: none !important;
                    border: none !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
                    opacity: 1 !important;
                    filter: none !important;
                  }
                  
                  /* Remove any webkit/browser default styles */
                  .recommendation-card-inner {
                    -webkit-tap-highlight-color: transparent !important;
                  }
                `}
              </style>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  color: '#111827', 
                  margin: '0'
                }}>
                  Recommendations
                </h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const container = document.getElementById('recommendations-carousel');
                      if (container) {
                        container.scrollBy({ left: -300, behavior: 'smooth' });
                        // Remove focus from any child elements
                        setTimeout(() => {
                          const focused = container.querySelector(':focus') as HTMLElement;
                          if (focused) focused.blur();
                          if (document.activeElement) (document.activeElement as HTMLElement).blur();
                        }, 50);
                      }
                    }}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: '2px solid #6366f1',
                      backgroundColor: 'white',
                      color: '#6366f1',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#6366f1';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = '#6366f1';
                    }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const container = document.getElementById('recommendations-carousel');
                      if (container) {
                        container.scrollBy({ left: 300, behavior: 'smooth' });
                        // Remove focus from any child elements
                        setTimeout(() => {
                          const focused = container.querySelector(':focus') as HTMLElement;
                          if (focused) focused.blur();
                          if (document.activeElement) (document.activeElement as HTMLElement).blur();
                        }, 50);
                      }
                    }}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: '2px solid #6366f1',
                      backgroundColor: 'white',
                      color: '#6366f1',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#6366f1';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = '#6366f1';
                    }}
                  >
                    ›
                  </button>
                </div>
              </div>
              <div 
                id="recommendations-carousel"
                style={{ 
                  display: 'flex', 
                  gap: '16px', 
                  overflowX: 'auto', 
                  paddingBottom: '8px',
                  scrollbarWidth: 'thin',
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch',
                  userSelect: 'none',
                  WebkitUserSelect: 'none'
                }}
                onMouseDown={(e) => e.preventDefault()}
              >
                {recommendedStories.map((story) => (
                  <div
                    key={story.id}
                    className="recommendation-card"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleStoryClick(story.id);
                    }}
                    style={{
                      minWidth: '140px',
                      cursor: 'pointer',
                      transition: 'none',
                      flexShrink: 0,
                      outline: 'none',
                      border: 'none',
                      boxShadow: 'none',
                      opacity: 1,
                      filter: 'none',
                      pointerEvents: 'auto'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.transition = 'transform 0.2s ease';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.transition = 'transform 0.2s ease';
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.border = 'none';
                    }}
                    tabIndex={-1}
                  >
                    <div 
                      className="recommendation-card-inner"
                      style={{
                        width: '140px',
                        height: '200px',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        position: 'relative',
                        backgroundColor: '#f3f4f6',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        outline: '0',
                        border: '0',
                        borderWidth: '0',
                        borderStyle: 'none',
                        borderColor: 'transparent'
                      }}>
                      {story.cover_image ? (
                        <img 
                          src={story.cover_image} 
                          alt={story.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          fontSize: '48px',
                          fontWeight: '700'
                        }}>
                          {story.title.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {/* Chapter count badge */}
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <h3 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#111827',
                        margin: '0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {story.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Categories Section */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '700', 
              color: '#111827', 
              marginBottom: '16px' 
            }}>
              Categories
            </h2>
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              overflowX: 'auto',
              paddingBottom: '12px',
              scrollbarWidth: 'thin'
            }}>
              {genres.map((genre) => {
                const isSelected = selectedGenre === genre.value;
                const isDark = document.documentElement.classList.contains('dark');
                
                return (
                  <button
                    key={genre.value}
                    onClick={() => setSelectedGenre(genre.value)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '24px',
                      border: 'none',
                      backgroundColor: isSelected ? '#9333ea' : (isDark ? '#2a2435' : '#f3f4f6'),
                      color: isSelected ? '#ffffff' : (isDark ? '#d1d5db' : '#374151'),
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 10px 25px rgba(147, 51, 234, 0.5)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = isDark ? '#3a3445' : '#e5e7eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = isDark ? '#2a2435' : '#f3f4f6';
                      }
                    }}
                  >
                    {genre.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}

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

      {/* Stories Grid - Show when filters are active OR after categories */}
      {(searchQuery || selectedLanguage || selectedGenre) && (
        <div style={{ marginTop: '24px' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '700', 
            color: '#111827', 
            marginBottom: '16px' 
          }}>
            {selectedGenre ? getCategoryLabel(selectedGenre) : 'Search Results'}
          </h2>
        </div>
      )}
      
      <div className="public-library-content">
        {loading ? (
          <div className="public-library-loading" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px',
            color: '#9ca3af'
          }}>
            <div className="public-library-spinner" style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f4f6',
              borderTop: '4px solid #8b5cf6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ marginTop: '16px', fontSize: '14px' }}>Loading stories...</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="public-library-empty" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px',
            color: '#9ca3af',
            textAlign: 'center'
          }}>
            <BookOpenIcon style={{ width: '64px', height: '64px', marginBottom: '16px', color: '#d1d5db' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#4b5563', marginBottom: '8px' }}>No stories found</h3>
            <p style={{ fontSize: '14px', color: '#9ca3af' }}>Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '16px',
            marginTop: '16px'
          }}>
            {stories.map((story) => (
              <div
                key={story.id}
                onClick={() => handleStoryClick(story.id)}
                style={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {/* Cover Image */}
                <div style={{
                  width: '100%',
                  aspectRatio: '3/4',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  backgroundColor: '#f3f4f6',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  marginBottom: '8px'
                }}>
                  {story.cover_image ? (
                    <img 
                      src={story.cover_image} 
                      alt={story.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                        const placeholder = document.createElement('div');
                        placeholder.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 48px; font-weight: 700;';
                        placeholder.textContent = story.title.charAt(0).toUpperCase();
                        target.parentElement?.appendChild(placeholder);
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontSize: '48px',
                      fontWeight: '700'
                    }}>
                      {story.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 4px 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {story.title}
                  </h3>
                  <p style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    margin: '0 0 8px 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    by {story.author_name}
                  </p>

                  {/* Stats */}
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <EyeIcon style={{ width: '14px', height: '14px' }} />
                      <span>{story.views || 0}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <HeartIcon style={{ width: '14px', height: '14px' }} />
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
      {!loading && stories.length > 0 && (searchQuery || selectedLanguage || selectedGenre) && (
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          padding: '16px',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          Showing {stories.length} {stories.length === 1 ? 'story' : 'stories'}
        </div>
      )}
    </div>
  );
};

export default PublicLibraryPage;
