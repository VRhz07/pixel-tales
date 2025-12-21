import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AcademicCapIcon,
  UserGroupIcon,
  BookOpenIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import './ParentBottomNav.css';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { Keyboard } from '@capacitor/keyboard';

const TeacherBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { playSound } = useSoundEffects();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Hide bottom nav when keyboard is visible
  useEffect(() => {
    let showListener: any;
    let hideListener: any;

    const setupListeners = async () => {
      try {
        showListener = await Keyboard.addListener('keyboardWillShow', () => {
          console.log('🔧 Teacher: Keyboard shown - hiding bottom nav to prevent overlap');
          setIsKeyboardVisible(true);
        });

        hideListener = await Keyboard.addListener('keyboardWillHide', () => {
          console.log('🔧 Teacher: Keyboard hidden - showing bottom nav');
          setIsKeyboardVisible(false);
        });
      } catch (error) {
        // Keyboard API not available (web browser)
        console.log('Keyboard API not available');
      }
    };

    setupListeners();

    return () => {
      if (showListener?.remove) {
        showListener.remove();
      }
      if (hideListener?.remove) {
        hideListener.remove();
      }
    };
  }, []);

  const navItems = [
    {
      path: '/teacher-dashboard',
      tab: 'overview',
      icon: AcademicCapIcon,
      label: 'Overview',
      action: () => {
        playSound('tab-switch');
        navigate('/teacher-dashboard', { state: { tab: 'overview' } });
        // Dispatch event to update tab
        window.dispatchEvent(new CustomEvent('teacher-tab-change', { detail: { tab: 'overview' } }));
      }
    },
    {
      path: '/teacher-dashboard',
      tab: 'classes',
      icon: BookOpenIcon,
      label: 'Manage',
      action: () => {
        playSound('tab-switch');
        navigate('/teacher-dashboard', { state: { tab: 'classes' } });
        // Dispatch event to update tab
        window.dispatchEvent(new CustomEvent('teacher-tab-change', { detail: { tab: 'classes' } }));
      }
    },
    {
      path: '/teacher-dashboard',
      tab: 'reports',
      icon: ChartBarIcon,
      label: 'Reports',
      action: () => {
        playSound('tab-switch');
        navigate('/teacher-dashboard', { state: { tab: 'reports' } });
        // Dispatch event to update tab
        window.dispatchEvent(new CustomEvent('teacher-tab-change', { detail: { tab: 'reports' } }));
      }
    },
    {
      path: '/teacher-settings',
      tab: null,
      icon: Cog6ToothIcon,
      label: 'Settings',
      action: () => {
        playSound('button-click');
        navigate('/teacher-settings');
      }
    }
  ];

  return (
    <nav className={`parent-bottom-nav ${isKeyboardVisible ? 'keyboard-visible' : ''}`}>
      <div className="parent-bottom-nav-container">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path && (!item.tab || location.state?.tab === item.tab);
          
          return (
            <button
              key={index}
              onClick={item.action}
              className={`parent-bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="parent-bottom-nav-icon" />
              <span className="parent-bottom-nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TeacherBottomNav;
