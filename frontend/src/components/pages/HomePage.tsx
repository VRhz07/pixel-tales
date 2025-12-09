import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryStore } from '../../stores/storyStore';
import { useI18nStore } from '../../stores/i18nStore';
import { useAuthStore } from '../../stores/authStore';
import { useAccountSwitchStore } from '../../stores/accountSwitchStore';
import AIStoryModal from '../creation/AIStoryModal';
import PhotoStoryModal from '../creation/PhotoStoryModal';
import { StoryModeSelectionModal } from '../collaboration/StoryModeSelectionModal';
import CollaborationModeModal from '../collaboration/CollaborationModeModal';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { storage } from '../../utils/storage';
import Logo from '../common/Logo';

const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useI18nStore();
  const { user } = useAuthStore();
  const { setActiveAccount } = useAccountSwitchStore();
  const { playButtonClick } = useSoundEffects();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isCollabModeOpen, setIsCollabModeOpen] = useState(false);
  const [isModeSelectionOpen, setIsModeSelectionOpen] = useState(false);
  const [showInviteFriends, setShowInviteFriends] = useState(false);
  const onlineUsers = useOnlineStatus();

  // Set active account state when on home page
  useEffect(() => {
    // SECURITY FIX: Only set account type based on actual authentication, not persisted state
    if (!user) return;
    
    const parentSession = storage.getItemSync('parent_session');
    const userType = user?.profile?.user_type || user?.user_type;
    
    // If there's a parent session, this means a parent is viewing as a child
    if (parentSession) {
      try {
        const sessionData = JSON.parse(parentSession);
        // Verify this is actually a parent viewing as child, not a real child login
        if (sessionData.parentId && sessionData.parentUserType && 
            (sessionData.parentUserType === 'parent' || sessionData.parentUserType === 'teacher')) {
          // Parent is viewing as child - this is legitimate
          setActiveAccount('child', user.id ? parseInt(user.id) : undefined, user.name);
          return;
        } else {
          // Invalid parent session - clear it
          console.warn('Invalid parent_session detected - clearing');
          storage.removeItemSync('parent_session');
        }
      } catch (e) {
        // Corrupted parent session - clear it
        storage.removeItemSync('parent_session');
      }
    }
    
    // No parent session, or invalid session - set based on actual user type
    if (userType === 'parent' || userType === 'teacher') {
      setActiveAccount('parent');
    } else if (userType === 'child') {
      // Real child account logged in directly
      setActiveAccount('child', user.id ? parseInt(user.id) : undefined, user.name);
    }
  }, [user, setActiveAccount]);
  
  // Get draft stories (work in progress) from store
  const currentUserId = useStoryStore((state) => state.currentUserId);
  const userLibraries = useStoryStore((state) => state.userLibraries);
  const { setCurrentStory } = useStoryStore();
  
  // Get only actual drafts (work in progress), not completed AI-generated stories
  const allStories = currentUserId ? (userLibraries[currentUserId]?.stories || []) : [];
  const draftStories = allStories
    .filter(story => {
      // Show stories that are explicitly drafts OR unpublished stories without isDraft flag
      if (story.isDraft === undefined) {
        return !story.isPublished; // Legacy stories without isDraft flag
      }
      return story.isDraft === true; // Only show actual drafts
    })
    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
    .slice(0, 3); // Limit to 3 most recent
  
  const handleContinueStory = (story: any) => {
    setCurrentStory(story);
    navigate('/create-story-manual', { state: { storyId: story.id } });
  };

  const handleSoloMode = () => {
    // Normal solo story creation - explicitly pass no collaboration state
    navigate('/create-story-manual', { 
      state: { 
        isCollaborative: false,
        sessionId: undefined 
      },
      replace: true // Replace history to prevent going back to collab state
    });
  };

  const handleCollabReady = (sessionId: string, storyId: string) => {
    // Navigate to story creation with collaboration session
    // The user who triggers this is the HOST (they created the session)
    navigate('/create-story-manual', { 
      state: { 
        sessionId,
        storyId,
        isCollaborative: true,
        isHost: true  // Mark this user as the host
      } 
    });
  };

  return (
    <div className="magical-home">
      {/* Magical Hero Section */}
      <div className="magical-hero">
        <div className="floating-book">
          <Logo width="200px" height="200px" style={{ display: 'block' }} />
        </div>
        <p className="hero-subtitle" style={{ marginTop: '0rem' }}>
          {t('home.heroSubtitle')}
        </p>
        <div className="magical-sparkles">✨ 🌟 ✨</div>
      </div>

      {/* Creation Section */}
      <div className="creation-section">
        <div className="section-header" style={{ marginBottom: '1rem' }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            textAlign: 'center',
            margin: '0',
            color: '#374151'
          }} className="dark:text-white">
            {t('home.createYourStory')}
          </h2>
        </div>
        
        {/* Three Creation Methods Side by Side - Inside One Border */}
        <div className="creation-methods-container">
          <div className="creation-methods-grid">
            {/* AI Creation Card */}
            <div 
              onClick={() => {
                playButtonClick();
                setIsAIModalOpen(true);
              }}
              className="feature-button ai-story"
            >
              <div className="feature-button-icon-wrapper">
                <span className="feature-button-icon">🤖</span>
              </div>
              <div className="feature-button-content">
                <h3 className="feature-button-title">AI Story</h3>
                <p className="feature-button-subtitle">Create with AI magic</p>
              </div>
            </div>

            {/* Manual Creation Card */}
            <div 
              onClick={() => {
                playButtonClick();
                setIsModeSelectionOpen(true);
              }}
              className="feature-button draw-story"
            >
              <div className="feature-button-icon-wrapper">
                <span className="feature-button-icon">✍️</span>
              </div>
              <div className="feature-button-content">
                <h3 className="feature-button-title">Draw Story</h3>
                <p className="feature-button-subtitle">Make your own illustrations</p>
              </div>
            </div>

            {/* Photo Story Creation Card */}
            <div 
              onClick={() => {
                playButtonClick();
                console.log('Photo Story button clicked!');
                setIsPhotoModalOpen(true);
              }}
              className="feature-button photo-ai"
            >
              <div className="feature-button-icon-wrapper">
                <span className="feature-button-icon">📸</span>
              </div>
              <div className="feature-button-content">
                <h3 className="feature-button-title">Photo AI</h3>
                <p className="feature-button-subtitle">Turn photos into stories</p>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Working Section */}
        <div className="magical-card status-card">
          <h3 className="card-title" style={{textAlign: 'center', marginBottom: '1rem'}}>{t('home.continueWorking')}</h3>
          
          {draftStories.length > 0 ? (
            <div className="drafts-list">
              {draftStories.map((story) => (
                <div 
                  key={story.id} 
                  className="draft-item"
                >
                  <div className="draft-content">
                    <h4 className="draft-title">
                      {story.title}
                    </h4>
                    <p className="draft-meta">
                      {story.pages.length} pages • {story.wordCount} words
                    </p>
                    <p className="draft-date">
                      Last edited: {new Date(story.lastModified).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    className="magical-button draft-continue-button"
                    onClick={() => {
                      playButtonClick();
                      handleContinueStory(story);
                    }}
                  >
                    Continue
                  </button>
                </div>
              ))}
              
              {draftStories.length >= 3 && (
                <button 
                  className="magical-button outline"
                  style={{width: '100%', marginTop: '1rem'}}
                  onClick={() => navigate('/library')}
                >
                  View All Drafts
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className="status-icon">📝</div>
              <p className="status-text">
                No drafts yet. Start creating your first magical story and watch it come to life!
              </p>
            </div>
          )}
        </div>


        {/* Quick Actions Section */}
        <div className="section-header" style={{marginTop: '3rem'}}>
          <div className="section-icon">🌟</div>
          <h2 className="section-title">Quick Actions</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="magical-card">
            <div className="card-content">
              <div className="card-icon primary" style={{width: '50px', height: '50px', fontSize: '1.25rem'}}>
                <span>📚</span>
              </div>
              <div className="card-text">
                <h4 className="card-title" style={{fontSize: '1rem', marginBottom: '0.25rem'}}>Browse Library</h4>
                <p className="card-description" style={{fontSize: '0.875rem', marginBottom: '0.75rem'}}>
                  Explore stories from other creators
                </p>
                <button 
                  className="magical-button" 
                  style={{padding: '0.5rem 1rem', fontSize: '0.8rem'}}
                  onClick={() => navigate('/library')}
                >
                  Explore
                </button>
              </div>
            </div>
          </div>

          <div className="magical-card">
            <div className="card-content">
              <div className="card-icon secondary" style={{width: '50px', height: '50px', fontSize: '1.25rem'}}>
                <span>👥</span>
              </div>
              <div className="card-text">
                <h4 className="card-title" style={{fontSize: '1rem', marginBottom: '0.25rem'}}>Find Friends</h4>
                <p className="card-description" style={{fontSize: '0.875rem', marginBottom: '0.75rem'}}>
                  Connect with other storytellers
                </p>
                <button 
                  className="magical-button secondary" 
                  style={{padding: '0.5rem 1rem', fontSize: '0.8rem'}}
                  onClick={() => {
                    playButtonClick();
                    navigate('/social');
                  }}
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Story Modal */}
      <AIStoryModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
      />

      {/* Photo Story Modal */}
      <PhotoStoryModal 
        isOpen={isPhotoModalOpen} 
        onClose={() => setIsPhotoModalOpen(false)} 
      />

      {/* Story Mode Selection Modal (Solo or Collaboration) */}
      <StoryModeSelectionModal
        isOpen={isModeSelectionOpen}
        onClose={() => {
          setIsModeSelectionOpen(false);
          setShowInviteFriends(false);
        }}
        onSoloSelected={handleSoloMode}
        onCollabReady={handleCollabReady}
        onCollabModeSelected={() => {
          setIsModeSelectionOpen(false);
          setIsCollabModeOpen(true);
        }}
        forceCollabSetup={showInviteFriends}
        storyTitle="New Story"
        onlineUserIds={onlineUsers}
      />

      {/* Collaboration Mode Modal (Host or Join) - shown after selecting Collaboration */}
      <CollaborationModeModal
        isOpen={isCollabModeOpen}
        onClose={() => setIsCollabModeOpen(false)}
        onHostSelected={() => {
          setIsCollabModeOpen(false);
          setShowInviteFriends(true);
          setIsModeSelectionOpen(true);
        }}
      />
    </div>
  );
};

export default HomePage;
