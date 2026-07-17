import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import Logo from '../common/Logo';
import {
  UserGroupIcon,
  ChartBarIcon,
  BellIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const NAV_ITEMS = [
  {
    path: '/parent-dashboard',
    tab: 'overview',
    icon: UserGroupIcon,
    label: 'Overview',
    color: '#8b5cf6',
  },
  {
    path: '/parent-dashboard',
    tab: 'analytics',
    icon: ChartBarIcon,
    label: 'Analytics',
    color: '#ec4899',
  },
  {
    path: '/parent-dashboard',
    tab: 'activity',
    icon: BellIcon,
    label: 'Activity',
    color: '#3b82f6',
  },
  {
    path: '/parent-settings',
    tab: null,
    icon: Cog6ToothIcon,
    label: 'Settings',
    color: '#64748b',
  },
];

const ParentDesktopSidebar = () => {
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
          <span className="pt-sidebar-brand-tagline">Parent Dashboard</span>
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
                  window.dispatchEvent(new CustomEvent('parent-tab-change', { detail: { tab: item.tab } }));
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
        <div className="pt-sidebar-streak-card" style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', borderColor: '#a5b4fc' }}>
          <div className="pt-sidebar-streak-row">
            <span className="pt-sidebar-streak-emoji">👨‍👩‍👧‍👦</span>
            <div>
              <p className="pt-sidebar-streak-title" style={{ color: '#4338ca' }}>Family Hub</p>
              <p className="pt-sidebar-streak-desc" style={{ color: '#4f46e5' }}>Manage your children</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ParentDesktopSidebar;
