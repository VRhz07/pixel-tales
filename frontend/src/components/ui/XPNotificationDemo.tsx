import React, { useState } from 'react';
import { useToastContext } from '../../contexts/ToastContext';

/**
 * Demo component to test XP and Level Up notifications
 * This can be added to any page for testing purposes
 */
const XPNotificationDemo: React.FC = () => {
  const { showXPGain, showLevelUp } = useToastContext();
  const [isOpen, setIsOpen] = useState(false);

  const testXPGain = (amount: number, action?: string) => {
    showXPGain(amount, action);
  };

  const testLevelUp = () => {
    showLevelUp(
      5, // New level
      [ // Unlocked items
        {
          type: 'avatar',
          name: 'Cool Wizard',
          emoji: '🧙‍♂️'
        },
        {
          type: 'border',
          name: 'Rainbow Border',
          emoji: '🌈',
          gradient: 'from-red-500 via-yellow-500 to-purple-500'
        },
        {
          type: 'avatar',
          name: 'Super Star',
          emoji: '⭐'
        }
      ],
      2500 // Total XP
    );
  };

  console.log('XPNotificationDemo rendering, isOpen:', isOpen);
  
  return (
    <>
      {/* Floating toggle button - always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-4 bg-purple-600 text-white rounded-full w-14 h-14 shadow-2xl hover:bg-purple-700 transition-all flex items-center justify-center"
        style={{ 
          zIndex: 999999,
          pointerEvents: 'auto',
          border: '3px solid white'
        }}
        title="Toggle XP Demo Controls"
      >
        <span className="text-2xl">🧪</span>
      </button>

      {/* Demo panel - toggle visibility */}
      {isOpen && (
        <div 
          className="fixed bottom-44 right-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 border-4 border-purple-500"
          style={{ 
            zIndex: 999999,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
            minWidth: '200px',
            pointerEvents: 'auto'
          }}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">
              🧪 XP Demo Controls
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => testXPGain(10, 'story_created')}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition"
            >
              +10 XP (Story Created)
            </button>
            <button
              onClick={() => testXPGain(50, 'story_published')}
              className="px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition"
            >
              +50 XP (Story Published)
            </button>
            <button
              onClick={() => testXPGain(25, 'collaboration_completed')}
              className="px-3 py-2 bg-purple-500 text-white rounded-lg text-xs font-semibold hover:bg-purple-600 transition"
            >
              +25 XP (Collaboration)
            </button>
            <button
              onClick={testLevelUp}
              className="px-3 py-2 bg-gradient-to-r from-yellow-500 to-pink-500 text-white rounded-lg text-xs font-bold hover:from-yellow-600 hover:to-pink-600 transition"
            >
              🎉 Trigger Level Up!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default XPNotificationDemo;
