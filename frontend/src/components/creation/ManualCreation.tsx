import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PencilIcon, 
  PhotoIcon, 
  UserGroupIcon, 
  LightBulbIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';
import DrawingCanvas from './DrawingCanvas';
import CharacterLibrary from './CharacterLibrary';
import AIWritingAssistantModal from './AIWritingAssistantModal';

interface ManualCreationProps {
  onClose: () => void;
}

const ManualCreation = ({ onClose }: ManualCreationProps) => {
  const [storyTitle, setStoryTitle] = useState('');
  const [storyDescription, setStoryDescription] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState([
    { id: 1, text: '', illustration: '', characters: [] }
  ]);
  const [showCanvas, setShowCanvas] = useState(false);
  const [showCharacterLibrary, setShowCharacterLibrary] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  
  // Debug: Log state changes
  console.log('showAIAssistant state:', showAIAssistant);

  const currentPageData = pages.find(p => p.id === currentPage) || pages[0];

  const updatePageText = (text: string) => {
    setPages(pages.map(page => 
      page.id === currentPage ? { ...page, text } : page
    ));
  };

  const handleAIAssistantApply = (enhancedText: string) => {
    updatePageText(enhancedText);
  };

  const addNewPage = () => {
    const newPage = {
      id: pages.length + 1,
      text: '',
      illustration: '',
      characters: []
    };
    setPages([...pages, newPage]);
    setCurrentPage(newPage.id);
  };

  const formatText = (type: 'bold' | 'italic') => {
    // Text formatting logic would go here
    console.log(`Formatting text as ${type}`);
  };

  return (
    <div className="space-y-6">
      {/* Story Setup */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Story Title
          </label>
          <input
            type="text"
            value={storyTitle}
            onChange={(e) => setStoryTitle(e.target.value)}
            placeholder="Enter your story title..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={100}
          />
          <div className="text-xs text-gray-500 mt-1">{storyTitle.length}/100</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={storyDescription}
            onChange={(e) => setStoryDescription(e.target.value)}
            placeholder="Brief description of your story..."
            className="w-full h-20 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={200}
          />
          <div className="text-xs text-gray-500 mt-1">{storyDescription.length}/200</div>
        </div>
      </div>

      {/* Page Editor */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* Canvas Area */}
        <div className="relative bg-gray-50 h-64 border-b">
          {showCanvas ? (
            <DrawingCanvas onClose={() => setShowCanvas(false)} />
          ) : (
            <button
              onClick={() => setShowCanvas(true)}
              className="w-full h-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <div className="text-center">
                <PhotoIcon className="h-12 w-12 mx-auto mb-2" />
                <p>Tap to add illustration</p>
              </div>
            </button>
          )}
          
          {/* Canvas Tools (when in canvas mode) */}
          {showCanvas && (
            <div className="absolute top-4 right-4 flex space-x-2">
              <button
                onClick={() => setShowCharacterLibrary(true)}
                className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                title="Import Characters"
              >
                <UserGroupIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {/* Text Editor */}
        <div className="p-4">
          {/* Formatting Toolbar */}
          <div className="flex items-center space-x-2 mb-3 pb-3 border-b">
            <button
              onClick={() => formatText('bold')}
              className="p-2 rounded hover:bg-gray-100"
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => formatText('italic')}
              className="p-2 rounded hover:bg-gray-100"
              title="Italic"
            >
              <em>I</em>
            </button>
            <select className="text-sm border border-gray-300 rounded px-2 py-1">
              <option>Font Size</option>
              <option>Small</option>
              <option>Medium</option>
              <option>Large</option>
            </select>
          </div>

          <textarea
            value={currentPageData.text}
            onChange={(e) => updatePageText(e.target.value)}
            placeholder="Write your story here..."
            className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* AI Assistant Button */}
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                console.log('AI Assistant button clicked');
                setShowAIAssistant(true);
              }}
              className="flex items-center px-3 py-2 text-sm bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors"
            >
              <LightBulbIcon className="h-4 w-4 mr-1" />
              AI Assistant
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Previous Page
        </button>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Page {currentPage} of {pages.length}
          </span>
          <button
            onClick={addNewPage}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
          >
            + Add Page
          </button>
        </div>

        <button
          onClick={() => setCurrentPage(Math.min(pages.length, currentPage + 1))}
          disabled={currentPage === pages.length}
          className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next Page
          <ChevronRightIcon className="h-4 w-4 ml-1" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <button
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <EyeIcon className="h-4 w-4 mr-2" />
          Preview Story
        </button>

        <div className="flex space-x-3">
          <button
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <BookmarkIcon className="h-4 w-4 mr-2" />
            Save Draft
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700"
          >
            Publish Story
          </button>
        </div>
      </div>

      {/* Character Library Modal */}
      {showCharacterLibrary && (
        <CharacterLibrary 
          onClose={() => setShowCharacterLibrary(false)}
          onSelectCharacter={(character) => {
            console.log('Selected character:', character);
            setShowCharacterLibrary(false);
          }}
        />
      )}

      {/* AI Writing Assistant Modal */}
      <AIWritingAssistantModal
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        initialText={currentPageData.text}
        onApplyChanges={handleAIAssistantApply}
      />
      
      {/* Debug: Show modal state */}
      {showAIAssistant && (
        <div style={{ position: 'fixed', top: '10px', right: '10px', background: 'red', color: 'white', padding: '10px', zIndex: 9999 }}>
          Modal should be open!
        </div>
      )}
    </div>
  );
};

export default ManualCreation;
