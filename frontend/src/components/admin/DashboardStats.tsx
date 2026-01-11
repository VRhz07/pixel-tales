import { Users, BookOpen, TrendingUp, AlertTriangle, PieChart, Clock, Heart, MessageCircle, UserCheck } from 'lucide-react';
import { AdminStats } from '../../services/admin.service';
import './DashboardStats.css';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle: string;
  change?: string;
  iconType: 'users' | 'stories' | 'engagement' | 'flagged';
}

function StatCard({ icon, title, value, subtitle, change, iconType }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className={`stat-card-icon ${iconType}`}>
          {icon}
        </div>
      </div>
      
      <div className="stat-card-body">
        <span className="stat-card-label">{title}</span>
        <div className="stat-card-value">{value.toLocaleString()}</div>
        
        {change && (
          <span className="stat-card-change positive">
            {change}
          </span>
        )}
        
        {subtitle && (
          <span className="stat-card-subtitle">{subtitle}</span>
        )}
      </div>
    </div>
  );
}

export default function DashboardStats({ stats }: { stats: AdminStats }) {
  console.log('📊 Rendering DashboardStats with data:', stats);
  
  return (
    <div className="dashboard-stats-container">

      {/* Real-Time Active Users */}
      <div className="stats-section">
        <div className="stats-section-header">
          <div className="stats-section-icon">
            <Users />
          </div>
          <div className="stats-section-title-wrapper">
            <h3 className="stats-section-title">Active Users</h3>
            <p className="stats-section-subtitle">Real-time engagement metrics</p>
          </div>
        </div>
        <div className="stats-content-grid">
          <div className="stats-content-item">
            <div className="stats-content-icon">🟢</div>
            <div className="stats-content-details">
              <div className="stats-content-label">Online Now</div>
              <div className="stats-content-value">{stats.active_users?.now?.toLocaleString() || '0'}</div>
              <div className="stats-content-badge positive">
                Last 15 minutes
              </div>
            </div>
          </div>
          <div className="stats-content-item">
            <div className="stats-content-icon">📅</div>
            <div className="stats-content-details">
              <div className="stats-content-label">Daily Active Users</div>
              <div className="stats-content-value">{stats.active_users?.daily?.toLocaleString() || '0'}</div>
              <div className="stats-content-badge">
                {stats.users.total > 0 && stats.active_users?.daily ? ((stats.active_users?.daily / stats.users.total) * 100).toFixed(1) : '0.0'}% of total
              </div>
            </div>
          </div>
          <div className="stats-content-item">
            <div className="stats-content-icon">📊</div>
            <div className="stats-content-details">
              <div className="stats-content-label">Weekly Active Users</div>
              <div className="stats-content-value">{stats.active_users?.weekly.toLocaleString()}</div>
              <div className="stats-content-badge">
                {stats.users.total > 0 ? ((stats.active_users?.weekly / stats.users.total) * 100).toFixed(1) : '0.0'}% of total
              </div>
            </div>
          </div>
          <div className="stats-content-item">
            <div className="stats-content-icon">📈</div>
            <div className="stats-content-details">
              <div className="stats-content-label">Monthly Active Users</div>
              <div className="stats-content-value">{stats.active_users?.monthly.toLocaleString()}</div>
              <div className="stats-content-badge">
                {stats.users.total > 0 ? ((stats.active_users?.monthly / stats.users.total) * 100).toFixed(1) : '0.0'}% of total
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Retention */}
      <div className="stats-section">
        <div className="stats-section-header">
          <div className="stats-section-icon">
            <TrendingUp />
          </div>
          <div className="stats-section-title-wrapper">
            <h3 className="stats-section-title">User Retention</h3>
            <p className="stats-section-subtitle">Users coming back over time</p>
          </div>
        </div>
        <div className="stats-content-grid">
          <div className="stats-content-item">
            <div className="stats-content-icon">1️⃣</div>
            <div className="stats-content-details">
              <div className="stats-content-label">Day 1 Retention</div>
              <div className="stats-content-value">{(stats.retention?.day_1 || 0).toFixed(1)}%</div>
              <div className="stats-content-badge">
                Users returning after 1 day
              </div>
            </div>
          </div>
          <div className="stats-content-item">
            <div className="stats-content-icon">7️⃣</div>
            <div className="stats-content-details">
              <div className="stats-content-label">Day 7 Retention</div>
              <div className="stats-content-value">{(stats.retention?.day_7 || 0).toFixed(1)}%</div>
              <div className="stats-content-badge">
                Users returning after 7 days
              </div>
            </div>
          </div>
          <div className="stats-content-item">
            <div className="stats-content-icon">3️⃣0️⃣</div>
            <div className="stats-content-details">
              <div className="stats-content-label">Day 30 Retention</div>
              <div className="stats-content-value">{(stats.retention?.day_30 || 0).toFixed(1)}%</div>
              <div className="stats-content-badge">
                Users returning after 30 days
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Usage */}
      <div className="stats-section">
        <div className="stats-section-header">
          <div className="stats-section-icon">
            <BookOpen />
          </div>
          <div className="stats-section-title-wrapper">
            <h3 className="stats-section-title">Feature Usage</h3>
            <p className="stats-section-subtitle">Last 7 days activity</p>
          </div>
        </div>
        <div className="stats-content-grid">
          <div className="stats-content-item">
            <div className="stats-content-icon">🤖</div>
            <div className="stats-content-details">
              <div className="stats-content-label">AI Story Generation</div>
              <div className="stats-content-value">{(stats.feature_usage?.ai_stories_last_7_days || 0).toLocaleString()}</div>
              <div className="stats-content-badge">
                stories created
              </div>
            </div>
          </div>
          <div className="stats-content-item">
            <div className="stats-content-icon">✍️</div>
            <div className="stats-content-details">
              <div className="stats-content-label">Manual Creation</div>
              <div className="stats-content-value">{(stats.feature_usage?.manual_stories_last_7_days || 0).toLocaleString()}</div>
              <div className="stats-content-badge">
                stories created
              </div>
            </div>
          </div>
          <div className="stats-content-item">
            <div className="stats-content-icon">📸</div>
            <div className="stats-content-details">
              <div className="stats-content-label">Photo Story (OCR)</div>
              <div className="stats-content-value">{(stats.feature_usage?.photo_story_usage_last_7_days || 0).toLocaleString()}</div>
              <div className="stats-content-badge">
                stories from photos
              </div>
            </div>
          </div>
          <div className="stats-content-item">
            <div className="stats-content-icon">👥</div>
            <div className="stats-content-details">
              <div className="stats-content-label">Collaboration</div>
              <div className="stats-content-value">{(stats.feature_usage?.collaborative_stories_last_7_days || 0).toLocaleString()}</div>
              <div className="stats-content-badge">
                collaborative stories
              </div>
            </div>
          </div>
          <div className="stats-content-item">
            <div className="stats-content-icon">🎮</div>
            <div className="stats-content-details">
              <div className="stats-content-label">Games Played</div>
              <div className="stats-content-value">{(stats.feature_usage?.game_plays_last_7_days || 0).toLocaleString()}</div>
              <div className="stats-content-badge">
                game attempts
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Story Views */}
      <div className="stats-section">
        <div className="stats-section-header">
          <div className="stats-section-icon">
            <Heart />
          </div>
          <div className="stats-section-title-wrapper">
            <h3 className="stats-section-title">Story Views</h3>
            <p className="stats-section-subtitle">Content engagement</p>
          </div>
        </div>
        <div className="stats-content-grid">
          <div className="stats-content-item">
            <div className="stats-content-icon">👁️</div>
            <div className="stats-content-details">
              <div className="stats-content-label">Total Views</div>
              <div className="stats-content-value">{(stats.story_views?.total || 0).toLocaleString()}</div>
              <div className="stats-content-badge">
                across all stories
              </div>
            </div>
          </div>
          <div className="stats-content-item">
            <div className="stats-content-icon">📊</div>
            <div className="stats-content-details">
              <div className="stats-content-label">Average Views</div>
              <div className="stats-content-value">{(stats.story_views?.average_per_story || 0).toFixed(1)}</div>
              <div className="stats-content-badge">
                per story
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Type Distribution */}
      <div className="stats-section">
        <div className="stats-section-header">
          <div className="stats-section-icon">
            <PieChart />
          </div>
          <div className="stats-section-title-wrapper">
            <h3 className="stats-section-title">User Type Distribution</h3>
            <p className="stats-section-subtitle">Breakdown by user roles</p>
          </div>
        </div>
        <div className="stats-content-grid">
          {Object.keys(stats.users.by_type).length > 0 ? (
            Object.entries(stats.users.by_type).map(([type, count], index) => {
              const percentage = ((count / stats.users.total) * 100).toFixed(1);
              const icons = ['👶', '👨‍👩‍👧', '👨‍🏫'];
              const icon = icons[index % icons.length];
              
              return (
                <div key={type} className="stats-content-item">
                  <div className="stats-content-icon">{icon}</div>
                  <div className="stats-content-details">
                    <div className="stats-content-label">{type}s</div>
                    <div className="stats-content-value">{count.toLocaleString()}</div>
                    <div style={{ 
                      marginTop: '8px',
                      padding: '4px 8px',
                      background: 'rgba(139, 92, 246, 0.2)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#a78bfa',
                      display: 'inline-block'
                    }}>
                      {percentage}%
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
              No user type data available
            </div>
          )}
        </div>
      </div>

      {/* Info Cards Grid - Updated Design */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Story Creation */}
        <div className="stats-section">
          <div className="stats-section-header">
            <div className="stats-section-icon">
              <BookOpen />
            </div>
            <div className="stats-section-title-wrapper">
              <h3 className="stats-section-title">Story Creation</h3>
              <p className="stats-section-subtitle">Content breakdown</p>
            </div>
          </div>
          <div className="stats-content-grid">
            <div className="stats-content-item">
              <div className="stats-content-icon">✍️</div>
              <div className="stats-content-details">
                <div className="stats-content-label">Manual Stories</div>
                <div className="stats-content-value">{stats.stories.manual.toLocaleString()}</div>
                <div style={{ 
                  marginTop: '8px',
                  padding: '4px 8px',
                  background: 'rgba(139, 92, 246, 0.2)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#a78bfa',
                  display: 'inline-block'
                }}>
                  {stats.stories.total > 0 ? ((stats.stories.manual / stats.stories.total) * 100).toFixed(1) : '0.0'}%
                </div>
              </div>
            </div>
            <div className="stats-content-item">
              <div className="stats-content-icon">🤖</div>
              <div className="stats-content-details">
                <div className="stats-content-label">AI-Assisted Stories</div>
                <div className="stats-content-value">{stats.stories.ai_assisted.toLocaleString()}</div>
                <div style={{ 
                  marginTop: '8px',
                  padding: '4px 8px',
                  background: 'rgba(139, 92, 246, 0.2)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#a78bfa',
                  display: 'inline-block'
                }}>
                  {stats.stories.total > 0 ? ((stats.stories.ai_assisted / stats.stories.total) * 100).toFixed(1) : '0.0'}%
                </div>
              </div>
            </div>
            <div className="stats-content-item">
              <div className="stats-content-icon">📝</div>
              <div className="stats-content-details">
                <div className="stats-content-label">Drafts</div>
                <div className="stats-content-value">{stats.stories.drafts.toLocaleString()}</div>
                <div style={{ 
                  marginTop: '8px',
                  padding: '4px 8px',
                  background: 'rgba(139, 92, 246, 0.2)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#a78bfa',
                  display: 'inline-block'
                }}>
                  {stats.stories.total > 0 ? ((stats.stories.drafts / stats.stories.total) * 100).toFixed(1) : '0.0'}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Activity */}
        <div className="stats-section">
          <div className="stats-section-header">
            <div className="stats-section-icon">
              <Users />
            </div>
            <div className="stats-section-title-wrapper">
              <h3 className="stats-section-title">Social Activity</h3>
              <p className="stats-section-subtitle">User engagement</p>
            </div>
          </div>
          <div className="stats-content-grid">
            <div className="stats-content-item">
              <div className="stats-content-icon">🤝</div>
              <div className="stats-content-details">
                <div className="stats-content-label">Friendships</div>
                <div className="stats-content-value">{stats.social.friendships.toLocaleString()}</div>
              </div>
            </div>
            <div className="stats-content-item">
              <div className="stats-content-icon">💬</div>
              <div className="stats-content-details">
                <div className="stats-content-label">Messages</div>
                <div className="stats-content-value">{stats.social.messages.toLocaleString()}</div>
              </div>
            </div>
            <div className="stats-content-item">
              <div className="stats-content-icon">👨‍👩‍👧</div>
              <div className="stats-content-details">
                <div className="stats-content-label">Parent-Child Links</div>
                <div className="stats-content-value">{stats.relationships.parent_child.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Authors Leaderboard */}
      <div className="leaderboard-wrapper">
        {/* Header */}
        <div className="leaderboard-header">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: '#f59e0b' }}
            >
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="leaderboard-title">Top Authors Leaderboard</h3>
              <p className="leaderboard-subtitle">Most active and engaging authors</p>
            </div>
          </div>
        </div>
        {stats.top_authors && stats.top_authors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="leaderboard-table-header">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider leaderboard-table-th">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider leaderboard-table-th">Author</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider leaderboard-table-th">Stories</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_authors.slice(0, 5).map((author, index) => (
                  <tr 
                    key={author.author__id} 
                    className="leaderboard-table-row"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        {index < 3 && (
                          <span className="text-2xl">
                            {index === 0 && '🥇'}
                            {index === 1 && '🥈'}
                            {index === 2 && '🥉'}
                          </span>
                        )}
                        <span className="text-base font-semibold leaderboard-rank">#{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-lg font-semibold leaderboard-author">{author.author__username}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="leaderboard-story-count">
                        {author.story_count.toLocaleString()} 📚
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="leaderboard-empty-icon">
              <TrendingUp className="w-8 h-8 leaderboard-empty-icon-svg" />
            </div>
            <p className="font-medium leaderboard-empty-text">No authors yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
