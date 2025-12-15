import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
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
  const [stories, setStories] = useState<StoryWithGames[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

      {/* Stories Grid */}
      {filteredStories.length === 0 ? (
        <div className="games-empty">
          <p>No games available yet</p>
        </div>
      ) : (
        <div className="games-stories-grid">
          {filteredStories.map((story) => (
            <div 
              key={story.id}
              className="games-story-card"
              onClick={() => navigate(`/games/story/${story.id}`)}
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
      )}
    </div>
  );
};

export default GamesPage;
