import React from 'react';
import './ReconnectingModal.css';

interface ReconnectingModalProps {
  isReconnecting: boolean;
  reconnectAttempt: number;
  maxAttempts: number;
  onCancel?: () => void;
  onRetry?: () => void;
}

const ReconnectingModal: React.FC<ReconnectingModalProps> = ({
  isReconnecting,
  reconnectAttempt,
  maxAttempts,
  onCancel,
  onRetry
}) => {
  if (!isReconnecting) return null;

  return (
    <div className="reconnecting-modal-overlay">
      <div className="reconnecting-modal">
        <div className="reconnecting-spinner">
          <div className="spinner"></div>
        </div>
        
        <h2 className="reconnecting-title">Reconnecting...</h2>
        
        <div className="reconnecting-progress">
          <div className="reconnecting-attempts">
            Attempt {reconnectAttempt} of {maxAttempts}
          </div>
          <div className="reconnecting-progress-bar">
            <div 
              className="reconnecting-progress-fill"
              style={{ width: `${(reconnectAttempt / maxAttempts) * 100}%` }}
            />
          </div>
        </div>

        <div className="reconnecting-actions">
          {onRetry && (
            <button 
              className="reconnecting-retry-btn"
              onClick={onRetry}
            >
              Retry Now
            </button>
          )}
          {onCancel && (
            <button 
              className="reconnecting-cancel-btn"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReconnectingModal;
