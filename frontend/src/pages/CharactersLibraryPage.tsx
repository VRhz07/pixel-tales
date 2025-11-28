import React, { useState, useMemo } from 'react';
import { ArrowLeftIcon, MagnifyingGlassIcon, FunnelIcon, ChevronDownIcon, CheckIcon, PlusIcon, PencilIcon, HeartIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface Character {
  id: string;
  name: string;
  type: 'Magical Creature' | 'Animal' | 'Superhero' | 'Robot' | 'Dragon' | 'Royal';
  avatar: string;
  description: string;
  genre: 'fantasy' | 'adventure' | 'sciFi' | 'comedy' | 'mystery' | 'action' | 'friendship' | 'educational';
  personalityTraits: string[];
  usedInStories: number;
  likes: number;
  owner: 'You' | 'Community';
}

const mockCharacters: Character[] = [
  {
    id: '1',
    name: 'Luna the Unicorn',
    type: 'Magical Creature',
    avatar: '🦄',
    description: 'White unicorn with rainbow mane and silver horn',
    genre: 'fantasy',
    personalityTraits: ['Kind', 'Brave'],
    usedInStories: 8,
    likes: 45,
    owner: 'You'
  },
  {
    id: '2',
    name: 'Captain Cosmos',
    type: 'Superhero',
    avatar: '🚀',
    description: 'Blue suit with golden cape and star emblem',
    genre: 'adventure',
    personalityTraits: ['Brave', 'Leader'],
    usedInStories: 5,
    likes: 32,
    owner: 'You'
  },
  {
    id: '3',
    name: 'Whiskers the Cat',
    type: 'Animal',
    avatar: '🐱',
    description: 'Orange tabby cat with green eyes',
    genre: 'comedy',
    personalityTraits: ['Curious', 'Playful'],
    usedInStories: 12,
    likes: 67,
    owner: 'Community'
  },
  {
    id: '4',
    name: 'Zara the Dragon',
    type: 'Dragon',
    avatar: '🐉',
    description: 'Friendly purple dragon who loves to help others',
    genre: 'fantasy',
    personalityTraits: ['Wise', 'Protective'],
    usedInStories: 15,
    likes: 89,
    owner: 'Community'
  },
  {
    id: '5',
    name: 'Robo-Helper',
    type: 'Robot',
    avatar: '🤖',
    description: 'Silver robot with blue lights and helpful nature',
    genre: 'sciFi',
    personalityTraits: ['Logical', 'Helpful'],
    usedInStories: 6,
    likes: 28,
    owner: 'You'
  },
  {
    id: '6',
    name: 'Princess Aria',
    type: 'Royal',
    avatar: '👸',
    description: 'Kind princess with golden crown and flowing dress',
    genre: 'fantasy',
    personalityTraits: ['Kind', 'Wise'],
    usedInStories: 9,
    likes: 54,
    owner: 'Community'
  }
];

const characterTypeOptions = ['All', 'Magical Creature', 'Animal', 'Superhero', 'Robot', 'Dragon', 'Royal'];
const genreOptions = ['All', 'Fantasy', 'Adventure', 'Mystery', 'Action', 'Friendship', 'Sci-Fi', 'Comedy', 'Educational'];
const ownershipOptions = ['All', 'You', 'Community'];

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

const CharactersLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCharacterType, setSelectedCharacterType] = useState('All');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedOwnership, setSelectedOwnership] = useState('All');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const filteredCharacters = useMemo(() => {
    return mockCharacters.filter(character => {
      const matchesSearch = character.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          character.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = selectedCharacterType === 'All' || 
                         character.type === selectedCharacterType;
      
      const matchesGenre = selectedGenre === 'All' || 
                          character.genre === genreMap[selectedGenre];
      
      const matchesOwnership = selectedOwnership === 'All' || 
                             character.owner === selectedOwnership;
      
      return matchesSearch && matchesType && matchesGenre && matchesOwnership;
    });
  }, [searchQuery, selectedCharacterType, selectedGenre, selectedOwnership]);

  const handleCreateCharacter = () => {
    // Handle create character logic here
    console.log('Creating new character');
  };

  const handleEditCharacter = (characterId: string) => {
    // Handle edit character logic here
    console.log('Editing character:', characterId);
  };

  const handleUseInStory = (characterId: string) => {
    // Handle use in story logic here
    console.log('Using character in story:', characterId);
  };

  const getGenreBadgeClass = (genre: string) => {
    const genreClasses = {
      fantasy: 'characters-badge-fantasy',
      adventure: 'characters-badge-adventure',
      sciFi: 'characters-badge-scifi',
      comedy: 'characters-badge-comedy',
      mystery: 'characters-badge-mystery',
      calm: 'characters-badge-calm'
    };
    return genreClasses[genre as keyof typeof genreClasses] || 'characters-badge-fantasy';
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
      <div className="characters-dropdown-container">
        <button
          className="characters-dropdown-button"
          onClick={() => setOpenDropdown(isOpen ? null : dropdownKey)}
        >
          <span>{selected}</span>
          <ChevronDownIcon className="characters-dropdown-icon" />
        </button>
        
        {isOpen && (
          <div className="characters-dropdown-menu">
            {options.map((option) => (
              <div
                key={option}
                className={option === selected ? 'characters-dropdown-item-selected' : 'characters-dropdown-item'}
                onClick={() => {
                  onSelect(option);
                  setOpenDropdown(null);
                }}
              >
                {option === selected && (
                  <CheckIcon className="characters-dropdown-checkmark" />
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
    <div className="characters-library-page">
      {/* Page Header */}
      <div className="characters-header">
        <div className="characters-header-left">
          <button
            onClick={() => navigate(-1)}
            className="characters-back-button"
          >
            <ArrowLeftIcon className="characters-back-icon" />
          </button>
          
          <div className="characters-title-group">
            <h1 className="characters-title">Characters Library</h1>
            <p className="characters-subtitle">Meet your story characters</p>
          </div>
        </div>
        
        <button
          onClick={handleCreateCharacter}
          className="characters-create-button"
        >
          <PlusIcon className="characters-create-icon" />
          <span>Create</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="characters-search-container">
        <MagnifyingGlassIcon className="characters-search-icon" />
        <input
          type="text"
          placeholder="Search characters..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="characters-search-input"
        />
      </div>

      {/* Filter Bar */}
      <div className="characters-filter-bar">
        <FunnelIcon className="characters-filter-icon" />
        
        <FilterDropdown
          label="Character Type"
          options={characterTypeOptions}
          selected={selectedCharacterType}
          onSelect={setSelectedCharacterType}
          dropdownKey="characterType"
        />
        
        <FilterDropdown
          label="Genre"
          options={genreOptions}
          selected={selectedGenre}
          onSelect={setSelectedGenre}
          dropdownKey="genre"
        />
        
        <FilterDropdown
          label="Ownership"
          options={ownershipOptions}
          selected={selectedOwnership}
          onSelect={setSelectedOwnership}
          dropdownKey="ownership"
        />
      </div>

      {/* Results Count */}
      <p className="characters-results-count">
        {filteredCharacters.length} characters found
      </p>

      {/* Character List */}
      <div className="characters-character-list">
        {filteredCharacters.map((character) => (
          <div key={character.id} className="characters-character-card">
            {/* Card Header */}
            <div className="characters-card-header">
              <div className="characters-card-left-content">
                <div className="characters-avatar">
                  {character.avatar}
                </div>
                <div className="characters-character-info">
                  <h3 className="characters-character-name">{character.name}</h3>
                  <p className="characters-character-type">{character.type}</p>
                </div>
              </div>
              <button
                onClick={() => handleEditCharacter(character.id)}
                className="characters-edit-button"
              >
                <PencilIcon className="characters-edit-icon" />
              </button>
            </div>

            {/* Traits Row */}
            <div className="characters-traits-row">
              <span className={getGenreBadgeClass(character.genre)}>
                {character.genre.charAt(0).toUpperCase() + character.genre.slice(1)}
              </span>
              {character.personalityTraits.map((trait, index) => (
                <span key={index} className="characters-personality-badge">
                  {trait}
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="characters-card-description">{character.description}</p>

            {/* Metadata Row */}
            <div className="characters-metadata-row">
              <div className="characters-metadata-left">
                <span className="characters-usage-text">
                  Used in {character.usedInStories} stories
                </span>
                <div className="characters-metadata-item">
                  <HeartIcon className="characters-likes-icon" />
                  <span className="characters-likes-text">{character.likes}</span>
                </div>
              </div>
              <button
                onClick={() => handleUseInStory(character.id)}
                className="characters-use-button"
              >
                Use in Story
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharactersLibraryPage;
