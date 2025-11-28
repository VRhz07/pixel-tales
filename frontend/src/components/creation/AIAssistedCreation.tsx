import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useCreationStore } from '../../stores/creationStore';
import ProgressBar from '../ui/ProgressBar';
import { AI_GENRE_OPTIONS, ART_STYLE_OPTIONS } from '../../constants/genres';

interface AIAssistedCreationProps {
  onClose: () => void;
}

const AIAssistedCreation = ({ onClose }: AIAssistedCreationProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const {
    storyPrompt,
    selectedGenres,
    selectedAgeGroup,
    selectedArtStyle,
    updateStoryPrompt,
    toggleGenre,
    setSelectedAgeGroup,
    setSelectedArtStyle,
    isGenerating,
    setIsGenerating,
    addSkillPoints,
    updateAchievementProgress
  } = useCreationStore();

  const genres = AI_GENRE_OPTIONS;
  const artStyles = ART_STYLE_OPTIONS;

  const ageGroups = [
    { id: '3-5', name: '3-5 years', description: 'Simple words, bright pictures, basic concepts' },
    { id: '6-8', name: '6-8 years', description: 'Short sentences, fun adventures, learning themes' },
    { id: '9-12', name: '9-12 years', description: 'Complex plots, character development, challenges' },
    { id: 'teen', name: 'Teen', description: 'Mature themes, deeper emotions, real-world issues' }
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation process
    const steps = [
      'Creating characters...',
      'Writing your story...',
      'Drawing illustrations...',
      'Adding final touches...'
    ];
    
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // Add skill points and update achievements
    addSkillPoints('writing', 10);
    updateAchievementProgress('first-story', 1);
    updateAchievementProgress('storyteller', 1);
    
    setIsGenerating(false);
    onClose();
  };

  const canProceed = (step: number) => {
    switch (step) {
      case 1: return storyPrompt.trim().length > 0;
      case 2: return selectedGenres.length > 0; // At least one genre
      case 3: return selectedAgeGroup !== '';
      case 4: return selectedArtStyle !== '';
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-semibold text-gray-800">Tell me about your story idea</h3>
            <div className="relative">
              <textarea
                value={storyPrompt}
                onChange={(e) => updateStoryPrompt(e.target.value)}
                placeholder="Tell me about your story idea... For example: 'A brave little mouse who wants to become a knight and save the kingdom from a dragon'"
                className="w-full h-32 p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                maxLength={200}
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                {storyPrompt.length}/200 words
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-semibold text-gray-800">Choose your story genres</h3>
            <p className="text-sm text-gray-600">Select one or more genres (you can mix them!)</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => toggleGenre(genre.name)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedGenres.includes(genre.name)
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{genre.icon}</div>
                  <div className="font-medium text-gray-800">{genre.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{genre.description}</div>
                  {selectedGenres.includes(genre.name) && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>
            {selectedGenres.length > 0 && (
              <div className="text-sm text-purple-600 font-medium">
                Selected: {selectedGenres.join(', ')}
              </div>
            )}
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-semibold text-gray-800">Select age group</h3>
            <div className="space-y-3">
              {ageGroups.map((age) => (
                <button
                  key={age.id}
                  onClick={() => setSelectedAgeGroup(age.id)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    selectedAgeGroup === age.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="font-medium text-gray-800">{age.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{age.description}</div>
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-semibold text-gray-800">Choose art style</h3>
            <p className="text-sm text-gray-600">Select the visual style for your story illustrations</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {artStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedArtStyle(style.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedArtStyle === style.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{style.icon}</div>
                  <div className="font-medium text-gray-800">{style.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{style.description}</div>
                </button>
              ))}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (isGenerating) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6">
          <SparklesIcon className="h-8 w-8 text-white animate-spin" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Creating your story...</h3>
        <ProgressBar progress={75} maxProgress={100} color="purple" showPercentage />
        <p className="text-gray-600 mt-4">Drawing illustrations...</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">Step {currentStep} of 4</div>
          <ProgressBar progress={currentStep} maxProgress={4} color="purple" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>

      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Previous
        </button>

        {currentStep < 4 ? (
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!canProceed(currentStep)}
            className="flex items-center px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={!canProceed(currentStep)}
            className="flex items-center px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SparklesIcon className="h-4 w-4 mr-2" />
            Generate Story
          </button>
        )}
      </div>
    </div>
  );
};

export default AIAssistedCreation;
