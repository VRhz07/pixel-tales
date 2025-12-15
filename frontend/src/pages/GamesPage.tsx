import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

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
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading games...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      paddingBottom: '100px',
      minHeight: '100vh',
      backgroundColor: '#ffffff'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1>Story Games</h1>
        <p>Play games based on your favorite stories</p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '30px' }}>
        <input
          type="text"
          placeholder="Search stories or authors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: '10px', width: '100%', maxWidth: '500px' }}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '20px', marginBottom: '20px', backgroundColor: '#fee', border: '1px solid #fcc' }}>
          {error}
        </div>
      )}

      {/* Stories Grid */}
      {filteredStories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>No games available yet</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '16px'
        }}>
          {filteredStories.map((story) => (
            <div 
              key={story.id}
              style={{ 
                border: '1px solid #ddd',
                borderRadius: '16px',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
              onClick={() => navigate(`/games/story/${story.id}`)}
            >
              {/* Cover Image */}
              <div style={{
                width: '100%',
                height: '200px',
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
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
                  <div style={{ fontSize: '48px' }}>🎮</div>
                )}
              </div>
              
              {/* Story Info */}
              <div style={{ padding: '12px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: '0 0 4px 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {story.title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: '0 0 8px 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  by {story.author__username}
                </p>
                <p style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  margin: 0
                }}>
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
