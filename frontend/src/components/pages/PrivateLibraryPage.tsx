import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryStore } from '../../stores/storyStore';
import { useI18nStore } from '../../stores/i18nStore';
import { useAuthStore } from '../../stores/authStore';
import { storyApiService } from '../../services/storyApiService';
import StoryExportImport from '../library/StoryExportImport';
import ConfirmationModal, { ConfirmationModalType } from '../common/ConfirmationModal';
import StoryCreationModal from '../common/StoryCreationModal';
import CustomDropdown, { DropdownOption } from '../common/CustomDropdown';
import { 
  BookOpenIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  CloudArrowDownIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  TrashIcon,
  XCircleIcon,
  BookmarkIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

type FilterType = 'all' | 'drafts' | 'works' | 'saved' | 'offline';

const PrivateLibraryPage = () => {
  const navigate = useNavigate();
  const { t } = useI18nStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [savedStories, setSavedStories] = useState<any[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  
  // Get current user for author name
  const { user } = useAuthStore();
  const currentUserName = user?.name || user?.email?.split('@')[0] || 'You';
  
  // Get real data from store - properly subscribe to the store state
  const currentUserId = useStoryStore((state) => state.currentUserId);
  const userLibraries = useStoryStore((state) => state.userLibraries);
  const rawStories = currentUserId ? (userLibraries[currentUserId]?.stories || []) : [];
  const rawOfflineStories = currentUserId ? (userLibraries[currentUserId]?.offlineStories || []) : [];
  
  // Map stories and ensure they have author field
  const stories = rawStories.map(story => ({
    ...story,
    author: story.is_collaborative && story.authors_names && story.authors_names.length > 0 
      ? story.authors_names.join(', ') 
      : (story.author || currentUserName)
  }));
  
  const { getRecentStories, getDraftStories, getPublishedStories, getStats, deleteStory, markAsSaved, markAsDraft, publishStory, removeOfflineStory } = useStoryStore();
  const stats = getStats();
  const recentStories = getRecentStories(3);
  
  // Drafts: Stories with isDraft flag set to true
  const draftStories = stories.filter(story => {
    if (story.isDraft === undefined) {
      return !story.isPublished;
    }
    return story.isDraft;
  }).sort((a, b) => 
    new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
  );
  
  // Your Works: All stories that have been saved (isDraft: false), regardless of publish status
  const yourWorks = stories.filter(story => {
    if (story.isDraft === undefined) {
      return story.isPublished;
    }
    return !story.isDraft;
  }).sort((a, b) => 
    new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
  );

  // Load saved stories from backend
  React.useEffect(() => {
    const loadSavedStories = async () => {
      setIsLoadingSaved(true);
      try {
        const response = await storyApiService.getSavedStories();
        setSavedStories(response);
      } catch (error) {
        console.error('Error loading saved stories:', error);
      } finally {
        setIsLoadingSaved(false);
      }
    };
    
    if (user) {
      loadSavedStories();
    }
  }, [user]);

  // Use real offline stories from store
  const offlineStories = rawOfflineStories.map(story => ({
    ...story,
    author: story.is_collaborative && story.authors_names && story.authors_names.length > 0 
      ? story.authors_names.join(', ') 
      : (story.author || 'Unknown Author')
  }));
  
  const handleEditStory = (storyId: string) => {
    navigate('/create-story-manual', { state: { storyId } });
  };

  const handleViewStory = (storyId: string) => {
    navigate(`/story/${storyId}`, { state: { from: '/library' } });
  };

  const handleSaveStory = (storyId: string) => {
    const story = stories.find(s => s.id === storyId);
    setModalState({
      isOpen: true,
      type: 'success',
      title: 'Save Story',
      message: `Save "${story?.title || 'this story'}"? It will be moved from Drafts to Your Works (not yet published to public library).`,
      confirmText: 'Save',
      onConfirm: () => {
        markAsSaved(storyId);
        console.log('Story saved:', storyId);
        closeModal();
      },
    });
  };

  const handlePublishToPublic = async (storyId: string) => {
    const story = stories.find(s => s.id === storyId);
    
    if (!story?.backendId) {
      setModalState({
        isOpen: true,
        type: 'warning',
        title: 'Cannot Publish',
        message: 'This story needs to be saved to the server first. Please try editing and saving it again.',
        confirmText: 'OK',
        onConfirm: closeModal,
      });
      return;
    }

    setModalState({
      isOpen: true,
      type: 'info',
      title: 'Publish Story',
      message: `Publish "${story?.title || 'this story'}" to the public library? Everyone will be able to see it.`,
      confirmText: 'Publish',
      onConfirm: async () => {
        setIsModalLoading(true);
        try {
          // Call API to publish to backend using backendId
          await storyApiService.publishStory(story.backendId!.toString());
          
          // Update local state
          publishStory(storyId);
          
          console.log('Story published to public library:', storyId);
          setIsModalLoading(false);
          closeModal();
        } catch (error) {
          console.error('Error publishing story:', error);
          setIsModalLoading(false);
          setModalState({
            isOpen: true,
            type: 'danger',
            title: 'Publish Failed',
            message: 'Failed to publish story. Please try again.',
            confirmText: 'OK',
            onConfirm: closeModal,
          });
        }
      },
    });
  };

  const handleUnpublishStory = async (storyId: string) => {
    const story = stories.find(s => s.id === storyId);
    
    if (!story?.backendId) {
      setModalState({
        isOpen: true,
        type: 'warning',
        title: 'Cannot Unpublish',
        message: 'This story is not synced with the server.',
        confirmText: 'OK',
        onConfirm: closeModal,
      });
      return;
    }

    setModalState({
      isOpen: true,
      type: 'warning',
      title: 'Unpublish Story',
      message: `Are you sure you want to unpublish "${story?.title || 'this story'}"? It will be removed from the public library and moved back to Drafts.`,
      confirmText: 'Unpublish',
      onConfirm: async () => {
        setIsModalLoading(true);
        try {
          // Call API to unpublish from backend using backendId
          await storyApiService.unpublishStory(story.backendId!.toString());
          
          // Update local state
          markAsDraft(storyId);
          
          console.log('Story unpublished successfully:', storyId);
          setIsModalLoading(false);
          closeModal();
        } catch (error) {
          console.error('Error unpublishing story:', error);
          setIsModalLoading(false);
          setModalState({
            isOpen: true,
            type: 'danger',
            title: 'Unpublish Failed',
            message: 'Failed to unpublish story. Please try again.',
            confirmText: 'OK',
            onConfirm: closeModal,
          });
        }
      },
    });
  };

  const handleDeleteStory = (storyId: string) => {
    const story = stories.find(s => s.id === storyId);
    setModalState({
      isOpen: true,
      type: 'danger',
      title: 'Delete Story',
      message: `Are you sure you want to permanently delete "${story?.title || 'this story'}"? This action cannot be undone.`,
      confirmText: 'Delete',
      onConfirm: () => {
        deleteStory(storyId);
        console.log('Story deleted:', storyId);
        closeModal();
      },
    });
  };

  const handleDeleteAllDrafts = async () => {
    setModalState({
      isOpen: true,
      type: 'danger',
      title: 'Delete All Drafts',
      message: `Are you sure you want to permanently delete all ${draftStories.length} draft${draftStories.length !== 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: 'Delete All',
      onConfirm: async () => {
        setIsModalLoading(true);
        try {
          // Delete each draft story
          for (const draft of draftStories) {
            // Delete from backend if it has a backendId
            if (draft.backendId) {
              try {
                await storyApiService.deleteStory(draft.backendId.toString());
                console.log(`✅ Deleted draft ${draft.id} from backend`);
              } catch (error: any) {
                // 404 is expected if story was already deleted
                if (error?.status === 404) {
                  console.log(`ℹ️ Draft ${draft.id} was already deleted from backend`);
                } else {
                  console.warn(`⚠️ Failed to delete draft ${draft.id} from backend:`, error);
                }
              }
            }
            // Delete from local store
            deleteStory(draft.id);
          }
          console.log(`✅ Deleted all ${draftStories.length} drafts`);
          setIsModalLoading(false);
          closeModal();
        } catch (error) {
          console.error('Error deleting all drafts:', error);
          setIsModalLoading(false);
          setModalState({
            isOpen: true,
            type: 'danger',
            title: 'Delete Failed',
            message: 'Failed to delete all drafts. Please try again.',
            confirmText: 'OK',
            onConfirm: closeModal,
          });
        }
      },
    });
  };

  const handleDeleteAllWorks = async () => {
    setModalState({
      isOpen: true,
      type: 'danger',
      title: 'Delete All Works',
      message: `Are you sure you want to permanently delete all ${yourWorks.length} work${yourWorks.length !== 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: 'Delete All',
      onConfirm: async () => {
        setIsModalLoading(true);
        try {
          // Delete each work
          for (const work of yourWorks) {
            // Delete from backend if it has a backendId
            if (work.backendId) {
              try {
                await storyApiService.deleteStory(work.backendId.toString());
                console.log(`✅ Deleted work ${work.id} from backend`);
              } catch (error: any) {
                // 404 is expected if story was already deleted
                if (error?.status === 404) {
                  console.log(`ℹ️ Work ${work.id} was already deleted from backend`);
                } else {
                  console.warn(`⚠️ Failed to delete work ${work.id} from backend:`, error);
                }
              }
            }
            // Delete from local store
            deleteStory(work.id);
          }
          console.log(`✅ Deleted all ${yourWorks.length} works`);
          setIsModalLoading(false);
          closeModal();
        } catch (error) {
          console.error('Error deleting all works:', error);
          setIsModalLoading(false);
          setModalState({
            isOpen: true,
            type: 'danger',
            title: 'Delete Failed',
            message: 'Failed to delete all works. Please try again.',
            confirmText: 'OK',
            onConfirm: closeModal,
          });
        }
      },
    });
  };

  const handleUnsaveAllStories = async () => {
    setModalState({
      isOpen: true,
      type: 'danger',
      title: 'Unsave All Stories',
      message: `Are you sure you want to unsave all ${savedStories.length} saved stor${savedStories.length !== 1 ? 'ies' : 'y'}? This will not delete the stories, just remove them from your saved list.`,
      confirmText: 'Unsave All',
      onConfirm: async () => {
        setIsModalLoading(true);
        try {
          const { storyInteractionService } = await import('../../services/storyInteraction.service');
          // Unsave each story from backend
          for (const story of savedStories) {
            try {
              await storyInteractionService.toggleSave(story.id.toString());
              console.log(`✅ Unsaved story ${story.id} from backend`);
            } catch (error) {
              console.warn(`⚠️ Failed to unsave story ${story.id}:`, error);
            }
          }
          // Refresh the saved stories list
          const response = await storyApiService.getSavedStories();
          setSavedStories(response);
          console.log(`✅ Unsaved all ${savedStories.length} stories`);
          setIsModalLoading(false);
          closeModal();
        } catch (error) {
          console.error('Error unsaving all stories:', error);
          setIsModalLoading(false);
          setModalState({
            isOpen: true,
            type: 'danger',
            title: 'Unsave Failed',
            message: 'Failed to unsave all stories. Please try again.',
            confirmText: 'OK',
            onConfirm: closeModal,
          });
        }
      },
    });
  };

  const handleDeleteAllOfflineStories = async () => {
    setModalState({
      isOpen: true,
      type: 'danger',
      title: 'Delete All Offline Stories',
      message: `Are you sure you want to delete all ${offlineStories.length} offline stor${offlineStories.length !== 1 ? 'ies' : 'y'}? This will remove the downloaded copies from your device. The original stories will remain available in the public library.`,
      confirmText: 'Delete All',
      onConfirm: async () => {
        setIsModalLoading(true);
        try {
          const { removeOfflineStory } = useStoryStore.getState();
          // Remove each offline story from localStorage
          for (const story of offlineStories) {
            removeOfflineStory(story.id);
            console.log(`✅ Removed offline story ${story.id} from localStorage`);
          }
          console.log(`✅ Deleted all ${offlineStories.length} offline stories`);
          setIsModalLoading(false);
          closeModal();
        } catch (error) {
          console.error('Error deleting all offline stories:', error);
          setIsModalLoading(false);
          setModalState({
            isOpen: true,
            type: 'danger',
            title: 'Delete Failed',
            message: 'Failed to delete all offline stories. Please try again.',
            confirmText: 'OK',
            onConfirm: closeModal,
          });
        }
      },
    });
  };
  
  const [showCreationModal, setShowCreationModal] = useState(false);

  const handleCreateNewStory = () => {
    setShowCreationModal(true);
  };
  
  const [showExportImport, setShowExportImport] = useState(false);

  // Modal state management
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: ConfirmationModalType;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: () => {},
  });
  const [isModalLoading, setIsModalLoading] = useState(false);

  const closeModal = () => {
    if (!isModalLoading) {
      setModalState(prev => ({ ...prev, isOpen: false }));
    }
  };

  const filterStoriesBySearch = (stories: any[]) => {
    if (searchQuery.trim()) {
      return stories.filter(story => 
        story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (story.author && story.author.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return stories;
  };

  // Apply search filter to each category
  const filteredDrafts = filterStoriesBySearch(draftStories);
  const filteredYourWorks = filterStoriesBySearch(yourWorks);
  const filteredSaved = filterStoriesBySearch(savedStories);
  const filteredOffline = filterStoriesBySearch(offlineStories);

  // Determine which sections to show based on selected filter
  const shouldShowDrafts = selectedFilter === 'all' || selectedFilter === 'drafts';
  const shouldShowWorks = selectedFilter === 'all' || selectedFilter === 'works';
  const shouldShowSaved = selectedFilter === 'all' || selectedFilter === 'saved';
  const shouldShowOffline = selectedFilter === 'all' || selectedFilter === 'offline';

  return (
    <div className="library-page-content">
      {/* Page Header */}
      <div className="library-header">
        <div className="library-header-content">
          <h1 className="library-title">{t('library.title')}</h1>
          
          {stats && (
            <div className="library-stats-section">
              <div className="library-stats-grid">
                <div className="library-stat-card">
                  <span className="library-stat-number">{stats.totalStories}</span>
                  <span className="library-stat-label">{t('library.stories')}</span>
                </div>
                <div className="library-stat-card">
                  <span className="library-stat-number">{stats.totalPages}</span>
                  <span className="library-stat-label">{t('library.pages')}</span>
                </div>
                <div className="library-stat-card">
                  <span className="library-stat-number">{stats.totalWords}</span>
                  <span className="library-stat-label">{t('library.wordCount')}</span>
                </div>
                <div className="library-stat-card">
                  <span className="library-stat-number">{stats.totalCharacters}</span>
                  <span className="library-stat-label">{t('home.quickActions')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search and Filter Controls */}
        <div className="library-controls-wrapper">
          <div className="library-search-filter-row">
            <div className="library-search library-search-expanded">
              <MagnifyingGlassIcon className="h-4 w-4" />
              <input
                type="text"
                placeholder={t('library.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="library-search-input"
              />
            </div>
            
            <CustomDropdown
              className="library-filter-dropdown"
              value={selectedFilter}
              onChange={(value) => setSelectedFilter(value as FilterType)}
              options={[
                { value: 'all', label: t('common.all') || 'All' },
                { value: 'drafts', label: t('library.drafts') || 'Drafts' },
                { value: 'works', label: t('library.savedWorks') || 'Saved Works' },
                { value: 'saved', label: 'Saved Stories' },
                { value: 'offline', label: t('library.offline') || 'Offline' }
              ]}
            />
          </div>
          
          <div className="flex gap-2">
            <button
              className="library-create-story-button"
              onClick={handleCreateNewStory}
            >
              <PencilIcon className="h-5 w-5" />
              <span>{t('library.createNew')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area - Sections Displayed Based on Filter */}
      <div className="library-content">
        {/* Drafts Section - Only show if there are drafts */}
        {shouldShowDrafts && filteredDrafts.length > 0 && (
        <div className="library-section">
          <div className="library-section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PencilIcon className="h-4 w-4" />
              <h2 className="library-section-title">
                {t('library.drafts')} ({filteredDrafts.length})
              </h2>
            </div>
            <button
              className="library-action-button delete"
              onClick={handleDeleteAllDrafts}
              title="Delete All Drafts"
              style={{ 
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 12px'
              }}
            >
              <TrashIcon className="h-4 w-4" />
              <span>Delete All Drafts</span>
            </button>
          </div>

          {filteredDrafts.length === 0 ? (
            <div className="library-empty-state">
              <BookOpenIcon className="library-empty-icon" />
              <h3 className="library-empty-title">{t('library.noDrafts')}</h3>
              <p className="library-empty-description">{t('library.startCreating')}</p>
              <button 
                className="private-library-create-button"
                onClick={handleCreateNewStory}
              >
                {t('library.createFirst')}
              </button>
            </div>
          ) : (
            <div className="library-stories list-view">
              {filteredDrafts.map((story: any) => (
                <div 
                  key={story.id} 
                  className="library-story-card"
                >
                  <div className="library-story-cover" onClick={() => handleViewStory(story.id)}>
                    {story.coverImage ? (
                      <img 
                        src={story.coverImage} 
                        alt={story.title}
                        className="library-story-cover-image"
                      />
                    ) : (
                      <div className="library-story-placeholder">
                        <BookOpenIcon className="library-story-placeholder-icon" />
                      </div>
                    )}
                  </div>
                  <div className="library-story-content" onClick={() => handleViewStory(story.id)}>
                    <h3 className="library-story-title">
                      <span className="library-story-title-inner">{story.title}</span>
                    </h3>
                    <p className="library-story-author">
                      {t('common.by')} {story.author || 'Unknown Author'}
                    </p>
                  </div>
                  <div className="library-story-actions">
                    <button 
                      className="library-action-button edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditStory(story.id);
                      }}
                      title="Edit Story"
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                    <button 
                      className="library-action-button view"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewStory(story.id);
                      }}
                      title="View Story"
                    >
                      <EyeIcon className="h-4 w-4" />
                      <span>View</span>
                    </button>
                    <button 
                      className="library-action-button save"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveStory(story.id);
                      }}
                      title="Save Story"
                    >
                      <BookmarkIcon className="h-4 w-4" />
                      <span>{t('library.saveStory')}</span>
                    </button>
                    <button 
                      className="library-action-button delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStory(story.id);
                      }}
                      title="Delete Story"
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Your Works Section */}
        {shouldShowWorks && (
        <div className="library-section">
          <div className="library-section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpenIcon className="h-4 w-4" />
              <h2 className="library-section-title">
                Your Works ({filteredYourWorks.length})
              </h2>
            </div>
            {filteredYourWorks.length > 0 && (
              <button
                className="library-action-button delete"
                onClick={handleDeleteAllWorks}
                title="Delete All Works"
                style={{ 
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 12px'
                }}
              >
                <TrashIcon className="h-4 w-4" />
                <span>Delete All Works</span>
              </button>
            )}
          </div>

          {filteredYourWorks.length === 0 ? (
            <div className="library-empty-state">
              <BookOpenIcon className="library-empty-icon" />
              <h3 className="library-empty-title">No finished works yet</h3>
              <p className="library-empty-description">Complete a story to see it here</p>
            </div>
          ) : (
            <div className="library-stories list-view">
              {filteredYourWorks.map((story: any) => (
                <div 
                  key={story.id} 
                  className="library-story-card"
                >
                  <div className="library-story-cover" onClick={() => handleViewStory(story.id)}>
                    {story.coverImage ? (
                      <img 
                        src={story.coverImage} 
                        alt={story.title}
                        className="library-story-cover-image"
                      />
                    ) : (
                      <div className="library-story-placeholder">
                        <BookOpenIcon className="library-story-placeholder-icon" />
                      </div>
                    )}
                  </div>
                  <div className="library-story-content" onClick={() => handleViewStory(story.id)}>
                    <h3 className="library-story-title">
                      <span className="library-story-title-inner">{story.title}</span>
                    </h3>
                    <p className="library-story-author">
                      {t('common.by')} {story.author || 'Unknown Author'}
                    </p>
                  </div>
                  <div className="library-story-actions">
                    <button 
                      className="library-action-button edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditStory(story.id);
                      }}
                      title="Edit Story"
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                    <button 
                      className="library-action-button view"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewStory(story.id);
                      }}
                      title="View Story"
                    >
                      <EyeIcon className="h-4 w-4" />
                      <span>View</span>
                    </button>
                    {story.isPublished ? (
                      <button 
                        className="library-action-button unpublish"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnpublishStory(story.id);
                        }}
                        title="Unpublish from Public Library"
                      >
                        <XCircleIcon className="h-4 w-4" />
                        <span>Unpublish</span>
                      </button>
                    ) : (
                      <button 
                        className="library-action-button publish"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePublishToPublic(story.id);
                        }}
                        title="Publish to Public Library"
                      >
                        <GlobeAltIcon className="h-4 w-4" />
                        <span>Publish</span>
                      </button>
                    )}
                    <button 
                      className="library-action-button delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStory(story.id);
                      }}
                      title="Delete Story"
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Saved Stories Section */}
        {shouldShowSaved && (
        <div className="library-section">
          <div className="library-section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookmarkIcon className="h-4 w-4" />
              <h2 className="library-section-title">
                Saved Stories ({filteredSaved.length})
              </h2>
            </div>
            {filteredSaved.length > 0 && (
              <button
                className="library-action-button delete"
                onClick={handleUnsaveAllStories}
                title="Unsave All Stories"
                style={{ 
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 12px'
                }}
              >
                <TrashIcon className="h-4 w-4" />
                <span>Unsave All</span>
              </button>
            )}
          </div>

          {isLoadingSaved ? (
            <div className="library-empty-state">
              <p>Loading saved stories...</p>
            </div>
          ) : filteredSaved.length === 0 ? (
            <div className="library-empty-state">
              <BookOpenIcon className="library-empty-icon" />
              <h3 className="library-empty-title">No saved stories</h3>
              <p className="library-empty-description">Save stories from the public library to see them here</p>
            </div>
          ) : (
            <div className="library-stories list-view">
              {filteredSaved.map((story: any) => (
                <div 
                  key={story.id} 
                  className="library-story-card"
                  onClick={() => handleViewStory(story.id)}
                >
                  <div className="library-story-cover">
                    {story.coverImage ? (
                      <img 
                        src={story.coverImage} 
                        alt={story.title}
                        className="library-story-cover-image"
                      />
                    ) : (
                      <div className="library-story-placeholder">
                        <BookOpenIcon className="library-story-placeholder-icon" />
                      </div>
                    )}
                  </div>
                  <div className="library-story-content">
                    <h3 className="library-story-title">
                      <span className="library-story-title-inner">{story.title}</span>
                    </h3>
                    <p className="library-story-author">
                      {t('common.by')} {story.author || 'Unknown Author'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Offline Section */}
        {shouldShowOffline && (
        <div className="library-section">
          <div className="library-section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CloudArrowDownIcon className="h-4 w-4" />
              <h2 className="library-section-title">
                Offline ({filteredOffline.length})
              </h2>
            </div>
            {filteredOffline.length > 0 && (
              <button
                className="library-action-button delete"
                onClick={handleDeleteAllOfflineStories}
                title="Delete All Offline Stories"
                style={{ 
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 12px'
                }}
              >
                <TrashIcon className="h-4 w-4" />
                <span>Delete All</span>
              </button>
            )}
          </div>

          {filteredOffline.length === 0 ? (
            <div className="library-empty-state">
              <BookOpenIcon className="library-empty-icon" />
              <h3 className="library-empty-title">No offline stories</h3>
              <p className="library-empty-description">Save stories from the public library for offline reading</p>
            </div>
          ) : (
            <div className="library-stories list-view">
              {filteredOffline.map((story: any) => (
                <div 
                  key={story.id} 
                  className="library-story-card"
                >
                  <div className="library-story-cover" onClick={() => handleViewStory(story.id)}>
                    {story.coverImage ? (
                      <img 
                        src={story.coverImage} 
                        alt={story.title}
                        className="library-story-cover-image"
                      />
                    ) : (
                      <div className="library-story-placeholder">
                        <BookOpenIcon className="library-story-placeholder-icon" />
                      </div>
                    )}
                  </div>
                  <div className="library-story-content" onClick={() => handleViewStory(story.id)}>
                    <h3 className="library-story-title">
                      <span className="library-story-title-inner">{story.title}</span>
                    </h3>
                    <p className="library-story-author">
                      {t('common.by')} {story.author || 'Unknown Author'}
                    </p>
                  </div>
                  <div className="library-story-actions">
                    <button 
                      className="library-action-button view"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewStory(story.id);
                      }}
                      title="View Story"
                    >
                      <EyeIcon className="h-4 w-4" />
                      <span>View</span>
                    </button>
                    <button 
                      className="library-action-button delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeOfflineStory(story.id);
                      }}
                      title="Remove from Offline"
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>


      {/* Export/Import Modal */}
      {showExportImport && (
        <div className="private-library-export-overlay">
          <div className="private-library-export-modal">
            <StoryExportImport isOpen={showExportImport} onClose={() => setShowExportImport(false)} />
          </div>
        </div>
      )}

      {/* Story Creation Modal */}
      <StoryCreationModal
        isOpen={showCreationModal}
        onClose={() => setShowCreationModal(false)}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        type={modalState.type}
        isLoading={isModalLoading}
      />
    </div>
  );
};

export default PrivateLibraryPage;
