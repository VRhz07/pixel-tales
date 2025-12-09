import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  StarIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  HeartIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { storyApiService } from '../../services/storyApiService';
import { useAuthStore } from '../../stores/authStore';
import CustomDropdown, { DropdownOption } from '../common/CustomDropdown';


// Mock data for public stories (would come from API in real app)
const mockPublicStories = {
  featured: [
    {
      id: 'f1',
      title: "The Enchanted Garden",
      author: "Emma Rodriguez",
      description: "A magical journey through a garden where flowers hold ancient secrets and every petal tells a story.",
      rating: 4.8,
      downloads: 1200,
      likes: 340,
      tags: ["Fantasy", "Magic", "Adventure"],
      coverImage: null,
      publishedAt: new Date('2024-01-15'),
      pages: 45,
      wordCount: 12500
    },
    {
      id: 'f2',
      title: "Superhero Academy Chronicles",
      author: "Alex Chen",
      description: "Follow young heroes as they navigate friendship, powers, and the responsibility that comes with greatness.",
      rating: 4.9,
      downloads: 2100,
      likes: 580,
      tags: ["Superhero", "Friendship", "Coming of Age"],
      coverImage: null,
      publishedAt: new Date('2024-01-20'),
      pages: 72,
      wordCount: 18900
    },
    {
      id: 'f3',
      title: "The Time Keeper's Daughter",
      author: "Sarah Kim",
      description: "When time itself begins to unravel, a young girl must master her inherited powers to save reality.",
      rating: 4.7,
      downloads: 890,
      likes: 267,
      tags: ["Time Travel", "Family", "Mystery"],
      coverImage: null,
      publishedAt: new Date('2024-01-10'),
      pages: 63,
      wordCount: 16200
    }
  ],
  new: [
    {
      id: 'n1',
      title: "Digital Dreams",
      author: "Marcus Thompson",
      description: "In a world where dreams can be digitized, a young programmer discovers a conspiracy that threatens reality itself.",
      rating: 4.5,
      downloads: 156,
      likes: 42,
      tags: ["Sci-Fi", "Technology", "Thriller"],
      coverImage: null,
      publishedAt: new Date('2024-01-25'),
      pages: 28,
      wordCount: 7800
    },
    {
      id: 'n2',
      title: "The Last Library",
      author: "Diana Foster",
      description: "In a post-apocalyptic world, the last librarian guards humanity's knowledge against those who would destroy it.",
      rating: 4.6,
      downloads: 203,
      likes: 67,
      tags: ["Post-Apocalyptic", "Knowledge", "Hope"],
      coverImage: null,
      publishedAt: new Date('2024-01-23'),
      pages: 38,
      wordCount: 9500
    },
    {
      id: 'n3',
      title: "Moonlight Mysteries",
      author: "James Wilson",
      description: "A detective with the ability to see the past must solve murders that only happen under the full moon.",
      rating: 4.4,
      downloads: 178,
      likes: 55,
      tags: ["Mystery", "Supernatural", "Detective"],
      coverImage: null,
      publishedAt: new Date('2024-01-22'),
      pages: 42,
      wordCount: 11200
    }
  ],
  top: [
    {
      id: 't1',
      title: "Chronicles of the Crystal Realm",
      author: "Isabella Garcia",
      description: "An epic fantasy saga spanning multiple kingdoms where crystals hold the power of creation and destruction.",
      rating: 4.9,
      downloads: 3400,
      likes: 890,
      tags: ["Epic Fantasy", "Crystals", "Kingdoms"],
      coverImage: null,
      publishedAt: new Date('2023-12-01'),
      pages: 156,
      wordCount: 42000
    },
    {
      id: 't2',
      title: "The Starship Navigator",
      author: "Captain Nova",
      description: "Journey across the galaxy with the most skilled navigator in the universe as she discovers ancient alien secrets.",
      rating: 4.8,
      downloads: 2890,
      likes: 734,
      tags: ["Space Opera", "Aliens", "Adventure"],
      coverImage: null,
      publishedAt: new Date('2023-11-15'),
      pages: 89,
      wordCount: 24500
    },
    {
      id: 't3',
      title: "Hearts in Harmony",
      author: "Luna Martinez",
      description: "A beautiful romance between two musicians who find love through their shared passion for creating magic with music.",
      rating: 4.7,
      downloads: 2156,
      likes: 612,
      tags: ["Romance", "Music", "Love"],
      coverImage: null,
      publishedAt: new Date('2023-12-10'),
      pages: 67,
      wordCount: 18300
    }
  ]
};

const PublicLibraryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
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
    { value: 'action', label: 'Action' },
    { value: 'friendship', label: 'Friendship' },
    { value: 'scifi', label: 'Sci-Fi' },
    { value: 'comedy', label: 'Comedy' },
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
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [showAllTopRated, setShowAllTopRated] = useState(false);
  const [publishedStories, setPublishedStories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recommendedStories, setRecommendedStories] = useState<any[]>([]);

  // Load published stories from backend
  useEffect(() => {
    loadPublishedStories();
    
    // Set up interval to refresh published stories every 30 seconds
    const refreshInterval = setInterval(() => {
      loadPublishedStories();
    }, 30000); // Refresh every 30 seconds
    
    // Listen for story unpublish events
    const handleStoryUnpublished = () => {
      console.log('📢 Story unpublished event received - refreshing public library');
      loadPublishedStories();
    };
    
    window.addEventListener('story-unpublished', handleStoryUnpublished);
    
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('story-unpublished', handleStoryUnpublished);
    };
  }, []);


  const loadPublishedStories = async () => {
    setIsLoading(true);
    try {
      const stories = await storyApiService.getPublishedStories();
      setPublishedStories(stories);
      
      // Set recommended stories (top liked stories) when no filters active
      if (!searchQuery && !selectedLanguage && !selectedGenre) {
        const recommended = [...stories]
          .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
          .slice(0, 6);
        setRecommendedStories(recommended);
      }
    } catch (error) {
      console.error('Error loading published stories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get available genres from published stories
  const getAvailableGenres = () => {
    const genreSet = new Set<string>();
    publishedStories.forEach((story: any) => {
      if (story.genres && Array.isArray(story.genres)) {
        story.genres.forEach((genre: string) => genreSet.add(genre.toLowerCase()));
      }
    });
    
    // Filter genres to only show those that have stories
    const availableGenres = genres.filter(genre => 
      genre.value === '' || genreSet.has(genre.value.toLowerCase())
    );
    
    return availableGenres;
  };

  // Combine all stories from different categories
  const allStories = publishedStories.map(story => {
    // Try to extract cover image from canvas data
    let coverImage = story.cover_image;
    if (!coverImage && story.canvas_data) {
      try {
        const canvasPages = JSON.parse(story.canvas_data);
        if (canvasPages && canvasPages.length > 0) {
          // Look for cover with order: -1 first
          const coverPage = canvasPages.find((p: any) => p.order === -1 || p.id === 'cover');
          if (coverPage && coverPage.canvasData) {
            coverImage = coverPage.canvasData;
          } else if (canvasPages[0].canvasData) {
            // Fallback to first page if no dedicated cover
            coverImage = canvasPages[0].canvasData;
          }
        }
      } catch (e) {
        console.warn('Failed to parse canvas data for cover:', e);
      }
    }
    
    return {
      id: story.id.toString(),
      title: story.title,
      author: story.is_collaborative && story.authors_names && story.authors_names.length > 0 
        ? story.authors_names.join(', ') 
        : (story.author_name || 'Anonymous'),
      description: story.summary || '',
      rating: story.average_rating || 0,
      downloads: story.downloads || 0,
      likes: story.likes_count || 0,
      tags: story.genres || [],
      language: story.language || 'en',
      coverImage: coverImage || null,
      publishedAt: new Date(story.date_created),
      pages: 0, // Backend doesn't return page count in list view
      wordCount: (story.content || '').split(/\s+/).filter((w: string) => w.length > 0).length
    };
  });

  const featuredStories = mockPublicStories.featured;
  const newStories = [...allStories].sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  const mostPopularStories = [...allStories].sort((a, b) => b.likes - a.likes);

  // Get stories for carousels (limited items)
  const recentCarouselStories = newStories.slice(0, 8);
  const mostPopularCarouselStories = mostPopularStories.slice(0, 8);

  // Get all published stories (filtered by search, language, and genre)
  const getAllPublishedStories = () => {
    let stories = [...allStories];
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      stories = stories.filter((story: any) => 
        story.title.toLowerCase().includes(query) ||
        story.author.toLowerCase().includes(query) ||
        story.description.toLowerCase().includes(query) ||
        (story.tags && story.tags.some((tag: string) => tag.toLowerCase().includes(query)))
      );
    }
    
    // Filter by language
    if (selectedLanguage) {
      stories = stories.filter((story: any) => story.language === selectedLanguage);
    }
    
    // Filter by genre - check if any of the story's genres match the selected genre
    if (selectedGenre) {
      stories = stories.filter((story: any) => 
        story.tags && story.tags.some((tag: string) => tag.toLowerCase() === selectedGenre.toLowerCase())
      );
    }
    
    return stories;
  };

  const allPublishedStories = getAllPublishedStories();

  const handleStoryClick = (storyId: string) => {
    navigate(`/story/${storyId}`, { state: { from: '/library' } });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="library-page-content">
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📚</div>
          <p>Loading published stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="library-page-content">
      {/* Header */}
      <div className="library-header">
        <div className="library-header-content">
          <h1 className="library-title">Public Library</h1>
          <p className="library-subtitle">Discover amazing stories from our community</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="library-search-section">
        <div className="library-search">
          <div>
            <MagnifyingGlassIcon />
            <input
              type="text"
              placeholder="Search stories, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="library-search-input"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="library-filter-btn"
          >
            <FunnelIcon className="h-4 w-4" />
            Filters
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="library-filters">
            <div className="library-filter-group">
              <label className="library-filter-label">Language</label>
              <CustomDropdown
                value={selectedLanguage}
                onChange={(value) => setSelectedLanguage(value)}
                options={languages}
                className="library-filter-select"
              />
            </div>

            <div className="library-filter-group">
              <label className="library-filter-label">Genre</label>
              <CustomDropdown
                value={selectedGenre}
                onChange={(value) => setSelectedGenre(value)}
                options={genres}
                className="library-filter-select"
              />
            </div>

            <button
              onClick={() => {
                setSelectedLanguage('');
                setSelectedGenre('');
                setSearchQuery('');
              }}
              className="library-clear-filters-btn"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Active Filters Display */}
        {(selectedLanguage || selectedGenre || searchQuery) && (
          <div className="library-active-filters">
            <span className="library-active-filters-label">Active filters:</span>
            {searchQuery && (
              <span className="library-filter-tag">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery('')}>×</button>
              </span>
            )}
            {selectedLanguage && (
              <span className="library-filter-tag">
                {languages.find(l => l.value === selectedLanguage)?.label}
                <button onClick={() => setSelectedLanguage('')}>×</button>
              </span>
            )}
            {selectedGenre && (
              <span className="library-filter-tag">
                {genres.find(g => g.value === selectedGenre)?.label}
                <button onClick={() => setSelectedGenre('')}>×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Show carousels only when no filters are active */}
      {!searchQuery && !selectedLanguage && !selectedGenre ? (
        <>
          {/* Recommendations Section */}
          {recommendedStories.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h2 className="dark:text-white" style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                color: '#111827', 
                marginBottom: '16px' 
              }}>
                Recommendations
              </h2>
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                overflowX: 'auto', 
                paddingBottom: '8px',
                scrollbarWidth: 'thin'
              }}>
                {recommendedStories.map((story) => (
                  <div
                    key={story.id}
                    onClick={() => handleStoryClick(story.id.toString())}
                    style={{
                      minWidth: '140px',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <div style={{
                      width: '140px',
                      height: '200px',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      position: 'relative',
                      backgroundColor: '#f3f4f6',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
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
                      {/* Title and Chapter badge overlay */}
                      <div style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '0',
                        right: '0',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
                        padding: '40px 12px 12px 12px'
                      }}>
                        <h3 style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          color: 'white',
                          margin: '0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                        }}>
                          {story.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories Section */}
          <div style={{ marginBottom: '24px' }}>
            <h2 className="dark:text-white" style={{ 
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
              {getAvailableGenres().map((genre) => {
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

          {/* Large Story Cards Grid - Always show below categories */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '16px',
            marginBottom: '32px'
          }}>
            {allPublishedStories.slice(0, 8).map((story) => (
              <div
                key={story.id}
                onClick={() => handleStoryClick(story.id)}
                className="bg-white dark:bg-gray-800 shadow-lg"
                style={{
                  cursor: 'pointer',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{
                  width: '100%',
                  height: '200px',
                  overflow: 'hidden',
                  backgroundColor: '#f3f4f6',
                }}>
                  {story.coverImage ? (
                    <img 
                      src={story.coverImage} 
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
                </div>
                <div style={{ padding: '12px' }}>
                  <h3 className="dark:text-white" style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 4px 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {story.title}
                  </h3>
                  <p className="dark:text-gray-400" style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: '0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    by {story.author}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Stories Carousel */}
          <div className="library-carousel-section" style={{ display: 'none' }}>
        <div className="library-carousel-header">
          <h2 className="library-carousel-title">Recent Stories</h2>
          <button 
            className="library-carousel-more-button"
            onClick={() => navigate('/public-library')}
          >
            View All →
          </button>
        </div>
        <div className="library-carousel">
          <div className="library-carousel-track">
            {recentCarouselStories.map((story) => (
              <div 
                key={story.id} 
                className="library-carousel-card"
                onClick={() => handleStoryClick(story.id)}
              >
                <div className="library-story-cover">
                  {story.coverImage ? (
                    <img 
                      src={story.coverImage} 
                      alt={story.title}
                      className="library-story-image"
                    />
                  ) : (
                    <div className="library-story-placeholder">
                      <BookOpenIcon className="library-story-placeholder-icon" />
                    </div>
                  )}
                </div>
                <div className="library-story-content">
                  <h3 className="library-story-title">
                    <span className="library-story-title-inner">{story.title}</span>
                  </h3>
                  <p className="library-story-author">by {story.author}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Most Popular Stories Carousel - Hidden */}
      <div className="library-carousel-section" style={{ display: 'none' }}>
        <div className="library-carousel-header">
          <h2 className="library-carousel-title">Most Popular Stories</h2>
          <button 
            className="library-carousel-more-button"
            onClick={() => navigate('/public-library')}
          >
            View All →
          </button>
        </div>
        <div className="library-carousel">
          <div className="library-carousel-track">
            {mostPopularCarouselStories.map((story) => (
              <div 
                key={story.id} 
                className="library-carousel-card"
                onClick={() => handleStoryClick(story.id)}
              >
                <div className="library-story-cover">
                  {story.coverImage ? (
                    <img 
                      src={story.coverImage} 
                      alt={story.title}
                      className="library-story-image"
                    />
                  ) : (
                    <div className="library-story-placeholder">
                      <BookOpenIcon className="library-story-placeholder-icon" />
                    </div>
                  )}
                </div>
                <div className="library-story-content">
                  <h3 className="library-story-title">
                    <span className="library-story-title-inner">{story.title}</span>
                  </h3>
                  <p className="library-story-author">by {story.author}</p>
                  <div className="library-story-rating">
                    <HeartIcon className="h-3 w-3" />
                    <span>{story.likes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        </>
      ) : (
        /* Show filtered results when filters are active */
        <div className="library-filtered-results">
          <h2 className="library-section-title">
            Search Results ({allPublishedStories.length})
          </h2>
          
          {allPublishedStories.length === 0 ? (
            <div className="library-empty-state">
              <BookOpenIcon className="library-empty-icon" />
              <h3 className="library-empty-title">No stories found</h3>
              <p className="library-empty-description">
                Try adjusting your search terms or filters
              </p>
            </div>
          ) : (
            <div className="library-stories-grid">
              {allPublishedStories.map((story) => (
                <div 
                  key={story.id} 
                  className="library-story-card"
                  onClick={() => handleStoryClick(story.id)}
                >
                  <div className="library-story-cover">
                    {story.coverImage ? (
                      <img 
                        src={story.coverImage} 
                        alt={story.title}
                        className="library-story-image"
                      />
                    ) : (
                      <div className="library-story-placeholder">
                        <BookOpenIcon className="library-story-placeholder-icon" />
                      </div>
                    )}
                  </div>
                  <div className="library-story-content">
                    <h3 className="library-story-title">{story.title}</h3>
                    
                    {/* Stats */}
                    <div className="library-story-stats">
                      <div className="library-story-stat">
                        <EyeIcon className="library-story-stat-icon" />
                        <span>0</span>
                      </div>
                      <div className="library-story-stat">
                        <HeartIcon className="library-story-stat-icon" />
                        <span>0</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default PublicLibraryPage;
