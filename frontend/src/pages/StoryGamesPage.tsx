import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import gamesCacheService from '../services/gamesCache.service';
import { useSoundEffects } from '../hooks/useSoundEffects';
import './StoryGamesPage.css';

interface Game {
  id: number;
  game_type: string;
  game_type_display: string;
  difficulty: string;
  questions_count: number;
  last_attempt?: {
    score_percentage: number;
    time_taken_seconds: number;
    is_completed: boolean;
    correct_answers: number;
    total_questions: number;
  };
  incomplete_attempt?: {
    attempt_id: number;
    current_score: number;
    answered_count: number;
    total_questions: number;
    started_at: string;
  };
}

const StoryGamesPage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const { playButtonClick } = useSoundEffects();
  
  const [storyTitle, setStoryTitle] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (storyId) {
      fetchGames();
    }
  }, [storyId]);

  // Also refresh when location state changes (when navigating back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && storyId) {
        console.log('🔄 Page became visible, refreshing games...');
        fetchGames();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [storyId]);

  // Refresh games when navigating back to this page
  useEffect(() => {
    const handleFocus = () => {
      if (storyId) {
        fetchGames();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [storyId]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      
      // Try to load from cache first for instant display
      const cachedGames = gamesCacheService.getCachedStoryGames(storyId!);
      if (cachedGames && cachedGames.length > 0) {
        console.log('⚡ Loading games from cache');
        setGames(cachedGames);
        setLoading(false);
        
        // Still fetch fresh data in background if online
        if (gamesCacheService.isOnline()) {
          console.log('🔄 Refreshing games in background');
          fetchFreshGames();
        }
        return;
      }
      
      // No cache, fetch from API
      await fetchFreshGames();
    } catch (err) {
      console.error('Error in fetchGames:', err);
    }
  };

  const fetchFreshGames = async () => {
    try {
      const response = await api.get(`/games/story/${storyId}/`);
      setStoryTitle(response.story_title);
      
      console.log('📊 Games data received:', response.games);
      setGames(response.games);
      
      // Cache the games for offline use
      gamesCacheService.cacheStoryGames(storyId!, response.games);
      
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching games:', err);
      setError('Failed to load games');
      setLoading(false);
    }
  };

  const getGameIcon = (gameType: string) => {
    switch (gameType) {
      case 'quiz': return '📝';
      case 'fill_blanks': return '✍️';
      case 'spelling': return '🔤';
      default: return '🎮';
    }
  };

  if (loading) {
    return (
      <div className="story-games-loading">
        <p>Loading games...</p>
      </div>
    );
  }

  return (
    <div className="story-games-page">
      {/* Header */}
      <div className="story-games-header">
        <button 
          onClick={() => {
            playButtonClick();
            navigate('/games');
          }}
          className="back-button"
        >
          ← Back to Games
        </button>
        <h1 className="story-title">{storyTitle}</h1>
        <p className="story-subtitle">Choose a game to play</p>
      </div>

      {/* Error */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Games List */}
      {games.length === 0 ? (
        <div className="empty-state">
          <p>No games available for this story yet</p>
        </div>
      ) : (
        <div className="games-list">
          {games.map((game) => (
            <div 
              key={game.id}
              className={`game-card game-card-${game.game_type}`}
            >
              <div className="game-icon">
                {getGameIcon(game.game_type)}
              </div>
              <h3 className="game-title">{game.game_type_display}</h3>
              <p className="game-questions">
                {game.questions_count} questions
              </p>
              
              {/* Incomplete Attempt - Priority */}
              {game.incomplete_attempt && (
                <div className="incomplete-attempt-badge">
                  <div className="badge-title">
                    ⚠️ Incomplete Game
                  </div>
                  <div className="badge-info">
                    Progress: {game.incomplete_attempt.answered_count}/{game.incomplete_attempt.total_questions} questions
                  </div>
                  <div className="badge-score">
                    Score: {game.incomplete_attempt.current_score} correct
                  </div>
                </div>
              )}
              
              {/* Last Attempt Stats */}
              {game.last_attempt && !game.incomplete_attempt && (
                <div className="last-attempt-badge">
                  <div className="badge-title">Last Score:</div>
                  <div className="badge-score-value">
                    ✓ {game.last_attempt.score_percentage}% 
                    ({game.last_attempt.correct_answers}/{game.last_attempt.total_questions} correct)
                  </div>
                  <div className="badge-time">
                    ⏱️ Time: {Math.floor(game.last_attempt.time_taken_seconds / 60)}m {game.last_attempt.time_taken_seconds % 60}s
                  </div>
                </div>
              )}
              
              {/* Buttons */}
              <div className="game-buttons">
                {game.incomplete_attempt ? (
                  <>
                    <button
                      onClick={() => {
                        playButtonClick();
                        navigate(`/games/play/${game.id}`, { 
                          state: { forceNew: false, storyId: storyId },
                          replace: false
                        });
                      }}
                      className="btn-resume"
                      title="Continue Game"
                    >
                      ▶️ Resume
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          console.log('🔄 Clearing incomplete attempt for game:', game.id);
                          const response = await api.post(`/games/${game.id}/clear_incomplete/`);
                          console.log('🔄 Clear response:', response);
                          
                          if (response.success) {
                            setGames(prevGames => 
                              prevGames.map(g => 
                                g.id === game.id 
                                  ? { ...g, incomplete_attempt: undefined }
                                  : g
                              )
                            );
                            console.log('🔄 Game state updated');
                          }
                        } catch (err) {
                          console.error('❌ Error clearing incomplete attempt:', err);
                        }
                      }}
                      className="btn-clear"
                      title="Clear Incomplete Attempt"
                    >
                      ❌
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      playButtonClick();
                      navigate(`/games/play/${game.id}`, { 
                        state: { storyId: storyId }
                      });
                    }}
                    className="btn-play"
                  >
                    {game.last_attempt ? '🎮 Play Again' : '🎮 Start Game'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoryGamesPage;
