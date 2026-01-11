import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface ReportsTabProps {
  isDarkMode: boolean;
  onRefresh: () => void;
}

interface ReportData {
  overview: {
    total_students: number;
    total_stories: number;
    total_achievements: number;
    avg_stories_per_student: number;
    avg_level: number;
    avg_xp: number;
    active_today: number;
    active_this_week: number;
    active_this_month: number;
    stories_this_week: number;
    stories_this_month: number;
  };
  top_performers: {
    story_writers: any[];
    xp_earners: any[];
  };
  class_breakdown: any[];
  recent_activities: any[];
  achievement_activities: any[];
  engagement_trend: any[];
  generated_at: string;
}

const ReportsTab: React.FC<ReportsTabProps> = ({ isDarkMode, onRefresh }) => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadReports = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${baseUrl}/teacher/reports/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
        setError('');
      } else {
        setError('Failed to load reports');
      }
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadReports();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ 
          animation: 'spin 1s linear infinite', 
          borderRadius: '50%', 
          height: '48px', 
          width: '48px', 
          borderBottom: '2px solid #8b5cf6', 
          margin: '0 auto 16px' 
        }}></div>
        <p style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>Loading reports...</p>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', marginBottom: '16px' }}>{error || 'No data available'}</p>
        <button onClick={loadReports} className="teacher-btn">
          Retry
        </button>
      </div>
    );
  }

  const { overview, top_performers, class_breakdown, recent_activities, achievement_activities, engagement_trend } = reportData;

  return (
    <div style={{ paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '24px',
        background: isDarkMode 
          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)'
          : 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
        borderRadius: '16px',
        border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.15)'}`
      }}>
        <div>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: isDarkMode ? 'white' : '#111827',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            📈 Reports & Analytics
          </h2>
          <p style={{ 
            color: isDarkMode ? '#9ca3af' : '#6b7280', 
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ 
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              animation: 'pulse 2s ease-in-out infinite'
            }}></span>
            Last updated: {new Date(reportData.generated_at).toLocaleTimeString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontSize: '14px',
            color: isDarkMode ? '#d1d5db' : '#4b5563',
            background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.6)',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}>
            <input 
              type="checkbox" 
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ 
                width: '18px', 
                height: '18px',
                cursor: 'pointer',
                accentColor: '#8b5cf6'
              }}
            />
            Auto-refresh (30s)
          </label>
          <button 
            onClick={loadReports} 
            style={{
              padding: '10px 20px',
              background: isDarkMode 
                ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Activity Summary */}
      <div style={{ 
        background: isDarkMode 
          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.2)' : '#e5e7eb'}`,
        boxShadow: isDarkMode 
          ? '0 2px 12px rgba(0, 0, 0, 0.2)' 
          : '0 2px 12px rgba(0, 0, 0, 0.04)'
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '700', 
          color: isDarkMode ? 'white' : '#111827',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📊 Activity Summary
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: '12px' 
        }}>
          {[
            { label: 'Active Today', value: overview.active_today, icon: '👥', color: '#8b5cf6' },
            { label: 'Active This Week', value: overview.active_this_week, icon: '📅', color: '#3b82f6' },
            { label: 'Stories This Week', value: overview.stories_this_week, icon: '📚', color: '#10b981' },
            { label: 'Stories This Month', value: overview.stories_this_month, icon: '📖', color: '#f59e0b' }
          ].map((stat, index) => (
            <div 
              key={index}
              style={{ 
                background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'white',
                padding: '12px',
                borderRadius: '10px',
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#e5e7eb'}`,
                transition: 'all 0.2s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = isDarkMode 
                  ? `0 4px 12px rgba(139, 92, 246, 0.15)`
                  : `0 4px 12px ${stat.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '18px' }}>{stat.icon}</span>
                <p style={{ 
                  fontSize: '22px', 
                  fontWeight: '700', 
                  color: stat.color,
                  lineHeight: '1'
                }}>
                  {stat.value}
                </p>
              </div>
              <p style={{ 
                fontSize: '11px', 
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                fontWeight: '500',
                lineHeight: '1.3'
              }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Trend Chart */}
      <div style={{ 
        background: isDarkMode 
          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
        borderRadius: '16px',
        padding: '28px',
        marginBottom: '32px',
        border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.2)' : '#e5e7eb'}`,
        boxShadow: isDarkMode 
          ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
          : '0 4px 20px rgba(0, 0, 0, 0.05)'
      }}>
        <h3 style={{ 
          fontSize: '20px', 
          fontWeight: '700', 
          color: isDarkMode ? 'white' : '#111827',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          📈 7-Day Engagement Trend
        </h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '200px' }}>
          {engagement_trend.map((day, index) => {
            const maxValue = Math.max(...engagement_trend.map(d => Math.max(d.stories, d.active_students)));
            const storyHeight = (day.stories / maxValue) * 150;
            const studentHeight = (day.active_students / maxValue) * 150;
            
            return (
              <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '150px', width: '100%', justifyContent: 'center' }}>
                  <div 
                    style={{ 
                      width: '40%',
                      height: `${storyHeight}px`,
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      borderRadius: '4px 4px 0 0',
                      position: 'relative',
                      transition: 'all 0.3s ease'
                    }}
                    title={`${day.stories} stories`}
                  >
                    {day.stories > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#8b5cf6'
                      }}>
                        {day.stories}
                      </span>
                    )}
                  </div>
                  <div 
                    style={{ 
                      width: '40%',
                      height: `${studentHeight}px`,
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      borderRadius: '4px 4px 0 0',
                      position: 'relative',
                      transition: 'all 0.3s ease'
                    }}
                    title={`${day.active_students} active students`}
                  >
                    {day.active_students > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#3b82f6'
                      }}>
                        {day.active_students}
                      </span>
                    )}
                  </div>
                </div>
                <p style={{ 
                  fontSize: '11px', 
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                  marginTop: '8px',
                  fontWeight: '600'
                }}>
                  {day.day_name}
                </p>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', background: '#8b5cf6', borderRadius: '2px' }}></div>
            <span style={{ fontSize: '12px', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>Stories</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '2px' }}></div>
            <span style={{ fontSize: '12px', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>Active Students</span>
          </div>
        </div>
      </div>

      {/* Class Performance */}
      {class_breakdown.length > 0 && (
        <div style={{ 
          background: isDarkMode 
            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
          borderRadius: '16px',
          padding: '28px',
          marginBottom: '32px',
          border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.2)' : '#e5e7eb'}`,
          boxShadow: isDarkMode 
            ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
            : '0 4px 20px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: '700', 
            color: isDarkMode ? 'white' : '#111827',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            📚 Class Performance
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {class_breakdown.map((cls) => (
              <div 
                key={cls.id} 
                style={{
                  padding: '24px',
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'white',
                  borderRadius: '12px',
                  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#e5e7eb'}`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = isDarkMode 
                    ? '0 8px 24px rgba(59, 130, 246, 0.2)'
                    : '0 8px 24px rgba(59, 130, 246, 0.15)';
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#e5e7eb';
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>
                    🎓
                  </div>
                  <h4 style={{ 
                    fontWeight: '700', 
                    color: isDarkMode ? 'white' : '#111827',
                    fontSize: '16px',
                    flex: 1
                  }}>
                    {cls.name}
                  </h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#f3f4f6'}`
                  }}>
                    <span style={{ 
                      color: isDarkMode ? '#9ca3af' : '#6b7280',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>👥</span> Students
                    </span>
                    <span style={{ 
                      fontWeight: '700', 
                      color: '#8b5cf6',
                      fontSize: '16px'
                    }}>
                      {cls.student_count}
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#f3f4f6'}`
                  }}>
                    <span style={{ 
                      color: isDarkMode ? '#9ca3af' : '#6b7280',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>📚</span> Stories
                    </span>
                    <span style={{ 
                      fontWeight: '700', 
                      color: '#10b981',
                      fontSize: '16px'
                    }}>
                      {cls.total_stories}
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '8px 0'
                  }}>
                    <span style={{ 
                      color: isDarkMode ? '#9ca3af' : '#6b7280',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>⭐</span> Avg Level
                    </span>
                    <span style={{ 
                      fontWeight: '700', 
                      color: '#f59e0b',
                      fontSize: '16px'
                    }}>
                      {cls.avg_level}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Uploads - Recent Activities */}
      <div style={{ 
        background: isDarkMode 
          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
        borderRadius: '16px',
        padding: '28px',
        marginBottom: '32px',
        border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.2)' : '#e5e7eb'}`,
        boxShadow: isDarkMode 
          ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
          : '0 4px 20px rgba(0, 0, 0, 0.05)'
      }}>
        <h3 style={{ 
          fontSize: '20px', 
          fontWeight: '700', 
          color: isDarkMode ? 'white' : '#111827',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          📤 Recent Student Uploads
        </h3>
        {recent_activities.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            color: isDarkMode ? '#9ca3af' : '#6b7280' 
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>No recent uploads</p>
            <p style={{ fontSize: '14px' }}>Student story uploads will appear here</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recent_activities.slice(0, 10).map((activity, index) => (
              <div 
                key={index} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'white',
                  borderRadius: '12px',
                  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#e5e7eb'}`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.boxShadow = isDarkMode 
                    ? '0 4px 16px rgba(139, 92, 246, 0.2)'
                    : '0 4px 16px rgba(139, 92, 246, 0.15)';
                  e.currentTarget.style.borderColor = '#8b5cf6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#e5e7eb';
                }}
              >
                <div style={{ 
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  flexShrink: 0
                }}>
                  {activity.student_avatar || '📚'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ 
                    fontWeight: '700', 
                    color: isDarkMode ? 'white' : '#111827', 
                    fontSize: '15px',
                    marginBottom: '4px'
                  }}>
                    {activity.student_name}
                  </p>
                  <p style={{ 
                    fontSize: '14px', 
                    color: isDarkMode ? '#9ca3af' : '#6b7280',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    Published "<span style={{ fontWeight: '600', color: isDarkMode ? '#d1d5db' : '#4b5563' }}>{activity.story_title}</span>"
                  </p>
                </div>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'flex-end',
                  gap: '6px',
                  flexShrink: 0
                }}>
                  <p style={{ 
                    fontSize: '12px', 
                    color: isDarkMode ? '#9ca3af' : '#6b7280',
                    whiteSpace: 'nowrap'
                  }}>
                    {activity.time_ago}
                  </p>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    background: isDarkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#8b5cf6',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {activity.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default ReportsTab;
