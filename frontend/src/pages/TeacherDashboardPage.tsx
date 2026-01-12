import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOpenIcon, 
  UserGroupIcon,
  AcademicCapIcon,
  PlusIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import Logo from '../components/common/Logo';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import TeacherBottomNav from '../components/navigation/TeacherBottomNav';
import ReportsTab from '../components/teacher/ReportsTab';
import StoryViewModal from '../components/parent/StoryViewModal';
import '../styles/dashboard-common.css';
import './TeacherDashboardPage.css';

interface TeacherClass {
  id: number;
  name: string;
  description?: string;
  grade_level?: string;
  subject?: string;
  school_year?: string;
  student_count: number;
  is_active: boolean;
  date_created: string;
}

interface Student {
  id: number;
  username: string;
  display_name: string;
  avatar_emoji: string;
  email: string;
  level: number;
  experience_points: number;
  stories_count: number;
  class_name?: string;
  class_id?: number;
  date_added: string;
  notes?: string;
}

interface DashboardStats {
  total_classes: number;
  total_students: number;
  total_stories: number;
  active_students_today: number;
  total_achievements: number;
  average_stories_per_student: number;
  recent_activities: any[];
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, iconColor }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ backgroundColor: `${iconColor}15`, color: iconColor }}>
        {icon}
      </div>
      <div className="stat-card-content">
        <p className="stat-card-label">{label}</p>
        <h3 className="stat-card-value">{value}</h3>
      </div>
    </div>
  );
};

const TeacherDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const [activeTab, setActiveTab] = useState<string>((location.state as any)?.tab || 'overview');
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string>('');
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<TeacherClass | null>(null);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const classesPerPage = 10;
  const [viewingClass, setViewingClass] = useState<TeacherClass | null>(null);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [studentStories, setStudentStories] = useState<any[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '',
    description: '',
    grade_level: '',
    subject: '',
    school_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Listen for tab changes from bottom nav
  useEffect(() => {
    const handleTabChange = (e: CustomEvent) => {
      setActiveTab(e.detail.tab);
    };
    window.addEventListener('teacher-tab-change' as any, handleTabChange as any);
    return () => {
      window.removeEventListener('teacher-tab-change' as any, handleTabChange as any);
    };
  }, []);

  // Update tab from location state
  useEffect(() => {
    const tab = (location.state as any)?.tab;
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.state]);

  const loadDashboardData = async () => {
    setLoading(true);
    console.log('📊 Loading teacher dashboard data...');
    try {
      const token = localStorage.getItem('access_token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      console.log('🔑 Token:', token ? 'Present' : 'Missing');
      console.log('🌐 Base URL:', baseUrl);

      // Load dashboard stats
      console.log('📈 Fetching dashboard stats...');
      const statsResponse = await fetch(`${baseUrl}/teacher/dashboard-stats/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('📈 Stats response status:', statsResponse.status);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('📈 Stats data:', statsData);
        setStats(statsData);
      } else {
        const errorText = await statsResponse.text();
        console.error('❌ Stats error:', errorText);
      }

      // Load classes (all of them for pagination)
      console.log('📚 Fetching classes...');
      const classesResponse = await fetch(`${baseUrl}/teacher/classes/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('📚 Classes response status:', classesResponse.status);
      if (classesResponse.ok) {
        const classesData = await classesResponse.json();
        console.log('📚 Classes data:', classesData);
        // Handle both array and object responses
        let allClasses = [];
        if (Array.isArray(classesData)) {
          allClasses = classesData;
        } else if (classesData.results) {
          // Paginated response
          allClasses = classesData.results;
        }
        setClasses(allClasses);
        // Calculate total pages
        setTotalPages(Math.ceil(allClasses.length / classesPerPage));
      } else {
        const errorText = await classesResponse.text();
        console.error('❌ Classes error:', errorText);
        setClasses([]); // Set empty array on error
      }

      // Load all students
      const studentsResponse = await fetch(`${baseUrl}/teacher/all-students/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        setAllStudents(studentsData.students || []);
      }
    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      setClasses([]); // Ensure classes is always an array
    } finally {
      setLoading(false);
      console.log('✅ Loading complete');
    }
  };

  const handleCreateClass = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

      const response = await fetch(`${baseUrl}/teacher/classes/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newClass)
      });

      if (response.ok) {
        setShowAddClassModal(false);
        setNewClass({
          name: '',
          description: '',
          grade_level: '',
          subject: '',
          school_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
        });
        loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to create class:', error);
    }
  };

  const handleViewClassDetails = async (cls: TeacherClass) => {
    setViewingClass(cls);
    // Load students for this class
    try {
      const token = localStorage.getItem('access_token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${baseUrl}/teacher/classes/${cls.id}/students/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setClassStudents(data.students || []);
      }
    } catch (error) {
      console.error('Failed to load class students:', error);
      setClassStudents([]);
    }
  };

  const handleAddStudent = async (classId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

      // Load available students
      const response = await fetch(`${baseUrl}/teacher/available-students/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableStudents(data.students);
        const classToAdd = classes.find(c => c.id === classId);
        setSelectedClass(classToAdd || null);
        setShowAddStudentModal(true);
      }
    } catch (error) {
      console.error('Failed to load available students:', error);
    }
  };

  const handleAddStudentToClass = async (studentId: number) => {
    if (!selectedClass) return;

    try {
      const token = localStorage.getItem('access_token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

      const response = await fetch(`${baseUrl}/teacher/classes/${selectedClass.id}/add-student/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ student_id: studentId })
      });

      if (response.ok) {
        setShowAddStudentModal(false);
        setSelectedClass(null);
        setStudentSearchQuery(''); // Clear search query
        loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to add student to class:', error);
    }
  };

  const handleViewStudentStories = async (student: Student) => {
    setViewingStudent(student);
    setLoadingStories(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${baseUrl}/teacher/students/${student.id}/stories/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudentStories(data.stories || []);
      } else {
        console.error('Failed to load student stories');
        setStudentStories([]);
      }
    } catch (error) {
      console.error('Failed to load student stories:', error);
      setStudentStories([]);
    } finally {
      setLoadingStories(false);
    }
  };


  console.log('🎨 Render - Loading:', loading, 'Classes:', classes.length, 'Stats:', stats);
  console.log('🎨 TeacherDashboardPage is rendering with unified BottomNav');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            animation: 'spin 1s linear infinite', 
            borderRadius: '50%', 
            height: '48px', 
            width: '48px', 
            borderBottom: '2px solid #8b5cf6', 
            margin: '0 auto 16px' 
          }}></div>
          <p style={{ color: '#4b5563' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`teacher-dashboard ${isDarkMode ? 'dark' : ''}`}>
      {/* Header */}
      <div className="teacher-top-bar">
        <div className="teacher-top-bar-content">
          <div className="teacher-logo">
            <div className="teacher-logo-icon">
              <AcademicCapIcon style={{ width: '28px', height: '28px' }} />
            </div>
            <span className="teacher-logo-text">Pixel Tales Teacher</span>
          </div>
          <div className="teacher-user-info">
            <div className="teacher-user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'T'}
            </div>
            <div>
              <div className="teacher-user-name">{user?.name || 'Teacher'}</div>
              <div className="teacher-user-role">Teacher Dashboard</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="teacher-main">
        <div className="teacher-container">
          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              color: '#dc2626'
            }}>
              {error}
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <>
              {/* Welcome Section */}
              <div className="teacher-welcome">
                <div className="teacher-welcome-content">
                  <h1 className="teacher-welcome-title">
                    Welcome back, {user?.name?.split(' ')[0] || 'Teacher'}! 👨‍🏫
                  </h1>
                  <p className="teacher-welcome-subtitle">
                    Manage your classes and track your students' progress
                  </p>
                </div>
              </div>

              {/* Enhanced Stats Overview */}
              <div className="teacher-stats-grid">
                <div className="teacher-stat-card">
                  <div className="teacher-stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                    <AcademicCapIcon style={{ width: '28px', height: '28px', color: 'white' }} />
                  </div>
                  <div className="teacher-stat-label">Total Classes</div>
                  <div className="teacher-stat-value">{stats?.total_classes || 0}</div>
                </div>

                <div className="teacher-stat-card">
                  <div className="teacher-stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                    <UserGroupIcon style={{ width: '28px', height: '28px', color: 'white' }} />
                  </div>
                  <div className="teacher-stat-label">Total Students</div>
                  <div className="teacher-stat-value">{stats?.total_students || 0}</div>
                </div>

                <div className="teacher-stat-card">
                  <div className="teacher-stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                    <BookOpenIcon style={{ width: '28px', height: '28px', color: 'white' }} />
                  </div>
                  <div className="teacher-stat-label">Stories Created</div>
                  <div className="teacher-stat-value">{stats?.total_stories || 0}</div>
                </div>

                <div className="teacher-stat-card">
                  <div className="teacher-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                    🎯
                  </div>
                  <div className="teacher-stat-label">Active Today</div>
                  <div className="teacher-stat-value">{stats?.active_students_today || 0}</div>
                </div>
              </div>

              <section className="teacher-section" style={{ marginTop: '32px' }}>
              <div className="teacher-section-header">
                <h2 className="teacher-section-title">📚 All Classes</h2>
                <button
                  onClick={() => setActiveTab('classes')}
                  className="teacher-btn"
                >
                  <PlusIcon style={{ width: '20px', height: '20px' }} />
                  Create Class
                </button>
              </div>

              {classes.length === 0 ? (
                <div className="teacher-empty-state">
                  <div className="teacher-empty-icon">📚</div>
                  <h3 className="teacher-empty-title">No Classes Yet</h3>
                  <p className="teacher-empty-text">
                    Create your first class in the Manage tab
                  </p>
                  <button
                    onClick={() => setActiveTab('classes')}
                    className="teacher-btn"
                  >
                    <PlusIcon style={{ width: '20px', height: '20px' }} />
                    Create First Class
                  </button>
                </div>
              ) : (
                <>
                  <div className="teacher-classes-grid">
                    {classes
                      .slice((currentPage - 1) * classesPerPage, currentPage * classesPerPage)
                      .map((cls) => (
                        <div key={cls.id} className="teacher-class-card">
                          <h3 className="teacher-class-name">{cls.name}</h3>
                          {cls.description && (
                            <p className="teacher-class-info" style={{ marginBottom: '8px' }}>
                              {cls.description}
                            </p>
                          )}
                          {cls.grade_level && (
                            <p className="teacher-class-info">
                              📖 Grade: {cls.grade_level}
                            </p>
                          )}
                          {cls.subject && (
                            <p className="teacher-class-info">
                              📚 Subject: {cls.subject}
                            </p>
                          )}
                          {cls.school_year && (
                            <p className="teacher-class-info">
                              📅 {cls.school_year}
                            </p>
                          )}
                          <div className="teacher-class-students">
                            <UserGroupIcon style={{ width: '16px', height: '16px' }} />
                            {cls.student_count} student{cls.student_count !== 1 ? 's' : ''}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedClass(cls);
                              setActiveTab('students');
                            }}
                            className="teacher-btn"
                            style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }}
                          >
                            View Students
                            <ArrowRightIcon style={{ width: '16px', height: '16px' }} />
                          </button>
                        </div>
                      ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginTop: '32px',
                      padding: '20px',
                      background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                      borderRadius: '12px'
                    }}>
                      <div style={{ 
                        fontSize: '15px', 
                        fontWeight: '600',
                        color: isDarkMode ? '#9ca3af' : '#6b7280'
                      }}>
                        Showing {(currentPage - 1) * classesPerPage + 1}-{Math.min(currentPage * classesPerPage, classes.length)} of {classes.length} classes
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="teacher-btn-secondary"
                          style={{
                            opacity: currentPage === 1 ? 0.5 : 1,
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="teacher-btn"
                          style={{
                            opacity: currentPage === totalPages ? 0.5 : 1,
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
          </section>
            </>
          )}

          {/* Manage Tab - Classes & Students */}
          {activeTab === 'classes' && (
            <>
              {/* Classes Section */}
              <section className="teacher-section">
                <div className="teacher-section-header">
                  <h2 className="teacher-section-title">📚 My Classes</h2>
                  <button
                    onClick={() => setShowAddClassModal(true)}
                    className="teacher-btn"
                  >
                    <PlusIcon style={{ width: '20px', height: '20px' }} />
                    <span>Add Class</span>
                  </button>
                </div>
                {classes.length === 0 ? (
                  <div className="teacher-empty-state">
                    <div className="teacher-empty-icon">📚</div>
                    <h3 className="teacher-empty-title">No Classes Yet</h3>
                    <p className="teacher-empty-text">
                      Create your first class to start managing students
                    </p>
                    <button
                      onClick={() => setShowAddClassModal(true)}
                      className="teacher-btn"
                    >
                      <PlusIcon style={{ width: '20px', height: '20px' }} />
                      Create First Class
                    </button>
                  </div>
                ) : (
                  <div className="teacher-classes-grid">
                    {classes.map((cls) => (
                      <div 
                        key={cls.id} 
                        className="teacher-class-card"
                        onClick={() => handleViewClassDetails(cls)}
                        style={{ cursor: 'pointer' }}
                      >
                        <h3 className="teacher-class-name">{cls.name}</h3>
                        {cls.description && (
                          <p className="teacher-class-info" style={{ marginBottom: '8px' }}>
                            {cls.description}
                          </p>
                        )}
                        {cls.grade_level && (
                          <p className="teacher-class-info">
                            📖 Grade: {cls.grade_level}
                          </p>
                        )}
                        {cls.subject && (
                          <p className="teacher-class-info">
                            📚 Subject: {cls.subject}
                          </p>
                        )}
                        {cls.school_year && (
                          <p className="teacher-class-info">
                            📅 {cls.school_year}
                          </p>
                        )}
                        <div className="teacher-class-students">
                          <UserGroupIcon style={{ width: '16px', height: '16px' }} />
                          {cls.student_count} student{cls.student_count !== 1 ? 's' : ''}
                        </div>
                        <div style={{ marginTop: '16px', fontSize: '14px', color: isDarkMode ? '#9ca3af' : '#6b7280', textAlign: 'center' }}>
                          Click to view details →
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {/* Students Tab - REMOVED, now merged with Classes */}
          {activeTab === 'students' && (
            <section className="parent-section" style={{ marginTop: '24px' }}>
              <div className="parent-section-header">
                <h2 className="parent-section-title">👥 All Students</h2>
              </div>
              <div className="children-grid">
                {allStudents.map((student) => (
                  <div key={student.id} className="child-card">
                    <div className="child-card-header">
                      <div className="child-avatar">
                        <span className="text-4xl">{student.avatar_emoji || '👤'}</span>
                      </div>
                      <div className="child-info">
                        <h4 className="child-name">{student.display_name}</h4>
                        <p className="child-username">{student.class_name || 'No Class'}</p>
                      </div>
                    </div>
                    <div className="child-stats">
                      <div className="stat-item">
                        <BookOpenIcon className="stat-icon" />
                        <span className="stat-value">{student.stories_count}</span>
                        <span className="stat-label">Stories</span>
                      </div>
                    </div>
                  </div>
                ))}
                {allStudents.length === 0 && (
                  <div className="empty-state">
                    <UserGroupIcon className="empty-icon" />
                    <h3 className="empty-title">No Students Yet</h3>
                    <p className="empty-description">
                      Add students to your classes to see them here
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <ReportsTab 
              isDarkMode={isDarkMode}
              onRefresh={loadDashboardData}
            />
          )}
        </div>
      </main>

      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className={isDarkMode ? 'dark' : ''}>
          <div className="modal-overlay" onClick={() => setShowAddClassModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Class</h3>
              <button
                onClick={() => setShowAddClassModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Class Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  placeholder="e.g., Grade 5 English"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={newClass.description}
                  onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                  placeholder="Brief description of the class"
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Grade Level</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newClass.grade_level}
                    onChange={(e) => setNewClass({ ...newClass, grade_level: e.target.value })}
                    placeholder="e.g., Grade 5"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newClass.subject}
                    onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                    placeholder="e.g., English"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">School Year</label>
                <input
                  type="text"
                  className="form-input"
                  value={newClass.school_year}
                  onChange={(e) => setNewClass({ ...newClass, school_year: e.target.value })}
                  placeholder="e.g., 2024-2025"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowAddClassModal(false)}
                className="modal-button secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClass}
                className="modal-button primary"
                disabled={!newClass.name}
              >
                Create Class
              </button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && selectedClass && (
        <div className={isDarkMode ? 'dark' : ''}>
          <div className="modal-overlay" onClick={() => setShowAddStudentModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Student to {selectedClass.name}</h3>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Search Students</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by name..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="students-list">
                {availableStudents.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No available students. All students are already in your classes.
                  </p>
                ) : (
                  availableStudents
                    .filter(student => 
                      studentSearchQuery === '' || 
                      student.display_name.toLowerCase().includes(studentSearchQuery.toLowerCase())
                    )
                    .map((student) => (
                    <div key={student.id} className="student-item">
                      <div className="student-info">
                        <span className="text-2xl mr-3">{student.avatar_emoji}</span>
                        <div>
                          <p className="font-medium">{student.display_name}</p>
                          <p className="text-sm text-gray-500">
                            {student.stories_count} stories
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddStudentToClass(student.id)}
                        className="add-button"
                      >
                        Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="modal-button secondary"
              >
                Close
              </button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Teacher Specific */}
      <TeacherBottomNav />

      {/* Student Stories Modal */}
      {viewingStudent && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
            padding: '20px'
          }}
          onClick={() => {
            setViewingStudent(null);
            setStudentStories([]);
          }}
        >
          <div 
            style={{
              background: isDarkMode ? '#1a1830' : 'white',
              borderRadius: '24px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '32px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setViewingStudent(null);
                setStudentStories([]);
              }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                fontSize: '28px',
                cursor: 'pointer',
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                padding: '8px',
                lineHeight: 1
              }}
            >
              ×
            </button>

            {/* Student Info */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px'
                }}>
                  {viewingStudent.avatar_emoji || '👤'}
                </div>
                <div>
                  <h2 style={{ 
                    fontSize: '28px', 
                    fontWeight: '700', 
                    color: isDarkMode ? 'white' : '#111827',
                    marginBottom: '4px',
                    letterSpacing: '-0.02em'
                  }}>
                    {viewingStudent.display_name}'s Stories
                  </h2>
                  <p style={{ 
                    fontSize: '16px', 
                    color: isDarkMode ? '#9ca3af' : '#6b7280'
                  }}>
                    {viewingStudent.stories_count} {viewingStudent.stories_count === 1 ? 'story' : 'stories'} created
                  </p>
                </div>
              </div>
            </div>

            {/* Stories Grid */}
            <div>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                color: isDarkMode ? 'white' : '#111827',
                marginBottom: '20px'
              }}>
                Published Stories ({studentStories.length})
              </h3>

              {loadingStories ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                  borderRadius: '12px'
                }}>
                  <div style={{ 
                    animation: 'spin 1s linear infinite', 
                    borderRadius: '50%', 
                    height: '48px', 
                    width: '48px', 
                    borderBottom: '2px solid #8b5cf6', 
                    margin: '0 auto 16px' 
                  }}></div>
                  <p style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>Loading stories...</p>
                </div>
              ) : studentStories.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                  borderRadius: '12px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
                  <p style={{ 
                    fontSize: '16px', 
                    color: isDarkMode ? '#9ca3af' : '#6b7280'
                  }}>
                    No published stories yet
                  </p>
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '20px' 
                }}>
                  {studentStories.map((story) => (
                    <div
                      key={story.id}
                      onClick={() => {
                        setSelectedStory(story);
                        setShowStoryModal(true);
                      }}
                      style={{
                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.1)' : '#f3f4f6'}`,
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(139, 92, 246, 0.25)';
                        e.currentTarget.style.borderColor = isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.borderColor = isDarkMode ? 'rgba(139, 92, 246, 0.1)' : '#f3f4f6';
                      }}
                    >
                      {/* Cover Image */}
                      {story.cover_image ? (
                        <div style={{
                          width: '100%',
                          height: '180px',
                          background: `url(${story.cover_image}) center/cover`,
                          backgroundColor: isDarkMode ? '#2d2b40' : '#e5e7eb',
                          position: 'relative'
                        }}>
                          {/* Category Badge */}
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'rgba(139, 92, 246, 0.9)',
                            color: 'white',
                            padding: '4px 10px',
                            borderRadius: '16px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backdropFilter: 'blur(10px)'
                          }}>
                            {story.category}
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '180px',
                          background: isDarkMode 
                            ? 'linear-gradient(135deg, #2d2b40 0%, #1a1830 100%)' 
                            : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '40px'
                        }}>
                          📖
                        </div>
                      )}
                      
                      {/* Story Info */}
                      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h4 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: isDarkMode ? 'white' : '#111827',
                          marginBottom: '10px',
                          lineHeight: '1.3',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: '42px'
                        }}>
                          {story.title}
                        </h4>
                        
                        {/* Stats Row */}
                        <div style={{
                          display: 'flex',
                          gap: '12px',
                          marginBottom: '10px',
                          fontSize: '12px',
                          color: isDarkMode ? '#9ca3af' : '#6b7280'
                        }}>
                          {story.word_count > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <span>✍️</span>
                              <span>{story.word_count}</span>
                            </div>
                          )}
                          {story.likes_count > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <span>❤️</span>
                              <span>{story.likes_count}</span>
                            </div>
                          )}
                          {story.views > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <span>👁️</span>
                              <span>{story.views}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Time Ago */}
                        <div style={{
                          marginTop: 'auto',
                          paddingTop: '10px',
                          borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
                          fontSize: '12px',
                          color: isDarkMode ? '#9ca3af' : '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>🕐</span>
                          <span>{story.time_ago}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Story View Modal - with higher z-index to appear above student stories modal */}
      {selectedStory && (
        <div style={{ position: 'relative', zIndex: 10001 }}>
          <StoryViewModal
            story={selectedStory}
            isOpen={showStoryModal}
            onClose={() => {
              setShowStoryModal(false);
              setSelectedStory(null);
            }}
          />
        </div>
      )}

      {/* Class Details Modal */}
      {viewingClass && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setViewingClass(null)}
        >
          <div 
            style={{
              background: isDarkMode ? '#1a1830' : 'white',
              borderRadius: '24px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '32px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setViewingClass(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                fontSize: '28px',
                cursor: 'pointer',
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                padding: '8px',
                lineHeight: 1
              }}
            >
              ×
            </button>

            {/* Class Details */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: isDarkMode ? 'white' : '#111827',
                marginBottom: '16px',
                letterSpacing: '-0.02em'
              }}>
                {viewingClass.name}
              </h2>
              
              {viewingClass.description && (
                <p style={{ 
                  fontSize: '16px', 
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                  marginBottom: '20px',
                  lineHeight: '1.6'
                }}>
                  {viewingClass.description}
                </p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
                {viewingClass.grade_level && (
                  <div style={{
                    padding: '8px 16px',
                    background: isDarkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#8b5cf6'
                  }}>
                    📖 Grade: {viewingClass.grade_level}
                  </div>
                )}
                {viewingClass.subject && (
                  <div style={{
                    padding: '8px 16px',
                    background: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#3b82f6'
                  }}>
                    📚 Subject: {viewingClass.subject}
                  </div>
                )}
                {viewingClass.school_year && (
                  <div style={{
                    padding: '8px 16px',
                    background: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#10b981'
                  }}>
                    📅 {viewingClass.school_year}
                  </div>
                )}
              </div>
            </div>

            {/* Students List */}
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  color: isDarkMode ? 'white' : '#111827'
                }}>
                  Students ({classStudents.length})
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddStudent(viewingClass.id);
                  }}
                  className="teacher-btn"
                >
                  <PlusIcon style={{ width: '16px', height: '16px' }} />
                  Add Student
                </button>
              </div>

              {classStudents.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                  borderRadius: '12px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
                  <p style={{ 
                    fontSize: '16px', 
                    color: isDarkMode ? '#9ca3af' : '#6b7280'
                  }}>
                    No students in this class yet
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {classStudents.map((student) => (
                    <div
                      key={student.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '50px 1fr auto',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '14px 16px',
                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
                        borderRadius: '12px',
                        border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.15)' : '#e5e7eb'}`,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = isDarkMode ? 'rgba(139, 92, 246, 0.4)' : '#8b5cf6';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = isDarkMode ? 'rgba(139, 92, 246, 0.15)' : '#e5e7eb';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        flexShrink: 0
                      }}>
                        {student.avatar_emoji || '👤'}
                      </div>

                      {/* Student Info */}
                      <div style={{ minWidth: 0 }}>
                        {/* Student Name */}
                        <div style={{ 
                          fontSize: '16px', 
                          fontWeight: '600', 
                          color: isDarkMode ? 'white' : '#111827',
                          marginBottom: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {student.display_name}
                        </div>
                        {/* Story Count */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '13px',
                          color: isDarkMode ? '#9ca3af' : '#6b7280'
                        }}>
                          <BookOpenIcon style={{ width: '14px', height: '14px' }} />
                          <span>{student.stories_count} {student.stories_count === 1 ? 'story' : 'stories'}</span>
                        </div>
                      </div>

                      {/* View Stories Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewStudentStories(student);
                        }}
                        style={{ 
                          padding: '8px 16px',
                          fontSize: '13px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <span>View Stories</span>
                        <ArrowRightIcon style={{ width: '13px', height: '13px' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboardPage;
