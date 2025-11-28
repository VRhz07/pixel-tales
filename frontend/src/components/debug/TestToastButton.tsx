import React from 'react';
import { useToastContext } from '../../contexts/ToastContext';

const TestToastButton: React.FC = () => {
  const { showOnlineToast, showOfflineToast, showInviteToast, showSuccessToast } = useToastContext();

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      background: 'white',
      padding: '16px',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>Test Toasts</h4>
      <button
        onClick={() => showOnlineToast('John Smith', '👤')}
        style={{
          padding: '8px 12px',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Test Online
      </button>
      <button
        onClick={() => showOfflineToast('Emma Wilson', '👤')}
        style={{
          padding: '8px 12px',
          background: '#6b7280',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Test Offline
      </button>
      <button
        onClick={() => showInviteToast('Sarah Lee', 'My Amazing Story', () => alert('Clicked!'))}
        style={{
          padding: '8px 12px',
          background: '#8b5cf6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Test Invite
      </button>
      <button
        onClick={() => showSuccessToast('Success!', 'Everything works!')}
        style={{
          padding: '8px 12px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Test Success
      </button>
    </div>
  );
};

export default TestToastButton;
