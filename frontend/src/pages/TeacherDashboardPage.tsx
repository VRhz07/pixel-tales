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
import './ParentDashboardPage.css';

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
  const [loading, setLoading] = useState(true);
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

      // Load classes
      console.log('📚 Fetching classes...');
      const classesResponse = await fetch(`${baseUrl}/teacher/classes/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('📚 Classes response status:', classesResponse.status);
      if (classesResponse.ok) {
        const classesData = await classesResponse.json();
        console.log('📚 Classes data:', classesData);
        // Handle both array and object responses
        if (Array.isArray(classesData)) {
          setClasses(classesData);
        } else if (classesData.results) {
          // Paginated response
          setClasses(classesData.results);
        } else {
          // Empty or unexpected format
          setClasses([]);
        }
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
        loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to add student to class:', error);
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
    <div className="parent-dashboard">
      {/* Header */}
      <div className="parent-top-bar">
        <div className="parent-top-bar-content">
          <div className="parent-nav-logo">
            <div style={{ width: '32px', height: '32px' }}>
              <Logo size="sm" showText={false} />
            </div>
            <span className="parent-logo-text">Pixel Tales</span>
          </div>
          <div className="parent-nav-actions">
            {/* Settings removed - access via bottom nav */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="parent-main">
        <div className="parent-container">
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

          {/* Header */}
          <header className="parent-header">
            <div>
              <h1 className="parent-title">Welcome back, {user?.name || 'Teacher'}! 👨‍🏫</h1>
              <p className="parent-subtitle">
                Manage your classes and track your students' progress
              </p>
            </div>
          </header>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Overview */}
              <section className="teacher-stats-grid">
                <StatCard
                  icon={<AcademicCapIcon className="w-6 h-6" />}
                  label="Total Classes"
                  value={stats?.total_classes || 0}
                  iconColor="#8b5cf6"
                />
                <StatCard
                  icon={<UserGroupIcon className="w-6 h-6" />}
                  label="Total Students"
                  value={stats?.total_students || 0}
                  iconColor="#3b82f6"
                />
                <StatCard
                  icon={<BookOpenIcon className="w-6 h-6" />}
                  label="Stories Created"
                  value={stats?.total_stories || 0}
                  iconColor="#10b981"
                />
              </section>

              <section className="parent-section" style={{ marginTop: '24px' }}>
              <div className="parent-section-header">
                <h2 className="parent-section-title">📚 All Classes Created by {user?.name || 'Teacher'}</h2>
              </div>

              {classes.length === 0 ? (
                <div className="empty-state">
                  <AcademicCapIcon className="empty-icon" />
                  <h3 className="empty-title">No Classes Yet</h3>
                  <p className="empty-description">
                    Create your first class in the Manage tab
                  </p>
                </div>
              ) : (
                <div className="teacher-classes-list">
                  {classes.map((cls) => (
                    <div key={cls.id} className="teacher-class-item">
                      <span className="teacher-class-emoji">📚</span>
                      <div className="teacher-class-info">
                        <h4 className="teacher-class-name">{cls.name}</h4>
                        <p className="teacher-class-details">
                          {cls.grade_level && `${cls.grade_level} • `}
                          {cls.subject} • {cls.student_count} student{cls.student_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </section>
            </>
          )}

          {/* Manage Tab - Classes & Students */}
          {activeTab === 'classes' && (
            <>
              {/* Classes Section */}
              <section className="parent-section" style={{ marginTop: '24px' }}>
                <div className="parent-section-header">
                  <h2 className="parent-section-title">📚 Classes</h2>
                  <button
                    onClick={() => setShowAddClassModal(true)}
                    className="parent-button-primary"
                  >
                    <PlusIcon className="w-5 h-5" />
                    <span>Add Class</span>
                  </button>
                </div>
                <div className="children-grid">
                  {classes.map((cls) => (
                    <div key={cls.id} className="child-card">
                      <div className="child-card-header">
                        <div className="child-avatar">
                          <span className="text-4xl">📚</span>
                        </div>
                        <div className="child-info">
                          <h4 className="child-name">{cls.name}</h4>
                          <p className="child-username">
                            {cls.grade_level && `${cls.grade_level} • `}
                            {cls.subject}
                          </p>
                        </div>
                      </div>
                      <div className="child-stats">
                        <div className="stat-item">
                          <UserGroupIcon className="stat-icon" />
                          <span className="stat-value">{cls.student_count}</span>
                          <span className="stat-label">Students</span>
                        </div>
                      </div>
                      <div className="child-actions">
                        <button
                          onClick={() => handleAddStudent(cls.id)}
                          className="action-button primary"
                        >
                          <PlusIcon className="w-4 h-4" />
                          Add Student
                        </button>
                      </div>
                    </div>
                  ))}
                  {classes.length === 0 && (
                    <div className="empty-state">
                      <AcademicCapIcon className="empty-icon" />
                      <h3 className="empty-title">No Classes Yet</h3>
                      <p className="empty-description">
                        Create your first class to start managing students
                      </p>
                      <button
                        onClick={() => setShowAddClassModal(true)}
                        className="parent-button-primary"
                        style={{ marginTop: '16px' }}
                      >
                        <PlusIcon className="w-5 h-5" />
                        Create First Class
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* Students Section */}
              <section className="parent-section" style={{ marginTop: '24px' }}>
                <div className="parent-section-header">
                  <h2 className="parent-section-title">👥 Students</h2>
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
                        <div className="stat-item">
                          <ChartBarIcon className="stat-icon" />
                          <span className="stat-value">Lvl {student.level}</span>
                          <span className="stat-label">Level</span>
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
                      <div className="stat-item">
                        <ChartBarIcon className="stat-icon" />
                        <span className="stat-value">Lvl {student.level}</span>
                        <span className="stat-label">Level</span>
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
            <section className="parent-section" style={{ marginTop: '24px' }}>
              <div className="parent-section-header">
                <h2 className="parent-section-title">📈 Reports & Analytics</h2>
              </div>
              <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f3f4f6', borderRadius: '12px' }}>
                <ChartBarIcon style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: '#9ca3af' }} />
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
                  Reports Coming Soon
                </h3>
                <p style={{ color: '#6b7280' }}>
                  Detailed analytics and reports for student progress will be available here
                </p>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Add Class Modal */}
      {showAddClassModal && (
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
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && selectedClass && (
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
              <div className="students-list">
                {availableStudents.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No available students. All students are already in your classes.
                  </p>
                ) : (
                  availableStudents.map((student) => (
                    <div key={student.id} className="student-item">
                      <div className="student-info">
                        <span className="text-2xl mr-3">{student.avatar_emoji}</span>
                        <div>
                          <p className="font-medium">{student.display_name}</p>
                          <p className="text-sm text-gray-500">
                            Level {student.level} • {student.stories_count} stories
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
      )}

      {/* Bottom Navigation - Teacher Specific */}
      <TeacherBottomNav />
    </div>
  );
};

export default TeacherDashboardPage;
