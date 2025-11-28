import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Users, LogIn } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { joinSessionByCode } from '../../services/collaborationApi';
import { useNavigate } from 'react-router-dom';
import './CollaborationModal.css';

interface CollaborationModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHostSelected: () => void;
}

const CollaborationModeModal: React.FC<CollaborationModeModalProps> = ({
  isOpen,
  onClose,
  onHostSelected
}) => {
  const { isDarkMode } = useThemeStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'select' | 'join'>('select');
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleHostClick = () => {
    onHostSelected();
    onClose();
  };

  const handleJoinClick = () => {
    setMode('join');
    setError('');
  };

  const handleBack = () => {
    setMode('select');
    setJoinCode('');
    setError('');
  };

  const handleJoinSubmit = async () => {
    if (!joinCode || joinCode.length !== 5) {
      setError('Please enter a valid 5-character code');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const session = await joinSessionByCode(joinCode);
      console.log('✅ Successfully joined session:', session);
      
      // Navigate to manual story creation page with collaboration info
      const storyId = `collab-${session.session_id}`;
      navigate('/create-story-manual', {
        state: {
          sessionId: session.session_id,
          storyId: storyId,
          storyTitle: session.canvas_name || 'Collaborative Story',
          isCollaborative: true,
          isHost: false
        }
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to join session');
    } finally {
      setIsJoining(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isJoining) {
      handleJoinSubmit();
    }
  };

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content collaboration-mode-modal ${isDarkMode ? 'dark' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-content">
            <Users className="modal-icon" />
            <div>
              <h2 className="modal-title">{mode === 'select' ? 'Collaboration Mode' : 'Join Session'}</h2>
              <p className="modal-subtitle">
                {mode === 'select' ? 'Choose how you want to collaborate' : 'Enter the session code'}
              </p>
            </div>
          </div>
          <button className="modal-close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {mode === 'select' ? (
          <div className="modal-body">
            <div className="collaboration-mode-selection">
              <p className="mode-description">
                Choose how you want to collaborate on your story
              </p>

              <div className="mode-options">
                <button className="mode-option-card" onClick={handleHostClick}>
                  <div className="mode-icon host-icon">
                    <Users />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3>Host a Session</h3>
                    <p>Create a new collaboration session and invite friends</p>
                    <span className="mode-badge">Get a join code</span>
                  </div>
                </button>

                <button className="mode-option-card" onClick={handleJoinClick}>
                  <div className="mode-icon join-icon">
                    <LogIn />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3>Join a Session</h3>
                    <p>Enter a 5-character code to join an active session</p>
                    <span className="mode-badge">Enter code</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="modal-body">
            <div className="join-code-form">
              <button className="back-button" onClick={handleBack}>
                ← Back
              </button>

              <p className="join-description">
                Enter the 5-character code shared by the host
              </p>

              <div className="join-code-input-wrapper">
                <input
                  type="text"
                  className="join-code-input"
                  placeholder="ABC12"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 5))}
                  onKeyPress={handleKeyPress}
                  maxLength={5}
                  autoFocus
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button
                className="start-collab-button"
                onClick={handleJoinSubmit}
                disabled={isJoining || joinCode.length !== 5}
              >
                {isJoining ? 'Joining...' : 'Join Session'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default CollaborationModeModal;
