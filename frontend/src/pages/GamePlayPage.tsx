import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import api from '../services/api';
import gamesCacheService from '../services/gamesCache.service';
import { useThemeStore } from '../stores/themeStore';
import { useSoundEffects } from '../hooks/useSoundEffects';
import './GamePlayPage.css';

interface Question {
  id: number;
  question_text: string;
  options?: string[] | string[];
  correct_answer: string;
  context?: string;
  hint?: string;
}

interface GameData {
  id: number;
  game_type: string;
  game_type_display: string;
  story_id: number;
  story_title: string;
  questions: Question[];
}

const GamePlayPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useThemeStore();
  const { playButtonClick, playSuccess, playError, playAchievement, playSound } = useSoundEffects();
  
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeTaken, setTimeTaken] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  
  // Word search interactive state
  const [selectedCells, setSelectedCells] = useState<{row: number, col: number}[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [foundWordCells, setFoundWordCells] = useState<{row: number, col: number}[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [celebrationWord, setCelebrationWord] = useState<string | null>(null);

  useEffect(() => {
    if (gameId) {
      fetchGame();
    }
    
    // Sync pending progress when coming online
    const handleOnline = async () => {
      console.log('🌐 Back online! Syncing pending progress...');
      const pending = gamesCacheService.getPendingProgress();
      
      for (const progress of pending) {
        try {
          // Submit each pending answer
          for (const answer of progress.answers) {
            await api.post('/games/submit_answer/', {
              attempt_id: progress.attemptId,
              question_id: answer.question_id,
              answer: answer.answer
            });
          }
          
          // Remove from pending after successful sync
          gamesCacheService.removePendingProgress(progress.attemptId);
          console.log('✅ Synced progress for attempt:', progress.attemptId);
        } catch (err) {
          console.error('❌ Failed to sync progress:', err);
        }
      }
    };
    
    // Handle Android back button
    let backButtonListener: any;
    const setupBackButton = async () => {
      backButtonListener = await CapacitorApp.addListener('backButton', () => {
        console.log('📱 Android back button pressed in GamePlayPage');
        handleBackToStory();
      });
    };
    
    setupBackButton();
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [gameId]);

  const fetchGame = async () => {
    try {
      setLoading(true);
      
      // Try loading from cache first for offline play
      const cachedGame = gamesCacheService.getCachedGameData(gameId!);
      if (cachedGame && !gamesCacheService.isOnline()) {
        console.log('🎮 Loading game from cache (offline mode)');
        console.log('📦 Cached game data:', cachedGame);
        
        // Handle both old and new cache formats
        // Old format: { gameData: {...}, attemptId: ... }
        // New format: { game_id: ..., questions: [...], ... }
        let gameInfo = cachedGame;
        
        // If it's the old double-wrapped format, unwrap it
        if (cachedGame.gameData && !cachedGame.game_id) {
          console.log('🔄 Converting old cache format to new format');
          gameInfo = cachedGame.gameData;
        }
        
        console.log('📋 Questions in cache:', gameInfo.questions);
        
        // Check if we have questions
        if (!gameInfo.questions || gameInfo.questions.length === 0) {
          console.error('❌ No questions found in cached game data!');
          setError('No questions available for this game');
          setLoading(false);
          return;
        }
        
        // Transform cached preview data to GameData format
        const transformedData: GameData = {
          id: gameInfo.id || gameInfo.game_id || parseInt(gameId!),
          game_type: gameInfo.game_type,
          game_type_display: gameInfo.game_type_display || gameInfo.game_type,
          story_id: gameInfo.story_id || 0,
          story_title: gameInfo.story_title || '',
          questions: gameInfo.questions.map((q: any) => ({
            id: q.id,
            question_text: q.question_text,
            options: q.options,
            correct_answer: '',
            context: q.context,
            hint: q.hint
          }))
        };
        
        console.log('✅ Transformed game data:', transformedData);
        console.log('✅ Questions count:', transformedData.questions.length);
        console.log('✅ First question:', transformedData.questions[0]);
        
        setGameData(transformedData);
        // Use negative attempt ID to indicate offline mode
        setAttemptId(-(parseInt(gameId!)));
        setStartTime(Date.now());
        setLoading(false);
        setError('📴 Playing offline - progress will sync when online');
        return;
      }
      
      // Check if we should force a new game
      const forceNew = location.state?.forceNew || false;
      console.log('🎮 Starting game with forceNew:', forceNew);
      
      const response = await api.post(`/games/${gameId}/start_game/`, {
        force_new: forceNew
      });
      
      console.log('🎮 Game response:', response);
      
      // Transform the response to match our GameData interface
      const transformedData: GameData = {
        id: parseInt(gameId!),
        game_type: response.game_type,
        game_type_display: response.game_type,
        story_id: 0,
        story_title: '',
        questions: response.questions.map((q: any) => ({
          id: q.id,
          question_text: q.question_text,
          options: q.options,
          correct_answer: '',
          context: q.context,
          hint: q.hint
        }))
      };
      
      setGameData(transformedData);
      setAttemptId(response.attempt_id);
      
      // Start tracking time from now
      setStartTime(Date.now());
      
      // Cache the game data for offline play
      // Note: Don't wrap in gameData/attemptId - we're caching preview format now
      // This old code is for when playing online, so we can skip caching here
      
      // If resuming, set the current score and find first unanswered question
      if (response.is_resume) {
        setScore(response.current_score);
        const firstUnanswered = response.questions.findIndex((q: any) => !q.is_answered);
        if (firstUnanswered !== -1) {
          setCurrentQuestionIndex(firstUnanswered);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error starting game:', err);
      
      // Try loading from cache as fallback
      const cachedGame = gamesCacheService.getCachedGameData(gameId!);
      if (cachedGame) {
        console.log('⚠️ API failed, loading from cache');
        
        // Handle both old and new cache formats
        let gameInfo = cachedGame;
        if (cachedGame.gameData && !cachedGame.game_id) {
          console.log('🔄 Converting old cache format to new format');
          gameInfo = cachedGame.gameData;
        }
        
        // Transform cached preview data to GameData format
        const transformedData: GameData = {
          id: gameInfo.id || gameInfo.game_id || parseInt(gameId!),
          game_type: gameInfo.game_type,
          game_type_display: gameInfo.game_type_display || gameInfo.game_type,
          story_id: gameInfo.story_id || 0,
          story_title: gameInfo.story_title || '',
          questions: gameInfo.questions.map((q: any) => ({
            id: q.id,
            question_text: q.question_text,
            options: q.options,
            correct_answer: '',
            context: q.context,
            hint: q.hint
          }))
        };
        
        setGameData(transformedData);
        // Use negative attempt ID to indicate offline mode
        setAttemptId(-(parseInt(gameId!)));
        setStartTime(Date.now());
        setError('📴 Playing offline - progress will sync when online');
      } else {
        setError('Failed to start game');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!gameData || !userAnswer.trim() || !attemptId || isSubmitting) return;

    const currentQuestion = gameData.questions[currentQuestionIndex];
    
    setIsSubmitting(true);
    try {
      if (!gamesCacheService.isOnline()) {
        // Offline mode - store answer locally
        console.log('📴 Offline: Storing answer locally');
        gamesCacheService.storePendingProgress(gameData.id, attemptId, [{
          question_id: currentQuestion.id,
          answer: userAnswer.trim(),
          timestamp: Date.now()
        }]);
        
        // Show generic feedback (can't validate offline)
        setIsCorrect(false);
        setCorrectAnswer('Answer saved offline - will be checked when online');
        setShowFeedback(true);
        setError('Playing offline - progress will sync when online');
      } else {
        const response = await api.post('/games/submit_answer/', {
          attempt_id: attemptId,
          question_id: currentQuestion.id,
          answer: userAnswer.trim()
        });
        
        setIsCorrect(response.is_correct);
        setCorrectAnswer(response.correct_answer);
        setShowFeedback(true);
        
        if (response.is_correct) {
          setScore(score + 1);
          playSuccess(); // Play success sound with haptic
        } else {
          playError(); // Play error sound with haptic
        }
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Failed to submit answer - saved offline');
      
      // Store offline as fallback
      gamesCacheService.storePendingProgress(gameData.id, attemptId, [{
        question_id: currentQuestion.id,
        answer: userAnswer.trim(),
        timestamp: Date.now()
      }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = async () => {
    playSound('page-turn'); // Play page turn sound
    setShowFeedback(false);
    setUserAnswer('');
    setIsSubmitting(false); // Reset submitting state
    
    // Reset word search state
    setSelectedCells([]);
    setFoundWords([]);
    setFoundWordCells([]);
    setIsSelecting(false);
    setCurrentWord('');
    
    if (currentQuestionIndex + 1 < gameData!.questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Complete the game by calling the backend
      try {
        const response = await api.post('/games/complete/', {
          attempt_id: attemptId
        });
        console.log('✅ Game completed successfully', response);
        
        // Store time and XP from backend response
        // Prefer frontend calculated time as it's more accurate for this session
        const calculatedTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : response.time_taken_seconds;
        setTimeTaken(calculatedTime || 0);
        setXpEarned(response.xp_earned || 0);
      } catch (err) {
        console.error('Error completing game:', err);
        // Fallback to calculated time if API fails
        setTimeTaken(startTime ? Math.floor((Date.now() - startTime) / 1000) : 0);
      }
      
      setIsComplete(true);
    }
  };

  // Word search helper functions
  const getCellKey = (row: number, col: number) => `${row}-${col}`;
  
  const isCellSelected = (row: number, col: number) => {
    return selectedCells.some(cell => cell.row === row && cell.col === col);
  };
  
  const isCellInFoundWord = (row: number, col: number) => {
    return foundWordCells.some(cell => cell.row === row && cell.col === col);
  };
  
  const getSelectedWord = (cells: {row: number, col: number}[], grid: string[]) => {
    return cells.map(cell => grid[cell.row][cell.col]).join('');
  };
  
  const checkIfWordFound = (word: string, wordsToFind: string[]) => {
    const upperWord = word.toUpperCase();
    const reverseWord = word.split('').reverse().join('').toUpperCase();
    
    return wordsToFind.some(target => {
      const upperTarget = target.toUpperCase();
      return upperWord === upperTarget || reverseWord === upperTarget;
    });
  };
  
  const handleCellMouseDown = (row: number, col: number) => {
    setIsSelecting(true);
    setSelectedCells([{row, col}]);
  };
  
  const handleCellMouseEnter = (row: number, col: number) => {
    if (!isSelecting) return;
    
    const lastCell = selectedCells[selectedCells.length - 1];
    if (!lastCell) return;
    
    // Check if the move is in a straight line (horizontal, vertical, or diagonal)
    const rowDiff = row - selectedCells[0].row;
    const colDiff = col - selectedCells[0].col;
    
    // If it's the first move, allow it
    if (selectedCells.length === 1) {
      setSelectedCells([...selectedCells, {row, col}]);
      return;
    }
    
    // Check if continuing in the same direction
    const firstRowDiff = selectedCells[1].row - selectedCells[0].row;
    const firstColDiff = selectedCells[1].col - selectedCells[0].col;
    
    // Normalize direction
    const dirRow = firstRowDiff === 0 ? 0 : firstRowDiff / Math.abs(firstRowDiff);
    const dirCol = firstColDiff === 0 ? 0 : firstColDiff / Math.abs(firstColDiff);
    
    // Check if new cell is in the same direction
    const expectedRow = lastCell.row + dirRow;
    const expectedCol = lastCell.col + dirCol;
    
    if (row === expectedRow && col === expectedCol) {
      // Don't add if already selected
      if (!isCellSelected(row, col)) {
        setSelectedCells([...selectedCells, {row, col}]);
      }
    }
  };
  
  const handleCellMouseUp = async (grid: string[], wordsToFind: string[]) => {
    if (!isSelecting) return;
    
    setIsSelecting(false);
    
    const word = getSelectedWord(selectedCells, grid);
    
    if (checkIfWordFound(word, wordsToFind) && !foundWords.includes(word.toUpperCase())) {
      // Word found! Add celebration
      const foundWord = word.toUpperCase();
      const newFoundWords = [...foundWords, foundWord];
      setFoundWords(newFoundWords);
      setCelebrationWord(foundWord);
      playSound('magic-sparkle'); // Play sparkle sound for found word
      
      // Add the cells to foundWordCells to keep them highlighted green
      setFoundWordCells([...foundWordCells, ...selectedCells]);
      
      // Show brief success animation and clear selection
      setTimeout(() => {
        setSelectedCells([]);
        setCelebrationWord(null);
      }, 1500);
      
      // Check if all words found
      if (newFoundWords.length === wordsToFind.length) {
        // Submit the completed word search to backend
        try {
          const currentQuestion = gameData!.questions[currentQuestionIndex];
          await api.post('/games/submit_answer/', {
            attempt_id: attemptId,
            question_id: currentQuestion.id,
            answer: newFoundWords.join(',') // Submit all found words
          });
          
          // Now complete the game
          const response = await api.post('/games/complete/', {
            attempt_id: attemptId
          });
          console.log('✅ Word search game completed successfully', response);
          
          // Store time and XP from backend response
          // Prefer frontend calculated time as it's more accurate for this session
          const calculatedTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : response.time_taken_seconds;
          setTimeTaken(calculatedTime || 0);
          setXpEarned(response.xp_earned || 0);
          
          // Show completion screen after a delay
          setTimeout(() => {
            setIsComplete(true);
          }, 2000);
        } catch (err) {
          console.error('Error submitting word search completion:', err);
          // Fallback to calculated time if API fails
          setTimeTaken(startTime ? Math.floor((Date.now() - startTime) / 1000) : 0);
          // Still show completion even if submission fails
          setTimeout(() => {
            setIsComplete(true);
          }, 2000);
        }
      }
    } else {
      // Not a valid word, clear selection
      setSelectedCells([]);
    }
  };
  
  const handleCellTouchStart = (e: React.TouchEvent, row: number, col: number) => {
    // Note: touchAction: 'none' in CSS handles scroll prevention
    e.stopPropagation();
    handleCellMouseDown(row, col);
  };
  
  const handleCellTouchMove = (e: React.TouchEvent, grid: string[]) => {
    // Note: touchAction: 'none' in CSS handles scroll prevention
    e.stopPropagation();
    
    const touch = e.touches[0];
    if (!touch) return;
    
    // Use a more reliable method to get the element under touch
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    const cellElement = elements.find(el => el.classList.contains('word-search-cell'));
    
    if (cellElement) {
      const row = parseInt(cellElement.getAttribute('data-row') || '0');
      const col = parseInt(cellElement.getAttribute('data-col') || '0');
      
      // Only update if we're moving to a different cell
      const lastCell = selectedCells[selectedCells.length - 1];
      if (!lastCell || lastCell.row !== row || lastCell.col !== col) {
        handleCellMouseEnter(row, col);
      }
    }
  };
  
  const handleCellTouchEnd = (e: React.TouchEvent, grid: string[], wordsToFind: string[]) => {
    e.preventDefault();
    e.stopPropagation();
    handleCellMouseUp(grid, wordsToFind);
  };

  const handleBackToStory = () => {
    // Navigate back to the story games page
    const storyId = location.state?.storyId || gameData?.story_id;
    if (storyId) {
      // Use React Router navigate instead of window.location.href
      // This prevents asset loading issues in Capacitor
      navigate(`/games/story/${storyId}`);
    } else {
      // Fallback: go to games list
      navigate('/games');
    }
  };

  if (loading) {
    return (
      <div className="gameplay-loading">
        <p>Loading game...</p>
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div className="gameplay-error-page">
        <div className="error-box">
          {error || 'Game not found'}
        </div>
        <button onClick={() => navigate('/games')} className="btn-back">Back to Games</button>
      </div>
    );
  }

  if (isComplete) {
    // Calculate completion for word search
    const isWordSearchComplete = gameData.game_type === 'word_search' && foundWords.length > 0;
    const percentage = isWordSearchComplete ? 100 : Math.round((score / gameData.questions.length) * 100);
    
    return (
      <div className="completion-screen">
        <div className="completion-container">
          <h1 className="completion-emoji">
            {isWordSearchComplete || percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '💪'}
          </h1>
          <h2 className="completion-title">Game Complete!</h2>
          {isWordSearchComplete ? (
            <div className="completion-message">
              <p className="message-primary">
                🌟 All Words Found! 🌟
              </p>
              <p className="message-secondary">
                You found all {foundWords.length} words!
              </p>
            </div>
          ) : (
            <p className="completion-score">
              Score: {score} / {gameData.questions.length} ({percentage}%)
            </p>
          )}
          
          {/* Stats Cards */}
          <div className="stats-grid">
            {/* Time Taken Card */}
            <div className="stat-card stat-card-time">
              <div className="stat-icon">⏱️</div>
              <div className="stat-label">Time Taken</div>
              <div className="stat-value">
                {(() => {
                  const hours = Math.floor(timeTaken / 3600);
                  const minutes = Math.floor((timeTaken % 3600) / 60);
                  const seconds = timeTaken % 60;
                  
                  if (hours > 0) {
                    return `${hours}h ${minutes}m ${seconds}s`;
                  } else if (minutes > 0) {
                    return `${minutes}m ${seconds}s`;
                  } else {
                    return `${seconds}s`;
                  }
                })()}
              </div>
            </div>
            
            {/* XP Earned Card */}
            <div className="stat-card stat-card-xp">
              <div className="stat-icon">✨</div>
              <div className="stat-label">XP Earned</div>
              <div className="stat-value">
                +{xpEarned} XP
              </div>
            </div>
            
            {/* Accuracy Card */}
            <div className={`stat-card stat-card-accuracy ${percentage >= 80 ? 'high' : percentage >= 60 ? 'medium' : 'low'}`}>
              <div className="stat-icon">
                {percentage >= 80 ? '🎯' : percentage >= 60 ? '👍' : '💪'}
              </div>
              <div className="stat-label">Accuracy</div>
              <div className="stat-value">
                {percentage}%
              </div>
            </div>
          </div>
          
          <div className="completion-buttons">
            <button 
              onClick={() => {
                playButtonClick();
                handleBackToStory();
              }}
              className="btn-back-to-story"
            >
              Back to Story Games
            </button>
            <button 
              onClick={async () => {
                playButtonClick();
                try {
                  await api.post(`/games/${gameId}/clear_incomplete/`);
                } catch (err) {
                  console.error('Error clearing attempt:', err);
                }
                window.location.reload();
              }}
              className="btn-play-again"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = gameData.questions[currentQuestionIndex];
  const isWordSearch = gameData.game_type === 'word_search';
  
  // Parse word search data
  const wordSearchGrid = isWordSearch && currentQuestion.options ? currentQuestion.options : [];
  
  // Extract words from context field (format: "Words to find: word1, word2, word3")
  let wordsToFind: string[] = [];
  if (isWordSearch && currentQuestion.context) {
    const match = currentQuestion.context.match(/Words to find:\s*(.+)/);
    if (match) {
      wordsToFind = match[1].split(',').map(word => word.trim());
    }
  }
  
  console.log('🎮 Game type:', gameData.game_type);
  console.log('🎮 Is word search:', isWordSearch);
  console.log('🎮 Current question:', currentQuestion);
  console.log('🎮 Current question JSON:', JSON.stringify(currentQuestion, null, 2));
  console.log('🎮 Question properties:', {
    id: currentQuestion?.id,
    question_text: currentQuestion?.question_text,
    options: currentQuestion?.options,
    optionsLength: currentQuestion?.options?.length,
    context: currentQuestion?.context,
    hint: currentQuestion?.hint,
    allKeys: currentQuestion ? Object.keys(currentQuestion) : []
  });
  console.log('🎮 Words to find:', wordsToFind);
  console.log('🎮 Grid:', wordSearchGrid);

  return (
    <div style={{ 
      paddingTop: '20px',
      paddingLeft: '20px',
      paddingRight: '20px',
      paddingBottom: '140px', // Increased from 100px to ensure content clears bottom nav
      minHeight: '100vh',
      background: isDarkMode 
        ? 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%)'
        : 'linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 50%, #ffffff 100%)',
      overflowY: 'auto' // Ensure scrolling is enabled
    }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <button 
          onClick={() => {
            playButtonClick();
            handleBackToStory();
          }}
          style={{ 
            padding: '12px 24px',
            marginBottom: '20px',
            cursor: 'pointer',
            border: isDarkMode ? '2px solid #4a6fa5' : '2px solid #3b82f6',
            borderRadius: '10px',
            background: isDarkMode 
              ? 'linear-gradient(135deg, #2d3748 0%, #1e293b 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
            color: isDarkMode ? '#93c5fd' : '#1e40af',
            fontWeight: '700',
            boxShadow: isDarkMode 
              ? '0 4px 12px rgba(59, 130, 246, 0.3)'
              : '0 4px 12px rgba(59, 130, 246, 0.15)',
            transition: 'all 0.3s ease'
          }}
        >
          ← Back
        </button>
        <h2 style={{ color: isDarkMode ? '#e2e8f0' : '#1f2937' }}>{gameData.game_type_display}</h2>
        {!isWordSearch && <p style={{ color: isDarkMode ? '#cbd5e0' : '#4b5563' }}>Question {currentQuestionIndex + 1} of {gameData.questions.length}</p>}
        <p style={{ color: isDarkMode ? '#cbd5e0' : '#4b5563' }}>Score: {score}</p>
      </div>

      {/* Celebration Animation */}
      {celebrationWord && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '35px 55px',
          borderRadius: '24px',
          fontSize: '36px',
          fontWeight: 'bold',
          zIndex: 1000,
          boxShadow: '0 20px 60px rgba(16, 185, 129, 0.6), 0 0 0 4px rgba(255,255,255,0.3)',
          animation: 'celebrationPop 1.5s ease-out',
          border: '4px solid #fff',
          textShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>✨ 🎉 ✨</div>
            <div>Found: {celebrationWord}!</div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes celebrationPop {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
      `}</style>

      {isWordSearch ? (
        /* Word Search Grid */
        <div>
          {/* Words to Find */}
          <div style={{ 
            marginBottom: '20px',
            padding: '18px',
            background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 50%, #e0e7ff 100%)',
            borderRadius: '16px',
            border: '3px solid #3b82f6',
            boxShadow: '0 8px 20px rgba(59, 130, 246, 0.25), inset 0 2px 0 rgba(255,255,255,0.5)'
          }}>
            <h3 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '20px', 
              fontWeight: '700',
              background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              🔍 Words to Find ({foundWords.length}/{wordsToFind.length}):
            </h3>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '10px' 
            }}>
              {wordsToFind.map((word, idx) => {
                const isFound = foundWords.some(fw => fw.toUpperCase() === word.toUpperCase());
                return (
                  <span 
                    key={idx}
                    style={{
                      padding: '10px 18px',
                      background: isFound 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                        : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      borderRadius: '25px',
                      fontSize: '16px',
                      fontWeight: '700',
                      textDecoration: isFound ? 'line-through' : 'none',
                      opacity: isFound ? 0.8 : 1,
                      transition: 'all 0.3s ease',
                      boxShadow: isFound 
                        ? '0 4px 12px rgba(16, 185, 129, 0.4)' 
                        : '0 4px 12px rgba(59, 130, 246, 0.4)',
                      textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                    }}
                  >
                    {isFound ? '✓ ' : ''}{word}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Word Search Grid */}
          <div style={{ 
            border: '3px solid #e5e7eb',
            borderRadius: '16px',
            padding: '18px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
            overflow: isSelecting ? 'hidden' : 'auto',
            maxHeight: '70vh',
            touchAction: isSelecting ? 'none' : 'pan-y pan-x',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start'
          }}>
            <div 
              style={{ 
                display: 'grid',
                gridTemplateColumns: `repeat(${wordSearchGrid[0]?.length || 12}, 1fr)`,
                gap: '6px',
                width: '100%',
                maxWidth: '600px',
                aspectRatio: '1 / 1',
                fontSize: '14px',
                touchAction: 'none'
              }}
              onMouseUp={() => handleCellMouseUp(wordSearchGrid, wordsToFind)}
              onMouseLeave={() => {
                setIsSelecting(false);
              }}
              onTouchEnd={(e) => handleCellTouchEnd(e, wordSearchGrid, wordsToFind)}
            >
              {wordSearchGrid.map((row: string, rowIndex: number) => (
                row.split('').map((letter: string, colIndex: number) => {
                  const isSelected = isCellSelected(rowIndex, colIndex);
                  const isInFoundWord = isCellInFoundWord(rowIndex, colIndex);
                  
                  // Priority: selected (yellow) > found word (green) > default (white)
                  let backgroundColor = '#fff';
                  let borderColor = '#d1d5db';
                  let textColor = '#1f2937';
                  let borderWidth = '2px';
                  let boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                  
                  if (isInFoundWord) {
                    backgroundColor = '#d1fae5'; // Bright green
                    borderColor = '#10b981';
                    textColor = '#065f46';
                    borderWidth = '3px';
                    boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255,255,255,0.5)';
                  }
                  
                  if (isSelected) {
                    backgroundColor = '#fef3c7'; // Bright yellow (current selection takes priority)
                    borderColor = '#f59e0b';
                    textColor = '#92400e';
                    borderWidth = '3px';
                    boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255,255,255,0.5)';
                  }
                  
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className="word-search-cell"
                      data-row={rowIndex}
                      data-col={colIndex}
                      onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                      onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                      onTouchStart={(e) => handleCellTouchStart(e, rowIndex, colIndex)}
                      onTouchMove={(e) => handleCellTouchMove(e, wordSearchGrid)}
                      style={{
                        width: '100%',
                        height: '100%',
                        minHeight: '32px',
                        minWidth: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor,
                        border: `${borderWidth} solid ${borderColor}`,
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: 'clamp(16px, 2.5vw, 22px)',
                        cursor: 'pointer',
                        userSelect: 'none',
                        touchAction: 'none',
                        transition: 'all 0.2s ease',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        boxShadow,
                        color: textColor,
                        textShadow: isInFoundWord || isSelected ? '0 1px 2px rgba(0,0,0,0.15)' : 'none',
                        lineHeight: '1',
                        padding: '4px',
                        aspectRatio: '1 / 1',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                      }}
                    >
                      {letter}
                    </div>
                  );
                })
              ))}
            </div>
          </div>

          {/* Instructions and Hint */}
          <div style={{ 
            marginTop: '15px',
            padding: '12px',
            backgroundColor: '#e0f2fe',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#0c4a6e',
            border: '1px solid #7dd3fc'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>📱 How to Play:</div>
            <div>Tap and drag across letters to select words. Release to check!</div>
          </div>
          
          {currentQuestion.hint && (
            <div style={{ 
              marginTop: '10px',
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#92400e',
              border: '1px solid #fde047'
            }}>
              💡 {currentQuestion.hint}
            </div>
          )}
          
          {/* Current Selection Display */}
          {selectedCells.length > 0 && (
            <div style={{
              marginTop: '10px',
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '18px',
              color: '#92400e',
              border: '2px solid #f59e0b',
              letterSpacing: '2px'
            }}>
              {getSelectedWord(selectedCells, wordSearchGrid)}
            </div>
          )}
        </div>
      ) : (
        /* Regular Question */
        <div style={{ 
          border: isDarkMode ? '3px solid #7c3aed' : '3px solid #a855f7',
          borderRadius: '20px',
          padding: '35px',
          marginBottom: '25px',
          background: isDarkMode
            ? 'linear-gradient(135deg, #1e1b2e 0%, #2d1b3d 50%, #3a2647 100%)'
            : 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #e9d5ff 100%)',
          boxShadow: isDarkMode
            ? '0 10px 30px rgba(124, 58, 237, 0.4)'
            : '0 10px 30px rgba(168, 85, 247, 0.2), inset 0 2px 0 rgba(255,255,255,0.6)'
        }}>
          <h3 style={{ 
            marginBottom: '30px', 
            fontSize: '26px',
            fontWeight: '800',
            color: isDarkMode ? '#c4b5fd' : '#6b21a8',
            textShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
            lineHeight: '1.4'
          }}>
            {currentQuestion.question_text}
          </h3>

          {/* Answer Input or Options */}
          {currentQuestion.options && currentQuestion.options.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {currentQuestion.options.map((option, index) => {
                const isSelected = userAnswer === option;
                const colors = [
                  { bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', border: '#3b82f6', shadow: 'rgba(59, 130, 246, 0.3)' },
                  { bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', border: '#10b981', shadow: 'rgba(16, 185, 129, 0.3)' },
                  { bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '#f59e0b', shadow: 'rgba(245, 158, 11, 0.3)' },
                  { bg: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', border: '#ec4899', shadow: 'rgba(236, 72, 153, 0.3)' }
                ];
                const color = colors[index % colors.length];
                
                return (
                  <button
                    key={index}
                    onClick={() => {
                      playButtonClick();
                      setUserAnswer(option);
                    }}
                    disabled={showFeedback}
                    style={{
                      padding: '22px 28px',
                      textAlign: 'left',
                      cursor: showFeedback ? 'default' : 'pointer',
                      border: isSelected ? `4px solid ${color.border}` : `3px solid ${color.border}`,
                      borderRadius: '16px',
                      background: isSelected ? color.bg : (isDarkMode ? '#2d3748' : 'white'),
                      fontSize: '20px',
                      fontWeight: '700',
                      color: isSelected ? '#1f2937' : (isDarkMode ? '#e2e8f0' : '#1f2937'),
                      transition: 'all 0.3s ease',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: isSelected 
                        ? `0 8px 20px ${color.shadow}, inset 0 2px 0 rgba(255,255,255,0.5)` 
                        : `0 4px 12px ${color.shadow}`,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <span style={{
                      display: 'inline-block',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: color.border,
                      color: 'white',
                      textAlign: 'center',
                      lineHeight: '36px',
                      marginRight: '15px',
                      fontWeight: '800',
                      fontSize: '18px',
                      boxShadow: `0 2px 8px ${color.shadow}`
                    }}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
          ) : (
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={showFeedback}
              placeholder="Type your answer here..."
              style={{
                width: '100%',
                padding: '20px 24px',
                fontSize: '22px',
                fontWeight: '600',
                border: isDarkMode ? '3px solid #059669' : '3px solid #10b981',
                borderRadius: '16px',
                background: isDarkMode
                  ? 'linear-gradient(135deg, #1f2937 0%, #1e3a2e 100%)'
                  : 'linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)',
                color: isDarkMode ? '#e2e8f0' : '#1f2937',
                boxShadow: isDarkMode
                  ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                  : '0 4px 12px rgba(16, 185, 129, 0.2), inset 0 2px 0 rgba(255,255,255,0.5)',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.border = '4px solid #10b981';
                e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4), inset 0 2px 0 rgba(255,255,255,0.5)';
                e.target.style.transform = 'scale(1.01)';
              }}
              onBlur={(e) => {
                e.target.style.border = '3px solid #10b981';
                e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2), inset 0 2px 0 rgba(255,255,255,0.5)';
                e.target.style.transform = 'scale(1)';
              }}
            />
          )}
        </div>
      )}

      {/* Feedback */}
      {showFeedback && (
        <div style={{
          padding: '25px 30px',
          marginBottom: '25px',
          borderRadius: '20px',
          background: isDarkMode
            ? (isCorrect 
                ? 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)' 
                : 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)')
            : (isCorrect 
                ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' 
                : 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)'),
          border: isCorrect 
            ? (isDarkMode ? '4px solid #059669' : '4px solid #10b981')
            : (isDarkMode ? '4px solid #dc2626' : '4px solid #ef4444'),
          boxShadow: isCorrect 
            ? (isDarkMode ? '0 10px 30px rgba(16, 185, 129, 0.4)' : '0 10px 30px rgba(16, 185, 129, 0.3)')
            : (isDarkMode ? '0 10px 30px rgba(239, 68, 68, 0.4)' : '0 10px 30px rgba(239, 68, 68, 0.3)')
        }}>
          <p style={{ 
            fontSize: '24px', 
            fontWeight: '800', 
            margin: '0 0 10px 0',
            color: isDarkMode
              ? (isCorrect ? '#6ee7b7' : '#fca5a5')
              : (isCorrect ? '#065f46' : '#7f1d1d'),
            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}>
            {isCorrect ? '✅ Correct! Great Job! 🎉' : '❌ Not Quite Right'}
          </p>
          {!isCorrect && correctAnswer && (
            <p style={{ 
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: isDarkMode ? '#fecaca' : '#991b1b'
            }}>
              The correct answer is: <strong style={{ 
                fontSize: '20px',
                background: isDarkMode ? '#1f2937' : '#ffffff',
                color: isDarkMode ? '#fbbf24' : '#92400e',
                padding: '4px 12px',
                borderRadius: '8px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}>{correctAnswer}</strong>
            </p>
          )}
        </div>
      )}

      {/* Action Button */}
      <div style={{ textAlign: 'center' }}>
        {!showFeedback ? (
          <button
            onClick={() => {
              playButtonClick();
              handleSubmitAnswer();
            }}
            disabled={!userAnswer.trim() || isSubmitting}
            style={{
              padding: '15px 40px',
              fontSize: '18px',
              cursor: (userAnswer.trim() && !isSubmitting) ? 'pointer' : 'not-allowed',
              border: 'none',
              borderRadius: '8px',
              background: (userAnswer.trim() && !isSubmitting) 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                : '#ccc',
              boxShadow: (userAnswer.trim() && !isSubmitting) 
                ? '0 6px 16px rgba(16, 185, 129, 0.4)' 
                : 'none',
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            style={{
              padding: '15px 40px',
              fontSize: '18px',
              cursor: 'pointer',
              border: 'none',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)',
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            {currentQuestionIndex + 1 < gameData.questions.length ? 'Next Question' : 'View Results'}
          </button>
        )}
      </div>
    </div>
  );
};

export default GamePlayPage;
