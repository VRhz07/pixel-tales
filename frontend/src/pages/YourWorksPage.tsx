import React, { useState, useMemo } from 'react';
import { ArrowLeftIcon, MagnifyingGlassIcon, FunnelIcon, ChevronDownIcon, CheckIcon, PlusIcon, BookOpenIcon, PencilIcon, ShareIcon, TrashIcon, EyeIcon, HeartIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useStoryStore } from '../stores/storyStore';
import AnonymousPrompt from '../components/ui/AnonymousPrompt';

interface Story {
  id: string;
  title: string;
  status: 'Published' | 'Draft' | 'In Review';
  genre: 'Fantasy' | 'Adventure' | 'Comedy' | 'Mystery' | 'Sci-Fi' | 'Action' | 'Friendship' | 'Educational';
  pages: number;
  createdDate: string;
  likes?: number;
  views?: number;
  icon: string;
}

const mockStories: Story[] = [
  {
    id: '1',
    title: 'The Magic Forest',
    status: 'Published',
    genre: 'Fantasy',
    pages: 8,
    createdDate: '1/15/2024',
    likes: 24,
    views: 156,
    icon: '📚'
  },
  {
    id: '2',
    title: "Dragon's Adventure",
    status: 'Draft',
    genre: 'Adventure',
    pages: 12,
    createdDate: '1/20/2024',
    views: 0,
    icon: '📖'
  },
  {
    id: '3',
    title: 'Princess Luna',
    status: 'Published',
    genre: 'Fantasy',
    pages: 6,
    createdDate: '1/25/2024',
    likes: 18,
    views: 89,
    icon: '📚'
  },
  {
    id: '4',
    title: 'Space Explorer',
    status: 'In Review',
    genre: 'Sci-Fi',
    pages: 10,
    createdDate: '1/28/2024',
    views: 12,
    icon: '📖'
  },
  {
    id: '5',
    title: 'The Funny Cat',
    status: 'Published',
    genre: 'Comedy',
    pages: 5,
    createdDate: '2/1/2024',
    likes: 31,
    views: 203,
    icon: '📚'
  },
  {
    id: '6',
    title: 'Mystery Mansion',
    status: 'Draft',
    genre: 'Mystery',
    pages: 15,
    createdDate: '2/5/2024',
    views: 0,
    icon: '📖'
  },
  {
    id: '7',
    title: 'Robot Friends',
    status: 'Published',
    genre: 'Sci-Fi',
    pages: 9,
    createdDate: '2/8/2024',
    likes: 27,
    views: 134,
    icon: '📚'
  },
  {
    id: '8',
    title: 'Ocean Adventure',
    status: 'Draft',
    genre: 'Adventure',
    pages: 7,
    createdDate: '2/12/2024',
    views: 0,
    icon: '📖'
  }
];

const statusOptions = ['All Status', 'Published', 'Draft', 'In Review'];
const genreOptions = ['All Genres', 'Fantasy', 'Adventure', 'Mystery', 'Action', 'Friendship', 'Sci-Fi', 'Comedy', 'Educational'];

const YourWorksPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { userLibraries, currentUserId } = useStoryStore();
  const isAnonymous = user?.id === 'anonymous' || !isAuthenticated;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedGenre, setSelectedGenre] = useState('All Genres');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  // Get real stories from store
  const realStories = currentUserId ? (userLibraries[currentUserId]?.stories || []) : [];

  // Show anonymous prompt if user is not authenticated
  if (isAnonymous) {
    return <AnonymousPrompt feature="Your Works" message="Create a free account to start writing your own stories and manage your creative works!" />;
  }

  const filteredStories = useMemo(() => {
    // Convert real stories to the format expected by the UI
    const stories = realStories.map((story: any) => ({
      id: story.id,
      title: story.title,
      status: story.isPublished ? 'Published' as const : 'Draft' as const,
      genre: (story.genre || 'Fantasy') as Story['genre'],
      pages: story.pages.length,
      createdDate: new Date(story.createdAt).toLocaleDateString(),
      likes: 0,
      views: 0,
      icon: story.isPublished ? '📚' : '📖'
    }));
    
    return stories.filter((story: any) => {
      const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = selectedStatus === 'All Status' || story.status === selectedStatus;
      const matchesGenre = selectedGenre === 'All Genres' || story.genre === selectedGenre;
      
      return matchesSearch && matchesStatus && matchesGenre;
    });
  }, [realStories, searchQuery, selectedStatus, selectedGenre]);

  const handleNewStory = () => {
    // Handle new story creation
    console.log('Creating new story');
  };

  const handleViewStory = (storyId: string) => {
    // Handle view story
    console.log('Viewing story:', storyId);
  };

  const handleEditStory = (storyId: string) => {
    // Handle edit story
    console.log('Editing story:', storyId);
  };

  const handleShareStory = (storyId: string) => {
    // Handle share story
    console.log('Sharing story:', storyId);
  };

  const handleDeleteStory = (storyId: string) => {
    // Handle delete story
    console.log('Deleting story:', storyId);
  };

  const getStatusBadgeClass = (status: string) => {
    const statusClasses = {
      'Published': 'your-works-badge-published',
      'Draft': 'your-works-badge-draft',
      'In Review': 'your-works-badge-review'
    };
    return statusClasses[status as keyof typeof statusClasses] || 'your-works-badge-draft';
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
      <div className="your-works-dropdown-container">
        <button
          className="your-works-dropdown-button"
          onClick={() => setOpenDropdown(isOpen ? null : dropdownKey)}
        >
          <span>{selected}</span>
          <ChevronDownIcon className="your-works-dropdown-icon" />
        </button>
        
        {isOpen && (
          <div className="your-works-dropdown-menu">
            {options.map((option) => (
              <div
                key={option}
                className={option === selected ? 'your-works-dropdown-item-selected' : 'your-works-dropdown-item'}
                onClick={() => {
                  onSelect(option);
                  setOpenDropdown(null);
                }}
              >
                {option === selected && (
                  <CheckIcon className="your-works-dropdown-checkmark" />
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
    <div className="your-works-page">
      {/* Page Header */}
      <div className="your-works-header">
        <div className="your-works-header-left">
          <button
            onClick={() => navigate(-1)}
            className="your-works-back-button"
          >
            <ArrowLeftIcon className="your-works-back-icon" />
          </button>
          
          <div className="your-works-title-group">
            <h1 className="your-works-title">Your Works</h1>
            <p className="your-works-subtitle">Manage all your magical creations</p>
          </div>
        </div>
        
        <button
          onClick={handleNewStory}
          className="your-works-new-button"
        >
          <PlusIcon className="your-works-new-icon" />
          <span>New Story</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="your-works-search-container">
        <MagnifyingGlassIcon className="your-works-search-icon" />
        <input
          type="text"
          placeholder="Search your stories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="your-works-search-input"
        />
      </div>

      {/* Filter Bar */}
      <div className="your-works-filter-bar">
        <FunnelIcon className="your-works-filter-icon" />
        
        <FilterDropdown
          label="Status"
          options={statusOptions}
          selected={selectedStatus}
          onSelect={setSelectedStatus}
          dropdownKey="status"
        />
        
        <FilterDropdown
          label="Genre"
          options={genreOptions}
          selected={selectedGenre}
          onSelect={setSelectedGenre}
          dropdownKey="genre"
        />
      </div>

      {/* Results Count */}
      <p className="your-works-results-count">
        {filteredStories.length} Stories Found
      </p>

      {/* Story List */}
      <div className="your-works-story-list">
        {filteredStories.map((story) => (
          <div key={story.id} className="your-works-story-card">
            {/* Card Header */}
            <div className="your-works-card-header">
              <div className="your-works-card-left-content">
                <div className="your-works-story-icon">
                  {story.icon}
                </div>
                <div className="your-works-story-info">
                  <div className="your-works-story-title-row">
                    <h3 className="your-works-story-title">{story.title}</h3>
                    <span className={getStatusBadgeClass(story.status)}>
                      {story.status}
                    </span>
                  </div>
                  <div className="your-works-story-meta">
                    <span className="your-works-story-pages">{story.pages} pages</span>
                    <span className="your-works-story-separator">•</span>
                    <span className="your-works-story-genre">{story.genre}</span>
                  </div>
                  <p className="your-works-story-date">Created: {story.createdDate}</p>
                </div>
              </div>
            </div>

            {/* Story Stats */}
            {story.status === 'Published' && (
              <div className="your-works-story-stats">
                <div className="your-works-stat-item">
                  <HeartIcon className="your-works-likes-icon" />
                  <span className="your-works-stat-text">{story.likes} likes</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="your-works-action-buttons">
              <button
                onClick={() => handleViewStory(story.id)}
                className="your-works-action-button your-works-view-button"
              >
                <EyeIcon className="your-works-action-icon" />
              </button>
              <button
                onClick={() => handleEditStory(story.id)}
                className="your-works-action-button your-works-edit-button"
              >
                <PencilIcon className="your-works-action-icon" />
              </button>
              {story.status === 'Published' && (
                <button
                  onClick={() => handleShareStory(story.id)}
                  className="your-works-action-button your-works-share-button"
                >
                  <ShareIcon className="your-works-action-icon" />
                </button>
              )}
              <button
                onClick={() => handleDeleteStory(story.id)}
                className="your-works-action-button your-works-delete-button"
              >
                <TrashIcon className="your-works-action-icon" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default YourWorksPage;
