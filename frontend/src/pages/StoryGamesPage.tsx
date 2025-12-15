import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

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
      const response = await api.get(`/games/story/${storyId}/`);
      setStoryTitle(response.story_title);
      
      // The backend now includes last_attempt data directly in the response
      console.log('📊 Games data received:', response.games);
      setGames(response.games);
      setError(null);
    } catch (err) {
      console.error('Error fetching games:', err);
      setError('Failed to load games');
    } finally {
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
      <div style={{ padding: '40px', textAlign: 'center', minHeight: '100vh', backgroundColor: '#ffffff' }}>
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
        <button 
          onClick={() => navigate('/games')}
          style={{ 
            padding: '10px 20px',
            marginBottom: '20px',
            cursor: 'pointer',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#f9f9f9'
          }}
        >
          ← Back to Games
        </button>
        <h1>{storyTitle}</h1>
        <p>Choose a game to play</p>
      </div>

      {/* Error */}
      {error && (
        <div style={{ 
          padding: '20px', 
          marginBottom: '20px', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc',
          borderRadius: '8px'
        }}>
          {error}
        </div>
      )}

      {/* Games List */}
      {games.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>No games available for this story yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {games.map((game) => (
            <div 
              key={game.id}
              style={{ 
                border: '1px solid #ddd',
                borderRadius: '12px',
                padding: '20px',
                backgroundColor: '#f9f9f9'
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>
                {getGameIcon(game.game_type)}
              </div>
              <h3 style={{ margin: '0 0 8px 0' }}>{game.game_type_display}</h3>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>
                {game.questions_count} questions
              </p>
              
              {/* Incomplete Attempt - Priority */}
              {game.incomplete_attempt && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fff3e0',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  fontSize: '14px',
                  border: '2px solid #ff9800'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#e65100' }}>
                    ⚠️ Incomplete Game
                  </div>
                  <div style={{ color: '#666' }}>
                    Progress: {game.incomplete_attempt.answered_count}/{game.incomplete_attempt.total_questions} questions
                  </div>
                  <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                    Score: {game.incomplete_attempt.current_score} correct
                  </div>
                </div>
              )}
              
              {/* Last Attempt Stats */}
              {game.last_attempt && !game.incomplete_attempt && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#e8f5e9',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  fontSize: '14px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Last Score:</div>
                  <div style={{ color: '#2e7d32' }}>
                    ✓ {game.last_attempt.score_percentage}% 
                    ({game.last_attempt.correct_answers}/{game.last_attempt.total_questions} correct)
                  </div>
                  <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                    ⏱️ Time: {Math.floor(game.last_attempt.time_taken_seconds / 60)}m {game.last_attempt.time_taken_seconds % 60}s
                  </div>
                </div>
              )}
              
              {/* Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {game.incomplete_attempt ? (
                  <>
                    <button
                      onClick={() => {
                        navigate(`/games/play/${game.id}`, { 
                          state: { forceNew: false, storyId: storyId },
                          replace: false
                        });
                      }}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: '#ff9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                      title="Continue Game"
                    >
                      ▶️ Resume
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          console.log('🔄 Clearing incomplete attempt for game:', game.id);
                          // Delete the incomplete attempt using dedicated endpoint
                          const response = await api.post(`/games/${game.id}/clear_incomplete/`);
                          console.log('🔄 Clear response:', response);
                          
                          if (response.success) {
                            // Update only this specific game in the state
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
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                      title="Clear Incomplete Attempt"
                    >
                      ❌
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => navigate(`/games/play/${game.id}`, { 
                      state: { storyId: storyId }
                    })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
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
