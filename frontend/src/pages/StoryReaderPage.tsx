import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  EllipsisVerticalIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CheckIcon,
  ArrowsUpDownIcon,
  ArrowsRightLeftIcon,
  PencilIcon,
  ShareIcon,
  HeartIcon,
  BookmarkIcon,
  ChatBubbleLeftIcon,
  EyeIcon,
  TrashIcon,
  CloudArrowDownIcon,
  DocumentArrowDownIcon,
  PuzzlePieceIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { useThemeStore } from '../stores/themeStore';
import { useStoryStore, Story } from '../stores/storyStore';
import { useAuthStore } from '../stores/authStore';
import { storyApiService } from '../services/storyApiService';
import { storyInteractionService, Comment } from '../services/storyInteraction.service';
import { TTSControls } from '../components/common/TTSControls';
import ConfirmationModal from '../components/common/ConfirmationModal';
import pdfExportService from '../services/pdfExportService';
import { useSoundEffects } from '../hooks/useSoundEffects';
import api from '../services/api';
import './StoryReaderPage.css';

type ReadingMode = 'verticalScroll' | 'leftToRight';

const StoryReaderPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { storyId } = useParams<{ storyId: string }>();
  const { isDarkMode } = useThemeStore();
  const { getStory, getCanvasData, saveStoryOffline, removeOfflineStory, isStorySavedOffline } = useStoryStore();
  const { user } = useAuthStore();
  const { playSound, playPageTurn, playSuccess, playButtonClick } = useSoundEffects();
  const [readingMode, setReadingMode] = useState<ReadingMode>('verticalScroll');
  const [currentPage, setCurrentPage] = useState(0);
  const [showViewControls, setShowViewControls] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedOffline, setIsSavedOffline] = useState(false);
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storyAuthor, setStoryAuthor] = useState<string>('');
  const [backendStoryId, setBackendStoryId] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isOwnStory, setIsOwnStory] = useState(false); // Track if current user owns this story
  const [openCommentMenuId, setOpenCommentMenuId] = useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const horizontalCardRef = React.useRef<HTMLDivElement>(null);
  
  // Games state
  const [hasGames, setHasGames] = useState(false);
  const [gamesCount, setGamesCount] = useState(0);
  const [isGeneratingGames, setIsGeneratingGames] = useState(false);
  const [canGenerateGames, setCanGenerateGames] = useState(false);
  
  // Load story from local store or backend API
  useEffect(() => {
    const loadStory = async () => {
      if (!storyId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      // First, try to fetch from backend if user is authenticated
      // This ensures we get the backend ID for published stories
      let backendFetchSucceeded = false;
      if (user) {
        try {
          console.log('🔍 Attempting to fetch story from backend:', storyId);
          const apiStory = await storyApiService.getStory(storyId);
          
          const convertedStory = storyApiService.convertFromApiFormat(apiStory);
          console.log('✅ Loaded story from backend:', convertedStory.title);
          
          setStory(convertedStory);
          const authorDisplay = apiStory.is_collaborative && apiStory.authors_names && apiStory.authors_names.length > 0
            ? apiStory.authors_names.join(', ')
            : (apiStory.author_name || 'Anonymous');
          setStoryAuthor(authorDisplay);
          
          const storyIdToUse = apiStory.id?.toString() || storyId;
          setBackendStoryId(storyIdToUse);
          console.log('📝 Backend story ID set:', storyIdToUse);
          
          // Check if current user is the author
          const authorId = apiStory.author?.id;
          const currentUserId = user?.id?.toString();
          setIsOwnStory(authorId === currentUserId);
          
          // Set interaction counts from API response
          setLikeCount(apiStory.likes_count || 0);
          setCommentCount(apiStory.comments_count || 0);
          setSaveCount(apiStory.saved_count || 0);
          setViewCount(apiStory.views || 0);
          setIsLiked(apiStory.is_liked_by_user || false);
          setIsSaved(apiStory.is_saved_by_user || false);
          setIsSavedOffline(isStorySavedOffline(storyId));
          
          backendFetchSucceeded = true;
          setIsLoading(false);
          return;
        } catch (error) {
          console.log('⚠️ Backend fetch failed, trying local store:', error);
        }
      }
      
      // Fallback: try to get from local store if backend fetch failed or user not logged in
      if (!backendFetchSucceeded) {
        const localStory = getStory(storyId);
        if (localStory) {
          console.log('📖 Loaded story from local store:', localStory.title);
          setStory(localStory);
          setStoryAuthor(user?.username || 'You');
          setIsOwnStory(true); // Local stories are always owned by current user
          setIsSavedOffline(isStorySavedOffline(storyId));
          setIsLoading(false);
          return;
        }
      }
      
      // If not in local store, fetch from backend API
      try {
        console.log('🔍 Fetching story from backend:', storyId);
        const apiStory = await storyApiService.getStory(storyId);
        console.log('📦 Raw API response:', apiStory);
        console.log('📋 API story fields:', {
          id: apiStory.id,
          title: apiStory.title,
          author_name: apiStory.author_name,
          summary: apiStory.summary,
          content: apiStory.content?.substring(0, 100),
          canvas_data: apiStory.canvas_data ? 'exists' : 'null'
        });
        
        const convertedStory = storyApiService.convertFromApiFormat(apiStory);
        console.log('✅ Converted story:', {
          id: convertedStory.id,
          title: convertedStory.title,
          pages: convertedStory.pages.length,
          author: apiStory.author_name
        });
        
        setStory(convertedStory);
        // Show all co-authors for collaborative stories
        const authorDisplay = apiStory.is_collaborative && apiStory.authors_names && apiStory.authors_names.length > 0
          ? apiStory.authors_names.join(', ')
          : (apiStory.author_name || 'Anonymous');
        setStoryAuthor(authorDisplay);
        const storyIdToUse = apiStory.id?.toString() || storyId;
        setBackendStoryId(storyIdToUse);
        
        // Check if current user is the author
        const authorId = apiStory.author?.id;
        const currentUserId = user?.id?.toString();
        setIsOwnStory(authorId === currentUserId);
        console.log('🔐 Ownership check:', { authorId, currentUserId, isOwner: authorId === currentUserId });
        
        // Set interaction counts from API response
        console.log('📊 Initial stats from API:', {
          likes_count: apiStory.likes_count,
          comments_count: apiStory.comments_count,
          views: apiStory.views,
          is_liked_by_user: apiStory.is_liked_by_user
        });
        
        setLikeCount(apiStory.likes_count || 0);
        setCommentCount(apiStory.comments_count || 0);
        setViewCount(apiStory.views || 0);
        setSaveCount(apiStory.saves_count || 0);
        setIsLiked(apiStory.is_liked_by_user || false);
        setIsSaved(apiStory.is_saved_by_user || false);
        setIsSavedOffline(isStorySavedOffline(storyId));
        
        // Fetch fresh interaction stats to ensure we have the latest counts
        // This will update the counts if they've changed since the story was loaded
        setTimeout(() => {
          fetchInteractionStats(storyIdToUse);
        }, 500);
      } catch (error) {
        console.error('❌ Error loading story:', error);
        setStory(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStory();
  }, [storyId]);
  
  // Fetch interaction statistics
  const fetchInteractionStats = async (id: string) => {
    if (!id) {
      console.warn('⚠️ No story ID provided to fetchInteractionStats');
      return;
    }
    
    try {
      console.log('🔄 Fetching interaction stats for story:', id);
      const stats = await storyInteractionService.getInteractionStats(id);
      console.log('✅ Fetched interaction stats:', stats);
      
      // Only update if we got valid stats
      if (stats) {
        setLikeCount(stats.likes_count);
        setCommentCount(stats.comments_count);
        setViewCount(stats.views);
        setSaveCount(stats.saves_count || 0);
        setIsLiked(stats.is_liked_by_user);
        setIsSaved(stats.is_saved_by_user || false);
      }
    } catch (error) {
      console.error('❌ Failed to fetch interaction stats:', error);
      // Don't reset counts on error - keep existing values
    }
  };
  
  // Refresh interaction stats periodically for backend stories
  useEffect(() => {
    if (!backendStoryId) return;
    
    // Refresh stats every 10 seconds
    const interval = setInterval(() => {
      fetchInteractionStats(backendStoryId);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [backendStoryId]);

  // Check games status when story loads
  useEffect(() => {
    console.log('🎮 Checking games - backendStoryId:', backendStoryId, 'user:', user?.username);
    if (backendStoryId && user) {
      checkGamesStatus();
    }
  }, [backendStoryId, user]);

  // Keyboard navigation - must be before conditional returns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readingMode === 'leftToRight' && story) {
        if (e.key === 'ArrowLeft' && currentPage > 0) {
          setCurrentPage(currentPage - 1);
        } else if (e.key === 'ArrowRight' && currentPage < story.pages.length) {
          setCurrentPage(currentPage + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readingMode, currentPage, story]);

  // Close view controls when clicking outside - must be before conditional returns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showViewControls && !target.closest('.story-reader-view-controls') && !target.closest('.story-reader-more-button')) {
        setShowViewControls(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showViewControls]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📖</div>
          <p className="text-gray-600">Loading story...</p>
        </div>
      </div>
    );
  }
  
  // If story not found, show error
  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Story Not Found</h2>
          <p className="text-gray-600 mb-4">The story you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/library')}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    // Check if we have a referrer in location state
    const state = location.state as { from?: string } | null;
    
    if (state?.from) {
      // Navigate to the specific page we came from
      navigate(state.from);
    } else {
      // Default to library if no referrer specified
      navigate('/library');
    }
  };

  const handleMoreOptions = () => {
    playButtonClick();
    setShowViewControls(!showViewControls);
  };

  const handleEdit = () => {
    setShowViewControls(false);
    // Navigate to manual story creation page with the story ID
    if (storyId) {
      navigate('/create-story-manual', { state: { storyId } });
    }
  };

  const checkGamesStatus = async () => {
    if (!backendStoryId) return;
    
    try {
      const response = await api.get(`/games/check/${backendStoryId}/`);
      console.log('🎮 Games status:', response);
      setHasGames(response.has_games);
      setGamesCount(response.games_count);
      setCanGenerateGames(response.can_generate);
    } catch (err) {
      console.error('Error checking games status:', err);
    }
  };

  const handleGenerateGames = async () => {
    if (!backendStoryId || isGeneratingGames) return;
    
    setIsGeneratingGames(true);
    playButtonClick();
    
    try {
      const response = await api.post('/games/generate/', {
        story_id: backendStoryId
      });
      
      setHasGames(true);
      setGamesCount(Object.keys(response.games).length);
      playSuccess();
      alert(`✅ Games generated successfully! ${Object.keys(response.games).length} games created.`);
      setShowViewControls(false);
    } catch (err: any) {
      console.error('Error generating games:', err);
      alert(err.response?.data?.error || 'Failed to generate games');
    } finally {
      setIsGeneratingGames(false);
    }
  };

  const handleViewGames = () => {
    playButtonClick();
    if (backendStoryId) {
      navigate(`/games/story/${backendStoryId}`);
    }
    setShowViewControls(false);
  };

  const handleShare = async () => {
    setShowViewControls(false);
    try {
      // Create a complete story object with author information
      const storyWithAuthor = {
        ...story,
        author: storyAuthor || user?.username || 'Unknown Author'
      };
      
      // Share the story as PDF
      await pdfExportService.shareStoryAsPDF(storyWithAuthor, {
        template: 'classic',
        printOptimization: 'screen'
      });
      console.log('✅ Story shared successfully');
    } catch (error) {
      console.error('❌ Failed to share story:', error);
      alert('Failed to share story. Please try again.');
    }
  };

  const handleExportPDF = async () => {
    setShowViewControls(false);
    try {
      // Create a complete story object with author information
      const storyWithAuthor = {
        ...story,
        author: storyAuthor || user?.username || 'Unknown Author'
      };
      
      // Export/download the story as PDF
      await pdfExportService.downloadStoryAsPDF(storyWithAuthor, {
        template: 'classic',
        printOptimization: 'screen'
      });
      console.log('✅ Story downloaded to PDF successfully');
    } catch (error) {
      console.error('❌ Failed to download story as PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };


  const handleLike = async () => {
    const idToUse = backendStoryId || storyId;
    if (!idToUse || isLiking) return;
    
    setIsLiking(true);
    try {
      const result = await storyInteractionService.toggleLike(idToUse);
      setIsLiked(result.is_liked);
      setLikeCount(result.likes_count);
      // Play sound based on action
      if (result.is_liked) {
        playSound('like');
      } else {
        playButtonClick();
      }
      // Refresh all stats after like to ensure consistency
      await fetchInteractionStats(idToUse);
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async () => {
    const idToUse = backendStoryId || storyId;
    if (!idToUse || isSaving) return;
    
    setIsSaving(true);
    try {
      const result = await storyInteractionService.toggleSave(idToUse);
      setIsSaved(result.is_saved);
      setSaveCount(result.saves_count);
      // Play sound based on action
      if (result.is_saved) {
        playSuccess();
      } else {
        playButtonClick();
      }
      // Refresh all stats after save to ensure consistency
      await fetchInteractionStats(idToUse);
    } catch (error) {
      console.error('Failed to toggle save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveOffline = () => {
    if (!story || !storyId) return;
    
    if (isSavedOffline) {
      // Remove from offline storage
      removeOfflineStory(storyId);
      setIsSavedOffline(false);
      playButtonClick();
      console.log('✅ Removed story from offline storage');
    } else {
      // Save to offline storage
      saveStoryOffline(story);
      setIsSavedOffline(true);
      playSuccess();
      console.log('✅ Saved story for offline reading');
    }
  };

  const handleComment = async () => {
    playButtonClick();
    setShowComments(true);
    const idToUse = backendStoryId || storyId;
    if (idToUse && comments.length === 0) {
      await loadComments();
    }
  };

  const loadComments = async () => {
    const idToUse = backendStoryId || storyId;
    if (!idToUse) return;
    
    setIsLoadingComments(true);
    try {
      const fetchedComments = await storyInteractionService.getComments(idToUse);
      // Sort comments by date_created in ascending order (oldest first)
      const sortedComments = fetchedComments.sort((a, b) => 
        new Date(a.date_created).getTime() - new Date(b.date_created).getTime()
      );
      setComments(sortedComments);
      setCommentCount(sortedComments.length);
      // Refresh all stats to ensure consistency
      await fetchInteractionStats(idToUse);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    const idToUse = backendStoryId || storyId;
    if (!idToUse || !newComment.trim() || isPostingComment) return;
    
    setIsPostingComment(true);
    try {
      const comment = await storyInteractionService.createComment(idToUse, newComment.trim());
      // Add new comment to the end (newest at bottom)
      setComments([...comments, comment]);
      setCommentCount(commentCount + 1);
      setNewComment('');
      playSuccess();
      // Refresh all stats after posting comment
      await fetchInteractionStats(idToUse);
    } catch (error) {
      console.error('Failed to post comment:', error);
      playSound('error');
      alert('Failed to post comment. Please try again.');
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleDeleteComment = (commentId: number) => {
    setDeleteCommentId(commentId);
    setShowDeleteModal(true);
    setOpenCommentMenuId(null);
  };

  const confirmDeleteComment = async () => {
    if (!deleteCommentId) return;
    
    try {
      await storyInteractionService.deleteComment(deleteCommentId);
      setComments(prev => prev.filter(c => c.id !== deleteCommentId));
      setCommentCount(commentCount - 1);
      setShowDeleteModal(false);
      setDeleteCommentId(null);
    } catch (error) {
      alert('Failed to delete comment');
      setShowDeleteModal(false);
      setDeleteCommentId(null);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
    setOpenCommentMenuId(null);
  };

  const handleSaveEditComment = async (commentId: number) => {
    if (!editingCommentText.trim()) return;
    
    try {
      const updatedComment = await storyInteractionService.editComment(commentId, editingCommentText.trim());
      setComments(prev => prev.map(c => c.id === commentId ? updatedComment : c));
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch (error) {
      alert('Failed to edit comment');
    }
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      playPageTurn();
      setCurrentPage(currentPage - 1);
      // Scroll card back to top - use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        if (horizontalCardRef.current) {
          horizontalCardRef.current.scrollTop = 0;
          // Also scroll any child elements
          const textElements = horizontalCardRef.current.querySelectorAll('.story-reader-horizontal-text');
          textElements.forEach(el => {
            (el as HTMLElement).scrollTop = 0;
          });
        }
      });
    }
  };

  const handleNextPage = () => {
    if (currentPage < story.pages.length) {
      playPageTurn();
      setCurrentPage(currentPage + 1);
      // Scroll card back to top - use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        if (horizontalCardRef.current) {
          horizontalCardRef.current.scrollTop = 0;
          // Also scroll any child elements
          const textElements = horizontalCardRef.current.querySelectorAll('.story-reader-horizontal-text');
          textElements.forEach(el => {
            (el as HTMLElement).scrollTop = 0;
          });
        }
      });
    }
  };

  const renderVerticalScrollMode = () => (
    <div className="story-reader-vertical-container">
      {story.pages.map((page, index) => {
        // Try to get canvas data from store first (for local stories), then from page object (for API stories)
        const canvasData = getCanvasData(story.id, page.id) || page.canvasData;
        
        return (
          <div key={page.id} className={`story-reader-page-card ${isDarkMode ? 'dark' : 'light'}`}>
            {/* Page Number Badge */}
            <div className="story-reader-page-number-container">
              <div className="story-reader-page-number-badge">
                {index + 1}
              </div>
            </div>
            
            {/* Square Illustration - Show canvas if available */}
            {canvasData && (
              <div className="story-reader-illustration-container" style={{ position: 'relative' }}>
                {/* Loading Spinner */}
                {loadingImages.has(page.id) && !failedImages.has(page.id) && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      border: '4px solid rgba(139, 92, 246, 0.2)',
                      borderTop: '4px solid #8b5cf6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{ 
                      color: isDarkMode ? '#a78bfa' : '#8b5cf6',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      Loading illustration...
                    </span>
                  </div>
                )}
                
                <img
                  src={canvasData}
                  alt={`Page ${index + 1} illustration`}
                  className="story-reader-illustration"
                  style={{ 
                    opacity: loadingImages.has(page.id) ? 0.3 : 1,
                    transition: 'opacity 0.3s ease-in-out'
                  }}
                  onLoadStart={() => {
                    setLoadingImages(prev => new Set([...prev, page.id]));
                  }}
                  onError={(e) => {
                    console.error(`❌ Failed to load image for page ${index + 1}`);
                    console.error('Image URL:', canvasData.substring(0, 100) + '...');
                    console.error('Error event:', e);
                    setLoadingImages(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(page.id);
                      return newSet;
                    });
                    setFailedImages(prev => new Set([...prev, page.id]));
                    // Hide the image container if loading fails
                    e.currentTarget.style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log(`✅ Successfully loaded image for page ${index + 1}`);
                    setLoadingImages(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(page.id);
                      return newSet;
                    });
                  }}
                />
              </div>
            )}
            
            {/* Story Text */}
            {page.text && (
              <div className={`story-reader-text ${isDarkMode ? 'dark' : 'light'}`}>
                {page.text}
              </div>
            )}
            
            {/* Show placeholder if no content */}
            {!page.text && !canvasData && (
              <div className={`story-reader-text ${isDarkMode ? 'dark' : 'light'} text-gray-400 italic`}>
                (No content on this page yet)
              </div>
            )}
          </div>
        );
      })}
      
      {/* The End Card */}
      <div className={`story-reader-end-card ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="story-reader-end-content">
          <h2 className={`story-reader-end-title ${isDarkMode ? 'dark' : 'light'}`}>
            The End
          </h2>
          <p className={`story-reader-end-subtitle ${isDarkMode ? 'dark' : 'light'}`}>
            Thank you for reading "{story.title}"
          </p>
        </div>
      </div>
    </div>
  );

  const renderHorizontalScrollMode = () => {
    const isLastPage = currentPage >= story.pages.length;
    const page = !isLastPage ? story.pages[currentPage] : null;
    // Try to get canvas data from store first (for local stories), then from page object (for API stories)
    const canvasData = page ? (getCanvasData(story.id, page.id) || page.canvasData) : null;
    
    return (
      <div className="story-reader-horizontal-container">
        {/* Current Page Card or The End Card */}
        <div ref={horizontalCardRef} className={`story-reader-horizontal-page-card ${isDarkMode ? 'dark' : 'light'}`}>
          {isLastPage ? (
            // The End Card
            <div className="story-reader-end-content">
              <h2 className={`story-reader-end-title ${isDarkMode ? 'dark' : 'light'}`}>
                The End
              </h2>
              <p className={`story-reader-end-subtitle ${isDarkMode ? 'dark' : 'light'}`}>
                Thank you for reading "{story.title}"
              </p>
            </div>
          ) : (
            // Regular Page Content
            <>
              {canvasData && (
                <div style={{ position: 'relative', width: '100%' }}>
                  {/* Loading Spinner */}
                  {page && loadingImages.has(page.id) && !failedImages.has(page.id) && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        border: '5px solid rgba(139, 92, 246, 0.2)',
                        borderTop: '5px solid #8b5cf6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      <span style={{ 
                        color: isDarkMode ? '#a78bfa' : '#8b5cf6',
                        fontSize: '1rem',
                        fontWeight: '500'
                      }}>
                        Loading illustration...
                      </span>
                    </div>
                  )}
                  
                  <img
                    src={canvasData}
                    alt={`Page ${currentPage + 1} illustration`}
                    className="story-reader-horizontal-illustration"
                    style={{ 
                      opacity: page && loadingImages.has(page.id) ? 0.3 : 1,
                      transition: 'opacity 0.3s ease-in-out'
                    }}
                    onLoadStart={() => {
                      if (page) {
                        setLoadingImages(prev => new Set([...prev, page.id]));
                      }
                    }}
                    onError={(e) => {
                      console.error(`❌ Failed to load image for page ${currentPage + 1}`);
                      console.error('Image URL:', canvasData.substring(0, 100) + '...');
                      console.error('Error event:', e);
                      if (page) {
                        setLoadingImages(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(page.id);
                          return newSet;
                        });
                        setFailedImages(prev => new Set([...prev, page.id]));
                      }
                      // Hide the image if loading fails
                      e.currentTarget.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log(`✅ Successfully loaded image for page ${currentPage + 1}`);
                      if (page) {
                        setLoadingImages(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(page.id);
                          return newSet;
                        });
                      }
                    }}
                  />
                </div>
              )}
              {page?.text && (
                <div className={`story-reader-horizontal-text ${isDarkMode ? 'dark' : 'light'}`}>
                  {page.text}
                </div>
              )}
              {!page?.text && !canvasData && (
                <div className={`story-reader-horizontal-text ${isDarkMode ? 'dark' : 'light'} text-gray-400 italic`}>
                  (No content on this page yet)
                </div>
              )}
            </>
          )}
        </div>

        {/* Navigation Arrows */}
        {currentPage > 0 && (
          <div className="story-reader-nav-arrow story-reader-nav-left">
            <button
              onClick={handlePreviousPage}
              className={`story-reader-nav-button ${isDarkMode ? 'dark' : 'light'}`}
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="story-reader-nav-icon" />
            </button>
          </div>
        )}
        
        {currentPage < story.pages.length && (
          <div className="story-reader-nav-arrow story-reader-nav-right">
            <button
              onClick={handleNextPage}
              className={`story-reader-nav-button ${isDarkMode ? 'dark' : 'light'}`}
              aria-label="Next page"
            >
              <ChevronRightIcon className="story-reader-nav-icon" />
            </button>
          </div>
        )}

        {/* Page Indicators */}
        <div className="story-reader-page-indicators">
          {story.pages.map((_, index) => (
            <div
              key={index}
              className={`story-reader-page-dot ${
                index === currentPage ? 'active' : 'inactive'
              } ${isDarkMode ? 'dark' : 'light'}`}
            />
          ))}
          {/* The End indicator */}
          <div
            className={`story-reader-page-dot ${
              currentPage >= story.pages.length ? 'active' : 'inactive'
            } ${isDarkMode ? 'dark' : 'light'}`}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={`story-reader-page ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Top Bar */}
      <div className={`story-reader-top-bar ${isDarkMode ? 'dark' : 'light'}`}>
        <button
          onClick={handleBack}
          className={`story-reader-back-button ${isDarkMode ? 'dark' : 'light'}`}
          aria-label="Go back"
        >
          <ArrowLeftIcon className="story-reader-back-icon" />
        </button>
        
        <div className="story-reader-title-container">
          <h1 className={`story-reader-title ${isDarkMode ? 'dark' : 'light'}`}>
            {story.title}
          </h1>
        </div>
        
        <button
          onClick={handleMoreOptions}
          className={`story-reader-more-button ${isDarkMode ? 'dark' : 'light'} ${showViewControls ? 'active' : ''}`}
          aria-label="More options"
        >
          <EllipsisVerticalIcon className="story-reader-more-icon" />
        </button>
      </div>

      {/* Menu Options - Only show when three dots menu is clicked */}
      {showViewControls && (
        <div className="story-reader-view-controls">
          {/* Reading Mode Options */}
          <button
            onClick={() => {
              setReadingMode('leftToRight');
              setShowViewControls(false);
            }}
            className={`story-reader-toggle-button ${readingMode === 'leftToRight' ? 'active' : ''}`}
          >
            <ArrowsRightLeftIcon className="story-reader-toggle-icon" />
            <span>Left to Right</span>
            {readingMode === 'leftToRight' && (
              <CheckIcon className="story-reader-toggle-checkmark" />
            )}
          </button>
          
          <button
            onClick={() => {
              setReadingMode('verticalScroll');
              setShowViewControls(false);
            }}
            className={`story-reader-toggle-button ${readingMode === 'verticalScroll' ? 'active' : ''}`}
          >
            <ArrowsUpDownIcon className="story-reader-toggle-icon" />
            <span>Vertical Scroll</span>
            {readingMode === 'verticalScroll' && (
              <CheckIcon className="story-reader-toggle-checkmark" />
            )}
          </button>

          {/* Action Options - Only show Edit/Publish for own stories */}
          {isOwnStory && (
            <>
              <button
                onClick={handleEdit}
                className="story-reader-action-button"
              >
                <PencilIcon className="story-reader-action-icon" />
                <span>Edit</span>
              </button>

            </>
          )}

          <button
            onClick={handleShare}
            className="story-reader-action-button"
          >
            <ShareIcon className="story-reader-action-icon" />
            <span>Share</span>
          </button>

          {/* Export PDF - Only show for own stories or saved offline stories */}
          {(isOwnStory || isSavedOffline) && (
            <button
              onClick={handleExportPDF}
              className="story-reader-action-button"
            >
              <DocumentArrowDownIcon className="story-reader-action-icon" />
              <span>Export PDF</span>
            </button>
          )}
        </div>
      )}

      {/* Story Header Section */}
      <div className={`story-reader-header ${isDarkMode ? 'dark' : 'light'}`}>
        {/* Cover Illustration */}
        {story.coverImage && (
          <div className="story-reader-cover-container" style={{ position: 'relative' }}>
            {/* Loading Spinner for Cover */}
            {loadingImages.has('cover') && !failedImages.has('cover') && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: isDarkMode ? 'rgba(42, 36, 53, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                padding: '1.5rem',
                borderRadius: '1rem'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  border: '6px solid rgba(139, 92, 246, 0.2)',
                  borderTop: '6px solid #8b5cf6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span style={{ 
                  color: isDarkMode ? '#a78bfa' : '#8b5cf6',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}>
                  Loading cover...
                </span>
              </div>
            )}
            
            <img
              src={story.coverImage}
              alt={`${story.title} cover`}
              className="story-reader-cover-image"
              style={{ 
                opacity: loadingImages.has('cover') ? 0.3 : 1,
                transition: 'opacity 0.3s ease-in-out'
              }}
              onLoadStart={() => {
                setLoadingImages(prev => new Set([...prev, 'cover']));
              }}
              onError={(e) => {
                console.error('❌ Failed to load cover image');
                console.error('Cover URL:', story.coverImage?.substring(0, 100) + '...');
                setLoadingImages(prev => {
                  const newSet = new Set(prev);
                  newSet.delete('cover');
                  return newSet;
                });
                setFailedImages(prev => new Set([...prev, 'cover']));
                // Hide cover if loading fails
                e.currentTarget.style.display = 'none';
              }}
              onLoad={() => {
                console.log('✅ Successfully loaded cover image');
                setLoadingImages(prev => {
                  const newSet = new Set(prev);
                  newSet.delete('cover');
                  return newSet;
                });
              }}
            />
          </div>
        )}
        
        {/* Story Details: Author and Genre */}
        <div className={`story-reader-details ${isDarkMode ? 'dark' : 'light'}`}>
          {storyAuthor && (
            <div className="story-reader-detail-item">
              <span className="story-reader-detail-label">Author: </span>
              <span className="story-reader-detail-value">{storyAuthor}</span>
            </div>
          )}
          {(story.tags && story.tags.length > 0) || story.genre ? (
            <div className="story-reader-detail-item">
              <span className="story-reader-detail-label">Genre: </span>
              <span className="story-reader-detail-value">
                {story.tags && story.tags.length > 0 ? story.tags.join(', ') : story.genre}
              </span>
            </div>
          ) : null}
        </div>
        
        {/* Story Description */}
        {story.description && (
          <p className={`story-reader-description ${isDarkMode ? 'dark' : 'light'}`}>
            {story.description}
          </p>
        )}
        
        {/* Interaction Buttons */}
        <div className={`story-reader-interactions ${isDarkMode ? 'dark' : 'light'}`}>
          <button
            onClick={handleLike}
            className={`story-reader-interaction-btn ${isDarkMode ? 'dark' : 'light'} ${isLiked ? 'liked' : ''}`}
          >
            {isLiked ? (
              <HeartSolidIcon className="story-reader-interaction-icon liked" />
            ) : (
              <HeartIcon className="story-reader-interaction-icon" />
            )}
            <span className="story-reader-interaction-count">{likeCount}</span>
          </button>
          
          <button
            onClick={handleSave}
            className={`story-reader-interaction-btn ${isDarkMode ? 'dark' : 'light'}`}
            disabled={isSaving}
          >
            {isSaved ? (
              <BookmarkSolidIcon className="story-reader-interaction-icon saved" />
            ) : (
              <BookmarkIcon className="story-reader-interaction-icon" />
            )}
            <span className="story-reader-interaction-count">{saveCount}</span>
          </button>
          
          <button
            onClick={handleComment}
            className={`story-reader-interaction-btn ${isDarkMode ? 'dark' : 'light'}`}
          >
            <ChatBubbleLeftIcon className="story-reader-interaction-icon" />
            <span className="story-reader-interaction-count">{commentCount}</span>
          </button>
          
          <div className={`story-reader-interaction-btn ${isDarkMode ? 'dark' : 'light'} views`}>
            <EyeIcon className="story-reader-interaction-icon" />
            <span className="story-reader-interaction-count">{viewCount}</span>
          </div>
          
          <button
            onClick={handleSaveOffline}
            className={`story-reader-interaction-btn ${isDarkMode ? 'dark' : 'light'} ${isSavedOffline ? 'offline-saved' : ''}`}
            title={isSavedOffline ? 'Remove from Offline' : 'Save for Offline Reading'}
          >
            <CloudArrowDownIcon className={`story-reader-interaction-icon ${isSavedOffline ? 'offline-saved' : ''}`} />
            <span className="story-reader-interaction-label">{isSavedOffline ? 'Saved Offline' : 'Save Offline'}</span>
          </button>
        </div>

        {/* Text-to-Speech Controls */}
        <div style={{ marginTop: '1rem' }}>
          <TTSControls 
            text={story.pages.map(page => page.text).filter(Boolean).join(' ')}
            showProgress={true}
            storyTitle={story.title}
            storyLanguage={story.language as 'en' | 'tl'}
          />

          {/* Games Button - Always visible below TTS controls */}
          {backendStoryId && (
            <div style={{ marginTop: '12px', width: '100%' }}>
              {hasGames ? (
                <button
                  onClick={handleViewGames}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <PuzzlePieceIcon style={{ width: '20px', height: '20px' }} />
                  <span>Play Games ({gamesCount})</span>
                </button>
              ) : canGenerateGames ? (
                <button
                  onClick={handleGenerateGames}
                  disabled={isGeneratingGames}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: isGeneratingGames ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: isGeneratingGames ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                    opacity: isGeneratingGames ? 0.6 : 1
                  }}
                >
                  <PuzzlePieceIcon style={{ width: '20px', height: '20px' }} />
                  <span>{isGeneratingGames ? 'Generating Games...' : 'Generate Games'}</span>
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      {readingMode === 'verticalScroll' ? renderVerticalScrollMode() : renderHorizontalScrollMode()}

      {/* Comments Modal */}
      {showComments && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setShowComments(false)}
        >
          <div 
            style={{
              backgroundColor: isDarkMode ? '#2a2435' : '#ffffff',
              borderRadius: '1rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: `1px solid ${isDarkMode ? '#3a3445' : '#e5e7eb'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600',
                color: isDarkMode ? '#ffffff' : '#1f2937'
              }}>
                Comments ({commentCount})
              </h3>
              <button
                onClick={() => setShowComments(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  padding: '0.25rem'
                }}
              >
                ×
              </button>
            </div>

            {/* Comments List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem'
            }}>
              {isLoadingComments ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                  Loading comments...
                </div>
              ) : comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                  No comments yet. Be the first to comment!
                </div>
              ) : (
                comments.map((comment) => {
                  const isOwnComment = user && comment.author === (typeof user.id === 'number' ? user.id : parseInt(user.id || '0'));
                  const isEditing = editingCommentId === comment.id;
                  
                  return (
                    <div 
                      key={comment.id}
                      style={{
                        display: 'flex',
                        justifyContent: isOwnComment ? 'flex-end' : 'flex-start',
                        marginBottom: '0.75rem',
                        gap: '0.5rem',
                        alignItems: 'flex-start'
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '75%',
                          padding: '1rem',
                          backgroundColor: isOwnComment 
                            ? (isDarkMode ? '#8b5cf6' : '#a78bfa')
                            : (isDarkMode ? '#1a1625' : '#f9fafb'),
                          borderRadius: '0.75rem',
                          borderTopRightRadius: isOwnComment ? '0.25rem' : '0.75rem',
                          borderTopLeftRadius: isOwnComment ? '0.75rem' : '0.25rem'
                        }}
                      >
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <textarea
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              borderRadius: '0.5rem',
                              border: `1px solid ${isDarkMode ? '#8b5cf6' : '#8b5cf6'}`,
                              backgroundColor: isDarkMode ? '#1a1625' : '#ffffff',
                              color: isDarkMode ? '#ffffff' : '#1f2937',
                              resize: 'vertical',
                              minHeight: '80px',
                              fontFamily: 'inherit',
                              fontSize: '0.875rem'
                            }}
                            autoFocus
                          />
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleSaveEditComment(comment.id)}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#8b5cf6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                fontWeight: '600'
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEditComment}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                fontWeight: '600'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '0.25rem'
                          }}>
                            <span style={{
                              fontWeight: '600',
                              fontSize: '0.875rem',
                              color: isOwnComment ? '#ffffff' : (isDarkMode ? '#a78bfa' : '#8b5cf6')
                            }}>
                              {comment.author_name}
                            </span>
                            <span style={{
                              fontSize: '0.75rem',
                              color: isOwnComment ? 'rgba(255,255,255,0.7)' : '#9ca3af'
                            }}>
                              {new Date(comment.date_created).toLocaleDateString()}
                            </span>
                          </div>
                          <p style={{
                            color: isOwnComment ? '#ffffff' : (isDarkMode ? '#d1d5db' : '#374151'),
                            lineHeight: '1.5',
                            fontSize: '0.875rem',
                            margin: 0
                          }}>
                            {comment.text}
                          </p>
                        </>
                      )}
                      </div>
                      
                      {/* Three-dot menu outside comment bubble (only for own comments) */}
                      {isOwnComment && !isEditing && (
                        <div style={{ position: 'relative', marginTop: '0.25rem' }}>
                          <button
                            onClick={() => setOpenCommentMenuId(openCommentMenuId === comment.id ? null : comment.id)}
                            style={{
                              background: 'rgba(139, 92, 246, 0.1)',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.375rem',
                              borderRadius: '0.375rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s',
                              color: '#8b5cf6'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.2)';
                              e.currentTarget.style.color = '#7c3aed';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
                              e.currentTarget.style.color = '#8b5cf6';
                            }}
                          >
                            <EllipsisVerticalIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                          </button>
                          
                          {/* Dropdown menu */}
                          {openCommentMenuId === comment.id && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '0.25rem',
                                backgroundColor: isDarkMode ? '#2a2435' : 'white',
                                borderRadius: '0.5rem',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                overflow: 'hidden',
                                zIndex: 10,
                                minWidth: '120px',
                                border: isDarkMode ? '1px solid #3a3445' : 'none'
                              }}
                            >
                              <button
                                onClick={() => handleEditComment(comment)}
                                style={{
                                  width: '100%',
                                  padding: '0.5rem 0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  border: 'none',
                                  background: 'none',
                                  cursor: 'pointer',
                                  fontSize: '0.875rem',
                                  color: isDarkMode ? '#d1d5db' : '#374151',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#3a3445' : '#f3f4f6'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                style={{
                                  width: '100%',
                                  padding: '0.5rem 0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  border: 'none',
                                  background: 'none',
                                  cursor: 'pointer',
                                  fontSize: '0.875rem',
                                  color: '#ef4444',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#3a3445' : '#fef2f2'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Input */}
            {user && (
              <div style={{
                padding: '1rem',
                borderTop: `1px solid ${isDarkMode ? '#3a3445' : '#e5e7eb'}`
              }}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${isDarkMode ? '#3a3445' : '#d1d5db'}`,
                    backgroundColor: isDarkMode ? '#1a1625' : '#ffffff',
                    color: isDarkMode ? '#ffffff' : '#1f2937',
                    resize: 'vertical',
                    minHeight: '80px',
                    fontFamily: 'inherit',
                    fontSize: '0.875rem'
                  }}
                />
                <button
                  onClick={handlePostComment}
                  disabled={!newComment.trim() || isPostingComment}
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#8b5cf6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    cursor: isPostingComment || !newComment.trim() ? 'not-allowed' : 'pointer',
                    opacity: isPostingComment || !newComment.trim() ? 0.5 : 1,
                    width: '100%'
                  }}
                >
                  {isPostingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Comment Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteCommentId(null);
        }}
        onConfirm={confirmDeleteComment}
        title="Delete Comment"
        message="Are you sure you want to delete this comment?"
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default StoryReaderPage;
