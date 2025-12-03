import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  target_value: number;
  is_earned: boolean;
  progress: number;
  earned_at?: string;
}

const AchievementsTab = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'earned' | 'in-progress' | 'locked'>('all');

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/achievements/progress/');
      setAchievements(response.data);
    } catch (error: any) {
      console.error('Error fetching achievements:', error);
      setError(error.response?.data?.message || 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'uncommon': return 'bg-green-100 text-green-700 border-green-300';
      case 'rare': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getProgressPercentage = (achievement: Achievement) => {
    if (achievement.is_earned) return 100;
    if (!achievement.target_value) return 0;
    return Math.min((achievement.progress / achievement.target_value) * 100, 100);
  };

  const filteredAchievements = achievements.filter(ach => {
    if (filter === 'earned') return ach.is_earned;
    if (filter === 'in-progress') return !ach.is_earned && ach.progress > 0;
    if (filter === 'locked') return !ach.is_earned && ach.progress === 0;
    return true;
  });

  const earnedCount = achievements.filter(a => a.is_earned).length;
  const inProgressCount = achievements.filter(a => !a.is_earned && a.progress > 0).length;
  const lockedCount = achievements.filter(a => !a.is_earned && a.progress === 0).length;

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4 py-6 text-center"
      >
        <div className="animate-spin text-4xl mb-4">⚙️</div>
        <p className="text-gray-600">Loading achievements...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4 py-6 text-center"
      >
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchAchievements}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Retry
        </button>
      </motion.div>
    );
  }

  if (achievements.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4 py-6 text-center"
      >
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">No Achievements Yet</h2>
        <p className="text-gray-600">Start creating stories to earn achievements!</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-6 fade-in"
    >
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-lg p-3 text-center">
          <div className="text-2xl mb-1">✅</div>
          <div className="text-xs text-green-700">Earned</div>
          <div className="font-bold text-green-800">{earnedCount}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg p-3 text-center">
          <div className="text-2xl mb-1">🔄</div>
          <div className="text-xs text-blue-700">In Progress</div>
          <div className="font-bold text-blue-800">{inProgressCount}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-3 text-center">
          <div className="text-2xl mb-1">🔒</div>
          <div className="text-xs text-gray-700">Locked</div>
          <div className="font-bold text-gray-800">{lockedCount}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg p-3 text-center">
          <div className="text-2xl mb-1">🏆</div>
          <div className="text-xs text-purple-700">Total</div>
          <div className="font-bold text-purple-800">{achievements.length}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {['all', 'earned', 'in-progress', 'locked'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f === 'in-progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Achievements List */}
      <div className="space-y-3">
        {filteredAchievements.map((achievement) => {
          const percentage = getProgressPercentage(achievement);
          
          return (
            <div
              key={achievement.id}
              className={`relative rounded-xl border-2 p-4 ${
                achievement.is_earned
                  ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300'
                  : 'bg-white border-gray-200'
              }`}
            >
              {/* Achievement Icon and Info */}
              <div className="flex items-start gap-3">
                <div className={`text-4xl ${achievement.is_earned ? 'animate-bounce' : 'opacity-50'}`}>
                  {achievement.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className={`font-semibold ${achievement.is_earned ? 'text-yellow-900' : 'text-gray-800'}`}>
                      {achievement.name}
                      {achievement.is_earned && ' ✓'}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getRarityColor(achievement.rarity)}`}>
                      {achievement.rarity}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                  
                  {/* Progress Bar */}
                  {!achievement.is_earned && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{achievement.progress} / {achievement.target_value}</span>
                        <span>{percentage.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Earned Date */}
                  {achievement.is_earned && achievement.earned_at && (
                    <p className="text-xs text-yellow-700 mt-2">
                      Earned {new Date(achievement.earned_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No achievements in this category
        </div>
      )}
    </motion.div>
  );
};

export default AchievementsTab;
