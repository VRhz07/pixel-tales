import React, { useState, useMemo } from 'react';
import { ArrowLeftIcon, MagnifyingGlassIcon, FunnelIcon, ChevronDownIcon, CheckIcon, StarIcon, ArrowDownTrayIcon, HeartIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface OnlineStory {
  id: string;
  title: string;
  author: string;
  description: string;
  genre: 'fantasy' | 'adventure' | 'sciFi' | 'comedy' | 'mystery' | 'action' | 'friendship' | 'educational';
  ageRange: '3-6' | '5-8' | '8-12';
  rating: number;
  downloads: number;
  likes: number;
  readingTime: number; // in minutes
  isPopular?: boolean;
  publishedDate: string;
}

const mockStories: OnlineStory[] = [
  {
    id: '1',
    title: 'The Enchanted Garden',
    author: 'Emma Watson',
    description: 'A magical garden where flowers sing and butterflies paint rainbows...',
    genre: 'fantasy',
    ageRange: '5-8',
    rating: 4.8,
    downloads: 1560,
    likes: 234,
    readingTime: 10,
    isPopular: true,
    publishedDate: '2024-01-15'
  },
  {
    id: '2',
    title: 'Superhero School',
    author: 'Alex Thompson',
    description: 'Join Tommy as he discovers his superpowers at the mysterious academy...',
    genre: 'adventure',
    ageRange: '8-12',
    rating: 4.9,
    downloads: 2030,
    likes: 456,
    readingTime: 15,
    isPopular: true,
    publishedDate: '2024-02-01'
  },
  {
    id: '3',
    title: 'Underwater Kingdom',
    author: 'Sofia Martinez',
    description: 'Dive deep into the ocean where mermaids and dolphins live together...',
    genre: 'fantasy',
    ageRange: '5-8',
    rating: 4.6,
    downloads: 890,
    likes: 178,
    readingTime: 12,
    publishedDate: '2024-01-28'
  },
  {
    id: '4',
    title: 'Robot Friends Forever',
    author: 'Michael Chen',
    description: 'When robots learn about friendship, amazing adventures begin...',
    genre: 'sciFi',
    ageRange: '8-12',
    rating: 4.7,
    downloads: 1245,
    likes: 312,
    readingTime: 18,
    publishedDate: '2024-02-10'
  },
  {
    id: '5',
    title: 'The Giggling Monsters',
    author: 'Lucy Brown',
    description: 'Meet the friendliest monsters who love to laugh and play games...',
    genre: 'comedy',
    ageRange: '3-6',
    rating: 4.5,
    downloads: 756,
    likes: 145,
    readingTime: 8,
    publishedDate: '2024-01-20'
  },
  {
    id: '6',
    title: 'Mystery of the Lost Treasure',
    author: 'David Wilson',
    description: 'Follow the clues to find the ancient treasure hidden in the castle...',
    genre: 'mystery',
    ageRange: '8-12',
    rating: 4.4,
    downloads: 1123,
    likes: 267,
    readingTime: 20,
    publishedDate: '2024-02-05'
  }
];

const genreOptions = ['All', 'Fantasy', 'Adventure', 'Mystery', 'Action', 'Friendship', 'Sci-Fi', 'Comedy', 'Educational'];
const sortByOptions = ['Most Popular', 'Highest Rated', 'Newest', 'Most Downloaded'];

const genreMap: Record<string, string> = {
  'Fantasy': 'fantasy',
  'Adventure': 'adventure',
  'Mystery': 'mystery',
  'Action': 'action',
  'Friendship': 'friendship',
  'Sci-Fi': 'sciFi',
  'Comedy': 'comedy',
  'Educational': 'educational'
};

const OnlineStoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedSortBy, setSelectedSortBy] = useState('Most Popular');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const filteredAndSortedStories = useMemo(() => {
    let filtered = mockStories.filter(story => {
      const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          story.author.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesGenre = selectedGenre === 'All' || 
                          story.genre === genreMap[selectedGenre];
      
      return matchesSearch && matchesGenre;
    });

    // Sort stories
    switch (selectedSortBy) {
      case 'Most Popular':
        filtered.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'Highest Rated':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'Newest':
        filtered.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
        break;
      case 'Most Downloaded':
        filtered.sort((a, b) => b.downloads - a.downloads);
        break;
      default:
        break;
    }

    return filtered;
  }, [searchQuery, selectedGenre, selectedSortBy]);

  const handleReadStory = (storyId: string) => {
    navigate(`/story/${storyId}`);
  };

  const getGenreBadgeClass = (genre: string) => {
    const genreClasses = {
      fantasy: 'online-stories-badge-fantasy',
      adventure: 'online-stories-badge-adventure',
      mystery: 'online-stories-badge-mystery',
      action: 'online-stories-badge-action',
      friendship: 'online-stories-badge-friendship',
      sciFi: 'online-stories-badge-scifi',
      comedy: 'online-stories-badge-comedy',
      educational: 'online-stories-badge-educational'
    };
    return genreClasses[genre as keyof typeof genreClasses] || 'online-stories-badge-fantasy';
  };

  const FilterDropdown: React.FC<{
    label: string;
    options: string[];
    selected: string;
    onSelect: (value: string) => void;
    dropdownKey: string;
  }> = ({ label, options, selected, onSelect, dropdownKey }) => {
    const isOpen = openDropdown === dropdownKey;

    return (
      <div className="online-stories-dropdown-container">
        <button
          className="online-stories-dropdown-button"
          onClick={() => setOpenDropdown(isOpen ? null : dropdownKey)}
        >
          <span>{selected}</span>
          <ChevronDownIcon className="online-stories-dropdown-icon" />
        </button>
        
        {isOpen && (
          <div className="online-stories-dropdown-menu">
            {options.map((option) => (
              <div
                key={option}
                className={option === selected ? 'online-stories-dropdown-item-selected' : 'online-stories-dropdown-item'}
                onClick={() => {
                  onSelect(option);
                  setOpenDropdown(null);
                }}
              >
                {option === selected && (
                  <CheckIcon className="online-stories-dropdown-checkmark" />
                )}
                <span>{option}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="online-stories-page">
      {/* Page Header */}
      <div className="online-stories-header">
        <button
          onClick={() => navigate(-1)}
          className="online-stories-back-button"
        >
          <ArrowLeftIcon className="online-stories-back-icon" />
        </button>
        
        <h1 className="online-stories-title">Online Stories</h1>
        <p className="online-stories-subtitle">Discover magical tales from our community</p>
      </div>

      {/* Search Bar */}
      <div className="online-stories-search-container">
        <MagnifyingGlassIcon className="online-stories-search-icon" />
        <input
          type="text"
          placeholder="Search stories or authors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="online-stories-search-input"
        />
      </div>

      {/* Filter Bar */}
      <div className="online-stories-filter-bar">
        <FunnelIcon className="online-stories-filter-icon" />
        
        <FilterDropdown
          label="Genre"
          options={genreOptions}
          selected={selectedGenre}
          onSelect={setSelectedGenre}
          dropdownKey="genre"
        />
        
        <FilterDropdown
          label="Sort By"
          options={sortByOptions}
          selected={selectedSortBy}
          onSelect={setSelectedSortBy}
          dropdownKey="sortBy"
        />
      </div>

      {/* Results Count */}
      <p className="online-stories-results-count">
        {filteredAndSortedStories.length} stories found
      </p>

      {/* Story List */}
      <div className="online-stories-story-list">
        {filteredAndSortedStories.map((story) => (
          <div key={story.id} className="online-stories-story-card">
            {/* Card Header */}
            <div className="online-stories-card-header">
              <div>
                <h3 className="online-stories-card-title">{story.title}</h3>
                <p className="online-stories-card-author">
                  by {story.is_collaborative && story.authors_names && story.authors_names.length > 0 
                    ? story.authors_names.join(', ') 
                    : story.author}
                </p>
              </div>
              <button
                onClick={() => handleReadStory(story.id)}
                className="online-stories-read-button"
              >
                Read
              </button>
            </div>

            {/* Badges Row */}
            <div className="online-stories-badges-row">
              <span className={getGenreBadgeClass(story.genre)}>
                {story.genre.charAt(0).toUpperCase() + story.genre.slice(1)}
              </span>
              <span className="online-stories-age-badge">
                {story.ageRange}
              </span>
            </div>

            {/* Description */}
            <p className="online-stories-card-description">{story.description}</p>

            {/* Metadata Row */}
            <div className="online-stories-metadata-row">
              <div className="online-stories-metadata-left">
                <div className="online-stories-metadata-item">
                  <StarIcon className="online-stories-rating-icon" />
                  <span className="online-stories-rating-text">{story.rating}</span>
                </div>
                <div className="online-stories-metadata-item">
                  <ArrowDownTrayIcon className="online-stories-downloads-icon" />
                  <span className="online-stories-downloads-text">{story.downloads}</span>
                </div>
                <div className="online-stories-metadata-item">
                  <HeartIcon className="online-stories-likes-icon" />
                  <span className="online-stories-likes-text">{story.likes}</span>
                </div>
              </div>
              <div className="online-stories-metadata-right">
                <div className="online-stories-metadata-item">
                  <ClockIcon className="online-stories-time-icon" />
                  <span className="online-stories-time-text">{story.readingTime} min</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnlineStoriesPage;
