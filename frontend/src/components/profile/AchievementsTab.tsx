import React from 'react';
import { motion } from 'framer-motion';

const AchievementsTab = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-6 fade-in"
    >
      <div className="settings-card text-center">
        <div className="text-6xl mb-4 animate-bounce">🏆</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Achievement Center</h2>
        <p className="text-gray-600 mb-6">Track your progress and unlock special rewards!</p>
        
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">🎯 Coming Soon</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>• Reading streak tracking</p>
              <p>• Story creation milestones</p>
              <p>• Special badges and rewards</p>
              <p>• Progress celebrations</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="text-2xl mb-1">📚</div>
              <div className="text-xs text-gray-600">Stories Read</div>
              <div className="font-bold text-gray-800">Coming Soon</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="text-2xl mb-1">🔥</div>
              <div className="text-xs text-gray-600">Day Streak</div>
              <div className="font-bold text-gray-800">Coming Soon</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="text-2xl mb-1">⭐</div>
              <div className="text-xs text-gray-600">Achievements</div>
              <div className="font-bold text-gray-800">Coming Soon</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AchievementsTab;
