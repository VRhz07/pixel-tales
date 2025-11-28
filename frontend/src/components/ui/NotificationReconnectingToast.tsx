import React from 'react';
import './NotificationReconnectingToast.css';

interface NotificationReconnectingToastProps {
  isReconnecting: boolean;
  reconnectAttempt: number;
}

const NotificationReconnectingToast: React.FC<NotificationReconnectingToastProps> = ({
  isReconnecting,
  reconnectAttempt
}) => {
  if (!isReconnecting) return null;

  return (
    <div className="notification-reconnecting-toast">
      <div className="notification-reconnecting-content">
        <div className="notification-reconnecting-spinner">
          <div className="spinner-small"></div>
        </div>
        <div className="notification-reconnecting-text">
          <span className="notification-reconnecting-title">Reconnecting to notifications...</span>
          {reconnectAttempt > 1 && (
            <span className="notification-reconnecting-attempt">Attempt {reconnectAttempt}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationReconnectingToast;
