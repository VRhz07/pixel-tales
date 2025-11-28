import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CollaborationWaitingScreen from '../components/collaboration/CollaborationWaitingScreen';
import { notificationWebSocket } from '../services/notificationWebSocket';

const CollaborationWaitingPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId, storyTitle, inviterName, isWaiting, isSessionActive } = (location.state as {
    sessionId?: string;
    storyTitle?: string;
    inviterName?: string;
    isWaiting?: boolean;
    isSessionActive?: boolean;
  }) || {};

  useEffect(() => {
    console.log('🔍 CollaborationWaitingPage state:', { sessionId, storyTitle, inviterName, isWaiting, isSessionActive });
    
    // If no valid state, redirect to social page
    if (!sessionId || !isWaiting) {
      console.log('❌ Invalid state, redirecting to social page');
      navigate('/social');
      return;
    }

    // Auto-navigate to story creation with collaboration session
    // If session is already active, participant bypasses lobby and joins directly
    // If session is not active, participant will see lobby and wait for host to start
    const storyId = `collab-${sessionId}`;
    
    console.log('✅ Navigating to story creation with state:', {
      sessionId,
      storyId,
      storyTitle,
      isCollaborative: true,
      bypassLobby: isSessionActive || false
    });
    
    navigate('/create-story-manual', {
      state: {
        sessionId: sessionId,
        storyId: storyId,
        storyTitle: storyTitle,
        isCollaborative: true,
        bypassLobby: isSessionActive || false
      },
      replace: true
    });
  }, [sessionId, storyTitle, isWaiting, isSessionActive, navigate]);

  if (!sessionId || !storyTitle || !inviterName) {
    return null;
  }

  return (
    <CollaborationWaitingScreen
      sessionId={sessionId}
      storyTitle={storyTitle}
      inviterName={inviterName}
    />
  );
};

export default CollaborationWaitingPage;
