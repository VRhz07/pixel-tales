import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpenIcon, 
  UserGroupIcon, 
  TrophyIcon,
  FireIcon,
  SparklesIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  DocumentTextIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { useCreationStore } from '../../stores/creationStore';
import StoryCreationModal from '../creation/StoryCreationModal';
import CharacterCreationModal from '../creation/CharacterCreationModal';
import AIStoryModal from '../creation/AIStoryModal';
import AchievementModal from '../ui/AchievementModal';
import ProgressBar from '../ui/ProgressBar';

// Simple error boundary component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, { hasError: boolean }> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('Error caught by boundary:', error);
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h2>
          <p className="text-gray-700 mb-4">We're having trouble loading the creation page.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const CreatePageContent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showAIStoryModal, setShowAIStoryModal] = useState(false);
  const { achievements, skillPoints, creationStreak } = useCreationStore();

  useEffect(() => {
    console.log('Component mounted, checking store state:', {
      achievements,
      skillPoints,
      creationStreak
    });
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading creation tools...</p>
        </div>
      </div>
    );
  }

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const totalSkillPoints = Object.values(skillPoints).reduce((sum, points) => sum + points, 0);

  const dailyChallenges = [
    {
      id: 'story-prompt',
      title: 'Daily Story Prompt',
      description: 'Write a story about a character who finds a mysterious key',
      reward: '50 bonus points',
      icon: '📝',
      completed: false
    },
    {
      id: 'character-design',
      title: 'Character Design Challenge',
      description: 'Create a character inspired by your favorite animal',
      reward: 'Exclusive badge',
      icon: '🎨',
      completed: false
    },
    {
      id: 'illustration-practice',
      title: 'Illustration Practice',
      description: 'Draw a magical forest scene',
      reward: '30 skill points',
      icon: '🌲',
      completed: true
    }
  ];

  const creationOptions = [
    {
      id: 'ai-stories',
      title: '🤖 AI Stories',
      description: 'Let AI help create your story',
      icon: BeakerIcon,
      gradient: 'from-purple-500 to-purple-600',
      buttonText: 'Start with AI',
      onClick: () => setShowAIStoryModal(true)
    },
    {
      id: 'manual',
      title: '✏️ Manual',
      description: 'Draw and write from scratch',
      icon: PencilIcon,
      gradient: 'from-orange-400 to-yellow-500',
      buttonText: 'Create Manually',
      onClick: () => setShowStoryModal(true)
    },
    {
      id: 'templates',
      title: '📚 Templates',
      description: 'Use proven story structures',
      icon: DocumentTextIcon,
      gradient: 'from-blue-500 to-green-500',
      buttonText: 'Use Templates',
      onClick: () => setShowStoryModal(true)
    },
    {
      id: 'characters',
      title: '👥 Characters',
      description: 'Create memorable characters',
      icon: UserGroupIcon,
      gradient: 'from-purple-500 to-purple-700',
      buttonText: 'Create Character',
      onClick: () => setShowCharacterModal(true)
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pb-20 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-6 relative z-10">
        <div className="max-w-8xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">Create ✨</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Bring your imagination to life</p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <div className="text-center">
                <div className="text-sm sm:text-lg font-bold text-orange-600">{creationStreak}</div>
                <div className="text-xs text-gray-500">Streak</div>
              </div>
              <div className="text-center">
                <div className="text-sm sm:text-lg font-bold text-purple-600">{totalSkillPoints}</div>
                <div className="text-xs text-gray-500">Points</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6 space-y-8 max-w-8xl mx-auto">
        {/* Hero Section - Creation Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">Start Creating Your Story</h2>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">Choose how you'd like to bring your imagination to life. Create magical stories or design unique characters for your adventures.</p>
        </motion.div>

        {/* Creation Options - Now First! */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6 mb-8"
        >
          {creationOptions.map((option, index) => {
            const IconComponent = option.icon;
            return (
              <motion.div
                key={option.id}
                className="creation-card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.5, ease: "easeOut" }}
                whileHover={{ y: -3 }}
              >
                <div className="flex flex-col items-center">
                  {/* Icon Container */}
                  <div className={`creation-icon bg-gradient-to-br ${option.gradient}`}>
                    <IconComponent className="h-8 w-8 text-white stroke-2" style={{ color: 'white', stroke: 'currentColor' }} />
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-800 mb-3">
                    {option.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-8 leading-relaxed">
                    {option.description}
                  </p>
                  
                  {/* Action Button */}
                  <motion.button
                    onClick={option.onClick}
                    className={`creation-button bg-gradient-to-r ${option.gradient}`}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      background: option.id === 'ai-stories' ? 'linear-gradient(to right, #8b5cf6, #9333ea)' :
                                 option.id === 'manual' ? 'linear-gradient(to right, #fb923c, #eab308)' :
                                 option.id === 'templates' ? 'linear-gradient(to right, #3b82f6, #22c55e)' :
                                 'linear-gradient(to right, #8b5cf6, #7c3aed)'
                    }}
                  >
                    {option.buttonText}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Daily Challenges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="progress-section p-6"
        >
          <div className="flex items-center mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 text-white mr-4">
              <CalendarDaysIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Daily Creation Challenges</h2>
              <p className="text-gray-600 text-sm">Complete challenges to earn rewards</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6">
            {dailyChallenges.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`challenge-card ${challenge.completed ? 'completed' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-2xl">{challenge.icon}</div>
                  {challenge.completed && (
                    <div className="challenge-badge completed">✓ Done</div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{challenge.title}</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">{challenge.description}</p>
                <div className={`challenge-badge ${challenge.completed ? 'completed' : ''}`}>
                  {challenge.reward}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="progress-section p-6"
        >
          <div className="flex items-center mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white mr-4">
              <TrophyIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Your Creative Progress</h2>
              <p className="text-gray-600 text-sm">Track your creative journey and achievements</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Skill Progress */}
            <div className="progress-card">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 mr-2"></div>
                Skill Development
              </h3>
              <div className="space-y-4">
                <ProgressBar 
                  progress={skillPoints.writing} 
                  maxProgress={100} 
                  label="Writing" 
                  color="purple" 
                />
                <ProgressBar 
                  progress={skillPoints.illustration} 
                  maxProgress={100} 
                  label="Illustration" 
                  color="blue" 
                />
                <ProgressBar 
                  progress={skillPoints.character} 
                  maxProgress={100} 
                  label="Character Design" 
                  color="green" 
                />
              </div>
            </div>

            {/* Achievement Progress */}
            <div className="progress-card">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-blue-400 mr-2"></div>
                Recent Achievements
              </h3>
              <div className="space-y-3">
                {achievements.slice(0, 3).map((achievement) => (
                  <div key={achievement.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="text-xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">
                        {achievement.name}
                      </div>
                      <ProgressBar 
                        progress={achievement.progress} 
                        maxProgress={achievement.maxProgress} 
                        color={achievement.unlocked ? 'green' : 'orange'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Creation Streak */}
            <div className="progress-card text-center">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-red-400 mr-2"></div>
                Creation Streak
              </h3>
              <div className="streak-container">
                <FireIcon className="h-6 w-6" />
              </div>
              <div className="text-2xl font-bold text-gray-800 mb-2">{creationStreak} days</div>
              <div className="text-sm text-gray-600">Keep your creative momentum!</div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          <motion.div 
            className="stat-card"
            whileHover={{ y: -2 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="stat-number text-purple-600">0</div>
            <div className="stat-label">Stories Created</div>
          </motion.div>
          <motion.div 
            className="stat-card"
            whileHover={{ y: -2 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
          >
            <div className="stat-number text-blue-600">0</div>
            <div className="stat-label">Characters Designed</div>
          </motion.div>
          <motion.div 
            className="stat-card"
            whileHover={{ y: -2 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="stat-number text-green-600">0</div>
            <div className="stat-label">Illustrations Made</div>
          </motion.div>
          <motion.div 
            className="stat-card"
            whileHover={{ y: -2 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
          >
            <div className="stat-number text-yellow-600">{unlockedAchievements.length}</div>
            <div className="stat-label">Achievements Unlocked</div>
          </motion.div>
        </motion.div>
      </div>

      {/* Modals */}
      <StoryCreationModal 
        isOpen={showStoryModal} 
        onClose={() => setShowStoryModal(false)} 
      />
      <CharacterCreationModal 
        isOpen={showCharacterModal} 
        onClose={() => setShowCharacterModal(false)} 
      />
      <AIStoryModal 
        isOpen={showAIStoryModal} 
        onClose={() => setShowAIStoryModal(false)} 
      />
      <AchievementModal />
    </div>
  );
};

const CreatePage = () => (
  <ErrorBoundary>
    <CreatePageContent />
  </ErrorBoundary>
);

export default CreatePage;
