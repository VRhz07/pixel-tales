import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';

export interface OnboardingPage {
  id: string;
  title: string;
  description: string;
  image?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

interface StorybookOnboardingProps {
  pages: OnboardingPage[];
  onComplete: () => void;
  onSkip?: () => void;
  title?: string;
}

const StorybookOnboarding: React.FC<StorybookOnboardingProps> = ({
  pages,
  onComplete,
  onSkip,
  title = "Welcome to PixelTales",
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const { isDarkMode } = useThemeStore();
  const isLastPage = currentPage === pages.length - 1;

  const handleNext = () => {
    if (isLastPage) {
      onComplete();
    } else {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 ${
      isDarkMode ? 'bg-gray-900/90' : 'bg-white/90'
    } backdrop-blur-sm`}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`relative w-full max-w-4xl min-h-[500px] sm:min-h-[600px] flex flex-col rounded-3xl shadow-2xl overflow-hidden ${
          isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-[#FDFBF7] border border-gray-200'
        }`}
      >
        {/* Book Binding/Spine visual effect */}
        <div className={`absolute top-0 bottom-0 left-[50%] w-12 -translate-x-1/2 z-0 hidden md:block ${
          isDarkMode 
            ? 'bg-gradient-to-r from-transparent via-gray-900/20 to-transparent shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]' 
            : 'bg-gradient-to-r from-transparent via-gray-300/30 to-transparent shadow-[inset_0_0_10px_rgba(0,0,0,0.05)]'
        }`} />

        {/* Skip button */}
        {onSkip && (
          <button 
            onClick={onSkip}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 px-4 py-2 text-sm font-medium rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Skip Intro
          </button>
        )}

        <div className="flex-1 flex flex-col md:flex-row relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col md:flex-row w-full h-full"
            >
              {/* Left Page (Image/Visual) */}
              <div className={`flex-1 flex flex-col items-center justify-center p-8 sm:p-12 border-b md:border-b-0 md:border-r ${
                isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-[#FDFBF7]'
              }`}>
                {pages[currentPage].image || (
                  <div className={`w-48 h-48 sm:w-64 sm:h-64 rounded-full flex items-center justify-center ${
                    isDarkMode ? 'bg-gray-700 text-purple-400' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {pages[currentPage].icon || <Sparkles size={100} />}
                  </div>
                )}
              </div>

              {/* Right Page (Content) */}
              <div className={`flex-1 flex flex-col justify-center p-8 sm:p-12 ${
                isDarkMode ? 'bg-gray-800' : 'bg-[#FDFBF7]'
              }`}>
                <div className="max-w-md mx-auto w-full">
                  <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`} style={{ fontFamily: 'var(--font-heading)' }}>
                    {pages[currentPage].title}
                  </h2>
                  <p className={`text-lg mb-8 leading-relaxed ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {pages[currentPage].description}
                  </p>
                  
                  {pages[currentPage].action && (
                    <div className="mb-8">
                      {pages[currentPage].action}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className={`px-8 py-6 flex items-center justify-between border-t z-10 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-[#FDFBF7] border-gray-200'
        }`}>
          {/* Progress Indicators */}
          <div className="flex space-x-2">
            {pages.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentPage 
                    ? 'w-8 bg-purple-600' 
                    : isDarkMode ? 'w-2 bg-gray-600' : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex space-x-3">
            {currentPage > 0 && (
              <button
                onClick={handlePrev}
                className={`p-3 sm:px-6 sm:py-3 rounded-full flex items-center justify-center font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                <ChevronLeft className="w-5 h-5 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
            
            <button
              onClick={handleNext}
              className={`p-3 sm:px-8 sm:py-3 rounded-full flex items-center justify-center font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 text-white ${
                isLastPage 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
              style={{
                boxShadow: isLastPage ? '0 4px 14px 0 rgba(5, 150, 105, 0.39)' : '0 4px 14px 0 rgba(124, 58, 237, 0.39)'
              }}
            >
              <span className="hidden sm:inline mr-2 text-white">
                {isLastPage ? "Get Started" : "Next"}
              </span>
              {isLastPage ? <Check className="w-5 h-5 text-white" /> : <ChevronRight className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StorybookOnboarding;
