import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const { playButtonClick } = useSoundEffects();
  
  const [storyTitle, setStoryTitle] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (storyId) {
      // Check if we need to skip cache (e.g., after game completion)
      const state = location.state as any;
      if (state?.refreshNeeded) {
        console.log('🔄 Refresh needed, skipping cache and forcing refresh');
        fetchGames(true); // Force refresh, skip cache
      } else {
        fetchGames(false); // Normal cache-first
      }
    }
  }, [storyId, location.state]);

  // Also refresh when location state changes (when navigating back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && storyId) {
        console.log('🔄 Page became visible, refreshing games...');
        fetchGames(false); // Use cache-first
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [storyId]);

  // Refresh games when navigating back to this page
  useEffect(() => {
    const handleFocus = () => {
      if (storyId) {
        fetchGames(false); // Use cache-first
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [storyId]);

  const fetchGames = async (forceRefresh: boolean = false) => {
    // If force refresh, skip cache entirely
    if (forceRefresh) {
      console.log('🔄 Force refresh - skipping cache entirely');
      setLoading(true);
      await fetchFreshGames();
      return;
    }
    
    // CACHE-FIRST STRATEGY: Always show cache immediately
    const cachedGames = gamesCacheService.getCachedStoryGames(storyId!);
    
    if (cachedGames && cachedGames.length > 0) {
      console.log('⚡ Loading games from cache instantly');
      console.log('📦 Cached games:', cachedGames);
      
      // Set games and show immediately
      setGames(cachedGames);
      setLoading(false);
      setError(null);
      
      // Cache each game's data for offline play if not already cached
      cachedGames.forEach(async (game) => {
        const cachedGameData = gamesCacheService.getCachedGameData(game.id);
        if (!cachedGameData) {
          console.log(`⚠️ Game ${game.id} not cached, attempting to cache...`);
          try {
            const gamePreview = await api.get(`/games/${game.id}/preview/`);
            gamesCacheService.cacheGameData(game.id, gamePreview);
            console.log(`✅ Cached game ${game.id} for offline play`);
          } catch (err) {
            console.log(`⚠️ Could not cache game ${game.id}:`, err);
          }
        }
      });
      
      // Try to refresh from API in background (non-blocking) if online
      if (gamesCacheService.isOnline()) {
        try {
          console.log('🔄 Attempting background refresh...');
          const response = await api.get(`/games/story/${storyId}/`);
          
          console.log('✅ Background refresh successful');
          setStoryTitle(response.story_title);
          setGames(response.games);
          
          // Update cache with fresh data
          gamesCacheService.cacheStoryGames(storyId!, response.games);
        } catch (err) {
          // Silent fail - we already have cache
          console.log('📴 Background refresh failed, using cached version');
        }
      } else {
        console.log('📴 Offline mode - using cached games only');
      }
      return;
    }
    
    // No cache available - must fetch from API
    console.log('📡 No cache found, fetching from API...');
    setLoading(true);
    
    try {
      await fetchFreshGames();
    } catch (err) {
      console.error('❌ Error fetching games:', err);
      setError('Failed to load games. Please check your connection.');
      setLoading(false);
    }
  };

  const fetchFreshGames = async () => {
    try {
      console.log('🔄 Fetching fresh games from API for storyId:', storyId);
      const response = await api.get(`/games/story/${storyId}/`);
      setStoryTitle(response.story_title);
      
      console.log('📊 Games data received:', response.games);
      
      // Log each game's status for debugging
      response.games.forEach((game: Game) => {
        console.log(`🎮 Game ${game.id}:`, {
          has_last_attempt: !!game.last_attempt,
          last_attempt: game.last_attempt,
          has_incomplete_attempt: !!game.incomplete_attempt,
          incomplete_attempt: game.incomplete_attempt
        });
      });
      
      setGames(response.games);
      
      // Cache the games for offline use
      gamesCacheService.cacheStoryGames(storyId!, response.games);
      console.log('💾 Cached fresh games data');
      
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
        
        {/* Offline indicator - show when using cached data */}
        {games.length > 0 && error === null && (
          <div style={{
            marginTop: '12px',
            padding: '10px 16px',
            background: !gamesCacheService.isOnline() 
              ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '12px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            textAlign: 'center',
            boxShadow: !gamesCacheService.isOnline()
              ? '0 4px 12px rgba(245, 158, 11, 0.3)'
              : '0 4px 12px rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            {!gamesCacheService.isOnline() ? (
              <>
                <span style={{ fontSize: '18px' }}>📴</span>
                <span>Playing Offline - Progress will sync when online</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: '18px' }}>✅</span>
                <span>Games loaded from cache - Online mode active</span>
              </>
            )}
          </div>
        )}
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
              {/* Only show incomplete badge if user has actually answered at least one question */}
              {game.incomplete_attempt && game.incomplete_attempt.answered_count > 0 && (
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
              {/* Show last attempt if exists AND (no incomplete OR incomplete has no answers) */}
              {game.last_attempt && (!game.incomplete_attempt || game.incomplete_attempt.answered_count === 0) && (
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
                {/* Only show resume if there's an incomplete attempt with at least 1 answer */}
                {game.incomplete_attempt && game.incomplete_attempt.answered_count > 0 ? (
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
                        state: { storyId: storyId, forceNew: game.last_attempt ? true : false }
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
