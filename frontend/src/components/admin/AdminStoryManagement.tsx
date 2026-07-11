import React, { useState, useEffect } from 'react';
import { Search, Filter, AlertTriangle, Eye, Trash2, EyeOff, CheckCircle, RefreshCw, BookOpen, User, Calendar, ExternalLink, Heart, MessageSquare, Image as ImageIcon } from 'lucide-react';
import adminService, { StoryListItem } from '../../services/admin.service';
import { useThemeStore } from '../../stores/themeStore';
import ConfirmationModal from '../common/ConfirmationModal';
import './AdminStoryManagement.css';

export default function AdminStoryManagement() {
  const { theme } = useThemeStore();
  const [stories, setStories] = useState<StoryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'unpublished' | 'flagged'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    storyId: number;
    action: 'unpublish' | 'delete' | 'approve';
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    loadStories();
  }, [statusFilter, currentPage]);

  const loadStories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.listStories({
        status: statusFilter,
        search: searchQuery || undefined,
        page: currentPage,
        page_size: 20
      });
      setStories(data.stories);
      setTotalPages(data.pagination.total_pages);
    } catch (err: any) {
      console.error('Error loading stories:', err);
      setError(err.message || 'Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadStories();
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    
    try {
      setLoading(true);
      await adminService.moderateStory(confirmAction.storyId, confirmAction.action);
      
      // Refresh list
      await loadStories();
      setShowConfirmModal(false);
      setConfirmAction(null);
    } catch (err: any) {
      console.error(`Error executing ${confirmAction.action}:`, err);
      setError(`Failed to ${confirmAction.action} story`);
      setLoading(false);
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <div>
          <h2>Story Management</h2>
          <p>Moderate, unpublish, and delete platform stories</p>
        </div>
        <div className="admin-actions">
          <button className="btn btn-secondary" onClick={loadStories}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="admin-filters modern-filters">
        <form onSubmit={handleSearch} className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
        
        <div className="filter-group">
          <Filter size={18} />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Stories</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="admin-error-message">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="admin-content-container">
        {loading && stories.length === 0 ? (
          <div className="admin-loading">
            <RefreshCw className="spinner" size={24} />
            <p>Loading stories...</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="admin-empty-state">
            <BookOpen size={48} />
            <h3>No stories found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="admin-story-grid">
            {stories.map(story => (
              <div key={story.id} className="story-admin-card">
                <div className="story-card-header">
                  {story.cover_image ? (
                    <img src={story.cover_image} alt={story.title} className="story-cover-image" loading="lazy" />
                  ) : (
                    <div className="story-cover-placeholder">
                      <ImageIcon size={48} opacity={0.5} />
                    </div>
                  )}
                  <div className="story-status-badges">
                    <span className={`story-badge ${story.is_published ? 'badge-published' : 'badge-draft'}`}>
                      {story.is_published ? 'Published' : 'Draft'}
                    </span>
                    {story.is_flagged && (
                      <span className="story-badge badge-flagged">Flagged</span>
                    )}
                  </div>
                </div>
                
                <div className="story-card-body">
                  <h3 className="story-title" title={story.title}>{story.title}</h3>
                  <div className="story-meta">
                    <div className="meta-item">
                      <User size={14} /> <span>{story.author}</span>
                    </div>
                    <div className="meta-item">
                      <Calendar size={14} /> <span>{new Date(story.date_created).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="story-stats">
                    <div className="stat-item" title="Views">
                      <Eye size={14} /> {story.views}
                    </div>
                    <div className="stat-item" title="Likes">
                      <Heart size={14} /> {story.total_likes}
                    </div>
                    <div className="stat-item" title="Comments">
                      <MessageSquare size={14} /> {story.total_comments}
                    </div>
                  </div>
                </div>
                
                <div className="story-card-actions">
                  <button 
                    className="story-action-btn view-btn"
                    title="View Story Content"
                    onClick={() => window.open(`/story/${story.id}`, '_blank')}
                  >
                    <ExternalLink size={18} />
                    <span>View</span>
                  </button>

                  {story.is_published ? (
                    <button 
                      className="story-action-btn unpublish-btn"
                      title="Unpublish"
                      onClick={() => {
                        setConfirmAction({
                          storyId: story.id,
                          action: 'unpublish',
                          title: 'Unpublish Story',
                          message: `Are you sure you want to unpublish "${story.title}"? It will no longer be visible to others.`
                        });
                        setShowConfirmModal(true);
                      }}
                    >
                      <EyeOff size={18} />
                      <span>Unpublish</span>
                    </button>
                  ) : (
                    <button 
                      className="story-action-btn publish-btn"
                      title="Publish/Approve"
                      onClick={() => {
                        setConfirmAction({
                          storyId: story.id,
                          action: 'approve',
                          title: 'Publish Story',
                          message: `Are you sure you want to publish "${story.title}"?`
                        });
                        setShowConfirmModal(true);
                      }}
                    >
                      <CheckCircle size={18} />
                      <span>Publish</span>
                    </button>
                  )}
                  
                  <button 
                    className="story-action-btn delete-btn"
                    title="Force Delete"
                    onClick={() => {
                      setConfirmAction({
                        storyId: story.id,
                        action: 'delete',
                        title: 'Force Delete Story',
                        message: `WARNING: Are you sure you want to permanently delete "${story.title}"? This action cannot be undone.`
                      });
                      setShowConfirmModal(true);
                    }}
                  >
                    <Trash2 size={18} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          >
            Next
          </button>
        </div>
      )}

      {showConfirmModal && confirmAction && (
        <ConfirmationModal
          isOpen={showConfirmModal}
          title={confirmAction.title}
          message={confirmAction.message}
          confirmText={confirmAction.action === 'delete' ? 'Delete' : 'Confirm'}
          cancelText="Cancel"
          onConfirm={executeAction}
          onClose={() => {
            setShowConfirmModal(false);
            setConfirmAction(null);
          }}
          type={confirmAction.action === 'delete' ? 'danger' : 'warning'}
        />
      )}
    </div>
  );
}
