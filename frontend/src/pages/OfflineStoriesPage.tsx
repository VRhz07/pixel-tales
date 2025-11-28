import React, { useState, useMemo } from 'react';
import { ArrowLeftIcon, MagnifyingGlassIcon, FunnelIcon, ChevronDownIcon, CheckIcon, BookOpenIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface StoryCollection {
  id: string;
  title: string;
  description: string;
  genre: 'fantasy' | 'adventure' | 'sciFi' | 'comedy' | 'mystery' | 'action' | 'friendship' | 'educational';
  ageRange: '3-6' | '5-10' | '8-12';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  storyCount: number;
  duration: number; // in minutes
  isDownloaded?: boolean;
}

const mockCollections: StoryCollection[] = [
  {
    id: '1',
    title: 'Classic Fairy Tales Collection',
    description: 'Timeless tales including Cinderella, Snow White, and more',
    genre: 'fantasy',
    ageRange: '3-6',
    difficulty: 'Easy',
    storyCount: 25,
    duration: 180,
    isDownloaded: false
  },
  {
    id: '2',
    title: 'Animal Adventures Pack',
    description: 'Stories about brave animals and their exciting journeys',
    genre: 'adventure',
    ageRange: '5-10',
    difficulty: 'Medium',
    storyCount: 18,
    duration: 150,
    isDownloaded: false
  },
  {
    id: '3',
    title: 'Space Explorers Bundle',
    description: 'Blast off to adventure with astronauts and aliens',
    genre: 'sciFi',
    ageRange: '8-12',
    difficulty: 'Medium',
    storyCount: 12,
    duration: 120,
    isDownloaded: false
  },
  {
    id: '4',
    title: 'Bedtime Stories Collection',
    description: 'Gentle stories perfect for winding down at night',
    genre: 'friendship',
    ageRange: '3-6',
    difficulty: 'Easy',
    storyCount: 30,
    duration: 200,
    isDownloaded: false
  },
  {
    id: '5',
    title: 'Mystery Detective Club',
    description: 'Solve puzzles and mysteries with young detectives',
    genre: 'mystery',
    ageRange: '8-12',
    difficulty: 'Hard',
    storyCount: 15,
    duration: 135,
    isDownloaded: false
  },
  {
    id: '6',
    title: 'Funny Friends Comedy',
    description: 'Hilarious adventures that will make you laugh out loud',
    genre: 'comedy',
    ageRange: '5-10',
    difficulty: 'Easy',
    storyCount: 22,
    duration: 165,
    isDownloaded: false
  }
];

const genreOptions = ['All', 'Fantasy', 'Adventure', 'Mystery', 'Action', 'Friendship', 'Sci-Fi', 'Comedy', 'Educational'];
const difficultyOptions = ['All', 'Easy', 'Medium', 'Hard'];

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

const OfflineStoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const filteredCollections = useMemo(() => {
    return mockCollections.filter(collection => {
      const matchesSearch = collection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          collection.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesGenre = selectedGenre === 'All' || 
                          collection.genre === genreMap[selectedGenre];
      
      const matchesDifficulty = selectedDifficulty === 'All' || 
                              collection.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesGenre && matchesDifficulty;
    });
  }, [searchQuery, selectedGenre, selectedDifficulty]);

  const handleDownload = (collectionId: string) => {
    // Handle download logic here
    console.log('Downloading collection:', collectionId);
  };

  const getGenreBadgeClass = (genre: string) => {
    const genreClasses = {
      fantasy: 'offline-stories-badge-fantasy',
      adventure: 'offline-stories-badge-adventure',
      sciFi: 'offline-stories-badge-scifi',
      comedy: 'offline-stories-badge-comedy',
      mystery: 'offline-stories-badge-mystery',
      calm: 'offline-stories-badge-calm'
    };
    return genreClasses[genre as keyof typeof genreClasses] || 'offline-stories-badge-fantasy';
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
      <div className="offline-stories-dropdown-container">
        <button
          className="offline-stories-dropdown-button"
          onClick={() => setOpenDropdown(isOpen ? null : dropdownKey)}
        >
          <span>{selected}</span>
          <ChevronDownIcon className="offline-stories-dropdown-icon" />
        </button>
        
        {isOpen && (
          <div className="offline-stories-dropdown-menu">
            {options.map((option) => (
              <div
                key={option}
                className={option === selected ? 'offline-stories-dropdown-item-selected' : 'offline-stories-dropdown-item'}
                onClick={() => {
                  onSelect(option);
                  setOpenDropdown(null);
                }}
              >
                {option === selected && (
                  <CheckIcon className="offline-stories-dropdown-checkmark" />
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
    <div className="offline-stories-page">
      {/* Page Header */}
      <div className="offline-stories-header">
        <button
          onClick={() => navigate(-1)}
          className="offline-stories-back-button"
        >
          <ArrowLeftIcon className="offline-stories-back-icon" />
        </button>
        
        <h1 className="offline-stories-title">Offline Stories</h1>
        <p className="offline-stories-subtitle">Download and read anytime</p>
      </div>

      {/* Search Bar */}
      <div className="offline-stories-search-container">
        <MagnifyingGlassIcon className="offline-stories-search-icon" />
        <input
          type="text"
          placeholder="Search story collections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="offline-stories-search-input"
        />
      </div>

      {/* Filter Bar */}
      <div className="offline-stories-filter-bar">
        <FunnelIcon className="offline-stories-filter-icon" />
        
        <FilterDropdown
          label="Genre"
          options={genreOptions}
          selected={selectedGenre}
          onSelect={setSelectedGenre}
          dropdownKey="genre"
        />
        
        <FilterDropdown
          label="Difficulty"
          options={difficultyOptions}
          selected={selectedDifficulty}
          onSelect={setSelectedDifficulty}
          dropdownKey="difficulty"
        />
      </div>

      {/* Results Count */}
      <p className="offline-stories-results-count">
        {filteredCollections.length} collections found
      </p>

      {/* Collection List */}
      <div className="offline-stories-collection-list">
        {filteredCollections.map((collection) => (
          <div key={collection.id} className="offline-stories-collection-card">
            {/* Card Header */}
            <div className="offline-stories-card-header">
              <div>
                <h3 className="offline-stories-card-title">{collection.title}</h3>
                <p className="offline-stories-card-description">{collection.description}</p>
              </div>
              <button
                onClick={() => handleDownload(collection.id)}
                className="offline-stories-download-button"
              >
                Download
              </button>
            </div>

            {/* Badges Row */}
            <div className="offline-stories-badges-row">
              <span className={getGenreBadgeClass(collection.genre)}>
                {collection.genre.charAt(0).toUpperCase() + collection.genre.slice(1)}
              </span>
              <span className="offline-stories-age-badge">
                {collection.ageRange}
              </span>
              <span className="offline-stories-difficulty-badge">
                {collection.difficulty}
              </span>
            </div>

            {/* Metadata Row */}
            <div className="offline-stories-metadata-row">
              <div className="offline-stories-metadata-item">
                <BookOpenIcon className="offline-stories-metadata-icon" />
                <span className="offline-stories-metadata-text">
                  {collection.storyCount} stories
                </span>
              </div>
              <div className="offline-stories-metadata-item">
                <ClockIcon className="offline-stories-metadata-icon" />
                <span className="offline-stories-metadata-text">
                  {collection.duration} min
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OfflineStoriesPage;
