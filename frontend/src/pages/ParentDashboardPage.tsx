import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOpenIcon, 
  ClockIcon, 
  TrophyIcon, 
  ChartBarIcon,
  UserGroupIcon,
  StarIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  PlusIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  BellIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';
import Logo from '../components/common/Logo';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useI18nStore } from '../stores/i18nStore';
import { useNotificationStore } from '../stores/notificationStore';
import parentDashboardService, { Child, ChildStatistics, Activity, Goal, ChildFormData, ChildAnalytics } from '../services/parentDashboard.service';
import AddChildModal from '../components/parent/AddChildModal';
import UnifiedProfileSwitcher from '../components/parent/UnifiedProfileSwitcher';
import StoryViewModal from '../components/parent/StoryViewModal';
import ParentBottomNav from '../components/navigation/ParentBottomNav';
import { useAccountSwitchStore } from '../stores/accountSwitchStore';
import { storage } from '../utils/storage';
import './ParentDashboardPage.css';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: string;
  changePositive?: boolean;
  iconColor: string;
}

interface ActivityCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  progress?: number;
  timestamp?: string;
  rating?: number;
  gradient: string;
}

interface StoryCardProps {
  title: string;
  category: string;
  difficulty: 'easy' | 'medium';
  pages: number;
  timeRead: string;
  rating: number;
  completed: boolean;
  gradient: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, change, changePositive, iconColor }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ backgroundColor: `${iconColor}15`, color: iconColor }}>
        {icon}
      </div>
      <div className="stat-card-content">
        <p className="stat-card-label">{label}</p>
        <h3 className="stat-card-value">{value}</h3>
        {change && (
          <p className={`stat-card-change ${changePositive ? 'positive' : 'neutral'}`}>
            {change}
          </p>
        )}
      </div>
    </div>
  );
};

const ActivityCard: React.FC<ActivityCardProps> = ({ 
  icon, 
  title, 
  subtitle, 
  progress, 
  timestamp, 
  rating,
  gradient 
}) => {
  return (
    <div className="activity-card">
      <div className="activity-card-icon" style={{ background: gradient }}>
        {icon}
      </div>
      <div className="activity-card-content">
        <h4 className="activity-card-title">{title}</h4>
        <p className="activity-card-subtitle">{subtitle}</p>
        {progress !== undefined && (
          <div className="activity-progress-bar">
            <div className="activity-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        )}
        {rating !== undefined && (
          <div className="activity-rating">
            {[...Array(5)].map((_, i) => (
              <StarIcon 
                key={i} 
                className={`activity-star ${i < rating ? 'filled' : ''}`}
              />
            ))}
          </div>
        )}
        {timestamp && <p className="activity-timestamp">{timestamp}</p>}
      </div>
    </div>
  );
};

const StoryCard: React.FC<StoryCardProps> = ({ 
  title, 
  category, 
  difficulty, 
  pages, 
  timeRead, 
  rating,
  completed,
  gradient,
  icon 
}) => {
  return (
    <div className="story-card">
      <div className="story-card-image" style={{ background: gradient }}>
        <div className="story-card-icon">{icon}</div>
        {completed && (
          <div className="story-completion-checkmark">
            <CheckCircleIcon />
          </div>
        )}
      </div>
      <div className="story-card-content">
        <h4 className="story-card-title">{title}</h4>
        <div className="story-card-badges">
          <span className="story-badge-category">{category}</span>
          <span className={`story-badge-difficulty ${difficulty}`}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </span>
        </div>
        <div className="story-card-metadata">
          <span><BookOpenIcon /> {pages} pages</span>
          <span><ClockIcon /> {timeRead}</span>
        </div>
        <div className="story-card-rating">
          {[...Array(5)].map((_, i) => (
            <StarIcon 
              key={i} 
              className={`story-star ${i < rating ? 'filled' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const ParentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const { language, t } = useI18nStore();
  const { counts, fetchNotificationCounts } = useNotificationStore();
  const { setActiveAccount, clearActiveAccount } = useAccountSwitchStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'activity'>('overview');
  const [activitySubTab, setActivitySubTab] = useState<'notifications' | 'library'>('notifications');
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [statistics, setStatistics] = useState<ChildStatistics | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [analytics, setAnalytics] = useState<ChildAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [childStories, setChildStories] = useState<any[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [selectedStory, setSelectedStory] = useState<any | null>(null);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [storyFilter, setStoryFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [storySortBy, setStorySortBy] = useState<'newest' | 'oldest' | 'mostLiked' | 'mostViewed'>('newest');
  const [storySearchQuery, setStorySearchQuery] = useState('');

  // Set active account as parent when viewing dashboard
  useEffect(() => {
    setActiveAccount('parent');
  }, [setActiveAccount]);

  // Check location state for tab on mount/navigation
  useEffect(() => {
    const stateTab = (location.state as any)?.tab;
    if (stateTab && (stateTab === 'overview' || stateTab === 'analytics' || stateTab === 'activity')) {
      console.log('Setting tab from location state:', stateTab);
      setActiveTab(stateTab);
    }
  }, [location.state]);

  useEffect(() => {
    // Check if user is parent or teacher
    const userType = user?.profile?.user_type || user?.user_type;
    if (user && userType && userType !== 'parent' && userType !== 'teacher') {
      navigate('/home');
    } else if (user && userType) {
      loadChildren();
      
      // Fetch notification counts
      fetchNotificationCounts();
      
      // Auto-refresh notifications every 30 seconds
      const interval = setInterval(() => {
        fetchNotificationCounts();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user, navigate]);

  // Listen for tab change events from bottom nav
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      const { tab } = event.detail;
      console.log('Tab change event received:', tab);
      if (tab === 'overview') {
        setActiveTab('overview');
      } else if (tab === 'analytics') {
        setActiveTab('analytics');
      } else if (tab === 'activity') {
        setActiveTab('activity');
      }
    };

    window.addEventListener('parent-tab-change', handleTabChange as EventListener);
    return () => {
      window.removeEventListener('parent-tab-change', handleTabChange as EventListener);
    };
  }, []);

  const loadChildren = async () => {
    try {
      setLoading(true);
      const userType = user?.profile?.user_type || user?.user_type;
      
      if (!userType) {
        console.log('No user type found, user may not be logged in');
        setLoading(false);
        return;
      }
      
      let childrenData: Child[];
      if (userType === 'parent') {
        childrenData = await parentDashboardService.getChildren();
      } else {
        childrenData = await parentDashboardService.getStudents();
      }
      
      console.log('Loaded children/students:', childrenData);
      setChildren(childrenData);
      
      // Auto-select first child if available
      if (childrenData.length > 0 && !selectedChild) {
        setSelectedChild(childrenData[0]);
      }
    } catch (error: any) {
      console.error('Error loading children:', error);
      if (error.response?.status === 401) {
        console.error('Authentication error - user may need to log in again');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChild) {
      loadChildData(selectedChild.id);
    }
  }, [selectedChild]);

  // Real-time polling for activity updates when on activity notifications tab
  useEffect(() => {
    if (activeTab === 'activity' && activitySubTab === 'notifications' && selectedChild) {
      // Load immediately
      loadChildData(selectedChild.id);
      
      // Then poll every 10 seconds for real-time updates
      const pollInterval = setInterval(() => {
        loadChildData(selectedChild.id);
      }, 10000); // 10 seconds
      
      return () => clearInterval(pollInterval);
    }
  }, [activeTab, activitySubTab, selectedChild]);

  const loadChildData = async (childId: number) => {
    try {
      const [stats, acts, gls] = await Promise.all([
        parentDashboardService.getChildStatistics(childId),
        parentDashboardService.getChildActivities(childId),
        parentDashboardService.getChildGoals(childId)
      ]);
      
      setStatistics(stats);
      setActivities(acts);
      setGoals(gls);
    } catch (error) {
      console.error('Error loading child data:', error);
    }
  };

  const loadAnalytics = async (childId: number) => {
    try {
      setLoadingAnalytics(true);
      const analyticsData = await parentDashboardService.getChildAnalytics(childId);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadChildStories = async (childId: number) => {
    try {
      setLoadingStories(true);
      const stories = await parentDashboardService.getChildStories(childId);
      setChildStories(stories);
    } catch (error) {
      console.error('Error loading child stories:', error);
    } finally {
      setLoadingStories(false);
    }
  };

  const handleStoryClick = (story: any) => {
    setSelectedStory(story);
    setShowStoryModal(true);
  };

  // Filter and sort stories
  const getFilteredAndSortedStories = () => {
    let filtered = [...childStories];

    // Apply filter
    if (storyFilter === 'published') {
      filtered = filtered.filter(s => s.is_published);
    } else if (storyFilter === 'draft') {
      filtered = filtered.filter(s => !s.is_published);
    }

    // Apply search
    if (storySearchQuery.trim()) {
      const query = storySearchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query) ||
        (s.genres && s.genres.some((g: string) => g.toLowerCase().includes(query)))
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (storySortBy) {
        case 'newest':
          return new Date(b.date_created).getTime() - new Date(a.date_created).getTime();
        case 'oldest':
          return new Date(a.date_created).getTime() - new Date(b.date_created).getTime();
        case 'mostLiked':
          return (b.likes || 0) - (a.likes || 0);
        case 'mostViewed':
          return (b.views || 0) - (a.views || 0);
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Load analytics when switching to analytics tab or overview tab (for engagement insights)
  useEffect(() => {
    if ((activeTab === 'analytics' || activeTab === 'overview') && selectedChild && !analytics) {
      loadAnalytics(selectedChild.id);
    }
  }, [activeTab, selectedChild]);


  // Load child stories when switching to activity tab with library sub-tab
  useEffect(() => {
    if (activeTab === 'activity' && activitySubTab === 'library' && selectedChild) {
      loadChildStories(selectedChild.id);
    }
  }, [activeTab, activitySubTab, selectedChild]);

  const handleAddChild = async (childData: ChildFormData) => {
    await parentDashboardService.addChild(childData);
    await loadChildren();
  };

  const handleRemoveChild = async (childId: number) => {
    if (confirm('Are you sure you want to remove this child/student?')) {
      await parentDashboardService.removeChild(childId);
      await loadChildren();
      if (selectedChild?.id === childId) {
        setSelectedChild(children.length > 1 ? children[0] : null);
      }
    }
  };

  const handleSwitchToChildView = async (childId: number) => {
    try {
      const response = await parentDashboardService.switchToChildView(childId);
      
      if (response.success && response.tokens) {
        // Store parent info in localStorage before switching (including full user data)
        const currentUserData = storage.getItemSync('user_data');
        const parentUserType = user?.user_type || user?.profile?.user_type;
        const parentInfo = {
          id: user?.id,
          name: user?.name,
          parentId: user?.id, // SECURITY: Explicit parent ID
          parentUserType: parentUserType, // SECURITY: Store actual user type for validation
          timestamp: Date.now(), // SECURITY: Add timestamp for session validation
          tokens: {
            access: storage.getItemSync('access_token'),
            refresh: storage.getItemSync('refresh_token')
          },
          userData: currentUserData ? JSON.parse(currentUserData) : null
        };
        storage.setItemSync('parent_session', JSON.stringify(parentInfo));
        
        // Update tokens to child's tokens
        storage.setItemSync('access_token', response.tokens.access);
        storage.setItemSync('refresh_token', response.tokens.refresh);
        
        // Also update the user data in storage so auth store picks up the child's profile
        if (response.user) {
          const childUserData = {
            id: response.user.id.toString(),
            username: response.user.username,
            email: response.user.email,
            name: response.user.name,
            avatar: response.user.avatar || '👤',
            user_type: response.user.user_type,
            subscription_type: 'free' as const,
            is_verified: true,
            created_at: new Date().toISOString(),
            profile: response.user.profile
          };
          storage.setItemSync('user_data', JSON.stringify(childUserData));
        }
        
        // Set active account as child in the account switch store
        setActiveAccount('child', childId, response.user?.name || 'Child');
        
        // Navigate to home page as child - the auth will be refreshed by the route
        navigate('/home');
        
        // Reload to refresh auth state with new tokens
        window.location.reload();
      }
    } catch (error) {
      console.error('Error switching to child view:', error);
      alert('Failed to switch to child view. Please try again.');
    }
  };

  const handleProfileSwitch = (childId: number | null) => {
    if (childId === null) {
      // Selected parent profile - already on parent dashboard, do nothing
      return;
    } else {
      // Switch to child view
      handleSwitchToChildView(childId);
    }
  };

  // Dynamic stats based on real data
  const stats = statistics ? [
    {
      icon: <BookOpenIcon />,
      label: 'Stories Read',
      value: statistics.stories_read,
      change: statistics.stories_read_change,
      changePositive: true,
      iconColor: '#3DBAB8'
    },
    {
      icon: <ClockIcon />,
      label: 'Reading Time',
      value: statistics.reading_time,
      change: statistics.reading_time_change,
      changePositive: true,
      iconColor: '#FF9A5C'
    },
    {
      icon: <TrophyIcon />,
      label: 'Achievements',
      value: statistics.achievements,
      change: statistics.achievements_change,
      changePositive: true,
      iconColor: '#5FD99E'
    },
    {
      icon: <ChartBarIcon />,
      label: 'Progress',
      value: `${statistics.progress}%`,
      change: 'On track',
      changePositive: false,
      iconColor: '#FFD93D'
    }
  ] : [
    {
      icon: <BookOpenIcon />,
      label: 'Stories Read',
      value: 0,
      change: 'No data',
      changePositive: false,
      iconColor: '#3DBAB8'
    },
    {
      icon: <ClockIcon />,
      label: 'Reading Time',
      value: '0h',
      change: 'No data',
      changePositive: false,
      iconColor: '#FF9A5C'
    },
    {
      icon: <TrophyIcon />,
      label: 'Achievements',
      value: 0,
      change: 'No data',
      changePositive: false,
      iconColor: '#5FD99E'
    },
    {
      icon: <ChartBarIcon />,
      label: 'Progress',
      value: '0%',
      change: 'No data',
      changePositive: false,
      iconColor: '#FFD93D'
    }
  ];

  // Helper function to get gradient based on activity type
  const getActivityGradient = (type: string) => {
    switch (type) {
      case 'story_read':
        return 'linear-gradient(135deg, #4DD4D1 0%, #3DBAB8 100%)';
      case 'story_created':
        return 'linear-gradient(135deg, #5FD99E 0%, #4BC788 100%)';
      case 'achievement':
        return 'linear-gradient(135deg, #FFB347 0%, #FF9A5C 100%)';
      default:
        return 'linear-gradient(135deg, #5DADE2 0%, #3498DB 100%)';
    }
  };

  // Helper function to get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'story_read':
        return <BookOpenIcon />;
      case 'story_created':
        return <AcademicCapIcon />;
      case 'achievement':
        return <TrophyIcon />;
      default:
        return <BookOpenIcon />;
    }
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Dynamic activities based on real data
  const recentActivities = activities.map(activity => ({
    icon: getActivityIcon(activity.type),
    title: activity.title,
    subtitle: activity.subtitle,
    progress: activity.progress,
    timestamp: formatTimestamp(activity.timestamp),
    rating: activity.rating,
    gradient: getActivityGradient(activity.type)
  }));


  // Dynamic learning goals based on real data
  const learningGoals = goals;

  return (
    <div className={`parent-dashboard ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Top Bar - Logo, Settings, User Avatar */}
      <div className="parent-top-bar">
        <div className="parent-top-bar-content">
          <div className="parent-nav-logo">
            <div className="parent-logo-icon">
              <Logo style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span className="parent-logo-text">Pixel Tales</span>
          </div>
          
          <div className="parent-nav-actions">
            {/* Unified Profile Switcher */}
            <UnifiedProfileSwitcher
              currentUser={{
                name: user?.name?.split(' ')[0] || 'Parent',
                isParent: true
              }}
              children={children}
              parentName={user?.name || 'Parent'}
              onSwitchToProfile={handleProfileSwitch}
              onAddChild={() => setShowAddChildModal(true)}
              mode="compact"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="parent-main">
        <div className="parent-container">
          {/* Header */}
          <header className="parent-header">
            <div>
              <h1 className="parent-title">Welcome back, {user?.name?.split(' ')[0] || 'Parent'}!</h1>
              <p className="parent-subtitle">
                {selectedChild 
                  ? `Viewing ${selectedChild.name}'s progress` 
                  : children.length > 0 
                    ? 'Select a child to view their progress' 
                    : 'Add a child to get started'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {children.length > 0 && (
                <select
                  className="parent-child-selector"
                  value={selectedChild?.id || ''}
                  onChange={(e) => {
                    const child = children.find(c => c.id === parseInt(e.target.value));
                    if (child) setSelectedChild(child);
                  }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid #E8ECEF',
                    fontSize: '15px',
                    fontWeight: '500',
                    color: '#1A1A1A',
                    cursor: 'pointer',
                    minWidth: '200px'
                  }}
                >
                  {children.map(child => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </select>
              )}
              <button 
                className="parent-button-primary"
                onClick={() => setShowAddChildModal(true)}
              >
                <PlusIcon />
                <span>Add {user?.profile?.user_type === 'teacher' ? 'Student' : 'Child'}</span>
              </button>
            </div>
          </header>

          {/* Add Child Modal */}
          <AddChildModal
            isOpen={showAddChildModal}
            onClose={() => setShowAddChildModal(false)}
            onAdd={handleAddChild}
            userType={(user?.profile?.user_type || user?.user_type) as 'parent' | 'teacher'}
          />

          {/* Loading State */}
          {loading && (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              color: '#6B7280',
              fontSize: '16px'
            }}>
              Loading data...
            </div>
          )}

          {/* No Children State */}
          {!loading && children.length === 0 && (
            <div className="no-children-state">
              <UserGroupIcon className="no-children-icon" />
              <h3 className="no-children-title">
                No {user?.profile?.user_type === 'teacher' ? 'Students' : 'Children'} Added Yet
              </h3>
              <p className="no-children-text">
                Add a {user?.profile?.user_type === 'teacher' ? 'student' : 'child'} to start tracking their progress
              </p>
              <button 
                className="parent-button-primary"
                onClick={() => setShowAddChildModal(true)}
                style={{ margin: '0 auto' }}
              >
                <PlusIcon />
                <span>Add {user?.profile?.user_type === 'teacher' ? 'Student' : 'Child'}</span>
              </button>
            </div>
          )}

          {/* Stats Grid */}
          {!loading && selectedChild && (
            <>
              {activeTab === 'overview' && (
                <>
                  <section className="parent-stats-grid">
                    {stats.map((stat, index) => (
                      <StatCard key={index} {...stat} />
                    ))}
                  </section>

                  {/* Engagement Insights */}
                  <section className="parent-section" style={{ marginTop: '24px' }}>
                    <div className="parent-section-header">
                      <h2 className="parent-section-title">💡 Engagement Insights</h2>
                    </div>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, 1fr)', 
                      gap: '16px' 
                    }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #3DBAB8 0%, #2da3a0 100%)',
                        borderRadius: '12px',
                        padding: '20px',
                        color: 'white'
                      }}>
                        <HeartIcon style={{ width: '32px', height: '32px', marginBottom: '12px', opacity: 0.9 }} />
                        <h4 style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>Favorite Genre</h4>
                        <p style={{ fontSize: '20px', fontWeight: '700' }}>{analytics?.favorite_genre || 'N/A'}</p>
                        <p style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                          {analytics?.favorite_genre_percentage ? `${analytics.favorite_genre_percentage}% of all reads` : 'No data yet'}
                        </p>
                      </div>
                      
                      <div style={{
                        background: 'linear-gradient(135deg, #FF9A5C 0%, #ff8142 100%)',
                        borderRadius: '12px',
                        padding: '20px',
                        color: 'white'
                      }}>
                        <ClockIcon style={{ width: '32px', height: '32px', marginBottom: '12px', opacity: 0.9 }} />
                        <h4 style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>Peak Reading Time</h4>
                        <p style={{ fontSize: '20px', fontWeight: '700' }}>{analytics?.peak_reading_time || 'N/A'}</p>
                        <p style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>Best engagement</p>
                      </div>
                      
                      <div style={{
                        background: 'linear-gradient(135deg, #5FD99E 0%, #4BC788 100%)',
                        borderRadius: '12px',
                        padding: '20px',
                        color: 'white'
                      }}>
                        <StarIcon style={{ width: '32px', height: '32px', marginBottom: '12px', opacity: 0.9 }} />
                        <h4 style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>Average Rating</h4>
                        <p style={{ fontSize: '20px', fontWeight: '700' }}>
                          {analytics?.average_rating ? `${analytics.average_rating} / 5` : 'N/A'}
                        </p>
                        <p style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                          {analytics?.average_rating && analytics.average_rating >= 4 ? 'Great satisfaction!' : 'Keep improving!'}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Learning Goals */}
                  <section className="parent-section" style={{ marginTop: '24px' }}>
                    <div className="parent-section-header">
                      <h2 className="parent-section-title">🎯 Learning Goals</h2>
                    </div>
                    <div className="parent-goals-list">
                      {learningGoals.length > 0 ? (
                        learningGoals.map((goal, index) => (
                          <div key={index} className="goal-item">
                            <div className="goal-header">
                              <span className="goal-label">{goal.label}</span>
                              <span className="goal-percentage">{Math.round(goal.progress)}%</span>
                            </div>
                            <div className="goal-progress-container">
                              <div 
                                className="goal-progress-fill" 
                                style={{ width: `${goal.progress}%` }}
                              ></div>
                            </div>
                            <p className="goal-details">
                              {goal.current} of {goal.target}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: '#6B7280', textAlign: 'center', padding: '20px' }}>
                          No goals set yet
                        </p>
                      )}
                    </div>
                  </section>

                </>
              )}

              {/* Analytics Tab - Progress Journey */}
              {activeTab === 'analytics' && (
                <>
                  {loadingAnalytics ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '60px 20px',
                      color: '#6B7280',
                      fontSize: '16px'
                    }}>
                      Loading analytics...
                    </div>
                  ) : (
                    <>
                  {/* Progress Timeline */}
                  <section className="parent-section" style={{ marginTop: '24px' }}>
                    <div className="parent-section-header">
                      <h2 className="parent-section-title">📈 Progress Timeline</h2>
                      <select className="timeline-select">
                        <option>Last 7 Days</option>
                        <option>Last 30 Days</option>
                        <option>Last 3 Months</option>
                        <option>All Time</option>
                      </select>
                    </div>
                    
                    {/* Reading Progress Chart */}
                    <div className="timeline-chart-card">
                      <h3 className="timeline-chart-title">
                        Daily Reading Time (minutes)
                      </h3>
                      <div className="parent-chart-container">
                        <div className="parent-bar-chart">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                            const readingTime = analytics?.daily_reading_time?.[index] || 0;
                            const maxTime = Math.max(...(analytics?.daily_reading_time || [1]));
                            const height = maxTime > 0 ? (readingTime / maxTime) * 100 : 0;
                            const colors = ['#3DBAB8', '#5FD99E', '#FFB347', '#FF9A5C', '#667eea', '#764ba2', '#FF6B9D'];
                            return (
                              <div key={day} className="chart-bar-wrapper">
                                <div 
                                  className="chart-bar" 
                                  style={{ 
                                    height: `${Math.max(height, 5)}%`,
                                    background: colors[index]
                                  }}
                                  title={`${readingTime} minutes`}
                                ></div>
                                <span className="chart-label">{day}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Stories Completed Chart */}
                    <div className="timeline-chart-card">
                      <h3 className="timeline-chart-title">
                        Stories Completed This Week
                      </h3>
                      <div className="parent-chart-container">
                        <div className="parent-bar-chart">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                            const storiesCount = analytics?.daily_stories_completed?.[index] || 0;
                            const maxStories = Math.max(...(analytics?.daily_stories_completed || [1]));
                            const height = maxStories > 0 ? (storiesCount / maxStories) * 100 : 0;
                            return (
                              <div key={day} className="chart-bar-wrapper">
                                <div 
                                  className="chart-bar" 
                                  style={{ 
                                    height: `${Math.max(height, 5)}%`,
                                    background: 'linear-gradient(180deg, #5FD99E 0%, #4BC788 100%)'
                                  }}
                                  title={`${storiesCount} stories`}
                                ></div>
                                <span className="chart-label">{day}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Milestones & Achievements */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
                    {/* Milestones */}
                    <section className="parent-section">
                      <div className="parent-section-header">
                        <h2 className="parent-section-title">🏆 Recent Milestones</h2>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(analytics?.milestones && analytics.milestones.length > 0 ? analytics.milestones.slice(0, 4) : [
                          { title: 'No milestones yet', date: null, icon: '🎯', color: '#9CA3AF', rarity: 'common' }
                        ]).map((milestone, index) => {
                          const formatDate = (dateStr: string | null) => {
                            if (!dateStr) return 'Keep going!';
                            const date = new Date(dateStr);
                            const now = new Date();
                            const diffMs = now.getTime() - date.getTime();
                            const diffDays = Math.floor(diffMs / 86400000);
                            if (diffDays === 0) return 'Today';
                            if (diffDays === 1) return 'Yesterday';
                            if (diffDays < 7) return `${diffDays} days ago`;
                            if (diffDays < 14) return '1 week ago';
                            if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
                            return date.toLocaleDateString();
                          };
                          return (
                          <div key={index} className="analytics-card milestone-card">
                            <div className="milestone-icon" style={{ background: `${milestone.color}20` }}>
                              {milestone.icon}
                            </div>
                            <div className="milestone-content">
                              <h4 className="milestone-title">
                                {milestone.title}
                              </h4>
                              <p className="milestone-date">
                                {formatDate(milestone.date)}
                              </p>
                            </div>
                            <TrophyIcon className="milestone-trophy" style={{ color: milestone.color }} />
                          </div>
                        );
                        })}
                      </div>
                    </section>

                    {/* Category Breakdown */}
                    <section className="parent-section">
                      <div className="parent-section-header">
                        <h2 className="parent-section-title">📊 Reading Categories</h2>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {(analytics?.categories && analytics.categories.length > 0 ? analytics.categories.slice(0, 4) : [
                          { category: 'No data yet', count: 0, percentage: 0 }
                        ]).map((cat, index) => {
                          const colors = ['#3DBAB8', '#764ba2', '#FF9A5C', '#5FD99E'];
                          const color = colors[index % colors.length];
                          return (
                          <div key={index} className="analytics-card category-card">
                            <div className="category-header">
                              <span className="category-name">
                                {cat.category}
                              </span>
                              <span className="category-count" style={{ color: color }}>
                                {cat.count} stories ({cat.percentage}%)
                              </span>
                            </div>
                            <div className="category-progress-bar">
                              <div className="category-progress-fill" style={{
                                width: `${cat.percentage}%`,
                                background: color
                              }}></div>
                            </div>
                          </div>
                        );
                        })}
                      </div>
                    </section>
                  </div>

                    </>
                  )}
                </>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <>
                  {/* Sub-tab Navigation */}
                  <div className="activity-subtab-nav">
                    <button
                      className={`activity-subtab-button ${activitySubTab === 'notifications' ? 'active' : ''}`}
                      onClick={() => setActivitySubTab('notifications')}
                    >
                      <BellIcon className="activity-subtab-icon" />
                      <span>Notifications</span>
                    </button>
                    <button
                      className={`activity-subtab-button ${activitySubTab === 'library' ? 'active' : ''}`}
                      onClick={() => setActivitySubTab('library')}
                    >
                      <BookOpenIcon className="activity-subtab-icon" />
                      <span>Library</span>
                    </button>
                  </div>

                  {/* Notifications Sub-tab */}
                  {activitySubTab === 'notifications' && (
                    <section className="parent-section">
                      <div className="parent-section-header">
                        <h2 className="parent-section-title">📢 Activity Notifications</h2>
                      </div>
                      <div className="parent-activity-list">
                        {recentActivities.length > 0 ? (
                          recentActivities.map((activity, index) => (
                            <ActivityCard key={index} {...activity} />
                          ))
                        ) : (
                          <div className="empty-state">
                            <BellIcon className="empty-state-icon" />
                            <p className="empty-state-text">No recent activities</p>
                            <p className="empty-state-subtext">
                              Your child's reading activities will appear here
                            </p>
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Library Sub-tab */}
                  {activitySubTab === 'library' && (
                    <section className="parent-section">
                      <div className="parent-section-header">
                        <h2 className="parent-section-title">📚 Child's Library</h2>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          {statistics && (
                            <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#6B7280' }}>
                              <span><strong>{statistics.stories_created}</strong> Created</span>
                              <span><strong>{statistics.stories_read}</strong> Read</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Filters and Search */}
                      <div style={{
                        padding: '16px 0',
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        borderBottom: `1px solid ${theme === 'dark' ? '#3A3A3A' : '#E8ECEF'}`
                      }}>
                        {/* Search Bar */}
                        <div style={{ flex: '1', minWidth: '250px' }}>
                          <input
                            type="text"
                            placeholder="Search by title, category, or genre..."
                            value={storySearchQuery}
                            onChange={(e) => setStorySearchQuery(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 16px',
                              borderRadius: '8px',
                              border: `1px solid ${theme === 'dark' ? '#3A3A3A' : '#E8ECEF'}`,
                              background: theme === 'dark' ? '#2A2A2A' : '#FFFFFF',
                              color: theme === 'dark' ? '#FFFFFF' : '#1A1A1A',
                              fontSize: '14px',
                              outline: 'none',
                              transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#6366F1';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = theme === 'dark' ? '#3A3A3A' : '#E8ECEF';
                            }}
                          />
                        </div>

                        {/* Filter Buttons */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setStoryFilter('all')}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              border: `1px solid ${theme === 'dark' ? '#3A3A3A' : '#E8ECEF'}`,
                              background: storyFilter === 'all' 
                                ? '#6366F1' 
                                : (theme === 'dark' ? '#2A2A2A' : '#FFFFFF'),
                              color: storyFilter === 'all' 
                                ? '#FFFFFF' 
                                : (theme === 'dark' ? '#D1D5DB' : '#6B7280'),
                              fontSize: '14px',
                              fontWeight: storyFilter === 'all' ? '600' : '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            All
                          </button>
                          <button
                            onClick={() => setStoryFilter('published')}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              border: `1px solid ${theme === 'dark' ? '#3A3A3A' : '#E8ECEF'}`,
                              background: storyFilter === 'published' 
                                ? '#10B981' 
                                : (theme === 'dark' ? '#2A2A2A' : '#FFFFFF'),
                              color: storyFilter === 'published' 
                                ? '#FFFFFF' 
                                : (theme === 'dark' ? '#D1D5DB' : '#6B7280'),
                              fontSize: '14px',
                              fontWeight: storyFilter === 'published' ? '600' : '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            Published
                          </button>
                          <button
                            onClick={() => setStoryFilter('draft')}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              border: `1px solid ${theme === 'dark' ? '#3A3A3A' : '#E8ECEF'}`,
                              background: storyFilter === 'draft' 
                                ? '#F59E0B' 
                                : (theme === 'dark' ? '#2A2A2A' : '#FFFFFF'),
                              color: storyFilter === 'draft' 
                                ? '#FFFFFF' 
                                : (theme === 'dark' ? '#D1D5DB' : '#6B7280'),
                              fontSize: '14px',
                              fontWeight: storyFilter === 'draft' ? '600' : '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            Drafts
                          </button>
                        </div>

                        {/* Sort Dropdown */}
                        <select
                          value={storySortBy}
                          onChange={(e) => setStorySortBy(e.target.value as any)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: `1px solid ${theme === 'dark' ? '#3A3A3A' : '#E8ECEF'}`,
                            background: theme === 'dark' ? '#2A2A2A' : '#FFFFFF',
                            color: theme === 'dark' ? '#D1D5DB' : '#6B7280',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                          <option value="mostLiked">Most Liked</option>
                          <option value="mostViewed">Most Viewed</option>
                        </select>
                      </div>

                      <div className="parent-activity-list">
                        {loadingStories ? (
                          <div style={{ 
                            textAlign: 'center', 
                            padding: '40px 20px',
                            color: '#6B7280',
                            fontSize: '14px'
                          }}>
                            Loading stories...
                          </div>
                        ) : childStories.length > 0 ? (
                          <>
                            {/* Results count */}
                            <div style={{
                              padding: '12px 0',
                              fontSize: '14px',
                              color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                            }}>
                              Showing {getFilteredAndSortedStories().length} of {childStories.length} stories
                            </div>
                            
                            {getFilteredAndSortedStories().length > 0 ? (
                              <div className="story-cards-grid-two-column">
                                {getFilteredAndSortedStories().map((story, index) => (
                              <div 
                                key={story.id || index} 
                                onClick={() => handleStoryClick(story)}
                                style={{
                                  background: theme === 'dark' ? '#2A2A2A' : '#FFFFFF',
                                  borderRadius: '16px',
                                  overflow: 'hidden',
                                  border: `1px solid ${theme === 'dark' ? '#3A3A3A' : '#E8ECEF'}`,
                                  transition: 'transform 0.2s, box-shadow 0.2s',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  height: '100%'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-4px)';
                                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                {/* Cover Image or Placeholder */}
                                <div style={{
                                  width: '100%',
                                  height: '220px',
                                  background: story.cover_image 
                                    ? `url(${story.cover_image}) center/cover` 
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '64px',
                                  position: 'relative',
                                  flexShrink: 0
                                }}>
                                  {!story.cover_image && '📖'}
                                  {/* Status Badge */}
                                  <div style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    background: story.is_published ? '#10B981' : '#F59E0B',
                                    color: 'white',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                  }}>
                                    {story.is_published ? 'Published' : 'Draft'}
                                  </div>
                                </div>
                                
                                {/* Card Content */}
                                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>

                                  {/* Story Info */}
                                  <h4 style={{
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    marginBottom: '10px',
                                    color: theme === 'dark' ? '#FFFFFF' : '#1A1A1A',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    lineHeight: '1.4'
                                  }}>
                                    {story.title || 'Untitled Story'}
                                  </h4>

                                  {/* Category & Type */}
                                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                    <span style={{
                                      background: theme === 'dark' ? '#3A3A3A' : '#F3F4F6',
                                      color: theme === 'dark' ? '#D1D5DB' : '#6B7280',
                                      padding: '5px 10px',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      fontWeight: '600'
                                    }}>
                                      {story.category}
                                    </span>
                                    {story.creation_type && (
                                      <span style={{
                                        background: story.creation_type === 'ai_assisted' ? '#EEF2FF' : '#FEF3C7',
                                        color: story.creation_type === 'ai_assisted' ? '#4F46E5' : '#92400E',
                                        padding: '5px 10px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                      }}>
                                        {story.creation_type === 'ai_assisted' ? '✨ AI' : '✏️ Manual'}
                                      </span>
                                    )}
                                  </div>

                                  {/* Metadata */}
                                  <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    fontSize: '14px',
                                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                                    marginBottom: '12px'
                                  }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <BookOpenIcon style={{ width: '16px', height: '16px' }} />
                                      {story.page_count} pages
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <ClockIcon style={{ width: '16px', height: '16px' }} />
                                      {new Date(story.date_created).toLocaleDateString()}
                                    </span>
                                  </div>

                                  {/* Stats */}
                                  {story.is_published && (
                                    <div style={{
                                      display: 'flex',
                                      gap: '16px',
                                      paddingTop: '12px',
                                      marginTop: 'auto',
                                      borderTop: `1px solid ${theme === 'dark' ? '#3A3A3A' : '#E8ECEF'}`,
                                      fontSize: '14px',
                                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                                      fontWeight: '500'
                                    }}>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <HeartIcon style={{ width: '16px', height: '16px' }} />
                                        {story.likes || 0}
                                      </span>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <ChatBubbleLeftIcon style={{ width: '16px', height: '16px' }} />
                                        {story.comments || 0}
                                      </span>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        👁️ {story.views || 0}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                                ))}
                              </div>
                            ) : (
                              <div className="empty-state">
                                <BookOpenIcon className="empty-state-icon" />
                                <p className="empty-state-text">No matching stories</p>
                                <p className="empty-state-subtext">
                                  Try adjusting your search or filters
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="empty-state">
                            <BookOpenIcon className="empty-state-icon" />
                            <p className="empty-state-text">No stories yet</p>
                            <p className="empty-state-subtext">
                              Stories created by your child will appear here
                            </p>
                          </div>
                        )}
                      </div>
                    </section>
                  )}
                  
                  {/* Story View Modal */}
                  <StoryViewModal
                    story={selectedStory}
                    isOpen={showStoryModal}
                    onClose={() => {
                      setShowStoryModal(false);
                      setSelectedStory(null);
                    }}
                  />
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <ParentBottomNav />
    </div>
  );
};

export default ParentDashboardPage;
