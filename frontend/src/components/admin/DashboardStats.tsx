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

      {/* Stats Grid - Redesigned to match User Type Distribution */}
      <div className="stats-grid">
        <div className="stats-content-item">
          <div className="stats-content-icon">👥</div>
          <div className="stats-content-details">
            <div className="stats-content-label">Total Users</div>
            <div className="stats-content-value">{stats.users.total.toLocaleString()}</div>
            <div className="stats-content-badge positive">
              +{stats.users.last_7_days} this week
            </div>
          </div>
        </div>

        <div className="stats-content-item">
          <div className="stats-content-icon">📚</div>
          <div className="stats-content-details">
            <div className="stats-content-label">Total Stories</div>
            <div className="stats-content-value">{stats.stories.total.toLocaleString()}</div>
            <div className="stats-content-badge">
              {stats.stories.published} published
            </div>
          </div>
        </div>

        <div className="stats-content-item">
          <div className="stats-content-icon">📈</div>
          <div className="stats-content-details">
            <div className="stats-content-label">Engagement</div>
            <div className="stats-content-value">{stats.engagement.total_likes.toLocaleString()}</div>
            <div className="stats-content-badge">
              {stats.engagement.total_comments} comments
            </div>
          </div>
        </div>

        <div className="stats-content-item">
          <div className="stats-content-icon">⚠️</div>
          <div className="stats-content-details">
            <div className="stats-content-label">Flagged Content</div>
            <div className="stats-content-value">{(stats.moderation.flagged_stories + stats.moderation.flagged_comments).toLocaleString()}</div>
            <div className="stats-content-badge">
              {stats.moderation.flagged_users} users
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
