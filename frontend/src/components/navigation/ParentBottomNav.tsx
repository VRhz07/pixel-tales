import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UserGroupIcon,
  ChartBarIcon,
  BellIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import './ParentBottomNav.css';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { Keyboard } from '@capacitor/keyboard';

const ParentBottomNav: React.FC = () => {
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
          console.log('🔧 Parent: Keyboard shown - hiding bottom nav to prevent overlap');
          setIsKeyboardVisible(true);
        });

        hideListener = await Keyboard.addListener('keyboardWillHide', () => {
          console.log('🔧 Parent: Keyboard hidden - showing bottom nav');
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
      path: '/parent-dashboard',
      tab: 'overview',
      icon: UserGroupIcon,
      label: 'Overview',
      action: () => {
        playSound('tab-switch');
        navigate('/parent-dashboard', { state: { tab: 'overview' } });
        // Dispatch event to update tab
        window.dispatchEvent(new CustomEvent('parent-tab-change', { detail: { tab: 'overview' } }));
      }
    },
    {
      path: '/parent-dashboard',
      tab: 'analytics',
      icon: ChartBarIcon,
      label: 'Analytics',
      action: () => {
        playSound('tab-switch');
        navigate('/parent-dashboard', { state: { tab: 'analytics' } });
        // Dispatch event to update tab
        window.dispatchEvent(new CustomEvent('parent-tab-change', { detail: { tab: 'analytics' } }));
      }
    },
    {
      path: '/parent-dashboard',
      tab: 'activity',
      icon: BellIcon,
      label: 'Activity',
      action: () => {
        playSound('tab-switch');
        navigate('/parent-dashboard', { state: { tab: 'activity' } });
        // Dispatch event to update tab
        window.dispatchEvent(new CustomEvent('parent-tab-change', { detail: { tab: 'activity' } }));
      }
    },
    {
      path: '/parent-settings',
      tab: null,
      icon: Cog6ToothIcon,
      label: 'Settings',
      action: () => {
        playSound('button-click');
        navigate('/parent-settings');
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

export default ParentBottomNav;
