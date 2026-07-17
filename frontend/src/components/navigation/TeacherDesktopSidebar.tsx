import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import Logo from '../common/Logo';
import {
  AcademicCapIcon,
  BookOpenIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const NAV_ITEMS = [
  {
    path: '/teacher-dashboard',
    tab: 'overview',
    icon: AcademicCapIcon,
    label: 'Overview',
    color: '#8b5cf6',
  },
  {
    path: '/teacher-dashboard',
    tab: 'classes',
    icon: BookOpenIcon,
    label: 'Manage',
    color: '#ec4899',
  },
  {
    path: '/teacher-dashboard',
    tab: 'reports',
    icon: ChartBarIcon,
    label: 'Reports',
    color: '#3b82f6',
  },
  {
    path: '/teacher-settings',
    tab: null,
    icon: Cog6ToothIcon,
    label: 'Settings',
    color: '#64748b',
  },
];

const TeacherDesktopSidebar = () => {
  const location = useLocation();
  const { playSound } = useSoundEffects();

  return (
    <aside className="pt-sidebar">
      {/* ── Brand ───────────────────────────────── */}
      <div className="pt-sidebar-brand">
        <div className="pt-sidebar-logo-wrap">
          <Logo width="38px" height="38px" style={{ display: 'block' }} />
        </div>
        <div className="pt-sidebar-brand-text">
          <span className="pt-sidebar-brand-name">pixeltales</span>
          <span className="pt-sidebar-brand-tagline">Teacher Dashboard</span>
        </div>
      </div>

      {/* ── Nav items ───────────────────────────── */}
      <nav className="pt-sidebar-nav" aria-label="Primary navigation">
        {NAV_ITEMS.map((item, index) => {
          const isActive = location.pathname === item.path && (!item.tab || location.state?.tab === item.tab);
          const Icon = item.icon;
          
          return (
            <Link
              key={index}
              to={item.path}
              state={{ tab: item.tab }}
              onClick={() => {
                playSound('tab-switch');
                if (item.tab) {
                  window.dispatchEvent(new CustomEvent('teacher-tab-change', { detail: { tab: item.tab } }));
                }
              }}
              className={`pt-sidebar-item${isActive ? ' pt-sidebar-item--active' : ''}`}
              style={{ '--item-color': item.color } as React.CSSProperties}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="pt-sidebar-item-icon">
                <Icon
                  style={{ width: 22, height: 22, color: isActive ? '#ffffff' : item.color }}
                />
              </span>
              <span className="pt-sidebar-item-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ───────────────────── */}
      <div className="pt-sidebar-footer">
        <div className="pt-sidebar-streak-card" style={{ background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', borderColor: '#86efac' }}>
          <div className="pt-sidebar-streak-row">
            <span className="pt-sidebar-streak-emoji">👩‍🏫</span>
            <div>
              <p className="pt-sidebar-streak-title" style={{ color: '#166534' }}>Classroom</p>
              <p className="pt-sidebar-streak-desc" style={{ color: '#15803d' }}>Inspire your students</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default TeacherDesktopSidebar;
