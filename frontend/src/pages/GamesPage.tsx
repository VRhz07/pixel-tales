import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSoundEffects } from '../hooks/useSoundEffects';
import './GamesPage.css';

interface StoryWithGames {
  id: number;
  title: string;
  cover_image: string | null;
  category: string;
  author__username: string;
  games_count: number;
}

const GamesPage: React.FC = () => {
  const navigate = useNavigate();
  const { playButtonClick } = useSoundEffects();
  const [stories, setStories] = useState<StoryWithGames[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/games/available_stories/');
      setStories(response.stories || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching stories:', err);
      setError('Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  const filteredStories = stories.filter(story =>
    story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.author__username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredStories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStories = filteredStories.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    playButtonClick();
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
    playButtonClick();
  };

  if (loading) {
    return (
      <div className="games-loading">
        <p>Loading games...</p>
      </div>
    );
  }

  return (
    <div className="games-page">
      {/* Header */}
      <div className="games-page-header">
        <h1 className="games-page-title">Story Games</h1>
        <p className="games-page-subtitle">Play games based on your favorite stories</p>
      </div>

      {/* Search */}
      <div className="games-search-container">
        <input
          type="text"
          placeholder="Search stories or authors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="games-search-input"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="games-error">
          {error}
        </div>
      )}

      {/* Pagination Controls - Top */}
      {filteredStories.length > 0 && (
        <div className="games-pagination-header">
          <div className="games-pagination-info">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredStories.length)} of {filteredStories.length} stories
          </div>
          <div className="games-items-per-page">
            <label>Items per page:</label>
            <select 
              value={itemsPerPage} 
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="games-items-select"
            >
              <option value={6}>6</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      )}

      {/* Stories Grid */}
      {filteredStories.length === 0 ? (
        <div className="games-empty">
          <p>No games available yet</p>
        </div>
      ) : (
        <>
          <div className="games-stories-grid">
            {currentStories.map((story) => (
              <div 
                key={story.id}
                className="games-story-card"
                onClick={() => {
                  playButtonClick();
                  navigate(`/games/story/${story.id}`);
                }}
              >
                {/* Cover Image */}
                <div className="games-story-cover">
                  {story.cover_image ? (
                    <img 
                      src={story.cover_image} 
                      alt={story.title}
                    />
                  ) : (
                    <div className="games-story-icon">🎮</div>
                  )}
                </div>
                
                {/* Story Info */}
                <div className="games-story-info">
                  <h3 className="games-story-title">
                    {story.title}
                  </h3>
                  <p className="games-story-author">
                    by {story.author__username}
                  </p>
                  <p className="games-story-count">
                    🎮 {story.games_count} game{story.games_count !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls - Bottom */}
          {totalPages > 1 && (
            <div className="games-pagination">
              <button
                className="games-pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>

              <div className="games-pagination-pages">
                {/* First page */}
                {currentPage > 3 && (
                  <>
                    <button
                      className="games-pagination-number"
                      onClick={() => handlePageChange(1)}
                    >
                      1
                    </button>
                    {currentPage > 4 && <span className="games-pagination-ellipsis">...</span>}
                  </>
                )}

                {/* Pages around current page */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    return Math.abs(page - currentPage) <= 2 || page === 1 || page === totalPages;
                  })
                  .filter(page => page !== 1 && page !== totalPages)
                  .map(page => (
                    <button
                      key={page}
                      className={`games-pagination-number ${currentPage === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ))}

                {/* Last page */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && <span className="games-pagination-ellipsis">...</span>}
                    <button
                      className="games-pagination-number"
                      onClick={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                className="games-pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GamesPage;
