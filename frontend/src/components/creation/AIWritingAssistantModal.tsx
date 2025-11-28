import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon,
  SparklesIcon,
  CheckCircleIcon,
  LightBulbIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

interface AIWritingAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
  onApplyChanges?: (text: string) => void;
}

type TabType = 'grammarCheck' | 'writingTips' | 'enhanceStory';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const AIWritingAssistantModal: React.FC<AIWritingAssistantModalProps> = ({
  isOpen,
  onClose,
  initialText = '',
  onApplyChanges
}) => {
  console.log('AIWritingAssistantModal rendered with isOpen:', isOpen);
  const [activeTab, setActiveTab] = useState<TabType>('grammarCheck');
  const [originalText, setOriginalText] = useState(initialText);
  const [enhancedText, setEnhancedText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const tabs: Tab[] = [
    { id: 'grammarCheck', label: 'Grammar Check', icon: CheckCircleIcon },
    { id: 'writingTips', label: 'Writing Tips', icon: LightBulbIcon },
    { id: 'enhanceStory', label: 'Enhance Story', icon: SparklesIcon }
  ];

  // Update original text when initialText changes
  useEffect(() => {
    setOriginalText(initialText);
  }, [initialText]);

  // Auto-analyze for grammar check and enhance story
  useEffect(() => {
    if (originalText && (activeTab === 'grammarCheck' || activeTab === 'enhanceStory')) {
      handleAutoAnalysis();
    }
  }, [originalText, activeTab]);

  const handleAutoAnalysis = async () => {
    if (!originalText.trim()) return;

    setIsAnalyzing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      if (activeTab === 'grammarCheck') {
        // Mock grammar correction
        const corrected = originalText
          .replace(/\bi\b/g, 'I')
          .replace(/\bwont\b/g, "won't")
          .replace(/\bcant\b/g, "can't")
          .replace(/\bdont\b/g, "don't");
        setEnhancedText(corrected);
      } else if (activeTab === 'enhanceStory') {
        // Mock story enhancement
        const enhanced = originalText + ' The story continues with vivid descriptions and engaging dialogue that brings the characters to life.';
        setEnhancedText(enhanced);
      }
      setIsAnalyzing(false);
      setHasAnalyzed(true);
    }, 1500);
  };

  const handleAnalyzeClick = async () => {
    if (!originalText.trim()) return;

    setIsAnalyzing(true);
    
    // Simulate AI processing for writing tips
    setTimeout(() => {
      const mockSuggestions = [
        'Consider adding more descriptive adjectives to paint a vivid picture.',
        'Try varying your sentence length to create better rhythm.',
        'Add dialogue to make your characters more engaging.',
        'Include sensory details to help readers immerse themselves in the story.'
      ];
      setSuggestions(mockSuggestions);
      setIsAnalyzing(false);
      setHasAnalyzed(true);
    }, 1500);
  };

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    setHasAnalyzed(false);
    setSuggestions([]);
    setEnhancedText('');
  };

  const handleApply = () => {
    if (onApplyChanges) {
      if (activeTab === 'writingTips') {
        // For writing tips, we don't apply text changes, just close
        onClose();
        return;
      }
      if (enhancedText) {
        onApplyChanges(enhancedText);
      }
    }
    onClose();
  };

  const renderRightPanel = () => {
    if (activeTab === 'writingTips') {
      if (!hasAnalyzed) {
        return (
          <div className="ai-modal-empty-state">
            <LightBulbIcon className="ai-modal-empty-icon" />
            <p className="ai-modal-empty-text">
              Click 'Analyze' to get writing suggestions
            </p>
          </div>
        );
      }
      
      return (
        <div className="ai-modal-suggestions">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Writing Suggestions</h4>
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-sm text-gray-700">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="ai-modal-text-panel">
        <div className="ai-modal-panel-header">
          <div className="ai-modal-header-left">
            <SparklesIcon className="ai-modal-panel-icon" />
            <h3 className="ai-modal-panel-title">
              {activeTab === 'grammarCheck' ? 'Grammar Correction' : 'Enhanced Story'}
            </h3>
          </div>
          {activeTab === 'writingTips' && (
            <button
              onClick={handleAnalyzeClick}
              disabled={!originalText.trim() || isAnalyzing}
              className="ai-modal-analyze-button"
            >
              <SparklesIcon className="h-4 w-4" />
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          )}
        </div>
        <textarea
          value={isAnalyzing ? 'Analyzing your text...' : enhancedText}
          readOnly
          placeholder={`${activeTab === 'grammarCheck' ? 'Grammar corrections' : 'Enhanced story'} will appear here...`}
          className="ai-modal-textarea ai-modal-textarea-readonly"
        />
        <div className="ai-modal-char-count">
          {enhancedText.length} characters
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="ai-modal-overlay"
          onClick={onClose}
        >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="ai-modal-container"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="ai-modal-header">
            <div className="ai-modal-header-top">
              <div className="ai-modal-title">
                <SparklesIcon className="ai-modal-title-icon" />
                <h2 className="ai-modal-title-text">AI Writing Assistant</h2>
              </div>
              <button
                onClick={onClose}
                className="ai-modal-close-button"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* Tab Bar */}
            <div className="ai-modal-tab-bar">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={isActive ? 'ai-modal-tab-active' : 'ai-modal-tab-inactive'}
                  >
                    <Icon className="ai-modal-tab-icon" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Body */}
          <div className="ai-modal-body">
            {/* Left Panel - Original Text */}
            <div className="ai-modal-text-panel">
              <div className="ai-modal-panel-header">
                <PencilSquareIcon className="ai-modal-panel-icon" />
                <h3 className="ai-modal-panel-title">Original Text</h3>
              </div>
              <textarea
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                placeholder="Your story text will appear here..."
                className="ai-modal-textarea"
              />
              <div className="ai-modal-char-count">
                {originalText.length} characters
              </div>
            </div>

            {/* Right Panel - Output/Suggestions */}
            <div className="ai-modal-text-panel">
              {activeTab === 'writingTips' && !hasAnalyzed ? (
                <div className="ai-modal-panel-header">
                  <div className="ai-modal-header-left">
                    <LightBulbIcon className="ai-modal-panel-icon" />
                    <h3 className="ai-modal-panel-title">Writing Suggestions</h3>
                  </div>
                  <button
                    onClick={handleAnalyzeClick}
                    disabled={!originalText.trim() || isAnalyzing}
                    className="ai-modal-analyze-button"
                  >
                    <SparklesIcon className="h-4 w-4" />
                    {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                  </button>
                </div>
              ) : null}
              
              {renderRightPanel()}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="ai-modal-footer">
            <button
              onClick={onClose}
              className="ai-modal-cancel-button"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={activeTab !== 'writingTips' && !enhancedText}
              className="ai-modal-done-button"
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIWritingAssistantModal;
