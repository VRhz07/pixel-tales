import React, { useEffect, useState } from 'react';
import { useUserStore } from '../../stores/userStore';
import { useAuthStore } from '../../stores/authStore';
import { useStoryStore } from '../../stores/storyStore';
import { 
  BookOpenIcon,
  UserGroupIcon,
  HeartIcon,
  CalendarIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { AvatarWithBorder } from '../common/AvatarWithBorder';
import { api } from '@/services/api';

interface Achievement {
  id: number;
  name: string;
  description: string;
  category: string;
  metric_type: string;
  icon: string;
  color: string;
  target_value: number;
  rarity: string;
  sort_order: number;
  progress: number;
  progress_percentage: number;
  is_earned: boolean;
  earned_at: string | null;
}

interface UserStats {
  published_stories: number;
  manual_stories: number;
  ai_stories: number;
  total_words: number;
  friends: number;
  likes_received: number;
  comments_received: number;
  stories_read: number;
  characters_created: number;
  collaboration_count: number;
  leaderboard_rank: number;
}

const ProfilePage = () => {
  const { profile } = useUserStore();
  const { user } = useAuthStore();
  const { stories, characters, getStats } = useStoryStore();
  
  // Debug: Log user data
  useEffect(() => {
    console.log('ProfilePage - Current user:', user);
    console.log('ProfilePage - User name:', user?.name);
  }, [user]);
  
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  
  // Detect dark mode
  const isDarkMode = document.documentElement.classList.contains('dark');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllTrophies, setShowAllTrophies] = useState(false);

  // Fetch achievements from API with caching
  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        // Try to get cached achievements first
        const { useCacheStore } = await import('../../stores/cacheStore');
        const cacheStore = useCacheStore.getState();
        
        const cachedAchievements = cacheStore.getCache<any>('achievements');
        const cachedStats = cacheStore.getCache<any>('userStats');
        
        if (cachedAchievements && cachedStats) {
          console.log('📦 Using cached achievements and stats');
          setAchievements(cachedAchievements);
          setUserStats(cachedStats);
          setLoading(false);
          
          // Still fetch fresh data in background
          api.get('/achievements/progress/').then(response => {
            if (response.success) {
              setAchievements(response.achievements);
              setUserStats(response.user_stats);
              cacheStore.setCache('achievements', response.achievements, 5 * 60 * 1000);
              cacheStore.setCache('userStats', response.user_stats, 5 * 60 * 1000);
            }
          }).catch(err => console.warn('Background refresh failed:', err));
        } else {
          // No cache, fetch fresh data
          const response = await api.get('/achievements/progress/');
          
          if (response.success) {
            setAchievements(response.achievements);
            setUserStats(response.user_stats);
            cacheStore.setCache('achievements', response.achievements, 5 * 60 * 1000);
            cacheStore.setCache('userStats', response.user_stats, 5 * 60 * 1000);
          }
        }
      } catch (error) {
        console.error('Error fetching achievements:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAchievements();
    }
  }, [user]);

  // Get real stats from stores for display
  const storyStats = getStats();
  const displayStats = {
    storiesCreated: storyStats.totalStories,
    collaborationCount: userStats?.collaboration_count || 0,
    totalLikes: userStats?.likes_received || 0,
    daysActive: user?.created_at 
      ? Math.floor((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0
  };

  // Use persistent XP from backend (never decreases)
  const userLevel = {
    level: user?.level || 1,
    currentXP: user?.experience_points || 0,
    nextLevelXP: user?.xp_for_next_level || 500,
    currentLevelProgress: user?.xp_progress || 0,
    progressPercent: user?.xp_progress_percentage || 0
  };

  // Group achievements by status
  const earnedAchievements = achievements.filter(a => a.is_earned);
  const inProgressAchievements = achievements.filter(a => !a.is_earned && a.progress > 0);
  const lockedAchievements = achievements.filter(a => !a.is_earned && a.progress === 0);

  // Group achievements by category
  const achievementsByCategory = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  // Category configuration
  const categoryConfig: Record<string, { name: string; icon: string; color: string; borderColor: string }> = {
    'published_stories': { name: 'Published Stories', icon: '📚', color: '#3b82f6', borderColor: '#60a5fa' },
    'friends': { name: 'Friends & Social', icon: '👥', color: '#10b981', borderColor: '#34d399' },
    'words': { name: 'Word Count', icon: '✍️', color: '#f59e0b', borderColor: '#fbbf24' },
    'likes': { name: 'Likes Received', icon: '❤️', color: '#ef4444', borderColor: '#f87171' },
    'comments': { name: 'Comments Received', icon: '💬', color: '#8b5cf6', borderColor: '#a78bfa' },
    'stories_read': { name: 'Stories Read', icon: '📖', color: '#06b6d4', borderColor: '#22d3ee' },
    'leaderboard': { name: 'Leaderboard', icon: '🏆', color: '#eab308', borderColor: '#facc15' },
    'creation_type': { name: 'Creation Type', icon: '🎨', color: '#ec4899', borderColor: '#f472b6' },
    'collab': { name: 'Collaboration', icon: '🤝', color: '#6366f1', borderColor: '#818cf8' },
    'views': { name: 'Story Views', icon: '👁️', color: '#14b8a6', borderColor: '#2dd4bf' },
  };

  return (
    <div className="profile-page-container">
      {/* Page Header */}
      <h1 className="profile-page-header">Profile</h1>
      
      {/* User Profile Card */}
      <div className="profile-user-card">
        <div className="profile-avatar-container">
          <AvatarWithBorder
            avatar={user?.avatar || profile.avatar}
            borderId={user?.selected_avatar_border || 'basic'}
            size={100}
          />
        </div>
        <h2 className="profile-user-title">{user?.name || profile.name}</h2>
        <p className="profile-level-info">Level {userLevel.level} • {userLevel.currentXP.toLocaleString()} XP</p>
        
        {/* Progress Bar */}
        <div className="profile-progress-container">
          <div 
            className="profile-progress-fill" 
            style={{ width: `${userLevel.progressPercent}%` }}
          ></div>
        </div>
        <p className="profile-progress-text">
          {userLevel.nextLevelXP - userLevel.currentLevelProgress} XP until Level {userLevel.level + 1}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="profile-stats-grid">
        <div className="profile-stat-card">
          <BookOpenIcon className="profile-stat-icon" />
          <div className="profile-stat-value">{displayStats.storiesCreated}</div>
          <div className="profile-stat-label">Stories Created</div>
        </div>
        
        <div className="profile-stat-card">
          <UserGroupIcon className="profile-stat-icon" />
          <div className="profile-stat-value">{displayStats.collaborationCount}</div>
          <div className="profile-stat-label">Collaborations</div>
        </div>
        
        <div className="profile-stat-card">
          <HeartIcon className="profile-stat-icon" />
          <div className="profile-stat-value">{displayStats.totalLikes}</div>
          <div className="profile-stat-label">Total Likes</div>
        </div>
        
        <div className="profile-stat-card">
          <CalendarIcon className="profile-stat-icon" />
          <div className="profile-stat-value">{displayStats.daysActive}</div>
          <div className="profile-stat-label">Days Active</div>
        </div>
      </div>

      {/* Achievement Categories Section */}
      <div className="profile-achievements-header">
        <span className="profile-achievements-emoji">🏆</span>
        <h2 className="profile-achievements-title">
          Achievement Categories
          <span style={{ 
            marginLeft: '12px', 
            fontSize: '14px', 
            background: '#8b5cf6', 
            padding: '4px 12px', 
            borderRadius: '12px',
            fontWeight: '600'
          }}>
            {earnedAchievements.length} / {achievements.length}
          </span>
        </h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
          Loading achievements...
        </div>
      ) : (
        <>
          {/* Category Cards Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '20px',
            marginBottom: '32px'
          }}>
            {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => {
              const config = categoryConfig[category];
              if (!config) return null;
              
              const earnedCount = categoryAchievements.filter(a => a.is_earned).length;
              const totalCount = categoryAchievements.length;
              const progressPercent = (earnedCount / totalCount) * 100;
              
              return (
                <div
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    background: isDarkMode ? '#2a2435' : '#ffffff',
                    borderRadius: '16px',
                    padding: '24px',
                    border: `3px solid ${config.borderColor}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: isDarkMode ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = `0 8px 24px ${config.color}40`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Top Border Gradient */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(90deg, ${config.color}, ${config.borderColor})`
                  }} />
                  
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                      fontSize: '48px',
                      width: '64px',
                      height: '64px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `${config.color}22`,
                      borderRadius: '12px',
                      border: `2px solid ${config.color}`
                    }}>
                      {config.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ color: isDarkMode ? '#ffffff' : '#1f2937', fontSize: '20px', fontWeight: '700', margin: 0 }}>
                        {config.name}
                      </h3>
                      <p style={{ color: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: '14px', margin: '4px 0 0 0' }}>
                        {totalCount} achievements
                      </p>
                    </div>
                    <div style={{
                      background: earnedCount > 0 
                        ? (isDarkMode ? `${config.color}33` : `${config.color}22`)
                        : (isDarkMode ? '#374151' : '#e5e7eb'),
                      padding: '8px 16px',
                      borderRadius: '12px',
                      border: `2px solid ${earnedCount > 0 ? config.color : (isDarkMode ? '#4b5563' : '#d1d5db')}`,
                      fontWeight: '700',
                      fontSize: '16px',
                      color: earnedCount > 0 ? config.color : (isDarkMode ? '#9ca3af' : '#6b7280')
                    }}>
                      {earnedCount}/{totalCount}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: isDarkMode ? '#374151' : '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      width: `${progressPercent}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${config.color}, ${config.borderColor})`,
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                  
                  {/* Achievement Icons Preview */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {categoryAchievements.slice(0, 8).map((achievement, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: '24px',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: achievement.is_earned 
                            ? `${config.color}22` 
                            : (isDarkMode ? '#1a1625' : '#f3f4f6'),
                          borderRadius: '8px',
                          border: `2px solid ${achievement.is_earned ? config.color : (isDarkMode ? '#374151' : '#d1d5db')}`,
                          filter: achievement.is_earned ? 'none' : 'grayscale(100%)',
                          opacity: achievement.is_earned ? 1 : 0.4
                        }}
                      >
                        {achievement.icon}
                      </div>
                    ))}
                    {categoryAchievements.length > 8 && (
                      <div style={{
                        fontSize: '14px',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isDarkMode ? '#374151' : '#e5e7eb',
                        borderRadius: '8px',
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                        fontWeight: '600'
                      }}>
                        +{categoryAchievements.length - 8}
                      </div>
                    )}
                  </div>
                  
                  {/* Click to view all */}
                  <div style={{
                    textAlign: 'center',
                    color: config.color,
                    fontSize: '14px',
                    fontWeight: '600',
                    marginTop: '12px'
                  }}>
                    Click to view all →
                  </div>
                </div>
              );
            })}
          </div>

          {/* Category Modal */}
          {selectedCategory && achievementsByCategory[selectedCategory] && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px'
              }}
              onClick={() => setSelectedCategory(null)}
            >
              <div
                style={{
                  background: isDarkMode ? '#1a1625' : '#ffffff',
                  borderRadius: '24px',
                  maxWidth: '600px',
                  width: '100%',
                  maxHeight: '80vh',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  border: `3px solid ${categoryConfig[selectedCategory]?.borderColor}`
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div style={{
                  padding: '24px',
                  borderBottom: isDarkMode ? '2px solid #2a2435' : '2px solid #e5e7eb',
                  background: `linear-gradient(135deg, ${categoryConfig[selectedCategory]?.color}22, transparent)`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '48px' }}>
                      {categoryConfig[selectedCategory]?.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h2 style={{ color: isDarkMode ? '#ffffff' : '#1f2937', fontSize: '24px', fontWeight: '700', margin: 0 }}>
                        {categoryConfig[selectedCategory]?.name}
                      </h2>
                      <p style={{ color: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: '14px', margin: '4px 0 0 0' }}>
                        {achievementsByCategory[selectedCategory].filter(a => a.is_earned).length} of {achievementsByCategory[selectedCategory].length} unlocked
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      style={{
                        background: isDarkMode ? '#374151' : '#e5e7eb',
                        border: 'none',
                        borderRadius: '8px',
                        color: isDarkMode ? '#ffffff' : '#1f2937',
                        fontSize: '24px',
                        width: '40px',
                        height: '40px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                {/* Modal Content - Scrollable */}
                <div style={{
                  padding: '24px',
                  overflowY: 'auto',
                  flex: 1
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {achievementsByCategory[selectedCategory]
                      .sort((a, b) => {
                        if (a.is_earned && !b.is_earned) return -1;
                        if (!a.is_earned && b.is_earned) return 1;
                        if (!a.is_earned && !b.is_earned) {
                          if (a.progress > 0 && b.progress === 0) return -1;
                          if (a.progress === 0 && b.progress > 0) return 1;
                        }
                        return 0;
                      })
                      .map(achievement => (
                        <div
                          key={achievement.id}
                          style={{
                            background: isDarkMode ? '#2a2435' : '#f9fafb',
                            borderRadius: '12px',
                            padding: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            border: `2px solid ${achievement.is_earned ? categoryConfig[selectedCategory]?.color : (isDarkMode ? '#374151' : '#d1d5db')}`,
                            opacity: achievement.is_earned ? 1 : (achievement.progress > 0 ? 0.9 : 0.6)
                          }}
                        >
                          {/* Icon with Progress Badge */}
                          <div style={{ position: 'relative' }}>
                            <div style={{
                              fontSize: '40px',
                              width: '56px',
                              height: '56px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: achievement.is_earned 
                                ? `${categoryConfig[selectedCategory]?.color}33`
                                : (isDarkMode ? '#1a1625' : '#ffffff'),
                              borderRadius: '12px',
                              border: `2px solid ${achievement.is_earned ? categoryConfig[selectedCategory]?.color : (isDarkMode ? '#374151' : '#d1d5db')}`,
                              filter: achievement.is_earned ? 'none' : 'grayscale(100%)'
                            }}>
                              {achievement.icon}
                            </div>
                            {!achievement.is_earned && achievement.progress > 0 && (
                              <div style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                background: '#8b5cf6',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: '700',
                                padding: '4px 6px',
                                borderRadius: '8px',
                                border: isDarkMode ? '2px solid #1a1625' : '2px solid #ffffff'
                              }}>
                                {Math.round(achievement.progress_percentage)}%
                              </div>
                            )}
                            {achievement.is_earned && (
                              <div style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                background: '#10b981',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: '700',
                                padding: '4px 6px',
                                borderRadius: '8px',
                                border: isDarkMode ? '2px solid #1a1625' : '2px solid #ffffff'
                              }}>
                                100%
                              </div>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div style={{ flex: 1 }}>
                            <h4 style={{ 
                              color: isDarkMode ? '#ffffff' : '#1f2937', 
                              fontSize: '16px', 
                              fontWeight: '600', 
                              margin: '0 0 4px 0' 
                            }}>
                              {achievement.name}
                            </h4>
                            <p style={{ 
                              color: isDarkMode ? '#9ca3af' : '#6b7280', 
                              fontSize: '13px', 
                              margin: '0 0 8px 0' 
                            }}>
                              {achievement.description}
                            </p>
                            
                            {/* Progress Bar */}
                            {!achievement.is_earned && (
                              <>
                                <div style={{
                                  width: '100%',
                                  height: '6px',
                                  background: isDarkMode ? '#374151' : '#e5e7eb',
                                  borderRadius: '3px',
                                  overflow: 'hidden',
                                  marginBottom: '4px'
                                }}>
                                  <div style={{
                                    width: `${achievement.progress_percentage}%`,
                                    height: '100%',
                                    background: `linear-gradient(90deg, #8b5cf6, #a78bfa)`,
                                    transition: 'width 0.5s ease'
                                  }} />
                                </div>
                                <p style={{ 
                                  color: '#8b5cf6', 
                                  fontSize: '12px', 
                                  fontWeight: '600',
                                  margin: 0 
                                }}>
                                  {achievement.progress} / {achievement.target_value}
                                </p>
                              </>
                            )}
                            {achievement.is_earned && achievement.earned_at && (
                              <p style={{ 
                                color: '#10b981', 
                                fontSize: '12px', 
                                fontWeight: '600',
                                margin: 0 
                              }}>
                                ✓ Completed {new Date(achievement.earned_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Trophy Shelf */}
      <h2 className="profile-trophy-shelf-title" style={{ marginTop: '40px' }}>Trophy Shelf</h2>
      <div className="profile-trophy-shelf-container">
        <div className="profile-trophy-grid">
          {(showAllTrophies 
            ? earnedAchievements 
            : earnedAchievements
                .sort((a, b) => new Date(b.earned_at || 0).getTime() - new Date(a.earned_at || 0).getTime())
                .slice(0, 12)
          ).map((achievement, index) => (
            <span 
              key={index} 
              className="profile-trophy-emoji"
              title={`${achievement.name} - ${achievement.description}`}
            >
              {achievement.icon}
            </span>
          ))}
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '1rem',
          flexDirection: 'column'
        }}>
          <p className="profile-trophy-description">
            {earnedAchievements.length} achievements earned
            {!showAllTrophies && earnedAchievements.length > 12 && ` • Showing ${Math.min(12, earnedAchievements.length)} most recent`}
          </p>
          {earnedAchievements.length > 12 && (
            <button
              onClick={() => setShowAllTrophies(!showAllTrophies)}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: isDarkMode ? '#8b5cf6' : '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(139, 92, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#7c3aed';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(139, 92, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#8b5cf6';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(139, 92, 246, 0.3)';
              }}
            >
              {showAllTrophies ? 'Show Recent Only' : `View All ${earnedAchievements.length} Achievements`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
