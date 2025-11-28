import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, UserIcon, BellIcon } from '@heroicons/react/24/outline';

export interface Toast {
  id: string;
  type: 'online' | 'offline' | 'invite' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  duration?: number;
  avatar?: string;
  onAction?: () => void;
  actionLabel?: string;
}

interface ToastNotificationProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onClose }) => {
  
  useEffect(() => {
    console.log('🍞 ToastNotification rendered with toasts:', toasts.length, toasts);
  }, [toasts]);
  
  const getToastStyle = (type: Toast['type']) => {
    switch (type) {
      case 'online':
        return {
          gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          icon: '🟢',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600'
        };
      case 'offline':
        return {
          gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
          icon: '⚫',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600'
        };
      case 'invite':
        return {
          gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          icon: '🎨',
          iconBg: 'bg-purple-100',
          iconColor: 'text-purple-600'
        };
      case 'success':
        return {
          gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          icon: '✓',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600'
        };
      case 'error':
        return {
          gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          icon: '✕',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600'
        };
      default:
        return {
          gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          icon: 'ℹ',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600'
        };
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none'
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const style = getToastStyle(toast.type);
          
          return (
            <motion.div
              key={toast.id}
              initial={{ x: 400, opacity: 0, scale: 0.8 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 400, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 200, damping: 20 }}
              style={{
                pointerEvents: 'auto',
                width: '320px',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                overflow: 'hidden'
              }}
            >
              {/* Gradient Header Bar */}
              <div 
                style={{ 
                  height: '6px',
                  width: '100%',
                  background: style.gradient 
                }}
              />
              
              {/* Content */}
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  {/* Icon/Avatar */}
                  <div style={{
                    flexShrink: 0,
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    backgroundColor: style.iconBg === 'bg-green-100' ? '#dcfce7' :
                                     style.iconBg === 'bg-gray-100' ? '#f3f4f6' :
                                     style.iconBg === 'bg-purple-100' ? '#f3e8ff' :
                                     style.iconBg === 'bg-red-100' ? '#fee2e2' : '#dbeafe'
                  }}>
                    {toast.avatar ? (
                      <span style={{ fontSize: '24px' }}>{toast.avatar}</span>
                    ) : (
                      <span>{style.icon}</span>
                    )}
                  </div>
                  
                  {/* Text Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold', 
                      color: '#111827', 
                      marginBottom: '2px',
                      margin: 0
                    }}>
                      {toast.title}
                    </h4>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#4b5563',
                      margin: 0
                    }}>
                      {toast.message}
                    </p>
                    
                    {/* Action Button */}
                    {toast.onAction && toast.actionLabel && (
                      <button
                        onClick={toast.onAction}
                        style={{
                          marginTop: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          background: style.gradient,
                          color: 'white',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                        }}
                      >
                        {toast.actionLabel}
                      </button>
                    )}
                  </div>
                  
                  {/* Close Button */}
                  <button
                    onClick={() => onClose(toast.id)}
                    style={{
                      flexShrink: 0,
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <XMarkIcon style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ToastNotification;
