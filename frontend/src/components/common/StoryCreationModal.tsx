import React, { useState } from 'react';
import { 
  SparklesIcon, 
  PencilIcon, 
  PhotoIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import AIStoryModal from '../creation/AIStoryModal';
import PhotoStoryModal from '../creation/PhotoStoryModal';

interface StoryCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StoryCreationModal: React.FC<StoryCreationModalProps> = ({ 
  isOpen, 
  onClose
}) => {
  const navigate = useNavigate();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  const handleOptionClick = (option: 'ai' | 'manual' | 'photo') => {
    switch (option) {
      case 'ai':
        setIsAIModalOpen(true);
        // Don't close selection modal - let user close AI modal and return
        break;
      case 'manual':
        onClose(); // Only manual creation closes and navigates
        navigate('/create-story-manual');
        break;
      case 'photo':
        setIsPhotoModalOpen(true);
        // Don't close selection modal - let user close Photo modal and return
        break;
    }
  };

  if (!isOpen && !isAIModalOpen && !isPhotoModalOpen) return null;

  const options = [
    {
      id: 'ai' as const,
      title: 'AI Generation',
      description: 'Let AI help you create a magical story',
      icon: SparklesIcon,
      gradient: 'from-purple-500 to-pink-500',
      hoverGradient: 'hover:from-purple-600 hover:to-pink-600',
    },
    {
      id: 'manual' as const,
      title: 'Manual Creation',
      description: 'Write your own story from scratch',
      icon: PencilIcon,
      gradient: 'from-blue-500 to-cyan-500',
      hoverGradient: 'hover:from-blue-600 hover:to-cyan-600',
    },
    {
      id: 'photo' as const,
      title: 'Create from Photo',
      description: 'Turn your photo into a story',
      icon: PhotoIcon,
      gradient: 'from-green-500 to-emerald-500',
      hoverGradient: 'hover:from-green-600 hover:to-emerald-600',
    },
  ];

  return (
    <>
      {isOpen && (
        <div className="story-creation-modal-overlay" onClick={onClose}>
          <div className="story-creation-modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="story-creation-modal-header">
              <h2 className="story-creation-modal-title">Create New Story</h2>
              <button 
                className="story-creation-modal-close"
                onClick={onClose}
                aria-label="Close modal"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Subtitle */}
            <p className="story-creation-modal-subtitle">
              Choose how you'd like to create your story
            </p>

            {/* Options Grid */}
            <div className="story-creation-modal-options">
              {options.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    className={`story-creation-option-card ${option.hoverGradient}`}
                    onClick={() => handleOptionClick(option.id)}
                  >
                    <div className={`story-creation-option-icon-wrapper bg-gradient-to-br ${option.gradient}`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="story-creation-option-title">{option.title}</h3>
                    <p className="story-creation-option-description">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
    </>
  );
};

export default StoryCreationModal;
