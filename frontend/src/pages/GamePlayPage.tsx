import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

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
  const [startTime] = useState(Date.now());
  
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
  }, [gameId]);

  const fetchGame = async () => {
    try {
      setLoading(true);
      
      // Check if we should force a new game
      const forceNew = location.state?.forceNew || false;
      console.log('🎮 Starting game with forceNew:', forceNew);
      console.log('🎮 Location state:', location.state);
      
      const response = await api.post(`/games/${gameId}/start_game/`, {
        force_new: forceNew
      });
      
      console.log('🎮 Game response:', response);
      console.log('🎮 Is resume:', response.is_resume);
      console.log('🎮 Current score:', response.current_score);
      console.log('🎮 Answered count:', response.answered_count);
      
      // Transform the response to match our GameData interface
      const transformedData: GameData = {
        id: parseInt(gameId!),
        game_type: response.game_type,
        game_type_display: response.game_type,
        story_id: 0, // Will be populated if needed
        story_title: '', // Will be populated if needed
        questions: response.questions.map((q: any) => ({
          id: q.id,
          question_text: q.question_text,
          options: q.options,
          correct_answer: '', // Don't reveal answer yet
          context: q.context, // Include context for word search
          hint: q.hint // Include hint
        }))
      };
      
      setGameData(transformedData);
      setAttemptId(response.attempt_id);
      
      // If resuming, set the current score and find first unanswered question
      if (response.is_resume) {
        setScore(response.current_score);
        
        // Find first unanswered question
        const firstUnanswered = response.questions.findIndex((q: any) => !q.is_answered);
        if (firstUnanswered !== -1) {
          setCurrentQuestionIndex(firstUnanswered);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error starting game:', err);
      setError('Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!gameData || !userAnswer.trim() || !attemptId || isSubmitting) return;

    const currentQuestion = gameData.questions[currentQuestionIndex];
    
    setIsSubmitting(true);
    try {
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
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = async () => {
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
        setTimeTaken(response.time_taken_seconds || Math.floor((Date.now() - startTime) / 1000));
        setXpEarned(response.xp_earned || 0);
      } catch (err) {
        console.error('Error completing game:', err);
        // Fallback to calculated time if API fails
        setTimeTaken(Math.floor((Date.now() - startTime) / 1000));
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
          setTimeTaken(response.time_taken_seconds || Math.floor((Date.now() - startTime) / 1000));
          setXpEarned(response.xp_earned || 0);
          
          // Show completion screen after a delay
          setTimeout(() => {
            setIsComplete(true);
          }, 2000);
        } catch (err) {
          console.error('Error submitting word search completion:', err);
          // Fallback to calculated time if API fails
          setTimeTaken(Math.floor((Date.now() - startTime) / 1000));
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
    handleCellMouseDown(row, col);
  };
  
  const handleCellTouchMove = (e: React.TouchEvent, grid: string[]) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element && element.classList.contains('word-search-cell')) {
      const row = parseInt(element.getAttribute('data-row') || '0');
      const col = parseInt(element.getAttribute('data-col') || '0');
      handleCellMouseEnter(row, col);
    }
  };
  
  const handleCellTouchEnd = (grid: string[], wordsToFind: string[]) => {
    handleCellMouseUp(grid, wordsToFind);
  };

  const handleBackToStory = () => {
    // Navigate back to the story games page
    const storyId = location.state?.storyId;
    if (storyId) {
      // Force a full page reload to refresh the data
      window.location.href = `/games/story/${storyId}`;
    } else {
      // Fallback: just go back
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', minHeight: '100vh', backgroundColor: '#ffffff' }}>
        <p>Loading game...</p>
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div style={{ 
        padding: '20px', 
        minHeight: '100vh', 
        backgroundColor: '#ffffff' 
      }}>
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {error || 'Game not found'}
        </div>
        <button onClick={() => navigate('/games')}>Back to Games</button>
      </div>
    );
  }

  if (isComplete) {
    // Calculate completion for word search
    const isWordSearchComplete = gameData.game_type === 'word_search' && foundWords.length > 0;
    const percentage = isWordSearchComplete ? 100 : Math.round((score / gameData.questions.length) * 100);
    
    return (
      <div style={{ 
        padding: '20px', 
        minHeight: '100vh', 
        backgroundColor: '#ffffff',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '60px' }}>
          <h1 style={{ fontSize: '48px', margin: '20px 0' }}>
            {isWordSearchComplete || percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '💪'}
          </h1>
          <h2>Game Complete!</h2>
          {isWordSearchComplete ? (
            <div>
              <p style={{ fontSize: '24px', margin: '20px 0', color: '#10b981', fontWeight: 'bold' }}>
                🌟 All Words Found! 🌟
              </p>
              <p style={{ fontSize: '18px', color: '#059669' }}>
                You found all {foundWords.length} words!
              </p>
            </div>
          ) : (
            <p style={{ fontSize: '24px', margin: '20px 0' }}>
              Score: {score} / {gameData.questions.length} ({percentage}%)
            </p>
          )}
          
          {/* Stats Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px',
            marginTop: '30px',
            marginBottom: '30px'
          }}>
            {/* Time Taken Card */}
            <div style={{
              padding: '20px',
              backgroundColor: '#f0f9ff',
              borderRadius: '12px',
              border: '2px solid #3b82f6'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏱️</div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Time Taken</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>
                {Math.floor(timeTaken / 60)}:{String(timeTaken % 60).padStart(2, '0')}
              </div>
            </div>
            
            {/* XP Earned Card */}
            <div style={{
              padding: '20px',
              backgroundColor: '#fef3c7',
              borderRadius: '12px',
              border: '2px solid #f59e0b'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>✨</div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>XP Earned</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#92400e' }}>
                +{xpEarned} XP
              </div>
            </div>
            
            {/* Accuracy Card */}
            <div style={{
              padding: '20px',
              backgroundColor: percentage >= 80 ? '#dcfce7' : percentage >= 60 ? '#fef3c7' : '#fee2e2',
              borderRadius: '12px',
              border: `2px solid ${percentage >= 80 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444'}`
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                {percentage >= 80 ? '🎯' : percentage >= 60 ? '👍' : '💪'}
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Accuracy</div>
              <div style={{ 
                fontSize: '20px', 
                fontWeight: 'bold',
                color: percentage >= 80 ? '#065f46' : percentage >= 60 ? '#92400e' : '#991b1b'
              }}>
                {percentage}%
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '30px' }}>
            <button 
              onClick={handleBackToStory}
              style={{ 
                padding: '12px 24px',
                cursor: 'pointer',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9'
              }}
            >
              Back to Story Games
            </button>
            <button 
              onClick={async () => {
                // First, delete the current attempt to force a new one
                try {
                  await api.post(`/games/${gameId}/clear_incomplete/`);
                } catch (err) {
                  console.error('Error clearing attempt:', err);
                }
                // Then reload to start fresh
                window.location.reload();
              }}
              style={{ 
                padding: '12px 24px',
                cursor: 'pointer',
                border: '1px solid #4CAF50',
                borderRadius: '8px',
                backgroundColor: '#4CAF50',
                color: 'white'
              }}
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
  console.log('🎮 Words to find:', wordsToFind);
  console.log('🎮 Grid:', wordSearchGrid);

  return (
    <div style={{ 
      paddingTop: '20px',
      paddingLeft: '20px',
      paddingRight: '20px',
      paddingBottom: '100px',
      minHeight: '100vh',
      backgroundColor: '#ffffff'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <button 
          onClick={handleBackToStory}
          style={{ 
            padding: '10px 20px',
            marginBottom: '20px',
            cursor: 'pointer',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#f9f9f9'
          }}
        >
          ← Back
        </button>
        <h2>{gameData.game_type_display}</h2>
        {!isWordSearch && <p>Question {currentQuestionIndex + 1} of {gameData.questions.length}</p>}
        <p>Score: {score}</p>
      </div>

      {/* Celebration Animation */}
      {celebrationWord && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(16, 185, 129, 0.95)',
          color: 'white',
          padding: '30px 50px',
          borderRadius: '20px',
          fontSize: '32px',
          fontWeight: 'bold',
          zIndex: 1000,
          boxShadow: '0 10px 40px rgba(16, 185, 129, 0.5)',
          animation: 'celebrationPop 1.5s ease-out',
          border: '3px solid #fff'
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
            padding: '15px',
            backgroundColor: '#f0f9ff',
            borderRadius: '12px',
            border: '2px solid #3b82f6'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#1e40af' }}>
              🔍 Words to Find ({foundWords.length}/{wordsToFind.length}):
            </h3>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '8px' 
            }}>
              {wordsToFind.map((word, idx) => {
                const isFound = foundWords.some(fw => fw.toUpperCase() === word.toUpperCase());
                return (
                  <span 
                    key={idx}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: isFound ? '#10b981' : '#3b82f6',
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      textDecoration: isFound ? 'line-through' : 'none',
                      opacity: isFound ? 0.7 : 1,
                      transition: 'all 0.3s ease'
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
            border: '2px solid #ddd',
            borderRadius: '12px',
            padding: '15px',
            backgroundColor: '#f9f9f9',
            overflow: 'hidden',
            touchAction: 'none',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div 
              style={{ 
                display: 'grid',
                gridTemplateColumns: `repeat(${wordSearchGrid[0]?.length || 12}, 1fr)`,
                gap: '4px',
                width: '100%',
                maxWidth: '600px',
                aspectRatio: '1 / 1',
                fontSize: '14px'
              }}
              onMouseUp={() => handleCellMouseUp(wordSearchGrid, wordsToFind)}
              onMouseLeave={() => {
                setIsSelecting(false);
              }}
              onTouchEnd={() => handleCellTouchEnd(wordSearchGrid, wordsToFind)}
            >
              {wordSearchGrid.map((row: string, rowIndex: number) => (
                row.split('').map((letter: string, colIndex: number) => {
                  const isSelected = isCellSelected(rowIndex, colIndex);
                  const isInFoundWord = isCellInFoundWord(rowIndex, colIndex);
                  
                  // Priority: selected (yellow) > found word (green) > default (white)
                  let backgroundColor = '#fff';
                  let borderColor = '#ddd';
                  let textColor = '#000';
                  let borderWidth = '1px';
                  
                  if (isInFoundWord) {
                    backgroundColor = '#86efac'; // Light green
                    borderColor = '#10b981'; // Green border
                    textColor = '#064e3b'; // Dark green text
                    borderWidth = '2px';
                  }
                  
                  if (isSelected) {
                    backgroundColor = '#fbbf24'; // Yellow (current selection takes priority)
                    borderColor = '#f59e0b';
                    textColor = '#92400e';
                    borderWidth = '2px';
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
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: backgroundColor,
                        border: `${borderWidth} solid ${borderColor}`,
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: 'clamp(14px, 2vw, 20px)',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'all 0.15s ease',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        boxShadow: isSelected ? '0 2px 8px rgba(245, 158, 11, 0.3)' : 
                                   isInFoundWord ? '0 1px 3px rgba(16, 185, 129, 0.2)' : 'none',
                        color: textColor,
                        lineHeight: '1',
                        padding: '0',
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
          border: '2px solid #ddd',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '20px',
          backgroundColor: '#f9f9f9'
        }}>
          <h3 style={{ marginBottom: '20px', fontSize: '20px' }}>
            {currentQuestion.question_text}
          </h3>

          {/* Answer Input or Options */}
          {currentQuestion.options && currentQuestion.options.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setUserAnswer(option)}
                  disabled={showFeedback}
                  style={{
                    padding: '15px',
                    textAlign: 'left',
                    cursor: showFeedback ? 'default' : 'pointer',
                    border: userAnswer === option ? '2px solid #4CAF50' : '1px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: userAnswer === option ? '#e8f5e9' : 'white',
                    fontSize: '16px'
                  }}
                >
                  {option}
                </button>
              ))}
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
                padding: '15px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '8px'
              }}
            />
          )}
        </div>
      )}

      {/* Feedback */}
      {showFeedback && (
        <div style={{
          padding: '20px',
          marginBottom: '20px',
          borderRadius: '8px',
          backgroundColor: isCorrect ? '#e8f5e9' : '#ffebee',
          border: `2px solid ${isCorrect ? '#4CAF50' : '#f44336'}`
        }}>
          <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
            {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
          </p>
          {!isCorrect && correctAnswer && (
            <p style={{ margin: 0 }}>
              The correct answer is: <strong>{correctAnswer}</strong>
            </p>
          )}
        </div>
      )}

      {/* Action Button */}
      <div style={{ textAlign: 'center' }}>
        {!showFeedback ? (
          <button
            onClick={handleSubmitAnswer}
            disabled={!userAnswer.trim() || isSubmitting}
            style={{
              padding: '15px 40px',
              fontSize: '18px',
              cursor: (userAnswer.trim() && !isSubmitting) ? 'pointer' : 'not-allowed',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: (userAnswer.trim() && !isSubmitting) ? '#4CAF50' : '#ccc',
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
              backgroundColor: '#2196F3',
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
