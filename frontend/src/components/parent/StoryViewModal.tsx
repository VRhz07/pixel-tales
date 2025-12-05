import React from 'react';
import { XMarkIcon, HeartIcon, ChatBubbleLeftIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useThemeStore } from '../../stores/themeStore';
import './StoryViewModal.css';

interface StoryViewModalProps {
  story: any;
  isOpen: boolean;
  onClose: () => void;
}

const StoryViewModal: React.FC<StoryViewModalProps> = ({ story, isOpen, onClose }) => {
  const { theme } = useThemeStore();

  if (!isOpen || !story) return null;

  // Parse canvas data to get pages and combine with text content
  const getPages = () => {
    try {
      let canvasPages: any[] = [];
      
      // Get canvas images
      if (story.canvas_data) {
        const canvas = typeof story.canvas_data === 'string' 
          ? JSON.parse(story.canvas_data) 
          : story.canvas_data;
        
        if (canvas.pages && Array.isArray(canvas.pages)) {
          canvasPages = canvas.pages;
        } else if (Array.isArray(canvas)) {
          canvasPages = canvas;
        }
      }
      
      // Sort pages by order to ensure correct sequence
      canvasPages.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // Split story content by page breaks
      let textPages: string[] = [];
      if (story.content) {
        textPages = story.content.split('---PAGE BREAK---').map((text: string) => text.trim());
      }
      
      // Separate cover page and story pages
      const coverPage = canvasPages.find((page: any) => page.order === -1);
      const storyPages = canvasPages.filter((page: any) => page.order >= 0);
      
      // Combine story pages with text content
      const combinedStoryPages = storyPages.map((page: any, index: number) => {
        return {
          ...page,
          text: textPages[index] || '',
          canvasImage: page.canvasData || page.canvasImage,
          isCover: false
        };
      });
      
      // Build final pages array with cover first
      const allPages = [];
      
      // Add cover page at the beginning if it exists
      if (coverPage) {
        allPages.push({
          ...coverPage,
          text: '',
          canvasImage: coverPage.canvasData || coverPage.canvasImage,
          isCover: true
        });
      }
      
      // Add all story pages
      allPages.push(...combinedStoryPages);
      
      console.log('Canvas pages:', canvasPages.length);
      console.log('Text pages:', textPages.length);
      console.log('Has cover:', !!coverPage);
      console.log('Total pages (with cover):', allPages.length);
      
      return allPages;
    } catch (error) {
      console.error('Error parsing canvas data:', error);
      return [];
    }
  };

  const pages = getPages();

  return (
    <div className="story-view-modal-overlay" onClick={onClose}>
      <div 
        className={`story-view-modal ${theme === 'dark' ? 'dark' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="story-view-modal-header">
          <div>
            <h2 className="story-view-modal-title">{story.title || 'Untitled Story'}</h2>
            <div className="story-view-modal-meta">
              <span className={`story-status-badge ${story.is_published ? 'published' : 'draft'}`}>
                {story.is_published ? '✓ Published' : '✏️ Draft'}
              </span>
              <span className="story-meta-item">{story.category}</span>
              <span className="story-meta-item">{story.page_count} pages</span>
              <span className="story-meta-item">
                {new Date(story.date_created).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button className="story-view-modal-close" onClick={onClose}>
            <XMarkIcon />
          </button>
        </div>

        {/* Stats Bar (for published stories) */}
        {story.is_published && (
          <div className="story-view-stats-bar">
            <div className="story-stat">
              <HeartIcon />
              <span>{story.likes || 0} Likes</span>
            </div>
            <div className="story-stat">
              <ChatBubbleLeftIcon />
              <span>{story.comments || 0} Comments</span>
            </div>
            <div className="story-stat">
              <EyeIcon />
              <span>{story.views || 0} Views</span>
            </div>
          </div>
        )}

        {/* Story Content */}
        <div className="story-view-modal-content">
          {pages.length > 0 ? (
            <div className="story-pages-grid">
              {pages.map((page: any, index: number) => (
                <div key={page.id || index} className={`story-page-item ${page.isCover ? 'cover-page' : ''}`}>
                  <div className="story-page-number">
                    {page.isCover ? '📖 Cover' : `Page ${index}`}
                  </div>
                  
                  {/* Canvas/Image */}
                  {page.canvasImage && (
                    <div className="story-page-canvas">
                      <img 
                        src={page.canvasImage} 
                        alt={page.isCover ? 'Cover' : `Page ${index}`}
                        className="story-page-image"
                        onError={(e) => {
                          console.error('Failed to load image for', page.isCover ? 'cover' : `page ${index}`);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Cover Description */}
                  {page.isCover && story.summary && (
                    <div className="story-cover-description">
                      <h4 className="cover-description-title">Story Description</h4>
                      <p>{story.summary}</p>
                    </div>
                  )}
                  
                  {/* Text Content */}
                  {page.text && (
                    <div className="story-page-text">
                      <p>{page.text}</p>
                    </div>
                  )}

                  {!page.canvasImage && !page.text && !page.isCover && (
                    <div className="story-page-empty">
                      <p>Empty page</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="story-empty-content">
              <p>No content available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="story-view-modal-footer">
          <div className="story-view-genres">
            {story.genres && story.genres.length > 0 && (
              <>
                <span style={{ fontWeight: 600, marginRight: '8px' }}>Genres:</span>
                {story.genres.map((genre: string, index: number) => (
                  <span key={index} className="story-genre-tag">
                    {genre}
                  </span>
                ))}
              </>
            )}
          </div>
          <button className="story-view-close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryViewModal;
