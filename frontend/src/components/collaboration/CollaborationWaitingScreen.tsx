import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline';

interface CollaborationWaitingScreenProps {
  sessionId: string;
  storyTitle: string;
  inviterName: string;
}

const CollaborationWaitingScreen: React.FC<CollaborationWaitingScreenProps> = ({
  sessionId,
  storyTitle,
  inviterName
}) => {
  const [dots, setDots] = useState('');

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          background: 'white',
          borderRadius: '24px',
          padding: '48px 32px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Animated Icon */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            width: '96px',
            height: '96px',
            margin: '0 auto 24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <UserGroupIcon style={{ width: '48px', height: '48px', color: 'white' }} />
        </motion.div>

        {/* Title */}
        <h2 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '12px'
        }}>
          Waiting for {inviterName}
        </h2>

        {/* Story Title */}
        <p style={{
          fontSize: '18px',
          color: '#6b7280',
          marginBottom: '24px',
          fontWeight: '500'
        }}>
          "{storyTitle}"
        </p>

        {/* Loading Animation */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '24px'
        }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -12, 0],
                backgroundColor: ['#667eea', '#764ba2', '#667eea']
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#667eea'
              }}
            />
          ))}
        </div>

        {/* Message */}
        <p style={{
          fontSize: '16px',
          color: '#9ca3af',
          marginBottom: '8px',
          minHeight: '24px'
        }}>
          Waiting for host to start collaboration{dots}
        </p>

        {/* Info Box */}
        <div style={{
          marginTop: '32px',
          padding: '16px',
          background: '#f3f4f6',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textAlign: 'left'
        }}>
          <ClockIcon style={{ width: '24px', height: '24px', color: '#6b7280', flexShrink: 0 }} />
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: 0
          }}>
            The host will start the collaboration session soon. You'll be redirected automatically when they begin.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default CollaborationWaitingScreen;
