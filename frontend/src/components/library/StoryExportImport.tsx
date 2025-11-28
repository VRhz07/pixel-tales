import React, { useState, useRef } from 'react';
import { useStoryStore } from '../../stores/storyStore';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface StoryExportImportProps {
  isOpen: boolean;
  onClose: () => void;
}

const StoryExportImport: React.FC<StoryExportImportProps> = ({ isOpen, onClose }) => {
  const { stories, exportStory, importStory, getStats } = useStoryStore();
  const [selectedStoryId, setSelectedStoryId] = useState<string>('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportStory = () => {
    if (!selectedStoryId) return;

    try {
      const storyData = exportStory(selectedStoryId);
      const story = stories.find(s => s.id === selectedStoryId);
      
      if (story) {
        // Create and download file
        const blob = new Blob([storyData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setImportStatus('success');
        setImportMessage(`"${story.title}" exported successfully!`);
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    } catch (error) {
      setImportStatus('error');
      setImportMessage('Failed to export story. Please try again.');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  const handleExportAll = () => {
    try {
      const allStoriesData = {
        stories: stories,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(allStoriesData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `imaginary_worlds_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setImportStatus('success');
      setImportMessage(`All ${stories.length} stories exported successfully!`);
      setTimeout(() => setImportStatus('idle'), 3000);
    } catch (error) {
      setImportStatus('error');
      setImportMessage('Failed to export stories. Please try again.');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Check if it's a single story or multiple stories
        if (data.stories && Array.isArray(data.stories)) {
          // Multiple stories backup
          let importedCount = 0;
          data.stories.forEach((storyData: any) => {
            try {
              importStory(JSON.stringify(storyData));
              importedCount++;
            } catch (error) {
              console.error('Failed to import story:', storyData.title, error);
            }
          });
          
          setImportStatus('success');
          setImportMessage(`Successfully imported ${importedCount} stories!`);
        } else {
          // Single story
          const importedStory = importStory(content);
          setImportStatus('success');
          setImportMessage(`"${importedStory.title}" imported successfully!`);
        }
        
        setTimeout(() => setImportStatus('idle'), 3000);
      } catch (error) {
        setImportStatus('error');
        setImportMessage('Invalid file format. Please select a valid story file.');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const stats = getStats();

  if (!isOpen) return null;

  return (
    <div className="export-import-modal-overlay">
      <div className="export-import-modal">
        {/* Header */}
        <div className="export-import-header">
          <h2 className="export-import-title">Export & Import Stories</h2>
          <button
            className="export-import-close"
            onClick={onClose}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Status Message */}
        {importStatus !== 'idle' && (
          <div className={`export-import-status ${importStatus === 'success' ? 'success' : 'error'}`}>
            {importStatus === 'success' ? (
              <CheckCircleIcon className="h-5 w-5" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5" />
            )}
            <span>{importMessage}</span>
          </div>
        )}

        {/* Export Section */}
        <div className="export-import-section">
          <h3 className="export-import-section-title">
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export Stories
          </h3>
          
          {stories.length > 0 ? (
            <>
              {/* Export Single Story */}
              <div className="export-option">
                <label className="export-label">Export Single Story</label>
                <div className="export-controls">
                  <select
                    value={selectedStoryId}
                    onChange={(e) => setSelectedStoryId(e.target.value)}
                    className="export-select"
                  >
                    <option value="">Select a story...</option>
                    {stories.map((story) => (
                      <option key={story.id} value={story.id}>
                        {story.title} ({story.pages.length} pages)
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleExportStory}
                    disabled={!selectedStoryId}
                    className="export-button"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4" />
                    Export
                  </button>
                </div>
              </div>

              {/* Export All Stories */}
              <div className="export-option">
                <label className="export-label">Export All Stories</label>
                <p className="export-description">
                  Export all {stories.length} stories as a backup file
                </p>
                <button
                  onClick={handleExportAll}
                  className="export-button-primary"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Export All ({stories.length} stories)
                </button>
              </div>
            </>
          ) : (
            <div className="export-empty">
              <p>No stories to export. Create some stories first!</p>
            </div>
          )}
        </div>

        {/* Import Section */}
        <div className="export-import-section">
          <h3 className="export-import-section-title">
            <ArrowUpTrayIcon className="h-5 w-5" />
            Import Stories
          </h3>
          
          <div className="import-option">
            <label className="export-label">Import Story File</label>
            <p className="export-description">
              Import individual stories or backup files (.json)
            </p>
            <div className="import-controls">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="import-file-input"
                id="story-file-input"
              />
              <label htmlFor="story-file-input" className="import-button">
                <DocumentArrowUpIcon className="h-4 w-4" />
                Choose File
              </label>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="export-import-stats">
          <div className="export-stat">
            <span className="export-stat-label">Total Stories:</span>
            <span className="export-stat-value">{stats.totalStories}</span>
          </div>
          <div className="export-stat">
            <span className="export-stat-label">Total Pages:</span>
            <span className="export-stat-value">{stats.totalPages}</span>
          </div>
          <div className="export-stat">
            <span className="export-stat-label">Total Words:</span>
            <span className="export-stat-value">{stats.totalWords}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryExportImport;
