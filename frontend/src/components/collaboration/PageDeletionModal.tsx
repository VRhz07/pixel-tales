import React, { useState, useEffect, useRef } from 'react';
import './PageDeletionModal.css';

interface PageViewer {
  user_id: number;
  username: string;
  display_name: string;
  cursor_color: string;
}

interface PageDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeletePage: (pageIndex: number) => void;
  pages: Array<{ id: string; text: string }>;
  currentPageIndex: number;
  currentUserId: number;
  onRequestPageViewers: () => void;
  pageViewers: Record<number, PageViewer[]>;
  isCollaborating: boolean;
}

const PageDeletionModal: React.FC<PageDeletionModalProps> = ({
  isOpen,
  onClose,
  onDeletePage,
  pages,
  currentPageIndex,
  currentUserId,
  onRequestPageViewers,
  pageViewers,
  isCollaborating
}) => {
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [autoDeselectNotification, setAutoDeselectNotification] = useState<string | null>(null);
  const previousPageViewersRef = useRef<Record<number, PageViewer[]>>(pageViewers);

  useEffect(() => {
    if (isOpen && isCollaborating) {
      // Request fresh page viewer data when modal opens
      onRequestPageViewers();
      
      // Poll for updates every 2 seconds while modal is open
      const pollInterval = setInterval(() => {
        onRequestPageViewers();
      }, 2000);
      
      return () => clearInterval(pollInterval);
    }
  }, [isOpen, isCollaborating, onRequestPageViewers]);

  useEffect(() => {
    // Auto-deselect pages that become non-deletable (e.g., when other users navigate to them)
    if (selectedPages.size > 0 && isOpen) {
      const newSelection = new Set(selectedPages);
      const deselectedPages: number[] = [];
      
      selectedPages.forEach(pageIndex => {
        if (!isPageDeletable(pageIndex)) {
          newSelection.delete(pageIndex);
          deselectedPages.push(pageIndex);
        }
      });
      
      if (deselectedPages.length > 0) {
        setSelectedPages(newSelection);
        
        // Show notification about auto-deselection
        const pageNumbers = deselectedPages.map(idx => idx + 1).join(', ');
        const message = deselectedPages.length === 1 
          ? `Page ${pageNumbers} was deselected (now being viewed by another user)`
          : `Pages ${pageNumbers} were deselected (now being viewed by other users)`;
        
        setAutoDeselectNotification(message);
        
        // Clear notification after 4 seconds
        setTimeout(() => {
          setAutoDeselectNotification(null);
        }, 4000);
      }
    }
    
    previousPageViewersRef.current = pageViewers;
  }, [pageViewers, pages.length, isOpen]);

  useEffect(() => {
    // Reset selection when modal closes
    if (!isOpen) {
      setSelectedPages(new Set());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePageSelect = (pageIndex: number) => {
    // Don't allow selection of non-deletable pages
    if (!isPageDeletable(pageIndex)) {
      return;
    }
    
    const newSelection = new Set(selectedPages);
    if (newSelection.has(pageIndex)) {
      newSelection.delete(pageIndex);
    } else {
      newSelection.add(pageIndex);
    }
    setSelectedPages(newSelection);
  };

  const handleSelectAll = () => {
    const deletablePages = pages
      .map((_, index) => index)
      .filter(index => isPageDeletable(index));
    setSelectedPages(new Set(deletablePages));
  };

  const handleDeselectAll = () => {
    setSelectedPages(new Set());
  };

  const handleDeleteSelected = () => {
    if (selectedPages.size > 0) {
      setShowConfirmation(true);
    }
  };

  const handleConfirmDelete = () => {
    // Delete pages in reverse order to maintain correct indices
    const pagesToDelete = Array.from(selectedPages).sort((a, b) => b - a);
    
    pagesToDelete.forEach(pageIndex => {
      onDeletePage(pageIndex);
    });
    
    setShowConfirmation(false);
    setSelectedPages(new Set());
    onClose();
  };

  const getPageViewersExcludingMe = (pageIndex: number): PageViewer[] => {
    const viewers = pageViewers[pageIndex] || [];
    return viewers.filter(viewer => viewer.user_id !== currentUserId);
  };

  const isPageDeletable = (pageIndex: number): boolean => {
    // Can't delete if it's the only page
    if (pages.length <= 1) return false;
    
    // In collaboration mode, check if others are viewing the page
    if (isCollaborating) {
      const otherViewers = getPageViewersExcludingMe(pageIndex);
      return otherViewers.length === 0;
    }
    
    return true;
  };

  const getPagePreviewText = (page: { text: string }): string => {
    const text = page.text.trim();
    if (!text) return 'Empty page';
    return text.length > 50 ? text.substring(0, 50) + '...' : text;
  };

  return (
    <div className="page-deletion-modal-overlay" onClick={onClose}>
      <div className="page-deletion-modal" onClick={(e) => e.stopPropagation()}>
        <div className="page-deletion-header">
          <h3>Manage Pages</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {/* Auto-deselect notification */}
        {autoDeselectNotification && (
          <div className="auto-deselect-notification">
            <span className="notification-icon">⚠️</span>
            <span className="notification-text">{autoDeselectNotification}</span>
          </div>
        )}
        
        <div className="page-deletion-content">
          <p className="page-deletion-description">
            Select pages to delete. You cannot delete pages that other users are currently viewing.
          </p>
          
          {/* Selection Controls */}
          <div className="selection-controls">
            <div className="selection-info">
              {selectedPages.size > 0 ? (
                <span className="selected-count">{selectedPages.size} page{selectedPages.size > 1 ? 's' : ''} selected</span>
              ) : (
                <span className="selection-hint">Click checkboxes to select pages</span>
              )}
            </div>
            <div className="selection-actions">
              <button 
                className="select-all-btn"
                onClick={handleSelectAll}
                disabled={pages.filter((_, idx) => isPageDeletable(idx)).length === 0}
              >
                Select All
              </button>
              <button 
                className="deselect-all-btn"
                onClick={handleDeselectAll}
                disabled={selectedPages.size === 0}
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="pages-list">
            {pages.map((page, index) => {
              const isDeletable = isPageDeletable(index);
              const isCurrentPage = index === currentPageIndex;
              const otherViewers = getPageViewersExcludingMe(index);
              const isSelected = selectedPages.has(index);
              
              return (
                <div 
                  key={page.id} 
                  className={`page-item ${!isDeletable ? 'page-item-blocked' : ''} ${isCurrentPage ? 'page-item-current' : ''} ${isSelected ? 'page-item-selected' : ''}`}
                >
                  <div 
                    className="page-checkbox"
                    title={!isDeletable ? (pages.length <= 1 ? "Cannot delete the last page" : "Cannot delete - other users are viewing this page") : "Select this page for deletion"}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handlePageSelect(index)}
                      disabled={!isDeletable}
                      className="page-checkbox-input"
                    />
                  </div>
                  
                  <div className="page-info">
                    <div className="page-number">Page {index + 1}</div>
                    <div className="page-preview">{getPagePreviewText(page)}</div>
                    
                    {/* Show viewers */}
                    {isCollaborating && otherViewers.length > 0 && (
                      <div className="page-viewers">
                        <span className="viewers-label">Viewing:</span>
                        <div className="viewers-list">
                          {otherViewers.map((viewer) => (
                            <span 
                              key={viewer.user_id}
                              className="viewer-badge"
                              style={{ backgroundColor: viewer.cursor_color }}
                            >
                              {viewer.display_name || viewer.username}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {isCurrentPage && (
                      <div className="current-page-indicator">
                        You are here
                      </div>
                    )}
                  </div>
                  
                  <div className="page-status">
                    {!isDeletable && (
                      <span className="delete-blocked-reason">
                        {pages.length <= 1 ? 'Last page' : 'In use by others'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="page-deletion-footer">
          <button className="cancel-button" onClick={onClose}>
            Close
          </button>
          <button 
            className="delete-selected-btn"
            onClick={handleDeleteSelected}
            disabled={selectedPages.size === 0}
          >
            Delete Selected ({selectedPages.size})
          </button>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      {showConfirmation && selectedPages.size > 0 && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <h4>Confirm Deletion</h4>
            <p>
              Are you sure you want to delete {selectedPages.size} page{selectedPages.size > 1 ? 's' : ''}?
              {selectedPages.size > 1 && (
                <span className="warning-text"> This action cannot be undone.</span>
              )}
            </p>
            <div className="selected-pages-list">
              {Array.from(selectedPages).sort((a, b) => a - b).map(pageIndex => (
                <div key={pageIndex} className="selected-page-item">
                  Page {pageIndex + 1}: {getPagePreviewText(pages[pageIndex])}
                </div>
              ))}
            </div>
            <div className="confirmation-buttons">
              <button 
                className="confirm-delete-btn"
                onClick={handleConfirmDelete}
              >
                Yes, Delete {selectedPages.size > 1 ? 'All' : ''}
              </button>
              <button 
                className="cancel-delete-btn"
                onClick={() => {
                  setShowConfirmation(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageDeletionModal;