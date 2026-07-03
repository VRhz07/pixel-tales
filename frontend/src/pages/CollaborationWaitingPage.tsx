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

    const storyId = `collab-${sessionId}`;
    
    // If the session is already active, navigate immediately
    if (isSessionActive) {
      console.log('✅ Session active, navigating directly to story creation');
      navigate('/create-story-manual', {
        state: {
          sessionId: sessionId,
          storyId: storyId,
          pageId: 'page_1',
          storyTitle: storyTitle,
          isCollaborative: true,
          bypassLobby: true
        },
        replace: true
      });
      return;
    }

    // Otherwise, wait for the session start event
    console.log('⏳ Session not active, waiting for start event');
    
    const handleSessionStart = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { session_id, story_title } = customEvent.detail;
      
      if (sessionId === session_id) {
        console.log('✅ Session started event received, navigating to canvas');
        navigate('/create-story-manual', {
          state: {
            sessionId: session_id,
            storyId: storyId,
            pageId: 'page_1',
            storyTitle: story_title || storyTitle,
            isCollaborative: true,
            bypassLobby: true,
            isHost: false
          },
          replace: true
        });
      }
    };

    window.addEventListener('collaboration-session-started', handleSessionStart);
    return () => {
      window.removeEventListener('collaboration-session-started', handleSessionStart);
    };
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
